# Fosfora

Video synth B (`src/p23_video.js`) ports four effects and two helpers from Fosfora
(https://github.com/kevinraymond/fosfora): `aurora.wgsl`, `drift.wgsl`, `pulse.wgsl`, `prism.wgsl`,
and the noise and audio-palette functions from `assets/shaders/lib`.

Fosfora is Copyright (c) 2025-2026 Kevin Raymond and is licensed MIT OR Apache-2.0; it is used here under the MIT License:

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Changes (November 2026): WGSL rewritten as GLSL; frame-feedback trails left out; a float hash replaces the integer hash;
three noise octaves; picture snapped to a 128 x 64 grid; beat inputs come from the room's drum machine.
