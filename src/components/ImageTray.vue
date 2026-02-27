<template>
  <div class="image-tray">
    <div class="tray-scroll">
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
      >
        <img :src="image.thumbnail || image.url" :alt="image.file.name" />
        <button class="chip-delete" @click.stop="handleRemove(image.id)" title="Remove">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useImageStore } from '@/composables/useImageStore'
import { usePanorama } from '@/composables/usePanorama'
import { useCanvas } from '@/composables/useCanvas'

const emit = defineEmits<{ placed: [] }>()

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
</script>

<style scoped>
.image-tray {
  background: white;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
  /* hidden on desktop – the left sidebar handles images there */
  display: none;
}

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
