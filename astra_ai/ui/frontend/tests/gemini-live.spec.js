import { expect, test } from '@playwright/test';

test.use({
  permissions: ['microphone'],
  launchOptions: {
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
});

test('starts muted and opens a Gemini Live PCM session on click', async ({ page }) => {
  const sentFrames = [];
  const receivedFrames = [];
  page.on('websocket', (socket) => {
    socket.on('framesent', (event) => sentFrames.push(event.payload));
    socket.on('framereceived', (event) => receivedFrames.push(event.payload));
  });

  await page.goto('/');
  const mute = page.locator('#btn-mute');
  await expect(mute).toHaveClass(/muted/);

  await mute.click();
  await expect.poll(() => sentFrames.some((payload) =>
    typeof payload === 'string' && payload.includes('live_start')
  ), { timeout: 30_000 }).toBe(true);
  await expect.poll(() => receivedFrames.some((payload) =>
    typeof payload === 'string'
      && payload.includes('"type":"live_status"')
      && payload.includes('"provider":"gemini_live"')
      && payload.includes('"state":"listening"')
  ), { timeout: 30_000 }).toBe(true);
  await expect.poll(() => sentFrames.some((payload) =>
    typeof payload !== 'string'
  )).toBe(true);

  await mute.click();
  await expect.poll(() => sentFrames.some((payload) =>
    typeof payload === 'string' && payload.includes('live_stop')
  )).toBe(true);
});

test('streams native PCM through the speaking analyser state', async ({ page }) => {
  await page.routeWebSocket(/\/ws\/voice$/, (socket) => {
    socket.onMessage((message) => {
      if (typeof message !== 'string' || !message.includes('live_start')) return;
      socket.send(JSON.stringify({
        type: 'live_status', provider: 'gemini_live', state: 'listening',
        input_sample_rate: 16000, output_sample_rate: 24000,
      }));
      const pcm = Buffer.alloc(24000 * 2);
      for (let index = 0; index < 24000; index += 1) {
        pcm.writeInt16LE(Math.round(Math.sin(index / 10) * 12000), index * 2);
      }
      socket.send(pcm);
      setTimeout(() => socket.send(JSON.stringify({ type: 'live_turn_complete' })), 25);
    });
  });

  await page.goto('/');
  await page.locator('#btn-mute').click();
  await expect(page.locator('body')).toHaveAttribute('data-ai-state', 'speaking');
  await expect(page.locator('body')).toHaveAttribute('data-ai-state', 'idle', { timeout: 5_000 });
});
