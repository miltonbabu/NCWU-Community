const { createServer } = require("node:http");
const { readFileSync, existsSync, readdirSync } = require("node:fs");
const { join, extname } = require("node:path");

const dist = join(__dirname, "dist");
const PORT = process.env.PORT || 3000;

console.log("[frontend] dist path:", dist);
console.log("[frontend] files in dist:", existsSync(dist) ? readdirSync(dist) : "NOT FOUND");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
};

createServer((req, res) => {
  const url = req.url || "/";
  const reqPath = url.split("?")[0];
  console.log("[frontend]", req.method, reqPath);

  if (reqPath === "/") {
    const indexPath = join(dist, "index.html");
    if (!existsSync(indexPath)) {
      console.error("[frontend] index.html not found at", indexPath);
      res.writeHead(500);
      return res.end("index.html not found");
    }
    const data = readFileSync(indexPath);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(data);
  }

  const filePath = join(dist, reqPath);

  if (existsSync(filePath)) {
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const data = readFileSync(filePath);
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    });
    return res.end(data);
  }

  const indexPath = join(dist, "index.html");
  if (existsSync(indexPath)) {
    const data = readFileSync(indexPath);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(data);
  }

  console.log("[frontend] 404 for:", reqPath);
  res.writeHead(404);
  res.end("Not Found");
}).listen(PORT, () => {
  console.log(`[frontend] Server running on port ${PORT}`);
});
