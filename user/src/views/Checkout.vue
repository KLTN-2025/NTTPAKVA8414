<template>
  <div>
    <!-- Banner/Breadcrumb Section -->
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

      <form @submit.prevent="handleSubmit" class="checkout-layout">
        <!-- Left Column: Billing Form -->
        <div class="billing-details-column">
          <div class="form-row-grid">
            <div class="form-group">
              <label for="firstname">Last Name (Họ) *</label>
              <input type="text" id="firstname" v-model="form.lastName" required />
            </div>
            <div class="form-group">
              <label for="lastname">First Name (Tên) *</label>
              <input type="text" id="lastname" v-model="form.firstName" required />
            </div>
          </div>

          <div class="form-row-grid">
            <div class="form-group">
              <label for="email">Email Address</label>
              <input type="email" id="email" v-model="form.email"/>
            </div>
            <div class="form-group">
              <label for="phone">Phone *</label>
              <input type="tel" id="phone" pattern="(\+84|0)\d{9,10}" v-model="form.phone" required />
            </div>
          </div>

          <div class="form-group">
            <label for="address">Address *</label>
            <input
              type="text"
              id="address"
              v-model="form.address"
              placeholder="House number and street name"
              required
            />
          </div>

          <div class="form-group">
            <label for="city">City *</label>
            <input type="text" id="city" v-model="form.city" required />
          </div>

          <div class="form-group">
            <label for="notes">Notes (optional, max 500 characters)</label>
            <textarea
              id="notes"
              v-model="form.notes"
              placeholder="Notes about your order, e.g. special notes for delivery."
              maxlength="500"
            ></textarea>
          </div>
        </div>

        <!-- Right Column: Order Summary -->
        <div class="order-summary-column">
          <div class="order-summary-card">
            <h3>Your Order</h3>

            <div class="summary-row product-header">
              <span>Product</span>
              <span>Subtotal</span>
            </div>

            <!-- Cart Items -->
            <div
              v-for="item in cartItems"
              :key="item.productId"
              class="summary-row product-item-row"
            >
              <div class="product-info-checkout">
                <img :src="buildImagePath(item.image)" :alt="item.name" class="product-thumbnail" />
                <span class="product-name">{{ item.name }} × {{ item.quantity }}</span>
              </div>
              <span class="product-price">{{ formatPrice(item.price * item.quantity) }}</span>
            </div>

            <div class="summary-row">
              <span>Subtotal</span>
              <span>{{ formatPrice(subtotal) }}</span>
            </div>
            <div class="summary-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div class="summary-row total-row">
              <span>Total</span>
              <span>{{ formatPrice(subtotal) }}</span>
            </div>

            <!-- Payment Methods Section -->
            <div class="payment-methods">
              <h4 class="payment-title">Payment Method</h4>
              
              <!-- COD Option -->
              <div class="payment-option">
                <input
                  type="radio"
                  id="cod"
                  name="payment"
                  value="cod"
                  v-model="form.paymentMethod"
                />
                <label for="cod">
                  <i class="fas fa-truck payment-icon"></i>
                  Cash on Delivery (COD)
                </label>
                <p v-if="form.paymentMethod === 'cod'" class="payment-desc">
                  Pay with cash when your order is delivered to your doorstep.
                </p>
              </div>

              <!-- VNPay Option -->
              <div class="payment-option">
                <input
                  type="radio"
                  id="vnpay"
                  name="payment"
                  value="vnpay"
                  v-model="form.paymentMethod"
                />
                <label for="vnpay">
                  <img 
                    src="@/assets/images/vnpay.jpg" 
                    alt="VNPay" 
                    class="vnpay-logo"
                    onerror="this.style.display='none'"
                  />
                  VNPay
                </label>
                <div v-if="form.paymentMethod === 'vnpay'" class="payment-desc vnpay-desc">
                  <p>Pay securely via VNPay with:</p>
                  <ul class="vnpay-options">
                    <li><i class="fas fa-credit-card"></i> ATM Cards (Vietnamese Banks)</li>
                    <li><i class="fab fa-cc-visa"></i> Visa / Mastercard / JCB</li>
                    <li><i class="fas fa-qrcode"></i> VNPay QR Code</li>
                    <li><i class="fas fa-wallet"></i> VNPay Wallet</li>
                  </ul>
                  
                  <!-- Optional: Bank Selection -->
                  <div class="bank-selection" v-if="showBankSelection">
                    <label for="bankCode">Select Bank (optional):</label>
                    <select id="bankCode" v-model="form.bankCode">
                      <option value="">-- Choose at VNPay --</option>
                      <option value="NCB">NCB Bank</option>
                      <option value="VIETCOMBANK">Vietcombank</option>
                      <option value="VIETINBANK">VietinBank</option>
                      <option value="BIDV">BIDV</option>
                      <option value="AGRIBANK">Agribank</option>
                      <option value="TECHCOMBANK">Techcombank</option>
                      <option value="MBBANK">MB Bank</option>
                      <option value="VPBANK">VPBank</option>
                      <option value="TPBANK">TPBank</option>
                      <option value="SACOMBANK">Sacombank</option>
                      <option value="ACB">ACB</option>
                      <option value="VNPAYQR">VNPay QR</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="error-message">
              <i class="fas fa-exclamation-circle"></i>
              {{ errorMessage }}
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              class="place-order-btn" 
              :disabled="loading || cartItems.length === 0"
            >
              <span v-if="loading" class="btn-loading">
                <i class="fas fa-spinner fa-spin"></i>
                Processing...
              </span>
              <span v-else-if="form.paymentMethod === 'vnpay'">
                <i class="fas fa-lock"></i>
                Pay with VNPay
              </span>
              <span v-else>
                Place Order
              </span>
            </button>

            <!-- Security Notice for VNPay -->
            <p v-if="form.paymentMethod === 'vnpay'" class="security-notice">
              <i class="fas fa-shield-alt"></i>
              You will be redirected to VNPay's secure payment page.
            </p>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { buildImagePath, removeExtraSpaces, formatPrice } from '@/utilities/helper'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { useCartStore } from '@/stores/cartStore'
