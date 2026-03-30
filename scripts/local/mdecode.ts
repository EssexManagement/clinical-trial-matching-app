import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';

// Folders to process
const FOLDERS = ['errors_on_notice', 'errors_on_rollback', 'real_working_user'];

// Decode a single Mimecast protected URL
async function decodeMimecastURL(url: string, page: Page): Promise<string> {
  try {
    // Navigate to the URL, allowing redirects
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Follow redirects and handle Mimecast domains
    let currentURL = new URL(page.url());

    while (currentURL.hostname.includes('mimecast')) {
      console.log(`      Redirected to: ${currentURL.toString()}`);
      console.log(`      Attempting to find download link...`);
      try {
        // Wait for Download button/link - try multiple selectors
        const downloadButton = await page
          .waitForSelector('button::-p-text(Download)', { timeout: 10000 })
          .catch(async () => {
            // Try alternative selectors
            return await page.waitForSelector('a[download], a::-p-text(Download)', { timeout: 5000 }).catch(() => null);
          });

        if (!downloadButton) {
          console.log(`      No download button found, breaking loop`);
          await fs.mkdir('mimecast_decode_errors', { recursive: true });
          const screenshotPath = path.join('mimecast_decode_errors', `no_download_link_${Date.now()}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.error(`      No download link found. Screenshot saved to ${screenshotPath}`);
          throw new Error('No download link found on Mimecast page.');
        }

        console.log(`      Found download button, clicking...`);

        // Click the download button/link and wait for navigation
        const navigationPromise = page
          .waitForNavigation({
            waitUntil: 'networkidle2',
            timeout: 30000,
          })
          .catch(() => null);

        await downloadButton.click();
        await navigationPromise;

        currentURL = new URL(page.url());
      } catch (e) {
        // No download link found or timeout, break the loop
        await fs.mkdir('mimecast_decode_errors', { recursive: true });
        const screenshotPath = path.join('mimecast_decode_errors', `no_download_link_${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.error(`No download link found. Screenshot saved to ${screenshotPath}`);
        throw new Error('No download link found on Mimecast page.');
      }
    }

    return currentURL.toString();
  } catch (error) {
    console.error(`Error decoding URL ${url}:`, error);
    // Save a screenshot of the page on error
    try {
      const safeUrl = url.replace(/[^a-z0-9]/gi, '_').slice(0, 100);
      const screenshotPath = path.join('mimecast_decode_errors', `error_${safeUrl}.png`);
      await fs.mkdir('mimecast_decode_errors', { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.error(`Screenshot saved to ${screenshotPath}`);
    } catch (screenshotError) {
      console.error('Failed to save screenshot:', screenshotError);
    }
    return url; // Return original URL if decoding fails
  }
}

// Main algorithm
async function main() {
  // Initialize Puppeteer browser in headless mode
  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Process each folder
    for (const folder of FOLDERS) {
      console.log(`Processing folder: ${folder}`);
      const mmap = new Map<string, string>(); // URL -> DecodedURL mapping

      try {
        // List all files in folder
        const files = await fs.readdir(folder);

        // Process each file
        for (const file of files) {
          const filePath = path.join(folder, file);

          // Skip directories
          const stat = await fs.stat(filePath);
          if (!stat.isFile()) continue;

          console.log(`  Processing file: ${file}`);

          // Read file content
          let content = await fs.readFile(filePath, 'utf-8');

          // Extract all Mimecast URLs
          const mimecastRegex = /https?:\/\/[^\s<>"]*mimecast[^\s<>"]*/gi;
          const urls = content.match(mimecastRegex) || [];

          // Decode each unique URL
          for (const url of urls) {
            if (mmap.has(url)) continue; // Skip if already decoded

            console.log(`    Decoding URL: ${url}`);
            const decodedURL = await decodeMimecastURL(url, page);
            mmap.set(url, decodedURL);
            console.log(`    Decoded to: ${decodedURL}`);
          }

          // Replace all URLs in file with decoded versions
          for (const [originalURL, decodedURL] of mmap.entries()) {
            content = content.split(originalURL).join(decodedURL);
          }

          // Save modified file
          await fs.writeFile(filePath, content, 'utf-8');
        }
      } catch (error) {
        console.error(`Error processing folder ${folder}:`, error);
      }
    }
  } finally {
    // Cleanup: Close browser
    await browser.close();
  }
}

// Run the main algorithm
main().catch(console.error);
