<template>
  <div class="modal-backdrop" @click.self="$emit('cancel')">
    <div class="modal">
      <!-- Drag handle (mobile only) -->
      <div class="drag-handle"></div>

      <div class="modal-header">
        <h2>Choose Template</h2>
        <button class="modal-close" @click="$emit('cancel')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Active template banner -->
      <div v-if="activeTemplate" class="active-banner">
        <i class="fa-solid fa-table-cells"></i>
        <span>Currently using <strong>{{ activeTemplate.name }}</strong></span>
        <button class="exit-template-btn" @click="$emit('exit')" title="Exit template mode">
          <i class="fa-solid fa-xmark"></i> Exit Template
        </button>
      </div>

      <!-- Filter pills — horizontally scrollable on mobile -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-group">
            <span class="filter-label">Frames</span>
            <button
              v-for="n in frameCountOptions"
              :key="n"
              class="pill"
              :class="{ active: activeFrameCount === n }"
              @click="toggleFrameCount(n)"
            >{{ n === 0 ? 'Any' : n }}</button>
          </div>
          <div class="filter-sep"></div>
          <div class="filter-group">
            <span class="filter-label">Slots</span>
            <button
              v-for="n in slotCountOptions"
              :key="n"
              class="pill"
              :class="{ active: activeSlotCount === n }"
              @click="toggleSlotCount(n)"
            >{{ n === 0 ? 'Any' : n }}</button>
          </div>
          <div class="filter-sep"></div>
          <div class="filter-group">
            <span class="filter-label">Aspect</span>
            <button
              v-for="ar in aspectOptions"
              :key="ar"
              class="pill"
              :class="{ active: activeAspect === ar }"
              @click="toggleAspect(ar)"
            >{{ ar === '' ? 'Any' : ar }}</button>
          </div>
        </div>
      </div>

      <!-- Gap size controls (hidden for freeform) -->
      <div class="gap-section" v-if="showGapControls">
        <div class="gap-row">
          <span class="filter-label">Outer Margin</span>
          <input type="range" min="0" max="60" step="1" v-model.number="outerPx" class="gap-slider" />
          <input type="number" min="0" max="60" step="1" v-model.number="outerPx" class="gap-input" />
          <span class="gap-unit">px</span>
        </div>
        <div class="gap-row">
          <span class="filter-label">Inner Gap</span>
          <input type="range" min="0" max="60" step="1" v-model.number="innerPx" class="gap-slider" />
          <input type="number" min="0" max="60" step="1" v-model.number="innerPx" class="gap-input" />
          <span class="gap-unit">px</span>
        </div>
      </div>

      <!-- Template list (scrollable) -->
      <div class="template-scroll">
        <!-- Custom template toolbar -->
        <div class="custom-toolbar">
          <button class="custom-action-btn" @click="showBuilder = true">
            <i class="fa-solid fa-plus"></i> New Grid Template
          </button>
          <button class="custom-action-btn" v-if="canSaveLayout" @click="showSavePrompt = true">
            <i class="fa-solid fa-floppy-disk"></i> Save Layout
          </button>
        </div>

        <!-- Save layout prompt -->
        <div class="save-prompt" v-if="showSavePrompt">
          <input v-model="saveLayoutName" class="save-input" placeholder="Template name…" maxlength="40" @keyup.enter="doSaveLayout" autofocus />
          <button class="custom-action-btn custom-action-primary" @click="doSaveLayout" :disabled="!saveLayoutName.trim()">Save</button>
          <button class="custom-action-btn" @click="showSavePrompt = false; saveLayoutName = ''">Cancel</button>
        </div>

        <!-- My Templates section -->
        <div v-if="hasCustom" class="templates-section">
          <div class="section-heading">My Templates</div>
          <div class="template-grid">
            <div
              v-for="tmpl in customTemplates"
              :key="tmpl.id"
              class="template-card"
              :class="{ selected: selectedTemplateId === tmpl.id }"
              @click="selectedTemplateId = tmpl.id"
            >
              <div class="preview-wrap">
                <TemplateMiniPreview :template="tmpl" :outer-px="outerPx" :inner-px="innerPx" />
              </div>
              <div class="template-card-info">
                <span class="template-name">{{ tmpl.name }}</span>
                <span class="template-badge badge-custom">{{ tmpl.templateType === 'freeform' ? 'Freeform' : 'Grid' }}</span>
              </div>
              <button class="custom-delete-btn" @click="handleDeleteCustom(tmpl.id, $event)" title="Delete template">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Built-in templates -->
        <div class="templates-section">
          <div class="section-heading" v-if="hasCustom">Built-in Templates</div>
          <div class="template-grid">
            <div
              v-for="tmpl in filteredBuiltins"
              :key="tmpl.id"
              class="template-card"
              :class="{ selected: selectedTemplateId === tmpl.id }"
              @click="selectedTemplateId = tmpl.id"
            >
              <div class="preview-wrap">
                <TemplateMiniPreview :template="tmpl" :outer-px="outerPx" :inner-px="innerPx" />
              </div>
              <div class="template-card-info">
                <span class="template-name">{{ tmpl.name }}</span>
                <span class="template-badge" :class="frameBadgeClass(tmpl)">
                  {{ frameBadgeLabel(tmpl) }}
                </span>
              </div>
              <div class="selected-check" v-if="selectedTemplateId === tmpl.id">
                <i class="fa-solid fa-check"></i>
              </div>
            </div>
            <div v-if="filteredBuiltins.length === 0" class="no-results">
              No built-in templates match the selected filters.
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('cancel')">Cancel</button>
        <button
          class="btn btn-primary"
          :disabled="!selectedTemplateId"
          @click="handleUse"
        >{{ applyBtnLabel }}</button>
      </div>
    </div>
  </div>

  <TemplateBuilderModal
    v-if="showBuilder"
    @cancel="showBuilder = false"
    @saved="handleBuilderSaved"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Frame, Panorama, Template } from '@/types'
