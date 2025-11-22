import { app, BrowserWindow, ipcMain, shell } from "electron";
import * as path from "path";
import * as fs from "fs";
import * as https from "https";
import * as http from "http";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Project Dashboard Prototype",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the built React app
  win.loadFile(path.join(__dirname, "renderer/src/index.html"));
}

// IPC handlers for opening links and files
ipcMain.handle("open-external", async (_event, url: string) => {
  await shell.openExternal(url);
});

ipcMain.handle("open-path", async (_event, filePath: string) => {
  await shell.openPath(filePath);
});

ipcMain.handle(
  "create-markdown-file",
  async (_event, fileName: string, content: string) => {
    try {
      const appPath = app.getAppPath();
      const filePath = path.join(appPath, fileName);
      fs.writeFileSync(filePath, content, "utf-8");
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
);

// Helper function to fetch a URL with redirect support
function fetchUrlWithRedirect(
  url: string,
  resolve: (value: { success: boolean; title?: string | null }) => void,
  redirectDepth: number = 0
) {
  const MAX_REDIRECTS = 5;
  if (redirectDepth > MAX_REDIRECTS) {
    console.error(`[fetch-page-title] Too many redirects`);
    resolve({ success: false, title: null });
    return;
  }

  try {
    // Ensure URL has a protocol
    let fetchUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      fetchUrl = `https://${url}`;
    }

    if (redirectDepth === 0) {
      console.log(`[fetch-page-title] Fetching title for: ${fetchUrl}`);
    } else {
      console.log(
        `[fetch-page-title] Following redirect ${redirectDepth} to: ${fetchUrl}`
      );
    }

    const urlObj = new URL(fetchUrl);
    const client = urlObj.protocol === "https:" ? https : http;

    const options = {
      timeout: 5000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    };

    const req = client.get(fetchUrl, options, (res) => {
      // Handle redirects
      if (
        res.statusCode &&
        (res.statusCode === 301 ||
          res.statusCode === 302 ||
          res.statusCode === 307 ||
          res.statusCode === 308)
      ) {
        const location = res.headers.location;
        if (location) {
          req.destroy();
          const redirectUrl =
            location.startsWith("http://") || location.startsWith("https://")
              ? location
              : new URL(location, fetchUrl).toString();
          return fetchUrlWithRedirect(redirectUrl, resolve, redirectDepth + 1);
        }
      }

      let data = "";

      res.on("data", (chunk) => {
        data += chunk.toString();
        // Only read first 64KB to avoid memory issues
        if (data.length > 65536) {
          res.destroy();
          extractTitle(data, resolve);
        }
      });

      res.on("end", () => {
        console.log(`[fetch-page-title] Received ${data.length} bytes`);
        extractTitle(data, resolve);
      });
    });

    req.on("error", (error) => {
      console.error(`[fetch-page-title] Error fetching ${fetchUrl}:`, error);
      resolve({ success: false, title: null });
    });

    req.on("timeout", () => {
      console.error(`[fetch-page-title] Timeout fetching ${fetchUrl}`);
      req.destroy();
      resolve({ success: false, title: null });
    });

    req.setTimeout(5000);
  } catch (error) {
    console.error(`[fetch-page-title] Exception:`, error);
    resolve({ success: false, title: null });
  }
}

ipcMain.handle("fetch-page-title", async (_event, url: string) => {
  return new Promise((resolve) => {
    fetchUrlWithRedirect(
      url,
      (result) => {
        // If title extraction failed, try to generate a meaningful title from URL
        if (!result.success && url) {
          const urlTitle = generateTitleFromUrl(url);
          if (urlTitle) {
            console.log(
              `[fetch-page-title] Using URL-based title: ${urlTitle}`
            );
            resolve({ success: true, title: urlTitle });
            return;
          }
        }
        resolve(result);
      },
      0
    );
  });
});

function generateTitleFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase();

    // Google Docs
    if (hostname.includes("docs.google.com")) {
      const pathMatch = urlObj.pathname.match(/\/document\/d\/([^\/]+)/);
      if (pathMatch) {
        return "Google Doc";
      }
      if (urlObj.pathname.includes("/spreadsheets")) {
        return "Google Sheet";
      }
      if (urlObj.pathname.includes("/presentation")) {
        return "Google Slides";
      }
      return "Google Doc";
    }

    // Confluence
    if (hostname.includes("confluence")) {
      const pathMatch = urlObj.pathname.match(
        /\/pages\/viewpage\.action\?pageId=(\d+)/
      );
      if (pathMatch) {
        return "Confluence Page";
      }
      return "Confluence";
    }

    // GitHub
    if (hostname.includes("github.com")) {
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      if (pathParts.length >= 2) {
        return `${pathParts[0]}/${pathParts[1]}`;
      }
      return "GitHub";
    }

    // Generic fallback - use domain name
    const domain = hostname.replace(/^www\./, "");
    const domainParts = domain.split(".");
    if (domainParts.length >= 2) {
      const siteName = domainParts[domainParts.length - 2];
      return siteName.charAt(0).toUpperCase() + siteName.slice(1);
    }

    return null;
  } catch (error) {
    return null;
  }
}

