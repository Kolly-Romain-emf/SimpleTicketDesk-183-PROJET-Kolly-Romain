/**
 * Handles hash-based routing.
 */
import { Routes } from '../config/routes.js';
import { Config } from '../config/config.js';
import { authService } from '../services/authService.js';

const normalizeRole = (role) => (role ? String(role).toLowerCase() : '');

const getDefaultRouteForRole = (role) => {
    const r = normalizeRole(role);
    if (r === 'admin') return Config.routes.adminDashboard;
    if (r === 'client') return Config.routes.clientDashboard;
    return Config.routes.login;
};

export class Router {
    constructor(viewContainerId) {
        this.viewContainer = document.getElementById(viewContainerId);
        this.currentView = null;

        // Bind event
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());

        // Ensure initial render even if load already fired
        this.handleRoute();
    }

    async handleRoute() {
        let hash = window.location.hash.slice(1);

        // Normalize hash: remove leading slash if present (e.g., #/login -> login)
        if (hash.startsWith('/')) {
            hash = hash.slice(1);
        }

        if (!hash) {
            hash = Config.routes.login;
        }

        // Simple parameter parsing (e.g. ticket-detail/123)
        const parts = hash.split('/');
        const routeName = parts[0];
        const params = parts.slice(1);

        console.log(`Navigating to: ${routeName}, params: ${params}`);

        const routeConfig = Routes[routeName];

        if (!routeConfig) {
            console.warn(`Route not found: ${routeName}`);
            window.location.hash = Config.routes.login;
            return;
        }

        const isAuthed = authService.isLoggedIn();
        const userRole = normalizeRole(authService.getUserRole());

        if (routeConfig.public && isAuthed && !routeConfig.allowAuthed) {
            const target = `#/${getDefaultRouteForRole(userRole)}`;
            if (window.location.hash !== target) {
                window.location.hash = target;
            }
            return;
        }

        if (!routeConfig.public && !isAuthed) {
            const target = `#/${Config.routes.login}`;
            if (window.location.hash !== target) {
                window.location.hash = target;
            }
            return;
        }

        if (routeConfig.roles && isAuthed) {
            const allowedRoles = routeConfig.roles.map(normalizeRole);
            if (!allowedRoles.includes(userRole)) {
                const target = `#/${getDefaultRouteForRole(userRole)}`;
                if (window.location.hash !== target) {
                    window.location.hash = target;
                }
                return;
            }
        }

        await this.loadView(routeConfig.view, params);
    }

    async loadView(viewName, params) {
        // Clear current view
        this.viewContainer.innerHTML = ''; // Simplistic clear

        // Dynamically import view? Or use a registry?
        // Since we are vanilla ES modules, dynamic import is good.
        // We assume views are exported as default classes from their files.

        try {
            // Mapping viewName to file path
            // Convention: GlobalLoginView -> ../views/GlobalLoginView.js
            // We might need a map if names don't match exactly, but let's stick to convention.

            // Note: In a real app we might have a registry to avoid dynamic import path issues
            // or pre-import them in appController. 
            // Let's rely on a registry passed effectively or just strict naming.

            // For now, let's assume we have a centralized ViewFactory or similar in AppController
            // actually, let's trigger an event or callback to AppController to render, 
            // OR import here if we know the path.

            // Let's try dynamic import from views directory
            // We need to know where the file is.
            // Assumption: /js/views/${viewName}.js

            const cacheBust = Date.now();
            const module = await import(`../views/${viewName}.js?v=${cacheBust}`);
            const ViewClass = module.default;

            this.currentView = new ViewClass(params);
            const viewHtml = await this.currentView.render();
            this.viewContainer.innerHTML = viewHtml;

            if (this.currentView.afterRender) {
                this.currentView.afterRender();
            }

        } catch (error) {
            console.error(`Failed to load view ${viewName}:`, error);
            this.viewContainer.innerHTML = '<h1>404 - View Not Found</h1>';
        }
    }
}
