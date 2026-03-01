<template>
  <div class="canvas-area">
    <!-- Per-frame controls row above the canvas -->
    <div class="frame-controls-row" :style="frameControlsRowStyle">
      <div
        v-for="(frame, index) in panorama.frames"
        :key="frame.id"
        class="frame-ctrl"
        :style="frameCtrlStyle(frame)"
      >
        <span class="frame-ctrl-num">{{ index + 1 }}</span>
        <button
          class="frame-ctrl-tmpl-btn"
          :class="{ active: frame.templateMode }"
          @click="openTemplatePicker(frame)"
          title="Apply template"
        ><i class="fa-solid fa-table-cells"></i></button>
        <select
          :value="frame.aspectRatio.name"
          class="frame-ctrl-select"
          @change="handleFrameRatioChange(frame.id, $event)"
        >
          <option v-for="r in aspectRatios" :key="r.name" :value="r.name">{{ r.label }}</option>
        </select>
        <button
          v-if="panorama.frames.length > 1"
          class="frame-ctrl-delete"
          @click="pendingDeleteFrameId = frame.id"
          title="Remove frame"
        ><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>

    <div class="canvas-row">
      <div ref="wrapperRef" class="panorama-canvas-wrapper" @pointerdown.stop :class="{ 'drop-target': isTouchDragActive }">
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
      </div>
    </div>

    <!-- Resize handle overlay (HTML so handles are always proper CSS-pixel size) -->
    <div v-if="selectedImage && !isCropMode" class="resize-overlay" :style="resizeOverlayStyle">
      <!-- Context menu button (hamburger) — centered -->
      <button class="context-btn" @click.stop="showContextMenu = !showContextMenu" title="Image options">
        <i class="fa-solid fa-bars"></i>
      </button>
      <!-- Context popover -->
      <div v-if="showContextMenu" class="context-popover" @click.stop>
        <button class="context-item" @click="enterCropMode">
          <i class="fa-solid fa-crop-simple"></i> Crop
        </button>
        <button
          v-if="selectedImage?.slotBinding"
          class="context-item context-item-danger"
          @click="handleExitTemplateMode"
        >
          <i class="fa-solid fa-arrow-right-from-bracket"></i> Exit Template
        </button>
      </div>
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

    <!-- Crop mode overlay -->
    <div v-if="selectedImage && isCropMode" class="crop-overlay" :style="cropOverlayStyle">
      <!-- Dark mask regions (the 4 trimmed strips) -->
      <div class="crop-mask crop-mask-top"    :style="{ height: `${(selectedImage.crop?.top    ?? 0) * 100}%` }"></div>
      <div class="crop-mask crop-mask-bottom" :style="{ height: `${(selectedImage.crop?.bottom ?? 0) * 100}%` }"></div>
      <div class="crop-mask crop-mask-left"   :style="{ width:  `${(selectedImage.crop?.left   ?? 0) * 100}%`, top: `${(selectedImage.crop?.top ?? 0) * 100}%`, bottom: `${(selectedImage.crop?.bottom ?? 0) * 100}%` }"></div>
      <div class="crop-mask crop-mask-right"  :style="{ width:  `${(selectedImage.crop?.right  ?? 0) * 100}%`, top: `${(selectedImage.crop?.top ?? 0) * 100}%`, bottom: `${(selectedImage.crop?.bottom ?? 0) * 100}%` }"></div>
      <!-- 4 draggable edge bars -->
      <div class="crop-bar crop-bar-top"    :style="cropBarStyles.top"    @mousedown="startCropDrag($event, 'top')"    @touchstart="startCropDrag($event, 'top')"></div>
      <div class="crop-bar crop-bar-bottom" :style="cropBarStyles.bottom" @mousedown="startCropDrag($event, 'bottom')" @touchstart="startCropDrag($event, 'bottom')"></div>
      <div class="crop-bar crop-bar-left"   :style="cropBarStyles.left"   @mousedown="startCropDrag($event, 'left')"   @touchstart="startCropDrag($event, 'left')"></div>
      <div class="crop-bar crop-bar-right"  :style="cropBarStyles.right"  @mousedown="startCropDrag($event, 'right')"  @touchstart="startCropDrag($event, 'right')"></div>
      <!-- Done button -->
      <button class="crop-done-btn" @click.stop="exitCropMode">Done</button>
    </div>

    <!-- Snap guide lines -->
    <div
      v-for="line in activeSnapLines"
      :key="`${line.axis}-${line.position}`"
      class="snap-line"
      :class="line.axis === 'x' ? 'snap-line-v' : 'snap-line-h'"
      :style="line.axis === 'x'
        ? { left: `${line.position * displayScale}px` }
        : { top:  `${line.position * displayScale}px` }"
    ></div>

      </div><!-- .panorama-canvas-wrapper -->

      <!-- Add frame button: square, to the right of the canvas -->
      <div class="frame-add-ctrl" :style="addFrameCtrlStyle">
        <button class="frame-add-btn" @click="addNewFrame" title="Add frame">
          <i class="fa-solid fa-plus"></i>
          <span>Add</span>
        </button>
        <select v-model="newFrameRatio" class="frame-add-select">
          <option v-for="r in aspectRatios" :key="r.name" :value="r.name">{{ r.label }}</option>
        </select>
      </div>
    </div><!-- .canvas-row -->

  </div><!-- .canvas-area -->

  <ConfirmModal
    v-if="pendingDeleteFrameId"
    message="Remove this frame?"
    confirmLabel="Remove"
    @confirm="confirmFrameDelete"
    @cancel="pendingDeleteFrameId = null"
  />

  <TemplatePickerModal
    v-if="showTemplatePickerForFrame"
    :frame="showTemplatePickerForFrame"
    :panorama="panorama"
    @apply="handleTemplateApply"
    @cancel="showTemplatePickerForFrame = null"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { Panorama, Frame } from '@/types'
