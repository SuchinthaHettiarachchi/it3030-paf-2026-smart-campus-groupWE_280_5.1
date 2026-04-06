const STATUS_MAP = {
  OPEN:        { label: 'Open',        bg: '#3b82f622', color: '#3b82f6' },
  IN_PROGRESS: { label: 'In Progress', bg: '#f59e0b22', color: '#f59e0b' },
  RESOLVED:    { label: 'Resolved',    bg: '#22c55e22', color: '#22c55e' },
  CLOSED:      { label: 'Closed',      bg: '#6b728022', color: '#9ca3af' },
  REJECTED:    { label: 'Rejected',    bg: '#ef444422', color: '#ef4444' },
};

export default function TicketStatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? { label: status, bg: '#ffffff22', color: '#ccc' };
  return (
    <span
      className="badge"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}44` }}
    >
      {s.label}
    </span>
  );
}
