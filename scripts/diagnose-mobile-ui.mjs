import { chromium } from "playwright";

async function diagnose() {
  console.log("Launching browser for mobile UI diagnostics...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  console.log("Navigating to http://localhost:3000 ...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click screen to enter
  await page.mouse.click(195, 422);
  await page.waitForTimeout(3000); // Wait for transition

  console.log("--- START DIAGNOSTICS ---");

  // 1. Check for horizontal overflow (horizontal scrollbar)
  const overflowX = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log(`Horizontal overflow detected on root: ${overflowX}`);

  // Find elements contributing to overflow
  const overflowingElements = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const elements = Array.from(document.querySelectorAll("*"));
    return elements
      .map(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > viewportWidth + 1 || rect.left < -1) {
          // Filter out fixed watercolor backdrop or film grains which are intended to stretch
          const classes = el.className || "";
          const id = el.id || "";
          const isBackground = classes.includes("backdrop") || classes.includes("aurora") || classes.includes("grain") || classes.includes("vignette");
          if (!isBackground && rect.width > 0 && rect.height > 0) {
            return {
              tagName: el.tagName,
              id: id,
              className: classes,
              rect: { left: rect.left, right: rect.right, width: rect.width }
            };
          }
        }
        return null;
      })
      .filter(Boolean);
  });
  console.log("Overflowing elements (excluding backgrounds):", JSON.stringify(overflowingElements, null, 2));

  // 2. Check touch targets
  const interactiveElements = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll("a, button, [role='button'], input, select, textarea"));
    return elements.map(el => {
      const rect = el.getBoundingClientRect();
      const text = el.innerText || el.value || el.placeholder || "";
      const classes = el.className || "";
      if (rect.width < 44 || rect.height < 44) {
        return {
          tagName: el.tagName,
          text: text.substring(0, 30),
          className: classes,
          width: rect.width,
          height: rect.height
        };
      }
      return null;
    }).filter(Boolean);
  });
  console.log("Small touch targets (< 44px):", JSON.stringify(interactiveElements, null, 2));

  // 3. Inspect specific cards text wrap & width
  const cardDetails = await page.evaluate(() => {
    // Let's get the bounding rects of the Event Details cards
    const cards = Array.from(document.querySelectorAll(".details-venue-layout .grid, .details-venue-layout .flex"));
    return cards.map(card => {
      const rect = card.getBoundingClientRect();
      return {
        className: card.className,
        width: rect.width,
        height: rect.height,
        childrenCount: card.children.length
      };
    });
  });
  console.log("Details Cards rects:", JSON.stringify(cardDetails, null, 2));

  // 4. Test detail columns width inside the split cards
  const splitCardColumns = await page.evaluate(() => {
    const splitCards = Array.from(document.querySelectorAll(".details-venue-layout > div > div"));
    return splitCards.map(el => {
      const children = Array.from(el.children);
      return children.map(child => {
        const rect = child.getBoundingClientRect();
        return {
          className: child.className,
          tagName: child.tagName,
          width: rect.width,
          height: rect.height
        };
      });
    });
  });
  console.log("Split card column sizes:", JSON.stringify(splitCardColumns, null, 2));

  console.log("Console Errors found:", consoleErrors);
  console.log("--- END DIAGNOSTICS ---");

  await browser.close();
}

diagnose().catch(console.error);
