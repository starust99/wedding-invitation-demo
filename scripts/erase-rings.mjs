import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function main() {
  const inputPath = path.resolve("public/assets/event-details-names-v4.png");
  const outputPath = path.resolve("public/assets/event-details-names-v4-blank.png");

  if (!fs.existsSync(inputPath)) {
    console.error("Input file not found:", inputPath);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(inputPath);
  const base64Image = imageBuffer.toString("base64");
  const dataUrl = `data:image/png;base64,${base64Image}`;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Load the image and process it via HTML Canvas
  const resultDataUrl = await page.evaluate(async (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get 2d context"));
          return;
        }
        ctx.drawImage(img, 0, 0);

        // Erase the middle region where the ring icon is
        // Total height is 594px. Let's clear from y = 200 to y = 394 (194px tall area)
        ctx.clearRect(0, 195, img.width, 195);

        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Image failed to load"));
      img.src = src;
    });
  }, dataUrl);

  await browser.close();

  // Extract base64 data and save
  const matches = resultDataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!matches) {
    console.error("Invalid output data URL");
    process.exit(1);
  }

  const outputBuffer = Buffer.from(matches[1], "base64");
  fs.writeFileSync(outputPath, outputBuffer);
  console.log("Successfully erased rings. Output written to:", outputPath);
}

main().catch((err) => {
  console.error("Error running script:", err);
  process.exit(1);
});
