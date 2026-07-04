import { Router } from 'express';
import { requireIdentity } from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rateLimiters.js';
import {
  openChat, getChatForOwner, listMessages, sendMessage, closeChat,
} from '../services/support.service.js';

export const supportRouter = Router();

supportRouter.post('/chats', requireIdentity, chatLimiter, async (req, res, next) => {
  try { res.status(201).json({ chat: await openChat(req.user.id, req.body || {}) }); }
  catch (e) { next(e); }
});

supportRouter.get('/chats/mine', requireIdentity, async (req, res, next) => {
  try { res.json({ chat: await getChatForOwner(req.user.id) }); }
  catch (e) { next(e); }
});

supportRouter.get('/chats/:chatId/messages', requireIdentity, async (req, res, next) => {
  try { res.json(await listMessages(req.params.chatId, req.user)); }
  catch (e) { next(e); }
});

supportRouter.post('/chats/:chatId/messages', requireIdentity, chatLimiter, async (req, res, next) => {
  try { res.status(201).json(await sendMessage(req.params.chatId, req.user, req.body?.text)); }
  catch (e) { next(e); }
});

supportRouter.patch('/chats/:chatId/close', requireIdentity, async (req, res, next) => {
  try { res.json({ chat: await closeChat(req.params.chatId, req.user) }); }
  catch (e) { next(e); }
});
