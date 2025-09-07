/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  reloadOnOnline: false,
  fallbacks: {
    document: '/offline.html',
    image: '/file.svg',
    audio: '/offline.html',
    video: '/offline.html',
    font: '/offline.html'
  },
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
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

module.exports = withPWA(nextConfig);