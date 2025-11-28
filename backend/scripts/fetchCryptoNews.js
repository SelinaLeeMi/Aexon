const axios = require("axios");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const CryptoNews = require("../models/CryptoNews"); // Fixed import

const MONGO_URI = process.env.MONGODB_URI;

async function fetchAndSaveNews() {
  if (!MONGO_URI) throw new Error("No MONGODB_URI set");
  await mongoose.connect(MONGO_URI);

  // ---- Demo: Get crypto news from an external API ----
  const apiKey = process.env.CRYPTO_NEWS_API_KEY || "YOUR_API_KEY";
  const url = `https://cryptonews-api.com/api/v1/category?section=general&items=10&token=${apiKey}`;

  try {
    const res = await axios.get(url);
    const articles = Array.isArray(res.data.data) ? res.data.data : [];
    
    for (const article of articles) {
      const exists = await CryptoNews.findOne({ url: article.news_url });
      if (!exists) {
        await CryptoNews.create({
          headline: article.title,
          summary: article.text || article.description || "",
          url: article.news_url,
          publishedAt: new Date(article.date || article.published_at || Date.now())
        });
      }
    }
    console.log("Crypto news fetched and saved!");
  } catch (err) {
    console.error("Error fetching news", err && err.message);
  } finally {
    mongoose.disconnect();
  }
}

fetchAndSaveNews();