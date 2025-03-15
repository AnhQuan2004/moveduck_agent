import puppeteer from "puppeteer";
import { URL } from "url";

export async function getPageContent(targetUrl: string): Promise<string> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(targetUrl, { waitUntil: "networkidle2" });

  // Get domain from URL to determine crawl behavior
  const domain = new URL(targetUrl).hostname;

  // Check domain
  let content;
  if (
    domain.includes("aptos.dev") ||
    domain.includes("move-developers-dao.gitbook.io")
  ) {
    // Get content only from <main> element
    content = await page.evaluate(() => {
      const mainElement = document.querySelector("main");
      return mainElement ? mainElement.innerText : "";
    });
  } else {
    // Default to getting all content from <body>
    content = await page.evaluate(() => document.body.innerText);
  }

  console.log(`--- Content from ${targetUrl} ---`);
  console.log(content);

  await browser.close();
  
  return content;
}
