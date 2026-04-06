import axios from '../api/axiosInstance';

// ── Tickets ──

export const createTicket = (data) =>
  axios.post('/api/tickets', data);

export const getMyTickets = () =>
  axios.get('/api/tickets/my');

export const getAllTickets = (filters = {}) =>
  axios.get('/api/tickets', { params: filters });

export const getTicketById = (id) =>
  axios.get(`/api/tickets/${id}`);

export const updateTicketStatus = (id, data) =>
  axios.patch(`/api/tickets/${id}/status`, data);

export const assignTechnician = (id, technicianId) =>
  axios.patch(`/api/tickets/${id}/assign`, null, { params: { technicianId } });

// ── Attachments ──

export const uploadAttachment = (ticketId, file) => {
  const form = new FormData();
  form.append('file', file);
  return axios.post(`/api/tickets/${ticketId}/attachments`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteAttachment = (ticketId, attachId) =>
  axios.delete(`/api/tickets/${ticketId}/attachments/${attachId}`);

// ── Comments ──

export const getComments = (ticketId) =>
  axios.get(`/api/tickets/${ticketId}/comments`);

export const addComment = (ticketId, data) =>
  axios.post(`/api/tickets/${ticketId}/comments`, data);

export const editComment = (ticketId, commentId, data) =>
  axios.put(`/api/tickets/${ticketId}/comments/${commentId}`, data);

export const deleteComment = (ticketId, commentId) =>
  axios.delete(`/api/tickets/${ticketId}/comments/${commentId}`);
