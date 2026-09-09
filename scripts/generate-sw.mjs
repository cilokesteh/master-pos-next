import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve("out");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const files = await walk(outDir);
const assets = files
  .map((file) => "/" + path.relative(outDir, file).split(path.sep).join("/"))
  .filter((url) =>
    url === "/index.html" ||
    url === "/manifest.webmanifest" ||
    url === "/icon.svg" ||
    url.startsWith("/_next/static/")
  );

assets.push("/");
const uniqueAssets = [...new Set(assets)].sort();
const buildHash = Buffer.from(uniqueAssets.join("\n")).toString("base64url").slice(0, 12);

const source = `const CACHE_NAME = "master-pos-umkm-${buildHash}";
const APP_SHELL = ${JSON.stringify(uniqueAssets, null, 2)};

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
  )));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok && response.type === "basic") {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }))
  );
});
`;

await writeFile(path.join(outDir, "sw.js"), source);
console.log(`Generated sw.js: ${uniqueAssets.length} assets, cache ${buildHash}`);
