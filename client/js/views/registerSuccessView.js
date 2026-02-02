import BaseView from './baseView.js';
import { Config } from '../config/config.js';

export default class RegisterSuccessView extends BaseView {
    constructor(params) {
        super(params);
        this.setTitle('Registration Complete');
    }

    async getHtml() {
        return `
            <div class="container flex justify-center items-center" style="min-height: 100vh;">
                <div class="card fade-in text-center" style="width: 100%; max-width: 400px; padding: 40px;">
                    <div style="background: #DCFCE7; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                        <span style="font-size: 40px; color: var(--primary);"></span>
                    </div>
                    
                    <h2 class="h2 margin-bottom-sm">Registration Complete!</h2>
                    <p class="text-mute margin-bottom-lg">
                        Welcome to SimpleTicketDesk. Your account has been successfully created.
                        You can now sign in to access your dashboard.
                    </p>

                    <a href="#/${Config.routes.login}" class="btn btn-primary full-width margin-bottom-md" style="text-decoration: none;">Sign In to Dashboard</a>
                    
                    <a href="#/${Config.routes.login}" class="text-sm text-mute">Back to Home</a>
                </div>
            </div>
        `;
    }

    async render() {
        return this.getHtml();
    }
}

