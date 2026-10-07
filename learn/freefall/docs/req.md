# Orbit & Free Fall: Requirements

Date: 2026-10-06.
Updated: 2026-10-07.
Status: implemented on 2026-10-07 as `freefall/index.html` and linked from `index.md`. Cross-checks: `npm run freefall-physics-check` and `npm run freefall-layout-check` (run from `learn/`).
Proposed app: `freefall/index.html`, served at `/learn/freefall/`.
Design and scientific references: [design.md](design.md).
Visual and interaction reference: `gravassist/index.html`.

## Purpose

Explain why artificial satellites keep falling around Earth and why people inside an unpowered station feel weightless even though gravity acts on them. Make the explanation understandable through motion, controls, and an astronaut inside a rectangular cabin.

## Required outcomes

1. Show a station accelerating toward Earth while its sideways motion carries it around the planet.
2. Explain why the distance from Earth stays constant in a circular orbit. Show that other orbits can change altitude.
3. Let the learner change initial sideways speed and compare a direct fall, an impact trajectory, a lower ellipse, a circular orbit, a higher ellipse, and escape.
4. Distinguish velocity from gravitational force. Their directions remain perpendicular throughout a circular orbit, but generally not throughout an ellipse.
5. Show that the station and its freely floating astronaut share gravitational acceleration. Weightlessness must also occur on an unpowered impact trajectory before contact.
6. Provide acceleration and braking engines. Show the station moving relative to the astronaut and a wall pushing the astronaut only after contact.
7. Preserve the astronaut's relative velocity when engines stop. Do not automatically return them to the center.
8. Use the dark theme, fonts, slider steppers, segmented controls, playback glyphs, and English/Polish translation pattern of the reference app.
9. Make the default orbital view a close view of the station above visibly curved Earth, with a straight-versus-falling path comparison. Keep a small orbit map for context; let the learner pin Earth instead of the station (a non-rotating camera, decided 2026-10-07) without hiding the separate cabin view or changing physical state. Preserve real spatial proportions and readable desktop/mobile layouts, with keyboard alternatives and accessible text summaries.
10. Implement one self-contained HTML file with inline CSS and JavaScript, then add it to `index.md` and pass the repository's app review gate.

## Scope

The first version uses a spherical Earth, a fixed starting altitude of 400 km, two-dimensional Newtonian motion, and an explicitly labeled vacuum model. Its station is inspired by the ISS; it is not an ISS flight simulator.

The full globe is the optional Earth-pinned view, not the default teaching view. Earth's real curvature must be visible at the initial low orbit without opening an inspection tool. On distant trajectories, a surface outside the close crop is labeled honestly; the map retains context.

Large changes between orbital scenarios use initial-speed controls. Short live engine burns demonstrate cabin motion and also update the orbit using the same physical clock. No separate visual clock may silently exaggerate an engine's orbital effect.

Launch from the ground, atmospheric reentry, heating, live ISS tracking, additional planets, orbital rendezvous, fuel management, general relativity, scoring, and a challenge mode are outside the first version.

## Implementation authority and verification

The implementation was authorized and delivered on 2026-10-07 within the documented scope. The detailed design contains the physical model, UI states, English/Polish copy, reference values, and acceptance matrix; the implementation record and verification results are in [design.md](design.md) sections 9–11. Any later substantial deviation from that baseline should be raised explicitly before it is built.
