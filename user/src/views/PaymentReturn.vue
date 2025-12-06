<template>
  <div class="payment-result-page">
    <!-- Banner -->
    <div class="cart-banner-container">
      <img src="@/assets/images/Breadcrumbs.png" alt="Payment Result" class="cart-banner-img" />
      <div class="cart-breadcrumbs-container">
        <nav class="cart-breadcrumbs">
          <router-link to="/">Home</router-link>
          <i class="fas fa-chevron-right breadcrumb-separator"></i>
          <strong>Payment Result</strong>
        </nav>
      </div>
    </div>

    <div class="result-container">
      <!-- Loading State -->
      <div v-if="loading" class="result-card loading-state">
        <div class="spinner"></div>
        <h2>Verifying Payment...</h2>
        <p>Please wait while we confirm your payment with VNPay.</p>
      </div>

      <!-- Success State -->
      <div v-else-if="paymentSuccess" class="result-card success-state">
        <div class="result-icon success">
          <i class="fas fa-check-circle"></i>
        </div>
        <h1>Payment Successful!</h1>
        <p class="result-message">Thank you for your purchase. Your order has been confirmed.</p>
        
        <div class="order-details">
          <div class="detail-row">
            <span class="label">Order ID:</span>
            <span class="value">#{{ paymentData.orderId }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Transaction No:</span>
            <span class="value">{{ paymentData.transactionNo }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Amount Paid:</span>
            <span class="value amount">{{ formatPrice(paymentData.amount) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Bank:</span>
            <span class="value">{{ paymentData.bankCode }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Payment Date:</span>
            <span class="value">{{ formatPaymentDate(paymentData.payDate) }}</span>
          </div>
        </div>

        <div class="result-actions">
          <router-link to="/orders" class="btn btn-primary">
            <i class="fas fa-list"></i>
            View My Orders
          </router-link>
          <router-link to="/" class="btn btn-secondary">
            <i class="fas fa-home"></i>
            Continue Shopping
          </router-link>
        </div>
      </div>

      <!-- Failed State -->
      <div v-else-if="paymentFailed" class="result-card failed-state">
        <div class="result-icon failed">
          <i class="fas fa-times-circle"></i>
        </div>
        <h1>Payment Failed</h1>
        <p class="result-message">{{ errorMessage }}</p>
        
        <div class="error-details" v-if="paymentData.orderId">
          <div class="detail-row">
            <span class="label">Order ID:</span>
            <span class="value">#{{ paymentData.orderId }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Error Code:</span>
            <span class="value error-code">{{ paymentData.code }}</span>
          </div>
        </div>

        <div class="result-actions">
          <button @click="retryPayment" class="btn btn-primary" :disabled="retrying">
            <i class="fas fa-redo" :class="{ 'fa-spin': retrying }"></i>
            {{ retrying ? 'Processing...' : 'Try Again' }}
          </button>
          <router-link to="/cart" class="btn btn-secondary">
            <i class="fas fa-shopping-cart"></i>
            Back to Cart
          </router-link>
        </div>

        <p class="help-text">
          <i class="fas fa-info-circle"></i>
          If you continue to experience issues, please contact our support team.
        </p>
      </div>

      <!-- Cancelled State -->
      <div v-else-if="paymentCancelled" class="result-card cancelled-state">
        <div class="result-icon cancelled">
          <i class="fas fa-ban"></i>
        </div>
        <h1>Payment Cancelled</h1>
        <p class="result-message">You have cancelled the payment process.</p>
        
        <div class="result-actions">
          <button @click="retryPayment" class="btn btn-primary" :disabled="retrying">
            <i class="fas fa-credit-card"></i>
            {{ retrying ? 'Processing...' : 'Pay Now' }}
          </button>
          <router-link to="/" class="btn btn-secondary">
            <i class="fas fa-home"></i>
            Back to Home
          </router-link>
        </div>
      </div>

      <!-- Error State (verification failed) -->
      <div v-else class="result-card error-state">
        <div class="result-icon error">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h1>Something Went Wrong</h1>
        <p class="result-message">{{ errorMessage || 'Unable to verify payment status.' }}</p>
        
        <div class="result-actions">
          <router-link to="/orders" class="btn btn-primary">
            <i class="fas fa-list"></i>
            Check My Orders
          </router-link>
          <router-link to="/" class="btn btn-secondary">
            <i class="fas fa-home"></i>
            Back to Home
          </router-link>
        </div>

        <p class="help-text">
          <i class="fas fa-info-circle"></i>
          Your payment may still be processing. Please check your orders or contact support.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { formatPrice } from '@/utilities/helper'

const route = useRoute()
const router = useRouter()

// State
const loading = ref(true)
const paymentSuccess = ref(false)
const paymentFailed = ref(false)
const paymentCancelled = ref(false)
const errorMessage = ref('')
const retrying = ref(false)

const paymentData = ref({
  orderId: '',
  txnRef: '',
  transactionNo: '',
  amount: 0,
  bankCode: '',
  payDate: '',
  code: ''
})

// Format VNPay date (yyyyMMddHHmmss -> readable format)
function formatPaymentDate(vnpayDate) {
  if (!vnpayDate || vnpayDate.length !== 14) return vnpayDate
  
  const year = vnpayDate.substring(0, 4)
  const month = vnpayDate.substring(4, 6)
  const day = vnpayDate.substring(6, 8)
  const hour = vnpayDate.substring(8, 10)
  const minute = vnpayDate.substring(10, 12)
  const second = vnpayDate.substring(12, 14)
  
  return `${day}/${month}/${year} ${hour}:${minute}:${second}`
}

// Verify payment on mount
async function verifyPayment() {
  try {
    loading.value = true
    
    // Get query parameters from VNPay redirect
    const queryParams = route.query
    
    // Check if we have VNPay parameters
    if (!queryParams.vnp_ResponseCode) {
      // No VNPay params - check if we have stored order info
      const pendingOrderId = sessionStorage.getItem('pendingOrderId')
      if (pendingOrderId) {
        // Check order status
        const statusRes = await axios.get(`/api/vnpay/check-status/${pendingOrderId}`)
        if (statusRes.data.success) {
          paymentData.value.orderId = pendingOrderId
          if (statusRes.data.data.paymentStatus === 'paid') {
            paymentSuccess.value = true
          } else {
            paymentFailed.value = true
            errorMessage.value = 'Payment was not completed.'
          }
        }
      } else {
        errorMessage.value = 'No payment information found.'
      }
      return
    }

    // Build query string from route query for verification
    const queryString = new URLSearchParams(queryParams).toString()
    
    // Call backend to verify payment
    const response = await axios.get(`/api/vnpay/vnpay-return?${queryString}`)
    
    if (response.data.success) {
      // Payment successful
      paymentSuccess.value = true
      paymentData.value = {
        orderId: response.data.data.orderId,
        txnRef: response.data.data.txnRef,
        transactionNo: response.data.data.transactionNo,
        amount: response.data.data.amount,
        bankCode: response.data.data.bankCode,
        payDate: response.data.data.payDate,
        code: response.data.code
      }
      
      // Clear stored order info
      sessionStorage.removeItem('pendingOrderId')
      sessionStorage.removeItem('pendingTxnRef')
      
    } else {
      // Payment failed
      const code = response.data.code
      
      if (code === '24') {
        // User cancelled
        paymentCancelled.value = true
      } else {
        paymentFailed.value = true
      }
      
      errorMessage.value = response.data.message
      paymentData.value = {
        orderId: response.data.data?.orderId || sessionStorage.getItem('pendingOrderId'),
        code: code
      }
    }
    
  } catch (error) {
    console.error('Payment verification error:', error)
    errorMessage.value = error.response?.data?.message || 'Failed to verify payment status.'
    paymentData.value.orderId = sessionStorage.getItem('pendingOrderId') || ''
  } finally {
    loading.value = false
  }
}

// Retry payment
async function retryPayment() {
  const orderId = paymentData.value.orderId || sessionStorage.getItem('pendingOrderId')
  
  if (!orderId) {
    router.push('/cart')
    return
  }
  
  try {
    retrying.value = true
    
    const response = await axios.post(`/api/vnpay/retry-payment/${orderId}`)
    
    if (response.data.success && response.data.paymentUrl) {
      // Store new txn ref
      sessionStorage.setItem('pendingOrderId', response.data.orderId)
      sessionStorage.setItem('pendingTxnRef', response.data.txnRef)
      
      // Redirect to VNPay
      window.location.href = response.data.paymentUrl
    } else {
      errorMessage.value = response.data.message || 'Failed to generate payment link.'
      retrying.value = false
    }
    
  } catch (error) {
    console.error('Retry payment error:', error)
    errorMessage.value = error.response?.data?.message || 'Failed to retry payment.'
    retrying.value = false
  }
}

// On mount
onMounted(() => {
  verifyPayment()
})
</script>

<style scoped src="../styling/PaymentReturn.css"></style>