import { getVisibleRect } from '@/types'
import { useCanvas } from '@/composables/useCanvas'
import { useImageInteraction } from '@/composables/useImageInteraction'
import { snapPosition, snapResizeResult, beginResizeSnap, endResizeSnap } from '@/composables/useSnapSettings'
import type { SnapLine } from '@/composables/useSnapSettings'
import { isTouchDragActive, touchDropPending } from '@/composables/useTouchDropState'
import { usePanorama } from '@/composables/usePanorama'
import { ASPECT_RATIOS, getAspectRatioByName } from '@/utils/aspectRatios'
import { recomputeSlotCrop, coverFitToSlot, findNearestSlot, exitTemplateMode, applyTemplate } from '@/composables/useTemplateMode'
import { TEMPLATES } from '@/data/templates'
import ConfirmModal from './ConfirmModal.vue'
import TemplatePickerModal from './TemplatePickerModal.vue'

const props = defineProps<{ panorama: Panorama }>()
const emit  = defineEmits<{ update: [] }>()

const { renderPanorama, addImageToPanorama, getImageAtPosition } = useCanvas()
const {
  selectedImageId, isDragging,
  selectImage, startDrag, updateDrag, endDrag,
  startResize, endResize,
  deleteSelected, clearSelection
} = useImageInteraction()

const canvasRef = ref<HTMLCanvasElement>()
const activeSnapLines = ref<SnapLine[]>([])

// ── Frame management ──────────────────────────────────────────────────────
const { addFrame, removeFrame, updateFrameAspectRatio } = usePanorama()
const aspectRatios = ASPECT_RATIOS
const newFrameRatio = ref('square')
const pendingDeleteFrameId = ref<string | null>(null)

const frameCtrlStyle = (frame: Frame) => ({
  left:      `${(frame.xOffset + frame.aspectRatio.width / 2) * displayScale.value}px`,
  transform: 'translateX(-50%)',
})
const frameControlsRowStyle = computed(() => ({
  width: `${props.panorama.totalWidth * displayScale.value}px`,
}))
const addFrameCtrlStyle = computed(() => ({
  width:  `${88}px`,
  height: `${88}px`,
}))
const handleFrameRatioChange = (frameId: string, event: Event) => {
  updateFrameAspectRatio(frameId, (event.target as HTMLSelectElement).value)
}
const addNewFrame = () => { addFrame(getAspectRatioByName(newFrameRatio.value)) }
const confirmFrameDelete = () => {
  if (pendingDeleteFrameId.value) removeFrame(pendingDeleteFrameId.value)
  pendingDeleteFrameId.value = null
}

