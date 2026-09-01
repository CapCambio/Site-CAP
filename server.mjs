import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'dist', 'public');

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

const server = http.createServer((req, res) => {
  // Remove trailing slash for consistency
  const url = req.url.replace(/\/$/, '') || '/';
  
  // Handle /tv and /tv/ routes
  if (url === '/tv' || url === '/tv/') {
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    serveFile(res, indexPath);
    return;
  }
  
  // Handle /tv/assets/... routes
  if (url.startsWith('/tv/assets/')) {
    const assetPath = url.replace('/tv', '');
    const filePath = path.join(PUBLIC_DIR, assetPath);
    serveFile(res, filePath);
    return;
  }
  
  // Handle other /tv/* routes (fallback to index.html for SPA routing)
  if (url.startsWith('/tv/')) {
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    serveFile(res, indexPath);
    return;
  }
  
  // Handle root route (optional, for testing)
  if (url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('TV Caxias is available at /tv');
    return;
  }
  
  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`TV Caxias server running on port ${PORT}`);
  console.log(`Access at: http://localhost:${PORT}/tv`);
});
