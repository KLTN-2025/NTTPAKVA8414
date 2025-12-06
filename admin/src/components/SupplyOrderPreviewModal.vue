<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card preview-modal">
      <div class="modal-header">
        <i class="fas fa-truck header-icon"></i>
        <h3>Supply Order Details</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <span>Loading supply order details...</span>
        </div>

        <div v-else-if="!supplyOrder" class="error-state">
          <i class="fas fa-exclamation-circle"></i>
          <span>Supply order data not available</span>
        </div>

        <div v-else class="preview-content">
          <div class="preview-row">
            <span class="preview-label">PO Number</span>
            <span class="preview-value highlight">{{
              supplyOrder.poNumber
            }}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">Supplier</span>
            <span class="preview-value">{{ supplyOrder.supplier_name }}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">Status</span>
            <span class="preview-value">
              <span
                class="status-badge"
                :class="supplyOrder.status.toLowerCase()"
                >{{ supplyOrder.status }}</span
              >
            </span>
          </div>
          <div class="preview-row">
            <span class="preview-label">Expected Arrival</span>
            <span class="preview-value">{{
              formatDate(supplyOrder.expected_arrival)
            }}</span>
          </div>
          <div class="preview-row" v-if="supplyOrder.received_at">
            <span class="preview-label">Received Date</span>
            <span class="preview-value">{{
              formatDate(supplyOrder.received_at)
            }}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">Total Cost</span>
            <span class="preview-value amount outflow">{{
              formatPrice(supplyOrder.total_cost)
            }}</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate, formatPrice } from '@/utilities/helper';
const props = defineProps({
  supplyOrder: { type: Object, default: null },
  loading: { type: Boolean, default: false },
});
defineEmits(["close"]);
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
.modal-card.preview-modal {
  background: var(--sidebar-bg, #fff);
  border-radius: 4px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}
.modal-header {
  display: flex;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}
.header-icon {
  font-size: 1.25rem;
  color: var(--primary-color, #4f46e5);
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
.modal-body {
  padding: 1.5rem;
}
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--text-muted, #6b7280);
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color, #e5e7eb);
  border-top-color: var(--primary-color, #4f46e5);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.error-state {
  color: #dc2626;
}
.error-state i {
  font-size: 2rem;
}
.preview-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
.preview-value.highlight {
  color: var(--primary-color, #4f46e5);
  font-weight: 600;
}
.preview-value.amount {
  font-size: 1rem;
  font-weight: 600;
}
.preview-value.amount.outflow {
  color: #dc2626;
}
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}
.status-badge.draft {
  background: #f3f4f6;
  color: #4b5563;
}
.status-badge.ordered {
  background: #dbeafe;
  color: #1e40af;
}
.status-badge.received {
  background: #d1fae5;
  color: #065f46;
}
.status-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  background-color: var(--admin-bg, #f9fafb);
  border-top: 1px solid var(--border-color, #e5e7eb);
}
.btn {
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
}
.btn-secondary {
  background-color: var(--sidebar-bg, #fff);
  border-color: var(--border-color, #e5e7eb);
  color: var(--text-dark, #111827);
}
</style>
