import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Hammer } from 'lucide-react';
import {
  fetchZones, fetchZoneSpots, createZone, updateZone, deleteZone, saveZoneLayout,
} from '../api/endpoints.js';
import { useToast } from '../context/ToastContext.jsx';
import { destination } from '../utils/geometry.js';
import { BuilderSidebar } from '../components/builder/BuilderSidebar.jsx';
import { BuilderMap } from '../components/builder/BuilderMap.jsx';

// ─── Ndërtuesi i parkingjeve (vetëm SUPERADMIN) ─────────────────────────────
// Vegël vizuale drag & drop për konfigurimin e zonave dhe vendeve:
//  • zvarrit vendet për t'i zhvendosur; kliko për të zgjedhur
//  • "Shto vende": kliko në hartë për të vendosur vende të reja
//  • ndrysho numrin, llojin (Standard / Invalid ♿) dhe këndin e çdo vendi
//  • krijo zona të reja (P7, P8...), riemërto ose fshij zona ekzistuese
//  • VENDOS QENDRËN & ZOOM-IN fillestar të zonës (pamja kur hapet harta)
//  • ndryshimet e vendeve ruhen me "Ruaj ndryshimet"; qendra/zoom ruhen menjëherë

let tempId = -1; // vendet e reja marrin ID negative derisa të ruhen

const toLocal = (s) => ({ ...s, localId: s.id });

