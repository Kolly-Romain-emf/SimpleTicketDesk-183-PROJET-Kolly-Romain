import BaseView from './baseView.js';
import { ticketService } from '../services/ticketService.js';
import { api } from '../services/api.js';
import { Config } from '../config/config.js';
import { authService } from '../services/authService.js';

export default class CreateTicketView extends BaseView {
    constructor(params) {
        super(params);
        this.setTitle('Create Ticket');
    }

    async getHtml() {
        const user = authService.getNormalizedUser();
        const safeFirstName = this.escapeHtml(user.firstName || 'User');
        const safeRole = this.escapeHtml(user.role || 'client');
        const initial = this.escapeHtml((user.firstName || 'U')[0]);

        return `
             <div class="dashboard-layout">
                <!-- Data-free duplicate of sidebar for now (ideally shared component) -->
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <span class="logo-icon-sm">ST</span>
                        <span class="logo-text">SimpleTicketDesk</span>
                    </div>
                    
                    <nav class="sidebar-nav">
                        <a href="#/${Config.routes.clientDashboard}" class="nav-item">
                            <span class="icon" aria-hidden="true">${this.getIconSvg('dashboard')}</span> Dashboard
                        </a>
                        <a href="#/${Config.routes.createTicket}" class="nav-item active">
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
                                <span class="user-name">${safeFirstName}</span>
                                <span class="user-role">${safeRole}</span>
                            </div>
                        </div>
                        <button id="logoutBtn" class="btn-icon">X</button>
                    </div>
                </aside>

                <main class="main-content">
                    <header class="top-bar">
                         <h1 class="h1">Create Ticket</h1>
                         <div class="flex gap-sm">
                             <button class="btn btn-icon-only">*</button>
                             <div class="avatar-sm">${initial}</div>
                         </div>
                    </header>

                    <div class="container" style="max-width: 800px; margin: 0;">
                        <nav class="breadcrumbs margin-bottom-lg">
                            <a href="#/${Config.routes.clientDashboard}" class="text-mute text-sm">Home</a>
                             <span class="text-mute text-sm">/</span>
                             <span class="text-sm font-medium">Tickets</span>
                             <span class="text-mute text-sm">/</span>
                             <span class="text-sm font-medium">Create Ticket</span>
                        </nav>

                        <div class="card fade-in">
                            <form id="createTicketForm">
                                <div class="input-group">
                                    <label for="title">Ticket Title</label>
                                    <input type="text" id="title" class="input-control" placeholder="Briefly describe the issue" required>
                                </div>

                                <div class="input-group">
                                    <label for="status">Status</label>
                                    <select id="status" class="input-control" required>
                                        <option value="" disabled selected>Select Status</option>
                                    </select>
                                </div>

                                <div class="input-group">
                                    <label for="description">Description</label>
                                    <textarea id="description" class="input-control" style="height: 120px; padding-top: 12px;" placeholder="Provide detailed information..." required></textarea>
                                </div>

                                <div class="flex justify-between items-center margin-top-md margin-bottom-lg">
                                    <div class="flex items-center gap-sm">
                                        <label class="switch">
                                            <input type="checkbox" id="visibility">
                                            <span class="slider round"></span>
                                        </label>
                                        <div>
                                            <span class="text-sm font-medium">Public Ticket</span>
                                            <p class="text-xs text-mute">Visible to everyone in organization</p>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex justify-end gap-md padding-top-md border-top">
                                    <button type="button" class="btn btn-secondary" onclick="window.history.back()">Cancel</button>
                                    <button type="submit" class="btn btn-primary">Create Ticket</button>
                                </div>
                            </form>
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
        if (!authService.isLoggedIn()) {
            return;
        }
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => authService.logout());
        }

        const form = document.getElementById('createTicketForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('title').value;
            const description = document.getElementById('description').value;
            const status = document.getElementById('status').value;
            const visibilityCheck = document.getElementById('visibility').checked;

            const ticketData = {
                title,
                description,
                fk_status: Number(status),
                is_public: visibilityCheck
            };

            try {
                const newTicket = await ticketService.createTicket(ticketData);
                const ticketIdParam = encodeURIComponent(String(newTicket?.id ?? ''));
                window.location.hash = `#/${Config.routes.ticketCreated}?id=${ticketIdParam}`;
            } catch (error) {
                console.error(error);
                alert('Failed to create ticket');
            }
            });
        }

        try {
            const data = await api.get('/statuses');
            const list = Array.isArray(data?.statuses) ? data.statuses : [];
            const select = document.getElementById('status');
            if (select) {
                select.innerHTML = '<option value="" disabled selected>Select Status</option>' + list.map((s) => (
                    `<option value="${s.pk_status}">${this.escapeHtml(s.label)}</option>`
                )).join('');
            }
        } catch (error) {
            if (error && error.message === 'Unauthorized') {
                authService.logout();
                return;
            }
            console.error('Failed to load statuses', error);
        }
    }
}

