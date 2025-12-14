/**
 * backend/scripts/seedCoins.js
 *
 * Upserts entries in backend/data/coins.js into the Coin collection.
 * Safe behavior:
 *  - Uses uppercase symbol
 *  - Does not stomp admin flags if already present
 *  - Provides a CLI-friendly exit code
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const Coin = require('../models/Coin');
const coins = require('../data/coins');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not set. Set it in .env and retry.');
  process.exit(1);
}

async function seed() {
  let conn;
  try {
    conn = await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected.');

    const bulk = coins.map(c => {
      const symbol = String(c.symbol || "").toUpperCase().trim();
      const price = typeof c.price === 'number' ? c.price : 0;
      const previousPrice = typeof c.previousPrice === 'number' ? c.previousPrice : price;

      return {
        updateOne: {
          filter: { symbol },
          update: {
            $set: {
              symbol,
              name: c.name,
              icon: c.icon || '',
              previousPrice,
            },
            // Only set these fields when inserting new doc
            $setOnInsert: {
              price: price || 0,
              chartHistory: [],
              isCustom: !!c.isCustom,
              adminControlEnabled: !!c.adminControlEnabled,
              targetPrice: c.targetPrice != null ? c.targetPrice : null,
              driftSpeed: typeof c.driftSpeed === 'number' ? c.driftSpeed : 0.03,
              decimals: typeof c.decimals === 'number' ? c.decimals : (c.decimals ? Number(c.decimals) : 8),
              lastPriceUpdate: new Date()
            }
          },
          upsert: true
        }
      };
    });

    if (bulk.length === 0) {
      console.log('No coins to seed.');
      await mongoose.disconnect();
      process.exit(0);
    }

    const result = await Coin.bulkWrite(bulk, { ordered: false });
    console.log('Seed completed. Result summary:', {
      nUpserted: (result.upsertedCount || 0),
      nMatched: (result.matchedCount || 0),
      nModified: (result.modifiedCount || 0)
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err && (err.stack || err));
    try { if (conn) await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
}

seed();