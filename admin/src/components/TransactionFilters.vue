<template>
  <div class="filters-section">
    <div class="filters-row">
      <div class="filter-group">
        <label>Type</label>
        <select v-model="localFilters.type">
          <option value="">All Types</option>
          <option value="inflow">Inflow</option>
          <option value="outflow">Outflow</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>From</label>
        <input 
          type="date" 
          v-model="localFilters.dateFrom"
          :max="localFilters.dateTo || today"
        />
      </div>
      
      <div class="filter-group">
        <label>To</label>
        <input 
          type="date" 
          v-model="localFilters.dateTo"
          :min="localFilters.dateFrom"
          :max="today"
        />
      </div>
      
      <div class="filter-actions">
        <button class="btn btn-secondary btn-sm" @click="resetFilters">
          <i class="fas fa-undo"></i>
          Reset
        </button>
        <button class="btn btn-primary btn-sm" @click="applyFilters">
          <i class="fas fa-search"></i>
          Apply
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'

const props = defineProps({
  filters: {
    type: Object,
    default: () => ({
      type: '',
      dateFrom: '',
      dateTo: ''
    })
  }
})

const emit = defineEmits(['apply-filters', 'reset-filters'])

const localFilters = reactive({
  type: props.filters.type || '',
  dateFrom: props.filters.dateFrom || '',
  dateTo: props.filters.dateTo || ''
})

const today = computed(() => new Date().toISOString().split('T')[0])

// Sync with parent filters
watch(() => props.filters, (newFilters) => {
  localFilters.type = newFilters.type || ''
  localFilters.dateFrom = newFilters.dateFrom || ''
  localFilters.dateTo = newFilters.dateTo || ''
}, { deep: true })

function applyFilters() {
  emit('apply-filters', { ...localFilters })
}

function resetFilters() {
  localFilters.type = ''
  localFilters.dateFrom = ''
  localFilters.dateTo = ''
  emit('reset-filters')
}
</script>

<style scoped>
.filters-section {
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.filter-group label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted, #6b7280);
}

.filter-group select,
.filter-group input[type="date"] {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 4px;
  font-size: 0.875rem;
  background: var(--admin-bg, #f9fafb);
  min-width: 150px;
}

.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  border-color: var(--primary-color, #4F46E5);
  box-shadow: 0 0 0 2px var(--primary-color-light, #EEF2FF);
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
}

.btn-primary {
  background: var(--primary-color, #4F46E5);
  color: #fff;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background: var(--sidebar-bg, #fff);
  border-color: var(--border-color, #e5e7eb);
  color: var(--text-dark, #111827);
}

.btn-secondary:hover {
  background: var(--admin-bg, #f9fafb);
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .filter-group select,
  .filter-group input[type="date"] {
    width: 100%;
  }
  
  .filter-actions {
    margin-left: 0;
    margin-top: 0.5rem;
  }
}
</style>