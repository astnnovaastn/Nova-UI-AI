/** WebSocket client for Astra server communication. */

export type MessageHandler = (msg: Record<string, unknown>) => void;
export type BinaryHandler = (data: ArrayBuffer) => void;

export interface AegisSocket {
  send(data: Record<string, unknown>): void;
  sendBinary(data: ArrayBuffer): void;
  onMessage(handler: MessageHandler): void;
  onBinary(handler: BinaryHandler): void;
  onOpen(handler: () => void): void;
  onClose(handler: () => void): void;
  reconnect(): void;
  close(): void;
  isConnected(): boolean;
}

export function createSocket(url: string): AegisSocket {
  let ws: WebSocket | null = null;
  const handlers: MessageHandler[] = [];
  const binaryHandlers: BinaryHandler[] = [];
  const openHandlers: Array<() => void> = [];
  const closeHandlers: Array<() => void> = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let generation = 0;
  let reconnectDelay = 1000;
  let closed = false;
  let connected = false;

  function connect() {
    if (closed) return;
    const epoch = ++generation;
    if (timer) clearTimeout(timer); timer = null;
    ws = new WebSocket(url);
    const current = ws;
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      if (epoch !== generation) return;
      connected = true;
      reconnectDelay = 1000;
      console.log("[WS] Connected to server");
      for (const handler of openHandlers) handler();
    };

    ws.onmessage = (event) => {
      if (epoch !== generation) return;
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
      if (epoch !== generation) return;
      connected = false;
      for (const handler of closeHandlers) handler();
      if (!closed) {
        timer = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      }
    };

    ws.onerror = () => current.close();
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
    onClose(handler) { closeHandlers.push(handler); },
    reconnect() {
      if (closed) return;
      ++generation; connected = false;
      if (timer) clearTimeout(timer);
      ws?.close(); connect();
    },
    close() {
      closed = true; ++generation;
      connected = false;
      if (timer) clearTimeout(timer);
      ws?.close();
    },
    isConnected() {
      return connected;
    },
  };
}
