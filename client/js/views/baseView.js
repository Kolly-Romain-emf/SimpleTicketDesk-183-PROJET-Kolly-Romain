/**
 * Base class for all views.
 */
export default class BaseView {
    constructor(params) {
        this.params = params;
        this.title = 'SimpleTicketDesk';
    }

    /**
     * Sets the document title.
     */
    setTitle(title) {
        document.title = `${title} | SimpleTicketDesk`;
    }

    /**
     * returns the HTML string for the view.
     * Use simple template literals.
     */
    async render() {
        return '';
    }

    /**
     * Called after the view is inserted into the DOM.
     * Use this to attach event listeners.
     */
    async afterRender() {
        // No-op by default
    }

    /**
     * Helper to safely escape HTML content to prevent XSS.
     */
    escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        return unsafe
            .toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Helper to normalize strings for safe CSS class names.
     */
    toSafeClass(value) {
        return String(value || '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }

    /**
     * Returns inline SVG markup for sidebar icons.
     */
    getIconSvg(name) {
        const icons = {
            dashboard: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                    <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                    <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                    <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                </svg>
            `,
            create: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9"></circle>
                    <path d="M12 8v8M8 12h8"></path>
                </svg>
            `,
            tickets: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                    <path d="M7 8h10M7 12h10M7 16h6"></path>
                </svg>
            `,
            users: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="3.5"></circle>
                    <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"></path>
                </svg>
            `,
            logs: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="4" cy="6" r="1"></circle>
                    <circle cx="4" cy="12" r="1"></circle>
                    <circle cx="4" cy="18" r="1"></circle>
                    <path d="M8 6h13M8 12h13M8 18h13"></path>
                </svg>
            `,
            settings: `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M4 6h16"></path>
                    <circle cx="9" cy="6" r="2"></circle>
                    <path d="M4 12h16"></path>
                    <circle cx="15" cy="12" r="2"></circle>
                    <path d="M4 18h16"></path>
                    <circle cx="12" cy="18" r="2"></circle>
                </svg>
            `,
        };

        return icons[name] || '';
    }

    /**
     * Returns sidebar HTML for authenticated views.
     * @param {string} activeRoute - The current active route for highlighting.
     * @param {object} user - The current user object.
     */
    getSidebarHtml(activeRoute, user) {
        const rawRole = (user.role || 'client').toString().toLowerCase();
        const safeFirstName = this.escapeHtml(user.firstName || user.firstname || 'User');
        const safeRole = this.escapeHtml(rawRole);

        // Simple mapping of routes to display names and icons
        const items = [
            { route: 'client-dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['client'] },
            { route: 'admin-dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['admin'] },
            { route: 'create-ticket', label: 'Create Ticket', icon: 'create', roles: ['client', 'admin'] },
            { route: 'tickets', label: 'Tickets', icon: 'tickets', roles: ['client', 'admin'] },
            { route: 'users', label: 'Users', icon: 'users', roles: ['admin'] },
            { route: 'logs', label: 'System Logs', icon: 'logs', roles: ['admin'] },
            { route: 'profile', label: 'Settings', icon: 'settings', roles: ['client', 'admin'] }
        ];

        // Filter by role
        const visibleItems = items.filter(item => item.roles.includes(rawRole));

        const navHtml = visibleItems.map(item => {
            const isActive = activeRoute === item.route ? 'active' : '';
            return `
                <a href="#/${item.route}" class="nav-item ${isActive}">
                    <span class="icon" aria-hidden="true">${this.getIconSvg(item.icon)}</span> ${item.label}
                </a>
            `;
        }).join('');

        return `
            <aside class="sidebar">
                <div class="sidebar-header">
                    <span class="logo-icon-sm">ST</span>
                    <span class="logo-text">SimpleTicketDesk</span>
                </div>
                
                <nav class="sidebar-nav">
                    ${navHtml}
                </nav>

                <div class="sidebar-footer">
                    <div class="user-info">
                        <div class="avatar">${this.escapeHtml(safeFirstName[0])}</div>
                        <div class="user-details">
                            <span class="user-name">${safeFirstName}</span>
                            <span class="user-role">${safeRole}</span>
                        </div>
                    </div>
                    <button id="logoutBtn" class="btn-icon" title="Logout">X</button>
                </div>
            </aside>
        `;
    }
}

