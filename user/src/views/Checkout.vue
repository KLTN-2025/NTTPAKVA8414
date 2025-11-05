<template>
  <div class="cart-banner-container">
    <img src="@/assets/images/Breadcrumbs.png" alt="Checkout Banner" class="cart-banner-img" />
    
    <div class="cart-breadcrumbs-container">
      <nav class="cart-breadcrumbs">
        <router-link to="/">Home</router-link>
        <i class="fas fa-chevron-right breadcrumb-separator"></i> 
        <router-link to="/cart">Cart</router-link>
        <i class="fas fa-chevron-right breadcrumb-separator"></i> 
        <strong>Checkout</strong>
      </nav>
    </div>
  </div>

  <div class="checkout-container">
    <h1 class="checkout-title">Billing Details</h1>

    <form @submit.prevent="placeOrder" class="checkout-layout">

      <div class="billing-details-column">
        
        <div class="form-row-grid">
          <div class="form-group">
            <label for="firstname">First Name *</label>
            <input type="text" id="firstname" v-model="form.firstName" required />
          </div>
          <div class="form-group">
            <label for="lastname">Last Name *</label>
            <input type="text" id="lastname" v-model="form.lastName" required />
          </div>
        </div>

        <div class="form-row-grid">
          <div class="form-group">
            <label for="email">Email Address *</label>
            <input type="email" id="email" v-model="form.email" required />
          </div>
          <div class="form-group">
            <label for="phone">Phone *</label>
            <input type="tel" id="phone" v-model="form.phone" required />
          </div>
        </div>

        <div class="form-group">
          <label for="address">Street Address *</label>
          <input type="text" id="address" v-model="form.address" placeholder="House number and street name" required />
        </div>

        <div class="form-group">
          <label for="city">Town / City *</label>
          <input type="text" id="city" v-model="form.city" required />
        </div>

        <div class="form-group">
          <label for="notes">Order notes (optional)</label>
          <textarea id="notes" v-model="form.notes" placeholder="Notes about your order, e.g. special notes for delivery."></textarea>
        </div>
      </div>

      <div class="order-summary-column">
        <div class="order-summary-card">
          <h3>Your Order</h3>
          
          <div class="summary-row product-header">
            <span>Product</span>
            <span>Subtotal</span>
          </div>

          <div v-for="item in orderItems" :key="item.id" class="summary-row product-item-row">
            <div class="product-info-checkout">
              <img :src="item.image" :alt="item.name" class="product-thumbnail" />
              <span class="product-name">{{ item.name }} × {{ item.quantity }}</span>
            </div>
            <span class="product-price">${{ (item.price * item.quantity).toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>Subtotal</span>
            <span>${{ subtotal.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div class="summary-row total-row">
            <span>Total</span>
            <span>${{ subtotal.toFixed(2) }}</span>
          </div>

          <div class="payment-methods">
            <div class="payment-option">
              <input type="radio" id="cod" name="payment" value="cod" v-model="form.paymentMethod" checked />
              <label for="cod">Cash on delivery (COD)</label>
              <p class="payment-desc">Pay with cash upon delivery.</p>
            </div>
            <div class="payment-option">
              <input type="radio" id="bank" name="payment" value="bank" v-model="form.paymentMethod" />
              <label for="bank">Direct bank transfer</label>
            </div>
          </div>

          <button type="submit" class="place-order-btn">
            Place Order
          </button>
        </div>
      </div>

    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useRouter } from 'vue-router'

// --- DỮ LIỆU GIẢ LẬP ĐÃ CẬP NHẬT THÊM TRƯỜNG 'image' ---
const orderItems = ref([
  { id: 1, name: 'Green Capsicum', image: 'https://via.placeholder.com/40x40/f0f0f0/333?text=VC1', price: 14.00, quantity: 5 },
  { id: 2, name: 'Red Capsicum', image: 'https://via.placeholder.com/40x40/f0f0f0/333?text=VC2', price: 14.00, quantity: 1 },
]);

// Dữ liệu Form (giữ nguyên)
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  notes: '',
  paymentMethod: 'cod'
});

const router = useRouter()

// Tính toán
const subtotal = computed(() => {
  return orderItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// Hàm xử lý
function placeOrder() {
  console.log("Order Data Submitted:", {
    billingDetails: form.value,
    items: orderItems.value,
    total: subtotal.value
  });
  
  router.push('/thank-you'); 
}
</script>

<style scoped src="./Checkout.css"></style>