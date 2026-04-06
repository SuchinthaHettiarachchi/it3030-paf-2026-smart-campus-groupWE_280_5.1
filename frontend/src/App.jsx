import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/shared/Layout';
import TicketListPage from './pages/tickets/TicketListPage';
import TicketCreatePage from './pages/tickets/TicketCreatePage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';
import AdminTicketsPage from './pages/tickets/AdminTicketsPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Redirect root to tickets */}
          <Route index element={<Navigate to="/tickets" replace />} />

          {/* User Ticket Routes */}
          <Route path="tickets" element={<TicketListPage />} />
          <Route path="tickets/create" element={<TicketCreatePage />} />
          <Route path="tickets/:id" element={<TicketDetailPage />} />

          {/* Admin Routes */}
          <Route path="admin/tickets" element={<AdminTicketsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
