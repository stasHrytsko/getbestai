import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev-server plugin that replicates the /api/models Vercel function locally.
// In production (Vercel) this file is ignored; the real serverless handler in api/models.js is used.
const localApiPlugin = {
  name: 'local-api-models',
  configureServer(server) {
    server.middlewares.use('/api/models', async (req, res) => {
      if (req.method !== 'GET') {
        res.statusCode = 405;
        return res.end(JSON.stringify({ error: 'Method not allowed' }));
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const API_KEY =
        process.env.ARTIFICIAL_ANALYSIS_API_KEY ||
        process.env.VITE_AA_API_KEY;

      if (!API_KEY) {
        console.warn('[local-api] No API key found – returning 500 so the frontend falls back to mock data.');
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: 'API key not configured' }));
      }

      try {
        console.log('[local-api] Fetching Artificial Analysis models…');
        const upstream = await fetch(
          'https://artificialanalysis.ai/api/v2/data/llms/models',
          {
            headers: {
              'x-api-key': API_KEY,
              'Content-Type': 'application/json',
              'User-Agent': 'GetBestAI/1.0',
            },
          }
        );

        console.log('[local-api] Upstream status:', upstream.status);

        if (!upstream.ok) {
          const text = await upstream.text();
          console.error('[local-api] Upstream error:', text);
          res.statusCode = upstream.status;
          return res.end(JSON.stringify({ error: 'Upstream API error', status: upstream.status, message: text }));
        }

        const data = await upstream.json();
        console.log('[local-api] Models received:', data.data?.length ?? 0);

        res.statusCode = 200;
        res.end(
          JSON.stringify({
            success: true,
            timestamp: new Date().toISOString(),
            models_count: data.data?.length ?? 0,
            data,
          })
        );
      } catch (err) {
        console.error('[local-api] Error:', err.message);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error', message: err.message }));
      }
    });
  },
};

export default defineConfig({
  plugins: [react(), localApiPlugin],
});