import axios from 'axios'
import { useAuth } from '@clerk/vue'
const { getToken } = useAuth()
const router = useRouter()
const cartStore = useCartStore()

// Form state
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  notes: '',
  paymentMethod: 'cod',
  bankCode: ''
})

const loading = ref(false)
const errorMessage = ref('')
const showBankSelection = ref(false)

const cartItems = computed(() => cartStore.items)
const subtotal = computed(() =>
  cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

function buildShippingDetails() {
  return {
    recipient_name: `${removeExtraSpaces(form.value.lastName)} ${removeExtraSpaces(form.value.firstName)}`,
    recipient_email: removeExtraSpaces(form.value.email) || '',
    recipient_phone: removeExtraSpaces(form.value.phone),
    shipping_address: `${removeExtraSpaces(form.value.address)}, ${removeExtraSpaces(form.value.city)}`,
    shipping_note: removeExtraSpaces(form.value.notes)
  }
}

function buildItemsArray() {
  return cartItems.value.map((i) => ({
    product_id: i.productId,
    quantity: i.quantity
  }))
}

async function handleSubmit() {
  if (cartItems.value.length === 0) {
    errorMessage.value = 'Your cart is empty.'
    return
  }

  errorMessage.value = ''
  loading.value = true

  try {
    if (form.value.paymentMethod === 'vnpay') {
      await processVnpayPayment()
    } else {
      await processCodOrder()
    }
  } catch (err) {
    console.error('Order failed:', err)
    errorMessage.value = err.response?.data?.message || 'Failed to process order. Please try again.'
  } finally {
    loading.value = false
  }
}

async function processCodOrder() {
  const payload = {
    shippingDetails: {
      ...buildShippingDetails(),
      payment_method: 'cod'
    },
    items: buildItemsArray()
  }

  const token = await getToken.value()
  const response = await axios.post('/api/orders', payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (response.data?.success){
    cartStore.clearCart()
    alert('Order placed successfully! Thank you for shopping with us.')
    router.push('/')
  }
}

async function processVnpayPayment() {
  const payload = {
    shippingDetails: buildShippingDetails(),
    items: buildItemsArray(),
    bankCode: form.value.bankCode || null,
    locale: 'vn'
  }

  const token = await getToken.value()
  const res = await axios.post('/api/vnpay/create-payment-url', payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  
  if (res.data.success && res.data.paymentUrl) {
    sessionStorage.setItem('pendingOrderId', res.data.orderId)
    sessionStorage.setItem('pendingTxnRef', res.data.txnRef)
    cartStore.clearCart() 
    window.location.href = res.data.paymentUrl
  } else {
    throw new Error(res.data.message || 'Failed to create payment URL')
  }
}
</script>

<style scoped src="../styling/Checkout.css"></style>