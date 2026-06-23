import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

async function run() {
  const outputDir = "output/browser-shots";
  await mkdir(outputDir, { recursive: true });

  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
  });

  const page = await context.newPage();
  console.log("Navigating to http://localhost:3000 ...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 30000 });

  // Wait a bit for animations
  await page.waitForTimeout(3000);

  // Take splash screenshot
  await page.screenshot({ path: path.join(outputDir, "01_splash.png") });
  console.log("Saved 01_splash.png");

  // Check if there is an enter/gate button and click it
  // Let's print out text content of buttons to see what to click
  const buttons = await page.locator("button").allTextContents();
  console.log("Found buttons:", buttons);

  // Find a button that might be the "Open Invitation" or "Mở thiệp" button
  const enterButton = page.locator("button:has-text('Mở thiệp'), button:has-text('Open'), button:has-text('Xem'), button.animate-bounce");
  if (await enterButton.count() > 0) {
    console.log("Clicking enter button...");
    await enterButton.first().click();
    await page.waitForTimeout(3000); // Wait for transition animation
    await page.screenshot({ path: path.join(outputDir, "02_after_enter.png") });
    console.log("Saved 02_after_enter.png");
  } else {
    // Try clicking anywhere if there is a splash screen
    console.log("No specific enter button found, clicking screen center...");
    await page.mouse.click(195, 422);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outputDir, "02_after_enter.png") });
    console.log("Saved 02_after_enter.png");
  }

  // Scroll down section by section and take screenshots
  const scrollSteps = [
    { name: "03_hero_savethedate", scrollY: 844 },
    { name: "04_wedding_details", scrollY: 1700 },
    { name: "05_timeline", scrollY: 2600 },
    { name: "06_gallery", scrollY: 3800 },
    { name: "07_rsvp", scrollY: 5000 },
    { name: "08_thankyou", scrollY: 6200 }
  ];

  for (const step of scrollSteps) {
    console.log(`Scrolling to Y=${step.scrollY} for ${step.name}...`);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "smooth" }), step.scrollY);
    await page.waitForTimeout(2000); // Wait for animations to settle
    await page.screenshot({ path: path.join(outputDir, `${step.name}.png`) });
    console.log(`Saved ${step.name}.png`);
  }

  await browser.close();
  console.log("Browser closed successfully.");
}

run().catch(console.error);
