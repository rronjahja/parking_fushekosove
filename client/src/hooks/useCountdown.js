import { useEffect, useState } from 'react';

// Kthen minutat/sekondat e mbetura deri në `expiresAt` (ISO string).
export function useCountdown(expiresAt) {
  const [msLeft, setMsLeft] = useState(() => calc(expiresAt));
  useEffect(() => {
    setMsLeft(calc(expiresAt));
    const timer = setInterval(() => setMsLeft(calc(expiresAt)), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  return {
    msLeft,
    minutes: Math.max(0, Math.floor(msLeft / 60000)),
    seconds: Math.max(0, Math.floor((msLeft % 60000) / 1000)),
    expired: msLeft <= 0,
  };
}
const calc = (iso) => (iso ? new Date(iso).getTime() - Date.now() : 0);
