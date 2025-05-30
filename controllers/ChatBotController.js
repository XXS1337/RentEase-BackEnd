const { OpenAI } = require('openai');
const Flat = require('../models/FlatModel');
const logger = require('../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /ai/chatbot
exports.handleChat = async (req, res) => {
  const { prompt } = req.body;

  // Validate prompt input
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ status: 'failed', message: 'Prompt must be a valid string.' });
  }

  // Special greeting response
  if (/^\s*(hello|salut|buna)\s*$/i.test(prompt)) {
    return res.status(200).json({
      status: 'success',
      message: 'Hello! How can I assist you with your apartment search today?',
      links: [],
      filters: {},
    });
  }

  // Help message response
  if (/\b(ajutor|help|instructions)\b/i.test(prompt)) {
    return res.status(200).json({
      status: 'success',
      message:
        'You can ask things like:\n- Cheapest flat in Bucharest\n- Cel mai mare apartament din Iași\n- Flats between 300 and 600 euro\n- Apartamente cu aer condiționat în Cluj\n- Smallest flat available in Constanța\n\nYou can also combine filters like price, area and AC.',
      links: [],
      filters: {},
    });
  }

  // Joke response (EN + RO)
  if (/\b(joke|glum[aă]|funny|amuzant)\b/i.test(prompt)) {
    return res.status(200).json({
      status: 'success',
      message: "Why don't real estate agents trust stairs? Because they're always up to something!",
      links: [],
      filters: {},
    });
  }

  // Random flat request (EN + RO)
  if (/\b(random|surprinde-ma|surprise me)\b/i.test(prompt)) {
    try {
      const randomFlat = await Flat.aggregate([{ $sample: { size: 1 } }]);
      if (!randomFlat.length) {
        return res.status(200).json({
          status: 'success',
          message: 'No flats available to surprise you with right now.',
          links: [],
          filters: {},
        });
      }
      const link = `http://localhost:5173/flats/view/${randomFlat[0]._id}`;
      return res.status(200).json({
        status: 'success',
        message: 'Here is a random flat suggestion for you! 🎲',
        links: [link],
        filters: {},
      });
    } catch (error) {
      logger.error(`Random flat error: ${error.message}`);
      return res.status(500).json({ status: 'failed', message: 'Failed to fetch random flat.' });
    }
  }

  // Appreciation/thank you response
  if (/\b(mul[țt]umesc|thank you|thanks)\b/i.test(prompt)) {
    return res.status(200).json({
      status: 'success',
      message: "You're very welcome! 😊 Let me know if you'd like help with anything else.",
      links: [],
      filters: {},
    });
  }

  // Recommend something in a city (RO + EN)
  const cityMatch = prompt.match(/\b(?:recomand[ăa]-mi ceva (?:în|in)|recommend me something in)\s+([a-zA-ZăâîșțĂÂÎȘȚ\s]+)/i);
  if (cityMatch) {
    const cityName = cityMatch[1].trim();
    try {
      const flat = await Flat.aggregate([{ $match: { city: new RegExp(`^${cityName}$`, 'i') } }, { $sample: { size: 1 } }]);

      if (!flat.length) {
        return res.status(200).json({
          status: 'success',
          message: `No flats found in ${cityName}.`,
          links: [],
          filters: {},
        });
      }

      const link = `http://localhost:5173/flats/view/${flat[0]._id}`;
      return res.status(200).json({
        status: 'success',
        message: `Here is a suggestion from ${cityName}:`,
        links: [link],
        filters: { city: cityName },
      });
    } catch (err) {
      logger.error(`Recommendation error: ${err.message}`);
      return res.status(500).json({
        status: 'failed',
        message: 'Failed to recommend a flat in the specified city.',
      });
    }
  }

  // Determine sortOption based on multilingual keywords in the prompt
  const sortOption = (() => {
    if (/cheapest|lowest price|lowest rent|cel mai ieftin/i.test(prompt)) return { rentPrice: 1 };
    if (/most expensive|highest price|highest rent|cel mai scump/i.test(prompt)) return { rentPrice: -1 };
    if (/largest|biggest|most space|cel mai mare|cel mai spatios/i.test(prompt)) return { areaSize: -1 };
    if (/smallest|least space|small flat|cel mai mic/i.test(prompt)) return { areaSize: 1 };
    return null;
  })();

  try {
    // 1. Generate filters using OpenAI
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an assistant that extracts apartment search filters from Romanian user prompts. Always return a JSON object with possible filters: city, minPrice, maxPrice, minArea, maxArea, hasAC.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    });

    const responseText = chatResponse.choices?.[0]?.message?.content || '';
    const jsonMatch = responseText.match(/```json([\s\S]*?)```/) || responseText.match(/{[\s\S]*}/);

    if (!jsonMatch) {
      return res.status(200).json({
        status: 'success',
        message: 'No filters could be extracted from your prompt.',
        filters: {},
      });
    }

    const filters = JSON.parse(jsonMatch[1] || jsonMatch[0]);

    // 2. Remove empty or undefined filters
    const cleaned = {};
    for (const key in filters) {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = value;
      }
    }

    // If no valid filters were extracted, respond with fallback
    if (Object.keys(cleaned).length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'Sorry, I could not understand your request. Please rephrase it or try asking for help.',
        filters: {},
        links: [],
      });
    }

    // 3. Convert cleaned filters into MongoDB query
    const query = {};
    if (cleaned.city) query.city = new RegExp(cleaned.city, 'i');
    if (cleaned.hasAC !== undefined) query.hasAC = cleaned.hasAC;
    if (cleaned.minPrice || cleaned.maxPrice) {
      query.rentPrice = {};
      if (cleaned.minPrice) query.rentPrice.$gte = cleaned.minPrice;
      if (cleaned.maxPrice) query.rentPrice.$lte = cleaned.maxPrice;
    }
    if (cleaned.minArea || cleaned.maxArea) {
      query.areaSize = {};
      if (cleaned.minArea) query.areaSize.$gte = cleaned.minArea;
      if (cleaned.maxArea) query.areaSize.$lte = cleaned.maxArea;
    }

    // 4. Search flats based on query and sorting
    const limit = sortOption ? 1 : 3;
    const flats = await Flat.find(query)
      .sort(sortOption || {})
      .limit(limit);

    if (flats.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No flats matched your search criteria.',
        filters: cleaned,
        links: [],
      });
    }

    // 5. Generate frontend view links
    const links = flats.map((flat) => `http://localhost:5173/flats/view/${flat._id}`);

    return res.status(200).json({
      status: 'success',
      filters: cleaned,
      links,
      message: '',
    });
  } catch (error) {
    logger.error(`ChatBot error: ${error.message}`);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while processing your request.',
    });
  }
};
