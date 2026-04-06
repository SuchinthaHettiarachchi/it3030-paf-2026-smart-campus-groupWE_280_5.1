import React from 'react';

const statusConfig = {
  OPEN: { label: 'Open', class: 'badge-open' },
  IN_PROGRESS: { label: 'In Progress', class: 'badge-in_progress' },
  RESOLVED: { label: 'Resolved', class: 'badge-resolved' },
  CLOSED: { label: 'Closed', class: 'badge-closed' },
  REJECTED: { label: 'Rejected', class: 'badge-rejected' },
};

export default function TicketStatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, class: '' };

  return (
    <span className={`badge ${config.class}`}>
      {config.label}
    </span>
  );
}
