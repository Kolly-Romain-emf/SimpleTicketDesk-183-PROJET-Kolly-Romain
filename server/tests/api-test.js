import speakeasy from 'speakeasy';
import BaseView from '../../client/js/views/baseView.js';
import {
  API_BASE,
  SessionClient,
  test,
  skip,
  assertStatus,
  printSummary,
} from './testFramework.js';

// Run: node server/tests/api-test.js
// Optional env: API_BASE_URL=http://localhost:8080

const main = async () => {
  console.log(`API base: ${API_BASE}`);
  console.log('Running API tests...\n');

  const admin = new SessionClient('admin');
  const client = new SessionClient('client');
  const clientB = new SessionClient('clientB');
  const guest = new SessionClient('guest');
  const roleTester = new SessionClient('roleTester');

  const unique = Date.now();
  const strongPassword = 'Pa$$w0rd123!';
  const clientEmail = `client${unique}@example.com`;
  const clientPassword = strongPassword;
  const clientBEmail = `clientb${unique}@example.com`;
  const clientBPassword = strongPassword;
  const roleInjectionEmail = `role${unique}@example.com`;
  const roleInjectionPassword = strongPassword;

  let statusId;
  let ticketId;
  let privateTicketId;
  let privateTicketIdB;
  let userId;
  let statusCreatedId;
  let adminId;
  let mfaSecret;

  await test('Guest cannot list users (should be 401)', async () => {
    const { response } = await guest.request('GET', '/api/users');
    assertStatus(response, 401);
  });

  await test('Guest cannot list my tickets (should be 401)', async () => {
    const { response } = await guest.request('GET', '/api/tickets/mine');
    assertStatus(response, 401);
  });

  await test('Guest cannot access /api/users/me (should be 401)', async () => {
    const { response } = await guest.request('GET', '/api/users/me');
    assertStatus(response, 401);
  });

  await test('Guest cannot list all tickets (should be 401)', async () => {
    const { response } = await guest.request('GET', '/api/tickets');
    assertStatus(response, 401);
  });

  await test('Register client invalid email (should be 400)', async () => {
    const { response } = await guest.request('POST', '/api/auth/register', {
      lastname: 'Bad',
      firstname: 'Email',
      email: 'invalid',
      password: strongPassword,
    });
    assertStatus(response, 400);
  });

  await test('Register client ignores role injection (should be USER)', async () => {
    const { response, data } = await roleTester.request('POST', '/api/auth/register', {
      lastname: 'Role',
      firstname: 'Inject',
      email: roleInjectionEmail,
      password: roleInjectionPassword,
      role: 'ADMIN',
    });
    assertStatus(response, 201);
    if ((data?.user?.role || '').toUpperCase() !== 'USER') {
      throw new Error('Role injection allowed');
    }
  });

  await test('Register client', async () => {
    const { response, data } = await client.request('POST', '/api/auth/register', {
      lastname: 'Client',
      firstname: 'Test',
      email: clientEmail,
      password: clientPassword,
    });
    assertStatus(response, 201);
    if (!data?.user?.pk_user) {
      throw new Error('Missing user in response');
    }
    userId = data.user.pk_user;
  });

  await test('Register clientB', async () => {
    const { response, data } = await clientB.request('POST', '/api/auth/register', {
      lastname: 'Client',
      firstname: 'Other',
      email: clientBEmail,
      password: clientBPassword,
    });
    assertStatus(response, 201);
    if (!data?.user?.pk_user) {
      throw new Error('Missing user in response');
    }
  });

  await test('Login invalid password (should be 401)', async () => {
    const { response } = await guest.request('POST', '/api/auth/login', {
      email: clientEmail,
      password: 'WrongPass123!',
    });
    assertStatus(response, 401);
  });

  await test('Login client', async () => {
    const { response } = await client.request('POST', '/api/auth/login', {
      email: clientEmail,
      password: clientPassword,
    });
    assertStatus(response, 200);
    const setCookie = client.getSetCookie();
    if (!setCookie) {
      throw new Error('Missing session cookie');
    }
    if (!setCookie.includes('HttpOnly')) {
      throw new Error('Missing HttpOnly flag on session cookie');
    }
    if (!setCookie.toLowerCase().includes('samesite=lax')) {
      throw new Error('Missing SameSite=Lax on session cookie');
    }
  });

  await test('Session id regenerates on login', async () => {
    const regenClient = new SessionClient('regen');
    const { response: firstLogin } = await regenClient.request('POST', '/api/auth/login', {
      email: clientEmail,
      password: clientPassword,
    });
    assertStatus(firstLogin, 200);
    const firstSession = regenClient.getCookieValue();
    if (!firstSession) {
      throw new Error('Missing session after first login');
    }
    const { response: secondLogin } = await regenClient.request('POST', '/api/auth/login', {
      email: clientEmail,
      password: clientPassword,
    });
    assertStatus(secondLogin, 200);
    const secondSession = regenClient.getCookieValue();
    if (!secondSession) {
      throw new Error('Missing session after second login');
    }
    if (firstSession === secondSession) {
      throw new Error('Session id did not regenerate');
    }
  });

  await test('Rate-limit login (should be 429)', async () => {
    const rlClient = new SessionClient('rl-login', API_BASE, {
      headers: { 'X-Forwarded-For': '198.51.100.10' },
    });
    let lastStatus = 200;
    for (let i = 0; i < 11; i += 1) {
      const { response } = await rlClient.request('POST', '/api/auth/login', {
        email: clientEmail,
        password: 'WrongPass123!',
      });
      lastStatus = response.status;
      if (lastStatus === 429) {
        return;
      }
    }
    throw new Error(`Expected status 429, got ${lastStatus}`);
  });

  await test('Enable MFA for client', async () => {
    const { response, data } = await client.request('POST', '/api/auth/enable-mfa');
    assertStatus(response, 200);
    if (!data?.secretBase32 || !data?.qrCodeBase64) {
      throw new Error('Missing MFA setup data');
    }
    mfaSecret = data.secretBase32;
  });

  await test('Logout client (after MFA enable)', async () => {
    const { response } = await client.request('POST', '/api/auth/logout');
    assertStatus(response, 200);
  });

  await test('Login client requires MFA (mfaRequired)', async () => {
    const { response, data } = await client.request('POST', '/api/auth/login', {
      email: clientEmail,
      password: clientPassword,
    });
    assertStatus(response, 200);
    if (!data?.mfaRequired) {
      throw new Error('Expected mfaRequired true');
    }
  });

  await test('Login client with invalid MFA token (should be 401)', async () => {
    const { response } = await client.request('POST', '/api/auth/login-mfa', {
      email: clientEmail,
      password: clientPassword,
      token: '000000',
    });
    assertStatus(response, 401);
  });

  await test('Rate-limit login-mfa (should be 429)', async () => {
    const rlClient = new SessionClient('rl-mfa', API_BASE, {
      headers: { 'X-Forwarded-For': '198.51.100.11' },
    });
    let lastStatus = 200;
    for (let i = 0; i < 6; i += 1) {
      const { response } = await rlClient.request('POST', '/api/auth/login-mfa', {
        email: clientEmail,
        password: clientPassword,
        token: '000000',
      });
      lastStatus = response.status;
      if (lastStatus === 429) {
        return;
      }
    }
    throw new Error(`Expected status 429, got ${lastStatus}`);
  });

  await test('Login client with MFA token', async () => {
    if (!mfaSecret) {
      throw new Error('Missing MFA secret');
    }
    const token = speakeasy.totp({
      secret: mfaSecret,
      encoding: 'base32',
    });
    const { response } = await client.request('POST', '/api/auth/login-mfa', {
      email: clientEmail,
      password: clientPassword,
      token,
    });
    assertStatus(response, 200);
  });

  await test('Login clientB', async () => {
    const { response } = await clientB.request('POST', '/api/auth/login', {
      email: clientBEmail,
      password: clientBPassword,
    });
    assertStatus(response, 200);
  });

  await test('Rate-limit enable-mfa (should be 429)', async () => {
    const rlClient = new SessionClient('rl-enable', API_BASE, {
      headers: { 'X-Forwarded-For': '198.51.100.12' },
    });
    const { response: loginResp } = await rlClient.request('POST', '/api/auth/login', {
      email: clientBEmail,
      password: clientBPassword,
    });
    assertStatus(loginResp, 200);

    let lastStatus = 200;
    for (let i = 0; i < 4; i += 1) {
      const { response } = await rlClient.request('POST', '/api/auth/enable-mfa');
      lastStatus = response.status;
      if (lastStatus === 429) {
        return;
      }
    }
    throw new Error(`Expected status 429, got ${lastStatus}`);
  });

  await test('Get auth me (client)', async () => {
    const { response, data } = await client.request('GET', '/api/auth/me');
    assertStatus(response, 200);
    if (!data?.user?.email) {
      throw new Error('Missing user data');
    }
  });

  await test('Guest can list public statuses', async () => {
    const { response, data } = await guest.request('GET', '/api/statuses');
    assertStatus(response, 200);
    if (!Array.isArray(data?.statuses) || data.statuses.length === 0) {
      throw new Error('No statuses returned');
    }
    statusId = data.statuses[0].pk_status;
  });

  await test('Client cannot create status (should be 403)', async () => {
    const { response } = await client.request('POST', '/api/statuses', {
      label: `USER_STATUS_${unique}`,
    });
    assertStatus(response, 403);
  });

  await test('Create ticket (client)', async () => {
    const { response, data } = await client.request('POST', '/api/tickets', {
      title: 'Test ticket',
      description: 'Test description',
      fk_status: statusId,
      is_public: true,
    });
    assertStatus(response, 201);
    ticketId = data?.ticket?.pk_ticket;
    if (!ticketId) {
      throw new Error('Missing ticket id');
    }
  });

  await test('Guest can view public ticket detail', async () => {
    const { response } = await guest.request('GET', `/api/tickets/${ticketId}`);
    assertStatus(response, 200);
  });

  await test('Create private ticket (clientB)', async () => {
    const { response, data } = await clientB.request('POST', '/api/tickets', {
      title: 'Private ticket',
      description: 'Private description',
      fk_status: statusId,
      is_public: false,
    });
    assertStatus(response, 201);
    privateTicketId = data?.ticket?.pk_ticket;
    if (!privateTicketId) {
      throw new Error('Missing private ticket id');
    }
  });

  await test('Client cannot view private ticket of other user (should be 403)', async () => {
    const { response } = await client.request('GET', `/api/tickets/${privateTicketId}`);
    assertStatus(response, 403);
  });

  await test('Guest cannot view private ticket (should be 403)', async () => {
    const { response } = await guest.request('GET', `/api/tickets/${privateTicketId}`);
    assertStatus(response, 403);
  });

  await test('ClientB delete private ticket', async () => {
    const { response } = await clientB.request('DELETE', `/api/tickets/${privateTicketId}`);
    assertStatus(response, 204);
  });

  await test('Create private ticket for ownership check (client)', async () => {
    const { response, data } = await client.request('POST', '/api/tickets', {
      title: 'Private ticket A',
      description: 'Private A',
      fk_status: statusId,
      is_public: false,
    });
    assertStatus(response, 201);
    privateTicketIdB = data?.ticket?.pk_ticket;
    if (!privateTicketIdB) {
      throw new Error('Missing private ticket id');
    }
  });

  await test('ClientB cannot delete client ticket (should be 403)', async () => {
    const { response } = await clientB.request('DELETE', `/api/tickets/${privateTicketIdB}`);
    assertStatus(response, 403);
  });

  await test('Client delete own private ticket', async () => {
    const { response } = await client.request('DELETE', `/api/tickets/${privateTicketIdB}`);
    assertStatus(response, 204);
  });

  await test('List my tickets (client)', async () => {
    const { response } = await client.request('GET', '/api/tickets/mine');
    assertStatus(response, 200);
  });

  await test('Update ticket (client)', async () => {
    const { response } = await client.request('PUT', `/api/tickets/${ticketId}`, {
      title: 'Updated ticket',
      description: 'Updated description',
      fk_status: statusId,
      is_public: false,
    });
    assertStatus(response, 200);
  });

  await test('Delete ticket (client)', async () => {
    const { response } = await client.request('DELETE', `/api/tickets/${ticketId}`);
    assertStatus(response, 204);
  });

  await test('List public tickets', async () => {
    const { response } = await guest.request('GET', '/api/tickets/public');
    assertStatus(response, 200);
  });

  await test('Client cannot list users (should be 403)', async () => {
    const { response } = await client.request('GET', '/api/users');
    assertStatus(response, 403);
  });

  await test('Login admin', async () => {
    const { response } = await admin.request('POST', '/api/auth/login', {
      email: 'admin@example.com',
      password: strongPassword,
    });
    assertStatus(response, 200);
  });

  await test('Guest cannot access audit logs (should be 401)', async () => {
    const { response } = await guest.request('GET', '/admin/audit');
    assertStatus(response, 401);
  });

  await test('Client cannot access audit logs (should be 403)', async () => {
    const { response } = await client.request('GET', '/admin/audit');
    assertStatus(response, 403);
  });

  await test('Admin can access audit logs', async () => {
    const { response, data } = await admin.request('GET', '/admin/audit');
    assertStatus(response, 200);
    if (!Array.isArray(data?.logs)) {
      throw new Error('Missing audit logs array');
    }
    if (!data.logs.some((entry) => entry.action === `TICKET_CREATE pk_ticket=${ticketId}`)) {
      throw new Error('Missing audit entry for ticket creation');
    }
  });

  await test('Admin list users', async () => {
    const { response, data } = await admin.request('GET', '/api/users');
    assertStatus(response, 200);
    const match = data?.users?.find((u) => u.pk_user === userId);
    if (!match) {
      throw new Error('Created user not found in list');
    }
    const adminUser = data?.users?.find((u) => u.email === 'admin@example.com');
    if (adminUser) {
      adminId = adminUser.pk_user;
    }
  });

  await test('Client cannot delete admin (should be 403)', async () => {
    if (!adminId) {
      throw new Error('Missing admin id');
    }
    const { response } = await client.request('DELETE', `/api/users/${adminId}`);
    assertStatus(response, 403);
  });

  await test('Client cannot view other user profile (should be 403)', async () => {
    if (!adminId) {
      throw new Error('Missing admin id');
    }
    const { response } = await client.request('GET', `/api/users/${adminId}`);
    assertStatus(response, 403);
  });

  await test('Admin get user by id', async () => {
    const { response } = await admin.request('GET', `/api/users/${userId}`);
    assertStatus(response, 200);
  });

  await test('Admin update user', async () => {
    const { response } = await admin.request('PUT', `/api/users/${userId}`, {
      firstname: 'Updated',
    });
    assertStatus(response, 200);
  });

  await test('Admin cannot delete self (should be 400)', async () => {
    if (!adminId) {
      throw new Error('Missing admin id');
    }
    const { response } = await admin.request('DELETE', `/api/users/${adminId}`);
    assertStatus(response, 400);
  });

  await test('Admin create status', async () => {
    const { response, data } = await admin.request('POST', '/api/statuses', {
      label: `TEST_STATUS_${unique}`,
    });
    assertStatus(response, 201);
    statusCreatedId = data?.status?.pk_status;
    if (!statusCreatedId) {
      throw new Error('Missing status id');
    }
  });

  await test('Admin update status', async () => {
    const { response } = await admin.request('PUT', `/api/statuses/${statusCreatedId}`, {
      label: `TEST_STATUS_UPDATED_${unique}`,
    });
    assertStatus(response, 200);
  });

  await test('Admin delete status', async () => {
    const { response } = await admin.request('DELETE', `/api/statuses/${statusCreatedId}`);
    assertStatus(response, 204);
  });

  await test('Admin delete user', async () => {
    const { response } = await admin.request('DELETE', `/api/users/${userId}`);
    assertStatus(response, 204);
  });

  await test('Client escapeHtml sanitizes HTML', async () => {
    const view = new BaseView({});
    const input = '<img src=x onerror=alert(1)>';
    const output = view.escapeHtml(input);
    if (output.includes('<') || output.includes('>')) {
      throw new Error('escapeHtml did not escape HTML');
    }
  });

  // Expected requirements not yet implemented (keep as skipped until built)
  skip('XSS escaping verification in client renders', 'Manual/Not implemented');
  skip('Session regenerate verification', 'Manual/Not implemented');

  printSummary();
};

main().catch((err) => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
