const path = require('path');

const root = __dirname;

module.exports = {
  server: {
    baseDir: root,
    index: 'index.html',
  },
  startPath: '/',
  open: true,
  notify: false,
  ui: false,
  ghostMode: false,
  reloadDebounce: 100,
  files: [
    path.join(root, 'index.html'),
    path.join(root, 'assets/**/*.css'),
    path.join(root, 'fixtures/**/*.html'),
  ],
  watchOptions: {
    ignoreInitial: true,
  },
  logPrefix: 'DTB Email Preview',
};
