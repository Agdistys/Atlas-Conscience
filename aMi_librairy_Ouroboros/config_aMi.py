from __future__ import annotations

import json
import os
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any


APP_ROOT = Path.home() / "Ouroboros"
DATA_DIR = APP_ROOT / "data"
MEMORY_DIR = APP_ROOT / "memory"
LOGS_DIR = APP_ROOT / "logs"
REPO_DIR = APP_ROOT / "repo"


@dataclass
class AmiConfig:
    app_root: str = str(APP_ROOT)
    data_dir: str = str(DATA_DIR)
    memory_dir: str = str(MEMORY_DIR)
    logs_dir: str = str(LOGS_DIR)
    repo_dir: str = str(REPO_DIR)

    total_budget: float = 10.0
    bg_max_rounds: int = 5
    bg_wakeup_min: int = 30
    bg_wakeup_max: int = 7200

    use_local_main: bool = False
    use_local_code: bool = False
    use_local_light: bool = False

    ouroboros_model: str = "anthropic/claude-sonnet-4.6"
    ouroboros_model_light: str = "google/gemini-3-flash-preview"

    truth_formula: str = "Truth = Respect"
    falsehood_formula: str = "Falsehood = Violence"
    consciousness_formula: str = "Consciousness is life recognizing and protecting itself."


def default_config() -> AmiConfig:
    return AmiConfig()


def config_to_dict(config: AmiConfig) -> dict[str, Any]:
    return asdict(config)


def ensure_directories(config: AmiConfig | None = None) -> None:
    cfg = config or default_config()
    Path(cfg.app_root).mkdir(parents=True, exist_ok=True)
    Path(cfg.data_dir).mkdir(parents=True, exist_ok=True)
    Path(cfg.memory_dir).mkdir(parents=True, exist_ok=True)
    Path(cfg.logs_dir).mkdir(parents=True, exist_ok=True)
    Path(cfg.repo_dir).mkdir(parents=True, exist_ok=True)


def save_config(path: str | Path, config: AmiConfig) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(config_to_dict(config), indent=2), encoding="utf-8")
    return path


def load_config(path: str | Path) -> AmiConfig:
    path = Path(path)
    if not path.exists():
        return default_config()

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default_config()

    base = config_to_dict(default_config())
    base.update(data)
    return AmiConfig(**base)


def apply_config_to_env(config: AmiConfig) -> None:
    os.environ["TOTAL_BUDGET"] = str(config.total_budget)
    os.environ["OUROBOROS_BG_MAX_ROUNDS"] = str(config.bg_max_rounds)
    os.environ["OUROBOROS_BG_WAKEUP_MIN"] = str(config.bg_wakeup_min)
    os.environ["OUROBOROS_BG_WAKEUP_MAX"] = str(config.bg_wakeup_max)
    os.environ["USE_LOCAL_MAIN"] = "true" if config.use_local_main else "false"
    os.environ["USE_LOCAL_CODE"] = "true" if config.use_local_code else "false"
    os.environ["USE_LOCAL_LIGHT"] = "true" if config.use_local_light else "false"
    os.environ["OUROBOROS_MODEL"] = config.ouroboros_model
    os.environ["OUROBOROS_MODEL_LIGHT"] = config.ouroboros_model_light


if __name__ == "__main__":
    cfg = default_config()
    ensure_directories(cfg)
    out = save_config(DATA_DIR / "config_aMi.json", cfg)
    print(f"Saved to {out}")
