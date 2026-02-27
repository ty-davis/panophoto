import { ref, watch } from 'vue'
import localforage from 'localforage'
import { useImageStore } from './useImageStore'
import { usePanorama } from './usePanorama'
import { generateId } from '@/utils/imageUtils'
import type { Panorama } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

interface StoredImage {
  id: string
  filename: string
  type: string
  blob: Blob
}

// ── Module-level state (shared across all callers) ────────────────────────────

const projects    = ref<Project[]>([])
const activeProjectId = ref<string>('')
const activeProjectName = ref<string>('Untitled Project')
const isLoading   = ref(true)

// ── Keys ──────────────────────────────────────────────────────────────────────

const PROJECTS_KEY   = 'panophoto:projects'
const ACTIVE_KEY     = 'panophoto:activeProjectId'
const panoramaKey    = (id: string) => `panophoto:project:${id}:panorama`
const imagesKey      = (id: string) => `panophoto:project:${id}:images`

// ── Debounce helper ───────────────────────────────────────────────────────────

function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

// ── Core save/load ────────────────────────────────────────────────────────────

const saveCurrentProject = async () => {
  const id = activeProjectId.value
  if (!id) return
  const { panorama } = usePanorama()
  const { images }   = useImageStore()

  // Save panorama config (pure JSON)
  await localforage.setItem(panoramaKey(id), JSON.parse(JSON.stringify(panorama.value)))

  // Save image blobs
  const stored: StoredImage[] = await Promise.all(
    images.value.map(async (img) => {
      const resp = await fetch(img.url)
      const blob = await resp.blob()
      return { id: img.id, filename: img.file.name, type: img.file.type, blob }
    })
  )
  await localforage.setItem(imagesKey(id), stored)

  // Update project metadata
  const idx = projects.value.findIndex(p => p.id === id)
  if (idx !== -1) {
    projects.value[idx]!.updatedAt = Date.now()
    projects.value[idx]!.name      = activeProjectName.value
  }
  await localforage.setItem(PROJECTS_KEY, JSON.parse(JSON.stringify(projects.value)))
}

const debouncedSave = debounce(saveCurrentProject, 600)

const loadProject = async (id: string) => {
  const { restoreImage, clearImages }     = useImageStore()
  const { restorePanorama, resetPanorama } = usePanorama()

  // Clear current in-memory state
  clearImages()

  const storedImages = await localforage.getItem<StoredImage[]>(imagesKey(id))
  if (storedImages?.length) {
    await Promise.all(storedImages.map(si => restoreImage(si.id, si.blob, si.filename, si.type)))
  }

  const storedPanorama = await localforage.getItem<Panorama>(panoramaKey(id))
  if (storedPanorama) {
    restorePanorama(storedPanorama)
  } else {
    resetPanorama()
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const usePersistence = () => {

  const initPersistence = async () => {
    isLoading.value = true
    try {
      // Load project index
      const storedProjects = await localforage.getItem<Project[]>(PROJECTS_KEY)
      projects.value = storedProjects ?? []

      // Determine active project
      let activeId = await localforage.getItem<string>(ACTIVE_KEY)

      if (!activeId || !projects.value.find(p => p.id === activeId)) {
        // No valid active project — create a fresh one
        activeId = generateId()
        const newProject: Project = {
          id: activeId,
          name: 'Untitled Project',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        projects.value.push(newProject)
        await localforage.setItem(PROJECTS_KEY, projects.value)
        await localforage.setItem(ACTIVE_KEY, activeId)
      }

      activeProjectId.value   = activeId
      activeProjectName.value = projects.value.find(p => p.id === activeId)?.name ?? 'Untitled Project'

      await loadProject(activeId)

      // Set up auto-save watchers after restore
      const { panorama }  = usePanorama()
      const { images }    = useImageStore()
      watch(panorama,   debouncedSave, { deep: true })
      watch(images,     debouncedSave, { deep: true })
      watch(activeProjectName, debouncedSave)
    } finally {
      isLoading.value = false
    }
  }

  const renameActiveProject = (name: string) => {
    activeProjectName.value = name
    const proj = projects.value.find(p => p.id === activeProjectId.value)
    if (proj) proj.name = name
    debouncedSave()
  }

  const createNewProject = async () => {
    // Save current before switching
    await saveCurrentProject()

    const { resetPanorama }  = usePanorama()
    const { clearImages }    = useImageStore()

    const id: string = generateId()
    const newProject: Project = {
      id,
      name: 'Untitled Project',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    projects.value.push(newProject)

    activeProjectId.value   = id
    activeProjectName.value = 'Untitled Project'

    clearImages()
    resetPanorama()

    await localforage.setItem(ACTIVE_KEY, id)
    await localforage.setItem(PROJECTS_KEY, JSON.parse(JSON.stringify(projects.value)))
  }

  const switchToProject = async (id: string) => {
    if (id === activeProjectId.value) return
    await saveCurrentProject()

    activeProjectId.value   = id
    activeProjectName.value = projects.value.find(p => p.id === id)?.name ?? 'Untitled Project'

    await localforage.setItem(ACTIVE_KEY, id)
    await loadProject(id)
  }

  const deleteProject = async (id: string) => {
    // Can't delete the only project
    if (projects.value.length <= 1) return

    projects.value = projects.value.filter(p => p.id !== id)
    await localforage.removeItem(panoramaKey(id))
    await localforage.removeItem(imagesKey(id))
    await localforage.setItem(PROJECTS_KEY, JSON.parse(JSON.stringify(projects.value)))

    // If we deleted the active project, switch to the first remaining one
    if (id === activeProjectId.value) {
      await switchToProject(projects.value[0]!.id)
    }
  }

  return {
    projects,
    activeProjectId,
    activeProjectName,
    isLoading,
    initPersistence,
    renameActiveProject,
    createNewProject,
    switchToProject,
    deleteProject,
    saveCurrentProject
  }
}
