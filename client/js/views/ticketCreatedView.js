import BaseView from './baseView.js';
import { Config } from '../config/config.js';

export default class TicketCreatedView extends BaseView {
    constructor(params) {
        super(params);
        this.setTitle('Ticket Created');

        // params array where first element part of path, or we can use URLSearchParams if passed in router. 
        // My router passes 'params' as array of path segments. 
        // Need to parse query params if I use ?id=123.
        // My router doesn't parse query params well in 'params' argument yet (it splits by /).
        // So let's parse window.location.hash or search manually.
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
        this.ticketId = urlParams.get('id') || 'Unknown';
    }

    async getHtml() {
        const safeTicketId = this.escapeHtml(this.ticketId);
        const ticketIdPath = encodeURIComponent(String(this.ticketId || ''));

        return `
            <div class="container flex justify-center items-center" style="min-height: 100vh; background-color: var(--background);">
                <div class="card text-center fade-in" style="width: 100%; max-width: 500px; padding: 60px 40px;">
                    <div style="background: #DCFCE7; width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 32px;">
                        <span style="font-size: 48px; color: var(--primary);"></span>
                    </div>

                    <h2 class="h2" style="font-size: 28px; margin-bottom: 12px;">Ticket #${safeTicketId} Created!</h2>
                    
                    <p class="text-mute margin-bottom-xl" style="line-height: 1.6;">
                        Thank you. We have received your bug report. A support agent will be assigned within 24 hours.
                    </p>

                    <div class="flex gap-md justify-center">
                        <a href="#/${Config.routes.ticketDetail}/${ticketIdPath}" class="btn btn-primary">View Ticket Details</a>
                        <a href="#/${Config.routes.createTicket}" class="btn btn-secondary">+ Create New Ticket</a>
                    </div>

                    <div class="margin-top-xl">
                        <a href="#/${Config.routes.clientDashboard}" class="text-sm text-mute">Back to Dashboard</a>
                    </div>
                </div>
            </div>
        `;
    }

    async render() {
        return this.getHtml();
    }
}

