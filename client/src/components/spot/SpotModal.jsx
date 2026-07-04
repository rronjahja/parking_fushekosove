import { useState, useEffect } from 'react';
import { t } from '../../i18n/sq.js';
import { euro } from '../../utils/format.js';
import { Modal } from '../ui/Modal.jsx';
import { PaymentTab } from './PaymentTab.jsx';
import { NavigationTab } from './NavigationTab.jsx';

// Modali i vendit të zgjedhur: dy seksione - Pagesa dhe Navigimi (seksioni 14).
export function SpotModal({
  open, onClose, zone, spot, tariffs, wallet,
  myReservation, onWalletRefresh, onReserved, initialTab = 'pagesa', savedPlate = '',
}) {
  const [tab, setTab] = useState(initialTab);
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab, spot?.id]);

  if (!spot) return null;
  const isFree = spot.status === 'free';
  const mineHere =
    myReservation && myReservation.zoneId === zone.id && myReservation.spotNumber === spot.number
      ? myReservation
      : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${t.zone} ${zone.id} · Parkingu ${spot.number}`}
      subtitle={t.manageLine}
      right={
        wallet && (
          <div className="text-right text-xs leading-tight">
            <div className="font-mono font-bold text-cyan">{wallet.balanceCredits} {t.credits}</div>
            <div className="text-faint">{t.worth} {euro(wallet.equivalentEuroCents)}</div>
          </div>
        )
      }
    >
      {spot.type === 'accessible' && (
        <div className="mb-3 rounded-xl border border-azure/40 bg-azure/10 px-4 py-2.5 text-xs font-medium text-[#7EB0FF]">
          ♿ {t.accessibleSpot}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => setTab('navigimi')}
          className={`btn !py-2.5 ${tab === 'navigimi' ? 'bg-cyan text-[#04222B]' : 'btn-ghost'}`}
        >
          {t.navigation}
        </button>
        <button
          onClick={() => setTab('pagesa')}
          disabled={!isFree && !mineHere}
          className={`btn !py-2.5 ${tab === 'pagesa' ? 'bg-amber text-[#2B1A02]' : 'btn-ghost'}`}
        >
          {t.payment}
        </button>
      </div>

      {tab === 'pagesa' && isFree && (
        <PaymentTab
          zone={zone}
          spot={spot}
          tariffs={tariffs}
          wallet={wallet}
          savedPlate={savedPlate}
          onWalletRefresh={onWalletRefresh}
          onReserved={(r) => { onReserved(r); onClose(); }}
        />
      )}
      {tab === 'pagesa' && !isFree && (
        <div className="rounded-xl border border-rose/35 bg-rose/10 px-4 py-3 text-sm text-rose">
          {mineHere ? 'Ky vend është i rezervuar nga ju.' : t.spotTaken}
        </div>
      )}
      {tab === 'navigimi' && (
        <NavigationTab
          spot={spot}
          myReservation={mineHere}
          onBack={() => setTab('pagesa')}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
