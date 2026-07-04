import { useState } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { topUpWallet } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';

const AMOUNTS = [2, 5, 10, 20, 50];

// Rimbushja e krediteve. Forma e kartelës është VETËM demonstrim vizual -
// pagesa reale me kartelë është placeholder në backend (payments/card.gateway.js).
export function TopUpModal({ open, onClose, onDone }) {
  const toast = useToast();
  const [euroAmount, setEuroAmount] = useState(5);
  const [card, setCard] = useState({ name: '', number: '', exp: '', cvv: '' });
  const [busy, setBusy] = useState(false);

  const pay = async () => {
    if (!card.name || !card.number || !card.exp || !card.cvv) {
      toast.error('Plotësoni të dhënat e kartelës.');
      return;
    }
    setBusy(true);
    try {
      const { wallet, added } = await topUpWallet(euroAmount);
      toast.success(`U shtuan ${added} kredite. Bilanci: ${wallet.balanceCredits} kredi.`);
      onDone?.(wallet);
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const field = (key, placeholder, extra = {}) => (
    <input
      className="input"
      placeholder={placeholder}
      value={card[key]}
      onChange={(e) => setCard((c) => ({ ...c, [key]: e.target.value }))}
      {...extra}
    />
  );

  return (
    <Modal open={open} onClose={onClose} title="Rimbush kredi" subtitle="Zgjidh shumën dhe plotëso të dhënat e kartelës.">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => setEuroAmount(a)}
              className={`rounded-xl px-4 py-2.5 font-display text-sm font-bold transition-all ${
                euroAmount === a
                  ? 'bg-amber text-[#2B1A02]'
                  : 'bg-raised border border-line/25 hover:border-line/45'
              }`}
            >
              {a}€
            </button>
          ))}
        </div>

        <div>
          <label className="label">Emri në kartelë</label>
          {field('name', 'p.sh. Filan Fisteku')}
        </div>
        <div>
          <label className="label">Numri i kartelës</label>
          {field('number', 'XXXX XXXX XXXX XXXX', { inputMode: 'numeric', maxLength: 19 })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Skadenca</label>
            {field('exp', 'MM/VV', { maxLength: 5 })}
          </div>
          <div>
            <label className="label">CVV</label>
            {field('cvv', '123', { inputMode: 'numeric', maxLength: 4 })}
          </div>
        </div>

        <div className="rounded-xl bg-raised px-4 py-3 text-sm">
          Do të shtohen <b className="text-cyan">{euroAmount * 100} kredi</b> me vlerë <b>{euroAmount}.00€</b>
        </div>
        <p className="text-[11px] text-faint">
          Demo: pagesa me kartelë nuk është e lidhur ende me procesuesin — të dhënat nuk dërgohen askund.
        </p>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Mbyll</button>
          <button onClick={pay} disabled={busy} className="btn-mint flex-1">
            {busy ? <Spinner size={15} /> : 'Paguaj'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
