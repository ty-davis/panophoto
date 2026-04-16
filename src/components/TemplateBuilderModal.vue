<template>
  <div class="modal-backdrop" @click.self="$emit('cancel')">
    <div class="modal">
      <div class="drag-handle"></div>
      <div class="modal-header">
        <h2>New Grid Template</h2>
        <button class="modal-close" @click="$emit('cancel')"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <!-- Quick presets -->
      <div class="section">
        <div class="section-row">
          <span class="section-label">Quick</span>
          <div class="pill-group">
            <button class="pill" @click="applyPreset('1')">1 slot</button>
            <button class="pill" @click="applyPreset('2v')">2 cols</button>
            <button class="pill" @click="applyPreset('2h')">2 rows</button>
            <button class="pill" @click="applyPreset('3v')">3 cols</button>
            <button class="pill" @click="applyPreset('3h')">3 rows</button>
            <button class="pill" @click="applyPreset('2x2')">2×2</button>
            <button class="pill" @click="applyPreset('l2r')">Big+2</button>
          </div>
        </div>
      </div>

      <!-- Visual split editor -->
      <div class="editor-area">
        <div class="editor-canvas-wrap">
          <div class="editor-canvas" :style="editorCanvasStyle">
            <SplitNodeEditor
              :node="tree"
              :flex="1"
              :path="[]"
              :selected-path="selectedPath"
              :can-delete="false"
              @select="selectedPath = $event"
              @split="handleSplit"
              @delete="handleDelete"
            />
          </div>
        </div>

        <!-- Status / ratio bar -->
        <div class="info-bar">
          <template v-if="selectedPath !== null">
            <!-- Ratio control for parent split -->
            <template v-if="parentSplit">
              <span class="info-label">{{ parentSplit.dir === 'v' ? 'Column' : 'Row' }} ratio</span>
              <input type="range" min="10" max="90" step="1"
                :value="Math.round(parentSplit.ratio * 100)"
                @input="updateParentRatio(Number(($event.target as HTMLInputElement).value) / 100)"
                class="ratio-slider" />
              <span class="ratio-value">{{ Math.round(parentSplit.ratio * 100) }} / {{ 100 - Math.round(parentSplit.ratio * 100) }}</span>
            </template>
            <span v-else class="info-hint">Root slot selected</span>
            <button class="action-btn action-btn-danger" v-if="canDelete" @click="doDelete">
              <i class="fa-solid fa-trash"></i> Remove
            </button>
          </template>
          <span v-else class="info-hint"><i class="fa-solid fa-hand-pointer"></i> Click a slot — buttons appear on it to split</span>
        </div>
      </div>

      <!-- Name -->
      <div class="section">
        <div class="section-row">
          <span class="section-label">Name</span>
          <input v-model="templateName" class="name-input" placeholder="My Template" maxlength="40" />
          <button class="action-btn" @click="resetTree" title="Reset layout"><i class="fa-solid fa-rotate-left"></i></button>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('cancel')">Cancel</button>
        <button class="btn btn-primary" :disabled="!templateName.trim()" @click="handleSave">Save Template</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SplitNode } from '@/types'
import { useCustomTemplates } from '@/composables/useCustomTemplates'
import { TEMPLATE_PREVIEW_SIZE } from '@/data/templates'
import { generateId } from '@/utils/imageUtils'
import SplitNodeEditor from './SplitNodeEditor.vue'

const emit = defineEmits<{ cancel: []; saved: [] }>()

const { createGridTemplate, saveCustomTemplate } = useCustomTemplates()

const templateName = ref('')

// ── Split tree state ──────────────────────────────────────────────────────────

const newSlot = (): SplitNode => ({ kind: 'slot', id: generateId() })
const tree = ref<SplitNode>(newSlot())
const selectedPath = ref<string[] | null>(null)

const resetTree = () => { tree.value = newSlot(); selectedPath.value = null }

function getNode(path: string[]): SplitNode | null {
  let node: SplitNode = tree.value
  for (const step of path) {
    if (node.kind !== 'split') return null
    node = step === 'a' ? node.a : node.b
  }
  return node
}

