import bcrypt from 'bcrypt';
import { User } from '../models/userModel.js';

// Compare login credentials: returns ok=false for expected failures, or the user without password hash
export class AuthCompareLoginService {
  static async compareLogin(emailInput, passwordInput) {
    const user = await User.getUserByEmail(emailInput);
    if (!user) {
      return { ok: false, reason: 'USER_NOT_FOUND' };
    }

    const isMatch = await bcrypt.compare(passwordInput, user.password_hash);
    if (!isMatch) {
      return { ok: false, reason: 'INVALID_PASSWORD' };
    }

    const { password_hash, mfa_secret_base32, ...safeUser } = user;
    return { ok: true, user: safeUser, mfaSecret: mfa_secret_base32 };
  }
}
