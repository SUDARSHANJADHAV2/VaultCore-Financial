const API_BASE_URL = 'http://localhost:8081/api';

export const AUTH_URL      = `${API_BASE_URL}/auth`;       // /api/auth/login, /api/auth/register
export const ACCOUNTS_URL  = `${API_BASE_URL}/accounts`;   // /api/accounts/user/:userId
export const TRANSFERS_URL = `${API_BASE_URL}/transfers`;  // /api/transfers
export const STOCKS_URL    = `${API_BASE_URL}/stocks`;     // /api/stocks

export default API_BASE_URL;