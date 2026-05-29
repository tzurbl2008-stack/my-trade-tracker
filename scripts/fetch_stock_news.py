#!/usr/bin/env python3
"""Fetch Yahoo Finance RSS news for watchlist stocks and send via WhatsApp (Green API)."""

import json
import os
import sys
import time
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime

STOCKS = ["RGTI", "NOW", "LUNR", "OPEN", "IREN"]
MAX_HEADLINES = 3
CHAT_ID = "972559897728@c.us"   # Israeli number: 05... → 9725... + @c.us
MSG_LIMIT = 3500


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


def send_whatsapp(text: str, instance_id: str, token: str) -> None:
    url = f"https://api.green-api.com/waInstance{instance_id}/sendMessage/{token}"
    payload = json.dumps({"chatId": CHAT_ID, "message": text}).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = resp.read().decode(errors="replace")
    print(result[:120], file=sys.stderr)


def build_messages(today: str) -> list[str]:
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

    full = header + "\n\n" + "\n\n".join(blocks)
    if len(full) <= MSG_LIMIT:
        return [full]

    # Split: header first, then one block per stock
    return [header] + blocks


if __name__ == "__main__":
    instance_id = os.environ.get("GREENAPI_INSTANCE_ID", "")
    token = os.environ.get("GREENAPI_TOKEN", "")
    if not instance_id or not token:
        print("ERROR: GREENAPI_INSTANCE_ID or GREENAPI_TOKEN is not set", file=sys.stderr)
        sys.exit(1)

    today = datetime.utcnow().strftime("%d/%m/%Y")
    messages = build_messages(today)

    for i, msg in enumerate(messages):
        if i > 0:
            time.sleep(2)
        send_whatsapp(msg, instance_id, token)
        print(f"Sent message {i + 1}/{len(messages)}", file=sys.stderr)
