<template>
  <div class="cart-banner-container">
    <img src="@/assets/images/Breadcrumbs.png" alt="My Orders Banner" class="cart-banner-img" />
    <div class="cart-breadcrumbs-container">
      <nav class="cart-breadcrumbs">
        <router-link to="/">Home</router-link>
        <i class="fas fa-chevron-right breadcrumb-separator"></i> 
        <strong>My Orders</strong>
      </nav>
    </div>
  </div>

  <div class="order-history-container">
    <h1 class="page-title">My Orders</h1>

    <div class="table-container">
      <table class="order-table">
        <thead>
          <tr>
            <th>Order</th> <th>Date</th>
            <th>Status</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            
            <td>
              <div class="product-cell">
                <img :src="order.image" :alt="order.productName" />
                <div class="product-info">
                  <span class="order-id">#{{ order.id }}</span>
                  <span class="product-name">{{ order.productName }}</span>
                </div>
              </div>
            </td>

            <td>{{ order.date }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(order.status)">
                {{ order.status }}
              </span>
            </td>
            <td>{{ order.total }}</td>
            <td>
              <router-link :to="`/orders/${order.id}`" class="btn btn-view-details">
                View Details
              </router-link>
            </td>
          </tr>

          <tr v-if="orders.length === 0">
            <td colspan="5" class="empty-orders">
              <p>You haven't placed any orders yet.</p>
              <router-link to="/products" class="btn btn-shop-now">Shop Now</router-link>
            </td>
          </tr>

        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import '@fortawesome/fontawesome-free/css/all.min.css'; // Cho icon breadcrumb

// Hàm format tiền tệ VNĐ (Giả sử bạn dùng)
const formatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

// DỮ LIỆU GIẢ LẬP (ĐÃ CẬP NHẬT)
const orders = ref([
  { 
    id: 'HC1021', 
    date: 'November 11, 2025', 
    status: 'Shipping', 
    total: formatter.format(250000),
    productName: 'Bông Cải Xanh, Ức Gà,... (3 items)', 
    image: 'https://via.placeholder.com/40/27ae60/ffffff?text=V'
  },
  { 
    id: 'HC1020', 
    date: 'November 11, 2025', 
    status: 'Cancelled', 
    total: formatter.format(120000),
    productName: 'Bánh Mì Keto (2 items)',
    image: 'https://via.placeholder.com/40/e67e22/ffffff?text=B'
  },
  { 
    id: 'HC1019', 
    date: 'November 10, 2025', 
    status: 'Completed', 
    total: formatter.format(85000),
    productName: 'Sữa Hạnh Nhân (1 item)',
    image: 'https://via.placeholder.com/40/3498db/ffffff?text=D'
  },
  { 
    id: 'HC1018', 
    date: 'November 10, 2025', 
    status: 'Completed', 
    total: formatter.format(550000),
    productName: 'Set ăn kiêng 1 tuần (5 items)',
    image: 'https://via.placeholder.com/40/f1c40f/ffffff?text=M'
  },
]);

// (Nếu muốn test lúc rỗng, hãy đặt: const orders = ref([]) )

// Hàm helper cho class
function getStatusClass(status) {
  if (status === 'Shipping') return 'shipping';
  if (status === 'Cancelled') return 'cancelled';
  if (status === 'Completed') return 'completed';
  return '';
}
</script>

<style scoped src="./OrderHistory.css"></style>