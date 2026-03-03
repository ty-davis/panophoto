# User-Created Templates + Z-Order Plan

## Overview

Three related features:
1. **Z-order controls** — move images forward/backward in the layer stack
2. **Freeform templates** — save any arbitrary layout (overlapping OK) as a reusable template
3. **Grid/tree templates** — build non-overlapping grid layouts with a visual split editor, fully compatible with programmatic gap controls

---

## Phase 1 — Z-order controls

### Types (`src/types/index.ts`)
No new fields needed. Array order in `panorama.placedImages` is the rendering order (index 0 = back, last = front). This is already the case; we just need functions to manipulate it.

### Functions (`src/composables/usePanorama.ts`)
Add four exports:
- `bringForward(imageId)` — swap with next element (if not already last)
- `sendBackward(imageId)` — swap with previous element (if not already first)
- `bringToFront(imageId)` — move to end of array
- `sendToBack(imageId)` — move to start of array

### UI (`src/components/PanoramaCanvas.vue`)
Add to the context-popover (hamburger menu), near the Crop button:
```
[ ↑ Bring Forward ]   [ ↓ Send Backward ]
```
Show only when there are ≥2 placed images. Disable Forward if image is already on top, Backward if already on bottom.

---

## Phase 2 — Custom template types

### New types (`src/types/index.ts`)

```ts
// Recursive split tree node for grid templates
type SplitNode =
  | { kind: 'slot'; id: string }
  | { kind: 'split'; dir: 'h' | 'v'; ratio: number; a: SplitNode; b: SplitNode }

// Extended Template for user-created templates
interface CustomTemplate extends Template {
  templateType: 'grid' | 'freeform'
  isCustom: true                       // distinguishes from built-ins
  tree?: SplitNode                     // grid type only
  // freeform type: slots field holds the stored positions directly
}
```

`generateSlots` for each type:
- **grid**: traverses `SplitNode` tree recursively applying outer margin + inner gap math (same px-based approach as built-ins)
- **freeform**: ignores `outerPx`/`innerPx`, returns stored `slots` fractions as-is

### Storage (`src/composables/useCustomTemplates.ts`)
- Stores `CustomTemplate[]` in localForage under key `"customTemplates"`
- Exports: `customTemplates: Ref<CustomTemplate[]>`, `saveCustomTemplate()`, `deleteCustomTemplate(id)`, `loadCustomTemplates()`
- On load, reconstructs `generateSlots` function from `templateType` + `tree`/`slots` (functions can't be serialized to JSON, so they're rebuilt on load)

---

## Phase 3 — Freeform template creation

### "Save as Template" button
- Appears in the frame controls row for any non-template frame that has ≥1 placed image in its x-range
- On click:
  1. Collect all `PlacedImage`s whose x-center falls within the frame's x-range
  2. Normalize each image's `{ x, y, width, height }` to fractions of the frame's canvas dimensions (accounting for vertical centering offset)
  3. Preserve array order as z-order
  4. Prompt user for a name (inline input or small modal)
  5. Save as `CustomTemplate` with `templateType: 'freeform'`

### Notes on freeform
- Gap controls are hidden in the template picker modal for freeform templates
- Slots can overlap — z-order in the slots array = render order (index 0 = back)
- When a freeform template is applied, images are placed using `coverFitToSlot` with the stored fractions (no gap math)
- Editing a saved freeform template: apply it to a slide, adjust images, then re-save (overwrite or save as new)

---

## Phase 4 — Grid template builder

### `TemplateBuilderModal.vue`
A new modal with:
1. **Aspect ratio picker** — choose which frame type (square, portrait, etc.) and how many frames (1–3)
2. **Visual split editor** — canvas showing the current slot layout
   - Click a slot → shows action bar: `Split ↔` | `Split ↕` | `Delete`
   - Split opens a ratio slider (default 50%)
   - Delete merges the slot back with its sibling (removes the parent split node)
3. **Name input** + **Save** button

### Split tree math
```
generateSlots(totalW, maxH, outerPx, innerPx):
  contentArea = { x: ox, y: oy, w: 1 - 2*ox, h: 1 - 2*oy }
  recurse(node, area):
    if node.kind === 'slot':
      return [{ id: node.id, ...area }]
    if node.dir === 'v':  // vertical split (left | right)
      leftW  = area.w * node.ratio - ix / 2
      rightW = area.w * (1 - node.ratio) - ix / 2
      leftArea  = { x: area.x, y: area.y, w: leftW,  h: area.h }
      rightArea = { x: area.x + area.w * node.ratio + ix/2, y: area.y, w: rightW, h: area.h }
      return [...recurse(node.a, leftArea), ...recurse(node.b, rightArea)]
    if node.dir === 'h':  // horizontal split (top | bottom)
      topH    = area.h * node.ratio - iy / 2
      bottomH = area.h * (1 - node.ratio) - iy / 2
      topArea    = { x: area.x, y: area.y, w: area.w, h: topH }
      bottomArea = { x: area.x, y: area.y + area.h * node.ratio + iy/2, w: area.w, h: bottomH }
      return [...recurse(node.a, topArea), ...recurse(node.b, bottomArea)]
```

Where `ox = outerPx/totalW`, `oy = outerPx/maxH`, `ix = innerPx/totalW`, `iy = innerPx/maxH`.

---

## Phase 5 — Template picker modal updates

- **"My Templates" section** at top of the template list (only shown if user has custom templates)
- Each custom template card has a **trash icon** to delete it
- **"New Grid Template"** button → opens `TemplateBuilderModal`
- **"Save Layout as Template"** button → visible on non-template frames with images (triggers freeform flow directly from modal)
- Gap controls hidden for freeform templates when one is selected
- Filter pills include custom templates in results

---

## Implementation order

```
zorder-type  →  zorder-fns  →  zorder-ui
custom-types  →  custom-storage  →  freeform-save
                               →  grid-builder
                               →  modal-custom (ties everything together)
```

---

## Open questions / decisions made

| Question | Decision |
|---|---|
| Editing a saved freeform template | Re-save approach: apply → adjust → save again |
| Z-order for freeform template slots | Array index = render order; first slot = back |
| Gap controls for freeform | Hidden in picker modal |
| Multi-frame custom templates | Supported for grid type (user picks N frames); freeform is single-frame only for now |
| Freeform creation when images span frames | Only images whose x-center is within the frame's range are captured |
