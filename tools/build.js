'use strict';

const fs = require('fs').promises;
const path = require('path');
const tickplate = require('tickplate');

const projectPackage = require('../package.json');

const toUpperCamel = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const TEMPLATE = `
// ==UserScript==
// @name         ${'name'}
// @namespace    ${'namespace'}
// @license      ${'license'}
// @author       ${'author'}
// @match        ${'url'}
// @grant        ${'grant'}
// @version      ${'version'}
// @compatible   ${'browser'}    ${'usm'}
// @run-at       ${'run'}
// @noframes
// ==/UserScript==`;

const CWD = process.cwd();
const SCRIPT = path.join(CWD, 'src', 'index.js');
const DIST = path.join(CWD, 'dist');

(async () => {
  const { version, license, author } = projectPackage;
  const [name] = projectPackage.name.split('-');
  const user = name + '.user.js';
  const meta = name + '.meta.js';
  const data = {
    name: toUpperCamel(name),
    namespace: user,
    version,
    license,
    author,
    url: '*://*.com',
    grant: 'none',
    browser: 'chrome',
    usm: 'Violentmonkey v2.13.0',
    run: 'document-end',
  };

  const metadata = tickplate`${TEMPLATE}`(data).trim();
  const source = await fs.readFile(SCRIPT, 'utf-8');
  const userscript = [metadata, source].join('\n\n');

  await fs.writeFile(path.join(DIST, user), userscript);
  await fs.writeFile(path.join(DIST, meta), metadata);
})();
