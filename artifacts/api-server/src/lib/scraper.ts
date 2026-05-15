import * as cheerio from "cheerio";
import type { Element } from "cheerio";

export interface ScrapedPage {
  title: string;
  content: string;
  url: string;
}

const BLOCKLIST = [
  "script", "style", "noscript", "nav", "footer", "header",
  "aside", "form", "button", "svg", "img", "figure", "iframe",
  "ads", "advertisement",
];

const MAX_CONTENT_CHARS = 40_000;

/**
 * Fetch a URL and extract clean readable text content from it.
 */
export async function scrapeUrl(rawUrl: string): Promise<ScrapedPage> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http and https URLs are supported");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let html: string;
  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SmartSupportBot/1.0; +https://smartsupport.ai)",
        Accept: "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const ct = response.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("application/xhtml")) {
      throw new Error(`Unsupported content type: ${ct}`);
    }

    html = await response.text();
  } finally {
    clearTimeout(timeout);
  }

  const $ = cheerio.load(html);

  // Remove noise elements
  BLOCKLIST.forEach((tag) => $(tag).remove());

  // Remove hidden elements
  $("[hidden], [aria-hidden='true'], .hidden, .sr-only").remove();

  // Extract title
  const title =
    $("title").first().text().trim() ||
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    url.hostname;

  // Prefer main content areas if present
  const contentSelectors = ["main", "article", "[role='main']", ".content", "#content", ".post", "body"];
  let contentEl = $("body");
  for (const sel of contentSelectors) {
    const found = $(sel).first();
    if (found.length > 0 && found.get(0)?.type === "tag") {
      contentEl = found as cheerio.Cheerio<Element>;
      break;
    }
  }

  // Extract and clean text
  let content = contentEl
    .find("*")
    .map((_i, el) => {
      const text = $(el).clone().children().remove().end().text().trim();
      return text;
    })
    .get()
    .filter((t) => t.length > 0)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!content) {
    content = $.root().text().replace(/\s{3,}/g, " ").trim();
  }

  if (content.length > MAX_CONTENT_CHARS) {
    content = content.slice(0, MAX_CONTENT_CHARS) + "\n\n[Content truncated]";
  }

  if (content.length < 50) {
    throw new Error("Could not extract meaningful content from this URL. The page may require JavaScript or login.");
  }

  return { title, content, url: url.toString() };
}
