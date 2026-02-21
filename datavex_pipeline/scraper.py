"""
DataVex Pipeline — Web Scraper
Real-time company intelligence via DuckDuckGo Lite HTML scraping.
Used by Agent 2 (signals) and Agent 4 (decision makers).

Uses lite.duckduckgo.com (simple HTML) — no API, no rate limits.
"""
import logging
import time
import random
import urllib.parse

logger = logging.getLogger("datavex_pipeline.scraper")

try:
    import requests
    from bs4 import BeautifulSoup
    HAS_DEPS = True
except ImportError:
    HAS_DEPS = False
    logger.warning("requests or bs4 not installed — scraping disabled")


USER_AGENTS = [
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
]


def web_search(query: str, max_results: int = 5) -> list[dict]:
    """
    Search via DuckDuckGo Lite (HTML scraping, no API).
    Returns list of {"title": str, "body": str, "href": str}
    """
    if not HAS_DEPS:
        return []

    encoded_query = urllib.parse.quote_plus(query)
    url = f"https://lite.duckduckgo.com/lite/?q={encoded_query}"

    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html",
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code != 200:
            logger.warning(f"  DDG Lite returned {resp.status_code}")
            return []

        soup = BeautifulSoup(resp.text, "html.parser")
        links = soup.select("a.result-link")
        snippets = soup.select("td.result-snippet")

        results = []
        for i, link in enumerate(links[:max_results]):
            href = link.get("href", "")
            # DDG lite wraps URLs in redirect — extract the real URL
            if "uddg=" in href:
                real_url = urllib.parse.unquote(href.split("uddg=")[1].split("&")[0])
            else:
                real_url = href

            title = link.get_text(strip=True)
            body = snippets[i].get_text(strip=True) if i < len(snippets) else ""

            # Skip DDG's own pages
            if "duckduckgo.com" in real_url:
                continue

            results.append({"title": title, "body": body, "href": real_url})

        logger.info(f"  🔍 '{query[:50]}...' → {len(results)} results")
        return results

    except Exception as e:
        logger.warning(f"  Search error: {e}")
        return []


def _fetch_page_text(url: str, timeout: int = 5) -> str:
    """Fetch a page and extract text for more context."""
    if not HAS_DEPS:
        return ""
    try:
        headers = {"User-Agent": random.choice(USER_AGENTS)}
        resp = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        if resp.status_code != 200:
            return ""

        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        paragraphs = soup.find_all("p")
        parts = [p.get_text(strip=True) for p in paragraphs[:6] if len(p.get_text(strip=True)) > 25]
        return " ".join(parts)[:500] if parts else ""
    except Exception:
        return ""


def scrape_company_signals(company_name: str, domain: str = "") -> dict:
    """
    Scrape real data about a company from the web.
    Returns dict with keys: careers, news, tech_stack, blog
    Each value is a list of {"text": str, "source": str, "recency_days": int}
    """
    logger.info(f"  🔍 Scraping real data for: {company_name}")
    signals = {"careers": [], "news": [], "tech_stack": [], "blog": []}

    # 1. Careers / hiring
    hiring_results = web_search(f"{company_name} hiring jobs careers engineering", max_results=4)
    time.sleep(2)
    for r in hiring_results:
        text = f"{r.get('title', '')} — {r.get('body', '')}" if r.get("body") else r.get("title", "")
        if len(text.strip()) > 20:
            signals["careers"].append({
                "text": text[:300],
                "source": "careers",
                "recency_days": 30,
            })

    # 2. Company news
    news_results = web_search(f"{company_name} funding news partnership launch 2025", max_results=4)
    time.sleep(2)
    for r in news_results:
        text = f"{r.get('title', '')} — {r.get('body', '')}" if r.get("body") else r.get("title", "")
        if len(text.strip()) > 20:
            signals["news"].append({
                "text": text[:300],
                "source": "news",
                "recency_days": 20,
            })

    # 3. Tech stack
    tech_results = web_search(f"{company_name} tech stack engineering infrastructure", max_results=4)
    time.sleep(2)
    for r in tech_results:
        text = f"{r.get('title', '')} — {r.get('body', '')}" if r.get("body") else r.get("title", "")
        if len(text.strip()) > 20:
            signals["tech_stack"].append({
                "text": text[:300],
                "source": "tech_stack",
                "recency_days": 30,
            })

    # 4. Company blog
    blog_results = web_search(f"{company_name} blog product update", max_results=3)
    for r in blog_results:
        text = f"{r.get('title', '')} — {r.get('body', '')}" if r.get("body") else r.get("title", "")
        if len(text.strip()) > 20:
            signals["blog"].append({
                "text": text[:300],
                "source": "blog",
                "recency_days": 30,
            })

    total = sum(len(v) for v in signals.values())
    logger.info(f"  📊 Scraped {total} data points for {company_name}")
    return signals


def search_decision_makers(company_name: str, target_role: str) -> list[dict]:
    """
    Search for real people at a company with a specific role.
    Returns list of {"name": str, "role": str, "source": str}
    """
    logger.info(f"  🔍 Searching for {target_role} at {company_name}")
    people = []

    queries = [
        f"{company_name} {target_role} LinkedIn",
        f"{company_name} CTO founder CEO leadership team",
    ]

    for query in queries:
        results = web_search(query, max_results=6)
        time.sleep(2)

        for r in results:
            title = r.get("title", "")
            body = r.get("body", "")
            href = r.get("href", "")
            combined = f"{title} {body}"

            if "linkedin.com" in href.lower() or "linkedin" in combined.lower():
                name = title.split(" - ")[0].split(" | ")[0].strip()
                # Clean up LinkedIn title artifacts
                for suffix in [" | LinkedIn", " - LinkedIn"]:
                    name = name.replace(suffix, "")
                name = name.strip()
                if name and len(name) > 2:
                    people.append({
                        "name": name,
                        "role": target_role,
                        "source": f"linkedin: {href}",
                        "raw_title": title,
                        "raw_body": body[:200],
                    })
            elif any(kw in combined.lower() for kw in ["cto", "ceo", "founder", "vp engineer", "head of", "chief", "co-founder"]):
                people.append({
                    "name": title.split(" - ")[0].split(" | ")[0].strip(),
                    "role": target_role,
                    "source": f"web: {href}",
                    "raw_title": title,
                    "raw_body": body[:200],
                })

        if people:
            break
        time.sleep(2)

    logger.info(f"  👥 Found {len(people)} potential contacts for {company_name}")
    return people
