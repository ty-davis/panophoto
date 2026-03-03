<template>
  <!-- Each node fills its proportional share of the parent flex container -->
  <div class="sne-node" :style="{ flex: flex }">

    <!-- Leaf slot -->
    <div
      v-if="node.kind === 'slot'"
      class="sne-slot"
      :class="{ selected: isSelected }"
      @click.stop="$emit('select', path)"
    >
      <div class="sne-btns">
        <button class="sne-btn" title="Split left/right" @click.stop="$emit('split', path, 'v')">
          <i class="fa-solid fa-arrows-left-right"></i>
        </button>
        <button class="sne-btn" title="Split top/bottom" @click.stop="$emit('split', path, 'h')">
          <i class="fa-solid fa-arrows-up-down"></i>
        </button>
        <button v-if="canDelete" class="sne-btn sne-btn-danger" title="Remove" @click.stop="$emit('delete', path)">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>

    <!-- Split node: flex row (v) or flex column (h) -->
    <div
      v-else
      class="sne-split"
      :class="node.dir === 'v' ? 'sne-row' : 'sne-col'"
    >
      <SplitNodeEditor
        :node="node.a"
        :flex="node.ratio"
        :path="[...path, 'a']"
        :selected-path="selectedPath"
        :can-delete="true"
        @select="$emit('select', $event)"
        @split="forwardSplit"
        @delete="$emit('delete', $event)"
      />
      <SplitNodeEditor
        :node="node.b"
        :flex="1 - node.ratio"
        :path="[...path, 'b']"
        :selected-path="selectedPath"
        :can-delete="true"
        @select="$emit('select', $event)"
        @split="forwardSplit"
        @delete="$emit('delete', $event)"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SplitNode } from '@/types'

const props = defineProps<{
  node: SplitNode
  flex?: number
  path: string[]
  selectedPath: string[] | null
  canDelete?: boolean
}>()

const emit = defineEmits<{
  select: [path: string[]]
  split:  [path: string[], dir: 'h' | 'v']
  delete: [path: string[]]
}>()

const isSelected = computed(() =>
  props.selectedPath !== null &&
  JSON.stringify(props.selectedPath) === JSON.stringify(props.path)
)

// Forward split with both args (Vue template @split only gets first arg if inlined)
const forwardSplit = (p: string[], d: 'h' | 'v') => emit('split', p, d)
</script>

<style scoped>
.sne-node {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.sne-slot {
  flex: 1;
  border: 2px solid #cbd5e0;
  background: #edf2f7;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s, border-color 0.1s;
  position: relative;
  min-width: 0;
  min-height: 0;
}
.sne-slot:hover { background: #ebf8ff; border-color: #90cdf4; }
.sne-slot.selected { background: #bee3f8; border-color: #3182ce; }

/* Split buttons — centered, appear on hover/selection */
.sne-btns {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}
.sne-slot:hover .sne-btns,
.sne-slot.selected .sne-btns { opacity: 1; }

.sne-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  background: white;
  border: 1px solid #cbd5e0;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.7rem;
  color: #4a5568;
  transition: background 0.1s, border-color 0.1s;
}
.sne-btn:hover { background: #ebf8ff; border-color: #3182ce; color: #2b6cb0; }
.sne-btn-danger:hover { background: #fff5f5 !important; border-color: #feb2b2 !important; color: #e53e3e !important; }

.sne-split {
  flex: 1;
  display: flex;
  min-width: 0;
  min-height: 0;
  gap: 2px;
}
.sne-row { flex-direction: row; }
.sne-col { flex-direction: column; }
</style>
