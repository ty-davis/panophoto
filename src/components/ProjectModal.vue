<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-header">
          <h2><i class="fa-solid fa-folder-open"></i> Projects</h2>
          <button class="modal-close" @click="$emit('close')" aria-label="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Type-picker step shown when creating a new project -->
        <div v-if="choosingType" class="modal-body type-picker-body">
          <p class="type-prompt">What kind of project?</p>
          <div class="type-cards">
            <button class="type-card" @click="confirmNew('social')">
              <i class="fa-brands fa-instagram type-icon"></i>
              <span class="type-name">Social</span>
              <span class="type-desc">Instagram carousel &amp; panorama posts</span>
            </button>
            <button class="type-card" @click="confirmNew('print')">
              <i class="fa-solid fa-print type-icon"></i>
              <span class="type-name">Print</span>
              <span class="type-desc">4×6 or 5×7 photo prints at 300 DPI</span>
            </button>
          </div>
          <button class="btn-cancel-type" @click="choosingType = false">Cancel</button>
        </div>

        <div v-else class="modal-body">
          <button class="btn-new-project" @click="choosingType = true">
            <i class="fa-solid fa-plus"></i> New Project
          </button>

          <div class="project-list">
            <div
              v-for="project in projects"
              :key="project.id"
              class="project-card"
              :class="{ active: project.id === activeProjectId }"
            >
              <div class="project-info">
                <div class="project-name-row">
                  <span class="project-name">{{ project.name }}</span>
                  <span class="project-type-badge" :class="project.type">
                    <i :class="project.type === 'print' ? 'fa-solid fa-print' : 'fa-brands fa-instagram'"></i>
                    {{ project.type === 'print' ? 'Print' : 'Social' }}
                  </span>
                </div>
                <span class="project-date">{{ formatDate(project.updatedAt) }}</span>
                <span v-if="project.id === activeProjectId" class="project-badge">Active</span>
              </div>
              <div class="project-actions">
                <button
                  v-if="project.id !== activeProjectId"
                  class="btn-load"
                  @click="handleLoad(project.id)"
                  :disabled="switching"
                >
                  <i class="fa-solid fa-arrow-right-to-bracket"></i> Load
                </button>
                <button
                  v-if="projects.length > 1"
                  class="btn-delete"
                  @click="handleDelete(project.id)"
                  :disabled="switching"
                  title="Delete project"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePersistence } from '@/composables/usePersistence'

defineEmits<{ close: [] }>()

const { projects, activeProjectId, createNewProject, switchToProject, deleteProject } = usePersistence()
const switching    = ref(false)
const choosingType = ref(false)

const formatDate = (ts: number) => {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const confirmNew = async (type: 'social' | 'print') => {
  choosingType.value = false
  switching.value = true
  await createNewProject(type)
  switching.value = false
}

const handleLoad = async (id: string) => {
  switching.value = true
  await switchToProject(id)
  switching.value = false
}

const handleDelete = async (id: string) => {
  if (!confirm('Delete this project? This cannot be undone.')) return
  switching.value = true
  await deleteProject(id)
  switching.value = false
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 480px;
  max-height: 80dvh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #a0aec0;
  font-size: 1.25rem;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: color 0.15s;
}
.modal-close:hover { color: #4a5568; }

.modal-body {
  padding: 1rem 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ── Type picker ─────────────────────────────────────────────────────────── */
.type-picker-body {
  align-items: center;
  padding: 1.5rem 1.25rem;
}

.type-prompt {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
}

.type-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  width: 100%;
}

.type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
  text-align: center;
}
.type-card:hover {
  border-color: #667eea;
  background: #f0f4ff;
  transform: translateY(-2px);
}

.type-icon {
  font-size: 2rem;
  color: #667eea;
}

.type-name {
  font-size: 1rem;
  font-weight: 700;
  color: #2d3748;
}

.type-desc {
  font-size: 0.75rem;
  color: #718096;
  line-height: 1.4;
}

.btn-cancel-type {
  margin-top: 0.5rem;
  background: none;
  border: none;
  color: #718096;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: color 0.15s;
}
.btn-cancel-type:hover { color: #2d3748; }

/* ── Project list ────────────────────────────────────────────────────────── */
.btn-new-project {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
  align-self: flex-start;
}
.btn-new-project:hover { background: #3182ce; }

.project-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.project-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  transition: border-color 0.15s;
  gap: 0.75rem;
}
.project-card.active {
  border-color: #4299e1;
  background: #ebf8ff;
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.project-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.project-name {
  font-weight: 600;
  color: #2d3748;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}
.project-type-badge.social {
  background: #fef3c7;
  color: #b45309;
}
.project-type-badge.print {
  background: #e0f2fe;
  color: #0369a1;
}

.project-date {
  font-size: 0.75rem;
  color: #718096;
}

.project-badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: #4299e1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.project-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-load {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-load:hover { background: #3182ce; }
.btn-load:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  color: #e53e3e;
  border: 1px solid #fed7d7;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.15s, color 0.15s;
}
.btn-delete:hover { background: #fff5f5; }
.btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }
</style>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 480px;
  max-height: 80dvh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #a0aec0;
  font-size: 1.25rem;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: color 0.15s;
}
.modal-close:hover { color: #4a5568; }

.modal-body {
  padding: 1rem 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-new-project {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
  align-self: flex-start;
}
.btn-new-project:hover { background: #3182ce; }

.project-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.project-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  transition: border-color 0.15s;
  gap: 0.75rem;
}
.project-card.active {
  border-color: #4299e1;
  background: #ebf8ff;
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.project-name {
  font-weight: 600;
  color: #2d3748;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-date {
  font-size: 0.75rem;
  color: #718096;
}

.project-badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: #4299e1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.project-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-load {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-load:hover { background: #3182ce; }
.btn-load:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  color: #e53e3e;
  border: 1px solid #fed7d7;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.15s, color 0.15s;
}
.btn-delete:hover { background: #fff5f5; }
.btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
