interface StatTileProps {
  label: string;
  value: string;
  status?: 'good' | 'critical';
  statusLabel?: string;
}

export function StatTile({ label, value, status, statusLabel }: StatTileProps) {
  return (
    <div className="card">
      <div className="stat-tile__label">{label}</div>
      <div className={`stat-tile__value${status ? ` ${status}` : ''}`}>
        {status && <span aria-hidden="true">{status === 'good' ? '↑ ' : '↓ '}</span>}
        {value}
      </div>
      {statusLabel && (
        <div className="stat-tile__label" style={{ marginTop: 4, marginBottom: 0 }}>
          {statusLabel}
        </div>
      )}
    </div>
  );
}
