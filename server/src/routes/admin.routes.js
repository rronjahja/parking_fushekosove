// Endpoint-et administrative: te mbrojtura me autentikim + rol (kerkesa nr. 11-12).
import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import { ROLES, ADMIN_ROLES, STAFF_ROLES } from '../config/constants.js';
import {
  dashboardSummary, listReservations, listPayments, databaseStatus, hostingStatus,
} from '../services/stats.service.js';
import { listAuditLogs } from '../services/audit.service.js';
import { createBackup, listBackups, restoreBackup } from '../services/backup.service.js';
import { listChatsForStaff, touchAgent } from '../services/support.service.js';

export const adminRouter = Router();

const adminOnly = requireRole(...ADMIN_ROLES);
const staffOnly = requireRole(...STAFF_ROLES);
const superOnly = requireRole(ROLES.SUPERADMIN);

adminRouter.get('/dashboard', adminOnly, async (_req, res, next) => {
  try { res.json(await dashboardSummary()); } catch (e) { next(e); }
});

adminRouter.get('/occupied-parkings', adminOnly, async (req, res, next) => {
  try {
    res.json({ reservations: await listReservations({ ...req.query, status: req.query.status || 'active' }) });
  } catch (e) { next(e); }
});

adminRouter.get('/reservations', adminOnly, async (req, res, next) => {
  try { res.json({ reservations: await listReservations(req.query) }); } catch (e) { next(e); }
});

adminRouter.get('/payments', adminOnly, async (req, res, next) => {
  try { res.json({ payments: await listPayments(req.query) }); } catch (e) { next(e); }
});

adminRouter.get('/audit-logs', adminOnly, async (req, res, next) => {
  try { res.json({ logs: await listAuditLogs({ limit: Number(req.query.limit) || 100 }) }); }
  catch (e) { next(e); }
});

adminRouter.get('/database/status', adminOnly, async (_req, res, next) => {
  try { res.json({ ...(await databaseStatus()), backups: await listBackups() }); }
  catch (e) { next(e); }
});

adminRouter.post('/database/backup', adminOnly, async (req, res, next) => {
  try { res.status(201).json(await createBackup(req.user.id)); }
  catch (e) { next(e); }
});

// Restore: vetem Super Admin. Me MySQL aplikohet menjehere (ekzekuton dump-in .sql).
adminRouter.post('/database/restore', superOnly, async (req, res, next) => {
  try { res.json(await restoreBackup(req.user.id, req.body?.backupId)); }
  catch (e) { next(e); }
});

adminRouter.get('/hosting/status', adminOnly, (_req, res) => res.json(hostingStatus()));

// Paneli i agjenteve: lista e bisedave. Thirrja shenon agjentin si "online".
adminRouter.get('/support/chats', staffOnly, async (req, res, next) => {
  try {
    touchAgent(req.user.id);
    res.json({ chats: await listChatsForStaff({ status: req.query.status }) });
  } catch (e) { next(e); }
});
