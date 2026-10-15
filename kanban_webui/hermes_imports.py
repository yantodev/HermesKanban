"""Hermes import helpers.

The service runs from this standalone repo but deliberately reuses the installed
Hermes Kanban DB module as the single source of truth.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path


def _hermes_site_packages(agent_root: Path) -> list[Path]:
    """Find dependency environments provisioned for a Hermes checkout.

    Hermes keeps its source checkout separate from the selected dependency
    environment. Adding the checkout to ``sys.path`` is therefore not enough
    when KanbanWebUI runs from its own virtualenv.
    """
    hermes_home = agent_root.parent
    facts_paths: list[Path] = []
    activated = os.environ.get("__HERMES_ACTIVATED")
    if activated:
        facts_paths.append(Path(activated).expanduser())
    facts_paths.extend(sorted((hermes_home / "installs").glob("*/facts.json"),
                              key=lambda path: path.stat().st_mtime_ns if path.exists() else 0,
                              reverse=True))

    seen_facts: set[Path] = set()
    sites: list[Path] = []
    version = f"python{sys.version_info.major}.{sys.version_info.minor}"
    for facts_path in facts_paths:
        try:
            facts_path = facts_path.resolve()
        except OSError:
            continue
        if facts_path in seen_facts or not facts_path.is_file():
            continue
        seen_facts.add(facts_path)
        try:
            facts = json.loads(facts_path.read_text(encoding="utf-8"))
            environment = Path(facts["packages"]["venv"]["environment"]).expanduser()
        except (OSError, KeyError, TypeError, ValueError):
            continue
        candidates = [
            environment / "lib" / version / "site-packages",
            environment / "Lib" / "site-packages",
        ]
        for site in candidates:
            if site.is_dir() and site not in sites:
                sites.append(site)
    return sites


def ensure_hermes_importable() -> None:
    """Put the local Hermes checkout on sys.path when it is not installed.

    A Hermes source checkout commonly lives at ~/.hermes/hermes-agent and may
    already be injected in Hermes sessions. The start script can run outside
    that environment, so path resolution is explicit and predictable.
    """
    candidates = []
    env_root = os.environ.get("HERMES_AGENT_ROOT")
    if env_root:
        candidates.append(Path(env_root).expanduser())

    hermes_home = os.environ.get("HERMES_HOME")
    if hermes_home:
        hh = Path(hermes_home).expanduser()
        candidates.extend([
            hh / "hermes-agent",
            hh.parent / "hermes-agent",
            hh.parent.parent / ".hermes" / "hermes-agent",
        ])

    user = os.environ.get("USER")
    if user:
        candidates.append(Path("/home") / user / ".hermes" / "hermes-agent")

    candidates.extend(
        [
            Path.home() / ".hermes" / "hermes-agent",
            Path.home() / ".local" / "share" / "hermes-agent",
        ]
    )
    for candidate in candidates:
        if (candidate / "hermes_cli" / "kanban_db.py").is_file():
            s = str(candidate)
            if s not in sys.path:
                sys.path.insert(0, s)
            for site in _hermes_site_packages(candidate):
                site_string = str(site)
                if site_string not in sys.path:
                    sys.path.append(site_string)
            return


ensure_hermes_importable()

try:  # noqa: E402 - path setup above is intentional
    from hermes_cli import kanban_db  # type: ignore
    # Hermes split several helpers into submodules without exposing all of
    # them from the historical ``kanban_db`` facade. KanbanWebUI uses that
    # stable facade, so restore the compatibility exports when needed.
    if not hasattr(kanban_db, "connect"):
        from hermes_cli.kanban_db_connect import connect as _connect  # type: ignore

        kanban_db.connect = _connect

    from hermes_cli import kanban_db_dispatch as _dispatch  # type: ignore
    for _name in ("dispatch_once", "heartbeat_worker"):
        if not hasattr(kanban_db, _name) and hasattr(_dispatch, _name):
            setattr(kanban_db, _name, getattr(_dispatch, _name))

    from hermes_cli import kanban_db_notify as _notify  # type: ignore
    for _name in ("add_notify_sub", "list_notify_subs", "remove_notify_sub"):
        if not hasattr(kanban_db, _name) and hasattr(_notify, _name):
            setattr(kanban_db, _name, getattr(_notify, _name))

    if not hasattr(kanban_db, "active_run"):
        def _active_run(conn, task_id):
            row = conn.execute(
                """
                SELECT r.*
                  FROM task_runs AS r
                  JOIN tasks AS t ON t.current_run_id = r.id
                 WHERE t.id = ? AND r.ended_at IS NULL
                 LIMIT 1
                """,
                (task_id,),
            ).fetchone()
            return kanban_db.Run.from_row(row) if row else None

        kanban_db.active_run = _active_run
except Exception as exc:  # pragma: no cover - depends on host install
    raise RuntimeError(
        "Could not import hermes_cli.kanban_db. Set HERMES_AGENT_ROOT to the "
        "Hermes Agent checkout that contains hermes_cli/kanban_db.py."
    ) from exc