// ── Template picker ────────────────────────────────────────────────────────
const showTemplatePickerForFrame = ref<Frame | null>(null)

const openTemplatePicker = (frame: Frame) => {
  showTemplatePickerForFrame.value = frame
}

const handleTemplateApply = (templateId: string, insertFrameIndex: number) => {
  const template = TEMPLATES.find(t => t.id === templateId)
  if (!template) return
  applyTemplate({ panorama: props.panorama, template, insertIndex: insertFrameIndex })
  showTemplatePickerForFrame.value = null
  emit('update')
  render()
}

const handleExitTemplateMode = () => {
  const img = selectedImage.value
  if (!img?.slotBinding) return
  const groupId = img.slotBinding.templateGroupId
  exitTemplateMode(props.panorama, groupId)
  showContextMenu.value = false
  emit('update')
  render()
}


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
    left:          `${frame.xOffset * scale}px`,
    width:         `${frame.aspectRatio.width  * scale}px`,
    height:        `${frame.aspectRatio.height * scale}px`,
    top:           `${((props.panorama.maxHeight - frame.aspectRatio.height) / 2) * scale}px`,
    borderColor:   frame.templateMode ? 'rgba(72, 187, 120, 0.5)' : 'rgba(66, 153, 225, 0.5)',
    background:    frame.templateMode ? 'rgba(72, 187, 120, 0.04)' : 'rgba(66, 153, 225, 0.05)',
  }
}

// ── Resize handle overlay ─────────────────────────────────────────────────
const selectedImage = computed(() =>
  selectedImageId.value
    ? (props.panorama.placedImages.find(img => img.imageId === selectedImageId.value) ?? null)
    : null
)

// Visible (cropped) rect of the selected image in canvas-space
const selectedVisibleRect = computed(() => selectedImage.value ? getVisibleRect(selectedImage.value) : null)

const resizeOverlayStyle = computed(() => {
  const vr = selectedVisibleRect.value
  if (!vr) return {}
  const s = displayScale.value
  const isTemplate = !!selectedImage.value?.slotBinding
  return {
    left:    `${vr.x * s}px`,
    top:     `${vr.y * s}px`,
    width:   `${vr.w * s}px`,
    height:  `${vr.h * s}px`,
    outline: `2px solid ${isTemplate ? '#48bb78' : '#4299e1'}`,
  }
})

// ── Crop mode ─────────────────────────────────────────────────────────────
const cropModeImageId  = ref<string | null>(null)
const showContextMenu  = ref(false)

const isCropMode = computed(() => cropModeImageId.value !== null && cropModeImageId.value === selectedImageId.value)

const enterCropMode = () => {
  if (!selectedImageId.value) return
  // Ensure crop is initialised
  const img = selectedImage.value
  if (img && !img.crop) img.crop = { left: 0, top: 0, right: 0, bottom: 0 }
  cropModeImageId.value = selectedImageId.value
  showContextMenu.value = false
}

const exitCropMode = () => {
  cropModeImageId.value = null
  emit('update')
}

// Crop bar overlay style (positioned at full image box)
const cropOverlayStyle = computed(() => {
  const img = selectedImage.value
  if (!img) return {}
  const s = displayScale.value
  return {
    left:   `${img.x      * s}px`,
    top:    `${img.y      * s}px`,
    width:  `${img.width  * s}px`,
    height: `${img.height * s}px`
  }
})

// Position of each crop bar within the crop overlay (in CSS %)
const cropBarStyles = computed(() => {
  const img = selectedImage.value
  if (!img) return { top: {}, bottom: {}, left: {}, right: {} }
  const c = img.crop ?? { left: 0, top: 0, right: 0, bottom: 0 }
  return {
    top:    { top:    `calc(${c.top    * 100}% - 6px)`, left: '0', right: '0', height: '12px', cursor: 'ns-resize' },
    bottom: { bottom: `calc(${c.bottom * 100}% - 6px)`, left: '0', right: '0', height: '12px', cursor: 'ns-resize' },
    left:   { left:   `calc(${c.left   * 100}% - 6px)`, top: '0', bottom: '0', width: '12px', cursor: 'ew-resize' },
    right:  { right:  `calc(${c.right  * 100}% - 6px)`, top: '0', bottom: '0', width: '12px', cursor: 'ew-resize' },
  }
})

