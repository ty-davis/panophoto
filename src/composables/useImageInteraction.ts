import { ref, computed } from 'vue'
import type { PlacedImage } from '@/types'

const selectedImageId = ref<string | null>(null)
const isDragging  = ref(false)
const isResizing  = ref(false)
const dragStart   = ref<{ x: number; y: number } | null>(null)
const dragOffset  = ref<{ x: number; y: number }>({ x: 0, y: 0 })

type ResizeCorner = 'tl' | 'tr' | 'bl' | 'br'
const activeResizeCorner = ref<ResizeCorner | null>(null)

interface ResizeState {
  origW: number; origH: number
  origDiag: number
  fixedX: number; fixedY: number
  corner: ResizeCorner
}
let _resizeState: ResizeState | null = null

const MIN_IMAGE_SIZE = 50 // canvas-space pixels

export const useImageInteraction = () => {
  const selectImage = (imageId: string | null) => {
    selectedImageId.value = imageId
  }

  const isSelected = (imageId: string): boolean => {
    return selectedImageId.value === imageId
  }

  const startDrag = (x: number, y: number, image: PlacedImage) => {
    isDragging.value = true
    dragStart.value  = { x, y }
    dragOffset.value = { x: x - image.x, y: y - image.y }
  }

  const updateDrag = (x: number, y: number): { x: number; y: number } | null => {
    if (!isDragging.value || !dragStart.value) return null
    return {
      x: x - dragOffset.value.x,
      y: y - dragOffset.value.y
    }
  }

  const endDrag = () => {
    isDragging.value = false
    dragStart.value  = null
  }

  // ── Resize ────────────────────────────────────────────────────────────────
  const startResize = (
    corner: ResizeCorner,
    image: PlacedImage
  ) => {
    isResizing.value        = true
    activeResizeCorner.value = corner

    // The corner opposite to the one being dragged stays fixed
    const fixedX = (corner === 'tl' || corner === 'bl') ? image.x + image.width  : image.x
    const fixedY = (corner === 'tl' || corner === 'tr') ? image.y + image.height : image.y

    _resizeState = {
      origW:    image.width,
      origH:    image.height,
      origDiag: Math.sqrt(image.width ** 2 + image.height ** 2),
      fixedX, fixedY,
      corner
    }
  }

  /**
   * Returns updated {x, y, width, height} with aspect ratio locked.
   * Scale is driven by the distance from the drag point to the fixed corner
   * divided by the original diagonal — feels like grabbing the corner and pulling.
   */
  const updateResize = (
    x: number, y: number
  ): { x: number; y: number; width: number; height: number } | null => {
    if (!isResizing.value || !_resizeState) return null
    const { origW, origH, origDiag, fixedX, fixedY, corner } = _resizeState

    const dist  = Math.sqrt((x - fixedX) ** 2 + (y - fixedY) ** 2)
    const scale = Math.max(dist / origDiag, MIN_IMAGE_SIZE / Math.min(origW, origH))

    const newW = origW * scale
    const newH = origH * scale

    return {
      x:      (corner === 'tl' || corner === 'bl') ? fixedX - newW : fixedX,
      y:      (corner === 'tl' || corner === 'tr') ? fixedY - newH : fixedY,
      width:  newW,
      height: newH
    }
  }

  const endResize = () => {
    isResizing.value         = false
    activeResizeCorner.value = null
    _resizeState             = null
  }

  // ── Misc ──────────────────────────────────────────────────────────────────
  const deleteSelected = (panorama: any) => {
    if (!selectedImageId.value) return false
    const index = panorama.placedImages.findIndex(
      (img: PlacedImage) => img.imageId === selectedImageId.value
    )
    if (index !== -1) {
      panorama.placedImages.splice(index, 1)
      selectedImageId.value = null
      return true
    }
    return false
  }

  const clearSelection = () => {
    selectedImageId.value = null
  }

  return {
    selectedImageId:      computed(() => selectedImageId.value),
    isDragging:           computed(() => isDragging.value),
    isResizing:           computed(() => isResizing.value),
    activeResizeCorner:   computed(() => activeResizeCorner.value),
    selectImage,
    isSelected,
    startDrag,
    updateDrag,
    endDrag,
    startResize,
    updateResize,
    endResize,
    deleteSelected,
    clearSelection
  }
}
