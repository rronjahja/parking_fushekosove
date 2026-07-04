// Të gjitha thirrjet e API-së në një vend - komponentët nuk ndërtojnë URL vetë.
import { api } from './client.js';

// ── Auth ──
export const authRegister = (payload) => api('/auth/register', { method: 'POST', body: payload });
export const authLogin = (identifier, password) =>
  api('/auth/login', { method: 'POST', body: { identifier, password } });
export const authMe = () => api('/auth/me');

// ── Profili ──
export const fetchProfile = () => api('/profile');
export const requestVerification = (channel) =>
  api('/profile/verify/request', { method: 'POST', body: { channel } });
export const confirmVerification = (channel, code) =>
  api('/profile/verify/confirm', { method: 'POST', body: { channel, code } });
export const saveProfilePlate = (plate) =>
  api('/profile/plate', { method: 'PUT', body: { plate } });
// ── Publike ──
export const fetchZones = () => api('/zones');
export const fetchZoneSpots = (zoneId) => api(`/zones/${zoneId}/parkings`);
export const fetchTariffs = () => api('/tariffs');
export const fetchTotals = () => api('/parkings/status');
export const findCar = (plate) => api(`/find-car?plate=${encodeURIComponent(plate)}`);
export const fetchPin = (zoneId, spotNumber) =>
  api('/navigation/pin', { method: 'POST', body: { zoneId, spotNumber } });
export const fetchAgentsStatus = () => api('/support/agents/status');

// ── Rezervime & kuleta ──
export const payAndReserve = (payload) =>
  api('/reservations/pay-and-reserve', { method: 'POST', body: payload });
export const fetchMyReservations = () => api('/reservations/mine/active');
export const fetchWallet = () => api('/wallet');
export const topUpWallet = (euro) => api('/wallet/top-up', { method: 'POST', body: { euro } });

// ── Chat i mbështetjes ──
export const openSupportChat = (payload = {}) =>
  api('/support/chats', { method: 'POST', body: payload });
export const fetchMyChat = () => api('/support/chats/mine');
export const fetchChatMessages = (chatId) => api(`/support/chats/${chatId}/messages`);
export const sendChatMessage = (chatId, text) =>
  api(`/support/chats/${chatId}/messages`, { method: 'POST', body: { text } });
export const closeSupportChat = (chatId) =>
  api(`/support/chats/${chatId}/close`, { method: 'PATCH' });

// ── Administrative ──
export const fetchDashboard = () => api('/admin/dashboard');
export const fetchAdminReservations = (filters = {}) => {
  const q = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v)
  ).toString();
  return api(`/admin/reservations${q ? `?${q}` : ''}`);
};
export const fetchAuditLogs = () => api('/admin/audit-logs?limit=120');
export const fetchDbStatus = () => api('/admin/database/status');
export const runBackup = () => api('/admin/database/backup', { method: 'POST' });
export const stageRestore = (backupId) =>
  api('/admin/database/restore', { method: 'POST', body: { backupId } });
export const fetchHosting = () => api('/admin/hosting/status');
export const fetchStaffChats = (status) =>
  api(`/admin/support/chats${status ? `?status=${status}` : ''}`);

// ── Ndërtuesi (Super Admin) ──
export const createZone = (payload) =>
  api('/admin/layout/zones', { method: 'POST', body: payload });
export const updateZone = (zoneId, payload) =>
  api(`/admin/layout/zones/${zoneId}`, { method: 'PATCH', body: payload });
export const deleteZone = (zoneId) =>
  api(`/admin/layout/zones/${zoneId}`, { method: 'DELETE' });
export const saveZoneLayout = (zoneId, spots) =>
  api(`/admin/layout/zones/${zoneId}/spots`, { method: 'PUT', body: { spots } });
