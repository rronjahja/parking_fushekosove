import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft, User, Wallet, Car, MessageSquare, CheckCircle2, XCircle, Mail, Phone,
} from 'lucide-react';
import { fetchProfile, requestVerification, confirmVerification } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { euro, timeHM, dateDMY, methodLabel, statusLabel } from '../utils/format.js';

export function ProfilePage() {
    const { refreshUser } = useAuth();
    const toast = useToast();
    const [data, setData] = useState(null);
    const [tab, setTab] = useState('parkings');

    const load = () => fetchProfile().then(setData).catch((e) => toast.error(e.message));
    useEffect(() => { load(); }, []); // eslint-disable-line

    const verify = async (channel) => {
        try {
            const { devCode } = await requestVerification(channel);
            const code = window.prompt(
                `Shkruani kodin e dërguar (${channel === 'email' ? 'email' : 'SMS'}).` +
                (devCode ? `\n\n[Demo] Kodi juaj: ${devCode}` : ''),
                devCode || ''
            );
            if (!code) return;
            await confirmVerification(channel, code.trim());
            toast.success(`${channel === 'email' ? 'Email-i' : 'Telefoni'} u verifikua.`);
            await load();
            await refreshUser();
        } catch (e) { toast.error(e.message); }
    };

    if (!data) {
        return <div className="flex min-h-screen items-center justify-center"><Spinner size={26} /></div>;
    }

    const { user, wallet, reservations, chats } = data;
    const active = reservations.filter((r) => r.status === 'active' || r.status === 'pending');
    const past = reservations.filter((r) => r.status !== 'active' && r.status !== 'pending');

    const VerifyBadge = ({ ok, onClick, label }) =>
        ok ? (
            <span className="chip-mint"><CheckCircle2 size={12} /> {label} i verifikuar</span>
        ) : (
            <button onClick={onClick} className="chip-amber hover:brightness-110">
                <XCircle size={12} /> Verifiko {label.toLowerCase()}
            </button>
        );

    return (
        <div className="mx-auto max-w-4xl space-y-4 px-3 pt-4 sm:px-5">
            <header className="card-pad flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan/15 text-cyan">
                        <User size={20} />
                    </div>
                    <div>
                        <h1 className="font-display text-xl font-extrabold">{user.name}</h1>
                        <p className="text-xs text-faint">Anëtar që nga {dateDMY(user.createdAt)}</p>
                    </div>
                </div>
                <Link to="/" className="btn-ghost text-xs"><ArrowLeft size={14} /> Harta</Link>
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
                <section className="card-pad space-y-3">
                    <h2 className="label !mb-0">Të dhënat e llogarisë</h2>
                    <div className="flex items-center gap-2 text-sm">
                        <Mail size={15} className="text-faint" /> {user.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Phone size={15} className="text-faint" /> {user.phone}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                        <VerifyBadge ok={user.emailVerified} onClick={() => verify('email')} label="Email" />
                        <VerifyBadge ok={user.phoneVerified} onClick={() => verify('phone')} label="Telefoni" />
                    </div>
                </section>

                <section className="card-pad flex items-center justify-between">
                    <div>
                        <div className="label !mb-1 flex items-center gap-1.5"><Wallet size={13} /> Kuleta</div>
                        <div className="font-mono text-2xl font-bold text-mint">{wallet.balanceCredits} kredi</div>
                        <div className="text-xs text-faint">me vlerë {euro(wallet.equivalentEuroCents)}</div>
                    </div>
                    <Link to="/" className="btn-mint !py-2 text-xs">Rimbush</Link>
                </section>
            </div>

            <div className="flex gap-2">
                <button onClick={() => setTab('parkings')} className={`btn !py-2 text-xs ${tab === 'parkings' ? 'bg-cyan text-[#04222B]' : 'btn-ghost'}`}>
                    <Car size={14} /> Parkimet ({reservations.length})
                </button>
                <button onClick={() => setTab('chats')} className={`btn !py-2 text-xs ${tab === 'chats' ? 'bg-cyan text-[#04222B]' : 'btn-ghost'}`}>
                    <MessageSquare size={14} /> Bisedat ({chats.length})
                </button>
            </div>

            {tab === 'parkings' && (
                <div className="space-y-4">
                    {active.length > 0 && (
                        <section className="space-y-2">
                            <h3 className="label">Aktive tani</h3>
                            {active.map((r) => <ReservationRow key={r.id} r={r} highlight />)}
                        </section>
                    )}
                    <section className="space-y-2">
                        <h3 className="label">Historiku</h3>
                        {past.length === 0 && <p className="card-pad text-sm text-faint">Nuk ka parkime të mëparshme.</p>}
                        {past.map((r) => <ReservationRow key={r.id} r={r} />)}
                    </section>
                </div>
            )}

            {tab === 'chats' && (
                <div className="space-y-2">
                    {chats.length === 0 && <p className="card-pad text-sm text-faint">Nuk ka biseda.</p>}
                    {chats.map((c) => (
                        <div key={c.id} className="card-pad">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold">{c.subject || 'Bisedë mbështetjeje'}</span>
                                <span className={c.status === 'closed' ? 'chip' : 'chip-mint'}>
                                    {c.status === 'closed' ? 'E mbyllur' : c.status === 'assigned' ? 'Në trajtim' : 'E hapur'}
                                </span>
                            </div>
                            <p className="mt-1 truncate text-xs text-faint">{c.lastMessage || '—'}</p>
                            <p className="mt-1 text-[11px] text-faint">
                                {c.messageCount} mesazhe · {dateDMY(c.createdAt)}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ReservationRow({ r, highlight }) {
    return (
        <div className={`card-pad flex flex-wrap items-center justify-between gap-2 ${highlight ? '!border-l-4 !border-l-mint' : ''}`}>
            <div>
                <div className="font-display font-bold">
                    {r.zoneId} · Parkingu {r.spotNumber}
                    <span className="ml-2 font-mono text-sm font-normal text-faint">{r.plate}</span>
                </div>
                <div className="text-xs text-faint">
                    {r.durationLabel} · {methodLabel(r.paymentMethod)} · deri {timeHM(r.expiresAt)} {dateDMY(r.expiresAt)}
                </div>
            </div>
            <div className="text-right">
                <div className="font-mono text-sm">{euro(r.amountCents)}</div>
                <span className={
                    r.status === 'active' ? 'chip-mint'
                        : r.status === 'pending' ? 'chip-amber'
                            : r.status === 'expired' ? 'chip' : 'chip-rose'
                }>
                    {statusLabel(r.status)}
                </span>
            </div>
        </div>
    );
}