import { ref } from 'vue'

/** True while a touch-drag from the image tray is in progress */
export const isTouchDragActive = ref(false)

/** Set by ImageTray on touchend; consumed + cleared by PanoramaCanvas */
export const touchDropPending = ref<{ imageId: string; clientX: number; clientY: number } | null>(null)
