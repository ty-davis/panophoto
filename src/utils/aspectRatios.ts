import type { AspectRatio } from '@/types'

export const ASPECT_RATIOS: AspectRatio[] = [
  {
    name: 'square',
    ratio: 1,
    width: 1080,
    height: 1080,
    label: '1:1'
  },
  {
    name: 'portrait',
    ratio: 4 / 5,
    width: 1080,
    height: 1350,
    label: '4:5'
  },
  {
    name: 'landscape',
    ratio: 16 / 9,
    width: 1080,
    height: 608,
    label: '16:9'
  },
  {
    name: 'story',
    ratio: 9 / 16,
    width: 1080,
    height: 1920,
    label: '9:16'
  }
]

export const getAspectRatioByName = (name: string): AspectRatio | undefined => {
  return ASPECT_RATIOS.find((ar) => ar.name === name)
}
