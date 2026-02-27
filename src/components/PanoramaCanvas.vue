<template>
  <div class="panorama-canvas-wrapper">
    <canvas
      ref="canvasRef"
      class="panorama-canvas"
      @drop.prevent="handleDrop"
      @dragover.prevent
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      :style="canvasStyle"
    ></canvas>
    
    <div class="frame-markers" :style="markersStyle">
      <div
        v-for="(frame, index) in panorama.frames"
        :key="frame.id"
        class="frame-marker"
        :style="getFrameMarkerStyle(frame)"
      >
        <span class="frame-label">{{ index + 1 }}</span>
        <span class="frame-size">{{ frame.aspectRatio.label }}</span>
      </div>
    </div>

    <div v-if="selectedImageId" class="selection-toolbar">
      <button @click="handleDelete" class="toolbar-btn delete-btn" title="Delete (Del)">
        <span>🗑️</span> Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { Panorama, Frame } from '@/types'
import { useCanvas } from '@/composables/useCanvas'
import { useImageInteraction } from '@/composables/useImageInteraction'

const props = defineProps<{
  panorama: Panorama
}>()

const emit = defineEmits<{
  update: []
}>()

const { renderPanorama, addImageToPanorama, getImageAtPosition } = useCanvas()
const { 
  selectedImageId, 
  isDragging,
  selectImage, 
  startDrag, 
  updateDrag, 
  endDrag,
  deleteSelected,
  clearSelection
} = useImageInteraction()

const canvasRef = ref<HTMLCanvasElement>()

const maxDisplayWidth = 2400
const maxDisplayHeight = 600

const displayScale = computed(() => {
  const widthScale = maxDisplayWidth / props.panorama.totalWidth
  const heightScale = maxDisplayHeight / props.panorama.maxHeight
  return Math.min(widthScale, heightScale, 1)
})

const canvasStyle = computed(() => {
  const scale = displayScale.value
  return {
    width: `${props.panorama.totalWidth * scale}px`,
    height: `${props.panorama.maxHeight * scale}px`,
    cursor: isDragging.value ? 'grabbing' : selectedImageId.value ? 'grab' : 'crosshair'
  }
})

const markersStyle = computed(() => {
  const scale = displayScale.value
  return {
    width: `${props.panorama.totalWidth * scale}px`,
    height: `${props.panorama.maxHeight * scale}px`
  }
})

const getFrameMarkerStyle = (frame: Frame) => {
  const scale = displayScale.value
  return {
    left: `${frame.xOffset * scale}px`,
    width: `${frame.aspectRatio.width * scale}px`,
    height: `${frame.aspectRatio.height * scale}px`,
    top: `${((props.panorama.maxHeight - frame.aspectRatio.height) / 2) * scale}px`
  }
}

const render = () => {
  if (canvasRef.value) {
    renderPanorama(canvasRef.value, props.panorama, 1, selectedImageId.value)
  }
}

const getCanvasCoordinates = (event: MouseEvent): { x: number; y: number } => {
  if (!canvasRef.value) return { x: 0, y: 0 }
  
  const rect = canvasRef.value.getBoundingClientRect()
  const scale = displayScale.value
  
  return {
    x: (event.clientX - rect.left) / scale,
    y: (event.clientY - rect.top) / scale
  }
}

const handleMouseDown = (event: MouseEvent) => {
  const { x, y } = getCanvasCoordinates(event)
  
  // Check if clicking on an existing image
  const clickedImage = getImageAtPosition(props.panorama, x, y)
  
  if (clickedImage) {
    selectImage(clickedImage.imageId)
    startDrag(x, y, clickedImage)
    event.preventDefault()
  } else {
    clearSelection()
  }
  
  render()
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value || !selectedImageId.value) return
  
  const { x, y } = getCanvasCoordinates(event)
  const newPos = updateDrag(x, y)
  
  if (newPos) {
    const image = props.panorama.placedImages.find(
      (img) => img.imageId === selectedImageId.value
    )
    
    if (image) {
      image.x = newPos.x
      image.y = newPos.y
      render()
    }
  }
}

const handleMouseUp = () => {
  if (isDragging.value) {
    endDrag()
    emit('update')
  }
}

const handleDrop = (event: DragEvent) => {
  if (!canvasRef.value) return
  
  const imageId = event.dataTransfer?.getData('imageId')
  if (!imageId) return

  const { x, y } = getCanvasCoordinates(event as any)

  addImageToPanorama(props.panorama, imageId, { x, y })
  render()
  emit('update')
}

const handleDelete = () => {
  if (deleteSelected(props.panorama)) {
    render()
    emit('update')
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedImageId.value) {
    event.preventDefault()
    handleDelete()
  } else if (event.key === 'Escape') {
    clearSelection()
    render()
  }
}

onMounted(() => {
  render()
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

watch(() => props.panorama, render, { deep: true })
watch(selectedImageId, render)
</script>

<style scoped>
.panorama-canvas-wrapper {
  position: relative;
  display: inline-block;
}

.panorama-canvas {
  border: 2px solid #cbd5e0;
  border-radius: 0.5rem;
  background: white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  display: block;
  user-select: none;
}

.frame-markers {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.frame-marker {
  position: absolute;
  border: 2px dashed rgba(66, 153, 225, 0.5);
  border-radius: 0.25rem;
  background: rgba(66, 153, 225, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.frame-label {
  font-size: 2rem;
  font-weight: 700;
  color: rgba(66, 153, 225, 0.6);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.frame-size {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(66, 153, 225, 0.8);
  background: rgba(255, 255, 255, 0.9);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.selection-toolbar {
  position: absolute;
  bottom: -3rem;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid #cbd5e0;
  border-radius: 0.5rem;
  padding: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 0.5rem;
  z-index: 10;
}

.toolbar-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.delete-btn {
  background: #fed7d7;
  color: #c53030;
}

.delete-btn:hover {
  background: #fc8181;
  color: white;
}
</style>
