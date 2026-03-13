# ComfyUI_FMJ_SP/__init__.py
from .fmj_speed_prompt import FMJSpeedPrompt

NODE_CLASS_MAPPINGS = {
    "✨ FMJ-speed-Prompt": FMJSpeedPrompt
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "✨ FMJ-speed-Prompt": "⚡ FMJ-Speed-Prompt"
}

WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]