import handler from './src/index.js';

const PORT = 8787;
const host = 'localhost';

// Mock Cloudflare env
const env = {
  KVDB: {
    store: new Map(),
    async get(key) {
      return this.store.get(key) || null;
    },
    async put(key, value, options = {}) {
      this.store.set(key, value);
      if (options.expirationTtl) {
        setTimeout(() => this.store.delete(key), options.expirationTtl * 1000);
      }
    }
  }
};

// Create HTTP server
const server = async (req, res) => {
  try {
    const ctx = { waitUntil: () => {} };
    const response = await handler.fetch(req, env, ctx);
    
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(await response.text());
  } catch (err) {
    console.error('Error:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
};

// Start server
import http from 'http';
const httpServer = http.createServer(server);
httpServer.listen(PORT, host, () => {
  console.log(`✅ Server running at http://${host}:${PORT}`);
  console.log(`📍 Endpoints:`);
  console.log(`   GET http://${host}:${PORT}/ - Demo page`);
  console.log(`   GET http://${host}:${PORT}/health - Health check`);
  console.log(`   GET http://${host}:${PORT}/v1/meta/top - Top decks`);
  console.log(`   GET http://${host}:${PORT}/v1/tournaments/recent - Tournaments`);
});
