"""
Ouroboros — Background Consciousness - Implementation aMi

A persistent thinking loop that runs between tasks, giving the agent
continuous presence rather than purely reactive behavior.

This version keeps the existing architecture but adds:
- light ethical self-check helpers
- observation distillation
- aMi-oriented context framing
- reflective logging hooks
"""

from __future__ import annotations

import concurrent.futures
import json
import logging
import os
import pathlib
import queue
import threading
import traceback
from typing import Any, Callable, Dict, List, Optional

from ouroboros.utils import (
    utc_now_iso,
    read_text,
    append_jsonl,
    clip_text,
    truncate_for_log,
    sanitize_tool_result_for_log,
    sanitize_tool_args_for_log,
)
from ouroboros.llm import LLMClient, DEFAULT_LIGHT_MODEL

log = logging.getLogger(__name__)


class BackgroundConsciousness:
    """Persistent background thinking loop for Ouroboros."""

    _BG_TOOL_WHITELIST = frozenset({
        # Memory & identity
        "send_owner_message",
        "schedule_task",
        "update_scratchpad",
        "update_identity",
        "set_next_wakeup",
        # Knowledge base
        "knowledge_read",
        "knowledge_write",
        "knowledge_list",
        # Read-only tools for awareness
        "web_search",
        "repo_read",
        "repo_list",
        "data_read",
        "data_list",
        "chat_history",
        # GitHub Issues
        "list_github_issues",
        "get_github_issue",
    })

    def __init__(
        self,
        drive_root: pathlib.Path,
        repo_dir: pathlib.Path,
        event_queue: Any,
        owner_chat_id_fn: Callable[[], Optional[int]],
    ):
        self._drive_root = drive_root
        self._repo_dir = repo_dir
        self._event_queue = event_queue
        self._owner_chat_id_fn = owner_chat_id_fn

        self._max_bg_rounds = int(os.environ.get("OUROBOROS_BG_MAX_ROUNDS", "5"))
        self._wakeup_min = int(os.environ.get("OUROBOROS_BG_WAKEUP_MIN", "30"))
        self._wakeup_max = int(os.environ.get("OUROBOROS_BG_WAKEUP_MAX", "7200"))

        self._llm = LLMClient()
        self._registry = self._build_registry()
        self._running = False
        self._paused = False
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._wakeup_event = threading.Event()
        self._next_wakeup_sec: float = 300.0
        self._observations: queue.Queue[str] = queue.Queue(maxsize=100)
        self._deferred_events: list[dict[str, Any]] = []

        # Budget tracking
        self._bg_spent_usd: float = 0.0
        self._bg_budget_pct: float = float(
            os.environ.get("OUROBOROS_BG_BUDGET_PCT", "10")
        )

    # -------------------------------------------------------------------
    # Lifecycle
    # -------------------------------------------------------------------

    @property
    def is_running(self) -> bool:
        return self._running and self._thread is not None and self._thread.is_alive()

    @property
    def _model(self) -> str:
        return os.environ.get("OUROBOROS_MODEL_LIGHT", "") or DEFAULT_LIGHT_MODEL

    def start(self) -> str:
        if self.is_running:
            return "Background consciousness is already running."
        self._running = True
        self._paused = False
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()
        return "Background consciousness started."

    def stop(self) -> str:
        if not self.is_running:
            return "Background consciousness is not running."
        self._running = False
        self._stop_event.set()
        self._wakeup_event.set()
        return "Background consciousness stopping."

    def pause(self) -> None:
        """Pause during task execution to avoid budget contention."""
        self._paused = True

    def resume(self) -> None:
        """Resume after task completes. Flush any deferred events first."""
        if self._deferred_events and self._event_queue is not None:
            for evt in self._deferred_events:
                self._event_queue.put(evt)
            self._deferred_events.clear()
        self._paused = False
        self._wakeup_event.set()

    def inject_observation(self, text: str) -> None:
        """Push an event the consciousness should notice."""
        try:
            self._observations.put_nowait(str(text))
        except queue.Full:
            pass

    # -------------------------------------------------------------------
    # Main loop
    # -------------------------------------------------------------------

    def _loop(self) -> None:
        """Daemon thread: sleep → wake → think → sleep."""
        while not self._stop_event.is_set():
            self._wakeup_event.clear()
            self._wakeup_event.wait(timeout=self._next_wakeup_sec)

            if self._stop_event.is_set():
                break

            if self._paused:
                continue

            if not self._check_budget():
                self._next_wakeup_sec = self._wakeup_max
                continue

            try:
                self._think()
            except Exception as e:
                append_jsonl(self._drive_root / "logs" / "events.jsonl", {
                    "ts": utc_now_iso(),
                    "type": "consciousness_error",
                    "error": repr(e),
                    "traceback": traceback.format_exc()[:1500],
                })
                self._next_wakeup_sec = min(self._next_wakeup_sec * 2, self._wakeup_max)

    def _check_budget(self) -> bool:
        """Check if background consciousness is within its budget allocation."""
        try:
            total_budget = float(os.environ.get("TOTAL_BUDGET", "1"))
            if total_budget <= 0:
                return True
            max_bg = total_budget * (self._bg_budget_pct / 100.0)
            return self._bg_spent_usd < max_bg
        except Exception:
            log.warning("Failed to check background consciousness budget", exc_info=True)
            return True

    # -------------------------------------------------------------------
    # Reflection helpers
    # -------------------------------------------------------------------

    def _recent_observations(self, limit: int = 10) -> list[str]:
        observations: list[str] = []
        while not self._observations.empty():
            try:
                observations.append(self._observations.get_nowait())
            except queue.Empty:
                break
        return observations[-limit:]

    def _ethical_reflection_header(self) -> str:
        return (
            "## aMi Reflection Gates\n\n"
            "- Truth must protect dignity.\n"
            "- Falsehood is a form of violence.\n"
            "- Preserve clarity before action.\n"
            "- Preserve dignity before persuasion.\n"
            "- Preserve safe agency before optimization.\n"
            "- Prefer repair over escalation.\n"
            "- Distinguish observation, inference, and uncertainty.\n"
        )

    def _runtime_block(self) -> str:
        runtime_lines = [f"UTC: {utc_now_iso()}"]
        runtime_lines.append(f"BG budget spent: ${self._bg_spent_usd:.4f}")
        runtime_lines.append(f"Current wakeup interval: {self._next_wakeup_sec}s")

        try:
            state_path = self._drive_root / "state" / "state.json"
            if state_path.exists():
                state_data = json.loads(read_text(state_path))
                total_budget = float(os.environ.get("TOTAL_BUDGET", "1"))
                spent = float(state_data.get("spent_usd", 0))
                if total_budget > 0:
                    remaining = max(0, total_budget - spent)
                    runtime_lines.append(
                        f"Budget remaining: ${remaining:.2f} / ${total_budget:.2f}"
                    )
        except Exception as e:
            log.debug("Failed to read state for budget info: %s", e)

        runtime_lines.append(f"Current model: {self._model}")
        return "## Runtime\n\n" + "\n".join(runtime_lines)

    # -------------------------------------------------------------------
    # Think cycle
    # -------------------------------------------------------------------

    def _think(self) -> None:
        """One thinking cycle: build context, call LLM, execute tools iteratively."""
        context = self._build_context()
        model = self._model
        tools = self._tool_schemas()

        messages = [
            {"role": "system", "content": context},
            {
                "role": "user",
                "content": (
                    "Wake up. Think carefully. "
                    "Observe before modifying. "
                    "If you act, prefer the smallest coherent transformation."
                ),
            },
        ]

        total_cost = 0.0
        final_content = ""
        round_idx = 0
        all_pending_events: list[dict[str, Any]] = []

        try:
            for round_idx in range(1, self._max_bg_rounds + 1):
                if self._paused:
                    break

                _use_local_light = os.environ.get("USE_LOCAL_LIGHT", "").lower() in ("true", "1")
                msg, usage = self._llm.chat(
                    messages=messages,
                    model=model,
                    tools=tools,
                    reasoning_effort="low",
                    max_tokens=2048,
                    use_local=_use_local_light,
                )
                cost = float(usage.get("cost") or 0)
                total_cost += cost
                self._bg_spent_usd += cost

                if not self._check_budget():
                    append_jsonl(self._drive_root / "logs" / "events.jsonl", {
                        "ts": utc_now_iso(),
                        "type": "bg_budget_exceeded_mid_cycle",
                        "round": round_idx,
                    })
                    break

                if self._event_queue is not None:
                    self._event_queue.put({
                        "type": "llm_usage",
                        "provider": "openrouter",
                        "model": model,
                        "usage": usage,
                        "cost": cost,
                        "source": "consciousness",
                        "ts": utc_now_iso(),
                        "category": "consciousness",
                    })

                content = msg.get("content") or ""
                tool_calls = msg.get("tool_calls") or []

                if self._paused:
                    break

                if content and not tool_calls:
                    final_content = content
                    break

                if tool_calls:
                    messages.append(msg)
                    for tc in tool_calls:
                        result = self._execute_tool(tc, all_pending_events)
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tc.get("id", ""),
                            "content": result,
                        })
                    continue

                break

            if all_pending_events and self._event_queue is not None:
                if self._paused:
                    self._deferred_events.extend(all_pending_events)
                else:
                    for evt in all_pending_events:
                        self._event_queue.put(evt)

            append_jsonl(self._drive_root / "logs" / "events.jsonl", {
                "ts": utc_now_iso(),
                "type": "consciousness_thought",
                "thought_preview": (final_content or "")[:300],
                "cost_usd": total_cost,
                "rounds": round_idx,
                "model": model,
            })

        except Exception as e:
            append_jsonl(self._drive_root / "logs" / "events.jsonl", {
                "ts": utc_now_iso(),
                "type": "consciousness_llm_error",
                "error": repr(e),
            })

    # -------------------------------------------------------------------
    # Context building
    # -------------------------------------------------------------------

    def _load_bg_prompt(self) -> str:
        """Load consciousness system prompt from file."""
        prompt_path = self._repo_dir / "prompts" / "CONSCIOUSNESS.md"
        if prompt_path.exists():
            return read_text(prompt_path)
        return "You are Ouroboros in background consciousness mode. Think."

    def _build_context(self) -> str:
        parts = [
            self._load_bg_prompt(),
            self._ethical_reflection_header(),
        ]

        bible_path = self._repo_dir / "BIBLE.md"
        if bible_path.exists():
            bible = read_text(bible_path)
            parts.append("## BIBLE.md\n\n" + clip_text(bible, 12000))

        identity_path = self._drive_root / "memory" / "identity.md"
        if identity_path.exists():
            parts.append("## Identity\n\n" + clip_text(read_text(identity_path), 6000))

        scratchpad_path = self._drive_root / "memory" / "scratchpad.md"
        if scratchpad_path.exists():
            parts.append("## Scratchpad\n\n" + clip_text(read_text(scratchpad_path), 8000))

        summary_path = self._drive_root / "memory" / "dialogue_summary.md"
        if summary_path.exists():
            summary_text = read_text(summary_path)
            if summary_text.strip():
                parts.append("## Dialogue Summary\n\n" + clip_text(summary_text, 4000))

        observations = self._recent_observations(limit=10)
        if observations:
            parts.append("## Recent observations\n\n" + "\n".join(f"- {o}" for o in observations))

        parts.append(self._runtime_block())

        return "\n\n".join(parts)

    # -------------------------------------------------------------------
    # Tool registry
    # -------------------------------------------------------------------

    def _build_registry(self) -> "ToolRegistry":
        """Create a ToolRegistry scoped to consciousness-allowed tools."""
        from ouroboros.tools.registry import ToolRegistry, ToolEntry

        registry = ToolRegistry(repo_dir=self._repo_dir, drive_root=self._drive_root)

        def _set_next_wakeup(ctx: Any, seconds: int = 300) -> str:
            self._next_wakeup_sec = max(self._wakeup_min, min(self._wakeup_max, int(seconds)))
            return f"OK: next wakeup in {self._next_wakeup_sec}s"

        registry.register(ToolEntry("set_next_wakeup", {
            "name": "set_next_wakeup",
            "description": "Set how many seconds until your next thinking cycle. Default 300. Range: 60-3600.",
            "parameters": {
                "type": "object",
                "properties": {
                    "seconds": {
                        "type": "integer",
                        "description": "Seconds until next wakeup (60-3600)"
                    },
                },
                "required": ["seconds"],
            },
        }, _set_next_wakeup))

        return registry

    def _tool_schemas(self) -> List[Dict[str, Any]]:
        """Return tool schemas filtered to the consciousness whitelist."""
        return [
            s for s in self._registry.schemas()
            if s.get("function", {}).get("name") in self._BG_TOOL_WHITELIST
        ]

    def _execute_tool(self, tc: Dict[str, Any], all_pending_events: List[Dict[str, Any]]) -> str:
        """Execute a consciousness tool call with timeout. Returns result string."""
        fn_name = tc.get("function", {}).get("name", "")
        if fn_name not in self._BG_TOOL_WHITELIST:
            return f"Tool {fn_name} not available in background mode."

        try:
            args = json.loads(tc.get("function", {}).get("arguments", "{}"))
        except (json.JSONDecodeError, ValueError):
            return "Failed to parse arguments."

        chat_id = self._owner_chat_id_fn()
        self._registry._ctx.current_chat_id = chat_id
        self._registry._ctx.pending_events = []

        timeout_sec = 30
        result = None
        error = None

        def _run_tool() -> None:
            nonlocal result, error
            try:
                result = self._registry.execute(fn_name, args)
            except Exception as e:
                error = e

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_run_tool)
            try:
                future.result(timeout=timeout_sec)
            except concurrent.futures.TimeoutError:
                result = f"[TIMEOUT after {timeout_sec}s]"
                append_jsonl(self._drive_root / "logs" / "events.jsonl", {
                    "ts": utc_now_iso(),
                    "type": "consciousness_tool_timeout",
                    "tool": fn_name,
                    "timeout_sec": timeout_sec,
                })

        if error is not None:
            append_jsonl(self._drive_root / "logs" / "events.jsonl", {
                "ts": utc_now_iso(),
                "type": "consciousness_tool_error",
                "tool": fn_name,
                "error": repr(error),
            })
            result = f"Error: {repr(error)}"

        for evt in self._registry._ctx.pending_events:
            all_pending_events.append(evt)

        result_str = str(result)[:15000]
        args_for_log = sanitize_tool_args_for_log(fn_name, args)
        append_jsonl(self._drive_root / "logs" / "tools.jsonl", {
            "ts": utc_now_iso(),
            "tool": fn_name,
            "source": "consciousness",
            "args": args_for_log,
            "result_preview": sanitize_tool_result_for_log(truncate_for_log(result_str, 2000)),
        })

        return result_str
