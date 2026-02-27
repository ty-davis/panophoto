<template>
  <div class="image-library">
    <div class="library-header">
      <h3>Images</h3>
      <span class="image-count">{{ images.length }}</span>
    </div>
    
    <div class="image-grid">
      <div
        v-for="image in images"
        :key="image.id"
        class="image-item"
        draggable="true"
        @dragstart="handleDragStart($event, image.id)"
      >
        <img :src="image.thumbnail || image.url" :alt="image.file.name" />
        <button class="delete-btn" @click="handleRemove(image.id)" title="Remove image">
          ×
        </button>
        <div class="image-info">
          <span class="image-size">{{ image.width }}×{{ image.height }}</span>
        </div>
      </div>
    </div>

    <div v-if="images.length === 0" class="empty-state">
      <p>No images uploaded yet</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useImageStore } from '@/composables/useImageStore'

const { images, removeImage } = useImageStore()

const handleDragStart = (event: DragEvent, imageId: string) => {
  event.dataTransfer!.effectAllowed = 'copy'
  event.dataTransfer!.setData('imageId', imageId)
}

const handleRemove = (imageId: string) => {
  if (confirm('Remove this image?')) {
    removeImage(imageId)
  }
}
</script>

<style scoped>
.image-library {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #e2e8f0;
}

.library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.library-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
}

.image-count {
  background: #edf2f7;
  color: #4a5568;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.image-grid {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
  align-content: start;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.5rem;
  overflow: hidden;
  cursor: move;
  background: #f7fafc;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.image-item:hover {
  border-color: #4299e1;
  transform: scale(1.05);
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.delete-btn {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(220, 38, 38, 0.9);
}

.image-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  padding: 1rem 0.5rem 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-item:hover .image-info {
  opacity: 1;
}

.image-size {
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  padding: 2rem;
  text-align: center;
}
</style>
