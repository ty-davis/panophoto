import { ref, computed } from 'vue'
import type { Panorama, PrintSize, AspectRatio } from '@/types'
import { printSizeToAspectRatio } from '@/types'
import { PRINT_SIZES, PRINT_DPI } from '@/data/printSizes'
import { generateId } from '@/utils/imageUtils'

// ── Module-level state (singleton) ────────────────────────────────────────────

const activePrintSize = ref<PrintSize>(PRINT_SIZES[0]!)
const bleedIn         = ref(0.25)  // inches
const showGuides      = ref(false)

const makePrintPanorama = (size: PrintSize, bleedInches: number = 0): Panorama => {
  const base   = printSizeToAspectRatio(size)
  const bleedPx = Math.round(bleedInches * PRINT_DPI)
  const totalW  = base.width  + 2 * bleedPx
  const totalH  = base.height + 2 * bleedPx
  const ar: AspectRatio = {
    name:  base.name,
    label: base.label,
    ratio: totalW / totalH,
    width: totalW,
    height: totalH,
  }
  return {
    id: generateId(),
    frames: [{
      id: generateId(),
      aspectRatio: ar,
      xOffset: 0,
      templateMode: false,
    }],
    placedImages: [],
    backgroundColor: '#ffffff',
    totalWidth: totalW,
    maxHeight: totalH,
  }
}

const printPanorama = ref<Panorama>(makePrintPanorama(activePrintSize.value, bleedIn.value))

// ── Public API ────────────────────────────────────────────────────────────────

export const usePrintProject = () => {

  /** Change print size — resets placed images since canvas dimensions change. */
  const setPrintSize = (size: PrintSize) => {
    activePrintSize.value = size
    printPanorama.value   = makePrintPanorama(size, bleedIn.value)
  }

  /** Change bleed amount in inches — expands/contracts canvas while preserving placed content. */
  const setBleed = (inches: number) => {
    const newBleedIn = Math.max(0, Math.min(2, inches))
    const oldBleedPx = Math.round(bleedIn.value * PRINT_DPI)
    const newBleedPx = Math.round(newBleedIn * PRINT_DPI)
    const delta = newBleedPx - oldBleedPx

    bleedIn.value = newBleedIn
    if (delta === 0) return

    const pano  = printPanorama.value
    const frame = pano.frames[0]
    if (!frame) return

    // Resize the frame AR and canvas dimensions
    const newW = pano.totalWidth + 2 * delta
    const newH = pano.maxHeight  + 2 * delta
    frame.aspectRatio = { ...frame.aspectRatio, width: newW, height: newH, ratio: newW / newH }
    pano.totalWidth = newW
    pano.maxHeight  = newH

    // Shift placed images (position only — slot bindings are the same objects as
    // frame.templateSlots, so they get shifted in the next block; don't touch them here)
    for (const img of pano.placedImages) {
      img.x += delta
      img.y += delta
    }

    // Shift template slot coords stored on the frame (img.slotBinding refs these same objects)
    if (frame.templateSlots) {
      for (const slot of frame.templateSlots) {
        slot.slotX += delta
        slot.slotY += delta
      }
    }

    if (bleedIn.value <= 0) showGuides.value = false
  }

  const setShowGuides = (val: boolean) => { showGuides.value = val }

  const updatePrintBackground = (color: string) => {
    printPanorama.value.backgroundColor = color
  }

  const resetPrintProject = () => {
    activePrintSize.value = PRINT_SIZES[0]!
    bleedIn.value         = 0.25
    showGuides.value      = false
    printPanorama.value   = makePrintPanorama(activePrintSize.value, bleedIn.value)
  }

  /** Restore a saved panorama snapshot (called by usePersistence on project load). */
  const restorePrintPanorama = (data: Panorama) => {
    printPanorama.value = data
  }

  /** Restore the active print size by name (called by usePersistence on project load). */
  const restorePrintSize = (sizeName: string) => {
    const found = PRINT_SIZES.find(s => s.name === sizeName)
    if (found) activePrintSize.value = found
  }

  return {
    activePrintSize: computed(() => activePrintSize.value),
    printPanorama:   computed(() => printPanorama.value),
    bleedIn:         computed(() => bleedIn.value),
    showGuides:      computed(() => showGuides.value),
    setPrintSize,
    setBleed,
    setShowGuides,
    updatePrintBackground,
    resetPrintProject,
    restorePrintPanorama,
    restorePrintSize,
  }
}
