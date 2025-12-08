<template>
  <div class="dashboard-page">
    <div class="card sales-target-card">
      <div class="card-header">
        <h4>Sales Target</h4>
        <span class="target-amount-top">$500,000.00</span>
      </div>
      
      <div class="target-info-row">
        <span class="current-sales">${{ currentSalesDisplay }}</span>
        <div class="target-status">In Progress</div>
      </div>
      
      <div 
        class="progress-bar-wrapper" 
        ref="progressBar" 
        @mousedown.prevent="startDrag"
      >
        <div class="progress-bar-track">
          <div class="progress-fill" :style="{ width: salesProgress + '%' }"></div>
        </div>
        <div class="progress-thumb" :style="{ left: salesProgress + '%' }"></div>
      </div>
    </div>
    
    <div class="dashboard-grid">
      
      <div class="grid-left">
        <div class="card sales-chart-card">
          <div class="card-header">
            <h4>Your Sales this year</h4>
            <a href="#" class="show-all">Show All <i class="fas fa-chevron-right"></i></a>
          </div>
          <div class="placeholder-chart">Chart Placeholder</div>
        </div>
        
        <div class="card popular-product-card">
          <div class="card-header">
            <h4>Product Popular</h4>
            <div class="right-controls">
              <a href="#" class="show-all">Show All <i class="fas fa-chevron-right"></i></a>
              <button class="filter-btn"><i class="fas fa-filter"></i></button>
            </div>
          </div>
          <table class="product-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Sales</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="product-cell">
                    <img src="https://picsum.photos/300" alt="Bông Cải" />
                    <div class="product-info">
                      <span class="product-id">HC001</span>
                      <span class="product-name">Bông Cải Xanh (Organic)</span>
                    </div>
                  </div>
                </td>
                <td>$2.50</td>
                <td>3000</td>
                <td><span class="status-badge success">Success</span></td>
              </tr>
              </tbody>
          </table>
        </div>
      </div>
      
      <div class="grid-right">
        <div class="card stat-card revenue">
          <div class="card-header">
            <h5>Total Revenue</h5>
            <i class="fas fa-ellipsis-h"></i>
          </div>
          <div class="stat-body">
            <h3>{{ revenueTotal }}</h3>
            <span class="stat-change positive">+15.0%</span>
          </div>
          <span class="stat-footer">From last week</span>
        </div>
        
        <div class="card stat-card customer">
          <div class="card-header">
            <h5>Total Customer</h5>
            <i class="fas fa-ellipsis-h"></i>
          </div>
          <div class="stat-body">
            <h3>5.000</h3>
            <span class="stat-change positive">+1.5%</span>
          </div>
          <span class="stat-footer">From last week</span>
        </div>

        <div class="card stat-card transaction">
          <div class="card-header">
            <h5>Total Transactions</h5>
            <i class="fas fa-ellipsis-h"></i>
          </div>
          <div class="stat-body">
            <h3>12.000</h3>
            <span class="stat-change positive">+3.6%</span>
          </div>
          <span class="stat-footer">From last week</span>
        </div>

        <div class="card stat-card product">
          <div class="card-header">
            <h5>Total Product</h5>
            <i class="fas fa-ellipsis-h"></i>
          </div>
          <div class="stat-body">
            <h3>5.000</h3>
            <span class="stat-change negative">-1.5%</span>
          </div>
          <span class="stat-footer">From last week</span>
        </div>

        <div class="card promo-card">
          <i class="fas fa-rocket promo-icon"></i>
          <h3>Increase your sales</h3>
          <p>Discover the Proven Methods to Skyrocket Your Sales! Unleash the Potential...</p>
          <button class="btn btn-primary">Learn More</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'

// --- DỮ LIỆU MOCK VÀ FORMAT ---
const formatter = new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 0 });
const revenueTotal = computed(() => formatter.format(81000));

// --- LOGIC CHO THANH TRƯỢT (SLIDER) ---
const salesProgress = ref(46.2);
const totalTarget = 500000;
const progressBar = ref(null);
const isDragging = ref(false);

const currentSalesDisplay = computed(() => {
  const currentSales = (totalTarget * salesProgress.value) / 100;
  return new Intl.NumberFormat('en-US', { 
    style: 'decimal', 
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(currentSales);
});

function updateSalesProgress(event) {
  if (!progressBar.value) return;
  const rect = progressBar.value.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const barWidth = rect.width;
  let percentage = (offsetX / barWidth) * 100;
  if (percentage < 0) percentage = 0;
  if (percentage > 100) percentage = 100;
  salesProgress.value = percentage;
}

function startDrag(event) {
  isDragging.value = true;
  updateSalesProgress(event); 
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchmove', onDrag); 
  window.addEventListener('touchend', stopDrag); 
}

function onDrag(event) {
  if (isDragging.value) {
    const moveEvent = event.touches ? event.touches[0] : event;
    updateSalesProgress(moveEvent);
  }
}

function stopDrag() {
  isDragging.value = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchmove', onDrag);
  window.removeEventListener('touchend', stopDrag);
}

onBeforeUnmount(() => {
  stopDrag();
});
</script>

<style scoped src="@/styling/Dashboard.css"></style>