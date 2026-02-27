import { ref, computed } from 'vue'
import type { PlacedImage } from '@/types'

const selectedImageId = ref<string | null>(null)
const isDragging = ref(false)
const dragStart = ref<{ x: number; y: number } | null>(null)
const dragOffset = ref<{ x: number; y: number }>({ x: 0, y: 0 })

export const useImageInteraction = () => {
  const selectImage = (imageId: string | null) => {
    selectedImageId.value = imageId
  }

  const isSelected = (imageId: string): boolean => {
    return selectedImageId.value === imageId
  }

  const startDrag = (x: number, y: number, image: PlacedImage) => {
    isDragging.value = true
    dragStart.value = { x, y }
    dragOffset.value = { x: x - image.x, y: y - image.y }
  }

  const updateDrag = (x: number, y: number): { x: number; y: number } | null => {
    if (!isDragging.value || !dragStart.value) return null
    
    return {
      x: x - dragOffset.value.x,
      y: y - dragOffset.value.y
    }
  }

  const endDrag = () => {
    isDragging.value = false
    dragStart.value = null
  }

  const deleteSelected = (panorama: any) => {
    if (!selectedImageId.value) return false
    
    const index = panorama.placedImages.findIndex(
      (img: PlacedImage) => img.imageId === selectedImageId.value
    )
    
    if (index !== -1) {
      panorama.placedImages.splice(index, 1)
      selectedImageId.value = null
      return true
    }
    
    return false
  }

  const clearSelection = () => {
    selectedImageId.value = null
  }

  return {
    selectedImageId: computed(() => selectedImageId.value),
    isDragging: computed(() => isDragging.value),
    selectImage,
    isSelected,
    startDrag,
    updateDrag,
    endDrag,
    deleteSelected,
    clearSelection
  }
}
