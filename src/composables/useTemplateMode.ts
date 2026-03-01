/**
 * useTemplateMode
 *
 * Helpers for applying / exiting Template Mode on a group of frames.
 *
 * Key concepts:
 *  - A Template's slot coords are fractions of the template's own combined canvas.
 *  - When applied at a given xOffset, slot canvas-space coords are:
 *      slotX = xOffset + slot.x * templateTotalWidth
 *      slotY = slot.y  * templateMaxHeight
 *  - In Template Mode, crop fractions are recomputed after every move/resize
 *    so the *visible* area stays anchored to the fixed canvas-space slot rect.
 *  - templateSlots on Frame stores the canvas-space TemplateSlotBinding snapshots.
 */

import { generateId } from '@/utils/imageUtils'
import type { Template, Frame, PlacedImage, Panorama, TemplateSlotBinding, ImageCrop } from '@/types'

// ── Math helpers ──────────────────────────────────────────────────────────────

/** Recompute crop fractions so the visible area stays anchored to the slot rect. */
export function recomputeSlotCrop(img: PlacedImage): ImageCrop {
  const b = img.slotBinding!
  return {
    left:   Math.max(0, (b.slotX - img.x) / img.width),
    top:    Math.max(0, (b.slotY - img.y) / img.height),
    right:  Math.max(0, (img.x + img.width  - (b.slotX + b.slotW)) / img.width),
    bottom: Math.max(0, (img.y + img.height - (b.slotY + b.slotH)) / img.height),
  }
}

/**
 * Given a slot rect, compute initial x/y/width/height for an image so that it
 * cover-fits the slot (AR preserved, image fills the slot completely).
 */
export function coverFitToSlot(
  imageNaturalW: number, imageNaturalH: number,
  slotX: number, slotY: number, slotW: number, slotH: number,
): { x: number; y: number; width: number; height: number } {
  const imageAR = imageNaturalW / imageNaturalH
  const slotAR  = slotW / slotH

  let width: number, height: number
  if (imageAR > slotAR) {
    // image is wider than slot — fit by height
    height = slotH
    width  = height * imageAR
  } else {
    // image is taller than slot — fit by width
    width  = slotW
    height = width / imageAR
  }

  // Center the image on the slot
  const x = slotX + (slotW - width)  / 2
  const y = slotY + (slotH - height) / 2
  return { x, y, width, height }
}

// ── Template dimensions ───────────────────────────────────────────────────────

export function templateDimensions(template: Template): { totalWidth: number; maxHeight: number } {
  let totalWidth = 0
  let maxHeight  = 0
  for (const f of template.frames) {
    totalWidth += f.aspectRatio.width
    if (f.aspectRatio.height > maxHeight) maxHeight = f.aspectRatio.height
  }
  return { totalWidth, maxHeight }
}

/** Convert template-relative slot fractions → canvas-space pixel rects. */
export function slotsToCanvasSpace(
  template: Template,
  insertXOffset: number,
): TemplateSlotBinding[] {
  const { totalWidth, maxHeight } = templateDimensions(template)
  return template.slots.map(slot => ({
    templateGroupId: '',  // filled in by applyTemplate
    slotId: slot.id,
    slotX: insertXOffset + slot.x * totalWidth,
    slotY: slot.y * maxHeight,
    slotW: slot.w * totalWidth,
    slotH: slot.h * maxHeight,
  }))
}

// ── Apply template ────────────────────────────────────────────────────────────

export interface ApplyTemplateOptions {
  panorama: Panorama
  template: Template
  /** Index in panorama.frames before which the new frames are inserted (or replaced). */
  insertIndex: number
  /**
   * If provided, these existing frame IDs are replaced by the template frames.
   * Frames will be added or removed to match template.frames.length.
   */
  replaceFrameIds?: string[]
}

