import { ref } from 'vue'
import type { Panorama } from '@/types'

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
    .flatMap(img => [img.x, img.x + img.width, img.x + img.width / 2])
}

function imageTargetsY(panorama: Panorama, excludeId: string): number[] {
  return panorama.placedImages
    .filter(img => img.imageId !== excludeId)
    .flatMap(img => [img.y, img.y + img.height, img.y + img.height / 2])
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
 * Snap a resize result by checking the image's actual moving edges against
 * snap targets (not the cursor). Returns a corrected result with AR preserved.
 *
 * @param result   - tentative result from updateResize (raw, unsnapped)
 * @param fixedX/Y - the corner that does NOT move during this resize
 * @param origW/H  - image dimensions at the moment the resize started
 * @param corner   - which corner is being dragged
 */
export function snapResizeResult(
  result: ResizeResult,
  fixedX: number, fixedY: number,
  origW: number, origH: number,
  corner: ResizeCorner,
  panorama: Panorama, excludeId: string
): { result: ResizeResult; snapLines: SnapLine[] } {
  if (!snapToBorders.value && !snapToImages.value) return { result, snapLines: [] }

  const snapLines: SnapLine[] = []
  const tx: number[] = []
  const ty: number[] = []

  if (snapToBorders.value) { tx.push(...borderTargetsX(panorama)); ty.push(...borderTargetsY(panorama)) }
  if (snapToImages.value)  { tx.push(...imageTargetsX(panorama, excludeId)); ty.push(...imageTargetsY(panorama, excludeId)) }

  // Which edges are moving?
  const rightMoves  = corner === 'br' || corner === 'tr'
  const bottomMoves = corner === 'br' || corner === 'bl'

  // Unsnapped positions of the moving edges (from raw updateResize result)
  const movingX = rightMoves  ? result.x + result.width  : result.x
  const movingY = bottomMoves ? result.y + result.height : result.y

  const unsnappedScale = result.width / origW
  const minScale = MIN_SIZE / Math.min(origW, origH)

  // ── X axis hysteresis ────────────────────────────────────────────────────
  let xTarget: number | null = null

  if (_snapState.x !== null) {
    if (Math.abs(movingX - _snapState.x) < SNAP_THRESHOLD) {
      xTarget = _snapState.x          // still inside band → hold lock
    } else {
      _snapState.x = null             // escaped → release
    }
  }
  if (_snapState.x === null) {
    const bx = findBestSnap([movingX], tx)
    if (bx) { xTarget = bx.at; _snapState.x = bx.at }
  }

  // ── Y axis hysteresis ────────────────────────────────────────────────────
  let yTarget: number | null = null

  if (_snapState.y !== null) {
    if (Math.abs(movingY - _snapState.y) < SNAP_THRESHOLD) {
      yTarget = _snapState.y
    } else {
      _snapState.y = null
    }
  }
  if (_snapState.y === null) {
    const by = findBestSnap([movingY], ty)
    if (by) { yTarget = by.at; _snapState.y = by.at }
  }

  // ── Derive scale from snap targets ───────────────────────────────────────
  // Since AR is locked we can only apply one scale. Compute each candidate
  // and pick the one closest to the unsnapped scale.
  let scaleX: number | null = null
  let scaleY: number | null = null

  if (xTarget !== null) {
    scaleX = rightMoves ? (xTarget - fixedX) / origW : (fixedX - xTarget) / origW
    if (scaleX < minScale) scaleX = null // would shrink too small — ignore
  }
  if (yTarget !== null) {
    scaleY = bottomMoves ? (yTarget - fixedY) / origH : (fixedY - yTarget) / origH
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

  const newW = origW * finalScale
  const newH = origH * finalScale
  return {
    result: {
      x:      rightMoves  ? fixedX       : fixedX - newW,
      y:      bottomMoves ? fixedY       : fixedY - newH,
      width:  newW,
      height: newH,
    },
    snapLines,
  }
}

// Snap state for resize hysteresis — reset at the start of each resize gesture
const _snapState: { x: number | null; y: number | null } = { x: null, y: null }
export function beginResizeSnap() { _snapState.x = null; _snapState.y = null }
export function endResizeSnap()   { _snapState.x = null; _snapState.y = null }

export const useSnapSettings = () => ({ snapToBorders, snapToImages })
