import { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import { t } from '../../i18n/sq.js';
import {
  openSupportChat, fetchMyChat, fetchChatMessages, sendChatMessage, closeSupportChat,
} from '../../api/endpoints.js';
import { usePolling } from '../../hooks/usePolling.js';
import { useToast } from '../../context/ToastContext.jsx';

// Dritarja e bisedës me agjentët - mesazhet rifreskohen çdo 2 sekonda.
export function ChatWindow({ agentStatus, onClose }) {
  const toast = useToast();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchMyChat().then(({ chat: c }) => c && c.status !== 'closed' && setChat(c)).catch(() => { });
  }, []);

  usePolling(
    async () => {
      if (!chat) return;
      try {
        const data = await fetchChatMessages(chat.id);
        setMessages(data.messages);
        setChat(data.chat);
      } catch { /* injoro gabimet kalimtare */ }
    },
    2000,
    [chat?.id],
    Boolean(chat)
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const start = async () => {
    try {
      const { chat: c } = await openSupportChat({ subject: 'Ndihmë nga aplikacioni' });
      setChat(c);
    } catch (e) { toast.error(e.message); }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !chat) return;
    const value = text;
    setText('');
    try {
      const data = await sendChatMessage(chat.id, value);
      setMessages(data.messages);
    } catch (err) { toast.error(err.message); }
  };

  const close = async () => {
    if (!chat) return;
    try {
      await closeSupportChat(chat.id);
      setChat(null);
      setMessages([]);
      toast.info('Biseda u mbyll.');
    } catch (e) { toast.error(e.message); }
  };

  const online = agentStatus?.status === 'online';

  return (
    <div className="card fixed bottom-24 right-4 z-[900] flex h-[460px] w-[330px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden animate-rise">
      <div className="flex items-center justify-between border-b border-line/15 px-4 py-3">
        <div>
          <div className="font-display text-sm font-bold">{t.chat.title}</div>
          <div className={`flex items-center gap-1.5 text-[11px] ${online ? 'text-mint' : 'text-faint'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-mint animate-pulseDot' : 'bg-faint'}`} />
            {online ? t.chat.online : t.chat.offline}
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost !px-2 !py-1.5" aria-label={t.close}>
          <X size={14} />
        </button>
      </div>

      {!chat ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-faint">{t.chat.intro}</p>
          <button onClick={start} className="btn-amber">{t.chat.start}</button>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {messages.map((m) => {
              // Mesazh sistemi (p.sh. "Mirë se vini...") - në qendër, i zbehtë.
              if (m.senderType === 'system') {
                return (
                  <div key={m.id} className="mx-auto max-w-[90%] py-1 text-center text-[11px] text-faint">
                    {m.text}
                  </div>
                );
              }
              const mine = m.senderType === 'user';
              return (
                <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  {/* Etiketa e dërguesit: e qartë kush shkroi */}
                  <span
                    className={`mb-0.5 px-1 text-[10px] font-bold uppercase tracking-wide ${mine ? 'text-cyan' : 'text-amber'
                      }`}
                  >
                    {mine ? 'Ju' : '🎧 Agjenti'}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${mine
                        ? 'bg-cyan text-[#04222B] rounded-br-sm'
                        : 'border border-amber/40 bg-amber/15 text-ink rounded-bl-sm'
                      }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          {chat.status === 'closed' ? (
            /* Agjenti e mbylli bisedën - ofro fillimin e një bisede të re. */
            <div className="space-y-2 border-t border-line/15 p-3 text-center">
              <p className="text-xs text-faint">Kjo bisedë u mbyll nga agjenti.</p>
              <button
                onClick={() => { setChat(null); setMessages([]); }}
                className="btn-amber w-full !py-2 text-xs"
              >
                Fillo bisedë të re
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={send} className="flex items-center gap-2 border-t border-line/15 p-2.5">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t.chat.placeholder}
                  className="input !py-2 text-sm"
                />
                <button type="submit" className="btn-amber !px-3 !py-2" aria-label={t.chat.send}>
                  <Send size={15} />
                </button>
              </form>
              <button onClick={close} className="border-t border-line/15 py-2 text-[11px] font-medium text-faint hover:text-rose">
                {t.chat.closeChat}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
