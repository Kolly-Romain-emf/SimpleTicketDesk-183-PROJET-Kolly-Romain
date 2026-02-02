import BaseView from './baseView.js';
import { authService } from '../services/authService.js';
import { Config } from '../config/config.js';

export default class SystemLogsView extends BaseView {
    constructor(params) {
        super(params);
        this.setTitle('System Logs');
        this.limit = 50;
    }

    async getHtml() {
        const user = authService.getNormalizedUser();
        const sidebar = this.getSidebarHtml(Config.routes.systemLogs, user);

        return `
            <div class="dashboard-layout">
                ${sidebar}
                <main class="main-content">
                    <header class="top-bar">
                        <h1 class="h1">System Logs</h1>
                    </header>
                    
                    <div class="card fade-in">
                        <div class="flex justify-between items-center margin-bottom-md">
                            <div>
                                <h2 class="h2">Audit Logs</h2>
                                <p class="text-mute text-sm">Latest ${this.limit} entries from /admin/audit.</p>
                            </div>
                            <button id="refreshAuditLogsBtn" class="btn btn-secondary">Refresh</button>
                        </div>

                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Action</th>
                                    <th>User</th>
                                    <th>Role</th>
                                </tr>
                            </thead>
                            <tbody id="auditLogsBody">
                                <tr><td colspan="4" class="text-center">Loading logs...</td></tr>
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
        if (document.getElementById('logoutBtn')) {
            document.getElementById('logoutBtn').addEventListener('click', () => authService.logout());
        }

        const refreshBtn = document.getElementById('refreshAuditLogsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadAuditLogs());
        }

        await this.loadAuditLogs();
    }

    getErrorMessage(status) {
        switch (status) {
            case 400:
                return 'Invalid request';
            case 401:
                return 'Unauthorized';
            case 403:
                return 'Forbidden';
            case 404:
                return 'Not found';
            case 409:
                return 'Request conflict';
            default:
                return 'Server error';
        }
    }

    formatDateTime(value) {
        if (!value) return '';
        const raw = String(value);
        const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
        const date = new Date(normalized);
        if (Number.isNaN(date.getTime())) {
            return this.escapeHtml(raw);
        }
        return this.escapeHtml(date.toLocaleString());
    }

    async fetchAuditLogs() {
        const safeLimit = Number.isInteger(this.limit) && this.limit > 0 ? this.limit : 50;
        const params = new URLSearchParams({ limit: String(safeLimit) });
        const response = await fetch(`/admin/audit?${params.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(this.getErrorMessage(response.status));
        }

        return response.json();
    }

    renderAuditLogs(logs) {
        const tbody = document.getElementById('auditLogsBody');
        if (!tbody) return;

        if (!logs.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-mute padding-lg">No audit logs found.</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map((log) => {
            const action = this.escapeHtml(log.action || '');
            const email = this.escapeHtml(log.user_email || 'System');
            const role = log.user_role ? this.escapeHtml(String(log.user_role).toLowerCase()) : '';
            const roleHtml = role ? `<span class="badge" style="text-transform: capitalize;">${role}</span>` : '<span class="text-mute">-</span>';
            const userId = log.fk_user ? this.escapeHtml(`#${log.fk_user}`) : '';
            const time = this.formatDateTime(log.created_at);

            return `
                <tr>
                    <td class="text-sm text-mute">${time}</td>
                    <td>${action}</td>
                    <td>
                        <div class="font-medium text-sm">${email}</div>
                        <div class="text-xs text-mute">${userId}</div>
                    </td>
                    <td>${roleHtml}</td>
                </tr>
            `;
        }).join('');
    }

    renderAuditError(message) {
        const tbody = document.getElementById('auditLogsBody');
        if (!tbody) return;
        const safeMessage = this.escapeHtml(message || 'Failed to load audit logs');
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-mute padding-lg">${safeMessage}</td></tr>`;
    }

    async loadAuditLogs() {
        const tbody = document.getElementById('auditLogsBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Loading logs...</td></tr>';
        }

        try {
            const data = await this.fetchAuditLogs();
            const logs = Array.isArray(data?.logs) ? data.logs : [];
            this.renderAuditLogs(logs);
        } catch (error) {
            if (error && error.message === 'Unauthorized') {
                authService.logout();
                return;
            }
            this.renderAuditError(error?.message);
        }
    }
}
