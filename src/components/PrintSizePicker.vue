<template>
  <div class="size-picker">
    <label class="picker-label">Print Size</label>

    <select class="size-select" :value="selectValue" @change="handleSelectChange">
      <option v-for="size in PRINT_SIZES" :key="size.name" :value="size.name">
        {{ size.label }} — {{ pxLabel(size) }}
      </option>
      <option value="custom">Custom…</option>
    </select>

    <!-- Custom dimension inputs, shown only when "Custom" is selected -->
    <template v-if="isCustom">
      <div class="custom-inputs">
        <div class="dim-group">
          <label class="dim-label">W (in)</label>
          <input
            type="number"
            class="dim-input"
            v-model.number="customW"
            min="1" max="48" step="0.25"
            @change="commitCustom"
            @keydown.enter="commitCustom"
          />
        </div>
        <span class="dim-sep">×</span>
        <div class="dim-group">
          <label class="dim-label">H (in)</label>
          <input
            type="number"
            class="dim-input"
            v-model.number="customH"
            min="1" max="48" step="0.25"
            @change="commitCustom"
            @keydown.enter="commitCustom"
          />
        </div>
        <span class="custom-px-hint">{{ customPxHint }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PrintSize } from '@/types'
import { printSizeToAspectRatio } from '@/types'
import { PRINT_SIZES, PRINT_DPI } from '@/data/printSizes'

const props = defineProps<{ modelValue: PrintSize }>()
const emit  = defineEmits<{ (e: 'update:modelValue', value: PrintSize): void }>()

const isCustom    = ref(props.modelValue.name === 'custom')
const customW     = ref(props.modelValue.widthIn)
const customH     = ref(props.modelValue.heightIn)

const selectValue = computed(() => isCustom.value ? 'custom' : props.modelValue.name)

const pxLabel = (size: PrintSize) => {
  const ar = printSizeToAspectRatio(size)
  return `${ar.width}×${ar.height}px`
}

const customPxHint = computed(() => {
  if (!customW.value || !customH.value) return ''
  return `${Math.round(customW.value * PRINT_DPI)}×${Math.round(customH.value * PRINT_DPI)}px @ ${PRINT_DPI} DPI`
})

const handleSelectChange = (e: Event) => {
  const val = (e.target as HTMLSelectElement).value
  if (val === 'custom') {
    isCustom.value = true
    // Default custom dims to the current size
    customW.value = props.modelValue.widthIn
    customH.value = props.modelValue.heightIn
  } else {
    isCustom.value = false
    const found = PRINT_SIZES.find(s => s.name === val)
    if (found) emit('update:modelValue', found)
  }
}

const commitCustom = () => {
  const w = Math.max(0.5, customW.value ?? 4)
  const h = Math.max(0.5, customH.value ?? 6)
  customW.value = w
  customH.value = h
  emit('update:modelValue', {
    name:     'custom',
    label:    `${w}"×${h}" Custom`,
    widthIn:  w,
    heightIn: h,
    dpi:      PRINT_DPI,
  })
}
</script>

<style scoped>
.size-picker {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.picker-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #4a5568;
  white-space: nowrap;
  flex-shrink: 0;
}

.size-select {
  padding: 0.3rem 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 0.375rem;
  background: white;
  font-size: 0.8rem;
  color: #2d3748;
  cursor: pointer;
  min-width: 220px;
}
.size-select:focus { outline: 2px solid #667eea; outline-offset: 1px; }

.custom-inputs {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.dim-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.dim-label {
  font-size: 0.75rem;
  color: #718096;
  white-space: nowrap;
}

.dim-input {
  width: 64px;
  padding: 0.3rem 0.4rem;
  border: 1px solid #cbd5e0;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  color: #2d3748;
  text-align: center;
}
.dim-input:focus { outline: 2px solid #667eea; outline-offset: 1px; }

.dim-sep {
  font-size: 0.9rem;
  color: #718096;
  font-weight: 600;
}

.custom-px-hint {
  font-size: 0.72rem;
  color: #718096;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
}
</style>

