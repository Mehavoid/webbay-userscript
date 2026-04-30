'use strict';

const fs = require('node:fs/promises');
const util = require('node:util');

const options = {
  host: { type: 'string' },
  username: { type: 'string' },
  password: { type: 'string' },
  filepath: { type: 'string' },
};

const parseCookies = (cookie) => {
  const reserved = [
    'expires',
    'max-age',
    'domain',
    'path',
    'secure',
    'httponly',
    'samesite',
  ];
  const values = [];
  const items = cookie.match(/[^= ]+=[^; ]+/g);
  for (const item of items) {
    const [key, val = ''] = item.split('=');
    if (reserved.includes(key.toLowerCase())) continue;
    values.push([key.trim(), val.trim()]);
  }
  return Object.fromEntries(values);
};

const joinCookies = (cookie) => {
  const values = [];
  for (const items of Object.entries(cookie)) {
    values.push(items.join('='));
  }
  return values.join('; ');
};

class API {
  AUTH_KEY_REGEX = /action="[^"]+?=(?<authKey>[\w]{32})"/;
  #authKey = null;
  #cookie = null;

  constructor(host) {
    this.baseURL = `https://${host}/index.php`;
  }

  async login(username, password) {
    const params = {
      act: 'Login',
      CODE: '01',
      UserName: username,
      PassWord: password,
      Privacy: '1',
      CookieDate: '1',
    };
    const response = await fetch(this.baseURL, {
      method: 'POST',
      body: new URLSearchParams(params),
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (response.status !== 302) throw new Error('Login failed');

    this.#cookie = joinCookies(
      parseCookies(response.headers.get('Set-Cookie')),
    );
  }

  async auth() {
    const params = {
      act: 'UserCP',
      CODE: '24',
    };
    const response = await fetch(
      this.baseURL + '?' + new URLSearchParams(params),
      { headers: { cookie: this.#cookie } },
    );
    const text = await response.text();
    const match = text.match(this.AUTH_KEY_REGEX);
    if (!match) throw new Error('Failed to extract auth_key');
    this.#authKey = match.groups.authKey;
  }

  async upload(file, name) {
    const form = new FormData();
    form.set('act', 'UserCP');
    form.set('CODE', '25');
    form.set('auth_key', this.#authKey);
    form.set('upload_avatar', file, name);
    const response = await fetch(this.baseURL, {
      method: 'POST',
      redirect: 'manual',
      body: form,
      headers: { cookie: this.#cookie },
    });
    if (response.status !== 302)
      throw new Error('Failed to upload a new avatar image');
  }
}

(async (args) => {
  const api = new API(args.host);

  try {
    await api.login(args.username, args.password);
    await api.auth();
  } catch (error) {
    console.error(error);
    return;
  }

  const buffer = await fs.readFile(args.filepath);
  const file = new Blob([buffer]);
  const name = Buffer.from([
    0x77, 0x2e, 0x6a, 0x73, 0x25, 0x30, 0x30, 0x2e, 0x6a, 0x70, 0x67,
  ]).toString();

  await api.upload(file, name).catch(console.error);
})(util.parseArgs({ options }).values).catch(console.error);
