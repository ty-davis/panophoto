import { ref, computed } from 'vue'
import type { ImageItem } from '@/types'
import { isValidImageFile, loadImage, createThumbnail, generateId } from '@/utils/imageUtils'

const images = ref<ImageItem[]>([])
const imageElements = ref<Map<string, HTMLImageElement>>(new Map())

export const useImageStore = () => {
  const addImages = async (files: File[]) => {
    const validFiles = files.filter(isValidImageFile)
    
    const newImages = await Promise.all(
      validFiles.map(async (file) => {
        const id = generateId()
        const url = URL.createObjectURL(file)
        const img = await loadImage(file)
        const thumbnail = await createThumbnail(img)

        imageElements.value.set(id, img)

        return {
          id,
          file,
          url,
          thumbnail,
          width: img.width,
          height: img.height
        }
      })
    )

    images.value.push(...newImages)
  }

  // Restore a previously-saved image with its original ID (used by persistence layer)
  const restoreImage = async (id: string, blob: Blob, filename: string, type: string) => {
    const file = new File([blob], filename, { type })
    const url  = URL.createObjectURL(file)
    const img  = await loadImage(file)
    const thumbnail = await createThumbnail(img)
    imageElements.value.set(id, img)
    images.value.push({ id, file, url, thumbnail, width: img.width, height: img.height })
  }

  const removeImage = (id: string) => {
    const image = images.value.find((img) => img.id === id)
    if (image) {
      URL.revokeObjectURL(image.url)
      imageElements.value.delete(id)
    }
    images.value = images.value.filter((img) => img.id !== id)
  }

  const getImageElement = (id: string): HTMLImageElement | undefined => {
    return imageElements.value.get(id)
  }

  const clearImages = () => {
    images.value.forEach((img) => {
      URL.revokeObjectURL(img.url)
    })
    images.value = []
    imageElements.value.clear()
  }

  return {
    images: computed(() => images.value),
    addImages,
    restoreImage,
    removeImage,
    getImageElement,
    clearImages
  }
}
