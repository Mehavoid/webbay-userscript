'use strict';

require('http')
  .createServer((req, res) =>
    require('fs').readFile(
      require('path').resolve(__dirname, '..') + req.url,
      (e, d) => {
        res.writeHead(e ? 404 : 200);
        res.end(e ? JSON.stringify(e) : d);
      },
    ),
  )
  .listen(3000, () => {
    console.info('http://127.0.0.1:3000/dist/webbay.user.js');
  });
