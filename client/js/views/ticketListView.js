import BaseView from './baseView.js';
import { ticketService } from '../services/ticketService.js';
import { authService } from '../services/authService.js';
import { Config } from '../config/config.js';

export default class TicketListView extends BaseView {
    constructor(params) {
        super(params);
        this.setTitle('Tickets');
    }

    async getHtml() {
        const user = authService.getNormalizedUser();
        const sidebar = this.getSidebarHtml(Config.routes.ticketList, user);

        return `
            <div class="dashboard-layout">
                ${sidebar}

                <main class="main-content">
                    <header class="top-bar">
                        <h1 class="h1">Tickets</h1>
                        <a href="#/${Config.routes.createTicket}" class="btn btn-primary">
                            <span class="icon-plus">+</span> Create Ticket
                        </a>
                    </header>

                    <div class="card">
                        <div class="flex justify-between items-center margin-bottom-md">
                            <div class="flex gap-sm">
                                <input type="text" id="searchInput" class="input-control" placeholder="Search tickets..." style="width: 300px;">
                                <select id="statusFilter" class="input-control" style="width: 150px;">
                                    <option value="All">All Statuses</option>
                                    <option value="OPEN">Open</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                            </div>
                        </div>

                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Last Updated</th>
                                    <th style="width: 100px;"></th>
                                </tr>
                            </thead>
                            <tbody id="ticketListBody">
                                <tr><td colspan="6" class="text-center">Loading tickets...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        `;
    }

    async render() {
        return this.getHtml();
    }

    async afterRender() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => authService.logout());
        }

        const user = authService.getNormalizedUser();
        const userRole = user.role || 'client';
        const userId = user.id;
        if (!authService.isLoggedIn()) {
            return;
        }

        let tickets;
        try {
            tickets = await ticketService.getAllTickets();
        } catch (error) {
            if (error && error.message === 'Unauthorized') {
                authService.logout();
                return;
            }
            throw error;
        }

        if (userRole === 'client' && userId) {
            let publicTickets = [];
            try {
                publicTickets = await ticketService.getPublicTickets();
            } catch (error) {
                if (error && error.message === 'Unauthorized') {
                    authService.logout();
                    return;
                }
            }
            const myTickets = tickets.filter(t => String(t.requesterId) === String(userId));
            const combined = [...myTickets];
            publicTickets.forEach(pt => {
                if (!combined.find(t => t.id === pt.id)) {
                    combined.push(pt);
                }
            });
            tickets = combined;
        }

        this.allTickets = tickets;
        this.renderTable(tickets);

        document.getElementById('searchInput').addEventListener('input', () => {
            this.filterTickets(
                document.getElementById('searchInput').value,
                document.getElementById('statusFilter').value
            );
        });
        document.getElementById('statusFilter').addEventListener('change', () => {
            this.filterTickets(
                document.getElementById('searchInput').value,
                document.getElementById('statusFilter').value
            );
        });
    }

    filterTickets(searchTerm, status) {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = this.allTickets.filter(t => {
            const matchesSearch = (t.title || '').toLowerCase().includes(lowerTerm) || String(t.id).includes(lowerTerm);
            const ticketStatus = (t.status || '').toUpperCase();
            const matchesStatus = status === 'All' || ticketStatus === status;
            return matchesSearch && matchesStatus;
        });
        this.renderTable(filtered);
    }

    renderTable(tickets) {
        const tbody = document.getElementById('ticketListBody');
        if (tickets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-mute padding-lg">No tickets found.</td></tr>';
            return;
        }

        tbody.innerHTML = tickets.map((t) => {
            const rawId = t.id ?? '';
            const safeId = this.escapeHtml(String(rawId));
            const ticketIdPath = encodeURIComponent(String(rawId));

            return `
            <tr>
                <td class="text-mute">#T-${safeId}</td>
                <td>
                    <div class="font-medium">${this.escapeHtml(t.title)}</div>
                    <div class="text-xs text-mute">${this.escapeHtml(t.category || '')}</div>
                </td>
                <td><span class="badge">${this.escapeHtml(t.priority || 'Normal')}</span></td>
                <td><span class="status-pill status-${this.toSafeClass(t.status || 'open')}">${this.escapeHtml(t.status || 'OPEN')}</span></td>
                <td class="text-sm text-mute">${new Date(t.updatedAt).toLocaleDateString()}</td>
                <td>
                    <a href="#/${Config.routes.ticketDetail}/${ticketIdPath}" class="btn btn-secondary btn-text" style="font-size: 13px; padding: 4px 12px; border: 1px solid var(--border);">View</a>
                </td>
            </tr>
        `;
        }).join('');
    }
}
