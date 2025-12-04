<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <i class="fas fa-exclamation-triangle warning-icon"></i>
        <h3>Delete Transaction</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <p>Are you sure you want to delete this transaction?</p>
        
        <div class="transaction-preview" v-if="transaction">
          <div class="preview-row">
            <span class="preview-label">Category:</span>
            <span class="category-badge" :class="getCategoryClass(transaction.category)">
              {{ formatCategory(transaction.category) }}
            </span>
          </div>
          <div class="preview-row">
            <span class="preview-label">Amount:</span>
            <span class="preview-value" :class="transaction.type === 'inflow' ? 'text-green' : 'text-red'">
              {{ transaction.type === 'inflow' ? '+' : '-' }}{{ formatPrice(transaction.amount) }}
            </span>
          </div>
          <div class="preview-row">
            <span class="preview-label">Date:</span>
            <span class="preview-value">{{ formatDate(transaction.date) }}</span>
          </div>
        </div>
        
        <p class="warning-text">
          <i class="fas fa-info-circle"></i>
          This action cannot be undone.
        </p>
      </div>
      
      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary" :disabled="deleting">
          Cancel
        </button>
        <button @click="$emit('confirm')" class="btn btn-danger" :disabled="deleting">
          <span v-if="deleting">Deleting...</span>
          <span v-else>Delete</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatPrice, formatDate } from '@/utilities/helper'

const props = defineProps({
  transaction: {
    type: Object,
    default: null
  },
  deleting: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'confirm'])

const categoryLabels = {
  customer_payment: 'Customer Payment',
  other_income: 'Other Income',
  refund: 'Refund',
  supplier_payment: 'Supplier Payment',
  shipping_cost: 'Shipping Cost',
  packaging: 'Packaging',
  utilities: 'Utilities',
  rent: 'Rent',
  other_expense: 'Other Expense'
}

function formatCategory(category) {
  return categoryLabels[category] || category
}

function getCategoryClass(category) {
  return `category-${category.replace(/_/g, '-')}`
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
  max-width: 420px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.warning-icon {
  font-size: 1.25rem;
  color: #f59e0b;
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
}

.modal-body > p {
  margin: 0 0 1rem;
  color: var(--text-muted, #6b7280);
  font-size: 0.9rem;
}

.transaction-preview {
  background: var(--admin-bg, #f9fafb);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.preview-row:not(:last-child) {
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.preview-label {
  font-size: 0.875rem;
  color: var(--text-muted, #6b7280);
}

.preview-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-dark, #111827);
}

.text-green {
  color: #16a34a;
}

.text-red {
  color: #dc2626;
}

.category-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Category badge colors */
.category-customer-payment { background: #dcfce7; color: #166534; }
.category-other-income { background: #dbeafe; color: #1e40af; }
.category-refund { background: #fef3c7; color: #92400e; }
.category-supplier-payment { background: #fee2e2; color: #991b1b; }
.category-shipping-cost { background: #ffedd5; color: #9a3412; }
.category-packaging { background: #e0e7ff; color: #3730a3; }
.category-utilities { background: #fae8ff; color: #86198f; }
.category-rent { background: #f3e8ff; color: #6b21a8; }
.category-wages { background: #cffafe; color: #0e7490; }
.category-marketing { background: #fce7f3; color: #9d174d; }
.category-equipment { background: #ecfccb; color: #3f6212; }
.category-other-expense { background: #f1f5f9; color: #475569; }

.warning-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0;
}

.warning-text i {
  color: #9ca3af;
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

.btn-danger {
  background-color: #ef4444;
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>