#!/usr/bin/env python3
"""Fetch Yahoo Finance RSS news for watchlist stocks and send via WhatsApp (CallMeBot)."""

import os
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime

STOCKS = ["RGTI", "NOW", "LUNR", "OPEN", "IREN"]
MAX_HEADLINES = 3          # headlines per stock
PHONE = "+972559897728"
CALLMEBOT_URL = "https://api.callmebot.com/whatsapp.php"
MSG_LIMIT = 1400           # safe char limit per CallMeBot message


def fetch_headlines(symbol: str) -> list[str]:
    url = (
        f"https://feeds.finance.yahoo.com/rss/2.0/headline"
        f"?s={symbol}&region=US&lang=en-US"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            root = ET.fromstring(resp.read())
        return [
            (item.findtext("title") or "").strip()
            for item in root.findall(".//item")[:MAX_HEADLINES]
        ]
    except Exception as exc:
        print(f"WARNING: could not fetch {symbol}: {exc}", file=sys.stderr)
        return []


def send_whatsapp(text: str, apikey: str) -> None:
    params = urllib.parse.urlencode({"phone": PHONE, "text": text, "apikey": apikey})
    req = urllib.request.Request(
        f"{CALLMEBOT_URL}?{params}",
        headers={"User-Agent": "Mozilla/5.0"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        status = resp.read().decode(errors="replace")
    print(status[:120], file=sys.stderr)


def build_messages(today: str) -> list[str]:
    """Build a list of WhatsApp messages, splitting if needed to stay under MSG_LIMIT."""
    header = f"📈 *Stock News – {today}*"
    blocks: list[str] = []

    for symbol in STOCKS:
        headlines = fetch_headlines(symbol)
        lines = [f"*{symbol}*"]
        if headlines:
            lines += [f"• {h}" for h in headlines]
        else:
            lines.append("• No news available")
        blocks.append("\n".join(lines))

    # Try to fit everything in one message
    full = header + "\n\n" + "\n\n".join(blocks)
    if len(full) <= MSG_LIMIT:
        return [full]

    # Otherwise: header first, then one message per stock
    messages = [header]
    for block in blocks:
        messages.append(block)
    return messages


if __name__ == "__main__":
    apikey = os.environ.get("CALLMEBOT_APIKEY", "")
    if not apikey:
        print("ERROR: CALLMEBOT_APIKEY env var is not set", file=sys.stderr)
        sys.exit(1)

    today = datetime.utcnow().strftime("%d/%m/%Y")
    messages = build_messages(today)

    for i, msg in enumerate(messages):
        if i > 0:
            time.sleep(3)   # avoid rate-limiting between messages
        send_whatsapp(msg, apikey)
        print(f"Sent message {i + 1}/{len(messages)}", file=sys.stderr)
