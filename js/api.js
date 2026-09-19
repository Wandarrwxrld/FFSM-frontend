/* ==========================================================================
   FFMS API client — every call to the PHP backend goes through here.
   The backend URL itself lives in js/config.js — edit that file, not this
   one, once your backend is deployed.
   ========================================================================== */
import { API_BASE } from './config.js';
export { API_BASE };

const TOKEN_KEY = 'ffms_token';
const USER_KEY = 'ffms_user';

export function getToken(){
  return localStorage.getItem(TOKEN_KEY);
}
export function setSession(token, user){
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function getStoredUser(){
  try{
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}
export function clearSession(){
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

class ApiError extends Error {
  constructor(message, status){
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}){
  const headers = { 'Content-Type': 'application/json' };
  if (auth){
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try{
    res = await fetch(`${API_BASE}/${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }catch(networkErr){
    throw new ApiError('Could not reach the server. Check your connection or try again shortly.', 0);
  }

  let payload = null;
  try{ payload = await res.json(); }catch(e){ /* empty body, e.g. 204 */ }

  if (!res.ok){
    const message = payload?.error || `Request failed (${res.status}).`;
    throw new ApiError(message, res.status);
  }
  return payload?.data;
}

export const Api = {
  // ---- auth ----
  signup: (body) => request('auth_signup.php', { method: 'POST', body, auth: false }),
  verifyEmail: (token) => request('auth_verify.php', { method: 'POST', body: { token }, auth: false }),
  resendVerification: (email) => request('auth_resend_verification.php', { method: 'POST', body: { email }, auth: false }),
  login: (email, password) => request('auth_login.php', { method: 'POST', body: { email, password }, auth: false }),
  logout: () => request('auth_logout.php', { method: 'POST' }),
  me: () => request('auth_me.php'),
  changePassword: (currentPassword, newPassword) =>
    request('auth_change_password.php', { method: 'POST', body: { currentPassword, newPassword } }),
  forgotPassword: (email) => request('auth_forgot_password.php', { method: 'POST', body: { email }, auth: false }),
  resetPassword: (token, password) =>
    request('auth_reset_password.php', { method: 'POST', body: { token, password }, auth: false }),

  // ---- generic records ----
  list: (entity) => request(`records.php?entity=${encodeURIComponent(entity)}`),
  get: (entity, id) => request(`records.php?entity=${encodeURIComponent(entity)}&id=${id}`),
  create: (entity, body) => request(`records.php?entity=${encodeURIComponent(entity)}`, { method: 'POST', body }),
  update: (entity, id, body) => request(`records.php?entity=${encodeURIComponent(entity)}&id=${id}`, { method: 'PUT', body }),
  remove: (entity, id) => request(`records.php?entity=${encodeURIComponent(entity)}&id=${id}`, { method: 'DELETE' }),

  // ---- team & audit ----
  team: () => request('team.php'),
  updateTeamMember: (id, body) => request(`team.php?id=${id}`, { method: 'PUT', body }),
  auditLog: () => request('audit.php'),
};

export { ApiError };
