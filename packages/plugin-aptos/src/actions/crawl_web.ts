import puppeteer from "puppeteer";
import { URL } from "url";

export async function getPageContent(targetUrl: string): Promise<string> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(targetUrl, { waitUntil: "networkidle2" });

  // Lấy domain từ URL để xác định hành vi crawl
  const domain = new URL(targetUrl).hostname;

  // Kiểm tra domain
  let content;
  if (
    domain.includes("aptos.dev") ||
    domain.includes("move-developers-dao.gitbook.io")
  ) {
    // Lấy nội dung chỉ trong <main>
    content = await page.evaluate(() => {
      const mainElement = document.querySelector("main");
      return mainElement ? mainElement.innerText : "";
    });
  } else {
    // Mặc định lấy toàn bộ nội dung từ <body>
    content = await page.evaluate(() => document.body.innerText);
  }

  console.log(`--- Content from ${targetUrl} ---`);
  console.log(content);

  await browser.close();
  
  return content;
}

