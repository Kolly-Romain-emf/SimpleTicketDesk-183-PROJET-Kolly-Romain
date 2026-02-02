import session from 'express-session';

export const createSessionConfig = () => ({
  // Fallback de securite pour eviter un crash si la variable est absente
  secret: process.env.SESSION_SECRET || 'CHANGE_ME_SESSION_SECRET',
  resave: false,
  saveUninitialized: false, // ne cree pas de cookie tant qu'on n'a rien ecrit
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60, // 1h
  },
});

export const sessionMiddleware = () => session(createSessionConfig());
