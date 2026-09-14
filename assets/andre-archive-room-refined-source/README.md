# Andre Archive Room - Refined Oak

A rebuilt, smooth-shaded procedural 3D room, not a flat render or AI image.
White plaster and porcelain furniture are balanced with natural oak, sage
linen, charcoal upholstery, metal hardware, and botanical greens.

## Deliverables

- `andre-archive-room-refined.glb`: standalone GLB with six embedded 512px material textures.
- `preview.html` / `viewer.mjs`: actual GLB viewer with orbit, hover outlines,
  click-to-focus, saved-view return with Back/Escape, and two toggleable lamps.
- `room.mjs` / `base-room.mjs`: complete editable procedural model source.
- `export.html`: browser exporter; downloads a fresh GLB without Blender.
- `interaction-config.mjs`: central focus/toggle mappings.
- `validate.mjs`: Khronos glTF validator runner.

## Start

Requires Node.js with npm. From this folder:

```sh
npm ci
npm start
```

Open http://localhost:8766/preview.html. Drag to orbit, wheel/pinch to zoom,
click a highlighted object to focus, and use the arrow or Escape to return.
Click a lamp shade to toggle its illumination. The preview has no page scroll.
`PORT=8767 node server.mjs` selects another port on Unix shells; on Windows
PowerShell set `$env:PORT=8767` before `node server.mjs`.

To rebuild, edit `room.mjs` or `base-room.mjs`, open
http://localhost:8766/export.html, and click Download GLB. Replace the GLB
beside the viewer with the exported file, then run `npm run validate`.

## What Changed

- Multi-segment bevels and smoother round geometry.
- A real opening in the left wall, recessed window frame, mullions, sill,
  latch, curtain rod/rings, and curved linen curtains.
- Staggered oak planks with embedded grain texture and narrow physical joints.
- Curved duvet/pillows, linen throw, piping, chair stitching/lumbar support,
  and a woven rug with fringe.
- Curved plant leaves with stems and midveins; rimmed ceramic pots.
- Laptop keycaps, speaker details and ports; camera lens rings and shutter;
  monitor vents; pencils, coffee mug, cable, books, and an analog wall clock.
- Neutral lights, physically based materials, environment reflections,
  contact shading and antialiasing in the supplied viewer.

## Integration Contract

Meter scale, Y-up, floor centered at world origin. Footprint remains about
5.2 x 4.8 meters. The nine original interactive names and device transforms
are retained:

`monitor_interactive`, `laptop_interactive`, `wall_board_interactive`,
`tv_interactive`, `bookshelf_interactive`, `project_folder_interactive`,
`pokeball_interactive`, `camera_interactive`, `phone_contact_interactive`.

**Important:** Interactive assemblies are now named Groups with separate
child meshes, not single merged meshes. Resolve raycast hits by walking up
to a configured parent. Do not assume `getObjectByName(name).material` exists.
Some generic decorative child names repeat; look them up within the parent.

New toggle parents: `lamp_interactive` and `bedside_lamp_interactive`.
Their `userData.lightName` references `desk_warm_light` and
`bedside_warm_light`. Use the supplied viewer toggle logic, including bulb
and shade emissive state, rather than only hiding the light object.

Named surface anchors (local transforms, +Z surface normal):

| Parent | Anchor | Width x Height |
| --- | --- | --- |
| monitor_interactive | monitor_screen_anchor | 0.84 x 0.48 m |
| laptop_interactive | laptop_screen_anchor | 0.42 x 0.275 m |
| wall_board_interactive | board_surface_anchor | 1.07 x 0.78 m |

The laptop anchor follows the slight screen tilt. Resolve anchor world
transforms rather than assuming all surfaces are world-axis aligned.
Board meshes `board_photo_01` through `board_photo_06` accept your image
textures. These are neutral placeholders, not your personal photos: the
current deliverable does not have your local `assets/board` directory.
Map image textures using actual filenames in your app; preserve aspect ratio.
Use SRGB color space and check orientation against the existing mesh UVs.

For a live monitor, use `monitor_screen_anchor` and the `monitor_screen`
surface. Screen content, music, gallery browsing, and portfolio UI are not
implemented by the GLB. The preview demonstrates model interactions only.

## Rendering and Limitations

Use the supplied viewer as the lighting reference. GLB carries geometry,
material textures and punctual lights, but not SSAO, environment lighting,
renderer tone mapping, shadow settings, or executable interactions. Merely
replacing the GLB in an older harshly lit viewer will not reproduce this preview.
Avoid duplicate punctual lights in your host application.

The room is a detailed stylized procedural asset, not a photorealistic
hand-sculpted reproduction of the reference images. Bedding folds and
botanical shapes remain stylized. Window glass suggests daylight; there is
no exterior scene, animated curtain, or simulated cloth.

The full-quality asset is approximately 10.1 MB, 184,800 triangles and
466 mesh primitives. This favors inspection detail over the old 1.9 MB MVP.
Mobile framing is supported; low-end-device GPU performance has not been
measured on physical hardware. For production, profile draw calls, consider
mesh batching that retains interactive parents, texture compression and LOD.
SSAO and outlines can be disabled or reduced on slower devices.

The provided `validation.json` and `browser-checks.json` record validation
and browser smoke-test results. Existing application code and personal
photo assets on your Windows machine are not part of this package.
