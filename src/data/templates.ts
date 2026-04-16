/**
 * Built-in template library.
 *
 * Templates are layout-only: they carry no fixed aspect ratio or frame count.
 * Slot coords (x, y, w, h) are fractions of (totalW × maxH), which at apply
 * time come from the current frame's own pixel dimensions.
 *
 * The static `slots` field is pre-seeded at TEMPLATE_PREVIEW_SIZE for use by
 * TemplateMiniPreview and the template builder — those are display-only values.
 */

import type { Template, TemplateSlot } from '@/types'

/** Canonical size used only for slot pre-seeding / preview rendering. */
export const TEMPLATE_PREVIEW_SIZE = 600

export const DEFAULT_OUTER_PX = 20
export const DEFAULT_INNER_PX = 10

/** Convert pixel gap values to fractional coords for a given canvas size. */
function g(totalW: number, maxH: number, outerPx: number, innerPx: number) {
  return {
    ox: outerPx / totalW,
    oy: outerPx / maxH,
    ix: innerPx / totalW,
    iy: innerPx / maxH,
  }
}

// ── Slot layout generators ────────────────────────────────────────────────────

function genFull(totalW: number, maxH: number, outerPx: number, innerPx: number): TemplateSlot[] {
  const { ox, oy } = g(totalW, maxH, outerPx, innerPx)
  return [{ id: 's1', x: ox, y: oy, w: 1-2*ox, h: 1-2*oy }]
}

function genLR(totalW: number, maxH: number, outerPx: number, innerPx: number): TemplateSlot[] {
  const { ox, oy, ix } = g(totalW, maxH, outerPx, innerPx)
  const sw = (1 - 2*ox - ix) / 2
  return [
    { id: 's1', x: ox,      y: oy, w: sw, h: 1-2*oy },
    { id: 's2', x: ox+sw+ix, y: oy, w: sw, h: 1-2*oy },
  ]
}

function genTB(totalW: number, maxH: number, outerPx: number, innerPx: number): TemplateSlot[] {
  const { ox, oy, iy } = g(totalW, maxH, outerPx, innerPx)
  const sh = (1 - 2*oy - iy) / 2
  return [
    { id: 's1', x: ox, y: oy,      w: 1-2*ox, h: sh },
    { id: 's2', x: ox, y: oy+sh+iy, w: 1-2*ox, h: sh },
  ]
}

function gen6040(totalW: number, maxH: number, outerPx: number, innerPx: number): TemplateSlot[] {
  const { ox, oy, ix } = g(totalW, maxH, outerPx, innerPx)
  const cw = 1 - 2*ox - ix
  return [
    { id: 's1', x: ox,           y: oy, w: 0.6*cw, h: 1-2*oy },
    { id: 's2', x: ox+0.6*cw+ix, y: oy, w: 0.4*cw, h: 1-2*oy },
  ]
}

function gen3Cols(totalW: number, maxH: number, outerPx: number, innerPx: number): TemplateSlot[] {
  const { ox, oy, ix } = g(totalW, maxH, outerPx, innerPx)
  const sw = (1 - 2*ox - 2*ix) / 3
  return [
    { id: 's1', x: ox,           y: oy, w: sw, h: 1-2*oy },
    { id: 's2', x: ox+sw+ix,     y: oy, w: sw, h: 1-2*oy },
    { id: 's3', x: ox+2*(sw+ix), y: oy, w: sw, h: 1-2*oy },
  ]
}

function genL2R(totalW: number, maxH: number, outerPx: number, innerPx: number): TemplateSlot[] {
  const { ox, oy, ix, iy } = g(totalW, maxH, outerPx, innerPx)
  const cw = 1 - 2*ox - ix
  const sh = (1 - 2*oy - iy) / 2
  return [
    { id: 's1', x: ox,           y: oy,       w: 0.6*cw,  h: 1-2*oy },
    { id: 's2', x: ox+0.6*cw+ix, y: oy,       w: 0.4*cw,  h: sh },
    { id: 's3', x: ox+0.6*cw+ix, y: oy+sh+iy, w: 0.4*cw,  h: sh },
  ]
}

function gen2x2(totalW: number, maxH: number, outerPx: number, innerPx: number): TemplateSlot[] {
  const { ox, oy, ix, iy } = g(totalW, maxH, outerPx, innerPx)
  const sw = (1 - 2*ox - ix) / 2
  const sh = (1 - 2*oy - iy) / 2
  return [
    { id: 's1', x: ox,      y: oy,      w: sw, h: sh },
    { id: 's2', x: ox+sw+ix, y: oy,      w: sw, h: sh },
    { id: 's3', x: ox,      y: oy+sh+iy, w: sw, h: sh },
    { id: 's4', x: ox+sw+ix, y: oy+sh+iy, w: sw, h: sh },
  ]
}

function genBanner2(totalW: number, maxH: number, outerPx: number, innerPx: number): TemplateSlot[] {
  const { ox, oy, ix, iy } = g(totalW, maxH, outerPx, innerPx)
  const rh = (1 - 2*oy - iy) / 2
  const sw = (1 - 2*ox - ix) / 2
  return [
    { id: 's1', x: ox,      y: oy,       w: 1-2*ox, h: rh },
    { id: 's2', x: ox,      y: oy+rh+iy, w: sw,     h: rh },
    { id: 's3', x: ox+sw+ix, y: oy+rh+iy, w: sw,     h: rh },
  ]
}

// ── Single-frame templates ────────────────────────────────────────────────────

const P = TEMPLATE_PREVIEW_SIZE
const O = DEFAULT_OUTER_PX
const I = DEFAULT_INNER_PX

export const TEMPLATES: Template[] = [
  {
    id: 'layout-full',
    name: 'Full',
    frames: [],
    generateSlots: genFull,
    slots: genFull(P, P, O, I),
  },
  {
    id: 'layout-lr',
    name: 'Left / Right',
    frames: [],
    generateSlots: genLR,
    slots: genLR(P, P, O, I),
  },
  {
    id: 'layout-tb',
    name: 'Top / Bottom',
    frames: [],
    generateSlots: genTB,
    slots: genTB(P, P, O, I),
  },
  {
    id: 'layout-6040',
    name: '60 / 40 Split',
    frames: [],
    generateSlots: gen6040,
    slots: gen6040(P, P, O, I),
  },
  {
    id: 'layout-3cols',
    name: '3 Columns',
    frames: [],
    generateSlots: gen3Cols,
    slots: gen3Cols(P, P, O, I),
  },
  {
    id: 'layout-l2r',
    name: 'Large Left + 2 Right',
    frames: [],
    generateSlots: genL2R,
    slots: genL2R(P, P, O, I),
  },
  {
    id: 'layout-2x2',
    name: '2×2 Grid',
    frames: [],
    generateSlots: gen2x2,
    slots: gen2x2(P, P, O, I),
  },
  {
    id: 'layout-banner2',
    name: 'Banner + 2 Below',
    frames: [],
    generateSlots: genBanner2,
    slots: genBanner2(P, P, O, I),
  },
]
