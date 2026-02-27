<template>
  <div class="panorama-canvas-wrapper">
    <canvas
      ref="canvasRef"
      class="panorama-canvas"
      @drop.prevent="handleDrop"
      @dragover.prevent
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import type { Panorama, Frame } from '@/types'
import { useCanvas } from '@/composables/useCanvas'

const props = defineProps<{
  panorama: Panorama
}>()

const emit = defineEmits<{
  update: []
}>()

const { renderPanorama, addImageToPanorama } = useCanvas()
const canvasRef = ref<HTMLCanvasElement>()

// Scale the canvas to fit in viewport while maintaining aspect ratio
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
    height: `${props.panorama.maxHeight * scale}px`
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
    renderPanorama(canvasRef.value, props.panorama, 1)
  }
}

const handleDrop = (event: DragEvent) => {
  if (!canvasRef.value) return
  
  const imageId = event.dataTransfer?.getData('imageId')
  if (!imageId) return

  const rect = canvasRef.value.getBoundingClientRect()
  const scale = displayScale.value
  
  // Convert drop position to panorama coordinates
  const x = (event.clientX - rect.left) / scale
  const y = (event.clientY - rect.top) / scale

  addImageToPanorama(props.panorama, imageId, { x, y })
  render()
  emit('update')
}

onMounted(() => {
  render()
})

watch(() => props.panorama, render, { deep: true })
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
  cursor: crosshair;
  display: block;
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
</style>
