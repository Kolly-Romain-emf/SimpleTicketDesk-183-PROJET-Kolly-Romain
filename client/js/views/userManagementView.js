import BaseView from './baseView.js';
import { authService } from '../services/authService.js';
import { api } from '../services/api.js'; // Direct API access for users for now
import { Config } from '../config/config.js';

export default class UserManagementView extends BaseView {
    constructor(params) {
        super(params);
        this.setTitle('User Management');
        // Simple state for filtering/view
        this.isEditing = false;
        this.editingUserId = null;
    }

    async getHtml() {
        const user = authService.getNormalizedUser();
        const sidebar = this.getSidebarHtml(Config.routes.users, user);

        return `
            <div class="dashboard-layout">
                ${sidebar}
                <main class="main-content">
                    <header class="top-bar">
                        <h1 class="h1">User Management</h1>
                        <button id="addUserBtn" class="btn btn-primary">
                            <span class="icon-plus">+</span> Add User
                        </button>
                    </header>

                    <!-- Main List View -->
                    <div id="users-list-view" class="card fade-in">
                        <div class="flex justify-between items-center margin-bottom-md">
                             <div class="flex gap-sm">
                                <input type="text" id="userSearch" class="input-control" placeholder="Search users..." style="width: 300px;">
                                <select id="roleFilter" class="input-control" style="width: 150px;">
                                    <option value="All">All Roles</option>
                                    <option value="client">Client</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="usersBody">
                                <tr><td colspan="3" class="text-center">Loading users...</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Add/Edit Form (Hidden by default) -->
                    <div id="user-form-view" class="card fade-in hidden">
                         <div class="flex justify-between items-center margin-bottom-lg border-bottom padding-bottom-md">
                            <h2 class="h2" id="formTitle">Add New User</h2>
                            <button class="btn btn-secondary" id="cancelBtn">Cancel</button>
                        </div>
                        
                        <form id="userForm" style="max-width: 600px;">
                            <div class="flex gap-md">
                                <div class="input-group" style="flex: 1;">
                                    <label>First Name</label>
                                    <input type="text" id="fName" class="input-control" required>
                                </div>
                                <div class="input-group" style="flex: 1;">
                                    <label>Last Name</label>
                                    <input type="text" id="lName" class="input-control" required>
                                </div>
                            </div>
                            
                            <div class="input-group">
                                <label>Email Address</label>
                                <input type="email" id="uEmail" class="input-control" required>
                            </div>

                             <div class="flex gap-md">
                                <div class="input-group" style="flex: 1;">
                                    <label>Role</label>
                                    <select id="uRole" class="input-control" required>
                                        <option value="client">Client</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                            </div>
                            <div class="input-group">
                                <label>Password (required for new user)</label>
                                <input type="password" id="uPassword" class="input-control">
                            </div>
                            <div id="userFormError" class="error-msg hidden"></div>

                             <div class="margin-top-lg">
                                <button type="submit" class="btn btn-primary">Save User</button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        `;
    }

    async render() {
        return this.getHtml();
    }

    async afterRender() {
        if (document.getElementById('logoutBtn')) {
            document.getElementById('logoutBtn').addEventListener('click', () => authService.logout());
        }

        // Navigation / Form toggling
        document.getElementById('addUserBtn').addEventListener('click', () => this.showForm());
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideForm());

        // Form Submit
        document.getElementById('userForm').addEventListener('submit', (e) => this.handleSave(e));

        // Load data
        await this.loadUsers();

