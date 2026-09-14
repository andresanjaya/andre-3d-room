# Andre Archive Room - White Minimal Edition

Complete neutral restyle: white walls and furniture, light gray flooring,
charcoal upholstery, muted screen graphics, green plants and small dusty-red
collectible accents. The original geometry, object names and transforms remain
unchanged. This is a stylized diorama, not a reproduction of the reference photo.

## Replacing the previous model

Replace your application's runtime GLB with this `andre-archive-room.glb`.
Keep existing object mappings and screen/focus transforms.
Remove old purple/pink environment, ambient and fill lights from the host app;
otherwise even white materials will look tinted. Use a white hemisphere sky,
neutral gray ground (`#939b98`) and intensity 1.8 as in `preview.html`.
The model includes its own neutral punctual lights; do not add duplicate lights.
The dark purple background is retained and does not need to tint the lighting.

Stylized, procedural bedroom diorama for Three.js / React Three Fiber.

## Asset

- `andre-archive-room.glb`: self-contained geometry and PBR materials; no external textures.
- Meter-scale, Y-up, floor centered at world origin. Approximate footprint: 5.2 x 4.8 meters.
- Two walls, beveled furniture, desk devices, chair, bed, TV cabinet, photo board, shelves, plants and collectibles.
- Abstract screen and photo graphics are geometry placeholders, not live content.
- An overview camera and KHR_lights_punctual lights are included.
- Set renderer background to `#241c32`. Environment illumination, tone mapping and shadows are renderer settings, not portable GLB settings.
- This is a stylized starting asset, not a photorealistic hand-sculpted room.
- Export statistics: run `node export.mjs` for current byte size; 33,360 triangles.
- Khronos glTF Validator: zero errors and zero warnings. Informational unused UVs are retained for future textures.
- Browser checks for this edition: desktop/mobile rendering, monitor click, Back/Escape, and nonblank canvas pixels.

## Clickable meshes

Each exact node below is a separate mesh with `userData.interactive = true`:

1. monitor_interactive
2. laptop_interactive
3. wall_board_interactive
4. tv_interactive
5. bookshelf_interactive
6. project_folder_interactive
7. pokeball_interactive
8. camera_interactive
9. phone_contact_interactive

Find a target with `gltf.scene.getObjectByName('monitor_interactive')`.
Raycast the entire room first and check the closest hit to avoid selecting through furniture.
Clickable assemblies use multiple material primitives; loaders may expose those primitives as children.
Resolve the named parent when a loader splits a mesh into child objects.
The GLB contains no executable click or camera-transition behavior.

## Preview and edit

1. Install Node.js and run `npm ci` in this directory.
2. Run `node server.mjs`.
3. Open http://localhost:8765/preview.html.
4. Drag to orbit. Click a device or board to focus. Use the back arrow or Escape to reset.
5. Edit `room.mjs`, then run `node export.mjs` to regenerate the GLB.
6. Run `node validate.mjs` to check the exported format.

The preview loads the actual GLB. It is a minimal integration example, not a finished portfolio.
Music, galleries, case studies, accessible navigation and production loading/error UI still belong in the website implementation.
For live screens, remove the placeholder geometry in `room.mjs` and insert an aligned plane or R3F HTML surface.
