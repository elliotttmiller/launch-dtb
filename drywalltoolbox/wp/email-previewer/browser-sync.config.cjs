const path = require('path');

const previewRoot = __dirname;
const wpRoot = path.resolve(previewRoot, '..');
const repositoryRoot = path.resolve(wpRoot, '..', '..');
const proxy = process.env.DTB_EMAIL_PREVIEW_ORIGIN || 'http://localhost';
const previewPath = process.env.DTB_EMAIL_PREVIEW_PATH || '/wp/email-previewer/';
const orderId = process.env.DTB_EMAIL_PREVIEW_ORDER || '';
const emailId = process.env.DTB_EMAIL_PREVIEW_EMAIL || 'customer_processing_order';
const separator = previewPath.includes('?') ? '&' : '?';

module.exports = {
  proxy,
  startPath: `${previewPath}${separator}email=${encodeURIComponent(emailId)}&order=${encodeURIComponent(orderId)}&device=desktop`,
  open: true,
  notify: false,
  ui: false,
  ghostMode: false,
  reloadDebounce: 150,
  files: [
    path.join(wpRoot, 'wp-content/mu-plugins/dtb-commerce/Email/**/*.php'),
    path.join(wpRoot, 'wp-content/mu-plugins/dtb-platform/Support/Email.php'),
    path.join(previewRoot, '**/*.php'),
    path.join(previewRoot, 'assets/**/*.css'),
  ],
  watchOptions: {
    ignoreInitial: true,
  },
  serveStatic: [],
  logPrefix: 'DTB Email Preview',
  callbacks: {
    ready(error, browserSync) {
      if (error) {
        return;
      }

      const urls = browserSync.options.get('urls').toJS();
      console.log(`\nDTB Email Previewer: ${urls.local}`);
      console.log(`Proxying WordPress: ${proxy}`);
      console.log(`Preview path: ${previewPath}`);
      console.log(`Watching repository: ${repositoryRoot}\n`);
    },
  },
};
