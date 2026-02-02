const API_BASE_URL = '/api';

class ApiService {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    getErrorMessage(status) {
        switch (status) {
            case 400:
                return 'Invalid request';
            case 401:
                return 'Unauthorized';
            case 403:
                return 'Forbidden';
            case 404:
                return 'Not found';
            case 409:
                return 'Request conflict';
            default:
                return 'Server error';
        }
    }

    async get(endpoint) {
        return this.request('GET', endpoint);
    }

    async post(endpoint, data) {
        return this.request('POST', endpoint, data);
    }

    async put(endpoint, data) {
        return this.request('PUT', endpoint, data);
    }

    async request(method, endpoint, data) {
        const headers = {
            'Content-Type': 'application/json',
        };

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers,
            credentials: 'include', // important pour envoyer le cookie de session
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            const message = this.getErrorMessage(response.status);
            throw new Error(message);
        }

        // Si pas de contenu (204), retourner null
        if (response.status === 204) return null;
        return response.json();
    }
}

export const api = new ApiService();
