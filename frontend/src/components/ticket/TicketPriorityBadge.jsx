const PRIORITY_MAP = {
  CRITICAL: { label: 'Critical', bg: '#ef444422', color: '#ef4444' },
  HIGH:     { label: 'High',     bg: '#f9731622', color: '#f97316' },
  MEDIUM:   { label: 'Medium',   bg: '#f59e0b22', color: '#f59e0b' },
  LOW:      { label: 'Low',      bg: '#22c55e22', color: '#22c55e' },
};

export default function TicketPriorityBadge({ priority }) {
  const p = PRIORITY_MAP[priority] ?? { label: priority, bg: '#ffffff22', color: '#ccc' };
  return (
    <span
      className="badge"
      style={{ background: p.bg, color: p.color, border: `1px solid ${p.color}44` }}
    >
      {p.label}
    </span>
  );
}
