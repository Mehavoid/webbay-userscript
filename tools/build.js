'use strict';

const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const vm = require('vm');

const projectPackage = require('../package.json');

const CWD = process.cwd();
const SRC = path.join(CWD, 'src');
const DIST = path.join(CWD, 'dist');

const options = {
  url: {
    type: 'string',
  },
  match: {
    type: 'string',
    multiple: true,
  },
  update: {
    type: 'string',
  },
};

const META_PRE = 18;

const HEAD = '// ==UserScript==';
const TAIL = '// ==/UserScript==';

const IIFE_START = `!function(a, b, c, d, e) {
  d = document;
  e = d.createElement(b);
  e.textContent = a;
  d.getElementsByTagName(c)[0].appendChild(e);
}(`;

const IIFE_END = ');';

const toUpperCamel = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const backtick = (s) => '`' + s + '`';

const quote = (s) => '"' + s + '"';

const wrapCode = (source, context) => {
  const func = vm.compileFunction(source, Object.keys(context));
  const args = Object.values(context).map(quote);
  return '!' + func.toString() + '(' + args.join(',') + ');';
};

const wrapIIFE = (...args) =>
  IIFE_START + Object.values(args).map(backtick).join(',') + IIFE_END;

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
  const meta = lines.join('\n');
  return [HEAD, meta, TAIL].join('\n');
};

(async (args) => {
  const [name] = projectPackage.name.split('-');
  const scriptName = `${name}.user.js`;
  const scriptMetaName = `${name}.meta.js`;

  const data = {
    name: toUpperCamel(name),
    namespace: scriptName,
    license: projectPackage.license,
    match: args.match,
    grant: 'none',
    version: projectPackage.version,
    updateURL: args.update,
    downloadURL: args.update,
    'run-at': 'document-end',
    noframes: '',
  };

  const [js, css] = await Promise.all([
    fs.readFile(path.join(SRC, 'index.js'), 'utf-8'),
    fs.readFile(path.join(SRC, 'style.css'), 'utf-8'),
  ]);
  const meta = buildMeta(data);
  const code = wrapCode(js, { API_URL: args.url });
  const script = wrapIIFE(code, 'script', 'head');
  const style = wrapIIFE(css, 'style', 'head');
  const userscript = [meta, style, script].join('\n\n');

  await Promise.all([
    fs.writeFile(path.join(DIST, scriptName), userscript),
    fs.writeFile(path.join(DIST, scriptMetaName), meta),
  ]);
})(util.parseArgs({ options }).values);
