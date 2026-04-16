import type { PrintSize } from '@/types'
import { printSizeToAspectRatio } from '@/types'

export const PRINT_DPI = 300

export const PRINT_SIZES: PrintSize[] = [
  { name: '4x6-portrait',  label: '4×6 Portrait',  widthIn: 4, heightIn: 6, dpi: PRINT_DPI },
  { name: '4x6-landscape', label: '4×6 Landscape', widthIn: 6, heightIn: 4, dpi: PRINT_DPI },
  { name: '5x7-portrait',  label: '5×7 Portrait',  widthIn: 5, heightIn: 7, dpi: PRINT_DPI },
  { name: '5x7-landscape', label: '5×7 Landscape', widthIn: 7, heightIn: 5, dpi: PRINT_DPI },
]

export const getPrintAspectRatios = () => PRINT_SIZES.map(printSizeToAspectRatio)

export const getPrintSizeByName = (name: string): PrintSize | undefined =>
  PRINT_SIZES.find(s => s.name === name)
