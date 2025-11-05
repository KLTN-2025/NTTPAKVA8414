<template>
  <div class="cart-banner-container">
    <img src="@/assets/images/Breadcrumbs.png" alt="Shopping Cart Banner" class="cart-banner-img" />
    
    <div class="cart-breadcrumbs-container">
      <nav class="cart-breadcrumbs">
        <router-link to="/">Home</router-link>
        <i class="fas fa-chevron-right breadcrumb-separator"></i> 
        <strong>Shopping Cart</strong>
      </nav>
    </div>
  </div>

  <div class="cart-container">
    <h1 class="cart-title">My Shopping Cart</h1>

    <div class="cart-table-wrapper">
      <div class="cart-table-header">
        <span class="col-product">Product</span>
        <span class="col-price">Price</span>
        <span class="col-quantity">Quantity</span>
        <span class="col-subtotal">Subtotal</span>
      </div>

      <div v-if="cartItems.length > 0" class="cart-items-list">
        <div v-for="item in cartItems" :key="item.id" class="cart-item-row">
          
          <div class="col-product item-details">
            <img :src="item.image" :alt="item.name" class="item-image" />
            <span class="item-name">{{ item.name }}</span>
          </div>

          <div class="col-price item-price">
            ${{ item.price.toFixed(2) }}
          </div>

          <div class="col-quantity item-quantity">
            <button @click="updateQuantity(item.id, item.quantity - 1)" :disabled="item.quantity <= 1">-</button>
            <input type="text" :value="item.quantity" readonly />
            <button @click="updateQuantity(item.id, item.quantity + 1)">+</button>
          </div>

          <div class="col-subtotal item-subtotal">
            ${{ (item.price * item.quantity).toFixed(2) }}
          </div>

          <div class="col-remove">
            <button @click="removeItem(item.id)" class="remove-btn">×</button>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-cart">
        <p>Your cart is currently empty.</p>
        <router-link to="/products" class="continue-shopping-btn">Return to shop</router-link>
      </div>
    </div>

    <div class="cart-bottom-section">
      
      <div class="coupon-section">
        <h3>Coupon Code</h3>
        <div class="coupon-inputs">
          <input type="text" placeholder="Enter code" />
          <button class="apply-coupon-btn">Apply Coupon</button>
        </div>
      </div>

      <div class="cart-total-section">
        <h3>Cart Total</h3>
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>${{ subtotal.toFixed(2) }}</span>
        </div>
        <div class="summary-row">
          <span>Shipping:</span>
          <span>{{ shippingFee === 0 ? 'Free' : '$' + shippingFee.toFixed(2) }}</span>
        </div>
        <hr class="summary-divider" />
        <div class="summary-row total-row">
          <span>Total:</span>
          <span>${{ (subtotal + shippingFee).toFixed(2) }}</span>
        </div>
        <button
        @click="goToCheckout"
         class="proceed-btn" :disabled="cartItems.length === 0">
          Proceed to checkout
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router' // <-- 1. THÊM DÒNG NÀY
import '@fortawesome/fontawesome-free/css/all.min.css'; // <-- Bỏ comment để icon hiển thị

// --- DỮ LIỆU GIỎ HÀNG (GIẢ LẬP) ---
const cartItems = ref([
  {
    id: 1,
    name: 'Green Capsicum',
    image: 'https://via.placeholder.com/80x80/f0f0f0/333?text=Veg',
    price: 14.00,
    quantity: 5,
  },
  {
    id: 2,
    name: 'Red Capsicum',
    image: 'https://via.placeholder.com/80x80/f0f0f0/333?text=Veg',
    price: 14.00,
    quantity: 1,
  },
]);

const shippingFee = ref(0); // Giả lập phí ship là Free
const router = useRouter() // <-- 2. THÊM DÒNG NÀY

// --- CÁC HÀM TÍNH TOÁN (Computed) ---
const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// --- CÁC HÀM XỬ LÝ (Methods) ---
function updateQuantity(id, newQuantity) {
  if (newQuantity < 1) return;
  const item = cartItems.value.find(i => i.id === id);
  if (item) {
    item.quantity = newQuantity;
  }
}

function removeItem(id) {
  cartItems.value = cartItems.value.filter(i => i.id !== id);
}

// 3. THÊM HÀM NÀY
function goToCheckout() {
  if (cartItems.value.length > 0) {
    router.push('/checkout')
  }
}
</script>

<style scoped src="./Cart.css"></style>