function extractTitle(html: string, resolve: (value: any) => void) {
  try {
    let title: string | null = null;

    // Log first 500 chars of HTML for debugging
    console.log(`[extractTitle] HTML preview: ${html.substring(0, 500)}...`);

    // Try Open Graph title first (often more accurate for social media links)
    const ogTitleMatch = html.match(
      /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i
    );
    if (ogTitleMatch && ogTitleMatch[1]) {
      title = ogTitleMatch[1].trim();
      console.log(`[extractTitle] Found og:title: ${title}`);
    }

    // Try Twitter card title
    if (!title) {
      const twitterTitleMatch = html.match(
        /<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i
      );
      if (twitterTitleMatch && twitterTitleMatch[1]) {
        title = twitterTitleMatch[1].trim();
        console.log(`[extractTitle] Found twitter:title: ${title}`);
      }
    }

    // Try standard HTML title tag
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
        console.log(`[extractTitle] Found <title>: ${title}`);
      }
    }

    // Try Google Docs specific patterns
    if (!title) {
      // Look for document title in Google Docs HTML structure
      const googleDocsTitleMatch = html.match(
        /<meta\s+itemprop=["']name["']\s+content=["']([^"']+)["']/i
      );
      if (googleDocsTitleMatch && googleDocsTitleMatch[1]) {
        title = googleDocsTitleMatch[1].trim();
        console.log(`[extractTitle] Found Google Docs itemprop:name: ${title}`);
      }
    }

    // Try meta description as fallback (sometimes contains useful info)
    if (!title) {
      const metaDescMatch = html.match(
        /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
      );
      if (metaDescMatch && metaDescMatch[1]) {
        title = metaDescMatch[1].trim();
        console.log(`[extractTitle] Found meta description: ${title}`);
      }
    }

    // Try to find title in JSON-LD structured data (Google Docs sometimes uses this)
    if (!title) {
      const jsonLdMatch = html.match(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
      );
      if (jsonLdMatch && jsonLdMatch[1]) {
        try {
          const jsonLd = JSON.parse(jsonLdMatch[1]);
          if (jsonLd.name) {
            title = jsonLd.name;
            console.log(`[extractTitle] Found JSON-LD name: ${title}`);
          } else if (jsonLd.headline) {
            title = jsonLd.headline;
            console.log(`[extractTitle] Found JSON-LD headline: ${title}`);
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
    }

    // Clean up the title
    if (title) {
      title = title
        .replace(/\s+/g, " ")
        .replace(/[\r\n]/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .trim();

      // Remove common suffixes like " - Google Docs"
      title = title.replace(/\s*-\s*Google\s+Docs\s*$/i, "");
      title = title.replace(/\s*-\s*Google\s+Sheets\s*$/i, "");
      title = title.replace(/\s*-\s*Google\s+Slides\s*$/i, "");

      // Limit title length
      if (title.length > 200) {
        title = title.substring(0, 197) + "...";
      }

      console.log(`[extractTitle] Final title: ${title}`);
      resolve({ success: true, title });
    } else {
      console.log("[extractTitle] No title found in HTML");
      // Log a sample of the HTML to help debug
      const titleTagMatch = html.match(/<title[^>]*>.*?<\/title>/i);
      if (titleTagMatch) {
        console.log(
          `[extractTitle] Found title tag but empty: ${titleTagMatch[0]}`
        );
      }
      resolve({ success: false, title: null });
    }
  } catch (error) {
    console.error("[extractTitle] Error:", error);
    resolve({ success: false, title: null });
  }
}

app.whenReady().then(createWindow);
