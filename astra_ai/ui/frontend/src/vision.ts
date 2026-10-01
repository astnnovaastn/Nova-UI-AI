import type { AegisSocket } from "./ws";

export type VisionChannel = "camera";
export type VisionState = "off" | "starting" | "live" | "denied" | "error";

export interface VisionStatus {
  camera: VisionState;
  lastFrameAt: number | null;
  error?: string;
}

type StatusHandler = (status: VisionStatus) => void;

/** Browser-side JPEG capture for Gemini Live vision input. */
export class VisionCapture {
  private readonly socket: AegisSocket;
  private readonly onStatus: StatusHandler;
  private cameraStream: MediaStream | null = null;
  private cameraTimer: number | null = null;
  private preview: HTMLVideoElement | null = null;
  private status: VisionStatus = { camera: "off", lastFrameAt: null };

  constructor(socket: AegisSocket, onStatus: StatusHandler) {
    this.socket = socket;
    this.onStatus = onStatus;
  }

  getStatus(): VisionStatus { return { ...this.status }; }

  private update(channel: VisionChannel, state: VisionState, error?: string) {
    this.status = { ...this.status, [channel]: state, error };
    this.onStatus(this.getStatus());
  }

  getCameraStream(): MediaStream | null { return this.cameraStream; }

  attachPreview(video: HTMLVideoElement): void {
    this.preview = video;
    video.srcObject = this.cameraStream;
    video.muted = true;
    video.playsInline = true;
    if (this.cameraStream) void video.play();
  }

  private sendFrame(channel: VisionChannel, canvas: HTMLCanvasElement) {
    canvas.toBlob((blob) => {
      if (!blob || !this.socket.isConnected()) return;
      blob.arrayBuffer().then((payload) => {
        const bytes = new Uint8Array(payload.byteLength + 5);
        bytes.set([0x41, 0x53, 0x54, 0x52, channel === "camera" ? 1 : 2]);
        bytes.set(new Uint8Array(payload), 5);
        this.socket.sendBinary(bytes.buffer);
        this.status = { ...this.status, lastFrameAt: Date.now() };
        this.onStatus(this.getStatus());
      }).catch(() => undefined);
    }, "image/jpeg", 0.72);
  }

  private startLoop(channel: VisionChannel, stream: MediaStream, fps = 1) {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    void video.play();
    const canvas = document.createElement("canvas");
    const tick = () => {
      if (!stream.active) return;
      if (video.videoWidth && video.videoHeight) {
        const scale = Math.min(1, 1280 / video.videoWidth);
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
        this.sendFrame(channel, canvas);
      }
    };
    const timer = window.setInterval(tick, Math.round(1000 / fps));
    this.cameraTimer = timer;
  }

  async startCamera(): Promise<void> {
    if (this.cameraStream?.active) return;
    this.update("camera", "starting");
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 10, max: 15 } } });
      if (this.preview) {
        this.preview.srcObject = this.cameraStream;
        void this.preview.play();
      }
      this.cameraStream.getVideoTracks()[0]?.addEventListener("ended", () => this.stopCamera());
      this.startLoop("camera", this.cameraStream, 1);
      this.update("camera", "live");
    } catch (error) {
      this.update("camera", error instanceof DOMException && error.name === "NotAllowedError" ? "denied" : "error", String(error));
    }
  }

  stopCamera() {
    if (this.cameraTimer !== null) window.clearInterval(this.cameraTimer);
    this.cameraTimer = null;
    this.cameraStream?.getTracks().forEach((track) => track.stop());
    this.cameraStream = null;
    this.update("camera", "off");
  }

  stopAll() { this.stopCamera(); }
}
