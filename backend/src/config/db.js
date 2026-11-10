const path = require('path');
// Ensure dotenv is loaded regardless of process.cwd()
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.warn('⚠️ [MongoDB WARNING] MONGO_URI is undefined! Defaulting to local 127.0.0.1:27017');
    } else {
      console.log(`[MongoDB] Connecting using MONGO_URI (${mongoURI.includes('mongodb+srv') ? 'MongoDB Atlas Cluster' : 'Local Connection'})...`);
    }

    const targetURI = mongoURI || 'mongodb://127.0.0.1:27017/bus_booking';
    const conn = await mongoose.connect(targetURI, {
      autoIndex: true
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.host} / ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;


