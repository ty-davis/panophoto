<template>
  <div class="modal-backdrop" @click.self="$emit('cancel')">
    <div class="modal">
      <div class="modal-header">
        <h2>Choose Template</h2>
        <button class="modal-close" @click="$emit('cancel')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Filter pills -->
      <div class="filter-row">
        <div class="filter-group">
          <span class="filter-label">Frames:</span>
          <button
            v-for="n in frameCountOptions"
            :key="n"
            class="pill"
            :class="{ active: activeFrameCount === n }"
            @click="toggleFrameCount(n)"
          >{{ n === 0 ? 'Any' : n }}</button>
        </div>
        <div class="filter-group">
          <span class="filter-label">Slots:</span>
          <button
            v-for="n in slotCountOptions"
            :key="n"
            class="pill"
            :class="{ active: activeSlotCount === n }"
            @click="toggleSlotCount(n)"
          >{{ n === 0 ? 'Any' : n }}</button>
        </div>
        <div class="filter-group">
          <span class="filter-label">Aspect:</span>
          <button
            v-for="ar in aspectOptions"
            :key="ar"
            class="pill"
            :class="{ active: activeAspect === ar }"
            @click="toggleAspect(ar)"
          >{{ ar === '' ? 'Any' : ar }}</button>
        </div>
      </div>

      <!-- Template grid -->
      <div class="template-grid">
        <div
          v-for="tmpl in filteredTemplates"
          :key="tmpl.id"
          class="template-card"
          :class="{ selected: selectedTemplateId === tmpl.id }"
          @click="selectedTemplateId = tmpl.id"
        >
          <!-- Mini canvas preview -->
          <div class="preview-wrap">
            <TemplateMiniPreview :template="tmpl" />
          </div>
          <div class="template-card-info">
            <span class="template-name">{{ tmpl.name }}</span>
            <span class="template-badge" :class="frameBadgeClass(tmpl)">
              {{ frameBadgeLabel(tmpl) }}
            </span>
          </div>
        </div>
        <div v-if="filteredTemplates.length === 0" class="no-results">
          No templates match the selected filters.
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('cancel')">Cancel</button>
        <button
          class="btn btn-primary"
          :disabled="!selectedTemplateId"
          @click="handleUse"
        >Use Template</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Frame, Panorama, Template } from '@/types'
import { TEMPLATES } from '@/data/templates'
import TemplateMiniPreview from './TemplateMiniPreview.vue'

const props = defineProps<{ frame: Frame; panorama: Panorama }>()
const emit  = defineEmits<{ apply: [templateId: string, insertFrameIndex: number]; cancel: [] }>()

const selectedTemplateId = ref<string | null>(null)
const activeFrameCount  = ref(0)
const activeSlotCount   = ref(0)
const activeAspect      = ref('')

const frameCountOptions = [0, 1, 2, 3]
const slotCountOptions  = [0, 1, 2, 3, 4]
const aspectOptions     = ['', 'Square', 'Portrait', 'Landscape', 'Story']

const toggleFrameCount = (n: number) => { activeFrameCount.value  = activeFrameCount.value  === n ? 0 : n }
const toggleSlotCount  = (n: number) => { activeSlotCount.value   = activeSlotCount.value   === n ? 0 : n }
const toggleAspect     = (ar: string) => { activeAspect.value     = activeAspect.value       === ar ? '' : ar }

const filteredTemplates = computed<Template[]>(() => {
  return TEMPLATES.filter(t => {
    if (activeFrameCount.value && t.frames.length !== activeFrameCount.value) return false
    if (activeSlotCount.value  && t.slots.length  !== activeSlotCount.value)  return false
    if (activeAspect.value) {
      const label = activeAspect.value.toLowerCase()
      if (!t.frames.some(f => f.aspectRatio.name === label)) return false
    }
    return true
  })
})

const frameBadgeLabel = (tmpl: Template) => {
  const current = props.panorama.frames.length
  const needed  = tmpl.frames.length
  if (needed === 1) return '1 frame'
  if (needed === current) return `${needed} frames — Matches!`
  return `Needs ${needed} frames`
}

const frameBadgeClass = (tmpl: Template) => {
  const current = props.panorama.frames.length
  return tmpl.frames.length === current ? 'badge-match' : 'badge-info'
}

const handleUse = () => {
  if (!selectedTemplateId.value) return
  const insertIndex = props.panorama.frames.findIndex(f => f.id === props.frame.id)
  emit('apply', selectedTemplateId.value, insertIndex === -1 ? props.panorama.frames.length : insertIndex)
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal {
  background: white;
  border-radius: 1rem;
  width: min(760px, 100%);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid #e2e8f0;
}
.modal-header h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
}
.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  color: #a0aec0;
  padding: 4px;
}
.modal-close:hover { color: #4a5568; }

/* ── Filters ── */
.filter-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 20px;
  border-bottom: 1px solid #e2e8f0;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.filter-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.pill {
  padding: 3px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  font-size: 0.72rem;
  background: white;
  color: #4a5568;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}
.pill:hover { border-color: #90cdf4; background: #ebf8ff; }
.pill.active { background: #3182ce; border-color: #3182ce; color: white; }

/* ── Template grid ── */
.template-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  padding: 16px 20px;
}

.template-card {
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
  background: #f7fafc;
}
.template-card:hover { border-color: #90cdf4; box-shadow: 0 2px 8px rgba(49,130,206,0.15); }
.template-card.selected { border-color: #3182ce; box-shadow: 0 0 0 3px rgba(49,130,206,0.25); }

.preview-wrap {
  aspect-ratio: 2 / 1;
  background: #edf2f7;
  overflow: hidden;
}

.template-card-info {
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.template-name {
  font-size: 0.72rem;
  font-weight: 600;
  color: #4a5568;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.template-badge {
  font-size: 0.65rem;
  font-weight: 600;
  border-radius: 999px;
  padding: 1px 7px;
  align-self: flex-start;
}
.badge-match { background: #c6f6d5; color: #276749; }
.badge-info  { background: #bee3f8; color: #2b6cb0; }

.no-results {
  grid-column: 1 / -1;
  text-align: center;
  color: #a0aec0;
  padding: 32px 0;
  font-size: 0.85rem;
}

/* ── Footer ── */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
}
.btn {
  padding: 8px 20px;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.12s;
}
.btn-secondary { background: #edf2f7; color: #4a5568; }
.btn-secondary:hover { background: #e2e8f0; }
.btn-primary { background: #3182ce; color: white; }
.btn-primary:hover { background: #2c5282; }
.btn-primary:disabled { background: #90cdf4; cursor: not-allowed; }
</style>
