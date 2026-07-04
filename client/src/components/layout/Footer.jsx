import { RefreshCw } from 'lucide-react';
import { t } from '../../i18n/sq.js';

export function Footer() {
  return (
    <footer className="flex items-center justify-center gap-2 py-5 text-xs text-faint">
      <RefreshCw size={12} className="animate-spin [animation-duration:3s]" />
      {t.autoRefresh}
    </footer>
  );
}
