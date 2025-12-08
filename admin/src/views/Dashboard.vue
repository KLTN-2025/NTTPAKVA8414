<template>
  <div class="dashboard-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Loading dashboard...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>Failed to load dashboard</h3>
      <p>{{ error }}</p>
      <button @click="fetchDashboardData" class="btn btn-primary">
        <i class="fas fa-redo"></i> Try Again
      </button>
    </div>

    <!-- Dashboard Content -->
    <template v-else>
      <!-- Summary Cards Row -->
      <div class="summary-cards-row">
        <div class="stat-card revenue-card">
          <div class="card-header">
            <h5>Total Revenue</h5>
            <i class="fa-solid fa-dollar-sign"></i>
          </div>
          <div class="stat-body">
            <h3 style="font-size: 24px">
              {{ formatPrice(summary.revenue.value) }}
            </h3>
            <span
              :class="[
                'stat-change',
                summary.revenue.change >= 0 ? 'positive' : 'negative',
              ]"
            >
              {{ summary.revenue.change >= 0 ? "+" : ""
              }}{{ summary.revenue.change }}%
            </span>
          </div>
          <span class="stat-footer">{{ summary.revenue.period }}</span>
        </div>

        <div class="stat-card orders-card">
          <div class="card-header">
            <h5>Total Orders</h5>
            <i class="fas fa-file-alt"></i>
          </div>
          <div class="stat-body">
            <h3>{{ formatNumber(summary.orders.value) }}</h3>
            <span
              :class="[
                'stat-change',
                summary.orders.change >= 0 ? 'positive' : 'negative',
              ]"
            >
              {{ summary.orders.change >= 0 ? "+" : ""
              }}{{ summary.orders.change }}%
            </span>
          </div>
          <span class="stat-footer">{{ summary.orders.period }}</span>
        </div>

        <div class="stat-card pending-card">
          <div class="card-header">
            <h5>Pending Orders</h5>
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-body">
            <h3>{{ formatNumber(summary.pendingOrders.value) }}</h3>
            <span
              v-if="summary.pendingOrders.value > 0"
              class="stat-badge warning"
            >
              <i class="fas fa-exclamation-circle"></i> Action needed
            </span>
          </div>
          <span class="stat-footer">{{ summary.pendingOrders.label }}</span>
        </div>

        <div class="stat-card lowstock-card">
          <div class="card-header">
            <h5>Low Stock Items</h5>
            <i class="fas fa-box-open"></i>
          </div>
          <div class="stat-body">
            <h3>{{ formatNumber(restockCount) }}</h3>
            <span
              v-if="summary.lowStock.outOfStock > 0"
              class="stat-badge danger"
            >
              {{ summary.lowStock.outOfStock }} out of stock
            </span>
          </div>
          <span class="stat-footer">Product(s) need restock</span>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="dashboard-grid">
        <!-- Left Column: Chart + Best Sellers -->
        <div class="grid-left">
          <!-- Sales Chart Card -->
          <div class="card sales-chart-card">
            <div class="card-header">
              <h4>Sales Over Time</h4>
              <div class="chart-controls">
                <div class="period-toggle">
                  <button
                    v-for="p in periods"
                    :key="p.value"
                    :class="['period-btn', { active: chartPeriod === p.value }]"
                    @click="changeChartPeriod(p.value)"
                  >
                    {{ p.label }}
                  </button>
                </div>
                <button
                  @click="fetchDashboardData"
                  class="refresh-btn"
                  :disabled="refreshing"
                >
                  <i
                    :class="['fas fa-sync-alt', { 'fa-spin': refreshing }]"
                  ></i>
                </button>
              </div>
            </div>
            <div class="chart-container">
              <canvas ref="salesChart"></canvas>
            </div>
          </div>

          <!-- Best Sellers Card -->
          <div class="card best-sellers-card">
            <div class="card-header">
              <h4>Best Selling Products</h4>
              <span class="period-label">This month</span>
            </div>

            <div v-if="bestSellers.length === 0" class="empty-state">
              <i class="fas fa-shopping-cart"></i>
              <p>No sales data for this month yet</p>
            </div>

            <table v-else class="product-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>PRODUCT</th>
                  <th>CURR. PRICE</th>
                  <th>SOLD</th>
                  <th>REVENUE</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(product, index) in bestSellers" :key="product._id">
                  <td>
                    <span class="rank-badge">{{ index + 1 }}</span>
                  </td>
                  <td>
                    <div class="product-cell">
                      <img
                        :src="buildImagePath(product.image)"
                        :alt="product.name"
                      />
                      <div class="product-info">
                        <span class="product-sku">{{ product.sku }}</span>
                        <span class="product-name">{{ product.name }}</span>
                      </div>
                    </div>
                  </td>
                  <td>{{ formatPrice(product.price) }}</td>
                  <td>
                    <span class="sold-count">{{
                      formatNumber(product.totalQuantity)
                    }}</span>
                  </td>
                  <td>
                    <span class="revenue-amount">{{
                      formatPrice(product.totalRevenue)
                    }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right Column: Quick Actions / Additional Info -->
        <div class="grid-right">
          <div class="card quick-actions-card">
            <div class="card-header">
              <h4>Quick Actions</h4>
            </div>
            <div class="quick-actions-list">
              <router-link to="/admin/orders" class="quick-action-item">
                <div class="action-icon pending">
                  <i class="fas fa-clock"></i>
                </div>
                <div class="action-info">
                  <span class="action-label">Process Orders</span>
                  <span class="action-count"
                    >{{ summary.pendingOrders.value }} pending</span
                  >
                </div>
                <i class="fas fa-chevron-right"></i>
              </router-link>

              <router-link to="/admin/inventory" class="quick-action-item">
                <div class="action-icon warning">
                  <i class="fas fa-box-open"></i>
                </div>
                <div class="action-info">
                  <span class="action-label">Restock Now</span>
                  <span class="action-count"
                    >{{ restockCount }} product(s) need attention</span
                  >
                </div>
                <i class="fas fa-chevron-right"></i>
              </router-link>

              <router-link to="/admin/products/new" class="quick-action-item">
                <div class="action-icon success">
                  <i class="fas fa-plus"></i>
                </div>
                <div class="action-info">
                  <span class="action-label">Add Product</span>
                  <span class="action-count">New listing</span>
                </div>
                <i class="fas fa-chevron-right"></i>
              </router-link>
            </div>
          </div>

          <!-- Last Updated Info -->
          <div class="card info-card">
            <div class="info-content">
              <i class="fas fa-info-circle"></i>
              <div>
                <span class="info-label">Last updated</span>
                <span class="info-value">{{
                  formatDateTime(lastUpdated)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useAuth } from "@clerk/vue";
import axios from "axios";
import Chart from "chart.js/auto";
import { buildImagePath, formatPrice } from "@/utilities/helper";

const { getToken } = useAuth();

const loading = ref(true);
const refreshing = ref(false);
const error = ref(null);
const lastUpdated = ref(null);

const summary = ref({
  revenue: { value: 0, change: 0, period: "vs last month" },
  orders: { value: 0, change: 0, period: "vs last month" },
  pendingOrders: { value: 0, label: "Needs attention" },
  lowStock: { value: 0, outOfStock: 0, threshold: 10 },
});

const restockCount = computed(
  () => summary.value.lowStock.value + summary.value.lowStock.outOfStock
);

const chartData = ref({
  labels: [],
  datasets: { revenue: [], orders: [] },
});

const bestSellers = ref([]);
const chartPeriod = ref("7days");
const salesChart = ref(null);
let chartInstance = null;

const periods = [
  { value: "7days", label: "7 Days" },
  { value: "4weeks", label: "4 Weeks" },
  { value: "12months", label: "12 Months" },
];

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(value || 0);
}

function formatDateTime(date) {
  if (!date) return "Never";
  return new Date(date).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function initChart() {
  if (!salesChart.value) return;

  const ctx = salesChart.value.getContext("2d");

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartData.value.labels,
      datasets: [
        {
          label: "Revenue",
          data: chartData.value.datasets.revenue,
          backgroundColor: "rgba(79, 70, 229, 0.8)",
          borderColor: "rgb(79, 70, 229)",
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: "y",
        },
        {
          label: "Orders",
          data: chartData.value.datasets.orders,
          type: "line",
          borderColor: "rgb(16, 185, 129)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: "rgb(16, 185, 129)",
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: {
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: "rgba(17, 24, 39, 0.9)",
          padding: 12,
          titleFont: { size: 13 },
          bodyFont: { size: 12 },
          callbacks: {
            label: function (context) {
              if (context.dataset.label === "Revenue") {
                return `Revenue: ${formatPrice(context.raw)}`;
              }
              return `Orders: ${context.raw}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        y: {
          type: "linear",
          display: true,
          position: "left",
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            callback: function (value) {
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + "M";
              } else if (value >= 1000) {
                return (value / 1000).toFixed(0) + "K";
              }
              return value;
            },
          },
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            stepSize: 1,
          },
        },
      },
    },
  });
}

function updateChart() {
  if (!chartInstance) {
    initChart();
    return;
  }

  chartInstance.data.labels = chartData.value.labels;
  chartInstance.data.datasets[0].data = chartData.value.datasets.revenue;
  chartInstance.data.datasets[1].data = chartData.value.datasets.orders;
  chartInstance.update();
}

async function fetchDashboardData() {
  try {
    if (!loading.value) {
      refreshing.value = true;
    }
    error.value = null;

    const token = await getToken.value();
    const response = await axios.get("/api/admin/dashboard/all", {
      params: { chartPeriod: chartPeriod.value },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.success) {
      summary.value = response.data.summary;
      chartData.value = response.data.chart;
      bestSellers.value = response.data.bestSellers || [];
      lastUpdated.value = response.data.generatedAt;

      await nextTick();
      updateChart();
    } else {
      throw new Error(response.data.message || "Failed to load dashboard");
    }
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    error.value =
      err.response?.data?.message ||
      err.message ||
      "Failed to load dashboard data";
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

async function changeChartPeriod(period) {
  if (period === chartPeriod.value || refreshing.value) return;

  chartPeriod.value = period;
  refreshing.value = true;

  try {
    const token = await getToken.value();
    const response = await axios.get("/api/admin/dashboard/chart", {
      params: { period },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.success) {
      chartData.value = response.data.data;
      await nextTick();
      updateChart();
    }
  } catch (err) {
    console.error("Chart update error:", err);
  } finally {
    refreshing.value = false;
  }
}

onMounted(async () => {
  fetchDashboardData();
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy();
  }
});
</script>

<style scoped src="@/styling/Dashboard.css"></style>