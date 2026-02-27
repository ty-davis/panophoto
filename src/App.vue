<script setup lang="ts">
import ImageUploader from './components/ImageUploader.vue'
import ImageLibrary from './components/ImageLibrary.vue'
import CanvasEditor from './components/CanvasEditor.vue'
import ExportPanel from './components/ExportPanel.vue'
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

      <main class="main-content">
        <CanvasEditor />
      </main>

      <aside class="sidebar-right">
        <ExportPanel />
      </aside>
    </div>
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
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
}

.tagline {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  opacity: 0.9;
}

.app-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar-left {
  width: 300px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-right {
  width: 280px;
}
</style>
