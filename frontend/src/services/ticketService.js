import axios from '../api/axiosInstance';

// ── Tickets ──────────────────────────────────────────────────

/** POST /api/tickets — Create a new incident ticket */
export const createTicket = (data) =>
  axios.post('/api/tickets', data);

/** GET /api/tickets/my — Get current user's own tickets */
export const getMyTickets = () =>
  axios.get('/api/tickets/my');

/** GET /api/tickets — Get all tickets with optional filters (ADMIN/TECH) */
export const getAllTickets = (filters = {}) =>
  axios.get('/api/tickets', { params: filters });

/** GET /api/tickets/:id — Get full ticket details */
export const getTicketById = (id) =>
  axios.get(`/api/tickets/${id}`);

/** PATCH /api/tickets/:id/status — Update ticket status */
export const updateTicketStatus = (id, data) =>
  axios.patch(`/api/tickets/${id}/status`, data);

/** PATCH /api/tickets/:id/assign — Assign technician (ADMIN only) */
export const assignTechnician = (id, technicianId) =>
  axios.patch(`/api/tickets/${id}/assign`, null, { params: { technicianId } });

// ── Attachments ──────────────────────────────────────────────

/** POST /api/tickets/:ticketId/attachments — Upload image (max 3) */
export const uploadAttachment = (ticketId, file) => {
  const form = new FormData();
  form.append('file', file);
  return axios.post(`/api/tickets/${ticketId}/attachments`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/** DELETE /api/tickets/:ticketId/attachments/:attachId */
export const deleteAttachment = (ticketId, attachId) =>
  axios.delete(`/api/tickets/${ticketId}/attachments/${attachId}`);

// ── Comments ─────────────────────────────────────────────────

/** POST /api/tickets/:ticketId/comments — Add a comment */
export const addComment = (ticketId, data) =>
  axios.post(`/api/tickets/${ticketId}/comments`, data);

/** PUT /api/tickets/:ticketId/comments/:commentId — Edit own comment */
export const editComment = (ticketId, commentId, data) =>
  axios.put(`/api/tickets/${ticketId}/comments/${commentId}`, data);

/** DELETE /api/tickets/:ticketId/comments/:commentId */
export const deleteComment = (ticketId, commentId) =>
  axios.delete(`/api/tickets/${ticketId}/comments/${commentId}`);
