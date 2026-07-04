export function Spinner({ size = 18 }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-cyan border-t-transparent"
      style={{ width: size, height: size }}
      aria-label="Duke u ngarkuar"
    />
  );
}
