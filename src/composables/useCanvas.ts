import type { Panorama, PlacedImage } from '@/types'
import { getVisibleRect } from '@/types'
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
    const newWidth  = panorama.totalWidth * scale
    const newHeight = panorama.maxHeight  * scale
    if (canvas.width !== newWidth)  canvas.width  = newWidth
    if (canvas.height !== newHeight) canvas.height = newHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = panorama.backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw frame boundaries (only for display, not export)
    if (showFrameBoundaries) {
      ctx.setLineDash([10 * scale, 5 * scale])
      ctx.lineWidth = 2 * scale

      panorama.frames.forEach((frame, index) => {
        // Green dashes for template-mode frames, grey otherwise
        ctx.strokeStyle = frame.templateMode ? '#48bb78' : '#cbd5e0'
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

    // Draw template slot placeholders (unfilled slots only)
    if (showFrameBoundaries) {
      // Collect slot ids that are already assigned to an image
      const assignedSlotKeys = new Set(
        panorama.placedImages
          .filter(img => img.slotBinding)
          .map(img => `${img.slotBinding!.templateGroupId}:${img.slotBinding!.slotId}`)
      )

      const drawnGroups = new Set<string>()
      for (const frame of panorama.frames) {
        if (!frame.templateMode || !frame.templateSlots) continue
        if (drawnGroups.has(frame.templateGroupId!)) continue
        drawnGroups.add(frame.templateGroupId!)

        for (const slot of frame.templateSlots) {
          const key = `${slot.templateGroupId}:${slot.slotId}`
          if (assignedSlotKeys.has(key)) continue  // slot filled — skip placeholder

          const sx = slot.slotX * scale, sy = slot.slotY * scale
          const sw = slot.slotW * scale, sh = slot.slotH * scale

          // Light gray fill
          ctx.fillStyle = 'rgba(160, 174, 192, 0.25)'
          ctx.fillRect(sx, sy, sw, sh)

          // Dashed green border
          ctx.strokeStyle = '#48bb78'
          ctx.lineWidth = 2 * scale
          ctx.setLineDash([8 * scale, 4 * scale])
          ctx.strokeRect(sx, sy, sw, sh)
          ctx.setLineDash([])

          // Centered image icon (simple SVG-like drawing)
          const iconSize = Math.min(sw, sh) * 0.18
          const cx = sx + sw / 2, cy = sy + sh / 2
          ctx.strokeStyle = 'rgba(100, 120, 140, 0.6)'
          ctx.lineWidth = 1.5 * scale
          // Rectangle outline
          ctx.strokeRect(cx - iconSize, cy - iconSize * 0.7, iconSize * 2, iconSize * 1.4)
          // Mountain triangle
          ctx.beginPath()
          ctx.moveTo(cx - iconSize * 0.6, cy + iconSize * 0.3)
          ctx.lineTo(cx - iconSize * 0.1, cy - iconSize * 0.2)
          ctx.lineTo(cx + iconSize * 0.6, cy + iconSize * 0.3)
          ctx.stroke()
          // Sun circle
          ctx.beginPath()
          ctx.arc(cx + iconSize * 0.4, cy - iconSize * 0.35, iconSize * 0.2, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
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

      const crop = placedImage.crop
      if (crop) {
        const srcW  = img.naturalWidth
        const srcH  = img.naturalHeight
        const sx    = crop.left   * srcW
        const sy    = crop.top    * srcH
        const sw    = srcW  * (1 - crop.left - crop.right)
        const sh    = srcH  * (1 - crop.top  - crop.bottom)
        const visW  = placedImage.width  * (1 - crop.left - crop.right)
        const visH  = placedImage.height * (1 - crop.top  - crop.bottom)
        const dstX  = (crop.left - 0.5) * placedImage.width  * scale
        const dstY  = (crop.top  - 0.5) * placedImage.height * scale
        ctx.drawImage(img, sx, sy, sw, sh, dstX, dstY, visW * scale, visH * scale)
      } else {
        ctx.drawImage(
          img,
          (-placedImage.width / 2) * scale,
          (-placedImage.height / 2) * scale,
          placedImage.width * scale,
          placedImage.height * scale
        )
      }

      ctx.restore()

      // Draw selection outline around the VISIBLE rect
      // Green if the image has a slot binding (template mode), blue otherwise
      if (selectedImageId && placedImage.imageId === selectedImageId) {
        const vr = getVisibleRect(placedImage)
        ctx.save()
        ctx.strokeStyle = placedImage.slotBinding ? '#48bb78' : '#4299e1'
        ctx.lineWidth = 2 * scale
        ctx.setLineDash([])
        ctx.strokeRect(vr.x * scale, vr.y * scale, vr.w * scale, vr.h * scale)
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
      
      const vr = getVisibleRect(img)
      if (
        x >= vr.x && x <= vr.x + vr.w &&
        y >= vr.y && y <= vr.y + vr.h
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
