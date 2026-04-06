import React from 'react';

const priorityConfig = {
  LOW: { label: 'Low', class: 'badge-low', icon: '🟢' },
  MEDIUM: { label: 'Medium', class: 'badge-medium', icon: '🟡' },
  HIGH: { label: 'High', class: 'badge-high', icon: '🟠' },
  CRITICAL: { label: 'Critical', class: 'badge-critical', icon: '🔴' },
};

export default function TicketPriorityBadge({ priority }) {
  const config = priorityConfig[priority] || { label: priority, class: '', icon: '⚪' };

  return (
    <span className={`badge ${config.class}`}>
      {config.icon} {config.label}
    </span>
  );
}
