/**
 * News Controller - Professional Refactor
 */
const CryptoNews = require("../models/CryptoNews");

// Get latest crypto news (limit 20, newest first)
exports.getCryptoNews = async (req, res) => {
  try {
    const newsList = await CryptoNews.find()
      .sort({ publishedAt: -1 })
      .limit(20);
    res.json({
      success: true,
      msg: "Fetched crypto news",
      data: newsList,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch crypto news",
    });
  }
};

// Admin: Post crypto news
exports.postCryptoNews = async (req, res) => {
  try {
    const { headline, summary, url, publishedAt } = req.body;
    if (!headline || !summary || !url)
      return res.status(400).json({
        success: false,
        error: "Headline, summary, and URL are required",
      });
    const news = await CryptoNews.create({
      headline,
      summary,
      url,
      publishedAt: publishedAt || new Date(),
    });
    res.status(201).json({
      success: true,
      msg: "Crypto news posted",
      data: news,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to post crypto news",
    });
  }
};