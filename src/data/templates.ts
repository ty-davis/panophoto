/**
 * Built-in template library.
 *
 * Slot coordinates (x, y, w, h) are fractions of the template's own combined
 * canvas dimensions (totalWidth × maxHeight).
 *
 * Each template exposes generateSlots(totalW, maxH, outerPx, innerPx) so gaps
 * are always equal in pixels regardless of canvas proportions. The static
 * `slots` field is pre-seeded with DEFAULT_OUTER_PX / DEFAULT_INNER_PX.
 */

import type { Template, TemplateSlot } from '@/types'
import { ASPECT_RATIOS } from '@/utils/aspectRatios'

const sq   = ASPECT_RATIOS.find(r => r.name === 'square')!
const port = ASPECT_RATIOS.find(r => r.name === 'portrait')!
const land = ASPECT_RATIOS.find(r => r.name === 'landscape')!
const stor = ASPECT_RATIOS.find(r => r.name === 'story')!

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

const singleFrameTemplates = (ar: typeof sq): Template[] => {
  const name = ar.label
  const tw = ar.width, mh = ar.height
  const O = DEFAULT_OUTER_PX, I = DEFAULT_INNER_PX

  return [
    { id: `${ar.name}-1-full`,  name: `${name} — Full`,
      frames: [{ aspectRatio: ar }], generateSlots: genFull,
      slots: genFull(tw, mh, O, I), printCompatible: true },

    { id: `${ar.name}-2-lr`,    name: `${name} — Left/Right`,
      frames: [{ aspectRatio: ar }], generateSlots: genLR,
      slots: genLR(tw, mh, O, I), printCompatible: true },

    { id: `${ar.name}-2-tb`,    name: `${name} — Top/Bottom`,
      frames: [{ aspectRatio: ar }], generateSlots: genTB,
      slots: genTB(tw, mh, O, I), printCompatible: true },

    { id: `${ar.name}-2-6040`,  name: `${name} — 60/40`,
      frames: [{ aspectRatio: ar }], generateSlots: gen6040,
      slots: gen6040(tw, mh, O, I), printCompatible: true },

    { id: `${ar.name}-3-cols`,  name: `${name} — 3 Columns`,
      frames: [{ aspectRatio: ar }], generateSlots: gen3Cols,
      slots: gen3Cols(tw, mh, O, I), printCompatible: true },

    { id: `${ar.name}-3-l2r`,   name: `${name} — Large Left + 2 Right`,
      frames: [{ aspectRatio: ar }], generateSlots: genL2R,
      slots: genL2R(tw, mh, O, I), printCompatible: true },

    { id: `${ar.name}-4-grid`,  name: `${name} — 2×2 Grid`,
      frames: [{ aspectRatio: ar }], generateSlots: gen2x2,
      slots: gen2x2(tw, mh, O, I), printCompatible: true },
  ]
}

// ── Multi-frame templates ─────────────────────────────────────────────────────

const multiFrameTemplates: Template[] = [
  { id: 'sq-sq-panorama', name: '2×Square — Full Panorama',
    frames: [{ aspectRatio: sq }, { aspectRatio: sq }],
    generateSlots: genFull,
    slots: genFull(sq.width*2, sq.height, DEFAULT_OUTER_PX, DEFAULT_INNER_PX) },

  { id: 'sq-sq-banner-2', name: '2×Square — Banner + 2 Below',
    frames: [{ aspectRatio: sq }, { aspectRatio: sq }],
    generateSlots: genBanner2,
    slots: genBanner2(sq.width*2, sq.height, DEFAULT_OUTER_PX, DEFAULT_INNER_PX) },

  { id: 'pt-pt-panorama', name: '2×Portrait — Full Panorama',
    frames: [{ aspectRatio: port }, { aspectRatio: port }],
    generateSlots: genFull,
    slots: genFull(port.width*2, port.height, DEFAULT_OUTER_PX, DEFAULT_INNER_PX) },

  { id: 'sq-sq-sq-panorama', name: '3×Square — Full Panorama',
    frames: [{ aspectRatio: sq }, { aspectRatio: sq }, { aspectRatio: sq }],
    generateSlots: genFull,
    slots: genFull(sq.width*3, sq.height, DEFAULT_OUTER_PX, DEFAULT_INNER_PX) },

  { id: 'sq-sq-sq-wide-flanks', name: '3×Square — Wide Center + Flanks',
    frames: [{ aspectRatio: sq }, { aspectRatio: sq }, { aspectRatio: sq }],
    generateSlots: gen3Cols,
    slots: gen3Cols(sq.width*3, sq.height, DEFAULT_OUTER_PX, DEFAULT_INNER_PX) },

  { id: 'land-land-panorama', name: '2×Landscape — Full Panorama',
    frames: [{ aspectRatio: land }, { aspectRatio: land }],
    generateSlots: genFull,
    slots: genFull(land.width*2, land.height, DEFAULT_OUTER_PX, DEFAULT_INNER_PX) },

  { id: 'land-sq-split', name: 'Landscape + Square',
    frames: [{ aspectRatio: land }, { aspectRatio: sq }],
    generateSlots: genLR,
    slots: genLR(land.width+sq.width, Math.max(land.height, sq.height), DEFAULT_OUTER_PX, DEFAULT_INNER_PX) },
]

export const TEMPLATES: Template[] = [
  ...singleFrameTemplates(sq),
  ...singleFrameTemplates(port),
  ...singleFrameTemplates(land),
  ...singleFrameTemplates(stor),
  ...multiFrameTemplates,
]
