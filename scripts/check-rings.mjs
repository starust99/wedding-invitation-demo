import { chromium } from "playwright";
import path from "path";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport size
  await page.setViewportSize({ width: 1280, height: 800 });
  
  console.log("Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  
  console.log("Clicking the screen to bypass intro...");
  // Click the center of the viewport
  await page.mouse.click(640, 400);
  
  console.log("Waiting 7 seconds for animation to complete...");
  await page.waitForTimeout(7000);
  
  console.log("Scrolling to the wedding rings video...");
  const videoLocator = page.locator("video.rings-video-optimize");
  if (await videoLocator.count() > 0) {
    await videoLocator.scrollIntoViewIfNeeded();
    console.log("Video element found. Waiting 2 seconds for playback...");
    await page.waitForTimeout(2000);
    
    // Take screenshot of the names and video area
    console.log("Capturing names block screenshot...");
    await page.screenshot({ 
      path: "/Users/augustinonathan/.gemini/antigravity/brain/136cc833-8c76-4215-83d4-6933f033102d/scratch/step3_rings_verified.png" 
    });
  } else {
    console.error("Video element not found!");
  }
  
  await browser.close();
  console.log("Done!");
}

main().catch(console.error);
