// [RONDE 4] Server statis kecil untuk mengunjungi game.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'game');
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};

const port = Number(process.env.PORT ?? 8099);
createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    const file = join(root, path === '/' ? 'index.html' : path);
    if (!file.startsWith(root)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const body = await readFile(file);
    // HTML tidak di-cache supaya revisi game langsung terlihat.
    const headers: Record<string, string> = {
      'content-type': types[extname(file)] ?? 'application/octet-stream',
    };
    if (extname(file) === '.html') headers['cache-control'] = 'no-store';
    res.writeHead(200, headers);
    res.end(body);
    if (process.env.VERBOSE) console.log(`${req.method} ${url.pathname} -> 200`);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`Kota Karang berjalan di http://127.0.0.1:${port}/`));