export function BuilderPage() {
  const toast = useToast();
  const [zones, setZones] = useState([]);
  const [zoneId, setZoneId] = useState(null);
  const [zone, setZone] = useState(null);
  const [spots, setSpots] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [mode, setMode] = useState('select');
  const [newType, setNewType] = useState('standard');
  const [newAngle, setNewAngle] = useState(0);
  const [selectedLocalId, setSelectedLocalId] = useState(null);

  // Gjendja live e hartës (qendra + zoom) - përditësohet nga BuilderMap.
  const mapCenterRef = useRef(null);
  const mapZoomRef = useRef(null);

  const loadZones = async (preferId) => {
    const { zones: zs } = await fetchZones();
    setZones(zs);
    const id = preferId && zs.some((z) => z.id === preferId) ? preferId : zs[0]?.id || null;
    setZoneId(id);
    return id;
  };

  const loadSpots = async (id) => {
    if (!id) { setZone(null); setSpots([]); return; }
    const data = await fetchZoneSpots(id);
    setZone(data.zone);
    setSpots(data.spots.map(toLocal));
    setDirty(false);
    setSelectedLocalId(null);
  };

  useEffect(() => { loadZones().then(loadSpots).catch((e) => toast.error(e.message)); }, []); // eslint-disable-line

  const guardDirty = () =>
    !dirty || window.confirm('Keni ndryshime të paruajtura. Të vazhdohet pa i ruajtur?');

  const switchZone = async (id) => {
    if (!guardDirty()) return;
    setZoneId(id);
    await loadSpots(id).catch((e) => toast.error(e.message));
  };

  // ── Veprimet mbi vendet (gjendje lokale; ruhen me "Ruaj") ──
  const selectedSpot = spots.find((s) => s.localId === selectedLocalId) || null;
  const nextNumber = () => (spots.length ? Math.max(...spots.map((s) => s.number)) + 1 : 1);

  const addAt = (latlng) => {
    const spot = {
      localId: tempId--,
      id: null,
      number: nextNumber(),
      type: newType,
      status: 'free',
      lat: latlng.lat,
      lng: latlng.lng,
      angleDeg: newAngle,
    };
    setSpots((list) => [...list, spot]);
    setSelectedLocalId(spot.localId);
    setDirty(true);
  };

  const moveSpot = (localId, lat, lng) => {
    setSpots((list) => list.map((s) => (s.localId === localId ? { ...s, lat, lng } : s)));
    setDirty(true);
  };

  const updateSelected = (patch) => {
    if (!selectedSpot) return;
    setSpots((list) => list.map((s) => (s.localId === selectedLocalId ? { ...s, ...patch } : s)));
    setDirty(true);
  };

  const deleteSelected = () => {
    if (!selectedSpot) return;
    if (selectedSpot.status !== 'free' && !window.confirm('Vendi ka rezervim aktiv. Ta fshini megjithatë? (Backend-i do ta refuzojë nëse rezervimi është ende aktiv.)')) return;
    setSpots((list) => list.filter((s) => s.localId !== selectedLocalId));
    setSelectedLocalId(null);
    setDirty(true);
  };

  // Shton 5 vende në rresht: nis nga vendi i zgjedhur (ose qendra e hartës)
  // dhe i rendit anash njëri-tjetrit sipas këndit aktual (hapi 2.7 m).
  const addRow = () => {
    const originSpot = selectedSpot;
    const start = originSpot
      ? { lat: originSpot.lat, lng: originSpot.lng }
      : mapCenterRef.current || (zone && zone.mapCenter);
    if (!start) return;
    const angle = originSpot ? originSpot.angleDeg : newAngle;
    const type = originSpot ? originSpot.type : newType;
    let n = nextNumber();
    const created = [];
    for (let i = 1; i <= 5; i++) {
      const p = destination(start.lat, start.lng, angle + 90, 2.7 * i);
      created.push({
        localId: tempId--, id: null, number: n++, type, status: 'free',
        lat: p.lat, lng: p.lng, angleDeg: angle,
      });
    }
    setSpots((list) => [...list, ...created]);
    setDirty(true);
    toast.info('U shtuan 5 vende në rresht.');
  };

  const renumber = () => {
    const ordered = [...spots].sort((a, b) => a.number - b.number);
    setSpots(ordered.map((s, i) => ({ ...s, number: i + 1 })));
    setDirty(true);
  };

  // ── Ruajtja e strukturës (vendet) ──
  const save = async () => {
    const numbers = spots.map((s) => s.number);
    if (new Set(numbers).size !== numbers.length) {
      toast.error('Ka numra të përsëritur. Përdorni "Rinumëro sipas radhës".');
      return;
    }
    setSaving(true);
    try {
      const payload = spots.map((s) => ({
        ...(s.id ? { id: s.id } : {}),
        number: s.number, type: s.type, lat: s.lat, lng: s.lng, angleDeg: s.angleDeg,
      }));
      await saveZoneLayout(zoneId, payload);
      toast.success(`Struktura e zonës ${zoneId} u ruajt (${spots.length} vende).`);
      await loadSpots(zoneId);
      await loadZones(zoneId);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const revert = async () => {
    if (!window.confirm('Të rikthehen ndryshimet e paruajtura?')) return;
    await loadSpots(zoneId).catch((e) => toast.error(e.message));
  };

  // ── Zonat ──
  const newZone = async () => {
    if (!guardDirty()) return;
    const nums = zones.map((z) => Number(z.id.replace(/\D/g, '')) || 0);
    const suggested = `P${Math.max(0, ...nums) + 1}`;
    const id = window.prompt('ID e zonës së re (p.sh. P7):', suggested);
    if (!id) return;
    const name = window.prompt('Emri i zonës:', 'Zona e re');
    if (name === null) return;
    const center = mapCenterRef.current || zone?.mapCenter;
    const zoom = Math.round(mapZoomRef.current || zone?.zoomLevel || 19);
    try {
      await createZone({
        id: id.trim().toUpperCase(), name: name.trim() || id,
        lat: center.lat, lng: center.lng, zoom,
      });
      toast.success(`Zona ${id.toUpperCase()} u krijua. Tani shtoni vendet me "Shto vende".`);
      const newId = await loadZones(id.trim().toUpperCase());
      await loadSpots(newId);
      setMode('add');
    } catch (e) { toast.error(e.message); }
  };

  const renameZone = async () => {
    if (!zone) return;
    const name = window.prompt('Emri i ri i zonës:', zone.name);
    if (!name) return;
    try {
      await updateZone(zoneId, { name: name.trim() });
      toast.success('Zona u riemërtua.');
      await loadZones(zoneId);
      setZone((z) => ({ ...z, name: name.trim() }));
    } catch (e) { toast.error(e.message); }
  };

  // ★ VENDOS QENDRËN & ZOOM-IN fillestar të zonës te pamja aktuale e hartës.
  //   Ruhet menjëherë (nuk kërkon "Ruaj ndryshimet"). Kjo është pamja që
  //   përdoruesit do të shohin kur hapin këtë zonë në faqen kryesore.
  const setZoneViewHere = async () => {
    if (!zone) return;
    const c = mapCenterRef.current || zone.mapCenter;
    const zoom = Math.round(mapZoomRef.current || zone.zoomLevel || 19);
    try {
      await updateZone(zoneId, { lat: c.lat, lng: c.lng, zoom });
      toast.success(`Qendra dhe zoom-i i zonës ${zoneId} u ruajtën (zoom ${zoom}).`);
      setZone((z) => ({ ...z, mapCenter: { lat: c.lat, lng: c.lng }, zoomLevel: zoom }));
      await loadZones(zoneId);
    } catch (e) { toast.error(e.message); }
  };

  const removeZone = async () => {
    if (!zone) return;
    if (!window.confirm(`Të fshihet zona ${zoneId} me gjithë vendet e saj? Ky veprim nuk kthehet.`)) return;
    try {
      await deleteZone(zoneId);
      toast.success(`Zona ${zoneId} u fshi.`);
      const id = await loadZones();
      await loadSpots(id);
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-3 pt-4 sm:px-5">
      <header className="card-pad flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold">
            <Hammer size={20} className="text-cyan" /> Ndërtuesi i Parkingjeve
          </h1>
          <p className="text-sm text-faint">
            Zvarrit vendet, shto të reja me klikim, cakto qendrën/zoom-in e zonës - pastaj "Ruaj ndryshimet".
          </p>
        </div>
        <Link to="/" className="btn-ghost text-xs"><ArrowLeft size={14} /> Harta</Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-[340px,1fr] lg:items-start">
        <BuilderSidebar
          zones={zones}
          zoneId={zoneId}
          onZoneChange={switchZone}
          onNewZone={newZone}
          onRenameZone={renameZone}
          onDeleteZone={removeZone}
          onSetZoneViewHere={setZoneViewHere}
          mode={mode}
          onMode={setMode}
          newType={newType}
          onNewType={setNewType}
          newAngle={newAngle}
          onNewAngle={setNewAngle}
          selectedSpot={selectedSpot}
          onUpdateSelected={updateSelected}
          onDeleteSelected={deleteSelected}
          spotCount={spots.length}
          dirty={dirty}
          saving={saving}
          onSave={save}
          onRevert={revert}
          onRenumber={renumber}
          onAddRow={addRow}
        />

        {zone ? (
          <div className="h-[560px] lg:h-[680px]">
            <BuilderMap
              zone={zone}
              spots={spots}
              selectedLocalId={selectedLocalId}
              mode={mode}
              onSelect={setSelectedLocalId}
              onMove={moveSpot}
              onAddAt={addAt}
              onMapCenter={(c) => { mapCenterRef.current = c; }}
              onMapZoom={(z) => { mapZoomRef.current = z; }}
              onDeselect={() => setSelectedLocalId(null)}
            />
          </div>
        ) : (
          <div className="card flex h-[560px] items-center justify-center text-sm text-faint">
            Krijoni një zonë për të filluar.
          </div>
        )}
      </div>
    </div>
  );
}