/**
 * useCustomTemplates
 *
 * Manages user-created templates (freeform + grid) persisted in localForage.
 *
 * Because functions can't be JSON-serialized, generateSlots is reconstructed
 * from templateType + tree/slots on every load.
 */

import { ref } from 'vue'
import localforage from 'localforage'
import { generateId } from '@/utils/imageUtils'
import type { Template, TemplateSlot, SplitNode, AspectRatio } from '@/types'
import { DEFAULT_OUTER_PX, DEFAULT_INNER_PX } from '@/data/templates'

const STORAGE_KEY = 'customTemplates'

// ── Serializable shape stored in localForage ─────────────────────────────────

interface StoredTemplate {
  id: string
  name: string
  frames: Array<{ aspectRatio: AspectRatio }>
  slots: TemplateSlot[]        // freeform: the actual slots; grid: default-seeded slots
  templateType: 'grid' | 'freeform'
  tree?: SplitNode             // grid only
}

// ── generateSlots factories ──────────────────────────────────────────────────

/** Freeform: always return the stored fractions, gap params ignored. */
function makeFreeformGenerator(slots: TemplateSlot[]) {
  return (_totalW: number, _maxH: number, _outerPx: number, _innerPx: number): TemplateSlot[] => slots
}

/** Grid: traverse the split tree applying outer margin + inner gap. */
export function makeGridGenerator(tree: SplitNode) {
  return (totalW: number, maxH: number, outerPx: number, innerPx: number): TemplateSlot[] => {
    const ox = outerPx / totalW
    const oy = outerPx / maxH
    const ix = innerPx / totalW
    const iy = innerPx / maxH
    const slots: TemplateSlot[] = []
    recurse(tree, ox, oy, 1 - 2 * ox, 1 - 2 * oy, ix, iy, slots)
    return slots
  }
}

function recurse(
  node: SplitNode,
  x: number, y: number, w: number, h: number,
  ix: number, iy: number,
  out: TemplateSlot[],
): void {
  if (node.kind === 'slot') {
    out.push({ id: node.id, x, y, w, h })
    return
  }
  if (node.dir === 'v') {
    const leftW  = w * node.ratio - ix / 2
    const rightW = w * (1 - node.ratio) - ix / 2
    const rightX = x + w * node.ratio + ix / 2
    recurse(node.a, x,      y, leftW,  h, ix, iy, out)
    recurse(node.b, rightX, y, rightW, h, ix, iy, out)
  } else {
    const topH    = h * node.ratio - iy / 2
    const bottomH = h * (1 - node.ratio) - iy / 2
    const bottomY = y + h * node.ratio + iy / 2
    recurse(node.a, x, y,       w, topH,    ix, iy, out)
    recurse(node.b, x, bottomY, w, bottomH, ix, iy, out)
  }
}

// ── Count leaf slots in a SplitNode tree ─────────────────────────────────────
export function countSlots(node: SplitNode): number {
  if (node.kind === 'slot') return 1
  return countSlots(node.a) + countSlots(node.b)
}

// ── Hydrate StoredTemplate → Template ────────────────────────────────────────

function hydrate(s: StoredTemplate): Template {
  const generateSlots = s.templateType === 'freeform' || !s.tree
    ? makeFreeformGenerator(s.slots)
    : makeGridGenerator(s.tree)

  return {
    id:            s.id,
    name:          s.name,
    frames:        s.frames,
    slots:         s.slots,
    generateSlots,
    isCustom:      true,
    templateType:  s.templateType,
    tree:          s.tree,
  }
}

// ── Composable ────────────────────────────────────────────────────────────────

const customTemplates = ref<Template[]>([])

export function useCustomTemplates() {
  const loadCustomTemplates = async () => {
    try {
      const stored = await localforage.getItem<StoredTemplate[]>(STORAGE_KEY)
      customTemplates.value = (stored ?? []).map(hydrate)
    } catch (e) {
      console.error('[customTemplates] load failed', e)
    }
  }

  // Strip Vue reactivity and functions before persisting to IndexedDB
  const persistAll = async () => {
    const toStore: StoredTemplate[] = JSON.parse(JSON.stringify(
      customTemplates.value.map(t => ({
        id: t.id, name: t.name, frames: t.frames, slots: t.slots,
        templateType: t.templateType ?? 'freeform', tree: t.tree,
      }))
    ))
    await localforage.setItem(STORAGE_KEY, toStore)
  }

  const saveCustomTemplate = async (tmpl: Template) => {
    const stored: StoredTemplate = {
      id:           tmpl.id,
      name:         tmpl.name,
      frames:       tmpl.frames,
      slots:        tmpl.slots,
      templateType: tmpl.templateType ?? 'freeform',
      tree:         tmpl.tree,
    }
    const existing = customTemplates.value.findIndex(t => t.id === tmpl.id)
    if (existing >= 0) customTemplates.value[existing] = hydrate(stored)
    else               customTemplates.value.push(hydrate(stored))

    await persistAll()
  }

  const deleteCustomTemplate = async (id: string) => {
    customTemplates.value = customTemplates.value.filter(t => t.id !== id)
    await persistAll()
  }

  /** Create a new freeform template from a list of normalized slot fractions. */
  const createFreeformTemplate = (
    name: string,
    _frames: Array<{ aspectRatio: AspectRatio }>,
    slots: TemplateSlot[],
  ): Template => ({
    id: generateId(),
    name,
    frames: [],
    slots,
    generateSlots: makeFreeformGenerator(slots),
    isCustom: true,
    templateType: 'freeform',
  })

  /** Create a new grid template from a SplitNode tree. */
  const createGridTemplate = (
    name: string,
    _frames: Array<{ aspectRatio: AspectRatio }>,
    tree: SplitNode,
    totalW: number,
    maxH: number,
  ): Template => {
    const gen = makeGridGenerator(tree)
    return {
      id: generateId(),
      name,
      frames: [],
      slots: gen(totalW, maxH, DEFAULT_OUTER_PX, DEFAULT_INNER_PX),
      generateSlots: gen,
      isCustom: true,
      templateType: 'grid',
      tree,
    }
  }

  return {
    customTemplates,
    loadCustomTemplates,
    saveCustomTemplate,
    deleteCustomTemplate,
    createFreeformTemplate,
    createGridTemplate,
  }
}
