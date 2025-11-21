<template>
  <div class="sales-report-page">
    
    <div class="report-header">
      <div class="date-filter-group">
        <label for="startDate">From</label>
        <input type="date" id="startDate" v-model="filter.startDate" />
        <label for="endDate">To</label>
        <input type="date" id="endDate" v-model="filter.endDate" />
        <button class="btn btn-primary btn-sm">Filter</button>
      </div>
      
      <div class="header-actions">
        <button class="btn btn-secondary">
          <i class="fas fa-file-export"></i>
          <span>Export</span>
        </button>
      </div>
    </div>

    <div class="report-stat-grid">
      <div class="card stat-card">
        <div class="stat-icon icon-revenue">
          <i class="fas fa-dollar-sign"></i>
        </div>
        <div class="stat-info">
          <span class="stat-title">Total Sales</span>
          <span class="stat-value">{{ formatter.format(stats.totalSales) }}</span>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon icon-orders">
          <i class="fas fa-file-invoice-dollar"></i>
        </div>
        <div class="stat-info">
          <span class="stat-title">Total Orders</span>
          <span class="stat-value">{{ stats.totalOrders }}</span>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon icon-avg">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <div class="stat-info">
          <span class="stat-title">Avg. Order Value</span>
          <span class="stat-value">{{ formatter.format(stats.avgOrderValue) }}</span>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon icon-items">
          <i class="fas fa-box-open"></i>
        </div>
        <div class="stat-info">
          <span class="stat-title">Items Sold</span>
          <span class="stat-value">{{ stats.itemsSold }}</span>
        </div>
      </div>
    </div>

    <div class="card chart-card">
      <div class="card-header">
        <h4>Sales Over Time</h4>
      </div>
      <div class="card-body">
        <div class="placeholder-chart">
          Sales Chart Placeholder
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4>Top Selling Products</h4>
      </div>
      <div class="table-container">
        <table class="detail-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Items Sold</th>
              <th>Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in topProducts" :key="product.sku">
              <td>
                <div class="product-cell">
                  <img :src="product.image" :alt="product.name" />
                  <span class="product-name">{{ product.name }}</span>
                </div>
              </td>
              <td>{{ product.sku }}</td>
              <td>{{ product.itemsSold }}</td>
              <td>{{ formatter.format(product.revenue) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Hàm format tiền tệ
const formatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

// Dữ liệu giả lập cho bộ lọc
const filter = ref({
  startDate: '',
  endDate: ''
});

// Dữ liệu giả lập cho thẻ thống kê
const stats = ref({
  totalSales: 157200000,
  totalOrders: 441,
  avgOrderValue: 356462,
  itemsSold: 1205
});

// Dữ liệu giả lập cho bảng Top Products
const topProducts = ref([
  { sku: 'HC002', name: 'Ức Gà Phi Lê', image: 'https://via.placeholder.com/40/f1c40f/ffffff?text=M', itemsSold: 350, revenue: 52500000 },
  { sku: 'HC001', name: 'Bông Cải Xanh (Organic)', image: 'https://via.placeholder.com/40/27ae60/ffffff?text=V', itemsSold: 500, revenue: 25000000 },
  { sku: 'HC007', name: 'Hạt Chia (Organic)', image: 'https://via.placeholder.com/40/9b59b6/ffffff?text=S', itemsSold: 150, revenue: 22500000 },
  { sku: 'HC004', name: 'Sữa Hạnh Nhân', image: 'https://via.placeholder.com/40/3498db/ffffff?text=D', itemsSold: 200, revenue: 17000000 },
]);

onMounted(() => {
  // Set ngày mặc định cho bộ lọc
  const today = new Date().toISOString().split('T')[0];
  const lastMonth = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
  filter.value.startDate = lastMonth;
  filter.value.endDate = today;
});

</script>

<style scoped src="./SalesReport.css"></style>