import BaseView from './baseView.js';
import { ticketService } from '../services/ticketService.js';
import { authService } from '../services/authService.js';
import { Config } from '../config/config.js';

export default class GlobalLoginView extends BaseView {
    constructor(params) {
        super(params);
        this.setTitle('Login');
    }

    async getHtml() {
        return `
            <div class="split-layout">
                <div class="login-section">
                    <div class="login-card fade-in">
                        <div class="brand">
                            <span class="logo-icon"></span>
                            <h1>SimpleTicketDesk</h1>
                        </div>
                        
                        <div class="login-header">
                            <h2>Welcome back</h2>
                            <p class="text-mute">Please enter your details to access the internal dashboard.</p>
                        </div>

                        <form id="loginForm" class="login-form">
                            <div class="input-group">
                                <label for="email">Email</label>
                                <input type="email" id="email" class="input-control" placeholder="name@company.com" required>
                            </div>
                            
                            <div class="input-group">
                                <div class="flex justify-between">
                                    <label for="password">Password</label>
                                    <a href="#" class="text-xs text-primary btn-text">Forgot password?</a>
                                </div>
                                <input type="password" id="password" class="input-control" placeholder="Enter your password" required>
                            </div>

                            <button type="submit" class="btn btn-primary full-width" id="loginBtn">Sign In</button>
                            <div id="login-error" class="error-msg hidden"></div>
                        </form>

                        <div id="mfaModal" class="hidden" style="margin-top: 16px; border: 1px solid #E5E7EB; padding: 12px; border-radius: 8px;">
                            <h3 class="h3">Two-Factor Authentication</h3>
                            <p class="text-sm text-mute">Enter the 6-digit code from your authenticator app.</p>
                            <div class="input-group">
                                <label for="mfaToken">TOTP Code</label>
                                <input type="text" id="mfaToken" class="input-control" placeholder="123456" inputmode="numeric" maxlength="6">
                            </div>
                            <button type="button" class="btn btn-primary full-width" id="mfaConfirmBtn">Verify Code</button>
                            <div id="mfa-error" class="error-msg hidden"></div>
                        </div>

                        <div class="login-footer">
                            <p class="text-sm text-mute">Don't have an account? <a href="#/${Config.routes.register}" class="text-primary btn-text">Sign up</a></p>
                        </div>
                    </div>
                    
                    <footer class="footer-links">
                        <a href="#" class="text-xs text-mute">Terms</a>
                        <a href="#" class="text-xs text-mute">Privacy</a>
                        <a href="#" class="text-xs text-mute">Docs</a>
                    </footer>
                </div>

                <div class="public-issues-section">
                    <div class="issues-container">
                        <div class="issues-header flex justify-between items-center">
                            <div>
                                <h2 class="h2">Public Issues</h2>
                                <span class="badge badge-gray">Public View</span>
                                <p class="text-sm text-mute margin-top-sm">Real-time tracking of public requests and bugs.</p>
                            </div>
                            <div class="live-indicator">
                                <span class="dot"></span> Fetching updates...
                            </div>
                        </div>

                        <div class="filters flex gap-sm margin-top-md">
                            <input type="text" placeholder="Search issues..." class="input-control search-input">
                            <select class="input-control select-control">
                                <option>Status</option>
                            </select>
                             <select class="input-control select-control">
                                <option>Priority</option>
                            </select>
                        </div>

                        <div class="table-card margin-top-md">
                            <table class="data-table" id="publicTicketsTable">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody id="ticketsBody">
                                    <!-- Rows injected here -->
                                     <tr><td colspan="4" class="text-center">Loading...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async render() {
        // We load data in parallel with rendering the structure if possible, 
        // but for simplicity in BaseView structure we return HTML then hydrate.
        // Actually BaseView.render returns HTML.
        // So we just return the string.
        return this.getHtml();
    }

    async afterRender() {
        this.attachLoginListener();
        this.loadPublicTickets();
    }

    attachLoginListener() {
        const form = document.getElementById('loginForm');
        const mfaModal = document.getElementById('mfaModal');
        const mfaConfirmBtn = document.getElementById('mfaConfirmBtn');
        const mfaError = document.getElementById('mfa-error');
        let pendingEmail = '';
        let pendingPassword = '';

        if (!form) {
            return;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('loginBtn');
            const errorDiv = document.getElementById('login-error');

            btn.textContent = 'Signing In...';
            btn.disabled = true;
            errorDiv.classList.add('hidden');

            const result = await authService.login(email, password);

            if (result.success) {
                await authService.fetchMe().catch(() => {});
                const role = (authService.getUserRole() || '').toLowerCase();
                if (role === 'client') {
                    window.location.hash = `#/${Config.routes.clientDashboard}`;
                } else if (role === 'admin') {
                    window.location.hash = `#/${Config.routes.adminDashboard}`;
                } else {
                    window.location.hash = `#/${Config.routes.clientDashboard}`; // Fallback
                }
            } else {
                if (result.mfaRequired) {
                    pendingEmail = email;
                    pendingPassword = password;
                    mfaModal.classList.remove('hidden');
                    btn.textContent = 'Sign In';
                    btn.disabled = false;
                    return;
                }

                errorDiv.textContent = result.error || 'Login failed';
                errorDiv.classList.remove('hidden');
                btn.textContent = 'Sign In';
                btn.disabled = false;
            }
        });

        if (!mfaConfirmBtn) {
            return;
        }

        mfaConfirmBtn.addEventListener('click', async () => {
            const token = document.getElementById('mfaToken').value;
            mfaError.classList.add('hidden');
            const result = await authService.loginMfa(pendingEmail, pendingPassword, token);
            if (result.success) {
                await authService.fetchMe().catch(() => {});
                const role = (authService.getUserRole() || '').toLowerCase();
                if (role === 'client') {
                    window.location.hash = `#/${Config.routes.clientDashboard}`;
                } else if (role === 'admin') {
                    window.location.hash = `#/${Config.routes.adminDashboard}`;
                } else {
                    window.location.hash = `#/${Config.routes.clientDashboard}`;
                }
                return;
            }

            mfaError.textContent = result.error || 'Invalid code';
            mfaError.classList.remove('hidden');
        });
    }

    async loadPublicTickets() {
        const tbody = document.getElementById('ticketsBody');
        if (!tbody || !tbody.isConnected) {
            return;
        }
        try {
            const tickets = await ticketService.getPublicTickets();
            if (!document.getElementById('ticketsBody')) {
                return;
            }

            if (tickets.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center padding-md">No public tickets found.</td></tr>';
                return;
            }

            tbody.innerHTML = tickets.map((ticket) => {
                const rawId = ticket.id ?? '';
                const safeId = this.escapeHtml(String(rawId));

                return `
                <tr class="fade-in-row">
                    <td class="text-mute">#T-${safeId}</td>
                    <td class="font-medium">${this.escapeHtml(ticket.title)}</td>
                    <td><span class="status-pill status-${this.toSafeClass(ticket.status || 'open')}">${this.escapeHtml(ticket.status || 'OPEN')}</span></td>
                    <td class="text-mute text-sm">${new Date(ticket.createdAt).toLocaleDateString()}</td>
                </tr>
            `;
            }).join('');

        } catch (error) {
            console.error('Failed to load tickets', error);
            if (document.getElementById('ticketsBody')) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-error">Failed to load tickets.</td></tr>';
            }
        }
    }
}