type CropEdge = 'top' | 'bottom' | 'left' | 'right'

const startCropDrag = (event: MouseEvent | TouchEvent, edge: CropEdge) => {
  const img = selectedImage.value
  if (!img || !img.crop) return
  event.stopPropagation()
  event.preventDefault()

  const isTouch = event instanceof TouchEvent
  const getClient = (e: MouseEvent | TouchEvent) =>
    e instanceof TouchEvent ? { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY }
                            : { x: e.clientX,              y: e.clientY }

  const startClient = getClient(event)
  const startCrop   = { ...img.crop }
  const imgW = img.width
  const imgH = img.height

  const onMove = (e: MouseEvent | TouchEvent) => {
    if (e instanceof TouchEvent) e.preventDefault()
    const { x, y } = getClient(e)
    const dx = (x - startClient.x) / displayScale.value
    const dy = (y - startClient.y) / displayScale.value

    const c = img.crop!
    if (edge === 'top') {
      c.top    = Math.max(0, Math.min(startCrop.top    + dy / imgH, 1 - startCrop.bottom - 0.05))
    } else if (edge === 'bottom') {
      c.bottom = Math.max(0, Math.min(startCrop.bottom - dy / imgH, 1 - startCrop.top    - 0.05))
    } else if (edge === 'left') {
      c.left   = Math.max(0, Math.min(startCrop.left   + dx / imgW, 1 - startCrop.right  - 0.05))
    } else {
      c.right  = Math.max(0, Math.min(startCrop.right  - dx / imgW, 1 - startCrop.left   - 0.05))
    }
    render()
  }

  const onEnd = () => {
    emit('update')
    window.removeEventListener('mousemove', onMove as any)
    window.removeEventListener('mouseup',   onEnd)
    window.removeEventListener('touchmove', onMove as any)
    window.removeEventListener('touchend',  onEnd)
  }

  if (isTouch) {
    window.addEventListener('touchmove', onMove as any, { passive: false })
    window.addEventListener('touchend',  onEnd)
  } else {
    window.addEventListener('mousemove', onMove as any)
    window.addEventListener('mouseup',   onEnd)
  }
}

type ResizeCorner = 'tl' | 'tr' | 'bl' | 'br'

const MIN_IMAGE_SIZE = 50 // canvas pixels

/**
 * Compute a full-box resize result using the VISIBLE rect geometry.
 * Scale = distance(cursor, visibleFixed) / origVisDiagonal.
 * This is the correct approach when handles are on visible rect corners.
 */
const computeResize = (
  cx: number, cy: number,
  visFixedX: number, visFixedY: number,
  origVr: { w: number; h: number },
  origImg: { width: number; height: number; crop?: { left: number; top: number; right: number; bottom: number } },
  corner: ResizeCorner
): { x: number; y: number; width: number; height: number } => {
  const crop = origImg.crop ?? { left: 0, top: 0, right: 0, bottom: 0 }
  const origVisDiag = Math.sqrt(origVr.w ** 2 + origVr.h ** 2)
  const dist  = Math.sqrt((cx - visFixedX) ** 2 + (cy - visFixedY) ** 2)
  const minScale = MIN_IMAGE_SIZE / Math.min(origVr.w, origVr.h)
  const scale = Math.max(dist / origVisDiag, minScale)

  const newVisW = origVr.w * scale
  const newVisH = origVr.h * scale
  const newW    = newVisW / (1 - crop.left - crop.right)
  const newH    = newVisH / (1 - crop.top  - crop.bottom)

  const rightMoves  = corner === 'br' || corner === 'tr'
  const bottomMoves = corner === 'br' || corner === 'bl'
  const newX = rightMoves  ? visFixedX - crop.left * newW         : visFixedX - newW * (1 - crop.right)
  const newY = bottomMoves ? visFixedY - crop.top  * newH         : visFixedY - newH * (1 - crop.bottom)

  return { x: newX, y: newY, width: newW, height: newH }
}

