const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI not set in .env');

    // 🔥 Move debug logs BEFORE connect()
    mongoose.connection.on("connected", () => {
      console.log("CONNECTED DB NAME:", mongoose.connection.name);
      console.log("CONNECTED HOST:", mongoose.connection.host);
      console.log("CONNECTED PORT:", mongoose.connection.port);
    });

    mongoose.connection.on("error", (err) => {
      console.log("MONGO ERROR:", err);
    });

    // Now connect AFTER attaching listeners
    await mongoose.connect(uri);

    console.log('MongoDB connected');

  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
