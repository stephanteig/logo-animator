# Trace — Claude Code Instructions

## ⚠️ Pre-push requirement

Before pushing any change to `index.html`, you must verify the test suite passes.

### How to run tests

1. Open `test.html` in a browser (same folder as `index.html`)
2. Click **"Run All Tests"**
3. All tests must show ✓ — the result banner must say **PASS**

### What the tests cover

- `getResolution()` — all 3 aspect ratios × 3 quality levels
- `parseCSSColor()` — edge cases (none, transparent, rgba with alpha=0)
- `easeIO()` — boundary values, monotonicity, range
- `generateCode()` — transparent vs solid bg, all formats, FPS, resolution, CLI flags, filenames, parameters
- DOM: setup screen flow, SVG upload, editor transition, tab switching
- DOM: slider defaults, reset dot activate/deactivate, reset behaviour
- DOM: stroke color/swatch sync, background presets, transparent toggle
- DOM: aspect ratio canvas proportions (16:9, 9:16, 1:1)

### Rules

- **Do not push if any test shows ✗**
- Fix the root cause in `index.html`, not the test
- If you add a new feature, add a corresponding test in `test.html`
- The test file must stay in the same folder as `index.html`
