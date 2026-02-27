import JSZip from 'jszip'
import type { Panorama, ExportOptions } from '@/types'
import { useCanvas } from './useCanvas'

export const useExport = () => {
  const { renderPanorama } = useCanvas()

  const exportFrameToBlob = async (
    panorama: Panorama,
    frameIndex: number,
    options: ExportOptions = { format: 'png', quality: 0.95 }
  ): Promise<Blob> => {
    const frame = panorama.frames[frameIndex]
    if (!frame) {
      throw new Error(`Frame ${frameIndex} not found`)
    }

    // Create a full panorama canvas
    const fullCanvas = document.createElement('canvas')
    renderPanorama(fullCanvas, panorama, 1)

    // Create a canvas for this specific frame
    const frameCanvas = document.createElement('canvas')
    frameCanvas.width = frame.aspectRatio.width
    frameCanvas.height = frame.aspectRatio.height
    const ctx = frameCanvas.getContext('2d')!

    // Fill background
    ctx.fillStyle = panorama.backgroundColor
    ctx.fillRect(0, 0, frameCanvas.width, frameCanvas.height)

    // Copy the relevant portion from the full panorama
    // Center vertically if frame is shorter than max height
    const yOffset = (panorama.maxHeight - frame.aspectRatio.height) / 2
    
    ctx.drawImage(
      fullCanvas,
      frame.xOffset, yOffset, // source x, y
      frame.aspectRatio.width, frame.aspectRatio.height, // source width, height
      0, 0, // dest x, y
      frame.aspectRatio.width, frame.aspectRatio.height // dest width, height
    )

    return new Promise((resolve, reject) => {
      frameCanvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
        options.quality
      )
    })
  }

  const exportAllFrames = async (
    panorama: Panorama,
    options: ExportOptions = { format: 'png', quality: 0.95 }
  ): Promise<Blob> => {
    const zip = new JSZip()

    for (let i = 0; i < panorama.frames.length; i++) {
      const blob = await exportFrameToBlob(panorama, i, options)
      const extension = options.format === 'jpeg' ? 'jpg' : 'png'
      zip.file(`frame-${i + 1}.${extension}`, blob)
    }

    // Create full panorama preview
    const previewBlob = await exportFullPanorama(panorama, options)
    const extension = options.format === 'jpeg' ? 'jpg' : 'png'
    zip.file(`panorama-full.${extension}`, previewBlob)

    return zip.generateAsync({ type: 'blob' })
  }

  const exportFullPanorama = async (
    panorama: Panorama,
    options: ExportOptions
  ): Promise<Blob> => {
    const canvas = document.createElement('canvas')
    renderPanorama(canvas, panorama, 1)

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create panorama'))
          }
        },
        options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
        options.quality
      )
    })
  }

  const downloadBlob = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return {
    exportFrameToBlob,
    exportAllFrames,
    exportFullPanorama,
    downloadBlob
  }
}
