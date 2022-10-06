'use strict';

const { Object, fetch, FormData, MouseEvent } = W;

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
  return request(U, form);
};

const setPrivacy = (a) => a.setAttribute('rel', 'noopener noreferrer');

const redirect = (url) => {
  const a = D.createElement('a');
  a.href = url;
  a.target = '_blank';
  setPrivacy(a);
  a.dispatchEvent(new MouseEvent('click'));
};

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
    const span = D.createElement('span');
    span.classList.add('wb', 'wb-' + success.toString());
    span.setAttribute('data-wb-tooltip', text);
    target.appendChild(span);
    if (success) {
      target.setAttribute('tabindex', '-1');
      target.classList.add('wb-noclick');
    }
  };

const bindEvent = (element, type, listener, capture) => {
  const handler = (event) => {
    element.removeEventListener(type, handler, capture);
    listener.call(this, event);
  };
  element.addEventListener(type, handler, capture);
};

const eventHandler = (event) => {
  const { target } = event;
  const m = match(target);
  setPrivacy(target);
  if (!m) return false;
  api({ link: target.href }).then(ok, fail).then(warn(target));
  event.preventDefault();
};

for (const link of D.links) {
  if (link.host === D.domain) continue;
  if (link.target !== '_blank') continue;
  bindEvent(link, 'click', eventHandler, false);
}
