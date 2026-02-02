import { api } from './api.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.loadSession();
    }

    normalizeRole(role) {
        if (!role) return null;
        const value = String(role).toLowerCase();
        if (value === 'admin') return 'admin';
        if (value === 'client' || value === 'user') return 'client';
        return value;
    }

    getNormalizedUser() {
        const u = this.currentUser || {};
        return {
            id: u.id || u.pk_user || null,
            firstName: u.firstName || u.firstname || 'User',
            lastName: u.lastName || u.lastname || '',
            role: this.normalizeRole(u.role || 'client')
        };
    }

    async login(email, password) {
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response && response.mfaRequired) {
                return { success: false, mfaRequired: true };
            }
            if (response && response.user) {
                this.setSession(response.user);
            } else {
                return { success: false, error: 'Invalid login response' };
            }
            return { success: true };
        } catch (error) {
            console.error('Login failed', error);
            return { success: false, error: error.message };
        }
    }

    async loginMfa(email, password, token) {
        try {
            const response = await api.post('/auth/login-mfa', { email, password, token });
            if (response && response.user) {
                this.setSession(response.user);
            } else {
                return { success: false, error: 'Invalid MFA response' };
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async register(userData) {
        try {
            const response = await api.post('/auth/register', userData);
            // Auto login after register
            if (response && response.user) {
                this.setSession(response.user);
                return { success: true };
            }
            return { success: false, error: 'Invalid register response' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    logout() {
        api.post('/auth/logout').catch(() => {});
        this.currentUser = null;
        this.isAuthenticated = false;
        this.clearStoredUser();
        window.location.hash = '#/login';
    }

    setSession(user) {
        this.currentUser = user;
        this.isAuthenticated = true;
        this.storeUser(user);
    }

    loadSession() {
        const userStr = this.getStoredUser();
        if (userStr) {
            try {
                this.currentUser = JSON.parse(userStr);
            } catch (_e) {
                this.currentUser = null;
            }
        }
        // Do not trust localStorage for auth; only the server session can confirm.
        this.isAuthenticated = false;
    }

    async fetchMe() {
        try {
            const data = await api.get('/auth/me');
            if (data && data.user) {
                this.setSession(data.user);
                return { success: true, user: data.user };
            }
        } catch (error) {
            this.currentUser = null;
            this.isAuthenticated = false;
            this.clearStoredUser();
            return { success: false, error: error.message };
        }
    }

    async enableMfa() {
        try {
            const data = await api.post('/auth/enable-mfa');
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    isLoggedIn() {
        return Boolean(this.isAuthenticated && this.currentUser);
    }

    getUserRole() {
        return this.normalizeRole(this.currentUser ? this.currentUser.role : null);
    }

    storeUser(user) {
        try {
            localStorage.setItem('user', JSON.stringify(user));
        } catch (_e) {
            this._memoryUser = JSON.stringify(user);
        }
    }

    getStoredUser() {
        try {
            return localStorage.getItem('user');
        } catch (_e) {
            return this._memoryUser || null;
        }
    }

    clearStoredUser() {
        try {
            localStorage.removeItem('user');
        } catch (_e) {
            this._memoryUser = null;
        }
    }
}

export const authService = new AuthService();
