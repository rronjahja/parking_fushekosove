import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ChatWindow } from './ChatWindow.jsx';
import { fetchAgentsStatus } from '../../api/endpoints.js';
import { usePolling } from '../../hooks/usePolling.js';

// Butoni lundrues i mbështetjes - i dukshëm kudo, nuk pengon hartën apo pagesën.
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [agentStatus, setAgentStatus] = useState(null);

  usePolling(() => fetchAgentsStatus().then(setAgentStatus).catch(() => {}), 10000);

  return (
    <>
      {open && <ChatWindow agentStatus={agentStatus} onClose={() => setOpen(false)} />}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-4 z-[901] flex h-14 w-14 items-center justify-center rounded-full bg-cyan text-[#04222B] shadow-glow transition-transform hover:scale-105"
        aria-label="Suporti Live"
      >
        <MessageCircle size={24} />
        <span
          className={`absolute right-0.5 top-0.5 h-3 w-3 rounded-full border-2 border-canvas ${
            agentStatus?.status === 'online' ? 'bg-mint' : 'bg-faint'
          }`}
        />
      </button>
    </>
  );
}
