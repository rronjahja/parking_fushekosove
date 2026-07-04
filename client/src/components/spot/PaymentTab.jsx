import { useEffect, useState } from 'react';
import { MessageSquare, CreditCard, Landmark, PlusCircle } from 'lucide-react';
import { t } from '../../i18n/sq.js';
import { euro } from '../../utils/format.js';
import { DurationPicker } from './DurationPicker.jsx';
import { PlateInput } from './PlateInput.jsx';
import { TopUpModal } from './TopUpModal.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { payAndReserve } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';

const METHOD_META = [
  { key: 'sms', label: t.methods.sms, icon: MessageSquare, activeCls: 'bg-violet-500 text-white' },
  { key: 'terminal', label: t.methods.terminal, icon: Landmark, activeCls: 'bg-cyan text-[#04222B]' },
  { key: 'credits', label: t.methods.credits, icon: CreditCard, activeCls: 'bg-purple-600 text-white ring-2 ring-amber' },
];

// Seksioni "Pagesa": kohëzgjatja, targa, metoda, totali dhe Paguaj & Rezervo.
// Butoni kryesor mbrohet nga klikimet e dyfishta (disabled gjatë procesimit).
export function PaymentTab({ zone, spot, tariffs, wallet, savedPlate = '', onWalletRefresh, onReserved }) {
  const toast = useToast();
  const [durationKey, setDurationKey] = useState(tariffs[0]?.key);
  const [plate, setPlate] = useState(savedPlate || localStorage.getItem('ps_last_plate') || '');
  const [foreignPlate, setForeignPlate] = useState(false);
  // Nëse tarifat mbërrijnë pas hapjes së modalit, zgjidh automatikisht të parën.
  useEffect(() => {
    if (!durationKey && tariffs[0]) setDurationKey(tariffs[0].key);
  }, [tariffs, durationKey]);
  useEffect(() => {
    if (savedPlate) setPlate(savedPlate);
  }, [savedPlate]);
  const [method, setMethod] = useState('credits');
  const [busy, setBusy] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const tariff = tariffs.find((x) => x.key === durationKey);
  const insufficient = method === 'credits' && wallet && tariff && wallet.balanceCredits < tariff.credits;

  const submit = async () => {
    if (!plate.trim()) { toast.error('Shkruani targën e makinës.'); return; }
    if (insufficient) { toast.error('Bilanci i krediteve nuk mjafton. Rimbushni kreditet.'); return; }
    setBusy(true);
    try {
      const { reservation } = await payAndReserve({
        zoneId: zone.id, spotNumber: spot.number, plate, durationKey, method,
      });
      localStorage.setItem('ps_last_plate', reservation.plate);
      toast.success(`Rezervimi u krijua: ${zone.id} / Parkingu ${spot.number} (${reservation.durationLabel}).`);
      onReserved(reservation);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <DurationPicker tariffs={tariffs} value={durationKey} onChange={setDurationKey} />
      <PlateInput value={plate} onChange={setPlate} foreign={foreignPlate} onForeignChange={setForeignPlate} />

      <div>
        <label className="label">{t.payMethod}</label>
        <div className="grid grid-cols-3 gap-2">
          {METHOD_META.map(({ key, label, icon: Icon, activeCls }) => (
            <button
              key={key}
              onClick={() => setMethod(key)}
              className={`btn !py-2.5 text-xs ${method === key ? activeCls : 'bg-raised border border-line/25 text-ink hover:border-line/45'
                }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {method === 'credits' && wallet && (
        <div className="flex items-center justify-between rounded-xl border border-mint/30 bg-mint/10 px-4 py-3">
          <div className="text-sm">
            <div className="text-xs text-faint">{t.currentBalance}</div>
            <div className="font-mono font-bold text-mint">
              {wallet.balanceCredits} kredi ({euro(wallet.equivalentEuroCents)})
            </div>
          </div>
          <button onClick={() => setTopUpOpen(true)} className="btn-mint !py-2 text-xs">
            <PlusCircle size={14} /> {t.topUp}
          </button>
        </div>
      )}
      {method === 'sms' && (
        <p className="rounded-xl bg-raised px-4 py-3 text-xs text-faint">
          Pagesa me SMS konfirmohet nga operatori mobil. (Integrimi demo — konfirmohet automatikisht.)
        </p>
      )}
      {method === 'terminal' && (
        <p className="rounded-xl bg-raised px-4 py-3 text-xs text-faint">
          Pagesa kryhet në aparatin fizik pranë parkingut. (Integrimi demo — konfirmohet automatikisht.)
        </p>
      )}

      <div className="flex items-center justify-between rounded-xl bg-raised px-4 py-3 text-sm">
        <span className="text-faint">{t.total}</span>
        <span className="font-mono text-lg font-bold text-ink">{tariff ? euro(tariff.euroCents) : '—'}</span>
      </div>

      <button onClick={submit} disabled={busy || insufficient} className="btn-mint w-full !py-3 text-base">
        {busy ? <Spinner size={16} /> : t.payAndReserve}
      </button>
      {insufficient && (
        <p className="text-center text-xs text-rose">
          Kërkohen {tariff.credits} kredi — keni {wallet.balanceCredits}. Rimbushni për të vazhduar.
        </p>
      )}

      <TopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} onDone={onWalletRefresh} />
    </div>
  );
}
