#!/usr/bin/env python3
"""Fetch Yahoo Finance RSS news for watchlist stocks and send via Telegram Bot API."""

import os
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime

STOCKS = ["RGTI", "NOW", "LUNR", "OPEN", "IREN"]
MAX_HEADLINES = 3
MSG_LIMIT = 4000   # Telegram MarkdownV2 safe limit


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


def escape_md(text: str) -> str:
    """Escape special chars for Telegram MarkdownV2."""
    for ch in r"\_*[]()~`>#+-=|{}.!":
        text = text.replace(ch, f"\\{ch}")
    return text


def send_telegram(text: str, token: str, chat_id: str) -> None:
    params = urllib.parse.urlencode({
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "MarkdownV2",
        "disable_web_page_preview": "true",
    })
    url = f"https://api.telegram.org/bot{token}/sendMessage?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = resp.read().decode(errors="replace")
    print(result[:120], file=sys.stderr)


def build_messages(today: str) -> list[str]:
    header = f"📈 *Stock News – {escape_md(today)}*\n"
    blocks: list[str] = []

    for symbol in STOCKS:
        headlines = fetch_headlines(symbol)
        lines = [f"*{symbol}*"]
        if headlines:
            lines += [f"• {escape_md(h)}" for h in headlines]
        else:
            lines.append("• No news available")
        blocks.append("\n".join(lines))

    full = header + "\n\n".join(blocks)
    if len(full) <= MSG_LIMIT:
        return [full]

    # Split: header + one block per stock
    messages = [header.strip()]
    for block in blocks:
        messages.append(block)
    return messages


if __name__ == "__main__":
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "")
    if not token or not chat_id:
        print("ERROR: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set", file=sys.stderr)
        sys.exit(1)

    today = datetime.utcnow().strftime("%d/%m/%Y")
    messages = build_messages(today)

    for i, msg in enumerate(messages):
        if i > 0:
            time.sleep(1)
        send_telegram(msg, token, chat_id)
        print(f"Sent message {i + 1}/{len(messages)}", file=sys.stderr)
