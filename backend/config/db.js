// backend/config/db.js
const mongoose = require('mongoose');

// Get MongoDB connection details from environment variables
const MONGO_USER = process.env.MONGO_USER || '';
const MONGO_PASS = process.env.MONGO_PASS || '';
const MONGO_URL = process.env.MONGO_URL || 'localhost:27017';
const DATABASE = process.env.DB_NAME || 'wfsimdb';

async function connectDB() {
  try {
    // Construct MongoDB connection string - with or without authentication
    let MONGODB_URI;

    if (MONGO_USER && MONGO_PASS) {
      // Use authentication if credentials are provided
      MONGODB_URI = `mongodb://${encodeURIComponent(MONGO_USER)}:${encodeURIComponent(MONGO_PASS)}@${MONGO_URL}/${DATABASE}?authSource=admin`;
    } else {
      // Connect without authentication if no credentials
      MONGODB_URI = `mongodb://${MONGO_URL}/${DATABASE}`;
    }
    console.log(MONGODB_URI);
    // Log the connection URI (without exposing credentials)
    console.log(`Connecting to MongoDB at ${MONGO_URL}/${DATABASE}`);

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000 // Increase timeout to 30 seconds
    });

    console.log('Connected to MongoDB successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
}

module.exports = { connectDB };