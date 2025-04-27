// Interface for crawled page data
interface CrawledPage {
  url: string
  title: string
  content: string
}

// Simple function to extract title from HTML
function extractTitle(html: string, url: string): string {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i)
  return titleMatch ? titleMatch[1] : url
}

// Simple function to extract content from HTML
function extractContent(html: string): string {
  // Remove scripts, styles, and HTML tags
  const content = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return content
}

// Function to crawl a website and extract content
export async function crawlWebsite(url: string, maxPages = 5): Promise<CrawledPage[]> {
  try {
    // Validate URL
    const baseUrl = new URL(url)

    // Set to track visited URLs
    const visited = new Set<string>()

    // Queue of URLs to visit
    const queue: string[] = [baseUrl.href]

    // Array to store crawled pages
    const crawledPages: CrawledPage[] = []

    // Process queue until empty or max pages reached
    while (queue.length > 0 && crawledPages.length < maxPages) {
      const currentUrl = queue.shift()!

      // Skip if already visited
      if (visited.has(currentUrl)) {
        continue
      }

      // Mark as visited
      visited.add(currentUrl)

      try {
        // Fetch page content
        const response = await fetch(currentUrl)
        const html = await response.text()

        // Extract title and content
        const title = extractTitle(html, currentUrl)
        const content = extractContent(html)

        // Add to crawled pages
        crawledPages.push({
          url: currentUrl,
          title,
          content,
        })

        // Extract links for further crawling
        const linkMatches = html.match(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>/g)

        if (linkMatches) {
          for (const linkMatch of linkMatches) {
            const hrefMatch = linkMatch.match(/href="([^"]*)"/)
            if (hrefMatch) {
              try {
                const href = hrefMatch[1]

                // Skip anchors, javascript, mailto links
                if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) {
                  continue
                }

                // Resolve relative URLs
                const resolvedUrl = new URL(href, currentUrl)

                // Only follow links to the same domain
                if (
                  resolvedUrl.hostname === baseUrl.hostname &&
                  !visited.has(resolvedUrl.href) &&
                  !queue.includes(resolvedUrl.href)
                ) {
                  queue.push(resolvedUrl.href)
                }
              } catch (error) {
                // Skip invalid URLs
                continue
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error crawling ${currentUrl}:`, error)
        // Continue with next URL
        continue
      }
    }

    return crawledPages
  } catch (error) {
    console.error("Error crawling website:", error)
    throw error
  }
}
