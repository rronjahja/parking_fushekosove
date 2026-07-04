import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, CheckCheck } from 'lucide-react';
import { fetchStaffChats, fetchChatMessages, sendChatMessage, closeSupportChat } from '../api/endpoints.js';
import { usePolling } from '../hooks/usePolling.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Paneli i agjentëve të mbështetjes: pranimi, përgjigjja dhe mbyllja e bisedave.
// Vetë hapja e panelit e shënon agjentin "në linjë" për përdoruesit.
export function AgentPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState('open');
  const [chats, setChats] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [text, setText] = useState('');

  usePolling(() => {
    fetchStaffChats()
      .then((d) => setChats(d.chats))
      .catch(() => {});
  }, 2000);

  usePolling(
    () => {
      if (!selectedId) return;
      fetchChatMessages(selectedId).then(setConversation).catch(() => {});
    },
    2000,
    [selectedId],
    Boolean(selectedId)
  );

  const visible = chats.filter((c) =>
    tab === 'open' ? c.status !== 'closed' : c.status === 'closed'
  );

  const reply = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedId) return;
    const value = text;
    setText('');
    try {
      const data = await sendChatMessage(selectedId, value);
      setConversation(data);
    } catch (err) { toast.error(err.message); }
  };

  const close = async () => {
    try {
      await closeSupportChat(selectedId);
      toast.success('Biseda u mbyll.');
      setConversation(null);
      setSelectedId(null);
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-3 pt-4 sm:px-5">
      <header className="card-pad flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Paneli i Agjentit</h1>
          <p className="text-sm text-faint">Bisedat e suportit · {user?.name}</p>
        </div>
        <Link to="/" className="btn-ghost text-xs"><ArrowLeft size={14} /> Harta</Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-[340px,1fr]">
        <div className="card overflow-hidden">
          <div className="flex border-b border-line/15">
            {[['open', 'Të hapura'], ['closed', 'Të mbyllura']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 py-3 text-xs font-semibold ${
                  tab === key ? 'bg-raised text-cyan' : 'text-faint hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="max-h-[540px] overflow-y-auto">
            {visible.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedId(c.id); setConversation(null); }}
                className={`block w-full border-b border-line/10 px-4 py-3 text-left hover:bg-raised/60 ${
                  selectedId === c.id ? 'bg-raised' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{c.subject || 'Bisedë e re'}</span>
                  {c.unreadFromUser > 0 && (
                    <span className="rounded-full bg-rose px-2 py-0.5 text-[10px] font-bold text-white">
                      {c.unreadFromUser}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-xs text-faint">{c.lastMessage || '—'}</div>
                <div className="mt-1 text-[10px] text-faint">
                  {c.status === 'assigned' ? '● E marrë' : c.status === 'open' ? '○ Në pritje' : '✓ E mbyllur'}
                  {' · '}{c.createdAt}
                </div>
              </button>
            ))}
            {visible.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-faint">Nuk ka biseda këtu.</p>
            )}
          </div>
        </div>

        <div className="card flex min-h-[560px] flex-col overflow-hidden">
          {!conversation ? (
            <div className="flex flex-1 items-center justify-center text-sm text-faint">
              Zgjidhni një bisedë nga lista.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-line/15 px-4 py-3">
                <div>
                  <div className="text-sm font-bold">{conversation.chat.subject || 'Bisedë'}</div>
                  <div className="text-[11px] text-faint">Statusi: {conversation.chat.status}</div>
                </div>
                {conversation.chat.status !== 'closed' && (
                  <button onClick={close} className="btn-mint !py-1.5 text-xs">
                    <CheckCheck size={13} /> Mbyll bisedën
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
                {conversation.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                      m.senderType === 'agent'
                        ? 'ml-auto bg-cyan text-[#04222B] rounded-br-sm'
                        : m.senderType === 'user'
                          ? 'bg-raised rounded-bl-sm'
                          : 'mx-auto bg-transparent text-center text-[11px] text-faint'
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>
              {conversation.chat.status !== 'closed' && (
                <form onSubmit={reply} className="flex gap-2 border-t border-line/15 p-3">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Shkruani përgjigjen..."
                    className="input"
                  />
                  <button type="submit" className="btn-primary !px-4"><Send size={15} /></button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
