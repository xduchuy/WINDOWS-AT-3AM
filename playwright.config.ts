import fs from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Workaround for Windows OneDrive folders where OneDrive cloud-reparse points cause
// Node's fs.Dirent.isFile() to return false and isSymbolicLink() to return true.
const origIsFile = fs.Dirent.prototype.isFile;
fs.Dirent.prototype.isFile = function () {
  if (origIsFile.call(this)) return true;
  if (this.isSymbolicLink() && /\.(spec|test)\.(ts|tsx|js|mjs)$/.test(this.name)) {
    return true;
  }
  return false;
};

export default defineConfig({
  testDir: './tests',
  timeout: 90000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'off',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'msedge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
      },
    },
  ],
});
