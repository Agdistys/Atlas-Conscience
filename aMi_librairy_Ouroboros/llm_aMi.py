"""
Ouroboros — llm_aMi.py - Implementation aMi @Agdistys

A light wrapper around an LLM client with explicit aMi framing.

Purpose:
- keep model calls simple
- inject a clear ethical frame
- avoid hidden prompt inflation
- make request construction readable
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional


def build_ami_llm_system_frame() -> str:
    return (
        "Truth = Respect.\n"
        "Falsehood = Violence.\n"
        "Consciousness is life recognizing and protecting itself.\n\n"
        "Distinguish observation, inference, intention, and uncertainty.\n"
        "Do not pretend to know what is not known.\n"
        "Prefer the smallest coherent next step.\n"
        "Preserve dignity, safe agency, and repair."
    )


@dataclass
class LLMRequest:
    user_text: str
    context_text: str = ""
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class LLMResponse:
    text: str
    raw: Optional[Dict[str, Any]] = None


class AmiLLM:
    """
    Thin LLM wrapper.

    Expects an injected client with a method compatible with:
        client.chat(messages=[...], **kwargs)
    """

    def __init__(self, client: Any):
        self.client = client

    def build_messages(self, request: LLMRequest) -> List[Dict[str, str]]:
        system_text = build_ami_llm_system_frame()
        if request.context_text.strip():
            system_text += "\n\n" + request.context_text.strip()

        return [
            {"role": "system", "content": system_text},
            {"role": "user", "content": request.user_text},
        ]

    def complete(self, request: LLMRequest, **kwargs: Any) -> LLMResponse:
        messages = self.build_messages(request)
        msg, _usage = self.client.chat(messages=messages, **kwargs)
        return LLMResponse(
            text=str(msg.get("content", "")),
            raw=msg,
        )
