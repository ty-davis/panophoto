<template>
  <div class="print-size-picker">
    <p class="picker-label">Print Size</p>
    <div class="size-grid">
      <button
        v-for="size in PRINT_SIZES"
        :key="size.name"
        class="size-card"
        :class="{ active: modelValue?.name === size.name }"
        @click="$emit('update:modelValue', size)"
      >
        <div class="size-thumb-wrap">
          <div
            class="size-thumb"
            :style="thumbStyle(size)"
          />
        </div>
        <span class="size-name">{{ size.label }}</span>
        <span class="size-px">{{ pixelDims(size) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PrintSize } from '@/types'
import { printSizeToAspectRatio } from '@/types'
import { PRINT_SIZES } from '@/data/printSizes'

defineProps<{ modelValue: PrintSize | null }>()
defineEmits<{ (e: 'update:modelValue', value: PrintSize): void }>()

const THUMB_MAX = 48  // max dimension of the thumbnail in px

const thumbStyle = (size: PrintSize) => {
  const ar = size.widthIn / size.heightIn
  let w: number, h: number
  if (ar >= 1) {
    w = THUMB_MAX
    h = Math.round(THUMB_MAX / ar)
  } else {
    h = THUMB_MAX
    w = Math.round(THUMB_MAX * ar)
  }
  return { width: `${w}px`, height: `${h}px` }
}

const pixelDims = (size: PrintSize) => {
  const ar = printSizeToAspectRatio(size)
  return `${ar.width}×${ar.height}px`
}
</script>

<style scoped>
.print-size-picker {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.picker-label {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
}

.size-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.size-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.6rem 0.5rem;
  border: 1.5px solid #cbd5e0;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.size-card:hover {
  border-color: #a0aec0;
  background: #f7fafc;
}

.size-card.active {
  border-color: #667eea;
  background: #ebf4ff;
}

.size-thumb-wrap {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.size-thumb {
  background: #e2e8f0;
  border: 1.5px solid #a0aec0;
  border-radius: 2px;
  transition: background 0.15s;
}

.size-card.active .size-thumb {
  background: #c3dafe;
  border-color: #667eea;
}

.size-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #2d3748;
  text-align: center;
}

.size-px {
  font-size: 0.7rem;
  color: #718096;
  text-align: center;
}
</style>
