<template>
  <div class="chart-container">
    <div v-if="loading" class="chart-loading">
      <div class="loading-spinner"></div>
      <span>Loading chart...</span>
    </div>
    
    <div v-else class="chart-wrapper">
      <canvas ref="chartCanvas"></canvas>
    </div>
    
    <div v-if="!loading && isEmpty" class="chart-empty">
      <i class="fas fa-chart-bar"></i>
      <p>No transaction data for this period</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { formatPrice } from '@/utilities/helper'
import Chart from 'chart.js/auto'

const props = defineProps({
  chartData: {
    type: Object,
    required: true
  },
  period: {
    type: String,
    default: 'today'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const chartCanvas = ref(null)
let chartInstance = null

const isEmpty = computed(() => {
  if (!props.chartData?.data) return true
  const { inflow, outflow } = props.chartData.data
  return !inflow?.some(v => v > 0) && !outflow?.some(v => v > 0)
})

const periodTitles = {
  today: 'Today\'s Transactions',
  week: 'This Week\'s Transactions',
  month: 'This Month\'s Transactions',
  year: 'This Year\'s Transactions'
}

function createChart() {
  if (!chartCanvas.value || !props.chartData?.labels) return
  
  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: props.chartData.labels,
      datasets: [
        {
          label: 'Inflow',
          data: props.chartData.data?.inflow || [],
          backgroundColor: 'rgba(22, 163, 74, 0.8)',
          borderColor: 'rgba(22, 163, 74, 1)',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.7,
          categoryPercentage: 0.8
        },
        {
          label: 'Outflow',
          data: props.chartData.data?.outflow || [],
          backgroundColor: 'rgba(220, 38, 38, 0.8)',
          borderColor: 'rgba(220, 38, 38, 1)',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.7,
          categoryPercentage: 0.8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: periodTitles[props.period] || 'Transactions',
          font: {
            size: 14,
            weight: '600'
          },
          padding: { bottom: 20 }
        },
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw || 0
              return `${context.dataset.label}: ${formatPrice(value)}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: { size: 11 }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: { size: 11 },
            callback: function(value) {
              if (value >= 1e6) {
                return (value / 1e6).toFixed(0) + 'M'
              }
              if (value >= 1e3) {
                return (value / 1e3).toFixed(0) + 'K'
              }
              return value
            }
          }
        }
      }
    }
  })
}

// Watch for data changes
watch(() => [props.chartData, props.period], () => {
  if (!props.loading) {
    createChart()
  }
}, { deep: true })

watch(() => props.loading, (newVal) => {
  if (!newVal) {
    setTimeout(createChart, 100)
  }
})

onMounted(() => {
  if (!props.loading) {
    createChart()
  }
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>

<style scoped>
.chart-container {
  background: var(--sidebar-bg, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 4px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  min-height: 350px;
  position: relative;
}

.chart-wrapper {
  height: 300px;
}

.chart-loading,
.chart-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-muted, #6b7280);
}

.chart-empty i {
  font-size: 2.5rem;
  opacity: 0.4;
}

.chart-empty p {
  font-size: 0.9rem;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color, #e5e7eb);
  border-top-color: var(--primary-color, #4F46E5);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>