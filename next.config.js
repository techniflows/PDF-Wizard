/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: false,
  dynamicStartUrlRedirect: '/ko',
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  reloadOnOnline: false,
  fallbacks: {
    document: '/offline.html',
    image: '/file.svg',
  },
  // Share images are fetched by crawlers only, so installs should not download them.
  publicExcludes: ['!noprecache/**/*', '!og-*.png'],
  buildExcludes: [
    /app-build-manifest\.json$/,
    /build-manifest\.json$/,
    /prerender-manifest\.json$/,
    /react-loadable-manifest\.json$/,
    /middleware-manifest\.json$/,
  ],
  runtimeCaching: require('./workbox-runtime-caching'),
});

const nextConfig = {
  webpack: (config, { dev }) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    // pdf.mjs declares a top-level `var __webpack_exports__`. The dev devtool
    // runs each module in a strict eval, where that var shadows webpack's own
    // exports argument and the import throws. The minified build has no such name.
    if (dev) {
      config.resolve.alias['pdfjs-dist$'] = 'pdfjs-dist/build/pdf.min.mjs';
    }
    return config;
  },
};

module.exports = withPWA(nextConfig);