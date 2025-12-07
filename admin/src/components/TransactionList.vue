<template>
  <div class="transaction-list">
    <!-- Loading State -->
    <div v-if="loading" class="list-loading">
      <div class="loading-spinner"></div>
      <span>Loading transactions...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="transactions.length === 0" class="list-empty">
      <i class="fas fa-receipt"></i>
      <p>No transactions found</p>
      <span>Try adjusting your filters or create a new transaction</span>
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <table class="transaction-table">
        <thead>
          <tr>
            <th style="font-size: 14px; font-weight: 500;" >Date</th>
            <th style="font-size: 14px; font-weight: 500;" >Type</th>
            <th style="font-size: 14px; font-weight: 500;" >Category</th>
            <th style="font-size: 14px; font-weight: 500;" >Description</th>
            <th style="font-size: 14px; font-weight: 500;" >Method</th>
            <th style="font-size: 14px; font-weight: 500;" >Reference</th>
            <th style="font-size: 14px; font-weight: 500;"  class="text-right">Amount</th>
            <th style="font-size: 14px; font-weight: 500;" class="action-col">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in transactions" :key="tx._id">
            <td class="date-cell">{{ formatDate(tx.date) }}</td>
            <td>
              <span class="type-badge" :class="tx.type">
                <i :class="tx.type === 'inflow' ? 'fas fa-arrow-trend-up' : 'fas fa-arrow-trend-down'"></i>
              </span>
            </td>
            <td>
              <span class="category-badge" :class="getCategoryClass(tx.category)">
                {{ tx.categoryDisplay }}
              </span>
            </td>
            <td class="description-cell">
              <span :title="tx.description">{{ truncateText(tx.description, 30) }}</span>
            </td>
            <td class="method-cell">{{ formatMethod(tx.method) }}</td>
            <td>
              <button 
                v-if="tx.reference" 
                class="reference-link"
                @click="$emit('view-reference', tx)"
              >
                {{ tx.reference }}
              </button>
              <span v-else class="no-reference">-</span>
            </td>
            <td class="amount-cell" :class="tx.type">
              {{ formatAmount(tx.amount, tx.type) }}
            </td>
            <td class="action-cell">
              <button 
                v-if="!tx.is_auto_generated"
                class="action-btn btn-delete"
                @click="$emit('delete-transaction', tx)"
                title="Delete transaction"
              >
                <i class="fas fa-trash-alt"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 0" class="pagination-footer">
      <span class="pagination-info">
        Showing {{ paginationStart }} - {{ paginationEnd }} of {{ pagination.totalItems }}
      </span>
      <div class="page-controls">
        <button 
          class="page-btn"
          :disabled="!pagination.hasPrevPage"
          @click="$emit('page-change', pagination.currentPage - 1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        
        <span class="page-indicator">
          Page {{ pagination.currentPage }} of {{ pagination.totalPages }}
        </span>
        
        <button 
          class="page-btn"
          :disabled="!pagination.hasNextPage"
          @click="$emit('page-change', pagination.currentPage + 1)"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDate, formatPrice } from '@/utilities/helper'
const props = defineProps({
  transactions: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  pagination: {
    type: Object,
    required: true
  }
})

defineEmits(['page-change', 'view-reference', 'delete-transaction'])

// Pagination info
const paginationStart = computed(() => {
  if (props.pagination.totalItems === 0) return 0
  return (props.pagination.currentPage - 1) * props.pagination.perPage + 1
})

const paginationEnd = computed(() => {
  const end = props.pagination.currentPage * props.pagination.perPage
  return Math.min(end, props.pagination.totalItems)
})


// Format amount with sign
function formatAmount(amount, type) {
  const formatted = formatPrice(amount)
  return type === 'inflow' ? `+${formatted}` : `-${formatted}`
}

// Format payment method
function formatMethod(method) {
  const methods = {
    'cash': 'Cash',
    'credit_card': 'Credit Card',
    'bank_transfer': 'Bank Transfer',
    'other': 'Other'
  }
  return methods[method] || method
}

// Get category CSS class
function getCategoryClass(category) {
  const inflowCategories = ['customer_payment', 'other_income']
  return inflowCategories.includes(category) ? 'inflow' : 'outflow'
}

// Truncate text
function truncateText(text, maxLength) {
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>

<style scoped>
.transaction-list {
  background: var(--sidebar-bg, #fff);
  overflow: hidden;
  width: 100%;
}

/* Loading & Empty States */
.list-loading,
.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-muted, #6b7280);
}

.list-empty i {
  font-size: 3rem;
  opacity: 0.3;
  margin-bottom: 1rem;
}

.list-empty p {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.list-empty span {
  font-size: 0.875rem;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color, #e5e7eb);
  border-top-color: var(--primary-color, #4F46E5);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 0.75rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Table */
.table-container {
  overflow-x: auto;
  width: 100%;
  border: none;
}

.transaction-table {
  margin: 0 auto;
  width: calc(100% - 2rem);
  border: 1px solid var(--border-color, #e5e7eb);
}

.transaction-table th,
.transaction-table td {
  padding: 0.875rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  font-size: 0.875rem;
}

th > td {
  height: 50px;
}

.transaction-table th {
  background: var(--admin-bg, #f9fafb);
  font-weight: 600;
  color: var(--text-muted, #6b7280);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.transaction-table tbody tr:hover {
  background: var(--admin-bg, #f9fafb);
}

.transaction-table tbody tr:last-child td {
  border-bottom: none;
}

/* Cells */
.date-cell {
  white-space: nowrap;
  color: var(--text-dark, #111827);
  font-weight: 500;
}

.text-right {
  text-align: right;
}

.action-col {
  width: 60px;
  text-align: center;
}

.description-cell {
  color: var(--text-muted, #6b7280);
  max-width: 200px;
}

.method-cell {
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted, #6b7280);
}

/* Type Badge */
.type-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 0.75rem;
}

.type-badge.inflow {
  background: rgba(22, 163, 74, 0.1);
  color: #16a34a;
}

.type-badge.outflow {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

/* Category Badge */
.category-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.category-badge.inflow {
  background: rgba(22, 163, 74, 0.1);
  color: #16a34a;
}

.category-badge.outflow {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

/* Amount Cell */
.amount-cell {
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
}

.amount-cell.inflow {
  color: #16a34a;
}

.amount-cell.outflow {
  color: #dc2626;
}

/* Reference Link */
.reference-link {
  background: none;
  border: none;
  color: var(--primary-color, #4F46E5);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.reference-link:hover {
  color: var(--primary-color-dark, #4338ca);
}

.no-reference {
  color: var(--text-light, #9ca3af);
}

/* Action Cell */
.action-cell {
  text-align: center;
}

.action-btn {
  background: none;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 4px;
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.btn-delete {
  color: var(--text-muted, #6b7280);
}

.action-btn.btn-delete:hover {
  background: #fef2f2;
  border-color: #dc2626;
  color: #dc2626;
}

.auto-badge {
  color: var(--text-light, #9ca3af);
  font-size: 0.875rem;
}

/* Pagination */
.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
  background-color: none;
}

.pagination-info {
  font-size: 0.875rem;
  color: var(--text-muted, #6b7280);
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 4px;
  background: var(--sidebar-bg, #fff);
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: var(--primary-color-light, #EEF2FF);
  border-color: var(--primary-color, #4F46E5);
  color: var(--primary-color, #4F46E5);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-indicator {
  font-size: 0.875rem;
  color: var(--text-dark, #111827);
  font-weight: 500;
}
</style>