function setNode(path: string[], newNode: SplitNode): void {
  if (path.length === 0) { tree.value = newNode; return }
  const clone = JSON.parse(JSON.stringify(tree.value)) as SplitNode
  let parent: SplitNode = clone
  for (let i = 0; i < path.length - 1; i++) {
    const step = path[i]!
    if (parent.kind !== 'split') return
    parent = step === 'a' ? parent.a : parent.b
  }
  const last = path[path.length - 1]!
  if (parent.kind !== 'split') return
  if (last === 'a') parent.a = newNode
  else              parent.b = newNode
  tree.value = clone
}

const canDelete = computed(() => selectedPath.value !== null && selectedPath.value.length > 0)

// The parent split of the selected slot (for ratio control)
const parentSplit = computed((): (Extract<SplitNode, { kind: 'split' }> & { _path: string[] }) | null => {
  const p = selectedPath.value
  if (!p || p.length === 0) return null
  const parentPath = p.slice(0, -1)
  const parent = getNode(parentPath)
  if (!parent || parent.kind !== 'split') return null
  return { ...parent, _path: parentPath }
})

const updateParentRatio = (ratio: number) => {
  const ps = parentSplit.value
  if (!ps) return
  const clone = JSON.parse(JSON.stringify(tree.value)) as SplitNode
  let node: SplitNode = clone
  for (const step of ps._path) {
    if (node.kind !== 'split') return
    node = step === 'a' ? node.a : node.b
  }
  if (node.kind === 'split') node.ratio = ratio
  tree.value = clone
}

const handleSplit = (path: string[], dir: 'h' | 'v') => {
  const node = getNode(path)
  if (!node || node.kind !== 'slot') return
  const newSplit: SplitNode = { kind: 'split', dir, ratio: 0.5, a: newSlot(), b: newSlot() }
  setNode(path, newSplit)
  // Auto-select the first sub-slot so the user can keep splitting immediately
  selectedPath.value = [...path, 'a']
}

const handleDelete = (path: string[]) => {
  if (path.length === 0) return
  const parentPath = path.slice(0, -1)
  const side = path[path.length - 1]!
  const parent = getNode(parentPath)
  if (!parent || parent.kind !== 'split') return
  const sibling = side === 'a' ? parent.b : parent.a
  setNode(parentPath, sibling)
  selectedPath.value = null
}

const doDelete = () => {
  if (selectedPath.value) handleDelete(selectedPath.value)
}

// ── Quick presets ─────────────────────────────────────────────────────────────

const applyPreset = (preset: string) => {
  selectedPath.value = null
  const s = newSlot
  if (preset === '1')   { tree.value = s(); return }
  if (preset === '2v')  { tree.value = { kind: 'split', dir: 'v', ratio: 0.5, a: s(), b: s() }; return }
  if (preset === '2h')  { tree.value = { kind: 'split', dir: 'h', ratio: 0.5, a: s(), b: s() }; return }
  if (preset === '3v')  { tree.value = { kind: 'split', dir: 'v', ratio: 1/3, a: s(), b: { kind: 'split', dir: 'v', ratio: 0.5, a: s(), b: s() } }; return }
  if (preset === '3h')  { tree.value = { kind: 'split', dir: 'h', ratio: 1/3, a: s(), b: { kind: 'split', dir: 'h', ratio: 0.5, a: s(), b: s() } }; return }
  if (preset === '2x2') { tree.value = { kind: 'split', dir: 'v', ratio: 0.5, a: { kind: 'split', dir: 'h', ratio: 0.5, a: s(), b: s() }, b: { kind: 'split', dir: 'h', ratio: 0.5, a: s(), b: s() } }; return }
  if (preset === 'l2r') { tree.value = { kind: 'split', dir: 'v', ratio: 0.6, a: s(), b: { kind: 'split', dir: 'h', ratio: 0.5, a: s(), b: s() } }; return }
}

// ── Canvas dimensions ─────────────────────────────────────────────────────────

const EDITOR_W = 280
const editorCanvasStyle = { width: `${EDITOR_W}px`, height: `${EDITOR_W}px` }

// ── Save ─────────────────────────────────────────────────────────────────────

