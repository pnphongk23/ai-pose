import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { BrowserContext, Locator, Page } from "playwright";

import { createPersistentBrowserSession } from "./browser-session";
import { WORKER_ERROR_CODES } from "./error-codes";

async function ensurePage(context: BrowserContext): Promise<Page> {
  const pages = context.pages();
  if (pages.length > 0) {
    return pages[0];
  }
  return context.newPage();
}

async function findFirstVisible(page: Page, selectors: string[]): Promise<Locator | null> {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.count()) {
      return locator;
    }
  }
  return null;
}

/**
 * Polls multiple selectors until one appears, up to `timeoutMs`.
 * Unlike `findFirstVisible`, this retries to handle SPA hydration delay.
 */
async function waitForAnySelector(page: Page, selectors: string[], timeoutMs: number): Promise<Locator | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = await findFirstVisible(page, selectors);
    if (found) return found;
    await page.waitForTimeout(500);
  }
  return null;
}

async function detectAuthRequired(page: Page): Promise<boolean> {
  const url = page.url().toLowerCase();
  if (url.includes("accounts.google.com") || url.includes("signin") || url.includes("challenge")) {
    return true;
  }

  const authTexts = [
    "sign in",
    "đăng nhập",
    "choose an account",
    "use your google account",
    "to continue to gemini"
  ];

  const pageText = (await page.textContent("body"))?.toLowerCase() ?? "";
  return authTexts.some((text) => pageText.includes(text));
}

function createAuthRequiredError(): Error {
  const error = new Error("Google account authentication is required for Gemini browser automation");
  (error as Error & { code?: string }).code = WORKER_ERROR_CODES.browserAuthRequired;
  return error;
}

export class GeminiBrowserClient {
  async checkAuthReady(): Promise<{ ready: boolean; reason?: string }> {
    if (this.config.useMockFlow) {
      return { ready: true };
    }

    const context = await this.getContext();
    const page = await ensurePage(context);
    await page.goto(this.config.appUrl, { waitUntil: "domcontentloaded" });

    const promptBox = await findFirstVisible(page, ["textarea", "[contenteditable='true']", "[role='textbox']", "input[type='text']"]);
    if (promptBox) {
      return { ready: true };
    }

    if (await detectAuthRequired(page)) {
      return { ready: false, reason: WORKER_ERROR_CODES.browserAuthRequired };
    }

    return { ready: false, reason: "BROWSER_UI_NOT_READY" };
  }

  private contextPromise: Promise<BrowserContext> | null = null;

  constructor(
    private readonly config: {
      appUrl: string;
      profileDir: string;
      headless: boolean;
      executablePath?: string;
      chromeChannel?: string;
      prompt: string;
      timeoutMs: number;
      useMockFlow?: boolean;
      debugDir?: string;
    }
  ) {}

