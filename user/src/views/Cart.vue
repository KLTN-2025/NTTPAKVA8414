<template>
  <div>
    <div class="cart-banner-container">
      <img
        src="@/assets/images/Breadcrumbs.png"
        alt="Shopping Cart Banner"
        class="cart-banner-img"
      />

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

        <div v-if="cartStore.items.length > 0" class="cart-items-list">
          <div
            v-for="item in cartStore.items"
            :key="item.productId"
            class="cart-item-row"
          >
            <div class="col-product item-details">
              <img :src="item.image" :alt="item.name" class="item-image" />
              <span class="item-name">{{ item.name }}</span>
            </div>

            <div class="col-price item-price">
              {{ item.price }}đ
            </div>

            <div class="col-quantity item-quantity">
              <button
                @click="updateQuantity(item.productId, item.quantity - 1)"
                :disabled="item.quantity <= 1"
              >
                -
              </button>
              <input type="text" :value="item.quantity" readonly />
              <button
                @click="updateQuantity(item.productId, item.quantity + 1)"
              >
                +
              </button>
            </div>

            <div class="col-subtotal item-subtotal">
              {{ item.price * item.quantity }}đ
            </div>

            <div class="col-remove">
              <button
                @click="removeItem(item.productId)"
                class="remove-btn"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-cart">
          <p>Your cart is currently empty.</p>
          <router-link to="/products" class="continue-shopping-btn">
            Return to shop
          </router-link>
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
            <span>{{ subtotal }}đ</span>
          </div>
          <div class="summary-row">
            <span>Shipping:</span>
            <span>{{ shippingFee === 0 ? 'Free' : shippingFee + 'đ' }}</span>
          </div>
          <hr class="summary-divider" />
          <div class="summary-row total-row">
            <span>Total:</span>
            <span>{{ subtotal + shippingFee }}đ</span>
          </div>
          <button
            @click="goToCheckout"
            class="proceed-btn"
            :disabled="cartStore.items.length === 0"
          >
            Proceed to checkout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { useCartStore } from '@/stores/cartStore'

const cartStore = useCartStore()
const router = useRouter()

const shippingFee = 0

const subtotal = computed(() =>
  cartStore.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

function updateQuantity(productId, newQuantity) {
  if (newQuantity >= 1) cartStore.updateQuantity(productId, newQuantity)
}

function removeItem(productId) {
  cartStore.removeFromCart(productId)
}

function goToCheckout() {
  if (cartStore.items.length > 0) router.push('/checkout')
}

onMounted(() => {
  console.clear()
  console.log(JSON.stringify(cartStore.items))
})
</script>

<style scoped src="./Cart.css"></style>
