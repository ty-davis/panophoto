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

/** Snap a single corner point (during resize). */
export function snapCorner(
  cx: number, cy: number,
  panorama: Panorama, excludeId: string
): { cx: number; cy: number; snapLines: SnapLine[] } {
  if (!snapToBorders.value && !snapToImages.value) return { cx, cy, snapLines: [] }

  const snapLines: SnapLine[] = []
  const tx: number[] = []
  const ty: number[] = []

  if (snapToBorders.value) { tx.push(...borderTargetsX(panorama)); ty.push(...borderTargetsY(panorama)) }
  if (snapToImages.value)  { tx.push(...imageTargetsX(panorama, excludeId)); ty.push(...imageTargetsY(panorama, excludeId)) }

  const bx = findBestSnap([cx], tx)
  if (bx) { cx += bx.delta; snapLines.push({ axis: 'x', position: bx.at }) }

  const by = findBestSnap([cy], ty)
  if (by) { cy += by.delta; snapLines.push({ axis: 'y', position: by.at }) }

  return { cx, cy, snapLines }
}

export const useSnapSettings = () => ({ snapToBorders, snapToImages })
