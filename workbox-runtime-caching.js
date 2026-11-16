module.exports = [
  // 1) Next.js static assets (JS/CSS/fonts) - Critical for offline functionality
  // A RegExp route is tested against the full URL, so a path prefix needs a function matcher.
  {
    urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/_next/static/'),
    handler: 'CacheFirst',
    options: {
      cacheName: 'next-static-assets',
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },

  // 2) Navigation requests (page loads) - NetworkFirst with offline fallback
  {
    urlPattern: ({ request }) => request.mode === 'navigate',
    handler: 'NetworkFirst',
    options: {
      cacheName: 'pages-cache',
      networkTimeoutSeconds: 3,
      expiration: {
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },

  // 3) Public assets (images, icons, etc.)
  {
    urlPattern: ({ url }) => 
      url.pathname.startsWith('/images/') || 
      url.pathname.startsWith('/icons/') ||
      url.pathname.startsWith('/icon-') ||
      url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/i),
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'public-assets',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },

  // 4) WASM files for PDF processing
  {
    urlPattern: /\.(?:wasm)$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'wasm-cache',
      expiration: {
        maxEntries: 10,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },

  // 5) PDF worker files
  {
    urlPattern: /pdf\.worker\.min\.js$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'pdf-worker',
      expiration: {
        maxEntries: 5,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },

  // 6) Google Fonts
  {
    urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts',
      expiration: {
        maxEntries: 10,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },

  // 7) CSS files
  {
    urlPattern: /\.(?:css)$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'css-cache',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },

  // 8) JavaScript files (catch-all for any missed JS)
  {
    urlPattern: /\.(?:js)$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'js-cache',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },

  // 9) Manifest and other JSON files
  {
    urlPattern: /\.(?:json|xml)$/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'json-cache',
      networkTimeoutSeconds: 3,
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
];
