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

        <div class="modal-body">
          <button class="btn-new-project" @click="handleNew">
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
                <span class="project-name">{{ project.name }}</span>
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
const switching = ref(false)

const formatDate = (ts: number) => {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const handleNew = async () => {
  switching.value = true
  await createNewProject()
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
