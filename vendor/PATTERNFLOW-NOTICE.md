# Patternflow patterns

`vendor/patternflow-patterns.js` holds 42 patterns from **Patternflow**, the open-source LED synthesizer started by
Seunghun Lee (@engmung) and made by its contributors: <https://github.com/engmung/Patternflow> · <https://patternflow.work>

- The patterns are the work of their authors (named in each pattern's header) and are licensed
  **CC BY-SA 4.0**: <https://creativecommons.org/licenses/by-sa/4.0/>. That licence continues to apply to them here,
  and to any changed version of them.
- They were taken from `web/src/lib/presets/` at commit `711546c`. Each pattern's source text is unchanged apart from
  removing the `export` keyword so the code can sit inside a function. Patterns that need Pattern Lab's colour ramp were left out.
- Patternflow's code is MIT licensed; none of its code is included here, only the patterns. The knob model the studio uses
  (four knobs, 48 detents across a range, the default Hue / Speed / Mode / Freq ranges) follows Patternflow's documentation.

To refresh the bundle: `python3 tools/patternflow-gen.py <Patternflow checkout>/web/src/lib/presets vendor/patternflow-patterns.js`
