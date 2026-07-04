import {
  ParkingSquare, ParkingSquareOff, CalendarClock, CalendarX2,
  Euro, MessageSquare, MessageSquareOff, CreditCard, MessageCircle, Landmark,
} from 'lucide-react';
import { t } from '../../i18n/sq.js';
import { euro } from '../../utils/format.js';

function Card({ icon: Icon, label, value, sub, tone = 'text-cyan' }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-faint">
        <Icon size={15} className={tone} />
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 font-mono text-2xl font-bold">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-faint">{sub}</div>}
    </div>
  );
}

// Kartelat statistikore të panelit (seksioni 32).
export function StatCards({ summary }) {
  const pb = summary.paymentBreakdown || {};
  const fmt = (x) => `${x?.count ?? 0} · ${euro(x?.cents ?? 0)}`;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <Card icon={ParkingSquareOff} tone="text-rose" label={t.dash.occupiedSpots} value={summary.occupiedSpots} />
      <Card icon={ParkingSquare} tone="text-mint" label={t.dash.freeSpots} value={summary.freeSpots} />
      <Card icon={CalendarClock} label={t.dash.activeRes} value={summary.activeReservations} />
      <Card icon={CalendarX2} tone="text-faint" label={t.dash.expiredRes} value={summary.expiredReservations} />
      <Card icon={Euro} tone="text-amber" label={t.dash.revenue} value={euro(summary.totalRevenueCents)} />
      <Card icon={CreditCard} label="Pagesa me kredi" value={fmt(pb.credits)} />
      <Card icon={MessageCircle} label="Pagesa me SMS" value={fmt(pb.sms)} />
      <Card icon={Landmark} label="Pagesa në aparat" value={fmt(pb.terminal)} />
      <Card icon={MessageSquare} tone="text-mint" label={t.dash.activeChats} value={summary.activeSupportChats} />
      <Card icon={MessageSquareOff} tone="text-faint" label={t.dash.closedChats} value={summary.closedSupportChats} />
    </div>
  );
}
