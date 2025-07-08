// Puppeteer configuration for Split Pay visual testing
export default {
  launch: {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  },
  defaultViewport: {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  },
  timeout: 30000,
  baseUrl: 'http://localhost:3000',
  screenshots: {
    path: './split pay update/screenshots',
    fullPage: true,
    quality: 100
  },
  thresholds: {
    pixel: 0.1,
    threshold: 0.2
  }
}