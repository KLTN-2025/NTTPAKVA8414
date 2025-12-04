<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <i class="fas fa-plus-circle header-icon"></i>
        <h3>New Transaction</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label for="tx-date">Date <span class="required">*</span></label>
            <input type="date" id="tx-date" v-model="form.date" :max="today" required class="form-input" />
          </div>
          
          <div class="form-group">
            <label for="tx-type">Type <span class="required">*</span></label>
            <select id="tx-type" v-model="form.type" required class="form-input" @change="handleTypeChange">
              <option value="">Select type</option>
              <option value="inflow">Inflow</option>
              <option value="outflow">Outflow</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="tx-category">Category <span class="required">*</span></label>
            <select id="tx-category" v-model="form.category" required class="form-input" :disabled="!form.type">
              <option value="">Select category</option>
              <option v-for="cat in availableCategories" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="tx-method">Payment Method <span class="required">*</span></label>
            <select id="tx-method" v-model="form.method" required class="form-input">
              <option value="">Select method</option>
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="tx-amount">Amount (VND) <span class="required">*</span></label>
          <input 
            type="number" 
            id="tx-amount" 
            v-model.number="form.amount" 
            required 
            min="1" 
            step="1000" 
            placeholder="0" 
            class="form-input" 
          />
        </div>
        
        <div class="form-group">
          <label for="tx-description">Description</label>
          <textarea 
            id="tx-description" 
            v-model="form.description" 
            rows="3" 
            maxlength="500" 
            placeholder="Optional description..." 
            class="form-input"
          ></textarea>
          <span class="char-count">{{ form.description.length }}/500</span>
        </div>
        
        <div v-if="error" class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          {{ error }}
        </div>
      </form>
      
      <div class="modal-footer">
        <button type="button" @click="$emit('close')" class="btn btn-secondary" :disabled="submitting">
          Cancel
        </button>
        <button type="submit" @click="handleSubmit" class="btn btn-primary" :disabled="submitting || !isFormValid">
          <span v-if="submitting">Creating...</span>
          <span v-else>Create Transaction</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import axios from 'axios'

const emit = defineEmits(['close', 'created'])

const form = reactive({
  date: new Date().toISOString().split('T')[0],
  type: '',
  category: '',
  amount: null,
  method: '',
  description: ''
})

const submitting = ref(false)
const error = ref('')

const today = computed(() => new Date().toISOString().split('T')[0])

// Manual-only categories (auto-only categories like customer_payment, refund, supplier_payment excluded)
const inflowCategories = [
  { value: 'other_income', label: 'Other Income' }
]

const outflowCategories = [
  { value: 'shipping_cost', label: 'Shipping Cost' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'rent', label: 'Rent' },
  { value: 'other_expense', label: 'Other Expense' }
]

const availableCategories = computed(() => {
  if (form.type === 'inflow') return inflowCategories
  if (form.type === 'outflow') return outflowCategories
  return []
})

const isFormValid = computed(() => {
  return form.date && 
         form.type && 
         form.category && 
         form.amount > 0 && 
         form.method
})

function handleTypeChange() {
  form.category = ''
}

async function handleSubmit() {
  error.value = ''
  
  if (!isFormValid.value) {
    error.value = 'Please fill in all required fields'
    return
  }
  
  try {
    submitting.value = true
    const response = await axios.post('/api/admin/transactions', {
      date: form.date,
      type: form.type,
      category: form.category,
      amount: form.amount,
      method: form.method,
      description: form.description.trim() || null
    })
    
    if (response.data.success) {
      emit('created')
    } else {
      error.value = response.data.message || 'Failed to create transaction'
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'An error occurred'
  } finally {
    submitting.value = false
  }
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
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.header-icon {
  font-size: 1.25rem;
  color: var(--primary-color, #4F46E5);
  margin-right: 0.75rem;
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-dark, #111827);
  margin: 0;
}

.close-btn {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.75rem;
  color: var(--text-light, #9ca3af);
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-dark, #111827);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-dark, #111827);
  margin-bottom: 0.375rem;
}

.required {
  color: #dc2626;
}

.form-input {
  width: 100%;
  padding: 0.65rem 0.875rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 4px;
  font-size: 0.875rem;
  background: var(--admin-bg, #f9fafb);
  box-sizing: border-box;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color, #4F46E5);
  box-shadow: 0 0 0 2px var(--primary-color-light, #EEF2FF);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 0.75rem;
  color: var(--text-light, #9ca3af);
  margin-top: 0.25rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 4px;
  color: #dc2626;
  font-size: 0.875rem;
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
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background-color: var(--sidebar-bg, #fff);
  border-color: var(--border-color, #e5e7eb);
  color: var(--text-dark, #111827);
}

.btn-secondary:hover {
  background-color: var(--admin-bg, #f9fafb);
}

.btn-primary {
  background-color: var(--primary-color, #4F46E5);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>