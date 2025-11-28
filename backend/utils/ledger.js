/**
 * Ledger Util - robust balance logic: always use ledger for balance
 */
const LedgerEntry = require("../models/LedgerEntry");

/**
 * Get the balance for a specific user & coin using the ledger (source-of-truth).
 */
async function getBalance(userId, coin) {
  const last = await LedgerEntry.findOne({ user: userId, coin: coin.toUpperCase() })
    .sort({ createdAt: -1 });
  return last ? last.balance : 0;
}

/**
 * Add an entry to the ledger and return new balance.
 * @param {ObjectId} userId - user id
 * @param {String} type - deposit/withdraw/trade/fee/etc.
 * @param {String} coin - currency/ticker
 * @param {Number} delta - change (positive: credit, negative: debit)
 * @param {Object} opts - { subtype, ref, note, meta }
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

module.exports = { getBalance, postLedgerEntry };