import { TEMPLATES, DEFAULT_OUTER_PX, DEFAULT_INNER_PX } from '@/data/templates'
import { useCustomTemplates } from '@/composables/useCustomTemplates'
import TemplateMiniPreview from './TemplateMiniPreview.vue'
import TemplateBuilderModal from './TemplateBuilderModal.vue'

const props = defineProps<{ frame: Frame; panorama: Panorama; printMode?: boolean }>()
const emit  = defineEmits<{
  apply: [templateId: string, insertFrameIndex: number, outerPx: number, innerPx: number]
  exit: []
  cancel: []
  saveLayout: [name: string]
}>()

const { customTemplates, loadCustomTemplates, deleteCustomTemplate, createFreeformTemplate, saveCustomTemplate } = useCustomTemplates()
onMounted(loadCustomTemplates)

const showBuilder     = ref(false)
const showSavePrompt  = ref(false)
const saveLayoutName  = ref('')

const selectedTemplateId = ref<string | null>(props.frame.templateId ?? null)

const allTemplates = computed<Template[]>(() => [...customTemplates.value, ...TEMPLATES])

const activeTemplate = computed(() =>
  props.frame.templateMode && props.frame.templateId
    ? (allTemplates.value.find(t => t.id === props.frame.templateId) ?? null)
    : null
)
const activeFrameCount  = ref(0)
const activeSlotCount   = ref(0)

const aspectOptions     = ['', 'Square', 'Portrait', 'Landscape', 'Story']
const frameAspectLabel  = props.frame.aspectRatio.name.charAt(0).toUpperCase() + props.frame.aspectRatio.name.slice(1)
const activeAspect      = ref(aspectOptions.includes(frameAspectLabel) ? frameAspectLabel : '')

