// Loopback-only static server for the production canvas; deliberately no API routes.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../public');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.svg':'image/svg+xml','.json':'application/json'};
http.createServer((request,response)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);}catch{response.writeHead(400).end();return;}
 const target=path.resolve(root,'.'+pathname);
 if(!target.startsWith(root+path.sep)||pathname.startsWith('/api/')){response.writeHead(403).end();return;}
 fs.readFile(target,(error,body)=>{if(error){response.writeHead(404).end();return;}response.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'}).end(body);});
}).listen(5187,'127.0.0.1',()=>console.log('Offline production canvas: http://127.0.0.1:5187/v20-simulation.html?aegisFixture=mixed-result'));
