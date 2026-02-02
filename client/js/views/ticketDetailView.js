import BaseView from './baseView.js';
import { ticketService } from '../services/ticketService.js';
import { authService } from '../services/authService.js';
import { Config } from '../config/config.js';

export default class TicketDetailView extends BaseView {
    constructor(params) {
        super(params);
        this.ticketId = params[0];
        this.setTitle(`Ticket #${this.ticketId}`);
    }

    async getHtml() {
        const isAuthed = authService.isLoggedIn();
        const user = authService.getNormalizedUser();
        const sidebar = isAuthed ? this.getSidebarHtml(Config.routes.ticketList, user) : '';
        const wrapperClass = isAuthed ? 'dashboard-layout' : 'container';
        const safeTicketId = this.escapeHtml(this.ticketId);

        return `
            <div class="${wrapperClass}">
                ${sidebar}

                <main class="main-content">
                    <nav class="breadcrumbs margin-bottom-lg">
                         <a href="#/${isAuthed ? Config.routes.ticketList : Config.routes.login}" class="text-mute text-sm">
                            ${isAuthed ? 'Tickets' : 'Login'}
                         </a>
                         <span class="text-mute text-sm">/</span>
                         <span class="text-sm font-medium">#T-${safeTicketId}</span>
                    </nav>

                    <div id="ticket-content">
                        <div class="text-center padding-xl">Loading ticket details...</div>
                    </div>
                </main>
            </div>
        `;
    }

    async render() {
        return this.getHtml();
    }

    async afterRender() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', () => authService.logout());

        await this.loadTicketDetails();
    }

    async loadTicketDetails() {
        try {
            const ticket = await ticketService.getTicketById(this.ticketId);
            if (!ticket) {
                document.getElementById('ticket-content').innerHTML = `
                    <div class="card text-center padding-xl">
                        <h2 class="h2">Ticket Not Found</h2>
                        <a href="#/${Config.routes.ticketList}" class="btn btn-primary margin-top-md">Back to Tickets</a>
                    </div>
                `;
                return;
            }

            this.ticket = ticket;
            this.renderTicketContent(ticket);

        } catch (error) {
            console.error(error);
            document.getElementById('ticket-content').innerHTML = `
                    <div class="card text-center padding-xl">
                        <h2 class="h2 text-error">Error Loading Ticket</h2>
                        <p class="text-mute">${this.escapeHtml(error.message)}</p>
                    </div>
                `;
        }
    }

    renderTicketContent(ticket) {
        const container = document.getElementById('ticket-content');
        const statusText = ticket.status || 'OPEN';
        const visibilityLabel = ticket.isPublic ? 'Public' : 'Private';
        const safeStatus = this.escapeHtml(statusText);
        const safeStatusClass = this.toSafeClass(statusText);
        const safePriority = this.escapeHtml(ticket.priority || 'Normal');
        const safeCategory = this.escapeHtml(ticket.category || 'General');
        const safeRequester = this.escapeHtml(ticket.requesterId || ticket.ownerId || '');
        const safeVisibility = this.escapeHtml(visibilityLabel);
        const safeTicketId = this.escapeHtml(String(ticket.id ?? ''));

        container.innerHTML = `
            <div class="content-grid" style="grid-template-columns: 2.5fr 1fr;">
                 <!-- Left Column -->
                 <div class="flex flex-col gap-lg">
                    <div class="card">
                        <div class="flex justify-between items-start margin-bottom-md">
                            <div>
                                <h1 class="h2 margin-bottom-xs">#T-${safeTicketId} ${this.escapeHtml(ticket.title)}</h1>
                                <div class="flex gap-sm">
                                    <span class="status-pill status-${safeStatusClass}">${safeStatus}</span>
                                    <span class="badge">${safePriority} Priority</span>
                                    <span class="badge">${safeCategory}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="margin-top-md">
                            <h3 class="text-sm font-medium text-mute uppercase margin-bottom-sm">Description</h3>
                            <p class="text-base" style="white-space: pre-wrap;">${this.escapeHtml(ticket.description)}</p>
                        </div>
                    </div>

                    <div class="card">
                        <h3 class="h2 margin-bottom-md">Discussion</h3>
                        <p class="text-mute">Comments are not implemented yet.</p>
                    </div>
                 </div>

                 <!-- Right Column -->
                 <div class="flex flex-col gap-lg">
                    <div class="card">
                        <h3 class="text-sm font-medium text-mute uppercase margin-bottom-md">Ticket Details</h3>
                        
                        <div class="flex flex-col gap-md">
                            <div>
                                <span class="text-xs text-mute block">Requester</span>
                                <div class="flex items-center gap-sm margin-top-xs">
                                    <div class="avatar-sm" style="width: 24px; height: 24px; font-size: 10px;">U</div>
                                    <span class="text-sm font-medium">User ${safeRequester}</span>
                                </div>
                            </div>
                             <div>
                                <span class="text-xs text-mute block">Visibility</span>
                                <span class="badge margin-top-xs">${safeVisibility}</span>
                            </div>
                             <div>
                                <span class="text-xs text-mute block">Created</span>
                                <span class="text-sm">${new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                 </div>
            </div>
        `;
    }
}
