<template>
  <div class="summary-cards">
    <div 
      v-for="(periodKey) in periods" 
      :key="periodKey"
      class="summary-card"
      :class="{ 'selected': selectedPeriod === periodKey }"
      @click="$emit('select-period', periodKey)"
    >
      <div class="card-title">{{ periodLabels[periodKey] }}</div>
      
      <div v-if="loading" class="card-loading">
        <div class="loading-spinner"></div>
      </div>
      
      <template v-else>
        <div class="card-net" :class="getNetClass(summary[periodKey]?.net)">
          {{ formatNetAmount(summary[periodKey]?.net) }}
        </div>
        
        <div class="card-details">
          <div class="detail-item inflow">
            <i class="fas fa-arrow-trend-up"></i>
            <span>{{ formatCompactAmount(summary[periodKey]?.inflow) }}</span>
          </div>
          <div class="detail-item outflow">
            <i class="fas fa-arrow-trend-down"></i>
            <span>{{ formatCompactAmount(summary[periodKey]?.outflow) }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  summary: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedPeriod: {
    type: String,
    default: 'today'
  }
})

defineEmits(['select-period'])

const periods = ['today', 'week', 'month', 'year']

const periodLabels = {
  today: 'Last 24h',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year'
}

function formatNetAmount(value) {
  if (value === undefined || value === null) return '0₫'
  
  const absValue = Math.abs(value)
  const sign = value >= 0 ? '+' : '-'
  
  return sign + formatCompactAmount(absValue)
}

function formatCompactAmount(value) {
  if (value === undefined || value === null) return '0'
  
  const absValue = Math.abs(value)
  
  if (absValue >= 1e9) {
    return (absValue / 1e9).toFixed(1) + 'B'
  }
  if (absValue >= 1e6) {
    return (absValue / 1e6).toFixed(1) + 'M'
  }
  if (absValue >= 1e3) {
    return (absValue / 1e3).toFixed(1) + 'K'
  }
  
  return new Intl.NumberFormat('vi-VN').format(absValue) + '₫'
}

function getNetClass(value) {
  if (value === undefined || value === null || value === 0) return 'neutral'
  return value > 0 ? 'positive' : 'negative'
}
</script>

<style scoped>
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-bottom: 1rem;
}

@media (max-width: 1200px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  background: var(--sidebar-bg, #fff);
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.summary-card:hover {
  border-color: var(--primary-color, #4F46E5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.summary-card.selected {
  border-color: var(--primary-color, #4F46E5);
  background: var(--primary-color-light, #EEF2FF);
}

.card-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-muted, #6b7280);
  margin-bottom: 0.75rem;
  text-align: center;
}

.card-net {
  font-size: 1.375rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.75rem;
}

.card-net.positive {
  color: #16a34a;
}

.card-net.negative {
  color: #dc2626;
}

.card-net.neutral {
  color: var(--text-dark, #111827);
}

.card-details {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  font-size: 1rem;
  font-weight: 500;
}

.detail-item.inflow {
  color: #16a34a;
}

.detail-item.outflow {
  color: #dc2626;
}

.detail-item i {
  font-size: 0.75rem;
}

/* Loading State */
.card-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--border-color, #e5e7eb);
  border-top-color: var(--primary-color, #4F46E5);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>