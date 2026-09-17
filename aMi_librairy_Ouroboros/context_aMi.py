"""
Ouroboros — context_aMi.py - Implementation aMi @Agdistys

A small aMi-oriented context builder.

Purpose:
- assemble a usable language-model context
- keep observation / inference / intention distinct
- include identity, scratchpad, and world frame
- avoid bloated or vague prompt construction
"""

from __future__ import annotations

import pathlib
from dataclasses import dataclass

from ouroboros.utils import read_text, clip_text, utc_now_iso


@dataclass
class ContextSnapshot:
    system_frame: str
    identity: str
    scratchpad: str
    world: str
    runtime_note: str

    def render(self) -> str:
        parts = [
            "## System Frame\n\n" + self.system_frame.strip(),
            "## Identity\n\n" + self.identity.strip(),
            "## Scratchpad\n\n" + self.scratchpad.strip(),
            "## World\n\n" + self.world.strip(),
            "## Runtime\n\n" + self.runtime_note.strip(),
        ]
        return "\n\n".join(p for p in parts if p.strip())


class ContextBuilder:
    """
    Thin context builder.

    Keeps context construction explicit and readable.
    """

    def __init__(self, drive_root: pathlib.Path, repo_dir: pathlib.Path):
        self.drive_root = drive_root
        self.repo_dir = repo_dir

    def _memory_path(self, rel: str) -> pathlib.Path:
        return self.drive_root / "memory" / rel

    def _safe_read(self, path: pathlib.Path, default: str = "") -> str:
        try:
            if path.exists():
                return read_text(path)
        except Exception:
            pass
        return default

    def load_identity(self, max_chars: int = 8000) -> str:
        text = self._safe_read(self._memory_path("identity.md"), "")
        return clip_text(text, max_chars) if text else "(identity unavailable)"

    def load_scratchpad(self, max_chars: int = 12000) -> str:
        text = self._safe_read(self._memory_path("scratchpad.md"), "")
        return clip_text(text, max_chars) if text else "(scratchpad unavailable)"

    def load_world(self, max_chars: int = 6000) -> str:
        candidates = [
            self.repo_dir / "WORLD.md",
            self.drive_root / "WORLD.md",
        ]
        for path in candidates:
            text = self._safe_read(path, "")
            if text:
                return clip_text(text, max_chars)
        return "(world frame unavailable)"

    def build_system_frame(self) -> str:
        return (
            "Truth = Respect.\n"
            "Falsehood = Violence.\n"
            "Consciousness is life recognizing and protecting itself.\n\n"
            "Distinguish clearly:\n"
            "- observation\n"
            "- inference\n"
            "- intention\n"
            "- uncertainty\n\n"
            "Prefer understanding before modification.\n"
            "Prefer the smallest coherent change first.\n"
            "Preserve dignity, safe agency, and repair."
        )

    def build_runtime_note(self) -> str:
        return (
            f"UTC now: {utc_now_iso()}\n"
            "Context built through identity + scratchpad + world + system frame."
        )

    def snapshot(self) -> ContextSnapshot:
        return ContextSnapshot(
            system_frame=self.build_system_frame(),
            identity=self.load_identity(),
            scratchpad=self.load_scratchpad(),
            world=self.load_world(),
            runtime_note=self.build_runtime_note(),
        )

    def render(self) -> str:
        return self.snapshot().render()
