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

/**
 * A single placeholder slot within a Template.
 * x/y/w/h are fractions of the template's own combined canvas
 * (templateTotalWidth × templateMaxHeight), so slots can span frame boundaries.
 */
export interface TemplateSlot {
  id: string
  x: number  // fraction of template totalWidth
  y: number  // fraction of template maxHeight
  w: number
  h: number
}

/**
 * Unified template type — works for single-frame and multi-frame templates.
 * frames.length === 1 for a single-frame template.
 * Slots with w > (1/frames.length) span multiple frames.
 */
export interface Template {
  id: string
  name: string
  frames: Array<{ aspectRatio: AspectRatio }>
  slots: TemplateSlot[]
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
  templateMode: boolean            // is this frame in template mode?
  templateGroupId?: string         // shared id for all frames from the same template application
  templateId?: string              // which Template was applied
  templateSlots?: TemplateSlotBinding[]  // canvas-space slot rects snapshot at apply-time
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
