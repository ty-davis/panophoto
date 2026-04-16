<template>
  <div class="print-canvas-editor">
    <div class="editor-header">
      <PrintSizePicker :model-value="activePrintSize" @update:model-value="setPrintSize" />
      <div class="header-right">
        <span class="canvas-size">{{ pixelW }}×{{ pixelH }}px @ {{ activePrintSize.dpi }} DPI</span>
        <button class="tmpl-btn" @click="openTemplate" title="Choose template">
          <i class="fa-solid fa-table-cells"></i> Template
        </button>
        <div v-if="printPanorama" class="color-swatch-wrap" title="Background color">
          <div class="swatch-preview" :style="{ background: printPanorama.backgroundColor }"></div>
          <input
            type="color"
            class="color-input"
            :value="printPanorama.backgroundColor"
            @input="updateBgColor($event)"
          />
        </div>
      </div>
    </div>

    <div class="canvas-container">
      <PanoramaCanvas
        v-if="printPanorama"
        ref="canvasRef"
        :panorama="printPanorama"
        :print-mode="true"
        :bleed-in="bleedIn"
        :show-guides="showGuides"
        :print-bleed-px="Math.round(bleedIn * 300)"
        @update="() => {}"
      />
    </div>

    <!-- Bleed & safe-zone controls -->
    <div class="print-guides-bar">
      <div class="guides-row">
        <span class="guides-label">Bleed</span>
        <input
          type="number"
          class="bleed-input"
          :value="bleedIn"
          min="0" max="2" step="0.125"
          @change="handleBleedChange"
        />
        <span class="guides-unit">in</span>
        <span class="guides-sep">|</span>
        <label class="guides-check" :class="{ disabled: bleedIn <= 0 }">
          <input
            type="checkbox"
            :checked="showGuides"
            :disabled="bleedIn <= 0"
            @change="setShowGuides(($event.target as HTMLInputElement).checked)"
          />
          Show safe-zone guides
        </label>
        <template v-if="showGuides && bleedIn > 0">
          <span class="guide-legend"><span class="guide-swatch bleed"></span> Trim line</span>
          <span class="guide-legend"><span class="guide-swatch safe"></span> Safe zone</span>
        </template>
      </div>
    </div>

    <ImageTray @placed="() => {}" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePrintProject } from '@/composables/usePrintProject'
import PanoramaCanvas from './PanoramaCanvas.vue'
import PrintSizePicker from './PrintSizePicker.vue'
import ImageTray from './ImageTray.vue'

const {
  activePrintSize, printPanorama, bleedIn, showGuides,
  setPrintSize, setBleed, setShowGuides, updatePrintBackground,
} = usePrintProject()

const pixelW = computed(() => printPanorama.value?.totalWidth  ?? 0)
const pixelH = computed(() => printPanorama.value?.maxHeight   ?? 0)

const canvasRef = ref<InstanceType<typeof PanoramaCanvas> | null>(null)

const openTemplate = () => {
  const frame = printPanorama.value?.frames[0]
  if (frame) canvasRef.value?.openTemplatePicker(frame)
}

const updateBgColor = (event: Event) => {
  updatePrintBackground((event.target as HTMLInputElement).value)
}

const handleBleedChange = (event: Event) => {
  const raw = parseFloat((event.target as HTMLInputElement).value)
  setBleed(isNaN(raw) ? 0 : raw)
}
</script>

<style scoped>
.print-canvas-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f7fafc;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.tmpl-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.65rem;
  border: 1px solid #cbd5e0;
  border-radius: 0.375rem;
  background: white;
  font-size: 0.8rem;
  color: #4a5568;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.tmpl-btn:hover {
  border-color: #667eea;
  background: #ebf4ff;
  color: #667eea;
}

.canvas-size {
  font-size: 0.75rem;
  color: #718096;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
}

.color-swatch-wrap {
  position: relative;
  width: 24px;
  height: 24px;
  cursor: pointer;
  flex-shrink: 0;
}

.swatch-preview {
  width: 100%;
  height: 100%;
  border-radius: 5px;
  border: 2px solid #cbd5e0;
  box-sizing: border-box;
  pointer-events: none;
  transition: border-color 0.15s;
}

.color-swatch-wrap:hover .swatch-preview { border-color: #4299e1; }

.color-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  padding: 0;
  border: none;
}

.canvas-container {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 1.5rem;
  overflow: auto;
  min-height: 0;
}

/* ── Print guides bar ── */
.print-guides-bar {
  flex-shrink: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 0.55rem 1rem;
}

.guides-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: #4a5568;
}

.guides-label {
  font-weight: 600;
  white-space: nowrap;
}

.bleed-input {
  width: 60px;
  padding: 0.25rem 0.35rem;
  border: 1px solid #cbd5e0;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  color: #2d3748;
  text-align: center;
}
.bleed-input:focus { outline: 2px solid #667eea; outline-offset: 1px; }

.guides-unit { color: #718096; font-size: 0.75rem; }

.guides-sep { color: #cbd5e0; font-size: 0.9rem; margin: 0 0.1rem; }

.guides-check {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  user-select: none;
}
.guides-check.disabled { opacity: 0.45; cursor: not-allowed; }
.guides-check input[type="checkbox"] { accent-color: #667eea; cursor: pointer; }
.guides-check.disabled input[type="checkbox"] { cursor: not-allowed; }

.guide-legend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #718096;
  font-size: 0.75rem;
  white-space: nowrap;
}

.guide-swatch {
  display: inline-block;
  width: 18px;
  height: 2px;
  border-radius: 1px;
  flex-shrink: 0;
}
.guide-swatch.bleed { background: rgba(220, 53, 69, 0.7); }
.guide-swatch.safe  { background: rgba(0, 123, 255, 0.6); }

@media (max-width: 768px) {
  .editor-header { padding: 0.5rem 0.75rem; }
  .canvas-container { padding: 0.75rem; }
}
</style>
