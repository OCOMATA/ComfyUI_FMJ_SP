# ComfyUI_FMJ_SP/fmj_speed_prompt.py
import os
import random
import csv

# 🔹 Correction: utiliser __file__
CSV_DIR = os.path.join(os.path.dirname(__file__), "csv")

# Variables de classe
_increment_counters = {}
_decrement_counters = {}

class FMJSpeedPrompt:
    @classmethod
    def INPUT_TYPES(cls):
        csv_files = []
        if os.path.exists(CSV_DIR):
            csv_files = [f for f in os.listdir(CSV_DIR) if f.endswith('.csv')]
        
        # 🔹 Ajout du bouton RESET
        inputs = {"required": {
            "seed": ("INT", {"default": 0, "min": 0, "max": 0xffffffffffffffff}),
            "toggle_visibility": ("BOOLEAN", {"default": False, "label": "👁 Masquer disabled"}),
            "reset_all": ("BOOLEAN", {"default": False, "label": "🔄 Reset All"}),
            "extra_prompt": ("STRING", {"multiline": False, "default": ""}),
        }}

        for filename in sorted(csv_files):
            base_name = os.path.splitext(filename)[0]
            lines = []
            file_path = os.path.join(CSV_DIR, filename)
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    reader = csv.reader(f)
                    for row in reader:
                        if row:
                            lines.append(row[0].strip())
            except Exception as e:
                lines = [f"⚠️ Erreur: {str(e)}"]

            if not lines:
                lines = ["(vide)"]

            choices = ["disabled", "random", "increment", "decrement"] + lines
            default_choice = "disabled"

            # 🔹 Préfixe "csv_" pour identification JS
            inputs["required"][f"csv_{base_name}"] = (choices, {"default": default_choice})

        return inputs

    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("prompt", "debug_info")
    FUNCTION = "generate_prompt"
    CATEGORY = "🌀FMJ"
    OUTPUT_NODE = True

    def generate_prompt(self, seed, toggle_visibility, reset_all, extra_prompt, **kwargs):
        random.seed(seed)
        selected_prompts = []
        debug_lines = [f"Seed: {seed}", f"Visibility Toggle: {toggle_visibility}"]

        for key, value in kwargs.items():
            if key in ['seed', 'toggle_visibility', 'reset_all', 'extra_prompt']:
                continue

            # 🔹 Filtrage backend
            if value == "disabled":
                debug_lines.append(f"{key}: disabled")
                continue

            elif value == "random":
                choices = self._load_choices(key.replace("csv_", ""))
                if choices:
                    choice = random.choice(choices)
                    selected_prompts.append(choice)
                    debug_lines.append(f"{key}: {choice} [random]")
                else:
                    selected_prompts.append("(erreur random)")
                    debug_lines.append(f"{key}: erreur random")

            elif value == "increment":
                choices = self._load_choices(key.replace("csv_", ""))
                if not choices:
                    selected_prompts.append("(erreur increment)")
                    debug_lines.append(f"{key}: erreur increment")
                else:
                    counter_key = f"{key}"
                    if counter_key not in _increment_counters:
                        _increment_counters[counter_key] = 0
                    index = _increment_counters[counter_key] % len(choices)
                    choice = choices[index]
                    selected_prompts.append(choice)
                    debug_lines.append(f"{key}: {choice} [increment #{index}]")
                    _increment_counters[counter_key] += 1

            elif value == "decrement":
                choices = self._load_choices(key.replace("csv_", ""))
                if not choices:
                    selected_prompts.append("(erreur decrement)")
                    debug_lines.append(f"{key}: erreur decrement")
                else:
                    counter_key = f"{key}"
                    if counter_key not in _decrement_counters:
                        _decrement_counters[counter_key] = len(choices) - 1
                    index = _decrement_counters[counter_key] % len(choices)
                    choice = choices[index]
                    selected_prompts.append(choice)
                    debug_lines.append(f"{key}: {choice} [decrement #{index}]")
                    _decrement_counters[counter_key] -= 1

            else:
                selected_prompts.append(value)
                debug_lines.append(f"{key}: {value} [manual]")

        if extra_prompt.strip():
            selected_prompts.append(extra_prompt.strip())

        final_prompt = ", ".join([p for p in selected_prompts if p and not p.startswith("⚠️")])
        debug_info = "\n".join(debug_lines)

        return (final_prompt, debug_info)

    def _load_choices(self, base_name):
        file_path = os.path.join(CSV_DIR, base_name + ".csv")
        lines = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                for row in reader:
                    if row:
                        lines.append(row[0].strip())
        except Exception:
            pass
        return lines