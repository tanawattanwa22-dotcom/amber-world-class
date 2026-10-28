const CACHE_NAME='55-performance-nvh-v02';
const FILES=['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith('55-performance-nvh-')&&key!==CACHE_NAME)await caches.delete(key)}await self.clients.claim()})())});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;event.respondWith((async()=>{try{const response=await fetch(req);if(response.ok){const cache=await caches.open(CACHE_NAME);cache.put(req,response.clone())}return response}catch(e){return (await caches.match(req))||Response.error()}})())});
