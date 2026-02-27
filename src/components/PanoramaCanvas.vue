<template>
  <div ref="wrapperRef" class="panorama-canvas-wrapper" @pointerdown.stop>
    <canvas
      ref="canvasRef"
      class="panorama-canvas"
      @drop.prevent="handleDrop"
      @dragover.prevent
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @touchend="handleTouchEnd"
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

    <!-- Resize handle overlay (HTML so handles are always proper CSS-pixel size) -->
    <div v-if="selectedImage" class="resize-overlay" :style="resizeOverlayStyle">
      <!-- Centered delete button -->
      <button class="delete-btn" @click="handleDelete" title="Delete (Del)">
        <i class="fa-solid fa-trash"></i>
      </button>
      <!-- Desktop: 4 corner handles -->
      <template v-if="!isTouchDevice">
        <div class="handle h-tl" @mousedown="startCornerResize($event, 'tl')"></div>
        <div class="handle h-tr" @mousedown="startCornerResize($event, 'tr')"></div>
        <div class="handle h-bl" @mousedown="startCornerResize($event, 'bl')"></div>
        <div class="handle h-br" @mousedown="startCornerResize($event, 'br')"></div>
      </template>
      <!-- Mobile: large handles at TL and BR only -->
      <template v-else>
        <div class="handle handle-touch h-tl" @touchstart="startCornerResizeTouch($event, 'tl')"></div>
        <div class="handle handle-touch h-br" @touchstart="startCornerResizeTouch($event, 'br')"></div>
      </template>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { Panorama, Frame } from '@/types'
import { useCanvas } from '@/composables/useCanvas'
import { useImageInteraction } from '@/composables/useImageInteraction'

const props = defineProps<{ panorama: Panorama }>()
const emit  = defineEmits<{ update: [] }>()

const { renderPanorama, addImageToPanorama, getImageAtPosition } = useCanvas()
const {
  selectedImageId, isDragging,
  selectImage, startDrag, updateDrag, endDrag,
  startResize, updateResize, endResize,
  deleteSelected, clearSelection
} = useImageInteraction()

const canvasRef = ref<HTMLCanvasElement>()

// ── Viewport-aware base scale ──────────────────────────────────────────────
const getViewportLimits = () => ({
  width:  Math.max(window.innerWidth  - 48, 200),
  height: Math.max(window.innerHeight * 0.55, 200)
})
const viewportLimits = ref(getViewportLimits())
const handleResize = () => { viewportLimits.value = getViewportLimits() }

// User zoom level controlled by pinch gesture
const userZoom = ref(1)
const MIN_ZOOM = 0.3
const MAX_ZOOM = 4

const displayScale = computed(() => {
  const maxH = Math.min(viewportLimits.value.height, 900)
  const base = Math.min(maxH / props.panorama.maxHeight, 1)
  return base * userZoom.value
})

// Detect touch-primary device once on mount
const isTouchDevice = ref(false)

const canvasStyle = computed(() => {
  const scale = displayScale.value
  return {
    width:  `${props.panorama.totalWidth  * scale}px`,
    height: `${props.panorama.maxHeight   * scale}px`,
    cursor: isDragging.value ? 'grabbing' : selectedImageId.value ? 'grab' : 'crosshair'
  }
})

const markersStyle = computed(() => {
  const scale = displayScale.value
  return {
    width:  `${props.panorama.totalWidth  * scale}px`,
    height: `${props.panorama.maxHeight   * scale}px`
  }
})

const getFrameMarkerStyle = (frame: Frame) => {
  const scale = displayScale.value
  return {
    left:   `${frame.xOffset * scale}px`,
    width:  `${frame.aspectRatio.width  * scale}px`,
    height: `${frame.aspectRatio.height * scale}px`,
    top:    `${((props.panorama.maxHeight - frame.aspectRatio.height) / 2) * scale}px`
  }
}

// ── Resize handle overlay ─────────────────────────────────────────────────
const selectedImage = computed(() =>
  selectedImageId.value
    ? (props.panorama.placedImages.find(img => img.imageId === selectedImageId.value) ?? null)
    : null
)

const resizeOverlayStyle = computed(() => {
  const img = selectedImage.value
  if (!img) return {}
  const s = displayScale.value
  return {
    left:   `${img.x     * s}px`,
    top:    `${img.y     * s}px`,
    width:  `${img.width * s}px`,
    height: `${img.height * s}px`
  }
})

type ResizeCorner = 'tl' | 'tr' | 'bl' | 'br'

// Desktop: mousedown on handle → window mousemove/mouseup
const startCornerResize = (event: MouseEvent, corner: ResizeCorner) => {
  if (!selectedImage.value) return
  event.stopPropagation()
  event.preventDefault()
  startResize(corner, selectedImage.value)

  const onMove = (e: MouseEvent) => {
    if (!selectedImage.value) return
    const pos = updateResize(...Object.values(getCanvasCoordinates(e)) as [number, number])
    if (pos) Object.assign(selectedImage.value, pos)
    render()
  }
  const onUp = () => {
    endResize()
    emit('update')
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup',   onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup',   onUp)
}

// Mobile: touchstart on handle → window touchmove/touchend (non-passive)
const startCornerResizeTouch = (event: TouchEvent, corner: ResizeCorner) => {
  if (!selectedImage.value || event.touches.length !== 1) return
  event.stopPropagation()
  event.preventDefault()
  startResize(corner, selectedImage.value)

  const onMove = (e: TouchEvent) => {
    if (!selectedImage.value || e.touches.length !== 1) return
    e.preventDefault()
    const pos = updateResize(...Object.values(getCanvasCoordinates(e.touches[0]!)) as [number, number])
    if (pos) Object.assign(selectedImage.value, pos)
    render()
  }
  const onEnd = () => {
    endResize()
    emit('update')
    window.removeEventListener('touchmove', onMove)
    window.removeEventListener('touchend',  onEnd)
  }
  window.addEventListener('touchmove', onMove, { passive: false })
  window.addEventListener('touchend',  onEnd)
}

