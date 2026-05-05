import { chromium, type BrowserContext } from "playwright";

export async function createPersistentBrowserSession(input: {
  profileDir: string;
  headless: boolean;
  executablePath?: string;
  chromeChannel?: string;
}): Promise<BrowserContext> {
  const options: Parameters<typeof chromium.launchPersistentContext>[1] = {
    headless: input.headless,
    viewport: { width: 1440, height: 900 }
  };

  if (input.executablePath) {
    options.executablePath = input.executablePath;
  }

  if (input.chromeChannel) {
    options.channel = input.chromeChannel as "chrome";
  }

  options.args = [
    "--disable-blink-features=AutomationControlled",
    "--disable-infobars",
    "--no-sandbox",
    "--disable-setuid-sandbox"
  ];

  return chromium.launchPersistentContext(input.profileDir, options);
}
