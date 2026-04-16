<template>
  <div class="print-export-panel">
    <div class="panel-header">
      <h3>Export Print</h3>
    </div>

    <div class="panel-body">
      <div class="export-options">
        <div class="option-group">
          <label>Format</label>
          <select v-model="exportFormat">
            <option value="jpeg">JPEG (Recommended for print labs)</option>
            <option value="png">PNG (Lossless)</option>
          </select>
        </div>

        <div v-if="exportFormat === 'jpeg'" class="option-group">
          <label>Quality</label>
          <input
            type="range"
            v-model.number="exportQuality"
            min="0.7"
            max="1"
            step="0.05"
          />
          <span class="quality-value">{{ Math.round(exportQuality * 100) }}%</span>
        </div>
      </div>

      <div class="export-info-box">
        <p class="info-title">Output details</p>
        <ul class="info-list">
          <li>{{ activePrintSize.label }}</li>
          <li>{{ pixelW }}×{{ pixelH }}px &nbsp;@&nbsp; {{ activePrintSize.dpi }} DPI</li>
          <li>{{ activePrintSize.widthIn }}"×{{ activePrintSize.heightIn }}" physical</li>
        </ul>
      </div>

      <div class="export-actions">
        <button
          class="btn-print"
          @click="handleExport"
          :disabled="isExporting || !hasImages"
        >
          <i class="fa-solid fa-print"></i>
          {{ isExporting ? 'Preparing…' : 'Export Print File' }}
        </button>
      </div>

      <div v-if="exportError" class="error-message">{{ exportError }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePrintProject } from '@/composables/usePrintProject'
import { usePrintExport } from '@/composables/usePrintExport'
import { printSizeToAspectRatio } from '@/types'
import type { ExportOptions } from '@/types'

const { activePrintSize, printPanorama } = usePrintProject()
const { exportPrint, downloadPrint }     = usePrintExport()

const exportFormat  = ref<'jpeg' | 'png'>('jpeg')
const exportQuality = ref(0.95)
const isExporting   = ref(false)
const exportError   = ref('')

const hasImages = computed(() => printPanorama.value.placedImages.length > 0)

const ar = computed(() => printSizeToAspectRatio(activePrintSize.value))
const pixelW = computed(() => ar.value.width)
const pixelH = computed(() => ar.value.height)

const exportOptions = computed<ExportOptions>(() => ({
  format:  exportFormat.value,
  quality: exportQuality.value,
}))

const handleExport = async () => {
  isExporting.value = true
  exportError.value = ''
  try {
    const blob = await exportPrint(printPanorama.value, exportOptions.value)
    downloadPrint(blob, activePrintSize.value, exportFormat.value)
  } catch (err) {
    exportError.value = err instanceof Error ? err.message : 'Export failed'
    console.error('[print export]', err)
  } finally {
    isExporting.value = false
  }
}
</script>

<style scoped>
.print-export-panel {
  width: 100%;
  height: 100%;
  background: white;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}

.panel-header {
  border-bottom: 1px solid #e2e8f0;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  padding: 0.75rem 1rem;
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

.option-group select { cursor: pointer; }

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

.info-list li { margin: 0.25rem 0; }

.export-actions { display: flex; flex-direction: column; gap: 0.75rem; }

.btn-print {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  background: #ed8936;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-print:hover:not(:disabled) { background: #dd6b20; }
.btn-print:disabled { background: #cbd5e0; cursor: not-allowed; }

.error-message {
  padding: 0.75rem;
  background: #fed7d7;
  border: 1px solid #fc8181;
  border-radius: 0.375rem;
  color: #c53030;
  font-size: 0.875rem;
}
</style>
