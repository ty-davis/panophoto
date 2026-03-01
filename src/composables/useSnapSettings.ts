import { ref } from 'vue'
import type { Panorama } from '@/types'
import { getVisibleRect } from '@/types'

const SNAP_THRESHOLD = 15

export const snapToBorders = ref(true)
export const snapToImages  = ref(true)

export interface SnapLine {
  axis: 'x' | 'y'
  position: number // canvas-space coordinate
}

function findBestSnap(
  snapPoints: number[],
  targets: number[]
): { delta: number; at: number } | null {
  let best: { delta: number; at: number; abs: number } | null = null
  for (const sp of snapPoints) {
    for (const t of targets) {
      const delta = t - sp
      const abs   = Math.abs(delta)
      if (abs < SNAP_THRESHOLD && (!best || abs < best.abs)) {
        best = { delta, at: t, abs }
      }
    }
  }
  return best ? { delta: best.delta, at: best.at } : null
}

function borderTargetsX(panorama: Panorama): number[] {
  const t = new Set([0, panorama.totalWidth])
  for (const f of panorama.frames) {
    t.add(f.xOffset)
    t.add(f.xOffset + f.aspectRatio.width)
  }
  return [...t]
}

function borderTargetsY(panorama: Panorama): number[] {
  return [0, panorama.maxHeight]
}

function imageTargetsX(panorama: Panorama, excludeId: string): number[] {
  return panorama.placedImages
    .filter(img => img.imageId !== excludeId)
    .flatMap(img => {
      const vr = getVisibleRect(img)
      return [vr.x, vr.x + vr.w, vr.x + vr.w / 2]
    })
}

function imageTargetsY(panorama: Panorama, excludeId: string): number[] {
  return panorama.placedImages
    .filter(img => img.imageId !== excludeId)
    .flatMap(img => {
      const vr = getVisibleRect(img)
      return [vr.y, vr.y + vr.h, vr.y + vr.h / 2]
    })
}

/** Snap a placed image position (x, y) given its size (w, h). */
export function snapPosition(
  x: number, y: number, w: number, h: number,
  panorama: Panorama, excludeId: string
): { x: number; y: number; snapLines: SnapLine[] } {
  if (!snapToBorders.value && !snapToImages.value) return { x, y, snapLines: [] }

  const snapLines: SnapLine[] = []
  const tx: number[] = []
  const ty: number[] = []

  if (snapToBorders.value) { tx.push(...borderTargetsX(panorama)); ty.push(...borderTargetsY(panorama)) }
  if (snapToImages.value)  { tx.push(...imageTargetsX(panorama, excludeId)); ty.push(...imageTargetsY(panorama, excludeId)) }

  const bx = findBestSnap([x, x + w, x + w / 2], tx)
  if (bx) { x += bx.delta; snapLines.push({ axis: 'x', position: bx.at }) }

  const by = findBestSnap([y, y + h, y + h / 2], ty)
  if (by) { y += by.delta; snapLines.push({ axis: 'y', position: by.at }) }

  return { x, y, snapLines }
}

type ResizeCorner = 'tl' | 'tr' | 'bl' | 'br'

interface ResizeResult { x: number; y: number; width: number; height: number }

const MIN_SIZE = 50 // canvas pixels — mirrors useImageInteraction

/**
 * Snap a resize result by checking the image's actual VISIBLE moving edges
 * against snap targets. Returns a corrected full-box result with AR preserved.
 *
 * @param result        - tentative full-box result from updateResize
 * @param visFixedX/Y   - fixed corner of the VISIBLE rect at resize start
 * @param origVisW/H    - visible dimensions at resize start
 * @param origCropLeft/Top/Right/Bottom - crop fractions at resize start (0 if no crop)
 * @param corner        - which corner is being dragged
 */