export function applyTemplate(opts: ApplyTemplateOptions): void {
  const { panorama, template, insertIndex } = opts
  const replaceIds = opts.replaceFrameIds ?? []
  const templateGroupId = generateId()

  // ── 1. Remove replaced frames and their images ─────────────────────────────
  const removedFrames: Frame[] = []
  for (const id of replaceIds) {
    const idx = panorama.frames.findIndex(f => f.id === id)
    if (idx !== -1) removedFrames.push(...panorama.frames.splice(idx, 1))
  }
  // Remove placed images whose x falls within removed frame x ranges
  if (removedFrames.length) {
    const removedXRanges = removedFrames.map(f => ({
      min: f.xOffset, max: f.xOffset + f.aspectRatio.width,
    }))
    panorama.placedImages = panorama.placedImages.filter(img =>
      !removedXRanges.some(r => img.x + img.width > r.min && img.x < r.max)
    )
  }

  // ── 2. Build canvas-space slot bindings ────────────────────────────────────
  // We need to know the xOffset where the new frames will be inserted.
  // First recalculate existing frame offsets up to insertIndex.
  recalculateDimensions(panorama)
  const insertXOffset = insertIndex < panorama.frames.length
    ? panorama.frames[insertIndex]!.xOffset
    : panorama.totalWidth

  const { totalWidth: tmplW, maxHeight: tmplH } = templateDimensions(template)
  const canvasSlots: TemplateSlotBinding[] = template.slots.map(slot => ({
    templateGroupId,
    slotId: slot.id,
    slotX: insertXOffset + slot.x * tmplW,
    slotY: slot.y * tmplH,
    slotW: slot.w * tmplW,
    slotH: slot.h * tmplH,
  }))

  // ── 3. Insert new frames at insertIndex ────────────────────────────────────
  let currentX = insertXOffset
  const newFrames: Frame[] = template.frames.map((tf) => {
    const frame: Frame = {
      id: generateId(),
      aspectRatio: tf.aspectRatio,
      xOffset: currentX,
      templateMode: true,
      templateGroupId,
      templateId: template.id,
      templateSlots: canvasSlots,
    }
    currentX += tf.aspectRatio.width
    return frame
  })
  panorama.frames.splice(insertIndex, 0, ...newFrames)

  // ── 4. Shift xOffsets and recalculate dimensions ───────────────────────────
  recalculateDimensions(panorama)
}

// ── Exit template mode ────────────────────────────────────────────────────────

/**
 * Exit template mode for all frames sharing templateGroupId.
 * Converts slotBinding → standard crop fractions on each image, removes binding.
 */
export function exitTemplateMode(panorama: Panorama, templateGroupId: string): void {
  for (const frame of panorama.frames) {
    if (frame.templateGroupId === templateGroupId) {
      frame.templateMode    = false
      frame.templateGroupId = undefined
      frame.templateId      = undefined
      frame.templateSlots   = undefined
    }
  }

  for (const img of panorama.placedImages) {
    if (img.slotBinding?.templateGroupId === templateGroupId) {
      // Convert canvas-space slot rect → crop fractions relative to current image
      img.crop = recomputeSlotCrop(img)
      img.slotBinding = undefined
    }
  }
}

// ── Internal helper ───────────────────────────────────────────────────────────

function recalculateDimensions(panorama: Panorama): void {
  let x = 0, maxH = 0
  for (const frame of panorama.frames) {
    frame.xOffset = x
    x    += frame.aspectRatio.width
    maxH  = Math.max(maxH, frame.aspectRatio.height)
  }
  panorama.totalWidth = x
  panorama.maxHeight  = maxH
}

/** Find the nearest unfilled slot (by distance from drop point to slot center). */
export function findNearestSlot(
  panorama: Panorama,
  dropX: number, dropY: number,
  templateGroupId: string,
): TemplateSlotBinding | null {
  // Collect all canvas-space slots for this group
  const frame = panorama.frames.find(f => f.templateGroupId === templateGroupId)
  if (!frame?.templateSlots) return null

  let best: TemplateSlotBinding | null = null
  let bestDist = Infinity
  for (const slot of frame.templateSlots) {
    const cx = slot.slotX + slot.slotW / 2
    const cy = slot.slotY + slot.slotH / 2
    const dist = Math.sqrt((dropX - cx) ** 2 + (dropY - cy) ** 2)
    if (dist < bestDist) {
      bestDist = dist
      best = slot
    }
  }
  return best
}
