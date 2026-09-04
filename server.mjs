import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'dist', 'public');
const HOMEPAGE_DIR = path.join(__dirname, 'public', 'homepage');

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const mimeType = getMimeType(filePath);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
}

// Rotas que pertencem ao app React (SPA da plataforma e TV)
const REACT_APP_PREFIXES = ['/precos', '/tv', '/auth', '/api', '/sw.js', '/assets/', '/optimized/'];

function isReactAppRoute(url) {
  return REACT_APP_PREFIXES.some(prefix => url === prefix || url.startsWith(prefix));
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0]; // ignorar query string para roteamento

  // ── Assets da homepage (/homepage/assets/... e /homepage/fonts/...)
  if (url.startsWith('/homepage/')) {
    const relativePath = url.replace('/homepage/', '');
    const filePath = path.join(HOMEPAGE_DIR, relativePath);
    serveFile(res, filePath);
    return;
  }

  // ── Assets do app React (/assets/... e /tv/assets/...)
  if (url.startsWith('/assets/') || url.startsWith('/tv/assets/')) {
    const assetPath = url.replace(/^\/tv/, '');
    const filePath = path.join(PUBLIC_DIR, assetPath);
    serveFile(res, filePath);
    return;
  }

  // ── Outros arquivos estáticos do React app (sw.js, manifest.json, etc.)
  if (url.match(/\.(js|css|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|webp|mp4)$/)) {
    const filePath = path.join(PUBLIC_DIR, url);
    serveFile(res, filePath);
    return;
  }

  // ── Rotas do React app (plataforma, TV, auth)
  if (isReactAppRoute(url)) {
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    serveFile(res, indexPath);
    return;
  }

  // ── Tudo o resto (/, /sobre, /privacidade, etc.) → homepage institucional
  const homepageIndex = path.join(HOMEPAGE_DIR, 'index.html');
  serveFile(res, homepageIndex);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
});
