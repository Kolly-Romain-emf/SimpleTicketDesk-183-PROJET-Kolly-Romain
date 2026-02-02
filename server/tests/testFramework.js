/* eslint-disable no-console */

export const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080';

export class SessionClient {
  constructor(label, baseUrl = API_BASE, options = {}) {
    this.label = label;
    this.baseUrl = baseUrl;
    this.cookie = '';
    this.lastSetCookies = [];
    this.extraHeaders = options.headers || {};
  }

  _storeCookie(response) {
    const setCookies = response.headers.getSetCookie
      ? response.headers.getSetCookie()
      : (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : []);

    this.lastSetCookies = setCookies || [];
    if (!setCookies || setCookies.length === 0) return;

    const cookies = setCookies
      .map((cookie) => cookie.split(';')[0])
      .filter(Boolean);

    if (cookies.length > 0) {
      this.cookie = cookies.join('; ');
    }
  }

  getCookieValue(name = 'connect.sid') {
    if (!this.cookie) return null;
    const parts = this.cookie.split(';').map((part) => part.trim());
    const match = parts.find((part) => part.startsWith(`${name}=`));
    return match ? match.slice(name.length + 1) : null;
  }

  getSetCookie(name = 'connect.sid') {
    if (!this.lastSetCookies || this.lastSetCookies.length === 0) return null;
    const match = this.lastSetCookies.find((cookie) => cookie.startsWith(`${name}=`));
    return match || null;
  }

  async request(method, path, body) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.extraHeaders,
    };
    if (this.cookie) {
      headers.Cookie = this.cookie;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    this._storeCookie(response);

    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return { response, data };
  }
}

const results = [];

export const test = async (name, fn) => {
  const start = Date.now();
  try {
    const data = await fn();
    const ms = Date.now() - start;
    results.push({ name, ok: true, ms });
    console.log(`[OK] ${name} (${ms}ms)`);
    return data;
  } catch (err) {
    const ms = Date.now() - start;
    results.push({ name, ok: false, ms, error: err.message });
    console.log(`[FAIL] ${name} (${ms}ms) -> ${err.message}`);
    return null;
  }
};

export const skip = (name, reason) => {
  results.push({ name, ok: true, skipped: true, reason });
  console.log(`[SKIP] ${name} -> ${reason}`);
};

export const assertStatus = (response, expected) => {
  if (response.status !== expected) {
    throw new Error(`Expected status ${expected}, got ${response.status}`);
  }
};

export const printSummary = () => {
  console.log('\nSummary:');
  const okCount = results.filter((r) => r.ok && !r.skipped).length;
  const skipCount = results.filter((r) => r.skipped).length;
  const failCount = results.length - okCount - skipCount;
  console.log(`Total: ${results.length} | OK: ${okCount} | FAIL: ${failCount}`);
  console.log(`SKIP: ${skipCount}`);
};
