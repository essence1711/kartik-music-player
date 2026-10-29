const CACHE='kartik-music-shell-v2';
const ASSETS=['./','./index.html','./styles.css','./app.js','./firebase-auth.js','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(ASSETS);await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;event.respondWith((async()=>{const cache=await caches.open(CACHE);const cached=await cache.match(event.request);if(cached)return cached;try{const response=await fetch(event.request);if(response.ok)cache.put(event.request,response.clone());return response}catch(error){return cache.match('./')||Response.error()}})())});
