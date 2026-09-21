/**
 * AgriSync Centralized API & Realtime Socket Configuration
 * Ensures zero hardcoded localhost dependencies in production.
 */

const rawApiUrl = import.meta.env.VITE_API_URL || '';
export const API_BASE_URL = rawApiUrl ? rawApiUrl.replace(/\/+$/, '') : '';
export const API = API_BASE_URL;

export const getApiUrl = (endpoint = '') => {
  if (!endpoint) return API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

const rawSocketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '';
export const SOCKET_URL = rawSocketUrl
  ? rawSocketUrl.replace(/\/+$/, '')
  : (typeof window !== 'undefined' && window.location ? window.location.origin : '');

export const getSocketUrl = () => SOCKET_URL;

export default {
  API_BASE_URL,
  API,
  getApiUrl,
  SOCKET_URL,
  getSocketUrl,
};