<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <i :class="['fas', iconClass, 'modal-icon']"></i>
        <h3>{{ title }}</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <p v-html="message"></p>
      </div>
      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary">
          {{ cancelText }}
        </button>
        <button 
          @click="$emit('confirm')" 
          class="btn"
          :class="confirmButtonClass"
          :disabled="loading"
        >
          <span v-if="loading">Processing...</span>
          <span v-else>{{ confirmText }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  type: {
    type: String,
    default: 'warning', // 'warning', 'danger', 'info', 'success'
    validator: (value) => ['warning', 'danger', 'info', 'success'].includes(value)
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'confirm'])

const iconClass = computed(() => {
  const icons = {
    warning: 'fa-exclamation-triangle',
    danger: 'fa-trash-alt',
    info: 'fa-info-circle',
    success: 'fa-check-circle'
  }
  return icons[props.type] || icons.warning
})

const confirmButtonClass = computed(() => {
  const classes = {
    warning: 'btn-warning',
    danger: 'btn-danger',
    info: 'btn-primary',
    success: 'btn-success'
  }
  return classes[props.type] || 'btn-primary'
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: var(--sidebar-bg, #fff);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 450px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.modal-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
}

.modal-icon.fa-exclamation-triangle {
  color: #f59e0b;
}

.modal-icon.fa-trash-alt {
  color: #ef4444;
}

.modal-icon.fa-info-circle {
  color: var(--primary-color, #4F46E5);
}

.modal-icon.fa-check-circle {
  color: #16a34a;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-dark, #111827);
  margin: 0;
}

.modal-header .close-btn {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--text-light, #9ca3af);
  cursor: pointer;
  line-height: 1;
}

.modal-header .close-btn:hover {
  color: var(--text-dark, #111827);
}

.modal-body {
  padding: 1.5rem;
  font-size: 0.95rem;
  color: var(--text-muted, #6b7280);
  line-height: 1.6;
}

.modal-body :deep(strong) {
  color: var(--text-dark, #111827);
  font-weight: 600;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background-color: var(--admin-bg, #f9fafb);
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: var(--sidebar-bg, #fff);
  border-color: var(--border-color, #e5e7eb);
  color: var(--text-dark, #111827);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--admin-bg, #f9fafb);
}

.btn-primary {
  background-color: var(--primary-color, #4F46E5);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-warning {
  background-color: #f59e0b;
  color: #fff;
}

.btn-warning:hover:not(:disabled) {
  background-color: #d97706;
}

.btn-danger {
  background-color: #ef4444;
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
}

.btn-success {
  background-color: #16a34a;
  color: #fff;
}

.btn-success:hover:not(:disabled) {
  background-color: #15803d;
}
</style>