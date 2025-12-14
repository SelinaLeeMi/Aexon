/**
 * Ledger Util - robust balance logic: always use ledger for balance
 *
 * Added helper: getAllBalances(userId) -> returns last-known balance per coin (from ledger)
 * This is read-only and safe for admin queries.
 */
const LedgerEntry = require("../models/LedgerEntry");
const mongoose = require("mongoose");

/**
 * Get the balance for a specific user & coin using the ledger (source-of-truth).
 */
async function getBalance(userId, coin) {
  const last = await LedgerEntry.findOne({ user: userId, coin: coin.toUpperCase() })
    .sort({ createdAt: -1 });
  return last ? last.balance : 0;
}

/**
 * Get the latest balance per coin for a user using aggregation.
 * Returns array: [{ coin: "USDT", balance: 123.45 }, ...]
 */
async function getAllBalances(userId) {
  if (!userId) return [];
  let objectId;
  try {
    objectId = mongoose.Types.ObjectId(userId);
  } catch (_) {
    // If invalid ObjectId, return empty
    return [];
  }

  // Aggregation: sort desc by createdAt then group by coin picking first balance
  const rows = await LedgerEntry.aggregate([
    { $match: { user: objectId } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$coin", balance: { $first: "$balance" } } },
    { $project: { _id: 0, coin: "$_id", balance: 1 } }
  ]).exec();

  return Array.isArray(rows) ? rows : [];
}

/**
 * Add an entry to the ledger and return new balance.
 * @param {ObjectId} userId - user id
 * @param {String} type - deposit/withdraw/trade/fee/etc.
 * @param {String} coin - currency/ticker
 * @param {Number} delta - change (positive: credit, negative: debit)
 * @param {Object} opts - { subtype, ref, note, meta }
 *
 * Note: This function remains unchanged in semantics; admin read endpoints use getAllBalances.
 */
async function postLedgerEntry(userId, type, coin, delta, opts = {}) {
  coin = coin.toUpperCase();
  if (typeof delta !== 'number' || !Number.isFinite(delta)) throw new Error("Amount required");
  let prevBalance = await getBalance(userId, coin);
  let newBalance = prevBalance + delta;
  if (newBalance < 0) throw new Error("Insufficient balance");
  const entry = await LedgerEntry.create({
    user: userId,
    type,
    coin,
    amount: delta,
    balance: newBalance,
    ...opts,
  });
  return { entry, balance: newBalance };
}

module.exports = { getBalance, postLedgerEntry, getAllBalances };