# Templates Feature — Implementation Plan

## Problem Statement

Add a template system to PanoPhoto. A **Template** defines one or more frames (aspect ratios) plus one or more fixed-position placeholder slots (gray boxes in canvas space) that can span across frame boundaries. Templates ship with the app in code; user-saved templates come later.

When a frame (or group of frames) is in **Template Mode**, placeholder slots are fixed in canvas space and images move freely behind them (inverse of the current crop model). In **Standard Mode**, the current crop-fraction model applies.

---

## Data Model Changes

### New types (`src/types/index.ts`)

```ts
/**
 * A single placeholder slot, normalized to the template's own combined canvas.
 * x/y/w/h are fractions of (templateTotalWidth × templateMaxHeight).
 * A slot spanning 2 frames in a 3-frame template might have x=0, w=0.667.
 */
export interface TemplateSlot {
  id: string
  x: number   // fraction of template totalWidth
  y: number   // fraction of template maxHeight
  w: number
  h: number
}

/**
 * Unified template type — works for single-frame and multi-frame templates.
 * Single-frame: frames.length === 1 (a "FrameTemplate" is just this with one frame).
 * Multi-frame: frames.length > 1, slots may span frame boundaries.
 */
export interface Template {
  id: string
  name: string
  frames: Array<{ aspectRatio: AspectRatio }>  // ordered list of frames
  slots: TemplateSlot[]
}

/** Canvas-space slot rect stored on PlacedImage when in template mode. */
export interface TemplateSlotBinding {
  templateGroupId: string  // id shared by all frames inserted from the same template application
  slotId: string
  slotX: number   // canvas-space pixels
  slotY: number
  slotW: number
  slotH: number
}
```

> **Slot coordinate conversion:** When a template is applied starting at `xOffset`, canvas-space slot coords are:
> `slotX = xOffset + slot.x * templateTotalWidth`, `slotY = slot.y * templateMaxHeight`, etc.

### Changes to `Frame`

```ts
export interface Frame {
  id: string
  aspectRatio: AspectRatio
  xOffset: number
  templateMode: boolean           // NEW
  templateGroupId?: string        // NEW: shared id for all frames from the same template application
  templateId?: string             // NEW: which Template was applied
  templateSlots?: TemplateSlot[]  // NEW: snapshot of slots at apply-time (canvas-space)
}
```

### Changes to `PlacedImage`

```ts
export interface PlacedImage {
  // ... existing fields ...
  slotBinding?: TemplateSlotBinding  // NEW: present only in template mode
}
```

---

## Built-in Template Library (`src/data/templates.ts`)

Single file exporting `TEMPLATES: Template[]`, organized by frame count and slot count:

**Single-frame templates (frames.length === 1):**
- 1 slot: full-frame, centered square, centered portrait strip
- 2 slots: left/right halves, top/bottom halves, 60/40 split
- 3 slots: 3 columns, 1 large left + 2 stacked right
- 4 slots: 2×2 grid

**Multi-frame templates (frames.length > 1) — cross-frame panorama slots:**
- 2-frame: single full-width panorama slot spanning both frames
- 2-frame: full-width panorama top + 2 portrait slots bottom (one per frame)
- 3-frame: single panorama slot spanning all 3 frames
- 3-frame: wide center + portrait left + portrait right

All slot coordinates are normalized fractions with small gutters (~0.02).

---

## Template Mode vs Standard Mode

### What changes when switching to Template Mode (apply template)

1. New frames inserted at chosen position; each gets `templateMode: true`, `templateGroupId`, `templateId`, `templateSlots` snapshot (converted to canvas-space pixels at apply-time).
2. Any `PlacedImage` already in those frame areas → assign to best-matching slot, compute `slotBinding` + recompute `crop`.
3. Frame borders turn **green** in overlay for all frames sharing the `templateGroupId`.
4. Aspect ratio dropdown shows `"Template"` (disabled).

### What changes when switching to Standard Mode

1. All frames in `templateGroupId` group get `templateMode: false`, template fields cleared.
2. Each `PlacedImage` with `slotBinding` → convert canvas-space slot rect to crop fractions relative to current image pos/size, remove `slotBinding`.
3. Frame borders return to **blue**.
4. Aspect ratio dropdowns show actual aspect ratio names.

### Image movement in Template Mode

When the user moves or resizes a `PlacedImage` that has a `slotBinding`:
- `slotBinding` rect stays fixed in canvas space.
- Image `x/y/width/height` update freely.
- `crop` fractions are recomputed after every move/resize:
  ```
  crop.left   = max(0, slotX - img.x) / img.width
  crop.top    = max(0, slotY - img.y) / img.height
  crop.right  = max(0, (img.x + img.width)  - (slotX + slotW)) / img.width
  crop.bottom = max(0, (img.y + img.height) - (slotY + slotH)) / img.height
  ```
- Image is clamped so it always fully covers the slot (min size = slot size).

---

## UI / Interaction

### Frame control chip (`PanoramaCanvas.vue`)