        // Filters
        document.getElementById('userSearch').addEventListener('input', (e) => this.filterUsers());
        document.getElementById('roleFilter').addEventListener('change', (e) => this.filterUsers());
    }

    async loadUsers() {
        try {
            const data = await api.get('/users');
            const users = Array.isArray(data?.users) ? data.users : [];
            this.users = users.map((u) => ({
                id: u.pk_user,
                firstName: u.firstname,
                lastName: u.lastname,
                email: u.email,
                role: String(u.role || '').toLowerCase(),
                status: 'Active',
            }));
            this.renderTable(this.users);
        } catch (error) {
            console.error(error);
        }
    }

    renderTable(users) {
        const tbody = document.getElementById('usersBody');
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-mute padding-lg">No users found.</td></tr>';
            return;
        }

        tbody.innerHTML = users.map((u) => {
            const safeId = this.escapeHtml(String(u.id ?? ''));

            return `
            <tr>
                <td>
                    <div class="flex items-center gap-sm">
                         <div class="avatar-sm" style="width: 32px; height: 32px; font-size: 12px; background: #E5E7EB; color: #6B7280;">
                            ${this.escapeHtml((u.firstName || '?')[0])}
                        </div>
                        <div>
                            <div class="font-medium text-sm">${this.escapeHtml(u.firstName)} ${this.escapeHtml(u.lastName)}</div>
                            <div class="text-xs text-mute">${this.escapeHtml(u.email)}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge" style="text-transform: capitalize;">${this.escapeHtml(u.role)}</span></td>
                <td>
                    <button class="btn btn-text text-primary text-sm edit-btn" data-id="${safeId}">Edit</button>
                    <button class="btn btn-text text-error text-sm delete-btn" style="margin-left: 8px;" data-id="${safeId}">Delete</button>
                </td>
            </tr>
        `;
        }).join('');

        // Attach event listeners to buttons
        tbody.querySelectorAll('.edit-btn').forEach(b => {
            b.addEventListener('click', () => this.editUser(b.dataset.id));
        });
        tbody.querySelectorAll('.delete-btn').forEach(b => {
            b.addEventListener('click', () => this.deleteUser(b.dataset.id));
        });
    }

    filterUsers() {
        const term = document.getElementById('userSearch').value.toLowerCase();
        const role = document.getElementById('roleFilter').value;

        const filtered = this.users.filter(u => {
            const matchesSearch = (u.firstName + ' ' + u.lastName + u.email).toLowerCase().includes(term);
            const matchesRole = role === 'All' || u.role === role;
            return matchesSearch && matchesRole;
        });

        this.renderTable(filtered);
    }

    showForm(userId = null) {
        document.getElementById('users-list-view').classList.add('hidden');
        document.getElementById('addUserBtn').classList.add('hidden');
        document.getElementById('user-form-view').classList.remove('hidden');

        const title = document.getElementById('formTitle');
        const form = document.getElementById('userForm');

        if (userId) {
            title.textContent = 'Edit User';
            const user = this.users.find(u => String(u.id) === String(userId));
            this.editingUserId = userId;
            // Populate form
            document.getElementById('fName').value = user.firstName;
            document.getElementById('lName').value = user.lastName;
            document.getElementById('uEmail').value = user.email;
            document.getElementById('uRole').value = user.role;
            document.getElementById('uPassword').value = '';
        } else {
            title.textContent = 'Add New User';
            this.editingUserId = null;
            form.reset();
        }
    }

    hideForm() {
        document.getElementById('users-list-view').classList.remove('hidden');
        document.getElementById('addUserBtn').classList.remove('hidden');
        document.getElementById('user-form-view').classList.add('hidden');
        this.editingUserId = null;
    }

    editUser(id) {
        this.showForm(id);
    }

    async handleSave(e) {
        e.preventDefault();
        const error = document.getElementById('userFormError');
        error.classList.add('hidden');
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
        const firstName = document.getElementById('fName').value;
        const lastName = document.getElementById('lName').value;
        const email = document.getElementById('uEmail').value;
        const role = document.getElementById('uRole').value;
        const password = document.getElementById('uPassword').value;

        const apiRole = role === 'admin' ? 'ADMIN' : 'USER';

        try {
            if (password && (password.length < 8 || !passwordPattern.test(password))) {
                error.textContent = 'Password must be 8+ chars with upper/lower/number/special';
                error.classList.remove('hidden');
                return;
            }
            if (this.editingUserId) {
                const payload = {
                    firstname: firstName,
                    lastname: lastName,
                    email,
                    role: apiRole,
                };
                if (password) payload.password = password;
                await api.put(`/users/${this.editingUserId}`, payload);
            } else {
                if (!password) {
                    error.textContent = 'Password is required for new users';
                    error.classList.remove('hidden');
                    return;
                }
                await api.post('/users', {
                    firstname: firstName,
                    lastname: lastName,
                    email,
                    password,
                    role: apiRole,
                });
            }

            await this.loadUsers();
            this.hideForm();
        } catch (err) {
            error.textContent = err.message || 'Save failed';
            error.classList.remove('hidden');
        }
    }

    async deleteUser(id) {
        if (!confirm('Delete this user?')) return;
        try {
            await api.request('DELETE', `/users/${id}`);
            await this.loadUsers();
        } catch (err) {
            console.error(err);
        }
    }
}
