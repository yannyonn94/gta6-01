// serve.ts — server file statis kecil untuk folder game/.
// Port dari PORT atau 8099. Tanpa cache untuk HTML dan JS, 404 dicatat.
import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";

const PORT: number = parseInt(process.env.PORT || "8099", 10);
const ROOT: string = path.resolve("game");

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
  ".ico": "image/x-icon"
};

const server: http.Server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse): void => {
  const rawUrl: string = req.url || "/";
  const urlPath: string = decodeURIComponent(rawUrl.split("?")[0]);
  const safePath: string = path.normalize(path.join(ROOT, urlPath));
  if (!safePath.startsWith(ROOT)) {
    res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    res.end("Forbidden\n");
    return;
  }
  let filePath: string = safePath;
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
  } catch {
    // lanjut ke penanganan 404 di bawah
  }
  fs.readFile(filePath, (err: NodeJS.ErrnoException | null, data: Buffer): void => {
    if (err) {
      console.log("404 " + req.method + " " + rawUrl);
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found\n");
      return;
    }
    const ext: string = path.extname(filePath).toLowerCase();
    const type: string = TYPES[ext] || "application/octet-stream";
    const headers: Record<string, string> = { "content-type": type };
    if (ext === ".html" || ext === ".js" || ext === ".mjs") {
      headers["cache-control"] = "no-store";
    }
    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, (): void => {
  console.log("Kota Karang disajikan di http://localhost:" + PORT + "/ (root game/)");
});

server.on("error", (err: NodeJS.ErrnoException): void => {
  console.error("Kota Karang serve.ts gagal mengikat port " + PORT + ": " + err.message);
  process.exit(1);
});
