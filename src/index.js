'use strict';

const DOMAIN = ['krakenfiles', 'webshare'];

const request = (url, body) =>
  fetch(url, {
    method: 'POST',
    body,
  }).then((res) => res.json());

const api = (data) => {
  const url = 'http://127.0.0.1:8787/api/link';
  const form = new FormData();
  for (const [k, v] of Object.entries(data)) form.set(k, v);
  return request(url, form);
};

const redirect = (url) => {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.dispatchEvent(new MouseEvent('click'));
};

const setPrivacy = (a) => a.setAttribute('rel', 'noopener noreferrer');

const match = (url, whitelist) => {
  const chunks = url.split('.');
  while (chunks.length > 0) {
    const chunk = chunks.pop();
    if (whitelist.includes(chunk)) return true;
  }
  return false;
};

const eventHandler = (event) => {
  const { target } = event;
  if (target.tagName !== 'A') return true;
  const { href } = target;
  const matched = match(href, DOMAIN);
  if (!matched) return true;
  console.info({ event });
  return api({ link: href }).then(({ success, data }) => {
    if (success) {
      event.preventDefault();
      redirect(data);
    } else {
      setPrivacy(target);
    }
    return false;
  });
};

document.addEventListener('click', eventHandler, false);
