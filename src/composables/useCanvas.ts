import type { Panorama, PlacedImage } from '@/types'
import { useImageStore } from './useImageStore'

export const useCanvas = () => {
  const { getImageElement } = useImageStore()

  const renderPanorama = (
    canvas: HTMLCanvasElement,
    panorama: Panorama,
    scale: number = 1,
    selectedImageId?: string | null,
    showFrameBoundaries: boolean = true
  ): void => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Only reallocate the backing texture when dimensions actually change.
    // Resetting canvas.width/height every frame destroys and recreates the GPU
    // texture — extremely expensive on mobile.
    const newWidth  = panorama.totalWidth * scale
    const newHeight = panorama.maxHeight  * scale
    if (canvas.width !== newWidth)  canvas.width  = newWidth
    if (canvas.height !== newHeight) canvas.height = newHeight

    // Clear without resizing
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Fill background
    ctx.fillStyle = panorama.backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw frame boundaries (only for display, not export)
    if (showFrameBoundaries) {
      ctx.strokeStyle = '#cbd5e0'
      ctx.lineWidth = 2 * scale
      ctx.setLineDash([10 * scale, 5 * scale])
      
      panorama.frames.forEach((frame, index) => {
        if (index > 0) {
          const x = frame.xOffset * scale
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, canvas.height)
          ctx.stroke()
        }
      })
      
      ctx.setLineDash([])
    }

    // Draw placed images
    panorama.placedImages.forEach((placedImage) => {
      const img = getImageElement(placedImage.imageId)
      if (!img) return

      ctx.save()

      const centerX = placedImage.x + placedImage.width / 2
      const centerY = placedImage.y + placedImage.height / 2

      ctx.translate(centerX * scale, centerY * scale)
      ctx.rotate((placedImage.rotation * Math.PI) / 180)
      ctx.scale(placedImage.scale, placedImage.scale)

      ctx.drawImage(
        img,
        (-placedImage.width / 2) * scale,
        (-placedImage.height / 2) * scale,
        placedImage.width * scale,
        placedImage.height * scale
      )

      ctx.restore()

      // Draw selection outline (handles are rendered as HTML overlays)
      if (selectedImageId && placedImage.imageId === selectedImageId) {
        ctx.save()
        ctx.strokeStyle = '#4299e1'
        ctx.lineWidth = 2 * scale
        ctx.setLineDash([])
        ctx.strokeRect(
          placedImage.x * scale,
          placedImage.y * scale,
          placedImage.width  * scale,
          placedImage.height * scale
        )
        ctx.restore()
      }
    })
  }

  const getImageAtPosition = (
    panorama: Panorama,
    x: number,
    y: number
  ): PlacedImage | null => {
    // Check in reverse order (top to bottom)
    for (let i = panorama.placedImages.length - 1; i >= 0; i--) {
      const img = panorama.placedImages[i]
      if (!img) continue
      
      if (
        x >= img.x &&
        x <= img.x + img.width &&
        y >= img.y &&
        y <= img.y + img.height
      ) {
        return img
      }
    }
    
    return null
  }

  const addImageToPanorama = (
    panorama: Panorama,
    imageId: string,
    position?: { x: number; y: number }
  ): void => {
    const img = getImageElement(imageId)
    if (!img) return

    const imgAspect = img.width / img.height

    let width = panorama.maxHeight * imgAspect
    let height = panorama.maxHeight

    // If image is wider than panorama, scale it to fit height
    if (width > panorama.totalWidth) {
      width = panorama.totalWidth
      height = width / imgAspect
    }

    const cx = position ? position.x - width  / 2 : 0
    const cy = position ? position.y - height / 2 : (panorama.maxHeight - height) / 2

    const placedImage: PlacedImage = {
      imageId,
      x: Math.max(0, Math.min(cx, panorama.totalWidth  - width)),
      y: Math.max(0, Math.min(cy, panorama.maxHeight - height)),
      width,
      height,
      rotation: 0,
      scale: 1
    }

    panorama.placedImages.push(placedImage)
  }

  const removeImageFromPanorama = (panorama: Panorama, imageId: string): void => {
    panorama.placedImages = panorama.placedImages.filter((img) => img.imageId !== imageId)
  }

  return {
    renderPanorama,
    getImageAtPosition,
    addImageToPanorama,
    removeImageFromPanorama
  }
}
