const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/UserRoutes');
const flatRoutes = require('./routes/FlatRoutes');
const messageRoutes = require('./routes/MessageRoutes');

const app = express();

// Configure CORS to only allow requests from my frontend
const allowedOrigins = [process.env.ALLOWED_ORIGIN_1, process.env.ALLOWED_ORIGIN_2];
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

dotenv.config();
const port = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log('Connected to MongoDB ✅'))
  .catch((error) => console.log('❌ Failed to connect to MongoDB ❌:', error));

app.use('/users', userRoutes);
app.use('/flats', flatRoutes);
app.use('/flats', messageRoutes);

app.all('*', (req, res) => {
  return res.status(404).json({ status: 'failed', message: `Can't find ${req.originalUrl} on the server!` });
});

app.listen(port, () => {
  console.log(`Server running on port ${port} ✅`);
});