- Aspect ratio `<select>`: add a synthetic disabled `"Template"` option shown when `frame.templateMode`. When user selects a real ratio while in template mode, confirmation dialog: *"Changing the aspect ratio will exit Template Mode. Image positions may shift. Continue?"* → on confirm: switch all frames in group to Standard Mode, then change ratio.
- A small **template icon button** (`fa-table-cells`) sits next to the `<select>`. Clicking it opens the Template Picker Modal targeting that frame's position. Highlighted blue when `frame.templateMode` is active.
- For frames that are part of a multi-frame template group, the chip for each frame in the group shows the template button highlighted. Exiting template mode via the confirmation dialog exits the whole group.
- **Checkbox for multi-frame selection**: each frame chip shows a checkbox on hover (desktop) or long-press (mobile). Checking it adds the frame to the selected set. Checkboxes are only available when the frame is in Standard Mode.

### Multi-frame selection action bar

When 2+ frames are checked, a floating action bar appears above the selected chips (or as a sticky bottom bar on mobile) showing:
- Selected frame count ("2 frames selected")
- **Apply Template** button → opens Template Picker Modal in multi-frame mode
- **Clear selection** ×

### Template Picker Modal (`TemplatePickerModal.vue`) — NEW component

- Context passed in: `insertAfterFrameIndex` (insertion position, single-frame) OR `selectedFrameIds: string[]` (multi-frame selection).
- **Filter bar**: frame count pills (Any, 1, 2, 3+) + slot count pills (Any, 1, 2, 3, 4+) + aspect ratio pills (All, 1:1, 4:5, 16:9, 9:16).
- **Template grid**: canvas-rendered thumbnail previews (~200px wide), showing gray slot boxes on white background. Multi-frame templates render all frames in a row.
  - When opened from a multi-frame selection, each card shows a badge: *"Needs 3 frames"* or *"Matches!"* (green) when `template.frames.length === selectedFrameIds.length`.
- **Footer**: Cancel + "Use Template" button (disabled until selection made).
- On "Use Template":
  - If `template.frames.length !== selectedFrameIds.length`: ConfirmModal *"This will add/remove frames to match the template (N total). Continue?"*
  - If any affected frame has placed images → ConfirmModal about image removal.
  - **Frame count adjustment**: if template needs more frames, insert new frames adjacent to the selection; if fewer, remove the rightmost excess selected frames.
  - Apply template to resulting frame group.

### Canvas rendering changes

- **Gray placeholder boxes**: when a slot has no assigned image, render light gray filled rect + dashed border + centered image icon.
- **Green selection border**: selected image with `slotBinding` → overlay outline `#48bb78` instead of `#4299e1`.
- **Green frame dashes**: `frame.templateMode` → dashed frame border changes to green.
- **Slot hover highlight**: dragging from tray over a template slot → blue tint on that slot.

### Drag-drop to slot assignment

- Drop on a template-mode frame: find nearest unfilled slot by proximity of drop point to slot center.
- Assign: compute cover-fit `x/y/width/height` (image AR preserved, covers slot completely), compute `slotBinding`, compute initial `crop` fractions.
- If slot already filled: replace (old image removed from `placedImages`).

---

## Persistence

All new fields (`slotBinding`, `templateMode`, `templateGroupId`, etc.) are plain objects — fully serializable. No changes needed to `usePersistence.ts`.

---

## New Files

| File | Purpose |
|---|---|
| `src/data/templates.ts` | Single unified built-in template list |
| `src/components/TemplatePickerModal.vue` | Template selection modal |
| `src/composables/useTemplateMode.ts` | applyTemplate, exitTemplateMode, recomputeSlotCrop |

## Modified Files

| File | Changes |
|---|---|
| `src/types/index.ts` | New interfaces, updated Frame + PlacedImage |
| `src/components/PanoramaCanvas.vue` | Green border, slot placeholders, slot drag-drop, template button in chip |
| `src/composables/useCanvas.ts` | Render placeholder slots, green frame dashes |
| `src/composables/useImageInteraction.ts` | Recompute crop on move/resize when slotBinding present; clamp to cover slot |

---

## Sequencing

1. **Data layer**: new types + `src/data/templates.ts`
2. **`useTemplateMode.ts`**: apply/exit helpers, `recomputeSlotCrop` math, cover-fit placement
3. **Rendering**: slot placeholder boxes, green frame dashes, green selection border
4. **Frame chip UX**: template button + highlight, disabled "Template" option, AR-change confirmation, hover/long-press checkbox
5. **Multi-frame selection action bar**: floating bar with frame count + Apply Template + clear
6. **`TemplatePickerModal.vue`**: filter bar + template grid + "Needs N frames" badges + footer + frame-count adjustment logic
7. **Drag-drop to slot**: nearest-slot resolution, cover-fit, slot hover highlight
8. **Mode switching**: Standard ↔ Template Mode via hamburger menu (exits full group)

---

## Open Questions / Future Work

- User-saved templates (save from existing frame/project) — deferred
- Template thumbnail caching (pre-render to `<canvas>`)
- Reorder frames (drag chips to reorder) — would need to update all slotBinding canvas-space coords for affected template groups

