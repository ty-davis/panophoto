import JSZip from 'jszip'
import type { Panorama, ExportOptions } from '@/types'
import { useCanvas } from './useCanvas'

export const useExport = () => {
  const { renderPanorama } = useCanvas()

  const buildFullCanvas = (panorama: Panorama): HTMLCanvasElement => {
    const canvas = document.createElement('canvas')
    // Explicitly size the canvas to the full panorama dimensions BEFORE rendering
    // so the context is initialised at the correct resolution before any drawing occurs.
    canvas.width = panorama.totalWidth
    canvas.height = panorama.maxHeight
    renderPanorama(canvas, panorama, 1, null, false)
    return canvas
  }

  const extractFrameFromCanvas = (
    fullCanvas: HTMLCanvasElement,
    panorama: Panorama,
    frameIndex: number
  ): HTMLCanvasElement => {
    const frame = panorama.frames[frameIndex]!

    const frameCanvas = document.createElement('canvas')
    frameCanvas.width = frame.aspectRatio.width
    frameCanvas.height = frame.aspectRatio.height
    const ctx = frameCanvas.getContext('2d')!

    // Fill background first
    ctx.fillStyle = panorama.backgroundColor
    ctx.fillRect(0, 0, frameCanvas.width, frameCanvas.height)

    // Clip strictly to the frame rectangle to prevent any edge bleeding
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, frame.aspectRatio.width, frame.aspectRatio.height)
    ctx.clip()

    // Center vertically when this frame is shorter than the tallest frame
    const yOffset = (panorama.maxHeight - frame.aspectRatio.height) / 2

    ctx.drawImage(
      fullCanvas,
      frame.xOffset, yOffset, // source x, y
      frame.aspectRatio.width, frame.aspectRatio.height, // source width, height
      0, 0, // dest x, y
      frame.aspectRatio.width, frame.aspectRatio.height // dest width, height
    )

    ctx.restore()

    return frameCanvas
  }

  const canvasToBlob = (
    canvas: HTMLCanvasElement,
    options: ExportOptions
  ): Promise<Blob> =>
    new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
        options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
        options.quality
      )
    })

  const exportFrameToBlob = async (
    panorama: Panorama,
    frameIndex: number,
    options: ExportOptions = { format: 'png', quality: 0.95 }
  ): Promise<Blob> => {
    const frame = panorama.frames[frameIndex]
    if (!frame) {
      throw new Error(`Frame ${frameIndex} not found`)
    }

    const fullCanvas = buildFullCanvas(panorama)
    const frameCanvas = extractFrameFromCanvas(fullCanvas, panorama, frameIndex)
    return canvasToBlob(frameCanvas, options)
  }

  const exportAllFrames = async (
    panorama: Panorama,
    options: ExportOptions = { format: 'png', quality: 0.95 }
  ): Promise<Blob> => {
    const zip = new JSZip()
    const extension = options.format === 'jpeg' ? 'jpg' : 'png'

    // Render the full panorama canvas ONCE, then split into frames
    const fullCanvas = buildFullCanvas(panorama)

    for (let i = 0; i < panorama.frames.length; i++) {
      const frameCanvas = extractFrameFromCanvas(fullCanvas, panorama, i)
      const blob = await canvasToBlob(frameCanvas, options)
      zip.file(`frame-${i + 1}.${extension}`, blob)
    }

    // Include the full panorama as well
    const previewBlob = await canvasToBlob(fullCanvas, options)
    zip.file(`panorama-full.${extension}`, previewBlob)

    return zip.generateAsync({ type: 'blob' })
  }

  const exportFullPanorama = async (
    panorama: Panorama,
    options: ExportOptions
  ): Promise<Blob> => {
    return canvasToBlob(buildFullCanvas(panorama), options)
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
