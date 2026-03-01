/**
 * Built-in template library.
 *
 * Slot coordinates (x, y, w, h) are fractions of the template's own combined
 * canvas dimensions (totalWidth × maxHeight), computed as:
 *   totalWidth = sum of all frame widths
 *   maxHeight  = max frame height
 *
 * All dimensions use the standard 1080px-wide frame unit from aspectRatios.ts.
 * A gutter of G=0.02 (2%) is used between/around slots.
 */

import type { Template } from '@/types'
import { ASPECT_RATIOS } from '@/utils/aspectRatios'

const sq   = ASPECT_RATIOS.find(r => r.name === 'square')!
const port = ASPECT_RATIOS.find(r => r.name === 'portrait')!
const land = ASPECT_RATIOS.find(r => r.name === 'landscape')!
const stor = ASPECT_RATIOS.find(r => r.name === 'story')!

const G = 0.02  // gutter fraction

// ── Single-frame templates ────────────────────────────────────────────────────

const singleFrameTemplates = (ar: typeof sq): Template[] => {
  const name = ar.label

  return [
    // 1-slot: full frame
    {
      id: `${ar.name}-1-full`,
      name: `${name} — Full`,
      frames: [{ aspectRatio: ar }],
      slots: [{ id: 's1', x: G, y: G, w: 1 - 2*G, h: 1 - 2*G }],
    },

    // 2-slot: left / right halves
    {
      id: `${ar.name}-2-lr`,
      name: `${name} — Left/Right`,
      frames: [{ aspectRatio: ar }],
      slots: [
        { id: 's1', x: G,           y: G, w: 0.5 - 1.5*G, h: 1 - 2*G },
        { id: 's2', x: 0.5 + 0.5*G, y: G, w: 0.5 - 1.5*G, h: 1 - 2*G },
      ],
    },

    // 2-slot: top / bottom halves
    {
      id: `${ar.name}-2-tb`,
      name: `${name} — Top/Bottom`,
      frames: [{ aspectRatio: ar }],
      slots: [
        { id: 's1', x: G, y: G,           w: 1 - 2*G, h: 0.5 - 1.5*G },
        { id: 's2', x: G, y: 0.5 + 0.5*G, w: 1 - 2*G, h: 0.5 - 1.5*G },
      ],
    },

    // 2-slot: 60/40 left/right
    {
      id: `${ar.name}-2-6040`,
      name: `${name} — 60/40`,
      frames: [{ aspectRatio: ar }],
      slots: [
        { id: 's1', x: G,           y: G, w: 0.60 - 1.5*G, h: 1 - 2*G },
        { id: 's2', x: 0.60 + 0.5*G, y: G, w: 0.40 - 1.5*G, h: 1 - 2*G },
      ],
    },

    // 3-slot: three columns
    {
      id: `${ar.name}-3-cols`,
      name: `${name} — 3 Columns`,
      frames: [{ aspectRatio: ar }],
      slots: [
        { id: 's1', x: G,                    y: G, w: (1 - 4*G)/3, h: 1 - 2*G },
        { id: 's2', x: G + (1-4*G)/3 + G,    y: G, w: (1 - 4*G)/3, h: 1 - 2*G },
        { id: 's3', x: G + 2*((1-4*G)/3+G),  y: G, w: (1 - 4*G)/3, h: 1 - 2*G },
      ],
    },

    // 3-slot: large left + 2 stacked right
    {
      id: `${ar.name}-3-l2r`,
      name: `${name} — Large Left + 2 Right`,
      frames: [{ aspectRatio: ar }],
      slots: [
        { id: 's1', x: G,           y: G,           w: 0.60 - 1.5*G, h: 1 - 2*G },
        { id: 's2', x: 0.60 + 0.5*G, y: G,           w: 0.40 - 1.5*G, h: 0.5 - 1.5*G },
        { id: 's3', x: 0.60 + 0.5*G, y: 0.5 + 0.5*G, w: 0.40 - 1.5*G, h: 0.5 - 1.5*G },
      ],
    },

    // 4-slot: 2×2 grid
    {
      id: `${ar.name}-4-grid`,
      name: `${name} — 2×2 Grid`,
      frames: [{ aspectRatio: ar }],
      slots: [
        { id: 's1', x: G,           y: G,           w: 0.5 - 1.5*G, h: 0.5 - 1.5*G },
        { id: 's2', x: 0.5 + 0.5*G, y: G,           w: 0.5 - 1.5*G, h: 0.5 - 1.5*G },
        { id: 's3', x: G,           y: 0.5 + 0.5*G, w: 0.5 - 1.5*G, h: 0.5 - 1.5*G },
        { id: 's4', x: 0.5 + 0.5*G, y: 0.5 + 0.5*G, w: 0.5 - 1.5*G, h: 0.5 - 1.5*G },
      ],
    },
  ]
}

