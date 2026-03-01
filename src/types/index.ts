export interface AspectRatio {
  name: string
  ratio: number
  width: number
  height: number
  label: string
}

export interface ImageItem {
  id: string
  file: File
  url: string
  thumbnail?: string
  width: number
  height: number
}

export interface ImageCrop {
  left:   number  // fraction 0–1 inset from left edge
  top:    number
  right:  number  // fraction 0–1 inset from right edge
  bottom: number
}

export interface PlacedImage {
  imageId: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scale: number
  crop?: ImageCrop
}

/** Returns the visible (cropped) rect in canvas-space coordinates. */
export function getVisibleRect(img: PlacedImage): { x: number; y: number; w: number; h: number } {
  const c = img.crop
  if (!c) return { x: img.x, y: img.y, w: img.width, h: img.height }
  return {
    x: img.x + c.left   * img.width,
    y: img.y + c.top    * img.height,
    w: img.width  * (1 - c.left - c.right),
    h: img.height * (1 - c.top  - c.bottom),
  }
}

export interface Frame {
  id: string
  aspectRatio: AspectRatio
  xOffset: number
}

export interface Panorama {
  id: string
  frames: Frame[]
  placedImages: PlacedImage[]
  backgroundColor: string
  totalWidth: number
  maxHeight: number
}

export interface ExportOptions {
  format: 'png' | 'jpeg'
  quality: number
}
