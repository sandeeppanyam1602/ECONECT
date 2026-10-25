#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || "10000", 10);
const HOST = "0.0.0.0";
const DIST_DIR = path.join(__dirname, "dist");

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
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0];

  // Health check endpoint for Render
  if (urlPath === "/healthz" || urlPath === "/health" || urlPath === "/ping") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy", service: "ECONECT", port: PORT }));
    return;
  }

  // Remove leading slash
  let safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  if (safePath === "/" || safePath === "\\") {
    safePath = "index.html";
  }

  let filePath = path.join(DIST_DIR, safePath);

  // Check if file exists in dist
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // SPA Fallback: serve index.html for all client-side routes
    const indexPath = path.join(DIST_DIR, "index.html");
    fs.readFile(indexPath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error: index.html not found. Please ensure 'npm run build' has been executed.");
        return;
      }
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      res.end(content);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`ECONECT Full-Stack Server running at http://${HOST}:${PORT}`);
});
