import { Routes, Route, Navigate } from 'react-router-dom';
import TicketListPage    from './pages/tickets/TicketListPage.jsx';
import TicketCreatePage  from './pages/tickets/TicketCreatePage.jsx';
import TicketDetailPage  from './pages/tickets/TicketDetailPage.jsx';
import AdminTicketsPage  from './pages/tickets/AdminTicketsPage.jsx';

/**
 * App.jsx — Routing for Suchintha's Module C (Tickets).
 * Chanuka will wrap this with AuthContext & protected routes.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/"               element={<Navigate to="/tickets" replace />} />
      <Route path="/tickets"        element={<TicketListPage />} />
      <Route path="/tickets/new"    element={<TicketCreatePage />} />
      <Route path="/tickets/:id"    element={<TicketDetailPage />} />
      <Route path="/admin/tickets"  element={<AdminTicketsPage />} />
    </Routes>
  );
}
