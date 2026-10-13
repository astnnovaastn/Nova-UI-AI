import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('./ws.ts', import.meta.url),'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { createSocket } = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
class FakeSocket {
 static OPEN=1; static sockets=[];
 readyState=0;
 constructor(){FakeSocket.sockets.push(this);}
 send(value){this.sent=(this.sent||[]).concat(value);}
 close(){this.readyState=3;this.onclose?.();}
 open(){this.readyState=1;this.onopen?.();}
}
test('reconnect ignores stale events and never replays unsent messages', ()=>{
 globalThis.WebSocket=FakeSocket; FakeSocket.sockets=[];
 const socket=createSocket('ws://local');let opened=0,closed=0,messages=0;
 socket.onOpen(()=>opened++);socket.onClose(()=>closed++);socket.onMessage(()=>messages++);
 const first=FakeSocket.sockets[0];first.open();socket.send({type:'first'});
 socket.reconnect();const second=FakeSocket.sockets[1];
 first.onopen();first.onmessage({data:'{"type":"stale"}'});first.onclose();
 assert.equal(opened,1);assert.equal(messages,0);assert.equal(closed,0);
 socket.send({type:'not-delivered'});second.open();
 assert.equal(second.sent,undefined);assert.equal(opened,2);socket.close();assert.equal(socket.isConnected(),false);
});
test('explicit close cancels scheduled reconnect', t=>{
 globalThis.WebSocket=FakeSocket;FakeSocket.sockets=[];
 t.mock.timers.enable({apis:['setTimeout']});
 const socket=createSocket('ws://local');FakeSocket.sockets[0].close();socket.close();
 t.mock.timers.tick(30000);assert.equal(FakeSocket.sockets.length,1);
});
