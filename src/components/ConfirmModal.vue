<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="$emit('cancel')">
      <div class="modal">
        <p class="modal-message">{{ message }}</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="$emit('cancel')">Cancel</button>
          <button class="btn-confirm" @click="$emit('confirm')">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{ message: string; confirmLabel?: string }>()
defineEmits<{ confirm: []; cancel: [] }>()
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 340px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.modal-message {
  margin: 0;
  font-size: 0.95rem;
  color: #2d3748;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.625rem;
}

.btn-cancel {
  padding: 0.5rem 1rem;
  background: #edf2f7;
  color: #4a5568;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-cancel:hover { background: #e2e8f0; }

.btn-confirm {
  padding: 0.5rem 1rem;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-confirm:hover { background: #c53030; }
</style>
