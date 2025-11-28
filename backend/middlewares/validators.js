/**
 * Central Joi validation middlewares for demo platform
 */
const Joi = require("joi");

// Announcement validator
exports.validateAnnouncement = (req, res, next) => {
  const schema = Joi.object({
    message: Joi.string().min(3).max(600).required(),
    type: Joi.string().valid("info", "warning", "system").optional(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });
  next();
};

// Referral claim validator
exports.validateReferralClaim = (req, res, next) => {
  const schema = Joi.object({
    code: Joi.string().min(4).max(32).required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });
  next();
};

// KYC submission validator
exports.validateKycSubmission = (req, res, next) => {
  // If uploading via FormData, skip and let multer handle; if not, require documentUrl
  if (req.files && (req.files.frontFile || req.files.backFile)) return next();
  const schema = Joi.object({
    documentUrl: Joi.string().uri().required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });
  next();
};

// Deposit/Withdraw request validator
exports.validateDepositWithdraw = (req, res, next) => {
  const schema = Joi.object({
    coin: Joi.string().min(2).max(10).required(),
    amount: Joi.number().min(0.00000001).required(),
    address: Joi.string().min(4).required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });
  next();
};

// Trade create validator — more in tradeController for demo
exports.validateTradeCreate = (req, res, next) => {
  const schema = Joi.object({
    pair: Joi.string().min(3).max(16).regex(/^[A-Z0-9/_-]+$/i).required(),
    size: Joi.number().min(0.000001).required(),
    side: Joi.string().valid("buy", "sell").required(),
    price: Joi.number().min(0),
    type: Joi.string().valid("market", "limit").optional(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });
  next();
};