<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <i class="fas fa-truck modal-icon"></i>
        <h3>{{ isEditing ? 'Edit Supplier' : 'Add Supplier' }}</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      
      <form @submit.prevent="handleSubmit">
        <div class="modal-body">
          <div class="form-group">
            <label for="supplier-name">Name <span class="required">*</span></label>
            <input
              id="supplier-name"
              v-model="form.name"
              type="text"
              placeholder="Enter supplier name"
              maxlength="255"
              required
            />
          </div>

          <div class="form-group">
            <label for="supplier-email">Email</label>
            <input
              id="supplier-email"
              v-model="form.email"
              type="email"
              placeholder="Enter email address"
              maxlength="100"
            />
          </div>

          <div class="form-group">
            <label for="supplier-phone">Phone <span class="required">*</span></label>
            <input
              id="supplier-phone"
              pattern="(\+84|0)\d{9,10}"
              v-model="form.phone"
              type="tel"
              placeholder="Enter phone number"
              maxlength="50"
              required
            />
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading">Saving...</span>
            <span v-else>{{ isEditing ? 'Update' : 'Create' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'

const props = defineProps({
  supplier: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit'])

const isEditing = computed(() => !!props.supplier)

const form = reactive({
  name: '',
  email: '',
  phone: ''
})

// Populate form when editing
watch(() => props.supplier, (newVal) => {
  if (newVal) {
    form.name = newVal.name || ''
    form.email = newVal.email || ''
    form.phone = newVal.phone || ''
  } else {
    form.name = ''
    form.email = ''
    form.phone = ''
  }
}, { immediate: true })

function handleSubmit() {
  if (!form.name.trim() || !form.phone.trim()) {
    return
  }
  
  emit('submit', {
    name: form.name.trim(),
    email: form.email.trim() || null,
    phone: form.phone.trim()
  })
}
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
  border-radius: 4px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 480px;
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
  color: var(--primary-color, #4F46E5);
  margin-right: 1rem;
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
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-dark, #111827);
  margin-bottom: 0.5rem;
}

.form-group .required {
  color: #ef4444;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: var(--admin-bg, #f9fafb);
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color, #4F46E5);
  box-shadow: 0 0 0 3px var(--primary-color-light, rgba(79, 70, 229, 0.1));
}

.form-group input::placeholder {
  color: var(--text-light, #9ca3af);
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
  border-radius: 4px;
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
</style>