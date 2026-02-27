<template>
  <div
    class="image-uploader"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    :class="{ dragging: isDragging }"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple
      @change="handleFileSelect"
      style="display: none"
    />

    <div class="upload-zone" @click="triggerFileSelect">
      <svg
        class="upload-icon"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      <p class="upload-text">
        <strong>Click to upload</strong> or drag and drop
      </p>
      <p class="upload-hint">PNG, JPG, or WebP</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useImageStore } from '@/composables/useImageStore'

const { addImages } = useImageStore()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)

const triggerFileSelect = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    await addImages(Array.from(target.files))
    target.value = ''
  }
}

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    await addImages(Array.from(event.dataTransfer.files))
  }
}
</script>

<style scoped>
.image-uploader {
  padding: 1rem;
}

.upload-zone {
  border: 2px dashed #cbd5e0;
  border-radius: 0.5rem;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #f7fafc;
}

.upload-zone:hover {
  border-color: #4299e1;
  background: #ebf8ff;
}

.image-uploader.dragging .upload-zone {
  border-color: #3182ce;
  background: #bee3f8;
}

.upload-icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  color: #718096;
}

.upload-text {
  margin: 0.5rem 0;
  color: #2d3748;
  font-size: 1rem;
}

.upload-text strong {
  color: #3182ce;
}

.upload-hint {
  margin: 0.5rem 0 0;
  color: #718096;
  font-size: 0.875rem;
}
</style>
