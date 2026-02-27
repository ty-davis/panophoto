<script setup lang="ts">
import { ref } from 'vue'
import ImageUploader from './components/ImageUploader.vue'
import ImageLibrary from './components/ImageLibrary.vue'
import CanvasEditor from './components/CanvasEditor.vue'
import ExportPanel from './components/ExportPanel.vue'

type Tab = 'canvas' | 'export'
const activeTab = ref<Tab>('canvas')
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>PanoPhoto</h1>
      <p class="tagline">Create Instagram-ready panoramas</p>
    </header>

    <div class="app-layout">
      <aside class="sidebar-left">
        <ImageUploader />
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
        <span class="tab-icon">✏️</span>
        <span class="tab-label">Canvas</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'export' }"
        @click="activeTab = 'export'"
      >
        <span class="tab-icon">💾</span>
        <span class="tab-label">Export</span>
      </button>
    </nav>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.tagline {
  margin: 0.1rem 0 0;
  font-size: 0.8rem;
  opacity: 0.9;
}

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
