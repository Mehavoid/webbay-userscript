'use strict';

const DOMAIN = ['krakenfiles', 'webshare'];

const request = (url, body) =>
  fetch(url, { method: 'POST', body }).then((res) => {
    const { status } = res;
    if (status === 200) return res.json();
    throw new Error('HTTP status code: ' + status);
  });

const api = (data) => {
  const form = new FormData();
  for (const [k, v] of Object.entries(data)) form.set(k, v);
  return request(API_URL, form);
};

const redirect = (url) => {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.dispatchEvent(new MouseEvent('click'));
};

const setPrivacy = (a) => a.setAttribute('rel', 'noopener noreferrer');

const match = ({ host }) => {
  const chunks = host.split('.');
  while (chunks.length > 0) {
    const chunk = chunks.pop();
    if (DOMAIN.includes(chunk)) return true;
  }
  return false;
};

const ok = ({ success, data }) => {
  if (success) redirect(data);
  return { success, text: data };
};

const fail = (e) => ({ success: false, text: e.message });

const warn =
  (target) =>
  ({ success, text }) => {
    const span = document.createElement('span');
    span.classList.add('wb', `wb-${success}`);
    span.setAttribute('title', text);
    target.appendChild(span);
    if (success) {
      target.setAttribute('tabindex', '-1');
      target.classList.add('wb-noclick');
    }
  };

const tags = {
  A: match,
};

const eventHandler = (event) => {
  const { target } = event;
  const fn = tags[target.tagName];
  if (!(fn && fn(target))) return false;
  setPrivacy(target);
  event.preventDefault();
  return api({ link: target.href }).then(ok, fail).then(warn(target));
};

document.addEventListener('click', eventHandler, false);
