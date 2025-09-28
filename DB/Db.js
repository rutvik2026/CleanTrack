const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    console.log("MongoDB gt connected");
  } catch (error) {
    console.log(`MongoDB server error: ${error.message}`);
  }
};

module.exports = connectDb;