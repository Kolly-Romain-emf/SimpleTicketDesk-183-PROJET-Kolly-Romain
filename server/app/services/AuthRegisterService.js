import bcrypt from 'bcrypt';
import { User } from '../models/userModel.js';

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

export class AuthRegisterService {
  static async registerUser(userData) {
    // Accepte aussi firstName/lastName du front
    const lastname = userData.lastname || userData.lastName;
    const firstname = userData.firstname || userData.firstName;
    const { email, password } = userData;
    const role = 'USER';

    // Verifie si l'email existe deja
    const existing = await User.getUserByEmail(email);
    if (existing) {
      return { ok: false, reason: 'EMAIL_EXISTS' };
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await User.createNewUser({
      lastname,
      firstname,
      email,
      password_hash,
      role,
    });

    // Recupere l'utilisateur cree
    const created = await User.getUserById(result.insertId);
    const { password_hash: _, ...safeUser } = created;
    return { ok: true, user: safeUser };
  }
}
