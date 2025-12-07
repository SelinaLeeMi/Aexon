const mongoose = require("mongoose");
const Coin = require("../models/Coin");
const coins = require("../data/coins");
require("dotenv").config();

async function start() {
  try {
    const uri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      process.env.DATABASE_URL ||
      "mongodb://127.0.0.1:27017/aexon";

    console.log("Connecting to database:", uri);
    await mongoose.connect(uri);

    console.log("Clearing old coins...");
    await Coin.deleteMany({});

    console.log("Inserting fresh coin list...");
    await Coin.insertMany(coins);

    console.log("Coins loaded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Load coins error:", err);
    process.exit(1);
  }
}

start();
