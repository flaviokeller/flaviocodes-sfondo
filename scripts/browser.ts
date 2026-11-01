// Shared by the export scripts: a Vite dev server plus headless Chromium on the GPU.
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

export async function startBrowser() {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const server = await createServer({ root, logLevel: 'error', server: { port: 0 } });
  await server.listen();
  const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  return {
    base: server.resolvedUrls!.local[0],
    browser,
    async close() {
      await browser.close();
      await server.close();
    },
  };
}