// Desktop: mousedown on handle → window mousemove/mouseup
const startCornerResize = (event: MouseEvent, corner: ResizeCorner) => {
  if (!selectedImage.value) return
  event.stopPropagation()
  event.preventDefault()

  const img = selectedImage.value
  const vr  = getVisibleRect(img)
  const c   = img.crop ?? { left: 0, top: 0, right: 0, bottom: 0 }
  const visFixedX = (corner === 'tl' || corner === 'bl') ? vr.x + vr.w : vr.x
  const visFixedY = (corner === 'tl' || corner === 'tr') ? vr.y + vr.h : vr.y
  const origVr  = { w: vr.w, h: vr.h }
  const origImg = { width: img.width, height: img.height, crop: { ...c } }

  startResize(corner, img)
  beginResizeSnap()

  const onMove = (e: MouseEvent) => {
    if (!selectedImage.value) return
    const { x, y } = getCanvasCoordinates(e)
    const pos = computeResize(x, y, visFixedX, visFixedY, origVr, origImg, corner)
    const snapped = snapResizeResult(
      pos, visFixedX, visFixedY, origVr.w, origVr.h,
      c.left, c.top, c.right, c.bottom,
      corner, props.panorama, selectedImage.value.imageId
    )
    Object.assign(selectedImage.value, snapped.result)
    if (selectedImage.value.slotBinding) selectedImage.value.crop = recomputeSlotCrop(selectedImage.value)
    activeSnapLines.value = snapped.snapLines
    render()
  }
  const onUp = () => {
    endResize(); endResizeSnap()
    activeSnapLines.value = []
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

  const img = selectedImage.value
  const vr  = getVisibleRect(img)
  const c   = img.crop ?? { left: 0, top: 0, right: 0, bottom: 0 }
  const visFixedX = (corner === 'tl' || corner === 'bl') ? vr.x + vr.w : vr.x
  const visFixedY = (corner === 'tl' || corner === 'tr') ? vr.y + vr.h : vr.y
  const origVr  = { w: vr.w, h: vr.h }
  const origImg = { width: img.width, height: img.height, crop: { ...c } }

  startResize(corner, img)
  beginResizeSnap()

  const onMove = (e: TouchEvent) => {
    if (!selectedImage.value || e.touches.length !== 1) return
    e.preventDefault()
    const { x, y } = getCanvasCoordinates(e.touches[0]!)
    const pos = computeResize(x, y, visFixedX, visFixedY, origVr, origImg, corner)
    const snapped = snapResizeResult(
      pos, visFixedX, visFixedY, origVr.w, origVr.h,
      c.left, c.top, c.right, c.bottom,
      corner, props.panorama, selectedImage.value.imageId
    )
    Object.assign(selectedImage.value, snapped.result)
    if (selectedImage.value.slotBinding) selectedImage.value.crop = recomputeSlotCrop(selectedImage.value)
    activeSnapLines.value = snapped.snapLines
    render()
  }
  const onEnd = () => {
    endResize(); endResizeSnap()
    activeSnapLines.value = []
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
    if (image) {
      if (image.slotBinding) {
        // Template mode: image moves freely behind the fixed slot rect — no snap,
        // just clamp so the image always fully covers the slot.
        const s = image.slotBinding
        image.x = Math.min(Math.max(newPos.x, s.slotX + s.slotW - image.width), s.slotX)
        image.y = Math.min(Math.max(newPos.y, s.slotY + s.slotH - image.height), s.slotY)
        image.crop = recomputeSlotCrop(image)
        activeSnapLines.value = []
      } else {
        const vr = getVisibleRect({ ...image, x: newPos.x, y: newPos.y })
        const snapped = snapPosition(vr.x, vr.y, vr.w, vr.h, props.panorama, image.imageId)
        const crop = image.crop ?? { left: 0, top: 0, right: 0, bottom: 0 }
        image.x = snapped.x - crop.left * image.width
        image.y = snapped.y - crop.top  * image.height
        activeSnapLines.value = snapped.snapLines
      }
      render()
    }
  }
}

const handleMouseUp = () => {
  if (isDragging.value) { endDrag(); activeSnapLines.value = []; emit('update') }
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
    if (image) {
      if (image.slotBinding) {
        const s = image.slotBinding
        image.x = Math.min(Math.max(newPos.x, s.slotX + s.slotW - image.width), s.slotX)
        image.y = Math.min(Math.max(newPos.y, s.slotY + s.slotH - image.height), s.slotY)
        image.crop = recomputeSlotCrop(image)
        activeSnapLines.value = []
      } else {
        const vr = getVisibleRect({ ...image, x: newPos.x, y: newPos.y })
        const snapped = snapPosition(vr.x, vr.y, vr.w, vr.h, props.panorama, image.imageId)
        const crop = image.crop ?? { left: 0, top: 0, right: 0, bottom: 0 }
        image.x = snapped.x - crop.left * image.width
        image.y = snapped.y - crop.top  * image.height
        activeSnapLines.value = snapped.snapLines
      }
      render()
    }
  }
}

