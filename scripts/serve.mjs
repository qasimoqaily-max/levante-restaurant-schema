import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
]);

function headersFor(file, pathname) {
  const headers = {
    'Content-Type': mime.get(path.extname(file).toLowerCase()) ?? 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'none'",
  };
  headers['Cache-Control'] = pathname.startsWith('/assets/')
    ? 'public, max-age=31536000, immutable'
    : 'no-cache';
  return headers;
}

function sendFile(request, response, file, status, pathname) {
  const stat = fs.statSync(file);
  response.writeHead(status, {
    ...headersFor(file, pathname),
    'Content-Length': stat.size,
  });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  fs.createReadStream(file).pipe(response);
}

export async function createStaticServer({ root, host = '127.0.0.1', port = 0 }) {
  const publicRoot = path.resolve(root);
  const server = http.createServer((request, response) => {
    if (!['GET', 'HEAD'].includes(request.method ?? 'GET')) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end('Method Not Allowed');
      return;
    }

    let url;
    let decoded;
    try {
      url = new URL(request.url ?? '/', 'http://localhost');
      decoded = decodeURIComponent(url.pathname);
    } catch {
      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Bad Request');
      return;
    }

    if (decoded.includes('\0')) {
      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Bad Request');
      return;
    }

    const normalized = path.posix.normalize(`/${decoded.replaceAll('\\', '/')}`);
    const relative = normalized.replace(/^\/+/, '');
    let candidate = path.resolve(publicRoot, relative);
    if (!candidate.startsWith(`${publicRoot}${path.sep}`) && candidate !== publicRoot) {
      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Bad Request');
      return;
    }

    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      if (!url.pathname.endsWith('/')) {
        response.writeHead(308, { Location: `${url.pathname}/${url.search}` });
        response.end();
        return;
      }
      candidate = path.join(candidate, 'index.html');
    } else if (url.pathname.endsWith('/')) {
      candidate = path.join(candidate, 'index.html');
    }

    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      sendFile(request, response, candidate, 200, url.pathname);
      return;
    }

    const notFound = path.join(publicRoot, '404.html');
    if (fs.existsSync(notFound)) {
      sendFile(request, response, notFound, 404, '/404.html');
      return;
    }
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not Found');
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  return { server, url: `http://${host}:${actualPort}` };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = path.resolve(process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist'));
  const port = Number(process.env.PORT ?? 4173);
  const { url } = await createStaticServer({ root, port });
  console.log(`Serving ${root} at ${url}`);
}
