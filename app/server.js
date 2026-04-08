const { createServer } = require("node:http");
const { readFileSync, existsSync } = require("node:fs");
const { join, extname } = require("node:path");

const dist = join(__dirname, "dist");
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
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
  ".eot": "application/vnd.ms-fontobject",
  ".mjs": "application/javascript; charset=utf-8",
  ".map": "application/json",
};

createServer((req, res) => {
  let reqPath = req.url?.split("?")[0] || "/";

  if (reqPath === "/") {
    reqPath = "/index.html";
  }

  const filePath = join(dist, reqPath);

  if (existsSync(filePath)) {
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const data = readFileSync(filePath);
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000",
    });
    return res.end(data);
  }

  const indexPath = join(dist, "index.html");
  if (existsSync(indexPath)) {
    const data = readFileSync(indexPath);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(data);
  }

  res.writeHead(404);
  res.end("Not Found");
}).listen(PORT, () => {
  console.log(`Frontend serving on port ${PORT}`);
});