// ── Render ────────────────────────────────────────────────────────────────
// rAF-throttled render: at most one draw per display frame
let _rafId = 0
const render = () => {
  if (_rafId) return
  _rafId = requestAnimationFrame(() => {
    _rafId = 0
    if (canvasRef.value) renderPanorama(canvasRef.value, props.panorama, 1, selectedImageId.value)
  })
}

// Map screen coords (CSS pixels) → canvas coordinate space
const getCanvasCoordinates = (event: MouseEvent | Touch): { x: number; y: number } => {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect  = canvasRef.value.getBoundingClientRect()
  const scale = displayScale.value
  return {
    x: (event.clientX - rect.left) / scale,
    y: (event.clientY - rect.top)  / scale
  }
}

// ── Mouse handlers ────────────────────────────────────────────────────────
const handleMouseDown = (event: MouseEvent) => {
  const { x, y } = getCanvasCoordinates(event)
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
    const image = props.panorama.placedImages.find(img => img.imageId === selectedImageId.value)
    if (image) { image.x = newPos.x; image.y = newPos.y; render() }
  }
}

const handleMouseUp = () => {
  if (isDragging.value) { endDrag(); emit('update') }
}

// ── Touch handlers (registered manually as non-passive) ───────────────────
let pinchStartDistance = 0
let pinchStartZoom     = 1

const getPinchDistance = (touches: TouchList): number => {
  const dx = touches[0]!.clientX - touches[1]!.clientX
  const dy = touches[0]!.clientY - touches[1]!.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

const handleTouchStart = (event: TouchEvent) => {
  if (event.touches.length === 2) {
    pinchStartDistance = getPinchDistance(event.touches)
    pinchStartZoom     = userZoom.value
    event.preventDefault()
    return
  }
  if (event.touches.length !== 1) return
  const { x, y } = getCanvasCoordinates(event.touches[0]!)
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

const handleTouchMove = (event: TouchEvent) => {
  if (event.touches.length === 2) {
    event.preventDefault()
    const ratio = getPinchDistance(event.touches) / pinchStartDistance
    userZoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchStartZoom * ratio))
    return
  }
  if (!isDragging.value || !selectedImageId.value || event.touches.length !== 1) return
  event.preventDefault()
  const { x, y } = getCanvasCoordinates(event.touches[0]!)
  const newPos = updateDrag(x, y)
  if (newPos) {
    const image = props.panorama.placedImages.find(img => img.imageId === selectedImageId.value)
    if (image) { image.x = newPos.x; image.y = newPos.y; render() }
  }
}

const handleTouchEnd = () => {
  if (isDragging.value) { endDrag(); emit('update') }
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
  if (deleteSelected(props.panorama)) { render(); emit('update') }
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

// Deselect when tapping/clicking anywhere outside the canvas wrapper
const handleDocumentPointerDown = () => {
  if (selectedImageId.value) {
    clearSelection()
    render()
  }
}

onMounted(() => {
  isTouchDevice.value = window.matchMedia('(hover: none)').matches
  render()
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('resize',  handleResize)
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  canvasRef.value?.addEventListener('touchstart', handleTouchStart, { passive: false })
  canvasRef.value?.addEventListener('touchmove',  handleTouchMove,  { passive: false })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize',  handleResize)
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  canvasRef.value?.removeEventListener('touchstart', handleTouchStart)
  canvasRef.value?.removeEventListener('touchmove',  handleTouchMove)
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

/* ── Resize handle overlay ─────────────────────────────────────────────── */
.resize-overlay {
  position: absolute;
  pointer-events: none; /* overlay itself is transparent; children capture events */
  z-index: 5;
  /* selection outline drawn here as well as on canvas – clean CSS border */
  outline: 2px solid #4299e1;
}

/* Shared handle base */
.handle {
  position: absolute;
  pointer-events: all;
  background: white;
  border: 2px solid #4299e1;
  box-sizing: border-box;
}

/* Desktop square handles (12 × 12 px, centred on each corner) */
.h-tl { top: -6px;  left: -6px;  width: 12px; height: 12px; cursor: nw-resize; }
.h-tr { top: -6px;  right: -6px; width: 12px; height: 12px; cursor: ne-resize; }
.h-bl { bottom: -6px; left: -6px;  width: 12px; height: 12px; cursor: sw-resize; }
.h-br { bottom: -6px; right: -6px; width: 12px; height: 12px; cursor: se-resize; }

/* Mobile large circular handles (32 × 32 px) */
.handle-touch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  border: 3px solid #4299e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  /* diagonal resize arrow drawn with CSS */
}
.handle-touch::before {
  content: '';
  display: block;
  width: 10px;
  height: 10px;
  border-right: 2px solid #4299e1;
  border-bottom: 2px solid #4299e1;
  transform: rotate(-45deg) translate(-1px, -1px);
}
/* TL handle arrow points the other way */
.handle-touch.h-tl::before {
  transform: rotate(135deg) translate(-1px, -1px);
}
/* Position: centred on corner */
.handle-touch.h-tl { top: -16px;  left: -16px; }
.handle-touch.h-br { bottom: -16px; right: -16px; }

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

.delete-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(229, 62, 62, 0.85);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: all;
  transition: background 0.15s, transform 0.15s;
  backdrop-filter: blur(2px);
}
.delete-btn:hover {
  background: rgba(197, 48, 48, 0.95);
  transform: translate(-50%, -50%) scale(1.1);
}
</style>
