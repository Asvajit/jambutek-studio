# bzzzbz

Video synth B (`src/p23_video.js`) ports four fragment shaders from bzzzbz
(https://github.com/dvr0/bzzzbz) by Davide Rovelli, Peter Nagy and Marcell Illyes:
`cells.glsl`, `wavepatterns.glsl`, `spectrum.glsl` and `creation.glsl` (the last after Danilo Guanabara's "Creation").

bzzzbz is licensed under the GNU General Public License v3.0. The ported shader code in `src/p23_video.js`
is a modified version of that work and stays under GPL-3.0:
https://www.gnu.org/licenses/gpl-3.0.html

Changes made (November 2026): screen position is taken from a texture coordinate instead of `gl_FragCoord`;
the spectrum is read from a texture instead of a 513-float uniform array; divisions are guarded against zero;
the picture is snapped to a 128 x 64 grid; a fourth pot scales time; `creation` divides by the distance from centre again, as its Shadertoy original does, so the rings read on a coarse grid.
