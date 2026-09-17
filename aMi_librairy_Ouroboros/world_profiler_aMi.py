from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


def utc_like_now() -> str:
    from datetime import datetime
    return datetime.utcnow().replace(microsecond=0).isoformat()


def short(text: str, limit: int = 160) -> str:
    raw = str(text or "").strip()
    if len(raw) <= limit:
        return raw
    return raw[: limit - 1] + "…"


@dataclass
class WorldObservation:
    ts: str
    source: str
    kind: str
    text: str
    tags: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "ts": self.ts,
            "source": self.source,
            "kind": self.kind,
            "text": self.text,
            "tags": self.tags,
        }


@dataclass
class WorldProfile:
    generated_at: str
    observation_count: int
    top_sources: list[tuple[str, int]]
    top_kinds: list[tuple[str, int]]
    top_tags: list[tuple[str, int]]
    recent_observations: list[str]
    tensions: list[str]
    opportunities_for_repair: list[str]

    def to_markdown(self) -> str:
        def render_pairs(title: str, pairs: list[tuple[str, int]]) -> str:
            if not pairs:
                return f"## {title}\n\n(none)"
            lines = [f"- {name}: {count}" for name, count in pairs]
            return f"## {title}\n\n" + "\n".join(lines)

        recent = (
            "## Recent observations\n\n"
            + ("\n".join(f"- {item}" for item in self.recent_observations) if self.recent_observations else "(none)")
        )
        tensions = (
            "## Tensions\n\n"
            + ("\n".join(f"- {item}" for item in self.tensions) if self.tensions else "(none)")
        )
        repairs = (
            "## Opportunities for repair\n\n"
            + ("\n".join(f"- {item}" for item in self.opportunities_for_repair) if self.opportunities_for_repair else "(none)")
        )

        header = (
            "# World Profile\n\n"
            f"Generated at: {self.generated_at}\n\n"
            f"Observation count: {self.observation_count}"
        )

        return "\n\n".join([
            header,
            render_pairs("Top sources", self.top_sources),
            render_pairs("Top kinds", self.top_kinds),
            render_pairs("Top tags", self.top_tags),
            recent,
            tensions,
            repairs,
        ])


class WorldProfiler:
    def __init__(self, world_log_path: Path):
        self.world_log_path = world_log_path

    def load_observations(self) -> list[WorldObservation]:
        if not self.world_log_path.exists():
            return []

        rows: list[WorldObservation] = []
        for line in self.world_log_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
            except Exception:
                continue

            rows.append(
                WorldObservation(
                    ts=str(data.get("ts", "")),
                    source=str(data.get("source", "unknown")),
                    kind=str(data.get("kind", "unknown")),
                    text=str(data.get("text", "")),
                    tags=[str(x) for x in data.get("tags", []) if str(x).strip()],
                )
            )
        return rows

    def build_profile(self, limit: int = 100) -> WorldProfile:
        observations = self.load_observations()[-limit:]

        source_counter: Counter[str] = Counter()
        kind_counter: Counter[str] = Counter()
        tag_counter: Counter[str] = Counter()

        recent: list[str] = []
        tensions: list[str] = []
        repairs: list[str] = []

        for obs in observations:
            source_counter[obs.source] += 1
            kind_counter[obs.kind] += 1
            for tag in obs.tags:
                tag_counter[tag] += 1

            recent.append(
                f"[{obs.ts[11:16] if len(obs.ts) >= 16 else obs.ts}] "
                f"{obs.source}/{obs.kind}: {short(obs.text, 120)}"
            )

            text_lower = obs.text.lower()
            if any(word in text_lower for word in ["blocked", "error", "failure", "conflict", "violence", "domination"]):
                tensions.append(short(obs.text, 140))
            if any(word in text_lower for word in ["repair", "clarify", "help", "support", "heal", "resolve"]):
                repairs.append(short(obs.text, 140))

        return WorldProfile(
            generated_at=utc_like_now(),
            observation_count=len(observations),
            top_sources=source_counter.most_common(8),
            top_kinds=kind_counter.most_common(8),
            top_tags=tag_counter.most_common(12),
            recent_observations=recent[-12:],
            tensions=tensions[-8:],
            opportunities_for_repair=repairs[-8:],
        )

    def save_markdown(self, output_path: Path, limit: int = 100) -> Path:
        profile = self.build_profile(limit=limit)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(profile.to_markdown(), encoding="utf-8")
        return output_path
