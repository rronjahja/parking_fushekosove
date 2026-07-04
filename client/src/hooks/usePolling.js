import { useEffect, useRef } from 'react';

/**
 * Thërret `fn` menjëherë dhe çdo `ms` milisekonda.
 * Ndalon kur skeda është e fshehur (kursen rrjetin) dhe rinis kur kthehet.
 */
export function usePolling(fn, ms, deps = [], enabled = true) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return undefined;
    let timer = null;
    const tick = () => fnRef.current();

    const start = () => {
      tick();
      timer = setInterval(tick, ms);
    };
    const stop = () => timer && clearInterval(timer);
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, enabled, ...deps]);
}
