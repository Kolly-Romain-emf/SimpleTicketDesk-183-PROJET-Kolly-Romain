import bcrypt from 'bcrypt';
import { db } from '../app/config/db.js';

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

const DEMO_PASSWORD = 'Pa$$w0rd123!';

const demoUsers = [
  {
    firstname: 'Admin',
    lastname: 'Demo',
    email: 'admin@example.com',
    role: 'ADMIN',
    password: DEMO_PASSWORD,
  },
  {
    firstname: 'Alice',
    lastname: 'Martin',
    email: 'alice@example.com',
    role: 'USER',
    password: DEMO_PASSWORD,
  },
  {
    firstname: 'Bob',
    lastname: 'Durand',
    email: 'bob@example.com',
    role: 'USER',
    password: DEMO_PASSWORD,
  },
];

const demoTickets = [
  {
    title: 'DEMO: VPN access not working',
    description: 'Cannot connect to VPN since this morning.',
    status: 'OPEN',
    is_public: 1,
    userEmail: 'alice@example.com',
  },
  {
    title: 'DEMO: Printer out of ink',
    description: 'Office printer is out of ink again.',
    status: 'IN_PROGRESS',
    is_public: 0,
    userEmail: 'bob@example.com',
  },
  {
    title: 'DEMO: Email delivery delay',
    description: 'Emails arrive with a 10 minute delay.',
    status: 'CLOSED',
    is_public: 1,
    userEmail: 'alice@example.com',
  },
];

const defaultStatuses = ['OPEN', 'IN_PROGRESS', 'CLOSED'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForDb = async (attempts = 30, delayMs = 1000) => {
  for (let i = 0; i < attempts; i += 1) {
    try {
      await db.query('SELECT 1');
      return;
    } catch (err) {
      if (i === attempts - 1) {
        throw err;
      }
      await sleep(delayMs);
    }
  }
};

const ensureStatuses = async () => {
  const [rows] = await db.query('SELECT pk_status, label FROM t_status');
  if (rows.length === 0) {
    const values = defaultStatuses.map(() => '(?)').join(',');
    await db.query(`INSERT INTO t_status (label) VALUES ${values}`, defaultStatuses);
  }
};

const ensureAuditLogTable = async () => {
  await db.query(
    `CREATE TABLE IF NOT EXISTS audit_log (
      pk_audit_log INT AUTO_INCREMENT PRIMARY KEY,
      fk_user INT NULL,
      action VARCHAR(255) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_audit_user FOREIGN KEY (fk_user)
        REFERENCES t_user(pk_user) ON DELETE SET NULL
    )`
  );
};

const upsertUser = async (user) => {
  const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
  await db.query(
    `INSERT INTO t_user (lastname, firstname, email, password_hash, role)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       lastname = VALUES(lastname),
       firstname = VALUES(firstname),
       password_hash = VALUES(password_hash),
       role = VALUES(role)`,
    [user.lastname, user.firstname, user.email, passwordHash, user.role]
  );

  const [rows] = await db.query('SELECT pk_user FROM t_user WHERE email = ?', [user.email]);
  return rows[0]?.pk_user || null;
};

const getStatusMap = async () => {
  const [rows] = await db.query('SELECT pk_status, label FROM t_status');
  const map = {};
  rows.forEach((row) => {
    map[row.label] = row.pk_status;
  });
  return map;
};

const insertTicketIfMissing = async (ticket, userId, statusId) => {
  const [existing] = await db.query(
    'SELECT pk_ticket FROM t_ticket WHERE title = ? AND fk_user = ? LIMIT 1',
    [ticket.title, userId]
  );
  if (existing.length > 0) {
    return;
  }
  await db.query(
    `INSERT INTO t_ticket (title, description, fk_status, is_public, fk_user)
     VALUES (?, ?, ?, ?, ?)`,
    [ticket.title, ticket.description, statusId, ticket.is_public, userId]
  );
};

const main = async () => {
  try {
    console.log('Seeding demo data...');

    await waitForDb();
    await ensureStatuses();
    await ensureAuditLogTable();

    const userIds = {};
    for (const user of demoUsers) {
      const id = await upsertUser(user);
      userIds[user.email] = id;
    }

    const statusMap = await getStatusMap();

    for (const ticket of demoTickets) {
      const userId = userIds[ticket.userEmail];
      const statusId = statusMap[ticket.status];
      if (!userId || !statusId) {
        continue;
      }
      await insertTicketIfMissing(ticket, userId, statusId);
    }

    console.log('Done. Demo accounts:');
    demoUsers.forEach((u) => {
      console.log(`- ${u.email} / ${u.password} (${u.role})`);
    });
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
};

main();
