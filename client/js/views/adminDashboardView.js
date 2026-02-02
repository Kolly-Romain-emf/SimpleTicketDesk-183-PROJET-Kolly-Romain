import BaseView from './baseView.js';
import { authService } from '../services/authService.js';
import { ticketService } from '../services/ticketService.js';
import { Config } from '../config/config.js';

export default class AdminDashboardView extends BaseView {
    constructor(params) {
        super(params);
        this.setTitle('Admin Dashboard');
    }

    async getHtml() {
        const user = authService.getNormalizedUser();
        const sidebar = this.getSidebarHtml(Config.routes.adminDashboard, user);

        return `
            <div class="dashboard-layout">
                ${sidebar}

                <main class="main-content">
                    <header class="top-bar">
                        <div class="welcome-text">
                            <h1 class="h1">Admin Dashboard</h1>
                            <p class="text-mute">System overview and ticket management.</p>
                        </div>
                    </header>

                    <!-- KPI Cards -->
                    <div class="kpi-grid margin-top-xl">
                        <div class="card kpi-card">
                            <div class="kpi-content">
                                <span class="kpi-label">Open Tickets</span>
                                <span class="kpi-value" id="kpi-open">-</span>
                            </div>
                            <div class="kpi-icon icon-blue">OK</div>
                        </div>
                        <div class="card kpi-card">
                            <div class="kpi-content">
                                <span class="kpi-label">Critical</span>
                                <span class="kpi-value" id="kpi-critical">-</span>
                            </div>
                            <div class="kpi-icon icon-green" style="background: #FEE2E2; color: #DC2626;">!</div>
                        </div>
                    </div>

                    <div class="content-grid margin-top-xl">
                        <!-- Recent Tickets -->
                         <div class="card" style="grid-column: span 3;">
                            <div class="card-header flex justify-between items-center margin-bottom-md">
                                <h2 class="h2">Recent Tickets</h2>
                                <a href="#/${Config.routes.ticketList}" class="text-sm text-primary btn-text">View All</a>
                            </div>
                            
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Ticket</th>
                                        <th>Priority</th>
                                    <th>Requester</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="adminTicketsBody">
                                <tr><td colspan="5" class="text-center">Loading...</td></tr>
                            </tbody>
                        </table>
                        </div>
                    </div>
                </main>
            </div>
        `;
    }

    async render() {
        return this.getHtml();
    }

    async afterRender() {
        if (document.getElementById('logoutBtn')) {
            document.getElementById('logoutBtn').addEventListener('click', () => authService.logout());
        }

        this.loadStats();
    }

    async loadStats() {
        try {
            const tickets = await ticketService.getAllTickets();

            const openCount = tickets.filter(t => (t.status || '').toUpperCase() === 'OPEN').length;
            const criticalCount = tickets.filter(t => (t.priority || '').toLowerCase() === 'critical').length;

            document.getElementById('kpi-open').textContent = openCount;
            document.getElementById('kpi-critical').textContent = criticalCount;

            const targetTickets = tickets.filter(t => (t.status || '').toUpperCase() !== 'CLOSED').slice(0, 5);
            const tbody = document.getElementById('adminTicketsBody');

            if (targetTickets.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-mute">No tickets to act on.</td></tr>';
            } else {
                tbody.innerHTML = targetTickets.map((t) => {
                    const rawId = t.id ?? '';
                    const safeId = this.escapeHtml(String(rawId));
                    const ticketIdPath = encodeURIComponent(String(rawId));

                    return `
                    <tr>
                        <td>
                             <div class="font-medium">#T-${safeId} ${this.escapeHtml(t.title)}</div>
                        </td>
                        <td><span class="badge">${this.escapeHtml(t.priority || 'Normal')}</span></td>
                        <td><span class="text-xs">User ${this.escapeHtml(t.requesterId || t.ownerId || '')}</span></td>
                        <td><span class="status-pill status-${this.toSafeClass(t.status || 'open')}">${this.escapeHtml(t.status || 'OPEN')}</span></td>
                        <td>
                            <a href="#/${Config.routes.ticketDetail}/${ticketIdPath}" class="btn btn-secondary btn-text" style="padding: 2px 8px; font-size: 12px; height: 28px;">Open</a>
                        </td>
                    </tr>
                `;
                }).join('');
            }

        } catch (error) {
            console.error(error);
        }
    }
}

