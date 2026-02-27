<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ImageLibrary from './components/ImageLibrary.vue'
import CanvasEditor from './components/CanvasEditor.vue'
import ExportPanel from './components/ExportPanel.vue'
import ProjectModal from './components/ProjectModal.vue'
import { usePersistence } from './composables/usePersistence'

type Tab = 'canvas' | 'export'
const activeTab = ref<Tab>('canvas')

const { isLoading, activeProjectName, renameActiveProject, initPersistence } = usePersistence()

const showProjectModal = ref(false)
const showHamburger    = ref(false)
const editingName      = ref(false)
const nameInputRef     = ref<HTMLInputElement>()

const openProjects = () => {
  showHamburger.value = false
  showProjectModal.value = true
}

const startEditName = () => {
  editingName.value = true
  setTimeout(() => nameInputRef.value?.select(), 50)
}

const commitName = (e: Event) => {
  const val = (e.target as HTMLInputElement).value.trim()
  renameActiveProject(val || 'Untitled Project')
  editingName.value = false
}

onMounted(() => initPersistence())
</script>

<template>
  <!-- Loading overlay while restoring saved state -->
  <div v-if="isLoading" class="loading-overlay">
    <div class="loading-spinner"></div>
    <p>Restoring project…</p>
  </div>

  <div v-else class="app">
    <header class="app-header">
      <div class="header-left">
        <img src="/logo.svg" height="30px"/>
        <h1>PanoPhoto</h1>
      </div>
      <div class="header-center">
        <input
          v-if="editingName"
          ref="nameInputRef"
          class="project-name-input"
          :value="activeProjectName"
          @blur="commitName"
          @keydown.enter="commitName"
          @keydown.escape="editingName = false"
        />
        <button v-else class="project-name-btn" @click="startEditName" title="Rename project">
          {{ activeProjectName }}
          <i class="fa-solid fa-pen-to-square project-edit-icon"></i>
        </button>
      </div>
      <div class="header-right">
        <div class="hamburger-wrap">
          <button class="hamburger-btn" @click="showHamburger = !showHamburger" aria-label="Menu">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div v-if="showHamburger" class="hamburger-dropdown" @click.stop>
            <button class="dropdown-item" @click="openProjects">
              <i class="fa-solid fa-folder-open"></i> Manage Projects
            </button>
          </div>
          <!-- click-outside to close -->
          <div v-if="showHamburger" class="hamburger-backdrop" @click="showHamburger = false"></div>
        </div>
      </div>
    </header>

    <div class="app-layout">
      <aside class="sidebar-left">
        <ImageLibrary />
      </aside>

      <main class="main-content" :class="{ 'tab-active': activeTab === 'canvas' }">
        <CanvasEditor />
      </main>

      <aside class="sidebar-right" :class="{ 'tab-active': activeTab === 'export' }">
        <ExportPanel />
      </aside>
    </div>

    <!-- Mobile bottom tab bar -->
    <nav class="mobile-tab-bar" aria-label="Navigation">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'canvas' }"
        @click="activeTab = 'canvas'"
      >
        <i class="fa-solid fa-image tab-icon"></i>
        <span class="tab-label">Canvas</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'export' }"
        @click="activeTab = 'export'"
      >
        <i class="fa-solid fa-file-export tab-icon"></i>
        <span class="tab-label">Export</span>
      </button>
    </nav>

    <ProjectModal v-if="showProjectModal" @close="showProjectModal = false" />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100%;
}
</style>

<style scoped>
.app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7fafc;
}

.app-header {
  background: linear-gradient(135deg, #37A81D 0%, #3182CE 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-left {
  display: flex;
}

.app-header h1 {
  display: inline;
  padding: 0 0.5rem;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
}

.project-name-btn {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  border-radius: 0.375rem;
  padding: 0.25rem 0.625rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: background 0.15s;
}
.project-name-btn:hover { background: rgba(255,255,255,0.25); }

.project-edit-icon { opacity: 0.7; font-size: 0.75rem; }

.project-name-input {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.5);
  color: white;
  border-radius: 0.375rem;
  padding: 0.25rem 0.625rem;
  font-size: 0.875rem;
  font-weight: 600;
  outline: none;
  max-width: 220px;
  width: 100%;
}
.project-name-input::placeholder { color: rgba(255,255,255,0.6); }

.header-right { flex-shrink: 0; }

.hamburger-wrap { position: relative; }

.hamburger-btn {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  border-radius: 0.375rem;
  width: 36px;
  height: 36px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.hamburger-btn:hover { background: rgba(255,255,255,0.25); }

.hamburger-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  z-index: 200;
  min-width: 180px;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: #2d3748;
  text-align: left;
  transition: background 0.15s;
}
.dropdown-item:hover { background: #f7fafc; }

.hamburger-backdrop {
  position: fixed;
  inset: 0;
  z-index: 199;
}

/* Loading overlay */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: white;
  font-size: 1rem;
  z-index: 9999;
}
.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.app-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.sidebar-left {
  width: 300px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.sidebar-right {
  width: 280px;
  flex-shrink: 0;
}

/* Mobile tab bar – hidden on desktop */
.mobile-tab-bar {
  display: none;
}

/* ── Mobile layout ─────────────────────────────────────── */
@media (max-width: 768px) {
  .app {
    height: 100dvh; /* dynamic viewport height handles browser chrome */
  }

  .app-layout {
    flex-direction: column;
    overflow: hidden;
    /* leave room for fixed bottom tab bar */
    padding-bottom: 60px;
  }

  .sidebar-left,
  .main-content,
  .sidebar-right {
    /* all panels hidden unless the matching tab is active */
    display: none;
    width: 100%;
    flex: 1;
    overflow: auto;
  }

  .sidebar-left.tab-active,
  .main-content.tab-active,
  .sidebar-right.tab-active {
    display: flex;
    flex-direction: column;
  }

  .mobile-tab-bar {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: white;
    border-top: 1px solid #e2e8f0;
    z-index: 100;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  }

  .tab-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    background: none;
    border: none;
    cursor: pointer;
    color: #718096;
    font-size: 0.7rem;
    font-weight: 500;
    padding: 0.25rem;
    transition: color 0.15s;
  }

  .tab-btn.active {
    color: #667eea;
  }

  .tab-icon {
    font-size: 1.25rem;
    line-height: 1;
  }

  .tab-label {
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
}
</style>
