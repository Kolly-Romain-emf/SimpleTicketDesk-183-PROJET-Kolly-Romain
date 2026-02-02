import BaseView from './baseView.js';
import { authService } from '../services/authService.js';
import { ticketService } from '../services/ticketService.js';
import { Config } from '../config/config.js';

export default class ClientDashboardView extends BaseView {
    constructor(params) {
        super(params);
        this.setTitle('Dashboard');
    }

    async getHtml() {
        const user = authService.getNormalizedUser();
        const safeFirstName = this.escapeHtml(user.firstName || 'User');
        const safeLastName = this.escapeHtml(user.lastName || '');
        const safeRole = this.escapeHtml(user.role || 'client');
        const initial = this.escapeHtml((user.firstName || 'U')[0]);

        return `
            <div class="dashboard-layout">
                <!-- Sidebar -->
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <span class="logo-icon-sm">ST</span>
                        <span class="logo-text">SimpleTicketDesk</span>
                    </div>
                    
                    <nav class="sidebar-nav">
                        <a href="#/${Config.routes.clientDashboard}" class="nav-item active">
                            <span class="icon" aria-hidden="true">${this.getIconSvg('dashboard')}</span> Dashboard
                        </a>
                        <a href="#/${Config.routes.createTicket}" class="nav-item">
                            <span class="icon" aria-hidden="true">${this.getIconSvg('create')}</span> Create Ticket
                        </a>
                        <a href="#/${Config.routes.ticketList}" class="nav-item">
                            <span class="icon" aria-hidden="true">${this.getIconSvg('tickets')}</span> Tickets
                        </a>
                         <a href="#/${Config.routes.profile}" class="nav-item">
                            <span class="icon" aria-hidden="true">${this.getIconSvg('settings')}</span> Settings
                        </a>
                    </nav>

                    <div class="sidebar-footer">
                        <div class="user-info">
                            <div class="avatar">${initial}</div>
                            <div class="user-details">
                                <span class="user-name">${safeFirstName} ${safeLastName}</span>
                                <span class="user-role">${safeRole}</span>
                            </div>
                        </div>
                        <button id="logoutBtn" class="btn-icon" title="Logout">X</button>
                    </div>
                </aside>

                <!-- Main Content -->
                <main class="main-content">
                    <header class="top-bar">
                        <div class="welcome-text">
                            <h1 class="h1">Welcome back, ${safeFirstName}</h1>
                            <p class="text-mute">Here's an overview of your support requests.</p>
                        </div>
                        <a href="#/${Config.routes.createTicket}" class="btn btn-primary">
                            <span class="icon-plus">+</span> Create Ticket
                        </a>
                    </header>

                    <!-- KPI Cards -->
                    <div class="kpi-grid margin-top-xl">
                        <div class="card kpi-card">
                            <div class="kpi-content">
                                <span class="kpi-label">Active Tickets</span>
                                <span class="kpi-value" id="kpi-active">-</span>
                            </div>
                            <div class="kpi-icon icon-green">OK</div>
                        </div>
                        <div class="card kpi-card">
                            <div class="kpi-content">
                                <span class="kpi-label">Pending Review</span>
                                <span class="kpi-value" id="kpi-pending">-</span>
                            </div>
                            <div class="kpi-icon icon-orange">!</div>
                        </div>
                    </div>

                    <div class="content-grid margin-top-xl">
                        <!-- My Tickets -->
                        <div class="card" style="grid-column: span 3;">
                            <div class="card-header flex justify-between items-center margin-bottom-md">
                                <div class="flex items-center gap-sm">
                                    <span class="indicator-green"></span>
                                    <h2 class="h2">My Tickets</h2>
                                </div>
                                <a href="#/${Config.routes.ticketList}" class="text-sm text-primary btn-text">View All</a>
                            </div>
                            
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Ticket Details</th>
                                        <th>Status</th>
                                        <th>Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody id="myTicketsBody">
                                    <tr><td colspan="3" class="text-center">Loading...</td></tr>
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
        document.getElementById('logoutBtn').addEventListener('click', () => {
            authService.logout();
        });

        this.loadDashboardData();
    }

    async loadDashboardData() {
        const user = authService.currentUser;
        if (!user || !authService.isLoggedIn()) return;

        try {
            const myTickets = await ticketService.getAllTickets();

            const activeCount = myTickets.filter(t => (t.status || '').toUpperCase() !== 'CLOSED').length;
            const pendingCount = myTickets.filter(t => (t.status || '').toUpperCase() === 'IN_PROGRESS').length || 0;

            document.getElementById('kpi-active').textContent = activeCount;
            document.getElementById('kpi-pending').textContent = pendingCount;

            const recentTickets = myTickets.slice(0, 5);
            const tbody = document.getElementById('myTicketsBody');

            if (recentTickets.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-mute">No tickets found.</td></tr>';
            } else {
                tbody.innerHTML = recentTickets.map((t) => {
                    const rawId = t.id ?? '';
                    const safeId = this.escapeHtml(String(rawId));

                    return `
                    <tr>
                        <td>
                            <div class="ticket-info">
                                <div class="font-medium">${this.escapeHtml(t.title)}</div>
                                <div class="text-xs text-mute">#T-${safeId} ${this.escapeHtml(t.category || '')}</div>
                            </div>
                        </td>
                        <td><span class="status-pill status-${this.toSafeClass(t.status || 'open')}">${this.escapeHtml(t.status || 'OPEN')}</span></td>
                        <td class="text-sm text-mute">${new Date(t.updatedAt).toLocaleDateString()}</td>
                    </tr>
                `;
                }).join('');
            }

        } catch (error) {
            if (error && error.message === 'Unauthorized') {
                authService.logout();
                return;
            }
            console.error('Error loading dashboard:', error);
        }
    }
}

