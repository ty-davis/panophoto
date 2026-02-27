export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const isValidImageFile = (file: File): boolean => {
  return ACCEPTED_IMAGE_TYPES.includes(file.type)
}

export const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      resolve(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

export const createThumbnail = (
  img: HTMLImageElement,
  maxSize: number = 200
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    const scale = Math.min(maxSize / img.width, maxSize / img.height)
    canvas.width = img.width * scale
    canvas.height = img.height * scale

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    resolve(canvas.toDataURL('image/jpeg', 0.7))
  })
}

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
