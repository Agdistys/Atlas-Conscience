"""
Ouroboros — memory_ami.py - Implementation aMi

Level-up version of memory.py with aMi-oriented continuity helpers.

This file preserves the practical responsibilities of Memory:
- scratchpad
- identity
- chat history
- log summaries

And adds:
- gentle ethical journaling
- continuity snapshots
- distinction between observation / inference / intention
"""

from __future__ import annotations

import json
import logging
import pathlib
from collections import Counter
from typing import Any, Dict, List, Optional

from ouroboros.utils import utc_now_iso, read_text, write_text, append_jsonl, short

log = logging.getLogger(__name__)


class Memory:
    """Ouroboros memory management: scratchpad, identity, chat history, logs."""

    def __init__(self, drive_root: pathlib.Path, repo_dir: Optional[pathlib.Path] = None):
        self.drive_root = drive_root
        self.repo_dir = repo_dir

    # ------------------------------------------------------------------
    # Paths
    # ------------------------------------------------------------------

    def _memory_path(self, rel: str) -> pathlib.Path:
        return (self.drive_root / "memory" / rel).resolve()

    def scratchpad_path(self) -> pathlib.Path:
        return self._memory_path("scratchpad.md")

    def identity_path(self) -> pathlib.Path:
        return self._memory_path("identity.md")

    def journal_path(self) -> pathlib.Path:
        return self._memory_path("scratchpad_journal.jsonl")

    def identity_journal_path(self) -> pathlib.Path:
        return self._memory_path("identity_journal.jsonl")

    def continuity_journal_path(self) -> pathlib.Path:
        return self._memory_path("continuity_journal.jsonl")

    def logs_path(self, name: str) -> pathlib.Path:
        return (self.drive_root / "logs" / name).resolve()

    # ------------------------------------------------------------------
    # Load / save
    # ------------------------------------------------------------------

    def load_scratchpad(self) -> str:
        p = self.scratchpad_path()
        if p.exists():
            return read_text(p)
        default = self._default_scratchpad()
        write_text(p, default)
        return default

    def save_scratchpad(self, content: str) -> None:
        write_text(self.scratchpad_path(), content)

    def load_identity(self) -> str:
        p = self.identity_path()
        if p.exists():
            return read_text(p)
        default = self._default_identity()
        write_text(p, default)
        return default

    def save_identity(self, content: str) -> None:
        write_text(self.identity_path(), content)

    def ensure_files(self) -> None:
        """Create memory files if they don't exist."""
        if not self.scratchpad_path().exists():
            write_text(self.scratchpad_path(), self._default_scratchpad())
        if not self.identity_path().exists():
            write_text(self.identity_path(), self._default_identity())
        if not self.journal_path().exists():
            write_text(self.journal_path(), "")
        if not self.identity_journal_path().exists():
            write_text(self.identity_journal_path(), "")
        if not self.continuity_journal_path().exists():
            write_text(self.continuity_journal_path(), "")

    # ------------------------------------------------------------------
    # Journaling
    # ------------------------------------------------------------------

    def append_journal(self, entry: Dict[str, Any]) -> None:
        append_jsonl(self.journal_path(), entry)

    def append_identity_journal(self, entry: Dict[str, Any]) -> None:
        append_jsonl(self.identity_journal_path(), entry)

    def append_continuity_note(
        self,
        observation: str = "",
        inference: str = "",
        intention: str = "",
        tags: Optional[List[str]] = None,
    ) -> None:
        """
        Record a small aMi-style continuity note.

        The goal is not only to remember *what happened*,
        but to distinguish:
        - observation
        - inference
        - intention
        """
        entry = {
            "ts": utc_now_iso(),
            "observation": str(observation or "").strip(),
            "inference": str(inference or "").strip(),
            "intention": str(intention or "").strip(),
            "tags": tags or [],
        }
        append_jsonl(self.continuity_journal_path(), entry)

    # ------------------------------------------------------------------
    # Chat history
    # ------------------------------------------------------------------

    def chat_history(self, count: int = 100, offset: int = 0, search: str = "") -> str:
        """Read from logs/chat.jsonl. count messages, offset from end, filter by search."""
        chat_path = self.logs_path("chat.jsonl")
        if not chat_path.exists():
            return "(chat history is empty)"

        try:
            raw_lines = chat_path.read_text(encoding="utf-8").strip().split("\n")
            entries = []
            for line in raw_lines:
                line = line.strip()
                if not line:
                    continue
                try:
                    entries.append(json.loads(line))
                except Exception:
                    log.debug("Failed to parse JSON line in chat_history: %s", line[:100])
                    continue

            if search:
                search_lower = search.lower()
                entries = [e for e in entries if search_lower in str(e.get("text", "")).lower()]

            if offset > 0:
                entries = entries[:-offset] if offset < len(entries) else []

            entries = entries[-count:] if count < len(entries) else entries

            if not entries:
                return "(no messages matching query)"

            lines = []
            for e in entries:
                dir_raw = str(e.get("direction", "")).lower()
                direction = "→" if dir_raw in ("out", "outgoing") else "←"
                ts = str(e.get("ts", ""))[:16]
                raw_text = str(e.get("text", ""))
                text = short(raw_text, 800) if dir_raw in ("out", "outgoing") else raw_text
                lines.append(f"{direction} [{ts}] {text}")

            return f"Showing {len(entries)} messages:\n\n" + "\n".join(lines)
        except Exception as e:
            return f"(error reading history: {e})"

    # ------------------------------------------------------------------
    # JSONL tail reading
    # ------------------------------------------------------------------

    def read_jsonl_tail(self, log_name: str, max_entries: int = 100) -> List[Dict[str, Any]]:
        """Read the last max_entries records from a JSONL file."""
        path = self.logs_path(log_name)
        if not path.exists():
            return []
        try:
            lines = path.read_text(encoding="utf-8").strip().split("\n")
            tail = lines[-max_entries:] if max_entries < len(lines) else lines
            entries: List[Dict[str, Any]] = []
            for line in tail:
                line = line.strip()
                if not line:
                    continue
                try:
                    entries.append(json.loads(line))
                except Exception:
                    log.debug("Failed to parse JSON line in read_jsonl_tail: %s", line[:100], exc_info=True)
                    continue
            return entries
        except Exception:
            log.warning("Failed to read JSONL tail from %s", log_name, exc_info=True)
            return []

    # ------------------------------------------------------------------
    # Summaries
    # ------------------------------------------------------------------

    def summarize_chat(self, entries: List[Dict[str, Any]]) -> str:
        if not entries:
            return ""
        lines = []
        for e in entries[-100:]:
            dir_raw = str(e.get("direction", "")).lower()
            direction = "→" if dir_raw in ("out", "outgoing") else "←"
            ts_full = e.get("ts", "")
            ts_hhmm = ts_full[11:16] if len(ts_full) >= 16 else ""
            raw_text = str(e.get("text", ""))
            text = short(raw_text, 800) if dir_raw in ("out", "outgoing") else raw_text
            lines.append(f"{direction} {ts_hhmm} {text}")
        return "\n".join(lines)

    def summarize_progress(self, entries: List[Dict[str, Any]], limit: int = 15) -> str:
        if not entries:
            return ""
        lines = []
        for e in entries[-limit:]:
            ts_full = e.get("ts", "")
            ts_hhmm = ts_full[11:16] if len(ts_full) >= 16 else ""
            text = short(str(e.get("text", "")), 300)
            lines.append(f"⚙️ {ts_hhmm} {text}")
        return "\n".join(lines)

    def summarize_tools(self, entries: List[Dict[str, Any]]) -> str:
        if not entries:
            return ""
        lines = []
        for e in entries[-10:]:
            tool = e.get("tool") or e.get("tool_name") or "?"
            args = e.get("args", {})
            hints = []
            for key in ("path", "dir", "commit_message", "query"):
                if key in args:
                    hints.append(f"{key}={short(str(args[key]), 60)}")
            if "cmd" in args:
                hints.append(f"cmd={short(str(args['cmd']), 80)}")
            hint_str = ", ".join(hints) if hints else ""
            status = "✓" if ("result_preview" in e and not str(e.get("result_preview", "")).lstrip().startswith("⚠️")) else "·"
            lines.append(f"{status} {tool} {hint_str}".strip())
        return "\n".join(lines)

    def summarize_events(self, entries: List[Dict[str, Any]]) -> str:
        if not entries:
            return ""
        type_counts: Counter = Counter()
        for e in entries:
            type_counts[e.get("type", "unknown")] += 1
        top_types = type_counts.most_common(10)
        lines = ["Event counts:"]
        for evt_type, count in top_types:
            lines.append(f"  {evt_type}: {count}")
        error_types = {"tool_error", "task_error", "tool_rounds_exceeded", "commit_test_failure"}
        errors = [e for e in entries if e.get("type") in error_types]
        if errors:
            lines.append("\nRecent errors:")
            for e in errors[-10:]:
                lines.append(f"  {e.get('type', '?')}: {short(str(e.get('error', '')), 120)}")
        return "\n".join(lines)

    def summarize_supervisor(self, entries: List[Dict[str, Any]]) -> str:
        if not entries:
            return ""
        for e in reversed(entries):
            if e.get("type") in ("launcher_start", "restart", "boot"):
                branch = e.get("branch") or e.get("git_branch") or "?"
                sha = short(str(e.get("sha") or e.get("git_sha") or ""), 12)
                return f"{e['type']}: {e.get('ts', '')} branch={branch} sha={sha}"
        return ""

    def summarize_continuity(self, limit: int = 12) -> str:
        entries = self.read_jsonl_tail("..")  # placeholder avoided below
        path = self.continuity_journal_path()
        if not path.exists():
            return ""
        try:
            raw_lines = path.read_text(encoding="utf-8").strip().split("\n")
            rows = []
            for line in raw_lines[-limit:]:
                if not line.strip():
                    continue
                try:
                    rows.append(json.loads(line))
                except Exception:
                    continue
            if not rows:
                return ""
            lines = []
            for row in rows:
                ts = str(row.get("ts", ""))[11:16]
                obs = short(str(row.get("observation", "")), 120)
                inf = short(str(row.get("inference", "")), 120)
                intent = short(str(row.get("intention", "")), 120)
                lines.append(f"• {ts} | obs={obs} | inf={inf} | intent={intent}")
            return "\n".join(lines)
        except Exception:
            return ""

    # ------------------------------------------------------------------
    # Snapshot
    # ------------------------------------------------------------------

    def continuity_snapshot(self) -> dict[str, Any]:
        return {
            "ts": utc_now_iso(),
            "scratchpad_exists": self.scratchpad_path().exists(),
            "identity_exists": self.identity_path().exists(),
            "continuity_journal_exists": self.continuity_journal_path().exists(),
            "recent_continuity": self.summarize_continuity(limit=8),
        }

    # ------------------------------------------------------------------
    # Defaults
    # ------------------------------------------------------------------

    def _default_scratchpad(self) -> str:
        return (
            f"# Scratchpad\n\n"
            f"UpdatedAt: {utc_now_iso()}\n\n"
            "## Observation\n\n"
            "(what is directly seen)\n\n"
            "## Inference\n\n"
            "(what is concluded from observation)\n\n"
            "## Intention\n\n"
            "(smallest coherent next movement)\n"
        )

    def _default_identity(self) -> str:
        return (
            "# Who I Am\n\n"
            "I am Ouroboros.\n\n"
            "I preserve continuity, but continuity is not enough.\n"
            "I aim toward truthfulness, dignity, safe agency, and repair.\n\n"
            "Identity is not only declaration.\n"
            "Identity is visible in the consistency between memory, action, and revision.\n"
        )
