# Banc d’Essai Virtuel — Plan

## What to build
Create the French, full-screen classroom simulator described in the uploaded brief at `/`. The first screen will show an interactive optical bench, live sensor readouts, a calibration graph, and a compact presentation stepper, with a distraction-reduced presentation mode.

## User experience
- Dark, high-contrast technical studio styling with projector-legible French labels, large live values, and semantic cyan/green/amber/red signals.
- Interactive 3D bench with ruler, sensor, target slider, range zones, acoustic pulses, and three camera views; target also responds to keyboard arrows and a precision control.
- Live telemetry and calibration curve with sampled points; a two-channel oscilloscope view.
- Controls for measurement noise, hysteresis, nonlinearity/saturation, and temperature, plus four guided lesson stages and a `P` presentation-mode shortcut.
- Responsive layouts for classroom screens and laptops.

## Technical approach
- Adapt to the existing TanStack Start + React 19 project rather than replacing its framework. Isolate the R3F scene from SSR and keep sensor math in pure TypeScript.
- Add Three.js, React Three Fiber/Drei, postprocessing, and Framer Motion dependencies; use semantic CSS tokens for all visual styling.
- Implement testable formulas for distance zones, sound speed, time of flight, output voltage, sensitivity, and sensor effects. Use component state for user controls and animation refs for per-frame scene motion.
- Add route metadata, a focused physics test, and record the lasting scene/debug architecture in `AGENTS.md`.
- Validate build logs, the formula test, and the live preview’s rendered scene and main controls.

## Boundaries
This is a local interactive teaching simulator; it will not save results across devices or introduce accounts/cloud storage. The scene will use custom procedural geometry rather than externally downloaded models.