const outerPx = ref(props.frame.templateOuterPx ?? DEFAULT_OUTER_PX)
const innerPx = ref(props.frame.templateInnerPx ?? DEFAULT_INNER_PX)

const frameCountOptions = [0, 1, 2, 3]
const slotCountOptions  = [0, 1, 2, 3, 4]

const toggleFrameCount = (n: number) => { activeFrameCount.value = activeFrameCount.value === n ? 0 : n }
const toggleSlotCount  = (n: number) => { activeSlotCount.value  = activeSlotCount.value  === n ? 0 : n }
const toggleAspect     = (ar: string) => { activeAspect.value    = activeAspect.value      === ar ? '' : ar }

const selectedTemplate = computed(() =>
  selectedTemplateId.value ? allTemplates.value.find(t => t.id === selectedTemplateId.value) ?? null : null
)
const selectedIsFreeform = computed(() => selectedTemplate.value?.templateType === 'freeform')

// Hide gap controls for freeform templates
const showGapControls = computed(() => !selectedIsFreeform.value)

const filteredBuiltins = computed<Template[]>(() => {
  return TEMPLATES.filter(t => {
    if (props.printMode && !t.printCompatible) return false  // print mode: single-frame only
    if (activeFrameCount.value && t.frames.length !== activeFrameCount.value) return false
    if (activeSlotCount.value  && t.slots.length  !== activeSlotCount.value)  return false
    if (activeAspect.value) {
      const label = activeAspect.value.toLowerCase()
      if (!t.frames.some(f => f.aspectRatio.name === label)) return false
    }
    return true
  })
})

// Custom templates shown unfiltered in their own section
const hasCustom = computed(() => customTemplates.value.length > 0)

