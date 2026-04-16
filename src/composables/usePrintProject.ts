import { ref, computed } from 'vue'
import type { Panorama, PrintSize } from '@/types'
import { printSizeToAspectRatio } from '@/types'
import { PRINT_SIZES } from '@/data/printSizes'
import { generateId } from '@/utils/imageUtils'

// ── Module-level state (singleton) ────────────────────────────────────────────

const activePrintSize = ref<PrintSize>(PRINT_SIZES[0]!)

const makePrintPanorama = (size: PrintSize): Panorama => {
  const ar = printSizeToAspectRatio(size)
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
    totalWidth: ar.width,
    maxHeight: ar.height,
  }
}

const printPanorama = ref<Panorama>(makePrintPanorama(activePrintSize.value))

// ── Public API ────────────────────────────────────────────────────────────────

export const usePrintProject = () => {

  /** Change print size — resets placed images since canvas dimensions change substantially. */
  const setPrintSize = (size: PrintSize) => {
    activePrintSize.value = size
    printPanorama.value   = makePrintPanorama(size)
  }

  const updatePrintBackground = (color: string) => {
    printPanorama.value.backgroundColor = color
  }

  const resetPrintProject = () => {
    activePrintSize.value = PRINT_SIZES[0]!
    printPanorama.value   = makePrintPanorama(activePrintSize.value)
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
    setPrintSize,
    updatePrintBackground,
    resetPrintProject,
    restorePrintPanorama,
    restorePrintSize,
  }
}
