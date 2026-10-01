/** WebSocket client for Astra server communication. */

export type MessageHandler = (msg: Record<string, unknown>) => void;
export type BinaryHandler = (data: ArrayBuffer) => void;

export interface AegisSocket {
  send(data: Record<string, unknown>): void;
  sendBinary(data: ArrayBuffer): void;
  onMessage(handler: MessageHandler): void;
  onBinary(handler: BinaryHandler): void;
  onOpen(handler: () => void): void;
  close(): void;
  isConnected(): boolean;
}

export function createSocket(url: string): AegisSocket {
  let ws: WebSocket | null = null;
  const handlers: MessageHandler[] = [];
  const binaryHandlers: BinaryHandler[] = [];
  const openHandlers: Array<() => void> = [];
  let reconnectDelay = 1000;
  let closed = false;
  let connected = false;

  function connect() {
    if (closed) return;
    ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      connected = true;
      reconnectDelay = 1000;
      console.log("[WS] Connected to server");
      for (const handler of openHandlers) handler();
    };

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        for (const handler of binaryHandlers) handler(event.data);
        return;
      }
      try {
        const msg = JSON.parse(String(event.data)) as Record<string, unknown>;
        for (const handler of handlers) handler(msg);
      } catch {
        console.warn("[WS] Invalid message", event.data);
      }
    };

    ws.onclose = () => {
      connected = false;
      if (!closed) {
        setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      }
    };

    ws.onerror = () => ws?.close();
  }

  connect();

  return {
    send(data) {
      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
    },
    sendBinary(data) {
      if (ws?.readyState === WebSocket.OPEN) ws.send(data);
    },
    onMessage(handler) {
      handlers.push(handler);
    },
    onBinary(handler) {
      binaryHandlers.push(handler);
    },
    onOpen(handler) {
      openHandlers.push(handler);
      if (connected) handler();
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
