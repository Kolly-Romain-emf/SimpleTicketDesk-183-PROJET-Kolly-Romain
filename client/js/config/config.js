export const Config = {
    appName: 'SimpleTicketDesk',
    version: '1.0.0',
    apiBaseUrl: '/api', // Functionality for later
    routes: {
        login: 'login',
        dashboard: 'dashboard',
        clientDashboard: 'client-dashboard',
        adminDashboard: 'admin-dashboard',
        register: 'register',
        registerSuccess: 'register-success',
        createTicket: 'create-ticket',
        ticketCreated: 'ticket-created',
        ticketList: 'tickets',
        ticketDetail: 'ticket-detail', // /ticket-detail/:id
        users: 'users',
        systemLogs: 'logs',
        profile: 'profile'
    }
};
