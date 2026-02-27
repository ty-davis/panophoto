<template>
  <div class="frame-list">
    <div class="frame-list-header">
      <span>Frames ({{ frames.length }})</span>
    </div>
    
    <div class="frame-items">
      <div
        v-for="(frame, index) in frames"
        :key="frame.id"
        class="frame-item"
      >
        <div class="frame-preview" :style="getFramePreviewStyle(frame)">
          <span class="frame-number">{{ index + 1 }}</span>
        </div>
        
        <div class="frame-details">
          <select
            :value="frame.aspectRatio.name"
            @change="(e) => handleAspectRatioChange(frame.id, e)"
            class="frame-ratio-select"
          >
            <option v-for="ratio in aspectRatios" :key="ratio.name" :value="ratio.name">
              {{ ratio.label }}
            </option>
          </select>
          
          <button
            v-if="frames.length > 1"
            class="frame-delete"
            @click="handleDeleteFrame(frame.id)"
            title="Remove frame"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePanorama } from '@/composables/usePanorama'
import { ASPECT_RATIOS } from '@/utils/aspectRatios'
import type { Frame } from '@/types'

const { frames, removeFrame, updateFrameAspectRatio } = usePanorama()
const aspectRatios = ASPECT_RATIOS

const getFramePreviewStyle = (frame: Frame) => {
  const maxSize = 60
  const scale = Math.min(maxSize / frame.aspectRatio.width, maxSize / frame.aspectRatio.height)
  
  return {
    width: `${frame.aspectRatio.width * scale}px`,
    height: `${frame.aspectRatio.height * scale}px`
  }
}

const handleAspectRatioChange = (frameId: string, event: Event) => {
  const target = event.target as HTMLSelectElement
  updateFrameAspectRatio(frameId, target.value)
}

const handleDeleteFrame = (frameId: string) => {
  if (confirm('Remove this frame?')) {
    removeFrame(frameId)
  }
}
</script>

<style scoped>
.frame-list {
  display: flex;
  flex-direction: column;
  background: white;
  border-top: 1px solid #e2e8f0;
  max-height: 180px;
  flex-shrink: 0;
}

.frame-list-header {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  color: #2d3748;
  font-size: 0.875rem;
}

.frame-items {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1rem;
  overflow-x: auto;
  flex: 1;
  -webkit-overflow-scrolling: touch;
}

.frame-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.frame-preview {
  border: 2px solid #cbd5e0;
  border-radius: 0.375rem;
  background: #f7fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.frame-preview:hover {
  border-color: #4299e1;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.frame-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: #a0aec0;
}

.frame-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.frame-ratio-select {
  padding: 0.375rem 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 0.25rem;
  background: white;
  font-size: 0.75rem;
  cursor: pointer;
  flex: 1;
  min-width: 100px;
}

.frame-ratio-select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.1);
}

.frame-delete {
  width: 1.75rem;
  height: 1.75rem;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.frame-delete:hover {
  background: #c53030;
}

@media (max-width: 768px) {
  .frame-list {
    max-height: 160px;
  }

  .frame-delete {
    width: 2rem;
    height: 2rem;
  }

  .frame-ratio-select {
    padding: 0.5rem;
    font-size: 0.8rem;
  }
}
</style>
