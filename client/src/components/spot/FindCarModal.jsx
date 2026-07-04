import { useState } from 'react';
import { t } from '../../i18n/sq.js';
import { Modal } from '../ui/Modal.jsx';
import { PlateInput } from './PlateInput.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { findCar } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';

// "Gjej veturën time": kërkon rezervimin aktiv me targë (seksioni 9).
export function FindCarModal({ open, onClose, onFound }) {
  const toast = useToast();
  const [plate, setPlate] = useState(localStorage.getItem('ps_last_plate') || '');
  const [busy, setBusy] = useState(false);

  const search = async () => {
    if (!plate.trim()) { toast.error('Shkruani targën e makinës.'); return; }
    setBusy(true);
    try {
      const { reservation } = await findCar(plate);
      toast.success(`Vetura u gjet: ${reservation.zoneId} / Parkingu ${reservation.spotNumber}.`);
      onFound(reservation);
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t.findMyCar} subtitle="Shkruani targën për të gjetur rezervimin aktiv.">
      <form onSubmit={(e) => { e.preventDefault(); search(); }} className="space-y-4">
        <PlateInput value={plate} onChange={setPlate} />
        <button type="submit" disabled={busy} className="btn-mint w-full !py-3">
          {busy ? <Spinner size={15} /> : 'Kërko veturën'}
        </button>
      </form>
    </Modal>
  );
}
