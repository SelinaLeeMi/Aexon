/**
 * backend/scripts/seedCoins.js
 *
 * Run: node backend/scripts/seedCoins.js
 *
 * Uses process.env.MONGODB_URI (or MONGO_URI fallback).
 * This script upserts the entries in backend/data/coins.js into your Coin collection.
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
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected.');

    const bulk = coins.map(c => ({
      updateOne: {
        filter: { symbol: c.symbol.toUpperCase() },
        update: {
          $set: {
            symbol: c.symbol.toUpperCase(),
            name: c.name,
            icon: c.icon || '',
            price: typeof c.price === 'number' ? c.price : 0,
            previousPrice: typeof c.price === 'number' ? c.price : 0,
            chartHistory: [],
            isCustom: !!c.isCustom,
            adminControlEnabled: !!c.adminControlEnabled,
            targetPrice: c.targetPrice != null ? c.targetPrice : null,
            driftSpeed: typeof c.driftSpeed === 'number' ? c.driftSpeed : 0.03,
            decimals: typeof c.decimals === 'number' ? c.decimals : (c.decimals ? Number(c.decimals) : 8)
          }
        },
        upsert: true
      }
    }));

    if (bulk.length === 0) {
      console.log('No coins to seed.');
      process.exit(0);
    }

    const result = await Coin.bulkWrite(bulk);
    console.log('Seed completed. Result summary:', {
      nUpserted: (result.upsertedCount || 0),
      nMatched: (result.matchedCount || 0),
      nModified: (result.modifiedCount || 0)
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
}

seed();
