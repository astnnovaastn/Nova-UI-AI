/**
 * WebSocket client for Nova server communication.
 */

export type MessageHandler = (msg: Record<string, unknown>) => void;

export interface JarvisSocket {
  send(data: Record<string, unknown>): void;
  onMessage(handler: MessageHandler): void;
  close(): void;
  isConnected(): boolean;
}

export function createSocket(url: string): JarvisSocket {
  let ws: WebSocket | null = null;
  let handlers: MessageHandler[] = [];
  let reconnectDelay = 1000;
  let closed = false;
  let connected = false;

  function connect() {
    if (closed) return;

    ws = new WebSocket(url);

    ws.onopen = () => {
      connected = true;
      reconnectDelay = 1000;
      console.log("✅ [WS] Connected to server");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log(`📥 [WS] Received:`, msg);
        for (const h of handlers) h(msg);
      } catch {
        console.warn("[ws] bad message", event.data);
      }
    };

    ws.onclose = () => {
      connected = false;
      if (!closed) {
        console.log(`🔄 [WS] Disconnected, reconnecting in ${reconnectDelay}ms...`);
        setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      } else {
        console.log("❌ [WS] WebSocket closed");
      }
    };

    ws.onerror = (err) => {
      console.error("❌ [WS] Error:", err);
      ws?.close();
    };
  }

  connect();

  return {
    send(data) {
      if (ws?.readyState === WebSocket.OPEN) {
        // Log specific message types with more detail
        if (data.type === "transcript") {
          console.log(`📤 [WS] TRANSCRIPT SENDING → "${(data.text as string).substring(0, 50)}${(data.text as string).length > 50 ? '...' : ''}"`);
        } else {
          console.log(`📤 [WS] Sending:`, data);
        }
        ws.send(JSON.stringify(data));
      } else {
        console.warn(`⚠️  [WS] Cannot send, not connected (readyState: ${ws?.readyState})`);
      }
    },
    onMessage(handler) {
      handlers.push(handler);
    },
    close() {
      closed = true;
      ws?.close();
    },
    isConnected() {
      return connected;
    },
  };
}
