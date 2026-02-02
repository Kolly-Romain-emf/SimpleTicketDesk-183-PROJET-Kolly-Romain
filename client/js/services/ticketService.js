import { api } from './api.js';

const mapTicket = (t) => ({
    id: t.pk_ticket,
    title: t.title,
    description: t.description,
    statusId: t.fk_status,
    status: t.status_label || t.status || t.fk_status || 'OPEN',
    priority: t.priority || 'Normal',
    category: t.category || '',
    isPublic: Boolean(t.is_public),
    ownerId: t.fk_user,
    requesterId: t.fk_user,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
});

class TicketService {
    async getPublicTickets() {
        const data = await api.get('/tickets/public');
        const list = Array.isArray(data?.tickets) ? data.tickets : [];
        return list.map(mapTicket);
    }

    async getAllTickets() {
        const data = await api.get('/tickets');
        const list = Array.isArray(data?.tickets) ? data.tickets : [];
        return list.map(mapTicket);
    }

    async getTicketById(id) {
        const data = await api.get(`/tickets/${id}`);
        return data.ticket ? mapTicket(data.ticket) : null;
    }

    async createTicket(ticketData) {
        const data = await api.post('/tickets', ticketData);
        return data.ticket ? mapTicket(data.ticket) : null;
    }

    async updateTicket(id, updates) {
        const data = await api.put(`/tickets/${id}`, updates);
        return data.ticket ? mapTicket(data.ticket) : null;
    }
}

export const ticketService = new TicketService();
