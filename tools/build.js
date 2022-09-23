'use strict';

const fs = require('fs').promises;
const path = require('path');

const projectPackage = require('../package.json');

const CWD = process.cwd();
const SRC = path.join(CWD, 'src');
const DIST = path.join(CWD, 'dist');

const ARGS_TYPE = {
  url: 'string',
  match: 'array',
  update: 'string',
};

const DASH = 2;
const META_PRE = 18;
const NODE_COMMAND = 2;

const HEAD = '// ==UserScript==';
const TAIL = '// ==/UserScript==';

const toUpperCamel = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const trim = (s) => s.replaceAll('\n', '').replaceAll(' ', '');

const wrapIIFE = (src, url) => `((API_URL) => {\n${src}\n})('${url}');`;

const wrapStyles = (styles) => `!function(a, b, c, d, e) {
  d = document;
  e = d.createElement(b);
  e.textContent = a;
  d.getElementsByTagName(c)[0].appendChild(e);
}('${styles}', 'style', 'head');`;

const buildMetaLine = (value, meta) => {
  const pre = `// @${meta}`;
  if (!value) return pre;
  const len = META_PRE - pre.length;
  const ident = len > 0 ? ' '.repeat(len) : ' ';
  return pre + ident + value;
};

const buildMeta = (data) => {
  const lines = [];
  for (const [k, v] of Object.entries(data)) {
    const values = Array.isArray(v) ? v : [v];
    for (const val of values) lines.push(buildMetaLine(val, k));
  }
  return lines.join('\n');
};

const handleArgs = (argv) => {
  const args = new Map();
  for (const arg of argv.slice(NODE_COMMAND)) {
    const length = arg.indexOf('=');
    const name = arg.substring(DASH, length);
    const value = arg.substring(length + 1, arg.length);
    const kind = ARGS_TYPE[name];
    if (kind === 'array') {
      const set = args.get(name);
      const values = set ? set.add(value) : new Set([value]);
      args.set(name, values);
    } else if (kind === 'string') {
      args.set(name, value);
    }
  }
  return args;
};

(async (args) => {
  const [name] = projectPackage.name.split('-');
  const user = name + '.user.js';
  const meta = name + '.meta.js';

  const data = {
    name: toUpperCamel(name),
    namespace: user,
    license: projectPackage.license,
    match: [...args.get('match')],
    grant: 'none',
    version: projectPackage.version,
    updateURL: args.get('update'),
    downloadURL: args.get('update'),
    'run-at': 'document-end',
    noframes: '',
  };

  const lines = buildMeta(data);
  const metadata = [HEAD, lines, TAIL].join('\n');
  const js = await fs.readFile(path.join(SRC, 'index.js'), 'utf-8');
  const script = wrapIIFE(js, args.get('url'));
  const styles = await fs.readFile(path.join(SRC, 'style.css'), 'utf-8');
  const css = wrapStyles(trim(styles));
  const userscript = [metadata, css, script].join('\n\n');

  await fs.writeFile(path.join(DIST, user), userscript);
  await fs.writeFile(path.join(DIST, meta), metadata);
})(handleArgs(process.argv));
