// Chat-i i mbeshtetjes online (seksioni 9.1): bisedat, mesazhet, agjentet.
// Komunikimi ne kohe reale realizohet me polling cdo 2 sekonda (i lejuar
// shprehimisht nga specifikimi si alternative e WebSocket).
import { db } from '../db/connection.js';
import { newId } from '../utils/id.js';
import { bad, requireString } from '../utils/validators.js';
import { audit } from './audit.service.js';

// Statusi "online" i agjenteve: mbahet ne memorie sipas aktivitetit te fundit.
const agentLastSeen = new Map();
export const touchAgent = (agentId) => agentLastSeen.set(agentId, Date.now());
export function agentsOnline() {
  const cutoff = Date.now() - 60_000;
  let online = 0;
  for (const ts of agentLastSeen.values()) if (ts >= cutoff) online++;
  return { online, status: online > 0 ? 'online' : 'offline' };
}

const mapChat = (c) => ({
  id: c.id,
  ownerId: c.owner_id,
  subject: c.subject,
  status: c.status,
  assignedAgentId: c.assigned_agent_id,
  relatedReservationId: c.related_reservation_id,
  createdAt: c.created_at,
  closedAt: c.closed_at,
});

const mapMsg = (m) => ({
  id: m.id, chatId: m.chat_id, senderType: m.sender_type, senderId: m.sender_id,
  text: m.text, createdAt: m.created_at, readAt: m.read_at,
});

export async function openChat(ownerId, { subject, relatedReservationId } = {}) {
  const existing = await db.one(
    "SELECT * FROM chats WHERE owner_id = ? AND status != 'closed' ORDER BY created_at DESC LIMIT 1",
    [ownerId]
  );
  if (existing) return mapChat(existing);

  const id = newId();
  await db.run(
    'INSERT INTO chats (id, owner_id, subject, related_reservation_id) VALUES (?, ?, ?, ?)',
    [id, ownerId, subject ? requireString(subject, 'tema', { max: 120 }) : null, relatedReservationId || null]
  );
  await db.run(
    "INSERT INTO chat_messages (id, chat_id, sender_type, text) VALUES (?, ?, 'system', ?)",
    [newId(), id, 'Mirë se vini! Një agjent do t\u2019ju përgjigjet së shpejti.']
  );
  await audit(ownerId, 'CHAT_OPEN', `chat:${id}`);
  return mapChat(await db.one('SELECT * FROM chats WHERE id = ?', [id]));
}

export async function getChatForOwner(ownerId) {
  const c = await db.one('SELECT * FROM chats WHERE owner_id = ? ORDER BY created_at DESC LIMIT 1', [ownerId]);
  return c ? mapChat(c) : null;
}

async function chatOr404(chatId) {
  const c = await db.one('SELECT * FROM chats WHERE id = ?', [chatId]);
  if (!c) throw bad('Biseda nuk u gjet.', 404, 'NOT_FOUND');
  return c;
}

export function assertChatAccess(chat, user) {
  const isStaff = ['AGENT', 'ADMIN', 'SUPERADMIN'].includes(user.role);
  if (!isStaff && chat.owner_id !== user.id) {
    throw bad('Nuk keni qasje në këtë bisedë.', 403, 'FORBIDDEN');
  }
  return isStaff;
}

export async function listMessages(chatId, user) {
  const chat = await chatOr404(chatId);
  const isStaff = assertChatAccess(chat, user);
  const otherSide = isStaff ? 'user' : 'agent';
  await db.run(
    'UPDATE chat_messages SET read_at = NOW() WHERE chat_id = ? AND sender_type = ? AND read_at IS NULL',
    [chatId, otherSide]
  );
  const messages = await db.query(
    'SELECT * FROM chat_messages WHERE chat_id = ? ORDER BY created_at, id',
    [chatId]
  );
  return { chat: mapChat(chat), messages: messages.map(mapMsg) };
}

export async function sendMessage(chatId, user, text) {
  const chat = await chatOr404(chatId);
  const isStaff = assertChatAccess(chat, user);
  if (chat.status === 'closed') throw bad('Biseda është e mbyllur.', 409, 'CHAT_CLOSED');
  const clean = requireString(text, 'mesazhi', { max: 1000 });

  const senderType = isStaff ? 'agent' : 'user';
  await db.run(
    'INSERT INTO chat_messages (id, chat_id, sender_type, sender_id, text) VALUES (?, ?, ?, ?, ?)',
    [newId(), chatId, senderType, user.id, clean]
  );

  if (isStaff && chat.status === 'open') {
    await db.run("UPDATE chats SET status = 'assigned', assigned_agent_id = ? WHERE id = ?", [user.id, chatId]);
  }
  if (isStaff) touchAgent(user.id);
  return listMessages(chatId, user);
}

export async function closeChat(chatId, user) {
  const chat = await chatOr404(chatId);
  assertChatAccess(chat, user);
  await db.run("UPDATE chats SET status = 'closed', closed_at = NOW() WHERE id = ?", [chatId]);
  await db.run(
    "INSERT INTO chat_messages (id, chat_id, sender_type, text) VALUES (?, ?, 'system', ?)",
    [newId(), chatId, 'Biseda u mbyll. Faleminderit që na kontaktuat!']
  );
  await audit(user.id, 'CHAT_CLOSE', `chat:${chatId}`);
  return mapChat(await db.one('SELECT * FROM chats WHERE id = ?', [chatId]));
}

export async function listChatsForStaff({ status } = {}) {
  const rows = status
    ? await db.query('SELECT * FROM chats WHERE status = ? ORDER BY created_at DESC LIMIT 200', [status])
    : await db.query('SELECT * FROM chats ORDER BY created_at DESC LIMIT 200');

  return Promise.all(
    rows.map(async (c) => {
      const last = await db.one(
        'SELECT text, created_at FROM chat_messages WHERE chat_id = ? ORDER BY created_at DESC, id DESC LIMIT 1',
        [c.id]
      );
      const unread = await db.one(
        "SELECT COUNT(*) AS n FROM chat_messages WHERE chat_id = ? AND sender_type = 'user' AND read_at IS NULL",
        [c.id]
      );
      return {
        ...mapChat(c),
        lastMessage: last?.text || null,
        lastMessageAt: last?.created_at || null,
        unreadFromUser: Number(unread.n) || 0,
      };
    })
  );
}

// Historiku i të gjitha bisedave të një përdoruesi (për profilin).
export async function chatHistoryForOwner(ownerId) {
  const rows = await db.query(
    'SELECT * FROM chats WHERE owner_id = ? ORDER BY created_at DESC LIMIT 100',
    [ownerId]
  );
  return Promise.all(
    rows.map(async (c) => {
      const last = await db.one(
        'SELECT text, created_at FROM chat_messages WHERE chat_id = ? ORDER BY created_at DESC, id DESC LIMIT 1',
        [c.id]
      );
      const count = await db.one(
        'SELECT COUNT(*) AS n FROM chat_messages WHERE chat_id = ?', [c.id]
      );
      return {
        id: c.id,
        subject: c.subject,
        status: c.status,
        createdAt: c.created_at,
        closedAt: c.closed_at,
        lastMessage: last?.text || null,
        lastMessageAt: last?.created_at || null,
        messageCount: Number(count.n) || 0,
      };
    })
  );
}