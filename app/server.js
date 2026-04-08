const http = require("http");
const fs = require("fs");
const path = require("path");

var dist = path.join(__dirname, "dist");
var PORT = process.env.PORT || 3000;

console.log("[frontend] dist:", dist);
console.log("[frontend] exists:", fs.existsSync(dist));

if (fs.existsSync(dist)) {
  console.log("[frontend] files:", fs.readdirSync(dist).slice(0, 10));
}

var MIME = {
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

http.createServer(function(req, res) {
  var url = req.url || "/";
  var reqPath = url.split("?")[0];
  console.log("[frontend]", req.method, reqPath);

  if (reqPath === "/") {
    var idx = path.join(dist, "index.html");
    if (!fs.existsSync(idx)) {
      res.writeHead(500);
      return res.end("index.html not found at " + idx);
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(fs.readFileSync(idx));
  }

  var fp = path.join(dist, reqPath);

  if (fs.existsSync(fp)) {
    var ext = path.extname(fp);
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    });
    return res.end(fs.readFileSync(fp));
  }

  var idx = path.join(dist, "index.html");
  if (fs.existsSync(idx)) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(fs.readFileSync(idx));
  }

  res.writeHead(404);
  res.end("Not Found");
}).listen(PORT, function() {
  console.log("[frontend] listening on port", PORT);
});
