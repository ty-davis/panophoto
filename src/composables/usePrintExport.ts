import type { Panorama, ExportOptions, PrintSize } from '@/types'
import { useCanvas } from './useCanvas'

export const usePrintExport = () => {
  const { renderPanorama } = useCanvas()

  /**
   * Render the print panorama at full 300-DPI pixel resolution (scale = 1)
   * and return it as a Blob. No ZIP, no frame splitting — a single print file.
   */
  const exportPrint = (
    panorama: Panorama,
    options: ExportOptions = { format: 'jpeg', quality: 0.95 }
  ): Promise<Blob> => {
    const canvas = document.createElement('canvas')
    canvas.width  = panorama.totalWidth
    canvas.height = panorama.maxHeight
    // Render without frame boundaries or safe-zone guides — clean output
    renderPanorama(canvas, panorama, 1, null, false, false)

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Failed to create print blob'))),
        options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
        options.quality
      )
    })
  }

  const downloadPrint = (blob: Blob, size: PrintSize, format: 'jpeg' | 'png'): void => {
    const date = new Date().toISOString().split('T')[0]
    const sizeSlug = size.name  // e.g. '4x6-portrait'
    const ext = format === 'jpeg' ? 'jpg' : 'png'
    const filename = `${sizeSlug}-print-${date}.${ext}`

    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href     = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return { exportPrint, downloadPrint }
}
