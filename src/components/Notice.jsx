export function Notice({ children, tone = 'info' }) {
  if (!children) return null;
  return <div className={`notice ${tone}`}>{children}</div>;
}
