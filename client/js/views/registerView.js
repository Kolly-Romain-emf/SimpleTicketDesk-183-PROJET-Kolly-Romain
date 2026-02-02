import BaseView from './baseView.js';
import { authService } from '../services/authService.js';
import { Config } from '../config/config.js';

export default class RegisterView extends BaseView {
    constructor(params) {
        super(params);
        this.setTitle('Create Account');
    }

    async getHtml() {
        return `
            <div class="container flex justify-center items-center" style="min-height: 100vh;">
                <div class="card fade-in" style="width: 100%; max-width: 480px;">
                    <div class="text-center margin-bottom-lg">
                        <span class="logo-icon" style="font-size: 32px;"></span>
                        <h2 class="h2 margin-top-sm">Create an Account</h2>
                        <p class="text-mute margin-top-xs">Join SimpleTicketDesk for internal tracking.</p>
                    </div>

                    <form id="registerForm">
                        <div class="flex gap-md">
                            <div class="input-group" style="flex: 1;">
                                <input type="text" id="firstName" class="input-control" placeholder="First Name" required>
                            </div>
                            <div class="input-group" style="flex: 1;">
                                <input type="text" id="lastName" class="input-control" placeholder="Last Name" required>
                            </div>
                        </div>

                        <div class="input-group">
                            <input type="email" id="email" class="input-control" placeholder="Work Email Address" required>
                        </div>

                        <div class="input-group">
                            <select id="department" class="input-control">
                                <option value="" disabled selected>Select Department (Optional)</option>
                                <option value="Engineering">Engineering</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Sales">Sales</option>
                                <option value="HR">HR</option>
                            </select>
                        </div>

                        <div class="input-group">
                            <input type="password" id="password" class="input-control" placeholder="Password" required>
                        </div>

                        <div class="input-group">
                            <input type="password" id="confirmPassword" class="input-control" placeholder="Confirm Password" required>
                        </div>

                        <div class="password-requirements" style="background: #F9FAFB; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                            <p class="text-xs font-bold margin-bottom-xs">Password requirements:</p>
                            <ul class="text-xs text-mute" style="padding-left: 20px; list-style-type: disc;">
                                <li>At least 8 characters</li>
                                <li>One lowercase letter</li>
                                <li>One uppercase letter</li>
                                <li>One number</li>
                                <li>One special character</li>
                            </ul>
                        </div>

                        <button type="submit" class="btn btn-primary full-width" id="registerBtn">Create Account </button>
                        <div id="register-error" class="error-msg hidden"></div>
                    </form>

                    <div class="text-center margin-top-lg">
                        <p class="text-sm text-mute">Already have an account? <a href="#/${Config.routes.login}" class="text-primary btn-text">Sign In</a></p>
                    </div>
                </div>
            </div>
        `;
    }

    async render() {
        return this.getHtml();
    }

    async afterRender() {
        const form = document.getElementById('registerForm');
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('email').value;
            const department = document.getElementById('department').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorDiv = document.getElementById('register-error');

            errorDiv.classList.add('hidden');

            // Validation
            if (password !== confirmPassword) {
                this.showError('Passwords do not match');
                return;
            }
            if (password.length < 8 || !passwordPattern.test(password)) {
                this.showError('Password must be 8+ chars with upper/lower/number/special');
                return;
            }

            const btn = document.getElementById('registerBtn');
            btn.textContent = 'Creating Account...';
            btn.disabled = true;

            const userData = { firstName, lastName, email, department, password };
            const result = await authService.register(userData);

            if (result.success) {
                window.location.hash = `#/${Config.routes.registerSuccess}`;
            } else {
                this.showError(result.error || 'Registration failed');
                btn.textContent = 'Create Account ';
                btn.disabled = false;
            }
        });
    }

    showError(msg) {
        const errorDiv = document.getElementById('register-error');
        errorDiv.textContent = msg;
        errorDiv.classList.remove('hidden');
    }
}

