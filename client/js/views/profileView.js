import BaseView from './baseView.js';
import { authService } from '../services/authService.js';
import { api } from '../services/api.js';
import { Config } from '../config/config.js';

export default class ProfileView extends BaseView {
    constructor(params) {
        super(params);
        this.setTitle('Profile');
    }

    async getHtml() {
        const normalized = authService.getNormalizedUser();
        const u = authService.currentUser || {};
        const user = {
            id: normalized.id,
            firstName: normalized.firstName,
            lastName: normalized.lastName,
            role: normalized.role,
            email: u.email || 'user@example.com'
        };
        const safeFirstName = this.escapeHtml(user.firstName || '');
        const safeLastName = this.escapeHtml(user.lastName || '');
        const safeRole = this.escapeHtml(user.role || '');
        const safeEmail = this.escapeHtml(user.email || '');
        const safeInitial = this.escapeHtml(String(user.firstName || 'U')[0] || 'U');
        const sidebar = this.getSidebarHtml(Config.routes.profile, user);

        return `
            <div class="dashboard-layout">
                ${sidebar}
                <main class="main-content">
                     <header class="top-bar">
                        <h1 class="h1">Settings</h1>
                    </header>

                    <div class="flex gap-lg">
                        <div class="card" style="flex: 1; max-width: 600px;">
                            <h2 class="h2 margin-bottom-lg">Profile Information</h2>
                            
                            <div class="flex items-center gap-md margin-bottom-xl">
                                <div class="avatar" id="profileAvatar" style="width: 80px; height: 80px; font-size: 32px; background: #E5E7EB; color: #6B7280;">
                                    ${safeInitial}
                                </div>
                                <div>
                                    <h3 class="h3" id="profileName">${safeFirstName} ${safeLastName}</h3>
                                    <p class="text-mute" id="profileRole">${safeRole}</p>
                                </div>
                            </div>

                            <form id="profileForm">
                                <div class="flex gap-md">
                                    <div class="input-group" style="flex: 1;">
                                        <label>First Name</label>
                                        <input type="text" id="profileFirstName" class="input-control" value="${safeFirstName}">
                                    </div>
                                    <div class="input-group" style="flex: 1;">
                                        <label>Last Name</label>
                                        <input type="text" id="profileLastName" class="input-control" value="${safeLastName}">
                                    </div>
                                </div>
                                <div class="input-group">
                                    <label>Email Address</label>
                                    <input type="email" id="profileEmail" class="input-control" value="${safeEmail}" disabled style="background: #F3F4F6;">
                                </div>
                                <div id="profileError" class="error-msg hidden"></div>
                                <button class="btn btn-primary margin-top-md" type="submit">Save Changes</button>
                            </form>
                        </div>

                         <div class="card" style="flex: 1; max-width: 500px; height: fit-content;">
                            <h2 class="h2 margin-bottom-lg">Security</h2>
                            
                            <form id="passwordForm">
                                <div class="input-group">
                                    <label>New Password</label>
                                    <input type="password" id="newPassword" class="input-control">
                                </div>
                                <div class="input-group">
                                    <label>Confirm New Password</label>
                                    <input type="password" id="confirmPassword" class="input-control">
                                </div>
                                <div id="passwordError" class="error-msg hidden"></div>
                                <button class="btn btn-secondary margin-top-md" type="submit">Update Password</button>
                            </form>

                            <div class="margin-top-xl padding-top-lg border-top">
                                <h3 class="h3 margin-bottom-sm text-error">Danger Zone</h3>
                                <button class="btn btn-text text-error" onclick="alert('Log out all sessions mocked')">Log out of all other sessions</button>
                            </div>

                            <div class="margin-top-xl padding-top-lg border-top">
                                <h3 class="h3 margin-bottom-sm">Two-Factor Authentication</h3>
                                <p class="text-sm text-mute">Protect your account with a TOTP authenticator.</p>
                                <button class="btn btn-secondary margin-top-sm" id="enableMfaBtn">Enable MFA</button>
                                <div id="mfaSetupPanel" class="hidden" style="margin-top: 12px; border: 1px solid #E5E7EB; padding: 12px; border-radius: 8px;">
                                    <p class="text-sm text-mute">Scan this QR code in your authenticator app.</p>
                                    <img id="mfaQr" alt="MFA QR Code" style="max-width: 220px; display: block; margin: 8px 0;">
                                    <p class="text-sm text-mute">Secret (base32):</p>
                                    <code id="mfaSecret" class="text-sm"></code>
                                </div>
                                <div id="mfaSetupError" class="error-msg hidden"></div>
                            </div>
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
        if (document.getElementById('logoutBtn')) {
            document.getElementById('logoutBtn').addEventListener('click', () => authService.logout());
        }

        const enableBtn = document.getElementById('enableMfaBtn');
        const panel = document.getElementById('mfaSetupPanel');
        const error = document.getElementById('mfaSetupError');
        const qr = document.getElementById('mfaQr');
        const secret = document.getElementById('mfaSecret');

        if (enableBtn) {
            enableBtn.addEventListener('click', async () => {
                error.classList.add('hidden');
                const result = await authService.enableMfa();
                if (!result.success) {
                    error.textContent = result.error || 'Failed to enable MFA';
                    error.classList.remove('hidden');
                    return;
                }
                qr.src = result.data.qrCodeBase64;
                secret.textContent = result.data.secretBase32;
                panel.classList.remove('hidden');
            });
        }

        const profileForm = document.getElementById('profileForm');
        const profileError = document.getElementById('profileError');
        const passwordForm = document.getElementById('passwordForm');
        const passwordError = document.getElementById('passwordError');
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

        const updateProfileDisplay = (user) => {
            const first = user.firstname || user.firstName || '';
            const last = user.lastname || user.lastName || '';
            const role = authService.normalizeRole(user.role || '');
            document.getElementById('profileFirstName').value = first;
            document.getElementById('profileLastName').value = last;
            document.getElementById('profileName').textContent = `${first} ${last}`.trim();
            document.getElementById('profileRole').textContent = role;
            document.getElementById('profileAvatar').textContent = (first || 'U')[0];
        };

        try {
            const data = await authService.fetchMe();
            if (data.success && data.user) {
                updateProfileDisplay(data.user);
            }
        } catch (err) {
            if (err && err.message === 'Unauthorized') {
                authService.logout();
                return;
            }
        }

        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            profileError.classList.add('hidden');
            const firstName = document.getElementById('profileFirstName').value;
            const lastName = document.getElementById('profileLastName').value;

            try {
                const updated = await api.put('/users/me', {
                    firstname: firstName,
                    lastname: lastName,
                });
                authService.setSession(updated.user);
                updateProfileDisplay(updated.user);
            } catch (err) {
                profileError.textContent = err.message || 'Update failed';
                profileError.classList.remove('hidden');
            }
            });
        }

        if (passwordForm) {
            passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            passwordError.classList.add('hidden');
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!newPassword || newPassword !== confirmPassword) {
                passwordError.textContent = 'Passwords do not match';
                passwordError.classList.remove('hidden');
                return;
            }
            if (newPassword.length < 8 || !passwordPattern.test(newPassword)) {
                passwordError.textContent = 'Password must be 8+ chars with upper/lower/number/special';
                passwordError.classList.remove('hidden');
                return;
            }

            try {
                await api.put('/users/me', { password: newPassword });
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            } catch (err) {
                passwordError.textContent = err.message || 'Password update failed';
                passwordError.classList.remove('hidden');
            }
            });
        }
    }
}
