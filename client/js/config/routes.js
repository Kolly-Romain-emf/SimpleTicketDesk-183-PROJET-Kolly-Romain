import { Config } from './config.js';

export const Routes = {
    [Config.routes.login]: {
        view: 'loginView',
        public: true
    },
    [Config.routes.register]: {
        view: 'registerView',
        public: true
    },
    [Config.routes.registerSuccess]: {
        view: 'registerSuccessView',
        public: true
    },
    [Config.routes.clientDashboard]: {
        view: 'clientDashboardView',
        roles: ['client']
    },
    [Config.routes.adminDashboard]: {
        view: 'adminDashboardView',
        roles: ['admin']
    },
    [Config.routes.createTicket]: {
        view: 'createTicketView',
        roles: ['client', 'admin']
    },
    [Config.routes.ticketCreated]: {
        view: 'ticketCreatedView',
        roles: ['client', 'admin']
    },
    [Config.routes.ticketList]: {
        view: 'ticketListView',
        roles: ['client', 'admin']
    },
    [Config.routes.ticketDetail]: {
        view: 'ticketDetailView',
        public: true,
        allowAuthed: true
    },
    [Config.routes.profile]: {
        view: 'profileView',
        roles: ['client', 'admin']
    },
    [Config.routes.users]: {
        view: 'userManagementView',
        roles: ['admin']
    },
    [Config.routes.systemLogs]: {
        view: 'systemLogsView',
        roles: ['admin']
    },
    default: Config.routes.login
};
