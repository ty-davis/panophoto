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

export interface PlacedImage {
  imageId: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scale: number
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