const handleTouchEnd = () => {
  if (isDragging.value) { endDrag(); activeSnapLines.value = []; emit('update') }
}

// Shared helper: after placing an image, snap it to the nearest template slot if applicable
const snapToTemplateSlot = (imageId: string, x: number, y: number) => {
  const placed = props.panorama.placedImages.find(img => img.imageId === imageId)
  if (!placed) return
  const frame = props.panorama.frames.find(f =>
    f.templateMode && f.templateSlots &&
    x >= f.xOffset && x <= f.xOffset + f.aspectRatio.width
  )
  if (frame?.templateSlots && frame.templateGroupId) {
    const slot = findNearestSlot(props.panorama, x, y, frame.templateGroupId)
    if (slot) {
      const fit = coverFitToSlot(placed.width, placed.height, slot.slotX, slot.slotY, slot.slotW, slot.slotH)
      Object.assign(placed, fit)
      placed.slotBinding = slot
      placed.crop = recomputeSlotCrop(placed)
    }
  }
}

const handleDrop = (event: DragEvent) => {
  if (!canvasRef.value) return
  const imageId = event.dataTransfer?.getData('imageId')
  if (!imageId) return
  const { x, y } = getCanvasCoordinates(event as any)
  addImageToPanorama(props.panorama, imageId, { x, y })
  snapToTemplateSlot(imageId, x, y)
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
    if (isCropMode.value) { exitCropMode() }
    else { clearSelection(); render() }
    showContextMenu.value = false
  }
}

