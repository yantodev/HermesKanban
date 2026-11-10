"""Run KanbanWebUI with uvicorn.

Usage:
  python3 server.py --host 127.0.0.1 --port 8790
"""
from __future__ import annotations

from kanban_webui.cli import main


if __name__ == "__main__":
    main()
