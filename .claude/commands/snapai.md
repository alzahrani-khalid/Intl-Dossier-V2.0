---
description: Generate app icons using SnapAI CLI with AI models (OpenAI GPT Image, Google Banana/Banana Pro). Supports all models, auto-detects project output directory, and handles prompt enhancement.
---

## User Input

```text
$ARGUMENTS
```

## Goal

Generate 1024x1024 app icons using the `snapai` CLI (globally installed). Parse user input to determine the prompt, model, quality, and output options, then execute the appropriate `snapai icon` command.

## Workflow

### 1. Parse User Input

Extract from `$ARGUMENTS`:

- **Prompt**: The icon description (required - if empty, ask the user)
- **Model preference**: Look for keywords like "banana", "pro", "gpt", "openai", "gemini"
- **Count**: Number of variations (e.g., "3 variations", "generate 5")
- **Quality**: Look for "hd", "4k", "2k", "high quality"
- **Style**: Look for style hints like "minimalist", "flat", "3d", "neon", "pixel"

Default to `--model banana --pro` if no model is specified (best quality).

### 2. Auto-Detect Output Directory

Detect project type and set output path:

```bash
# Check project type in order of specificity
if [ -f "app.json" ] || [ -f "app.config.ts" ] || [ -f "app.config.js" ]; then
  # Expo project - check app.json for icon path
  OUTPUT="./assets/images"
elif [ -f "react-native.config.js" ] || grep -q "react-native" package.json 2>/dev/null; then
  # React Native - use android/ios asset convention
  OUTPUT="./assets"
elif [ -f "next.config.js" ] || [ -f "next.config.ts" ] || [ -f "next.config.mjs" ]; then
  # Next.js
  OUTPUT="./public"
elif [ -d "public" ]; then
  # Generic web project
  OUTPUT="./public/icons"
else
  OUTPUT="./assets"
fi
```

Create the output directory if it doesn't exist before running the command.

### 3. Build and Execute Command

Construct the `snapai icon` command with detected parameters:

```
snapai icon \
  --prompt "<user prompt>" \
  --model <model> \
  --output <detected-dir> \
  [--pro]           # if banana pro
  [--quality <q>]   # if specified
  [--n <count>]     # if multiple requested
  [--style <style>] # if style specified
  [--output-format png]
```

### 4. Post-Generation

After successful generation:

1. List the generated files with their paths
2. If this is an Expo project, suggest updating `app.json` icon field if the path differs
3. Show the user a preview by reading the image file

## Model Quick Reference

| User says                   | Model flag             | Notes                                         |
| --------------------------- | ---------------------- | --------------------------------------------- |
| (default)                   | `--model banana --pro` | Best quality, Gemini 3 Pro                    |
| "banana", "gemini"          | `--model banana`       | Gemini Flash, single image only               |
| "banana pro", "pro", "best" | `--model banana --pro` | Gemini 3 Pro, supports `-n` and quality tiers |
| "gpt", "openai"             | `--model gpt-1.5`      | GPT Image 1.5, supports transparency          |
| "gpt-1"                     | `--model gpt-1`        | Older GPT Image model                         |

## Quality Mapping

| User says            | OpenAI flag        | Banana Pro flag |
| -------------------- | ------------------ | --------------- |
| "high", "hd", "best" | `--quality high`   | `--quality 4k`  |
| "medium", "standard" | `--quality medium` | `--quality 2k`  |
| "low", "fast"        | `--quality low`    | `--quality 1k`  |

## Important CLI Details (v1.0.0)

- `--style` flag is NOT available in v1.0.0 banana mode. Include style descriptions directly in the prompt text instead.
- `--output-format` only works with OpenAI models. Banana outputs JPEG by default.
- API keys: Banana/Gemini uses `GEMINI_API_KEY` env var or `--google-api-key` flag. OpenAI uses `OPENAI_API_KEY` or `--openai-api-key`.
- Installed from GitHub source (`github:betomoedano/snapai`) since npm v0.5.0 lacks banana support.

## Tips to Include

- Use `--prompt-only` to preview the enhanced prompt before generating
- Add `--raw-prompt` (`-r`) to skip SnapAI's automatic prompt enhancement
- For style control with banana model, embed style in the prompt directly (e.g., "minimalist flat design")
- For transparent backgrounds (OpenAI only): `--background transparent --output-format png`
- Banana Pro supports up to 10 images with `-n`; normal banana is limited to 1

## Error Handling

- If `snapai` is not found: install from source `cd /tmp && git clone github.com/betomoedano/snapai && cd snapai && pnpm install && pnpm build && npm link`
- If API key missing for banana: set `GEMINI_API_KEY` env var or run `snapai config --google-api-key "..."`
- If API key missing for OpenAI: set `OPENAI_API_KEY` env var or run `snapai config --openai-api-key "..."`
- If generation fails: check `snapai config --show` for key status