// Can save layout? Need ≥1 placed image in this frame's x-range, not in template mode
const canSaveLayout = computed(() => {
  if (props.frame.templateMode) return false
  const minX = props.frame.xOffset
  const maxX = props.frame.xOffset + props.frame.aspectRatio.width
  return props.panorama.placedImages.some(img => {
    const cx = img.x + img.width / 2
    return cx >= minX && cx < maxX
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
  emit('apply', selectedTemplateId.value, insertIndex === -1 ? props.panorama.frames.length : insertIndex, outerPx.value, innerPx.value)
}

const applyBtnLabel = computed(() =>
  activeTemplate.value && selectedTemplateId.value === activeTemplate.value.id
    ? 'Update Template'
    : activeTemplate.value
      ? 'Switch Template'
      : 'Use Template'
)

const handleDeleteCustom = async (id: string, e: MouseEvent) => {
  e.stopPropagation()
  await deleteCustomTemplate(id)
  if (selectedTemplateId.value === id) selectedTemplateId.value = null
}

const handleBuilderSaved = () => {
  showBuilder.value = false
  loadCustomTemplates()
}

const doSaveLayout = async () => {
  const name = saveLayoutName.value.trim()
  if (!name) return
  // Collect placed images in this frame
  const minX = props.frame.xOffset
  const maxX = props.frame.xOffset + props.frame.aspectRatio.width
  const fw   = props.frame.aspectRatio.width
  const fh   = props.frame.aspectRatio.height
  const vertOff = (props.panorama.maxHeight - fh) / 2
  const placed  = props.panorama.placedImages.filter(img => {
    const cx = img.x + img.width / 2
    return cx >= minX && cx < maxX
  })
  // Normalize to fractions of frame canvas, sorted by array index (z-order)
  const slots = placed.map((img, i) => ({
    id: `s${i + 1}`,
    x: (img.x - minX) / fw,
    y: (img.y - vertOff) / fh,
    w: img.width  / fw,
    h: img.height / fh,
  }))
  const tmpl = createFreeformTemplate(name, [{ aspectRatio: props.frame.aspectRatio }], slots)
  await saveCustomTemplate(tmpl)
  showSavePrompt.value = false
  saveLayoutName.value = ''
  await loadCustomTemplates()
}
</script>

<style scoped>
/* ── Gap size controls ── */
.gap-section {
  flex-shrink: 0;
  border-bottom: 1px solid #e2e8f0;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.gap-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.gap-row .filter-label {
  min-width: 84px;
}
.gap-slider {
  flex: 1;
  min-width: 0;
  accent-color: #3182ce;
  cursor: pointer;
}
.gap-input {
  width: 48px;
  padding: 3px 6px;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.78rem;
  text-align: center;
  color: #2d3748;
}
.gap-input:focus { outline: none; border-color: #3182ce; }
.gap-unit {
  font-size: 0.72rem;
  color: #a0aec0;
}

/* ── Backdrop ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-end;       /* bottom-sheet on mobile by default */
  justify-content: center;
  z-index: 1000;
}

/* ── Modal shell ── */
.modal {
  background: white;
  width: 100%;
  max-height: 92dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1.25rem 1.25rem 0 0;
  box-shadow: 0 -4px 32px rgba(0,0,0,0.2);
}

.drag-handle {
  flex-shrink: 0;
  width: 40px;
  height: 4px;
  background: #cbd5e0;
  border-radius: 2px;
  margin: 10px auto 0;
}

.modal-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 10px;
  border-bottom: 1px solid #e2e8f0;
}
.modal-header h2 {
  font-size: 1rem;
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
  padding: 6px;
  line-height: 1;
  touch-action: manipulation;
}
.modal-close:hover { color: #4a5568; }

/* ── Active template banner ── */
.active-banner {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  background: #ebf8ff;
  border-bottom: 1px solid #bee3f8;
  font-size: 0.8rem;
  color: #2b6cb0;
  flex-wrap: wrap;
}
.active-banner i { flex-shrink: 0; }
.active-banner strong { font-weight: 700; }
.exit-template-btn {
  margin-left: auto;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 1px solid #90cdf4;
  border-radius: 0.375rem;
  color: #2b6cb0;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  cursor: pointer;
  transition: background 0.12s;
}
.exit-template-btn:hover { background: #bee3f8; }

/* ── Filters: horizontally scrollable strip ── */
.filter-section {
  flex-shrink: 0;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.filter-section::-webkit-scrollbar { display: none; }

.filter-row {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 10px 16px;
  white-space: nowrap;
  min-width: max-content;
}
.filter-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.filter-sep {
  width: 1px;
  height: 18px;
  background: #e2e8f0;
  margin: 0 12px;
  flex-shrink: 0;
}
.filter-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.pill {
  padding: 5px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  font-size: 0.75rem;
  background: white;
  color: #4a5568;
  cursor: pointer;
  touch-action: manipulation;
  transition: background 0.12s, border-color 0.12s;
  white-space: nowrap;
}
.pill:hover  { border-color: #90cdf4; background: #ebf8ff; }
.pill.active { background: #3182ce; border-color: #3182ce; color: white; }

/* ── Scrollable template area ── */
.template-scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Mobile: single-column list */
.template-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 8px 0;
}

.template-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f4f8;
  background: white;
  position: relative;
  touch-action: manipulation;
  transition: background 0.1s;
}
.template-card:active { background: #f7fafc; }
.template-card.selected { background: #ebf8ff; }

.preview-wrap {
  flex-shrink: 0;
  width: 80px;
  height: 40px;
  background: #edf2f7;
  border-radius: 0.4rem;
  overflow: hidden;
}

.template-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.template-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #2d3748;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.template-badge {
  font-size: 0.68rem;
  font-weight: 600;
  border-radius: 999px;
  padding: 2px 8px;
  align-self: flex-start;
}
.badge-match { background: #c6f6d5; color: #276749; }
.badge-info  { background: #bee3f8; color: #2b6cb0; }

.selected-check {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background: #3182ce;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.7rem;
}

.no-results {
  text-align: center;
  color: #a0aec0;
  padding: 40px 0;
  font-size: 0.85rem;
}

/* ── Footer ── */
.modal-footer {
  flex-shrink: 0;
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  border-top: 1px solid #e2e8f0;
  background: white;
}
.btn {
  flex: 1;
  padding: 12px 16px;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  touch-action: manipulation;
  transition: background 0.12s;
}
.btn-secondary { background: #edf2f7; color: #4a5568; }
.btn-secondary:hover { background: #e2e8f0; }
.btn-primary { background: #3182ce; color: white; }
.btn-primary:hover { background: #2c5282; }
.btn-primary:disabled { background: #90cdf4; cursor: not-allowed; }

/* ── Desktop: centered dialog with grid layout ── */
@media (min-width: 640px) {
  .modal-backdrop {
    align-items: center;
    padding: 24px;
  }
  .modal {
    width: min(760px, 100%);
    max-height: 88vh;
    border-radius: 1rem;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  }
  .drag-handle { display: none; }
  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
    padding: 16px 20px;
    flex-direction: unset;
  }
  .template-card {
    flex-direction: column;
    align-items: stretch;
    padding: 0;
    border-bottom: none;
    border: 2px solid #e2e8f0;
    border-radius: 0.75rem;
    overflow: hidden;
    background: #f7fafc;
    gap: 0;
  }
  .template-card:hover { border-color: #90cdf4; box-shadow: 0 2px 8px rgba(49,130,206,0.15); }
  .template-card.selected { border-color: #3182ce; box-shadow: 0 0 0 3px rgba(49,130,206,0.25); background: white; }
  .preview-wrap {
    width: auto;
    height: auto;
    aspect-ratio: 2 / 1;
    border-radius: 0;
  }
  .template-card-info {
    padding: 6px 8px;
  }
  .template-name { font-size: 0.72rem; }
  .selected-check { display: none; }
  .btn { flex: unset; padding: 8px 20px; font-size: 0.85rem; border-radius: 0.5rem; }
  .modal-footer { justify-content: flex-end; }
  .filter-row { min-width: unset; flex-wrap: wrap; white-space: normal; padding: 12px 20px; }
  .filter-group { flex-wrap: wrap; }
}

/* ── Custom template UI ── */
.custom-toolbar {
  display: flex;
  gap: 8px;
  padding: 10px 16px 6px;
  flex-wrap: wrap;
}
.custom-action-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 12px; font-size: 0.75rem; font-weight: 600;
  border: 1px solid #e2e8f0; border-radius: 0.5rem;
  background: white; color: #4a5568; cursor: pointer;
  touch-action: manipulation;
}
.custom-action-btn:hover { border-color: #90cdf4; background: #ebf8ff; color: #2b6cb0; }
.custom-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.custom-action-primary { background: #3182ce; color: white; border-color: #3182ce; }
.custom-action-primary:hover { background: #2c5282 !important; color: white !important; }

.save-prompt {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 16px 10px; flex-wrap: wrap;
}
.save-input {
  flex: 1; min-width: 140px; padding: 6px 10px;
  border: 1px solid #e2e8f0; border-radius: 0.5rem;
  font-size: 0.85rem; color: #2d3748;
}
.save-input:focus { outline: none; border-color: #3182ce; }

.templates-section { padding-bottom: 4px; }
.section-heading {
  font-size: 0.68rem; font-weight: 700; color: #a0aec0;
  text-transform: uppercase; letter-spacing: 0.06em;
  padding: 8px 16px 4px;
}

.custom-delete-btn {
  flex-shrink: 0; background: none; border: none; cursor: pointer;
  color: #a0aec0; font-size: 0.75rem; padding: 4px 8px;
  touch-action: manipulation; border-radius: 0.375rem;
}
.custom-delete-btn:hover { color: #e53e3e; background: #fff5f5; }
.badge-custom { background: #faf089; color: #744210; }
</style>

