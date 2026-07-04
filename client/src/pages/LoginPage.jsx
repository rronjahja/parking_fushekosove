import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';

// Faqja e kyçjes DHE regjistrimit për përdoruesit (klientët).
// Kyçja bëhet me email OSE numër telefoni + fjalëkalim.
export function LoginPage() {
  const { login, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [busy, setBusy] = useState(false);

  const [identifier, setIdentifier] = useState(''); // email ose telefon (kyçje)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const doLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(identifier.trim(), password);
      toast.success(`Mirë se vini, ${u.name}!`);
      navigate(u.role === 'AGENT' ? '/agjenti' : redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const doRegister = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { devCodes } = await register({ name: name.trim(), email: email.trim(), phone: phone.trim(), password });
      toast.success('Llogaria u krijua! Mirë se vini.');
      if (devCodes) toast.info(`Kodet demo — Email: ${devCodes.email}, Tel: ${devCodes.phone}`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card-pad w-full max-w-sm space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan/15 text-cyan">
            <KeyRound size={22} />
          </div>
          <h1 className="font-display text-2xl font-extrabold">
            {tab === 'login' ? 'Kyçu në llogari' : 'Krijo llogari'}
          </h1>
          <p className="mt-1 text-sm text-faint">
            {tab === 'login'
              ? 'Për të rezervuar parking duhet të kyçeni.'
              : 'Regjistrohu për të rezervuar dhe menaxhuar parkimet.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTab('login')}
            className={`btn !py-2 text-xs ${tab === 'login' ? 'bg-cyan text-[#04222B]' : 'btn-ghost'}`}
          >
            <LogIn size={14} /> Kyçu
          </button>
          <button
            onClick={() => setTab('register')}
            className={`btn !py-2 text-xs ${tab === 'register' ? 'bg-amber text-[#2B1A02]' : 'btn-ghost'}`}
          >
            <UserPlus size={14} /> Regjistrohu
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={doLogin} className="space-y-3">
            <div>
              <label className="label">Email ose numër telefoni</label>
              <input
                className="input" value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="filan@example.com ose 044123456" autoFocus
              />
            </div>
            <div>
              <label className="label">Fjalëkalimi</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
              {busy ? <Spinner size={15} /> : 'Kyçu'}
            </button>
          </form>
        ) : (
          <form onSubmit={doRegister} className="space-y-3">
            <div>
              <label className="label">Emri i plotë</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Filan Fisteku" autoFocus />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="filan@example.com" />
            </div>
            <div>
              <label className="label">Numri i telefonit</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="044 123 456" />
            </div>
            <div>
              <label className="label">Fjalëkalimi (min. 6 karaktere)</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={busy} className="btn-amber w-full !py-3">
              {busy ? <Spinner size={15} /> : 'Krijo llogarinë'}
            </button>
          </form>
        )}

        <Link to="/" className="block text-center text-sm text-cyan hover:underline">
          ← Kthehu te harta
        </Link>

        <details className="rounded-xl bg-raised px-4 py-2 text-[11px] text-faint">
          <summary className="cursor-pointer">Llogari stafi (demo)</summary>
          <div className="mt-2 leading-relaxed">
            Kyçu te fusha e parë me: admin / Admin123! · superadmin / Super123! · agjenti / Agjent123!
          </div>
        </details>
      </div>
    </div>
  );
}