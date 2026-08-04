// API Base URL for Express Backend
const rawApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const cleanApiUrl = rawApiUrl.replace(/\/$/, '');
const API_BASE_URL = cleanApiUrl.endsWith('/api') ? cleanApiUrl : `${cleanApiUrl}/api`;

/**
 * Custom fetch wrapper handling credentials (HTTP-only cookies) and JSON payloads
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('pmt_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    headers,
    credentials: 'include', // Ensures HTTP-only cookies are sent & received when supported
    ...options
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return data;
}

export const api = {
  // Auth & OTP Endpoints
  register: (userData) =>
    request('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  verifyOTP: (otpData) =>
    request('/users/verify-otp', {
      method: 'POST',
      body: JSON.stringify(otpData)
    }),

  resendOTP: (emailData) =>
    request('/users/resend-otp', {
      method: 'POST',
      body: JSON.stringify(emailData)
    }),

  login: (credentials) =>
    request('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  logout: () =>
    request('/users/logout', {
      method: 'POST'
    }),

  getProfile: () =>
    request('/users/profile', {
      method: 'GET'
    }),

  updateProfile: (userData) =>
    request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    })
};
