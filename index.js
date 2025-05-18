const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/UserRoutes');
const flatRoutes = require('./routes/FlatRoutes');
const messageRoutes = require('./routes/MessageRoutes');
const logger = require('./utils/logger'); // 🔹 Importăm loggerul

const app = express();

// Configure CORS to only allow requests from allowed origins
dotenv.config();
const allowedOrigins = [process.env.ALLOWED_ORIGIN_1, process.env.ALLOWED_ORIGIN_2];
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

const port = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => logger.info('Connected to MongoDB ✅')) // 🔹 Logging success
  .catch((error) => logger.error(`❌ Failed to connect to MongoDB: ${error.message}`)); // 🔹 Logging error

app.use('/users', userRoutes);
app.use('/flats', flatRoutes);
app.use('/flats', messageRoutes);

app.all('*', (req, res) => {
  logger.warn(`Route not found: ${req.originalUrl}`); // 🔹 Log rute 404
  return res.status(404).json({ status: 'failed', message: `Can't find ${req.originalUrl} on the server!` });
});

app.listen(port, () => {
  logger.info(`Server running on port ${port} ✅`);
});
