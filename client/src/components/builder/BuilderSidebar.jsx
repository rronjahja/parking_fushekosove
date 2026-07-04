import {
  MousePointer2, PlusSquare, Save, RotateCcw, Trash2, ListOrdered, Rows3,
  Accessibility, Car, Crosshair,
} from 'lucide-react';
import { Spinner } from '../ui/Spinner.jsx';

// Paneli anësor i Ndërtuesit: zgjedhja e zonës, qendra/zoom, veglat, vetitë e
// vendit të zgjedhur dhe veprimet (Ruaj / Rikthe / Rinumëro / Shto rresht).
export function BuilderSidebar({
  zones, zoneId, onZoneChange, onNewZone, onRenameZone, onDeleteZone, onSetZoneViewHere,
  mode, onMode, newType, onNewType, newAngle, onNewAngle,
  selectedSpot, onUpdateSelected, onDeleteSelected,
  spotCount, dirty, saving, onSave, onRevert, onRenumber, onAddRow,
}) {
  return (
    <aside className="space-y-4">
      {/* Zona */}
      <section className="card-pad space-y-3">
        <h2 className="label !mb-0">Zona</h2>
        <div className="flex gap-2">
          <select value={zoneId || ''} onChange={(e) => onZoneChange(e.target.value)} className="input">
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.id} · {z.name}</option>
            ))}
          </select>
          <button onClick={onNewZone} className="btn-primary shrink-0 !px-3" title="Zonë e re">+</button>
        </div>

        {/* ★ Cakto pamjen fillestare të zonës (qendra + zoom) te harta aktuale */}
        <button onClick={onSetZoneViewHere} className="btn-amber w-full !py-2 text-xs">
          <Crosshair size={14} /> Vendos qendrën & zoom-in këtu
        </button>
        <p className="text-[11px] text-faint">
          Zhvendos/zmadho hartën te pamja që dëshiron, pastaj kliko këtë. Kjo është pamja
          që shfaqet kur hapet kjo zonë (ruhet menjëherë).
        </p>

        <div className="flex gap-2">
          <button onClick={onRenameZone} className="btn-ghost flex-1 !py-2 text-xs">Riemërto</button>
          <button onClick={onDeleteZone} className="btn-danger flex-1 !py-2 text-xs">
            <Trash2 size={13} /> Fshij zonën
          </button>
        </div>
      </section>

      {/* Veglat */}
      <section className="card-pad space-y-3">
        <h2 className="label !mb-0">Veglat</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onMode('select')}
            className={`btn !py-2.5 text-xs ${mode === 'select' ? 'bg-cyan text-[#04222B]' : 'btn-ghost'}`}
          >
            <MousePointer2 size={14} /> Zgjidh / Zvarrit
          </button>
          <button
            onClick={() => onMode('add')}
            className={`btn !py-2.5 text-xs ${mode === 'add' ? 'bg-amber text-[#2B1A02]' : 'btn-ghost'}`}
          >
            <PlusSquare size={14} /> Shto vende
          </button>
        </div>

        <div>
          <span className="label">Lloji i vendeve të reja</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onNewType('standard')}
              className={`btn !py-2 text-xs ${newType === 'standard' ? 'bg-mint text-[#03291B]' : 'btn-ghost'}`}
            >
              <Car size={14} /> Standard
            </button>
            <button
              onClick={() => onNewType('accessible')}
              className={`btn !py-2 text-xs ${newType === 'accessible' ? 'bg-azure text-white' : 'btn-ghost'}`}
            >
              <Accessibility size={14} /> Aftësi të kufizuara
            </button>
          </div>
        </div>

        <div>
          <span className="label">Këndi i vendeve të reja: {newAngle}°</span>
          <input
            type="range" min="0" max="359" value={newAngle}
            onChange={(e) => onNewAngle(Number(e.target.value))}
            className="w-full accent-cyan"
          />
        </div>

        <button onClick={onAddRow} className="btn-ghost w-full !py-2 text-xs">
          <Rows3 size={14} /> Shto 5 vende në rresht
        </button>
      </section>

      {/* Vendi i zgjedhur */}
      <section className="card-pad space-y-3">
        <h2 className="label !mb-0">Vendi i zgjedhur</h2>
        {!selectedSpot ? (
          <p className="text-xs text-faint">Kliko një vend në hartë për ta ndryshuar, ose zvarrite për ta zhvendosur.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="label">Numri</span>
                <input
                  type="number" min="1" value={selectedSpot.number}
                  onChange={(e) => onUpdateSelected({ number: Number(e.target.value) || 1 })}
                  className="input font-mono"
                />
              </div>
              <div>
                <span className="label">Lloji</span>
                <button
                  onClick={() =>
                    onUpdateSelected({ type: selectedSpot.type === 'standard' ? 'accessible' : 'standard' })
                  }
                  className={`btn w-full !py-2.5 text-xs ${selectedSpot.type === 'accessible' ? 'bg-azure text-white' : 'bg-mint text-[#03291B]'
                    }`}
                >
                  {selectedSpot.type === 'accessible' ? '♿ Aftësi të kufizuara' : 'Standard'}
                </button>
              </div>
            </div>
            <div>
              <span className="label">Këndi: {selectedSpot.angleDeg}°</span>
              <input
                type="range" min="0" max="359" value={selectedSpot.angleDeg}
                onChange={(e) => onUpdateSelected({ angleDeg: Number(e.target.value) })}
                className="w-full accent-amber"
              />
            </div>
            <div className="font-mono text-[11px] text-faint">
              {selectedSpot.lat.toFixed(6)}, {selectedSpot.lng.toFixed(6)}
            </div>
            <button onClick={onDeleteSelected} className="btn-danger w-full !py-2 text-xs">
              <Trash2 size={13} /> Fshij vendin
            </button>
          </>
        )}
      </section>

      {/* Veprimet */}
      <section className="card-pad space-y-2">
        <div className="flex items-center justify-between text-xs text-faint">
          <span>{spotCount} vende në zonë</span>
          {dirty && <span className="chip-amber">Ndryshime të paruajtura</span>}
        </div>
        <button onClick={onRenumber} className="btn-ghost w-full !py-2 text-xs">
          <ListOrdered size={14} /> Rinumëro sipas radhës (1…{spotCount})
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onRevert} disabled={!dirty} className="btn-ghost !py-2.5 text-xs">
            <RotateCcw size={14} /> Rikthe
          </button>
          <button onClick={onSave} disabled={!dirty || saving} className="btn-mint !py-2.5 text-xs">
            {saving ? <Spinner size={13} /> : <><Save size={14} /> Ruaj ndryshimet</>}
          </button>
        </div>
      </section>
    </aside>
  );
}