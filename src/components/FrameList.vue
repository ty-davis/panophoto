<template>
  <div class="frame-tray">
    <div class="tray-header" @click="collapsed = !collapsed">
      <span class="tray-title">
        <i class="fa-solid fa-film"></i> Frames
      </span>
      <button class="tray-toggle" :aria-label="collapsed ? 'Expand frames' : 'Collapse frames'">
        <i class="fa-solid fa-chevron-down" :class="{ rotated: collapsed }"></i>
      </button>
    </div>
    <div class="tray-scroll" v-show="!collapsed">
      <!-- Add frame chip -->
      <div class="tray-chip add-chip">
        <button class="add-btn" @click="addNewFrame" title="Add frame">
          <i class="fa-solid fa-plus"></i>
          <span>Add</span>
        </button>
        <select v-model="selectedAspectRatio" class="add-ratio-select" @click.stop>
          <option v-for="ratio in aspectRatios" :key="ratio.name" :value="ratio.name">
            {{ ratio.label }}
          </option>
        </select>
      </div>

      <!-- Existing frame chips -->
      <div
        v-for="(frame, index) in frames"
        :key="frame.id"
        class="tray-chip frame-chip"
      >
        <div class="frame-preview-wrap">
          <div class="frame-preview" :style="getFramePreviewStyle(frame)">
            <span class="frame-number">{{ index + 1 }}</span>
          </div>
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
          >×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePanorama } from '@/composables/usePanorama'
import { ASPECT_RATIOS, getAspectRatioByName } from '@/utils/aspectRatios'
import type { Frame } from '@/types'

const { frames, addFrame, removeFrame, updateFrameAspectRatio } = usePanorama()
const aspectRatios = ASPECT_RATIOS
const collapsed = ref(false)
const selectedAspectRatio = ref('square')

const addNewFrame = () => {
  addFrame(getAspectRatioByName(selectedAspectRatio.value))
}

const getFramePreviewStyle = (frame: Frame) => {
  const maxW = 64; const maxH = 48
  const scale = Math.min(maxW / frame.aspectRatio.width, maxH / frame.aspectRatio.height)
  return {
    width:  `${frame.aspectRatio.width  * scale}px`,
    height: `${frame.aspectRatio.height * scale}px`
  }
}

const handleAspectRatioChange = (frameId: string, event: Event) => {
  updateFrameAspectRatio(frameId, (event.target as HTMLSelectElement).value)
}

const handleDeleteFrame = (frameId: string) => {
  if (confirm('Remove this frame?')) removeFrame(frameId)
}
</script>

<style scoped>
.frame-tray {
  background: white;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.tray-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.375rem 0.75rem;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid transparent;
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
  align-items: stretch;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.tray-scroll::-webkit-scrollbar { display: none; }

/* ── Common chip ─────────────────────────────── */
.tray-chip {
  flex-shrink: 0;
  width: 88px;
  border-radius: 0.5rem;
  border: 2px solid #cbd5e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Add chip ────────────────────────────────── */
.add-chip {
  border-style: dashed;
  background: #f7fafc;
  cursor: pointer;
}
.add-chip:hover {
  border-color: #4299e1;
  background: #ebf8ff;
}

.add-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem 0 0.375rem;
  color: #4a5568;
  transition: color 0.15s;
}
.add-btn:hover { color: #4299e1; }
.add-btn i { font-size: 1.2rem; }
.add-btn span {
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #718096;
}

.add-ratio-select {
  width: 100%;
  border: none;
  border-top: 1px solid #e2e8f0;
  padding: 0.25rem 0.25rem;
  font-size: 0.65rem;
  background: white;
  cursor: pointer;
  color: #4a5568;
  text-align: center;
}
.add-ratio-select:focus { outline: none; }

/* ── Frame chip ──────────────────────────────── */
.frame-chip {
  background: white;
}

.frame-preview-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem;
  min-height: 52px;
}

.frame-preview {
  border: 2px solid #a0aec0;
  border-radius: 0.25rem;
  background: #edf2f7;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  transition: border-color 0.15s;
}
.frame-chip:hover .frame-preview {
  border-color: #4299e1;
}

.frame-number {
  font-size: 1rem;
  font-weight: 700;
  color: #a0aec0;
}

.frame-details {
  display: flex;
  align-items: center;
  border-top: 1px solid #e2e8f0;
}

.frame-ratio-select {
  flex: 1;
  min-width: 0;
  border: none;
  padding: 0.25rem 0.25rem;
  font-size: 0.65rem;
  background: white;
  cursor: pointer;
  color: #4a5568;
}
.frame-ratio-select:focus { outline: none; }

.frame-delete {
  width: 24px;
  min-width: 24px;
  height: 24px;
  background: none;
  color: #e53e3e;
  border: none;
  border-left: 1px solid #e2e8f0;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.15s, color 0.15s;
}
.frame-delete:hover {
  background: #fff5f5;
  color: #c53030;
}

@media (max-width: 768px) {
  .tray-chip { width: 80px; }
  .frame-delete { width: 28px; min-width: 28px; height: 28px; }
}
</style>
