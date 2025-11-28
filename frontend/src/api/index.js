// Frontend API exports: All backend functions must be exported as named functions
import { getCoins, getMe, getWallet, getAnnouncements, getCryptoNews, submitKyc, forgotPassword, login, register, claimReferral, getDepositRequests, getWithdrawRequests, requestDeposit, requestWithdraw, getKycStatus } from './api'; // adjust import if you have submodules

export {
  getCoins,
  getMe,
  getWallet,
  getAnnouncements,
  getCryptoNews,
  submitKyc,
  forgotPassword,
  login,
  register,
  claimReferral,
  getDepositRequests,
  getWithdrawRequests,
  requestDeposit,
  requestWithdraw,
  getKycStatus
};