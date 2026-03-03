# Template Gap Size Feature

## Problem & Approach
Templates currently use a hardcoded `G = 0.02` gutter **fraction** of the combined canvas width.
This causes unequal pixel margins on multi-frame templates — the left/right margin is wider than
top/bottom because the combined canvas is wider than it is tall.

We will switch to **pixel-based** gaps so margins are always equal regardless of canvas proportions.
Two separate controls: **Outer Margin** (canvas edge → slot) and **Inner Gap** (slot ↔ slot).

## Key Design Decisions
- Unit: pixels (displayed and stored as px integers)
- Default: outerPx = 20, innerPx = 10  (≈ current G on a 1080px single-frame canvas)
- Slider range: 0–60 px, step 1
- Outer margin and inner gap are separate controls
- Gap can be changed after apply: button reads "Update Template" when a template already exists
- Changes only take effect on "Use Template" / "Update Template" click
- TemplateMiniPreview updates live as sliders move
- Gap values stored on Frame (templateOuterPx, templateInnerPx) so modal re-opens with current values

## Files to Change

1. **`src/types/index.ts`**
   - Add `generateSlots(totalW, maxH, outerPx, innerPx): TemplateSlot[]` to `Template` interface
   - Add `templateOuterPx?: number`, `templateInnerPx?: number` to `Frame` interface

2. **`src/data/templates.ts`**
   - Export `DEFAULT_OUTER_PX = 20`, `DEFAULT_INNER_PX = 10`
   - Rewrite all slot math using px→fraction conversion (ox = outerPx/totalW, etc.)
   - Each template definition gets a `generateSlots` function
   - `slots` on each Template is seeded by calling `generateSlots` with defaults

3. **`src/composables/useTemplateMode.ts`**
   - `applyTemplate` options: add `outerPx`, `innerPx`
   - Regenerate slots via `template.generateSlots(totalW, maxH, outerPx, innerPx)` instead of using baked-in `template.slots`
   - Store outerPx/innerPx on each new Frame as `templateOuterPx`/`templateInnerPx`

4. **`src/components/TemplatePickerModal.vue`**
   - Two new controls below Aspect filter: Outer Margin (slider + number input) and Inner Gap (slider + number input)
   - Init from `frame.templateOuterPx/InnerPx` or defaults when modal opens
   - Pass `outerPx`/`innerPx` through `emit('apply', templateId, insertIndex, outerPx, innerPx)`
   - Button text: "Update Template" if `activeTemplate` exists, "Use Template" otherwise

5. **`src/components/TemplateMiniPreview.vue`**
   - Accept `outerPx` and `innerPx` props (optional, default to DEFAULT values)
   - Call `template.generateSlots(CANVAS_W, canvasH, outerPx, innerPx)` for drawing
   - Live preview updates as sliders change

6. **`src/components/PanoramaCanvas.vue`**
   - `handleTemplateApply` receives and forwards `outerPx`/`innerPx` to `applyTemplate`
