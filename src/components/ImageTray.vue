<template>
  <div class="image-tray">
    <div class="tray-header" @click="collapsed = !collapsed">
      <span class="tray-title">
        <i class="fa-solid fa-images"></i> Photos
      </span>
      <button class="tray-toggle" :aria-label="collapsed ? 'Expand photos' : 'Collapse photos'">
        <i class="fa-solid fa-chevron-down" :class="{ rotated: collapsed }"></i>
      </button>
    </div>
    <div class="tray-scroll" v-show="!collapsed">
      <!-- Upload chip – acts as a file input label -->
      <label class="tray-chip upload-chip" title="Add photos">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          @change="handleFileSelect"
          hidden
        />
        <span class="chip-upload-icon">+</span>
        <span class="chip-label">Add</span>
      </label>

      <!-- One chip per imported image -->
      <div
        v-for="image in images"
        :key="image.id"
        class="tray-chip image-chip"
        @click="handleAdd(image.id)"
        @touchstart="onChipTouchStart($event, image.id)"
      >
        <img :src="image.thumbnail || image.url" :alt="image.file.name" />
        <button class="chip-delete" @click.stop="handleRemove(image.id)" title="Remove">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useImageStore } from '@/composables/useImageStore'
import { usePanorama } from '@/composables/usePanorama'
import { useCanvas } from '@/composables/useCanvas'
import { isTouchDragActive, touchDropPending } from '@/composables/useTouchDropState'

const emit = defineEmits<{ placed: [] }>()
const collapsed = ref(false)

const { images, addImages, removeImage } = useImageStore()
const { panorama } = usePanorama()
const { addImageToPanorama } = useCanvas()

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    await addImages(Array.from(target.files))
    target.value = ''
  }
}

const handleAdd = (imageId: string) => {
  addImageToPanorama(panorama.value, imageId)
  emit('placed')
}

const handleRemove = (imageId: string) => {
  if (confirm('Remove this image?')) removeImage(imageId)
}

// ── Touch drag-to-canvas ──────────────────────────────────────────────────
const DIR_THRESHOLD   = 6   // px before locking direction

let _dragImageId: string | null = null
let _dragStartX   = 0
let _dragStartY   = 0
let _dirLocked    = false
let _isDragMode   = false
let _ghost: HTMLDivElement | null = null

const createGhost = (imageId: string, clientX: number, clientY: number): HTMLDivElement => {
  const img = images.value.find(i => i.id === imageId)
  const el  = document.createElement('div')
  Object.assign(el.style, {
    position:     'fixed',
    left:         `${clientX}px`,
    top:          `${clientY}px`,
    width:        '72px',
    height:       '72px',
    transform:    'translate(-50%, -50%) scale(1.08)',
    borderRadius: '10px',
    overflow:     'hidden',
    pointerEvents:'none',
    zIndex:       '9999',
    opacity:      '0.92',
    boxShadow:    '0 8px 24px rgba(0,0,0,0.35)',
    border:       '2px solid #4299e1',
    background:   '#edf2f7',
  })
  if (img) {
    const imgEl = document.createElement('img')
    imgEl.src   = img.thumbnail || img.url
    Object.assign(imgEl.style, { width: '100%', height: '100%', objectFit: 'cover' })
    el.appendChild(imgEl)
  }
  return el
}

const cleanupTouchDrag = () => {
  if (_ghost) { document.body.removeChild(_ghost); _ghost = null }
  _dragImageId = null
  _isDragMode  = false
  _dirLocked   = false
  isTouchDragActive.value = false
  window.removeEventListener('touchmove', onChipTouchMove)
  window.removeEventListener('touchend',  onChipTouchEnd)
}

const onChipTouchMove = (e: TouchEvent) => {
  if (!_dragImageId || e.touches.length !== 1) return
  const t  = e.touches[0]!
  const dx = t.clientX - _dragStartX
  const dy = t.clientY - _dragStartY
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (!_dirLocked && dist > DIR_THRESHOLD) {
    _dirLocked = true
    if (Math.abs(dx) > Math.abs(dy)) {
      // Predominantly horizontal → let the tray scroll naturally
      cleanupTouchDrag()
      return
    }
    // Predominantly vertical → drag mode
    _isDragMode = true
    isTouchDragActive.value = true
  }

  if (!_isDragMode) return
  e.preventDefault()

  if (!_ghost) {
    _ghost = createGhost(_dragImageId, t.clientX, t.clientY)
    document.body.appendChild(_ghost)
  }
  _ghost.style.left = `${t.clientX}px`
  _ghost.style.top  = `${t.clientY}px`
}

const onChipTouchEnd = (e: TouchEvent) => {
  const wasDrag = _isDragMode
  const imageId = _dragImageId
  const t       = e.changedTouches[0]!

  if (wasDrag && imageId) {
    // Suppress the synthetic click that follows touchend
    const suppress = (ev: Event) => ev.preventDefault()
    document.addEventListener('click', suppress, { once: true, capture: true })
    touchDropPending.value = { imageId, clientX: t.clientX, clientY: t.clientY }
  }
  // If it was a tap (not drag), @click fires naturally → handleAdd

  cleanupTouchDrag()
}

const onChipTouchStart = (event: TouchEvent, imageId: string) => {
  if (event.touches.length !== 1) return
  const t      = event.touches[0]!
  _dragImageId = imageId
  _dragStartX  = t.clientX
  _dragStartY  = t.clientY
  _dirLocked   = false
  _isDragMode  = false
  window.addEventListener('touchmove', onChipTouchMove, { passive: false })
  window.addEventListener('touchend',  onChipTouchEnd)
}
</script>

<style scoped>
.image-tray {
  background: white;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
  /* hidden on desktop – the left sidebar handles images there */
  display: none;
}

.tray-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.375rem 0.75rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.tray-header:hover { background: #f7fafc; }

.tray-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #4a5568;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.tray-toggle {
  background: none;
  border: none;
  cursor: pointer;
  color: #a0aec0;
  padding: 0.125rem 0.25rem;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}
.tray-toggle:hover { color: #4a5568; }
.tray-toggle i {
  transition: transform 0.2s ease;
}
.tray-toggle i.rotated { transform: rotate(-180deg); }

.tray-scroll {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  /* hide scrollbar but keep scroll */
  scrollbar-width: none;
}
.tray-scroll::-webkit-scrollbar { display: none; }

/* ── Each chip ──────────────────────────────────────── */
.tray-chip {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 0.5rem;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.15s, transform 0.15s;
}

.tray-chip:active {
  transform: scale(0.93);
}

/* Upload chip */
.upload-chip {
  background: #edf2f7;
  border-color: #cbd5e0;
  border-style: dashed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
}

.upload-chip:hover {
  border-color: #4299e1;
  background: #ebf8ff;
}

.chip-upload-icon {
  font-size: 1.5rem;
  line-height: 1;
  color: #4a5568;
  font-weight: 300;
}

.chip-label {
  font-size: 0.6rem;
  font-weight: 600;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Image chip */
.image-chip {
  border-color: transparent;
}

.image-chip:hover,
.image-chip:active {
  border-color: #4299e1;
}

.image-chip img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.chip-delete {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  background: rgba(0, 0, 0, 0.65);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 0.85rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.chip-delete:hover {
  background: rgba(220, 38, 38, 0.9);
}

/* ── Show only on mobile ─────────────────────────────── */
@media (max-width: 768px) {
  .image-tray {
    display: block;
  }
}
</style>
