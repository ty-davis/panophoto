<template>
  <div class="export-panel">
    <div class="panel-header">
      <h3>Export</h3>
    </div>

    <div class="panel-body">
      <div class="export-options">
        <div class="option-group">
          <label>Format</label>
          <select v-model="exportFormat">
            <option value="png">PNG (High Quality)</option>
            <option value="jpeg">JPEG (Smaller Size)</option>
          </select>
        </div>

        <div v-if="exportFormat === 'jpeg'" class="option-group">
          <label>Quality</label>
          <input
            type="range"
            v-model.number="exportQuality"
            min="0.5"
            max="1"
            step="0.05"
          />
          <span class="quality-value">{{ Math.round(exportQuality * 100) }}%</span>
        </div>
      </div>

      <div class="export-info-box">
        <p class="info-title">What will be exported:</p>
        <ul class="info-list">
          <li>{{ frames.length }} individual frame{{ frames.length !== 1 ? 's' : '' }}</li>
          <li>1 full panorama ({{ totalWidth }}×{{ maxHeight }}px)</li>
        </ul>
      </div>

      <div class="export-actions">
        <button
          class="btn-export btn-primary"
          @click="handleExportAll"
          :disabled="isExporting || frames.length === 0"
        >
          {{ isExporting ? 'Exporting...' : 'Export All Frames' }}
        </button>
      </div>

      <div v-if="exportError" class="error-message">
        {{ exportError }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePanorama } from '@/composables/usePanorama'
import { useExport } from '@/composables/useExport'
import type { ExportOptions } from '@/types'

const { panorama, frames, totalWidth, maxHeight } = usePanorama()
const { exportAllFrames, downloadBlob } = useExport()

const exportFormat = ref<'png' | 'jpeg'>('png')
const exportQuality = ref(0.95)
const isExporting = ref(false)
const exportError = ref('')

const exportOptions = computed<ExportOptions>(() => ({
  format: exportFormat.value,
  quality: exportQuality.value
}))

const handleExportAll = async () => {
  if (frames.value.length === 0) return

  isExporting.value = true
  exportError.value = ''

  try {
    const blob = await exportAllFrames(panorama.value, exportOptions.value)
    const timestamp = new Date().toISOString().split('T')[0]
    downloadBlob(blob, `panophoto-export-${timestamp}.zip`)
  } catch (error) {
    exportError.value = error instanceof Error ? error.message : 'Export failed'
    console.error('Export error:', error)
  } finally {
    isExporting.value = false
  }
}
</script>

<style scoped>
.export-panel {
  width: 280px;
  background: white;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
}

.panel-body {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-group label {
  font-weight: 500;
  color: #4a5568;
  font-size: 0.875rem;
}

.option-group select,
.option-group input[type='range'] {
  padding: 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 0.375rem;
  background: white;
  font-size: 0.875rem;
}

.option-group select {
  cursor: pointer;
}

.quality-value {
  text-align: center;
  font-size: 0.875rem;
  color: #4a5568;
  font-weight: 500;
}

.export-info-box {
  background: #edf2f7;
  border-radius: 0.375rem;
  padding: 0.75rem;
}

.info-title {
  margin: 0 0 0.5rem;
  font-weight: 600;
  color: #2d3748;
  font-size: 0.875rem;
}

.info-list {
  margin: 0;
  padding-left: 1.25rem;
  color: #4a5568;
  font-size: 0.875rem;
}

.info-list li {
  margin: 0.25rem 0;
}

.export-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: auto;
}

.btn-export {
  width: 100%;
  padding: 0.75rem 1rem;
  font-weight: 600;
}

.btn-primary {
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #38a169;
}

.btn-primary:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

.error-message {
  padding: 0.75rem;
  background: #fed7d7;
  border: 1px solid #fc8181;
  border-radius: 0.375rem;
  color: #c53030;
  font-size: 0.875rem;
}
</style>