const handleSave = async () => {
  const tmpl = createGridTemplate(templateName.value.trim(), [], tree.value, TEMPLATE_PREVIEW_SIZE, TEMPLATE_PREVIEW_SIZE)
  await saveCustomTemplate(tmpl)
  emit('saved')
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: flex-end; justify-content: center; z-index: 1100;
}
.modal {
  background: white; width: 100%; max-height: 92dvh;
  display: flex; flex-direction: column; overflow: hidden;
  border-radius: 1.25rem 1.25rem 0 0; box-shadow: 0 -4px 32px rgba(0,0,0,0.2);
}
.drag-handle { flex-shrink: 0; width: 40px; height: 4px; background: #cbd5e0; border-radius: 2px; margin: 10px auto 0; }
.modal-header { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 12px 20px 10px; border-bottom: 1px solid #e2e8f0; }
.modal-header h2 { font-size: 1rem; font-weight: 700; color: #2d3748; margin: 0; }
.modal-close { background: none; border: none; cursor: pointer; font-size: 1.1rem; color: #a0aec0; padding: 6px; }
.modal-close:hover { color: #4a5568; }

.section { flex-shrink: 0; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 8px; }
.section-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.section-label { font-size: 0.68rem; font-weight: 700; color: #a0aec0; text-transform: uppercase; letter-spacing: 0.05em; min-width: 52px; }
.pill-group { display: flex; gap: 6px; flex-wrap: wrap; }
.pill { padding: 5px 12px; border: 1px solid #e2e8f0; border-radius: 999px; font-size: 0.75rem; background: white; color: #4a5568; cursor: pointer; }
.pill:hover { border-color: #90cdf4; background: #ebf8ff; }
.pill.active { background: #3182ce; border-color: #3182ce; color: white; }
.name-input { flex: 1; min-width: 0; padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.85rem; color: #2d3748; }
.name-input:focus { outline: none; border-color: #3182ce; }

.editor-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 14px 16px; }

.editor-canvas-wrap { border: 2px solid #e2e8f0; border-radius: 0.5rem; overflow: hidden; flex-shrink: 0; }
.editor-canvas { display: flex; background: #f7fafc; }

/* Info / ratio bar */
.info-bar {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 8px 12px; background: #f7fafc; border-radius: 0.5rem;
  border: 1px solid #e2e8f0; width: 100%; box-sizing: border-box; min-height: 40px;
}
.info-hint { color: #a0aec0; font-size: 0.78rem; }
.info-label { font-size: 0.72rem; font-weight: 600; color: #718096; white-space: nowrap; }
.ratio-slider { flex: 1; min-width: 80px; accent-color: #3182ce; cursor: pointer; }
.ratio-value { font-size: 0.72rem; color: #4a5568; white-space: nowrap; min-width: 44px; text-align: right; }
.action-btn { display: flex; align-items: center; gap: 5px; padding: 5px 10px; font-size: 0.75rem; font-weight: 600; border: 1px solid #e2e8f0; border-radius: 0.375rem; background: white; color: #4a5568; cursor: pointer; flex-shrink: 0; }
.action-btn:hover { border-color: #90cdf4; background: #ebf8ff; color: #2b6cb0; }
.action-btn-danger { color: #e53e3e !important; }
.action-btn-danger:hover { border-color: #feb2b2 !important; background: #fff5f5 !important; }

.modal-footer { flex-shrink: 0; display: flex; gap: 10px; padding: 12px 16px; padding-bottom: max(12px, env(safe-area-inset-bottom)); border-top: 1px solid #e2e8f0; background: white; }
.btn { flex: 1; padding: 12px 16px; border-radius: 0.75rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: none; }
.btn-secondary { background: #edf2f7; color: #4a5568; }
.btn-secondary:hover { background: #e2e8f0; }
.btn-primary { background: #3182ce; color: white; }
.btn-primary:hover { background: #2c5282; }
.btn-primary:disabled { background: #90cdf4; cursor: not-allowed; }

@media (min-width: 640px) {
  .modal-backdrop { align-items: center; padding: 24px; }
  .modal { width: min(560px, 100%); max-height: 88vh; border-radius: 1rem; }
  .drag-handle { display: none; }
  .btn { flex: unset; padding: 8px 20px; font-size: 0.85rem; border-radius: 0.5rem; }
  .modal-footer { justify-content: flex-end; }
}
</style>

