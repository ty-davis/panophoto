import { ref, computed } from 'vue'
import type { Panorama, Frame, AspectRatio } from '@/types'
import { ASPECT_RATIOS } from '@/utils/aspectRatios'
import { generateId } from '@/utils/imageUtils'

const panorama = ref<Panorama>({
  id: generateId(),
  frames: [],
  placedImages: [],
  backgroundColor: '#ffffff',
  totalWidth: 0,
  maxHeight: 0
})

export const usePanorama = () => {
  const addFrame = (aspectRatio?: AspectRatio) => {
    const ratio = aspectRatio || ASPECT_RATIOS[0]!
    
    const newFrame: Frame = {
      id: generateId(),
      aspectRatio: ratio,
      xOffset: panorama.value.totalWidth
    }
    
    panorama.value.frames.push(newFrame)
    panorama.value.totalWidth += ratio.width
    
    // Update max height if this frame is taller
    if (ratio.height > panorama.value.maxHeight) {
      panorama.value.maxHeight = ratio.height
    }
  }

  const removeFrame = (frameId: string) => {
    const index = panorama.value.frames.findIndex((f) => f.id === frameId)
    if (index === -1) return

    panorama.value.frames.splice(index, 1)
    
    // Recalculate offsets and dimensions
    recalculateDimensions()
    
    // Remove any images that are now outside the panorama bounds
    panorama.value.placedImages = panorama.value.placedImages.filter(
      (img) => img.x < panorama.value.totalWidth
    )
  }

  const updateFrameAspectRatio = (frameId: string, aspectRatioName: string) => {
    const frame = panorama.value.frames.find((f) => f.id === frameId)
    const aspectRatio = ASPECT_RATIOS.find((ar) => ar.name === aspectRatioName)
    
    if (frame && aspectRatio) {
      frame.aspectRatio = aspectRatio
      recalculateDimensions()
    }
  }

  const recalculateDimensions = () => {
    let currentX = 0
    let maxH = 0
    
    panorama.value.frames.forEach((frame) => {
      frame.xOffset = currentX
      currentX += frame.aspectRatio.width
      maxH = Math.max(maxH, frame.aspectRatio.height)
    })
    
    panorama.value.totalWidth = currentX
    panorama.value.maxHeight = maxH
  }

  const updateBackground = (color: string) => {
    panorama.value.backgroundColor = color
  }

  const getFrameAtPosition = (x: number): Frame | undefined => {
    return panorama.value.frames.find((frame, index) => {
      const nextFrame = panorama.value.frames[index + 1]
      const endX = nextFrame ? nextFrame.xOffset : panorama.value.totalWidth
      return x >= frame.xOffset && x < endX
    })
  }

  // Initialize with one default frame
  if (panorama.value.frames.length === 0) {
    addFrame()
  }

  return {
    panorama: computed(() => panorama.value),
    frames: computed(() => panorama.value.frames),
    totalWidth: computed(() => panorama.value.totalWidth),
    maxHeight: computed(() => panorama.value.maxHeight),
    addFrame,
    removeFrame,
    updateFrameAspectRatio,
    updateBackground,
    getFrameAtPosition
  }
}
