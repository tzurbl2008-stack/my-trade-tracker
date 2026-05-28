#!/usr/bin/env python3
"""Fetch Yahoo Finance RSS news for watchlist stocks and write HTML email to stdout."""

import html
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime

STOCKS = ["RGTI", "NOW", "LUNR", "OPEN", "IREN"]
MAX_ITEMS = 5

def fetch_feed(symbol: str) -> list[dict]:
    url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={symbol}&region=US&lang=en-US"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            root = ET.fromstring(resp.read())
    except Exception as e:
        print(f"<!-- ERROR fetching {symbol}: {e} -->", file=sys.stderr)
        return []

    ns = {"dc": "http://purl.org/dc/elements/1.1/"}
    items = []
    for item in root.findall(".//item")[:MAX_ITEMS]:
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "#").strip()
        pub = (item.findtext("pubDate") or "").strip()
        desc = (item.findtext("description") or "").strip()
        items.append({"title": title, "link": link, "pub": pub, "desc": desc})
    return items


def build_html() -> str:
    today = datetime.utcnow().strftime("%d/%m/%Y")

    sections = []
    for symbol in STOCKS:
        entries = fetch_feed(symbol)
        rows = ""
        if not entries:
            rows = "<p style='color:#888;margin:8px 0'>אין חדשות זמינות כרגע.</p>"
        else:
            for e in entries:
                title_safe = html.escape(e["title"])
                link = html.escape(e["link"])
                pub = html.escape(e["pub"])
                desc = html.escape(e["desc"])[:350]
                rows += f"""
        <div style="border-bottom:1px solid #eee;padding:10px 0;">
          <div style="font-weight:bold;">
            <a href="{link}" style="color:#1a56db;text-decoration:none;">{title_safe}</a>
          </div>
          <div style="font-size:0.82em;color:#888;margin-top:3px;">{pub}</div>
          <div style="font-size:0.93em;color:#444;margin-top:5px;">{desc}</div>
        </div>"""

        sections.append(f"""
    <div style="margin-bottom:28px;">
      <h2 style="margin:0 0 8px;padding:8px 14px;background:#1e3a5f;color:#fff;
                 border-radius:4px;font-size:1.1em;letter-spacing:1px;">{symbol}</h2>
      {rows}
    </div>""")

    body = "\n".join(sections)
    return f"""<!DOCTYPE html>
<html lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="font-family:Arial,sans-serif;max-width:760px;margin:0 auto;padding:24px;color:#222;">
  <h1 style="color:#1e3a5f;border-bottom:3px solid #e94560;padding-bottom:10px;margin-bottom:24px;">
    📈 Daily Stock News &mdash; {today}
  </h1>
  {body}
  <p style="font-size:0.8em;color:#aaa;margin-top:32px;border-top:1px solid #eee;padding-top:12px;">
    נשלח אוטומטית מ-my-trade-tracker &bull; Yahoo Finance RSS
  </p>
</body>
</html>"""


if __name__ == "__main__":
    print(build_html())
