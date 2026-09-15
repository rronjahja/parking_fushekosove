import { useEffect, useState } from 'react';
import { t } from '../i18n/sq.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { usePolling } from '../hooks/usePolling.js';
import {
  fetchZones, fetchZoneSpots, fetchTariffs, fetchWallet, fetchMyReservations,
} from '../api/endpoints.js';
import { Header } from '../components/layout/Header.jsx';
import { InfoBanner } from '../components/layout/InfoBanner.jsx';
import { Footer } from '../components/layout/Footer.jsx';
import { ZonePicker } from '../components/zones/ZonePicker.jsx';
import { ZonePanel } from '../components/zones/ZonePanel.jsx';
import { ParkingMap } from '../components/map/ParkingMap.jsx';
import { SpotModal } from '../components/spot/SpotModal.jsx';
import { FindCarModal } from '../components/spot/FindCarModal.jsx';
import { ChatWidget } from '../components/chat/ChatWidget.jsx';
import { AdminDashboard } from '../components/admin/AdminDashboard.jsx';
import { useNavigate } from 'react-router-dom';
import { fetchProfile } from '../api/endpoints.js';

// Faqja kryesore publike: zonat, harta live, zgjedhja e vendit, pagesa,
// navigimi, "Gjej veturën time" dhe chat-i i mbështetjes.
export function HomePage() {
  const { ready, isAuthed, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [zones, setZones] = useState([]);
  const [activeZoneId, setActiveZoneId] = useState(null);
  const [zoneData, setZoneData] = useState(null); // { zone, spots }
  const [tariffs, setTariffs] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [myReservations, setMyReservations] = useState([]);

  const [selectedNumber, setSelectedNumber] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('pagesa');
  const [findOpen, setFindOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const [pendingFocus, setPendingFocus] = useState(null);
  const [savedPlate, setSavedPlate] = useState('');

  // Tarifat merren një herë - burimi autoritar mbetet backend-i.
  useEffect(() => {
    fetchTariffs().then((d) => setTariffs(d.tariffs)).catch(() => { });
  }, []);

  // Targa e ruajtur e përdoruesit (për mbushje automatike gjatë rezervimit).
  useEffect(() => {
    if (!isAuthed) { setSavedPlate(''); return; }
    fetchProfile().then((d) => setSavedPlate(d.user.savedPlate || '')).catch(() => { });
  }, [isAuthed]);

  // Rifreskimi automatik çdo 2 sekonda: zonat + vendet e zonës aktive.
  usePolling(() => {
    fetchZones()
      .then((d) => {
        setZones(d.zones);
        setActiveZoneId((prev) => prev || d.zones[0]?.id || null);
      })
      .catch(() => { });
  }, 2000);

  usePolling(() => {
    if (!activeZoneId) return;
    fetchZoneSpots(activeZoneId).then(setZoneData).catch(() => { });
  }, 2000, [activeZoneId]);

  // Kuleta dhe rezervimet e mia (kërkojnë identitetin e sesionit).
  const refreshPersonal = () => {
    fetchWallet().then((d) => setWallet(d.wallet)).catch(() => { });
    fetchMyReservations().then((d) => setMyReservations(d.reservations)).catch(() => { });
  };
  usePolling(refreshPersonal, 5000, [ready, isAuthed], ready);

  const totals = zones.length
    ? zones.reduce(
      (acc, z) => ({
        totalSpots: acc.totalSpots + z.totalSpots,
        freeSpots: acc.freeSpots + z.freeSpots,
      }),
      { totalSpots: 0, freeSpots: 0 }
    )
    : null; // gjatë ngarkimit të parë shfaqet "—" në vend të "0 / 0"

  const spots = zoneData?.zone?.id === activeZoneId ? zoneData.spots : [];
  const zone = zoneData?.zone?.id === activeZoneId ? zoneData.zone : null;
  const selectedSpot = spots.find((s) => s.number === selectedNumber) || null;
  const myReservationHere = (n) =>
    myReservations.find((r) => r.zoneId === activeZoneId && r.spotNumber === n) || null;

  // Fokus i shtyrë: pas "Gjej veturën" ose banderolës - pret të ngarkohet zona.
  useEffect(() => {
    if (!pendingFocus || zoneData?.zone?.id !== pendingFocus.zoneId) return;
    const spot = zoneData.spots.find((s) => s.number === pendingFocus.number);
    if (spot) {
      setSelectedNumber(spot.number);
      setFlyTarget({ center: { lat: spot.lat, lng: spot.lng }, zoom: 20 });
      setModalTab(pendingFocus.tab);
      setModalOpen(true);
    }
    setPendingFocus(null);
  }, [pendingFocus, zoneData]);

  const changeZone = (id) => {
    setActiveZoneId(id);
    setSelectedNumber(null);
    setFlyTarget(null);
    setZoneData(null);
    fetchZoneSpots(id).then(setZoneData).catch(() => { });
  };

  const openSpot = (spot, tab = 'pagesa') => {
    setSelectedNumber(spot.number);
    setFlyTarget({ center: { lat: spot.lat, lng: spot.lng }, zoom: 20 });
    setModalTab(spot.status === 'free' ? tab : 'navigimi');
    setModalOpen(true);
    if (spot.status !== 'free' && !myReservationHere(spot.number)) toast.info(t.spotTaken);
  };

  // Zgjedhja me numër nga fusha "Parkingu" (validimet e seksionit 7).
  const selectByNumber = (value) => {
    if (!value.trim()) { toast.error('Shkruani numrin e parkingut.'); return; }
    const n = Number(value);
    const spot = spots.find((s) => s.number === n);
    if (!spot) {
      toast.error(`Parkingu ${n} nuk ekziston në zonën ${activeZoneId}.`);
      return;
    }
    openSpot(spot);
  };

  const focusReservation = (r, tab = 'navigimi') => {
    if (r.zoneId !== activeZoneId) changeZone(r.zoneId);
    setPendingFocus({ zoneId: r.zoneId, number: r.spotNumber, tab });
  };

  const onReserved = (reservation) => {
    setMyReservations((list) => [reservation, ...list]);
    setSelectedNumber(null);
    refreshPersonal();
    if (activeZoneId) fetchZoneSpots(activeZoneId).then(setZoneData).catch(() => { });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-3 pt-4 sm:px-5">
      <Header totals={totals} onOpenAdmin={() => setAdminOpen(true)} />
      <InfoBanner />

      <div className="grid gap-4 lg:grid-cols-[380px,1fr] lg:items-start">
        <div className="space-y-4">
          <ZonePicker zones={zones} activeId={activeZoneId} onSelect={changeZone} />
          <ZonePanel
            zone={zone || zones.find((z) => z.id === activeZoneId)}
            spots={spots}
            myReservation={myReservations[0] || null}
            onSelectNumber={selectByNumber}
            onFindCar={() => setFindOpen(true)}
            onJumpToReservation={(r) => focusReservation(r)}
          />
        </div>

        <ParkingMap
          zone={zone}
          spots={spots}
          selectedNumber={selectedNumber}
          onSpotClick={(s) => openSpot(s)}
          onDeselect={() => setSelectedNumber(null)}
          flyTarget={flyTarget}
          heightClass="h-[58dvh] min-h-[320px] sm:h-[520px] lg:h-[620px]"
        />
      </div>

      <Footer />

      {zone && selectedSpot && (
        <SpotModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          zone={zone}
          spot={selectedSpot}
          tariffs={tariffs}
          wallet={wallet}
          savedPlate={savedPlate}
          myReservation={myReservationHere(selectedSpot.number)}
          onWalletRefresh={(w) => (w ? setWallet(w) : refreshPersonal())}
          onReserved={onReserved}
          initialTab={modalTab}
        />
      )}
      <FindCarModal open={findOpen} onClose={() => setFindOpen(false)} onFound={focusReservation} />
      {isAuthed && <ChatWidget />}
      {isAdmin && <AdminDashboard open={adminOpen} onClose={() => setAdminOpen(false)} />}
    </div>
  );
}