/**
 * Finance Controller - All deposit/withdraw ops logged to Ledger and Audit
 */
const DepositRequest = require("../models/DepositRequest");
const WithdrawRequest = require("../models/WithdrawRequest");
const { postLedgerEntry } = require("../utils/ledger");
const { createAudit } = require("../utils/auditLog");
const { getBalance } = require("../utils/ledger");

// User requests deposit (simulate user sends crypto and expects admin approval)
exports.requestDeposit = async (req, res) => {
  try {
    const { coin, amount, address } = req.body;
    const reqDoc = new DepositRequest({
      user: req.user.id,
      coin,
      amount,
      address,
    });
    await reqDoc.save();
    await createAudit("deposit:request", req.user.id, { coin, amount, address });
    res.status(201).json({ success: true, msg: "Deposit request submitted", data: reqDoc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// User requests withdrawal (admin must approve)
exports.requestWithdraw = async (req, res) => {
  try {
    const { coin, amount, address } = req.body;
    // Check available balance in ledger before creating withdraw
    const bal = await getBalance(req.user.id, coin);
    if (bal < amount) return res.status(400).json({ success: false, error: "Insufficient balance." });
    const reqDoc = new WithdrawRequest({
      user: req.user.id,
      coin,
      amount,
      address,
    });
    await reqDoc.save();
    await createAudit("withdraw:request", req.user.id, { coin, amount, address });
    res.status(201).json({ success: true, msg: "Withdraw request submitted", data: reqDoc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// Admin: approve deposit = credit user ledger
exports.adminApproveDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const deposit = await DepositRequest.findById(id);
    if (!deposit) return res.status(404).json({ success: false, error: "Not found" });
    if (deposit.status !== "pending") return res.status(400).json({ success: false, error: "Already reviewed" });

    // Credit ledger
    const { entry } = await postLedgerEntry(deposit.user, "deposit", deposit.coin, deposit.amount, {
      ref: deposit._id,
      note: "Deposit approved by admin",
    });

    deposit.status = "approved";
    deposit.reviewedBy = req.user.id;
    deposit.reviewedAt = new Date();
    await deposit.save();

    await createAudit("deposit:approve", req.user.id, { depositId: id, ledgerEntry: entry._id });

    res.json({ success: true, msg: "Deposit approved.", data: deposit });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Admin: reject deposit = log audit
exports.adminRejectDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const deposit = await DepositRequest.findById(id);
    if (!deposit) return res.status(404).json({ success: false, error: "Not found" });
    if (deposit.status !== "pending") return res.status(400).json({ success: false, error: "Already reviewed" });

    deposit.status = "rejected";
    deposit.reviewedBy = req.user.id;
    deposit.reviewedAt = new Date();
    deposit.note = String(reason || "Rejected by admin");
    await deposit.save();

    await createAudit("deposit:reject", req.user.id, { depositId: id, reason });

    res.json({ success: true, msg: "Deposit rejected.", data: deposit });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Admin: approve withdraw = debit user ledger
exports.adminApproveWithdraw = async (req, res) => {
  try {
    const { id } = req.params;
    const withdraw = await WithdrawRequest.findById(id);
    if (!withdraw) return res.status(404).json({ success: false, error: "Not found" });
    if (withdraw.status !== "pending") return res.status(400).json({ success: false, error: "Already reviewed" });

    // Debit ledger (simulate onchain send)
    const { entry } = await postLedgerEntry(withdraw.user, "withdraw", withdraw.coin, -withdraw.amount, {
      ref: withdraw._id,
      note: "Withdraw approved by admin",
    });

    withdraw.status = "approved";
    withdraw.reviewedBy = req.user.id;
    withdraw.reviewedAt = new Date();
    await withdraw.save();

    await createAudit("withdraw:approve", req.user.id, { withdrawId: id, ledgerEntry: entry._id });

    res.json({ success: true, msg: "Withdraw approved.", data: withdraw });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Admin: reject withdraw = log audit
exports.adminRejectWithdraw = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const withdraw = await WithdrawRequest.findById(id);
    if (!withdraw) return res.status(404).json({ success: false, error: "Not found" });
    if (withdraw.status !== "pending") return res.status(400).json({ success: false, error: "Already reviewed" });

    withdraw.status = "rejected";
    withdraw.reviewedBy = req.user.id;
    withdraw.reviewedAt = new Date();
    withdraw.note = String(reason || "Rejected by admin");
    await withdraw.save();

    await createAudit("withdraw:reject", req.user.id, { withdrawId: id, reason });

    res.json({ success: true, msg: "Withdraw rejected.", data: withdraw });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// User: List own deposits/withdrawals
exports.myDeposits = async (req, res) => {
  try {
    const reqs = await DepositRequest.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: reqs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.myWithdrawals = async (req, res) => {
  try {
    const reqs = await WithdrawRequest.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: reqs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};