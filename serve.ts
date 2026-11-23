// serve.ts — server statis kecil untuk memainkan Kota Karang di peramban.
// Menyajikan folder game/ di http://localhost:8099 (atau $PORT).
// Tanpa cache untuk HTML/JS supaya perubahan langsung terlihat; jalur
// di luar game/ ditolak. Hanya untuk pengembangan lokal.

import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";

const PORT: number = parseInt(process.env.PORT || "8099", 10);
const ROOT: string = path.resolve(path.dirname(new URL(import.meta.url).pathname), "game");

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
};

function contentType(file: string): string {
  return TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
}

const server: http.Server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse): void => {
  const raw: string = req.url || "/";
  const urlPath: string = decodeURIComponent(raw.split("?")[0]);
  const rel: string = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const file: string = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }
  fs.readFile(file, (err: NodeJS.ErrnoException | null, data: Buffer): void => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found: " + rel);
      return;
    }
    const headers: Record<string, string> = { "Content-Type": contentType(file) };
    if (file.endsWith(".html") || file.endsWith(".js")) headers["Cache-Control"] = "no-cache";
    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, (): void => {
  console.log("Kota Karang di http://localhost:" + PORT + " (menyajikan game/)");
});
