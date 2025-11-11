<template>
  <div class="order-detail-page">
    <nav class="form-breadcrumbs">
      <router-link to="/">Dashboard</router-link>
      <i class="fas fa-chevron-right"></i>
      <router-link to="/orders">Orders</router-link>
      <i class="fas fa-chevron-right"></i>
      <strong>Order Details</strong>
    </nav>
    
    <div class="detail-header">
      <h2>Order #{{ order.id }}</h2>
      <div class="header-actions">
        <button class="btn btn-secondary">
          <i class="fas fa-print"></i>
          <span>Print</span>
        </button>
        <router-link :to="'/orders/edit/' + order.id" class="btn btn-primary">
          <i class="fas fa-pencil-alt"></i>
          <span>Edit</span>
        </router-link>
      </div>
    </div>

    <div class="detail-layout">
      <div class="detail-column-left">
        <div class="card">
          <div class="card-header">
            <h4>Order Items ({{ order.items.length }})</h4>
          </div>
          <div class="card-body">
            <table class="detail-item-table">
              <thead>
                <tr>
                  <th colspan="2">Product</th>
                  <th>Quantity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in order.items" :key="item.name">
                  <td class="col-image">
                    <img :src="item.image" :alt="item.name" />
                  </td>
                  <td class="col-info">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-sku">SKU: {{ item.sku }}</span>
                  </td>
                  <td class="col-qty">x {{ item.qty }}</td>
                  <td class="col-price">{{ item.price }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h4>Order Summary</h4>
          </div>
          <div class="card-body">
            <div class="order-summary-detail">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>{{ order.subtotal }}</span>
              </div>
              <div class="summary-row">
                <span>Shipping:</span>
                <span>{{ order.shipping }}</span>
              </div>
              <div class="summary-row total">
                <strong>Total:</strong>
                <strong>{{ order.total }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="detail-column-right">
        <div class="card">
          <div class="card-header">
            <h4>Order Status</h4>
          </div>
          <div class="card-body">
            <div class="status-group">
              <label>Payment Status:</label>
              <span 
                class="status-badge" 
                :class="order.payment === 'Paid' ? 'paid' : 'unpaid'"
              >
                {{ order.payment }}
              </span>
            </div>
            <div class="status-group">
              <label>Order Status:</label>
              <span 
                class="status-badge" 
                :class="getStatusClass(order.status)"
              >
                {{ order.status }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h4>Customer</h4>
          </div>
          <div class="card-body">
            <div class="customer-info-row">
              <i class="fas fa-user"></i>
              <span>{{ order.customer.name }}</span>
            </div>
            <div class="customer-info-row">
              <i class="fas fa-envelope"></i>
              <a :href="'mailto:' + order.customer.email">{{ order.customer.email }}</a>
            </div>
            <div class="customer-info-row">
              <i class="fas fa-phone"></i>
              <span>{{ order.customer.phone }}</span>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h4>Shipping Address</h4>
          </div>
          <div class="card-body">
            <address class="shipping-address">
              {{ order.shippingAddress.name }}<br>
              {{ order.shippingAddress.address }}<br>
              {{ order.shippingAddress.city }}
            </address>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute();
const orderId = ref(route.params.id);

// Hàm format tiền tệ VNĐ
const formatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

// Dữ liệu giả lập
const order = ref({
  id: '',
  items: [],
  customer: {},
  shippingAddress: {},
  subtotal: '0đ',
  shipping: '0đ',
  total: '0đ',
  payment: 'Unpaid',
  status: 'Pending'
});

onMounted(() => {
  // Giả lập tải data
  console.log("Fetching details for order ID:", orderId.value);
  order.value = {
    id: orderId.value,
    items: [
      { name: 'Bông Cải Xanh (Organic)', sku: 'HC001', qty: 2, price: formatter.format(50000), image: 'https://via.placeholder.com/60/27ae60/ffffff?text=V' },
      { name: 'Ức Gà Phi Lê', sku: 'HC002', qty: 1, price: formatter.format(150000), image: 'https://via.placeholder.com/60/f1c40f/ffffff?text=M' },
    ],
    customer: {
      name: 'Trần Văn An',
      email: 'tranvanan@example.com',
      phone: '0905 123 456'
    },
    shippingAddress: {
      name: 'Trần Văn An',
      address: '123 Đường ABC',
      city: 'Quận Hải Châu, Đà Nẵng'
    },
    subtotal: formatter.format(200000),
    shipping: formatter.format(50000),
    total: formatter.format(250000),
    payment: 'Paid',
    status: 'Shipping'
  };
});

// Hàm helper cho class
function getStatusClass(status) {
  if (status === 'Shipping') return 'shipping';
  if (status === 'Cancelled') return 'cancelled';
  if (status === 'Completed') return 'completed';
  return '';
}
</script>

<style scoped src="./OrderDetailView.css"></style>