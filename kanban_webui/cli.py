"""Foreground entry point for both installed and clone-based deployments."""
from __future__ import annotations

import argparse

import uvicorn

from .config import get_settings


def main() -> None:
    settings = get_settings()
    parser = argparse.ArgumentParser(description="Hermes KanbanWebUI")
    parser.add_argument("--host", default=settings.host)
    parser.add_argument("--port", type=int, default=settings.port)
    parser.add_argument("--reload", action="store_true")
    args = parser.parse_args()
    uvicorn.run("kanban_webui.app:app", host=args.host, port=args.port, reload=args.reload)