export function snapResizeResult(
  result: ResizeResult,
  visFixedX: number, visFixedY: number,
  origVisW: number, origVisH: number,
  origCropLeft: number, origCropTop: number, origCropRight: number, origCropBottom: number,
  corner: ResizeCorner,
  panorama: Panorama, excludeId: string
): { result: ResizeResult; snapLines: SnapLine[] } {
  if (!snapToBorders.value && !snapToImages.value) return { result, snapLines: [] }

  const snapLines: SnapLine[] = []
  const tx: number[] = []
  const ty: number[] = []

  if (snapToBorders.value) { tx.push(...borderTargetsX(panorama)); ty.push(...borderTargetsY(panorama)) }
  if (snapToImages.value)  { tx.push(...imageTargetsX(panorama, excludeId)); ty.push(...imageTargetsY(panorama, excludeId)) }

  // Scale factor the resize algorithm applied to the full box
  // (origVisW corresponds to origFullW * (1 - cropLeft - cropRight), same scale)
  const unsnappedScale = result.width / (origVisW / (1 - origCropLeft - origCropRight))

  // Visible moving edge positions from the current (unsnapped) result
  const rightMoves  = corner === 'br' || corner === 'tr'
  const bottomMoves = corner === 'br' || corner === 'bl'

  const newVisW = result.width  * (1 - origCropLeft - origCropRight)
  const newVisH = result.height * (1 - origCropTop  - origCropBottom)

  const movingX = rightMoves  ? visFixedX + newVisW : visFixedX
  const movingY = bottomMoves ? visFixedY + newVisH : visFixedY

  const origFullW = origVisW / (1 - origCropLeft - origCropRight)
  const origFullH = origVisH / (1 - origCropTop  - origCropBottom)
  const minScale = MIN_SIZE / Math.min(origFullW, origFullH)

  // ── X axis hysteresis ────────────────────────────────────────────────────
  let xTarget: number | null = null
  if (_snapState.x !== null) {
    if (Math.abs(movingX - _snapState.x) < SNAP_THRESHOLD) { xTarget = _snapState.x }
    else { _snapState.x = null }
  }
  if (_snapState.x === null) {
    const bx = findBestSnap([movingX], tx)
    if (bx) { xTarget = bx.at; _snapState.x = bx.at }
  }

  // ── Y axis hysteresis ────────────────────────────────────────────────────
  let yTarget: number | null = null
  if (_snapState.y !== null) {
    if (Math.abs(movingY - _snapState.y) < SNAP_THRESHOLD) { yTarget = _snapState.y }
    else { _snapState.y = null }
  }
  if (_snapState.y === null) {
    const by = findBestSnap([movingY], ty)
    if (by) { yTarget = by.at; _snapState.y = by.at }
  }

  // ── Derive scale from visible-edge snap target ────────────────────────────
  let scaleX: number | null = null
  let scaleY: number | null = null

  if (xTarget !== null) {
    // xTarget is the desired visible edge → visible size → full size
    const targetVisW = rightMoves ? xTarget - visFixedX : visFixedX - xTarget
    scaleX = (targetVisW / (1 - origCropLeft - origCropRight)) / origFullW
    if (scaleX < minScale) scaleX = null
  }
  if (yTarget !== null) {
    const targetVisH = bottomMoves ? yTarget - visFixedY : visFixedY - yTarget
    scaleY = (targetVisH / (1 - origCropTop - origCropBottom)) / origFullH
    if (scaleY < minScale) scaleY = null
  }

  let finalScale = unsnappedScale
  if (scaleX !== null && (scaleY === null || Math.abs(scaleX - unsnappedScale) <= Math.abs(scaleY - unsnappedScale))) {
    finalScale = scaleX
    snapLines.push({ axis: 'x', position: xTarget! })
  } else if (scaleY !== null) {
    finalScale = scaleY
    snapLines.push({ axis: 'y', position: yTarget! })
  }

  if (finalScale === unsnappedScale) return { result, snapLines }

  const newW = origFullW * finalScale
  const newH = origFullH * finalScale

  // Reconstruct full-box position from visible fixed corner
  // visFixedX = newX + cropLeft * newW  (for right/bottom-moves corner)
  const newX = rightMoves  ? visFixedX - origCropLeft   * newW : visFixedX + origCropRight  * newW - newW
  const newY = bottomMoves ? visFixedY - origCropTop    * newH : visFixedY + origCropBottom * newH - newH

  return { result: { x: newX, y: newY, width: newW, height: newH }, snapLines }
}

// Snap state for resize hysteresis — reset at the start of each resize gesture
const _snapState: { x: number | null; y: number | null } = { x: null, y: null }
export function beginResizeSnap() { _snapState.x = null; _snapState.y = null }
export function endResizeSnap()   { _snapState.x = null; _snapState.y = null }

export const useSnapSettings = () => ({ snapToBorders, snapToImages })
