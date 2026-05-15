export function FestivalBunting({ compact = false }) {
  return (
    <div className={`bunting ${compact ? 'compact' : ''}`} aria-hidden="true">
      {Array.from({ length: compact ? 7 : 11 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}