// Deselect when tapping/clicking anywhere outside the canvas wrapper
const handleDocumentPointerDown = () => {
  if (selectedImageId.value) {
    clearSelection()
    cropModeImageId.value = null
    showContextMenu.value = false
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

// Handle touch drops from the image tray
watch(touchDropPending, (drop) => {
  if (!drop || !canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  // Only accept if the finger landed inside the canvas
  if (drop.clientX < rect.left || drop.clientX > rect.right ||
      drop.clientY < rect.top  || drop.clientY > rect.bottom) {
    touchDropPending.value = null
    return
  }
  const x = (drop.clientX - rect.left) / displayScale.value
  const y = (drop.clientY - rect.top)  / displayScale.value
  addImageToPanorama(props.panorama, drop.imageId, { x, y })
  snapToTemplateSlot(drop.imageId, x, y)
  render()
  emit('update')
  touchDropPending.value = null
})
</script>

<style scoped>
.canvas-area {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
}

/* ── Frame controls row ─────────────────────────────────────────────────── */
.frame-controls-row {
  position: relative;
  height: 40px;
  flex-shrink: 0;
  margin-bottom: 6px;
}

.frame-ctrl {
  position: absolute;
  top: 0;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  white-space: nowrap;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
}

.frame-ctrl-num {
  font-size: 0.7rem;
  font-weight: 700;
  color: #a0aec0;
  flex-shrink: 0;
}

.frame-ctrl-select {
  border: none;
  width: 90px;
  background: none;
  font-size: 0.7rem;
  color: #4a5568;
  cursor: pointer;
  padding: 0 2px;
}
.frame-ctrl-select:focus { outline: none; }

.frame-ctrl-delete {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: none;
  background: none;
  color: #e53e3e;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  padding: 0;
  transition: background 0.12s;
}
.frame-ctrl-delete:hover { background: #fff5f5; }

.frame-ctrl-tmpl-btn {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: none;
  background: none;
  color: #a0aec0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  padding: 0;
  transition: background 0.12s, color 0.12s;
}
.frame-ctrl-tmpl-btn:hover { background: #ebf8ff; color: #3182ce; }
.frame-ctrl-tmpl-btn.active { color: #38a169; background: #f0fff4; }

.canvas-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Add frame control ──────────────────────────────────────────────────── */
.frame-add-ctrl {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 2px dashed #cbd5e0;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #f7fafc;
  transition: border-color 0.15s, background 0.15s;
  box-sizing: border-box;
}
.frame-add-ctrl:hover {
  border-color: #4299e1;
  background: #ebf8ff;
}

.frame-add-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: none;
  background: none;
  cursor: pointer;
  color: #4a5568;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0;
  transition: color 0.15s;
}
.frame-add-btn:hover { color: #4299e1; }
.frame-add-btn i { font-size: 0.8rem; }

.frame-add-select {
  border: none;
  border-top: 1px solid #e2e8f0;
  background: white;
  font-size: 0.6rem;
  padding: 2px 4px;
  cursor: pointer;
  color: #4a5568;
  text-align: center;
}
.frame-add-select:focus { outline: none; }

.panorama-canvas-wrapper {
  position: relative;
  display: inline-block;
}

/* Drop-target highlight while touch-dragging from the tray */
.panorama-canvas-wrapper.drop-target::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px dashed #4299e1;
  border-radius: 0.5rem;
  background: rgba(66, 153, 225, 0.07);
  pointer-events: none;
  z-index: 8;
}

.panorama-canvas {
  box-shadow: 0 0 0 2px #cbd5e0,
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-radius: 0.5rem;
  background: white;
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
  pointer-events: none;
  z-index: 5;
  /* outline is set dynamically via :style (green in template mode, blue otherwise) */
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

/* ── Context menu button ────────────────────────────────────────────────── */
.context-btn {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 2rem;
  height: 2rem;
  background: rgba(0, 0, 0, 0.55);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: all;
  transition: background 0.15s;
  backdrop-filter: blur(2px);
  z-index: 6;
}
.context-btn:hover { background: rgba(0, 0, 0, 0.75); }

.context-popover {
  position: absolute;
  top: calc(8px + 2rem + 4px);
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  overflow: hidden;
  pointer-events: all;
  z-index: 20;
  min-width: 110px;
}
.context-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  color: #2d3748;
  white-space: nowrap;
  transition: background 0.12s;
}
.context-item:hover { background: #f7fafc; }
.context-item-danger { color: #e53e3e !important; }
.context-item-danger:hover { background: #fff5f5 !important; }


.crop-overlay {
  position: absolute;
  pointer-events: none;
  z-index: 5;
}

.crop-mask {
  position: absolute;
  background: rgba(0, 0, 0, 0.45);
  pointer-events: none;
}
.crop-mask-top    { top: 0;    left: 0; right: 0; }
.crop-mask-bottom { bottom: 0; left: 0; right: 0; }
.crop-mask-left   { left: 0; }
.crop-mask-right  { right: 0; }

.crop-bar {
  position: absolute;
  pointer-events: all;
  background: rgba(255, 255, 255, 0.85);
  border: 2px solid #4299e1;
  box-sizing: border-box;
  border-radius: 4px;
  z-index: 7;
  touch-action: none;
}
.crop-bar:hover { background: white; }

.crop-done-btn {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 1rem;
  padding: 0.3rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  pointer-events: all;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: background 0.15s;
  white-space: nowrap;
}
.crop-done-btn:hover { background: #3182ce; }

/* Snap guide lines */
.snap-line {
  position: absolute;
  pointer-events: none;
  z-index: 10;
  background: rgba(66, 153, 225, 0.75);
}
.snap-line-v { /* vertical line — x-axis snap */
  top: 0;
  width: 1px;
  height: 100%;
}
.snap-line-h { /* horizontal line — y-axis snap */
  left: 0;
  width: 100%;
  height: 1px;
}
</style>
