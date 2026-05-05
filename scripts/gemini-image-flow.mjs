import { chromium } from "playwright";
import fs from "node:fs/promises";

const DEBUG_URL = "http://127.0.0.1:9222";
const PROMPT = "Create a cinematic portrait of a yoga pose at golden hour, ultra-detailed, 4k";
const OUT = "./gemini-output.png";

(async () => {
  const browser = await chromium.connectOverCDP(DEBUG_URL);
  const context = browser.contexts()[0] ?? await browser.newContext();
  const page = context.pages()[0] ?? await context.newPage();

  await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded" });

  const promptHandled = await page.evaluate((prompt) => {
    const selectors = [
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'textarea[aria-label*="prompt" i]',
      'textarea',
    ];
    const inputEl = selectors
      .map((s) => document.querySelector(s))
      .find(Boolean);
    if (!inputEl) return { ok: false, reason: "input-not-found" };

    inputEl.focus();
    if (inputEl instanceof HTMLTextAreaElement) {
      inputEl.value = prompt;
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      inputEl.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      inputEl.textContent = prompt;
      inputEl.dispatchEvent(new InputEvent("input", { bubbles: true, data: prompt, inputType: "insertText" }));
    }

    const sendBtn = Array.from(document.querySelectorAll("button")).find((b) => {
      const label = `${b.getAttribute("aria-label") || ""} ${b.textContent || ""}`.toLowerCase();
      return !b.disabled && (label.includes("send") || label.includes("gửi"));
    });
    if (!sendBtn) return { ok: false, reason: "send-not-found" };
    sendBtn.click();
    return { ok: true };
  }, PROMPT);

  if (!promptHandled.ok) {
    throw new Error(`Prompt submit failed: ${promptHandled.reason}`);
  }

  await page.waitForSelector("img", { timeout: 180000 });

  const imgSrc = await page.evaluate(() => {
    const urls = [...document.querySelectorAll("img")]
      .map((i) => i.src)
      .filter(Boolean);
    return (
      urls
        .reverse()
        .find(
          (u) =>
            u.startsWith("blob:") ||
            u.startsWith("data:image") ||
            u.includes("googleusercontent"),
        ) || null
    );
  });

  if (!imgSrc) throw new Error("Không tìm thấy ảnh output.");

  if (imgSrc.startsWith("data:image")) {
    const b64 = imgSrc.split(",")[1];
    await fs.writeFile(OUT, Buffer.from(b64, "base64"));
  } else if (imgSrc.startsWith("blob:")) {
    const bytes = await page.evaluate(async (u) => {
      const r = await fetch(u);
      const ab = await r.arrayBuffer();
      return Array.from(new Uint8Array(ab));
    }, imgSrc);
    await fs.writeFile(OUT, Buffer.from(bytes));
  } else {
    const resp = await page.request.get(imgSrc);
    await fs.writeFile(OUT, Buffer.from(await resp.body()));
  }

  console.log("Saved:", OUT);
  await browser.close();
})();