  async extractPoseImage(input: {
    sourceImageBase64: string;
    sourceMimeType: string;
  }): Promise<{ imageBase64: string; mimeType: "image/png" | "image/jpeg" | "image/webp" }> {
    if (this.config.useMockFlow) {
      return { imageBase64: input.sourceImageBase64, mimeType: input.sourceMimeType as "image/png" | "image/jpeg" | "image/webp" };
    }

    const context = await this.getContext();
    const page = await ensurePage(context);
    page.setDefaultTimeout(this.config.timeoutMs);

    const uploadPath = path.join(os.tmpdir(), `pose-worker-input-${randomUUID()}.png`);
    fs.writeFileSync(uploadPath, Buffer.from(input.sourceImageBase64, "base64"));

    try {
      // Navigate and wait for DOM, then explicitly wait for the prompt box.
      // networkidle times out on Gemini SPA due to constant WebSocket/analytics traffic.
      await page.goto(this.config.appUrl, { waitUntil: "domcontentloaded" });

      // Wait for one of the prompt box selectors to appear (SPA hydration)
      const PROMPT_SELECTORS = [
        "div[aria-label*='Enter a prompt'][role='textbox']", // Confirmed from live UI
        "div.ql-editor.textarea[role='textbox']",
        "[role='textbox'][contenteditable='true']",
        "textarea",
        "[contenteditable='true']"
      ];
      const promptBox = await waitForAnySelector(page, PROMPT_SELECTORS, 30000);
      if (!promptBox) {
        if (await detectAuthRequired(page)) {
          throw createAuthRequiredError();
        }
        throw new Error("Prompt input not found after waiting for SPA hydration");
      }

      // Handle image upload — Gemini uses a two-step menu:
      // 1. Click "+" button (aria-label="Open upload file menu") to open menu
      // 2. Click "Upload files" option which triggers a hidden file input
      const directFileInput = await findFirstVisible(page, [
        "input[type='file'][accept*='image']",
        "input[type='file']"
      ]);

      if (directFileInput) {
        await directFileInput.setInputFiles(uploadPath);
      } else {
        // Step 1: Click the "+" upload menu trigger
        const uploadMenuBtn = await findFirstVisible(page, [
          "button[aria-label*='Open upload file menu']",
          "button[aria-label*='upload file']",
          "button[aria-label*='Add files']",
          "button[aria-label*='Upload']"
        ]);
        if (!uploadMenuBtn) {
          throw new Error("Upload menu button not found — cannot attach source image");
        }
        await uploadMenuBtn.click();
        await page.waitForTimeout(500); // Wait for menu animation

        // Step 2: Click "Upload files" in the dropdown menu
        const uploadFilesOption = await waitForAnySelector(page, [
          "button[aria-label*='Upload files']",
          "button:has-text('Upload files')",
          "button:has-text('Upload file')",
          "[role='menuitem']:has-text('Upload')"
        ], 5000);

        if (uploadFilesOption) {
          // This click triggers a hidden file input
          const chooserPromise = page.waitForEvent("filechooser", { timeout: 15000 });
          await uploadFilesOption.click();
          const chooser = await chooserPromise;
          await chooser.setFiles(uploadPath);
        } else {
          // Fallback: the menu click itself may trigger file chooser
          const fallbackFileInput = await waitForAnySelector(page, [
            "input[type='file']"
          ], 3000);
          if (fallbackFileInput) {
            await fallbackFileInput.setInputFiles(uploadPath);
          } else {
            throw new Error("Upload files option not found in menu");
          }
        }
      }

      // Focus and fill prompt
      await promptBox.click();
      await promptBox.fill(this.config.prompt);

      // Submit prompt
      const submitButton = await findFirstVisible(page, [
        "button[aria-label='Send message']", // Confirmed from live UI
        "button[aria-label*='Send']",
        "button.send-button",
        "button[aria-label*='send']",
        "button[aria-label*='gửi']"
      ]);
      if (!submitButton) {
        throw new Error("Submit button not found");
      }
      // Snapshot image count BEFORE submit to detect new generation
      const IMAGE_SELECTOR = ".response-container img, [data-test-id] img, .message-content img, canvas + img, img[src*='googleusercontent']";
      const beforeCount = await page.locator(IMAGE_SELECTOR).count();

      await submitButton.click();

      // Wait until a NEW image appears (count increases), up to 60s
      // Note: callback runs in browser context where `document` exists
      await page.waitForFunction(
        (args: { selector: string; prevCount: number }) => {
          // Access document via bracket notation — this runs in browser context
          const doc = (globalThis as Record<string, unknown>)["document"] as { querySelectorAll(s: string): ArrayLike<unknown> };
          return doc.querySelectorAll(args.selector).length > args.prevCount;
        },
        { selector: IMAGE_SELECTOR, prevCount: beforeCount },
        { timeout: 60000 }
      );

      const imageLocator = page.locator(IMAGE_SELECTOR).last();
      await imageLocator.waitFor({ state: "visible", timeout: 10000 });

      const src = await imageLocator.getAttribute("src");
      if (!src) {
        throw new Error("Generated output image src not found");
      }

      let base64 = "";
      let mimeType: "image/png" | "image/jpeg" | "image/webp" = "image/jpeg";

      if (src.startsWith("data:image/")) {
        const [header, b64] = src.split(",");
        base64 = b64 ?? "";
        mimeType = header.includes("image/jpeg") ? "image/jpeg" : header.includes("image/webp") ? "image/webp" : "image/png";
      } else {
        // Fix #2: Use Playwright's Node-level request API to bypass CORS
        // (page.evaluate + fetch was blocked by CORS and FileReader caused TS2304)
        const response = await page.context().request.get(src);
        const buffer = await response.body();
        base64 = buffer.toString("base64");
      }

      return { imageBase64: base64, mimeType };
    } catch (error) {
      if (this.config.debugDir) {
        fs.mkdirSync(this.config.debugDir, { recursive: true });
        const stamp = Date.now();
        await page.screenshot({ path: path.join(this.config.debugDir, `browser-fail-${stamp}.png`), fullPage: true });
        fs.writeFileSync(path.join(this.config.debugDir, `browser-fail-${stamp}.html`), await page.content(), "utf8");
      }
      throw error;
    } finally {
      fs.rmSync(uploadPath, { force: true });
    }

  }

  async close(): Promise<void> {
    if (!this.contextPromise) {
      return;
    }

    const context = await this.contextPromise;
    await context.close();
    this.contextPromise = null;
  }

  private async getContext(): Promise<BrowserContext> {
    if (!this.contextPromise) {
      this.contextPromise = createPersistentBrowserSession({
        profileDir: this.config.profileDir,
        headless: this.config.headless,
        executablePath: this.config.executablePath,
        chromeChannel: this.config.chromeChannel
      });
    }

    return this.contextPromise;
  }
}