// ── Multi-frame templates ─────────────────────────────────────────────────────
//
// For multi-frame templates the combined canvas is:
//   totalWidth = frame1.width + frame2.width + ...
//   maxHeight  = max(frame1.height, frame2.height, ...)
//
// Slot coords are fractions of that combined canvas.

const multiFrameTemplates: Template[] = [

  // 2×square: single panorama slot spanning both frames
  {
    id: 'sq-sq-panorama',
    name: '2×Square — Full Panorama',
    frames: [{ aspectRatio: sq }, { aspectRatio: sq }],
    slots: [{ id: 's1', x: G, y: G, w: 1 - 2*G, h: 1 - 2*G }],
  },

  // 2×square: panorama top strip + 2 portrait slots bottom
  {
    id: 'sq-sq-banner-2',
    name: '2×Square — Banner + 2 Below',
    frames: [{ aspectRatio: sq }, { aspectRatio: sq }],
    slots: [
      { id: 's1', x: G,           y: G,           w: 1 - 2*G,     h: 0.5 - 1.5*G },
      { id: 's2', x: G,           y: 0.5 + 0.5*G, w: 0.5 - 1.5*G, h: 0.5 - 1.5*G },
      { id: 's3', x: 0.5 + 0.5*G, y: 0.5 + 0.5*G, w: 0.5 - 1.5*G, h: 0.5 - 1.5*G },
    ],
  },

  // 2×portrait: panorama spanning both
  {
    id: 'pt-pt-panorama',
    name: '2×Portrait — Full Panorama',
    frames: [{ aspectRatio: port }, { aspectRatio: port }],
    slots: [{ id: 's1', x: G, y: G, w: 1 - 2*G, h: 1 - 2*G }],
  },

  // 3×square: single panorama spanning all 3
  {
    id: 'sq-sq-sq-panorama',
    name: '3×Square — Full Panorama',
    frames: [{ aspectRatio: sq }, { aspectRatio: sq }, { aspectRatio: sq }],
    slots: [{ id: 's1', x: G, y: G, w: 1 - 2*G, h: 1 - 2*G }],
  },

  // 3×square: wide center panorama + portrait flanks
  {
    id: 'sq-sq-sq-wide-flanks',
    name: '3×Square — Wide Center + Flanks',
    frames: [{ aspectRatio: sq }, { aspectRatio: sq }, { aspectRatio: sq }],
    slots: [
      // left flank: first 1/3
      { id: 's1', x: G,                   y: G, w: (1/3) - 1.5*G, h: 1 - 2*G },
      // center: middle 1/3
      { id: 's2', x: (1/3) + 0.5*G,       y: G, w: (1/3) - G,     h: 1 - 2*G },
      // right flank: last 1/3
      { id: 's3', x: (2/3) + 0.5*G,       y: G, w: (1/3) - 1.5*G, h: 1 - 2*G },
    ],
  },

  // 2×landscape: panorama spanning both
  {
    id: 'land-land-panorama',
    name: '2×Landscape — Full Panorama',
    frames: [{ aspectRatio: land }, { aspectRatio: land }],
    slots: [{ id: 's1', x: G, y: G, w: 1 - 2*G, h: 1 - 2*G }],
  },

  // landscape + square: wide photo left, square right
  {
    id: 'land-sq-split',
    name: 'Landscape + Square',
    frames: [{ aspectRatio: land }, { aspectRatio: sq }],
    slots: [
      { id: 's1', x: G,                     y: G, w: land.width/(land.width+sq.width) - 1.5*G, h: 1 - 2*G },
      { id: 's2', x: land.width/(land.width+sq.width) + 0.5*G, y: G, w: sq.width/(land.width+sq.width) - 1.5*G, h: 1 - 2*G },
    ],
  },
]

export const TEMPLATES: Template[] = [
  ...singleFrameTemplates(sq),
  ...singleFrameTemplates(port),
  ...singleFrameTemplates(land),
  ...singleFrameTemplates(stor),
  ...multiFrameTemplates,
]
