import React from 'react';
import { NavLink } from 'react-router-dom';
import { TicketCheck, PlusCircle, LayoutDashboard, Settings } from 'lucide-react';

export default function Navbar() {
  return (
    <aside className="sidebar" id="main-sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">SC</div>
        <h2>Smart Campus</h2>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-title">Tickets</span>

        <NavLink
          to="/tickets"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          end
          id="nav-my-tickets"
        >
          <TicketCheck size={20} className="nav-icon" />
          My Tickets
        </NavLink>

        <NavLink
          to="/tickets/create"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          id="nav-create-ticket"
        >
          <PlusCircle size={20} className="nav-icon" />
          New Ticket
        </NavLink>

        <span className="nav-section-title">Administration</span>

        <NavLink
          to="/admin/tickets"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          id="nav-admin-tickets"
        >
          <LayoutDashboard size={20} className="nav-icon" />
          All Tickets
        </NavLink>
      </nav>

      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border-color)' }}>
        <div className="nav-link" style={{ cursor: 'default' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'white',
            }}
          >
            SH
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Dev User</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>dev@smartcampus.lk</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
