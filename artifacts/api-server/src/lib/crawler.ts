import * as cheerio from "cheerio";
import { scrapeUrl, type ScrapedPage } from "./scraper";

export interface CrawlOptions {
  maxPages?: number;
  concurrency?: number;
}

export interface CrawlResult {
  pages: ScrapedPage[];
  skipped: number;
  errors: Array<{ url: string; reason: string }>;
}

const DEFAULT_MAX_PAGES = 20;
const DEFAULT_CONCURRENCY = 4;
const SKIP_EXTENSIONS = /\.(pdf|zip|png|jpg|jpeg|gif|svg|webp|mp4|mp3|css|js|xml|json|ico|woff|woff2|ttf|eot)(\?.*)?$/i;
const SKIP_PATHS = /\/(login|signin|sign-in|sign-up|signup|auth|oauth|logout|admin|wp-admin|wp-login|checkout|cart|account|profile|api\/)/i;

/**
 * Extract all same-domain links from an HTML page.
 */
function extractLinks(html: string, baseUrl: URL): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];

  $("a[href]").each((_i, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    try {
      const resolved = new URL(href, baseUrl.toString());
      // Only same origin
      if (resolved.origin !== baseUrl.origin) return;
      // Skip fragments-only
      if (resolved.pathname === baseUrl.pathname && resolved.hash) return;
      // Strip hash
      resolved.hash = "";
      const normalized = resolved.toString();
      if (SKIP_EXTENSIONS.test(resolved.pathname)) return;
      if (SKIP_PATHS.test(resolved.pathname)) return;
      links.push(normalized);
    } catch {
      // ignore invalid hrefs
    }
  });

  return [...new Set(links)];
}

async function fetchHtml(url: string): Promise<{ html: string; finalUrl: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SmartSupportBot/1.0; +https://smartsupport.ai)",
        Accept: "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("application/xhtml")) return null;
    const html = await res.text();
    return { html, finalUrl: res.url ?? url };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

/**
 * Crawl a website starting from the seed URL, discovering all linked pages on the same domain.
 */
export async function crawlSite(seedUrl: string, opts: CrawlOptions = {}): Promise<CrawlResult> {
  const maxPages = opts.maxPages ?? DEFAULT_MAX_PAGES;
  const concurrency = opts.concurrency ?? DEFAULT_CONCURRENCY;

  let origin: URL;
  try {
    origin = new URL(seedUrl);
  } catch {
    throw new Error(`Invalid URL: ${seedUrl}`);
  }

  if (!["http:", "https:"].includes(origin.protocol)) {
    throw new Error("Only http and https URLs are supported");
  }

  // Crawl the seed URL first to discover links
  const seedResult = await fetchHtml(origin.toString());
  if (!seedResult) {
    throw new Error("Could not fetch the seed URL. Check that the page is publicly accessible.");
  }

  const { html: seedHtml, finalUrl } = seedResult;
  const finalOrigin = new URL(finalUrl);

  // Collect discovered links
  const discovered = extractLinks(seedHtml, finalOrigin);

  // Always include seed URL
  const queue = [finalUrl, ...discovered.filter((u) => u !== finalUrl)];
  const toFetch = [...new Set(queue)].slice(0, maxPages);

  const errors: CrawlResult["errors"] = [];

  const tasks = toFetch.map((url) => async (): Promise<ScrapedPage | null> => {
    try {
      return await scrapeUrl(url);
    } catch (err) {
      errors.push({
        url,
        reason: err instanceof Error ? err.message : "Unknown error",
      });
      return null;
    }
  });

  const rawResults = await runWithConcurrency(tasks, concurrency);
  const pages = rawResults.filter((r): r is ScrapedPage => r !== null);
  const skipped = toFetch.length - pages.length;

  return { pages, skipped, errors };
}
