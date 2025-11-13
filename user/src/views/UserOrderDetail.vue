<template>
  <div class="cart-banner-container">
    <img src="@/assets/images/Breadcrumbs.png" alt="Order Details Banner" class="cart-banner-img" />
    <div class="cart-breadcrumbs-container">
      <nav class="cart-breadcrumbs">
        <router-link to="/">Home</router-link>
        <i class="fas fa-chevron-right breadcrumb-separator"></i> 
        <router-link to="/orders">My Orders</router-link>
        <i class="fas fa-chevron-right breadcrumb-separator"></i> 
        <strong>Order Details</strong>
      </nav>
    </div>
  </div>

  <div class="order-detail-container">
    
    <div v-if="loading" class="loading-state">
      <p>Loading order details...</p>
    </div>

    <div v-else-if="!order" class="error-state">
      <h1>Order Not Found</h1>
      <p>We couldn't find an order with that ID.</p>
      <router-link to="/orders" class="btn btn-shop-now">Back to My Orders</router-link>
    </div>

    <template v-else>
      <div class="detail-page-header">
        <div class="header-left">
          <h1>Order #{{ order.id }}</h1>
          <span class="order-meta">{{ order.date }}</span>
          <span class="order-meta-separator">•</span>
          <span class="order-meta">{{ order.items.length }} Products</span>
        </div>
        <div class="header-right">
          <router-link to="/orders" class="back-to-list-btn">
            <i class="fas fa-arrow-left"></i> Back to List
          </router-link>
        </div>
      </div>

      <div v-if="orderStep > 0 && order.status !== 'Cancelled'" class="status-timeline">
        <div class="step" :class="{ 'completed': orderStep >= 1, 'active': orderStep === 1 }">
          <div class="step-icon"><i v-if="orderStep > 1" class="fas fa-check"></i><span v-else>01</span></div>
          <span>Order received</span>
        </div>
        <div class="step" :class="{ 'completed': orderStep >= 2, 'active': orderStep === 2 }">
          <div class="step-icon"><i v-if="orderStep > 2" class="fas fa-check"></i><span v-else>02</span></div>
          <span>Processing</span>
        </div>
        <div class="step" :class="{ 'completed': orderStep >= 3, 'active': orderStep === 3 }">
          <div class="step-icon"><i v-if="orderStep > 3" class="fas fa-check"></i><span v-else>03</span></div>
          <span>Shipping</span>
        </div>
        <div class="step" :class="{ 'completed': orderStep >= 4, 'active': orderStep === 4 }">
          <div class="step-icon"><i v-if="orderStep > 4" class="fas fa-check"></i><span v-else>04</span></div>
          <span>Completed</span>
        </div>
        <div class="timeline-bar">
          <div class="timeline-progress" :style="{ width: progressPercentage }"></div>
        </div>
      </div>
      <div v-else-if="order.status === 'Cancelled'" class="cancelled-banner">
        <i class="fas fa-times-circle"></i>
        <span>This order has been cancelled.</span>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <h4>Billing Address</h4>
          <address>
            <strong>{{ order.billingAddress.name }}</strong><br>
            {{ order.billingAddress.address }}<br>
            {{ order.billingAddress.city }}<br>
            <div class="info-contact">
              <span>Email: {{ order.billingAddress.email }}</span>
              <span>Phone: {{ order.billingAddress.phone }}</span>
            </div>
          </address>
        </div>
        <div class="info-card">
          <h4>Shipping Address</h4>
          <address>
            <strong>{{ order.shippingAddress.name }}</strong><br>
            {{ order.shippingAddress.address }}<br>
            {{ order.shippingAddress.city }}<br>
            <div class="info-contact">
              <span>Email: {{ order.shippingAddress.email }}</span>
              <span>Phone: {{ order.shippingAddress.phone }}</span>
            </div>
          </address>
        </div>
        <div class="info-card summary-card">
          <h4>Order Summary</h4>
          <div class="summary-row"><span>Order ID:</span><strong>#{{ order.id }}</strong></div>
          <div class="summary-row"><span>Payment Method:</span><strong>{{ order.paymentMethod }}</strong></div>
          <hr />
          <div class="summary-row"><span>Subtotal:</span><strong>{{ order.subtotal }}</strong></div>
          <div class="summary-row"><span>Discount:</span><strong>{{ order.discount }}</strong></div>
          <div class="summary-row"><span>Shipping:</span><strong>{{ order.shipping }}</strong></div>
          <div class="summary-row total"><span>Total</span><strong>{{ order.total }}</strong></div>
        </div>
      </div>

      <div class="table-container">
        <table class="order-item-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in order.items" :key="item.id">
              <td>
                <div class="product-cell">
                  <img :src="item.image" :alt="item.name" />
                  <span class="product-name">{{ item.name }}</span>
                </div>
              </td>
              <td>{{ item.price }}</td>
              <td>x{{ item.quantity }}</td>
              <td>{{ item.subtotal }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import '@fortawesome/fontawesome-free/css/all.min.css'; // Cho icon

const route = useRoute();
const orderId = ref(route.params.id);
const loading = ref(true);

// Hàm format tiền tệ VNĐ
const formatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

// Dữ liệu giả lập (để null ban đầu)
const order = ref(null);

// === LOGIC MỚI: ĐỒNG BỘ TIMELINE ===
const orderStep = computed(() => {
  if (!order.value) return 0;
  // Ánh xạ trạng thái (status) sang các bước (step)
  switch (order.value.status) {
    case 'Processing': return 2;
    case 'Shipping': return 3;
    case 'Completed': return 4;
    case 'Cancelled': return 0; // Đơn hàng hủy sẽ có bước là 0
    default: return 1; // (Pending/Order received)
  }
});

// Tính toán % của thanh timeline
const progressPercentage = computed(() => {
  if (orderStep.value <= 1) return '0%';
  // Tổng số bước hoàn thành timeline là 4 (1-4).
  // Có 3 khoảng trống giữa các bước (từ 1 đến 2, từ 2 đến 3, từ 3 đến 4).
  // Vì vậy, orderStep 2 là 1/3 = 33.33%, orderStep 3 là 2/3 = 66.66%
  return ((orderStep.value - 1) / 3) * 100 + '%'; 
});
// ===================================


// === LOGIC MỚI: TẢI DỮ LIỆU ĐỘNG ===
// (Đây là nơi bạn sẽ gọi API thật)
const mockOrderDatabase = [
  {
    id: 'HC1021', date: 'November 11, 2025', status: 'Shipping', 
    items: [
      { id: 1, name: 'Bông Cải Xanh (Organic)', price: formatter.format(70000), quantity: 5, subtotal: formatter.format(350000), image: 'https://via.placeholder.com/60/27ae60/ffffff?text=V' },
    ],
    billingAddress: { name: 'Trần Văn An', address: '123 Đường ABC', city: 'Đà Nẵng', email: 'tranvanan@example.com', phone: '0905 123 456' },
    shippingAddress: { name: 'Trần Văn An', address: '123 Đường ABC', city: 'Đà Nẵng', email: 'tranvanan@example.com', phone: '0905 123 456' },
    paymentMethod: 'COD', subtotal: formatter.format(350000), discount: '0đ', shipping: formatter.format(30000), total: formatter.format(380000)
  },
  {
    id: 'HC1019', date: 'November 10, 2025', status: 'Completed', 
    items: [
      { id: 1, name: 'Sữa Hạnh Nhân (1 item)', price: formatter.format(85000), quantity: 1, subtotal: formatter.format(85000), image: 'https://via.placeholder.com/60/3498db/ffffff?text=D' },
    ],
    billingAddress: { name: 'Leslie Alexander', address: '456 Đường XYZ', city: 'Hà Nội', email: 'leslie@example.com', phone: '0905 654 321' },
    shippingAddress: { name: 'Leslie Alexander', address: '456 Đường XYZ', city: 'Hà Nội', email: 'leslie@example.com', phone: '0905 654 321' },
    paymentMethod: 'Credit Card', subtotal: formatter.format(85000), discount: '0đ', shipping: 'Free', total: formatter.format(85000)
  },
  {
    id: 'HC1020', date: 'November 11, 2025', status: 'Cancelled', // Đơn hàng này sẽ hiển thị thông báo hủy
    items: [
      { id: 1, name: 'Bánh Mì Keto (2 items)', price: formatter.format(60000), quantity: 2, subtotal: formatter.format(120000), image: 'https://via.placeholder.com/60/e67e22/ffffff?text=B' },
    ],
    billingAddress: { name: 'Nguyễn Thị Bích', address: '789 Đường LMN', city: 'TP. HCM', email: 'bich@example.com', phone: '0905 111 222' },
    shippingAddress: { name: 'Nguyễn Thị Bích', address: '789 Đường LMN', city: 'TP. HCM', email: 'bich@example.com', phone: '0905 111 222' },
    paymentMethod: 'Momo', subtotal: formatter.format(120000), discount: '0đ', shipping: 'Free', total: formatter.format(120000)
  },
  {
    id: 'HC1022', date: 'November 12, 2025', status: 'Processing', // Đơn hàng này đang ở bước 2
    items: [
      { id: 1, name: 'Ức Gà Phi Lê', price: formatter.format(150000), quantity: 1, subtotal: formatter.format(150000), image: 'https://via.placeholder.com/60/f1c40f/ffffff?text=M' },
      { id: 2, name: 'Cải Xoăn (Organic)', price: formatter.format(45000), quantity: 2, subtotal: formatter.format(90000), image: 'https://via.placeholder.com/60/2ecc71/ffffff?text=C' },
    ],
    billingAddress: { name: 'Lê Văn Chính', address: '101 Đường Trần Phú', city: 'Huế', email: 'chinh@example.com', phone: '0901 000 111' },
    shippingAddress: { name: 'Lê Văn Chính', address: '101 Đường Trần Phú', city: 'Huế', email: 'chinh@example.com', phone: '0901 000 111' },
    paymentMethod: 'Paypal', subtotal: formatter.format(240000), discount: '10%', shipping: formatter.format(30000), total: formatter.format(246000)
  },
];

onMounted(() => {
  loading.value = true;
  setTimeout(() => {
    const foundOrder = mockOrderDatabase.find(o => o.id === orderId.value);
    if (foundOrder) {
      order.value = foundOrder;
    } else {
      order.value = null; 
    }
    loading.value = false;
  }, 1000);
});

function getStatusClass(status) {
  if (status === 'Shipping') return 'shipping';
  if (status === 'Cancelled') return 'cancelled';
  if (status === 'Completed') return 'completed';
  return '';
}
</script>

<style scoped src="./UserOrderDetail.css"></style>