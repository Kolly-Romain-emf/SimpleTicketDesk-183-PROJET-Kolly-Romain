import { Router } from './router.js';
import { authService } from '../services/authService.js';

class AppController {
    constructor() {
        console.log('App Initializing...');
        this.init();
    }

    async init() {
        try {
            if (authService.getStoredUser()) {
                await authService.fetchMe();
            }
        } catch (_e) {
            // Ignore session restore errors
        }
        this.router = new Router('app');
    }
}

// Start the app
const app = new AppController();
window.app = app; // For debugging
