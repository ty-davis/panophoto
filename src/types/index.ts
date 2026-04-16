export interface AspectRatio {
  name: string
  ratio: number
  width: number
  height: number
  label: string
}

export interface ImageItem {
  id: string
  file: File
  url: string
  thumbnail?: string
  width: number
  height: number
}

export interface ImageCrop {
  left:   number  // fraction 0–1 inset from left edge
  top:    number
  right:  number  // fraction 0–1 inset from right edge
  bottom: number
}

// ── Template types ────────────────────────────────────────────────────────────

export interface TemplateSlot {
  id: string
  x: number  // fraction of template totalWidth
  y: number  // fraction of template maxHeight
  w: number
  h: number
}

// ── Custom template types ─────────────────────────────────────────────────────

/** Recursive split tree for grid templates. */
export type SplitNode =
  | { kind: 'slot'; id: string }
  | { kind: 'split'; dir: 'h' | 'v'; ratio: number; a: SplitNode; b: SplitNode }

export interface Template {
  id: string
  name: string
  frames: Array<{ aspectRatio: AspectRatio }>
  slots: TemplateSlot[]
  generateSlots: (totalW: number, maxH: number, outerPx: number, innerPx: number) => TemplateSlot[]
  isCustom?: boolean
  templateType?: 'grid' | 'freeform'
  tree?: SplitNode  // grid templates only
  printCompatible?: boolean  // true for single-frame templates suitable for print mode
}

/**
 * Canvas-space slot rect stored on a PlacedImage when in template mode.
 * Stays fixed while the image moves freely behind it.
 */
export interface TemplateSlotBinding {
  templateGroupId: string  // shared by all frames from the same template application
  slotId: string
  slotX: number   // canvas-space pixels
  slotY: number
  slotW: number
  slotH: number
}

// ── Image types ───────────────────────────────────────────────────────────────

export interface PlacedImage {
  imageId: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scale: number
  crop?: ImageCrop
  slotBinding?: TemplateSlotBinding  // present only when frame is in template mode
}

/** Returns the visible (cropped) rect in canvas-space coordinates. */
export function getVisibleRect(img: PlacedImage): { x: number; y: number; w: number; h: number } {
  const c = img.crop
  if (!c) return { x: img.x, y: img.y, w: img.width, h: img.height }
  return {
    x: img.x + c.left   * img.width,
    y: img.y + c.top    * img.height,
    w: img.width  * (1 - c.left - c.right),
    h: img.height * (1 - c.top  - c.bottom),
  }
}

export interface Frame {
  id: string
  aspectRatio: AspectRatio
  xOffset: number
  templateMode: boolean
  templateGroupId?: string
  templateId?: string
  templateSlots?: TemplateSlotBinding[]
  templateOuterPx?: number
  templateInnerPx?: number
}

export interface Panorama {
  id: string
  frames: Frame[]
  placedImages: PlacedImage[]
  backgroundColor: string
  totalWidth: number
  maxHeight: number
}

export interface ExportOptions {
  format: 'png' | 'jpeg'
  quality: number
}

// ── Print types ───────────────────────────────────────────────────────────────

export interface PrintSize {
  name: string
  label: string          // e.g. '4×6 Portrait'
  widthIn: number        // physical width in inches
  heightIn: number       // physical height in inches
  dpi: number
}

/** Convert a PrintSize to a pixel-based AspectRatio for use with the canvas engine. */
export function printSizeToAspectRatio(size: PrintSize): AspectRatio {
  return {
    name: size.name,
    label: size.label,
    ratio: size.widthIn / size.heightIn,
    width:  Math.round(size.widthIn  * size.dpi),
    height: Math.round(size.heightIn * size.dpi),
  }
}
