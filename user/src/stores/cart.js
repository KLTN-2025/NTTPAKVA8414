// /src/stores/useCartStore.js
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import { useSession, useUser } from '@clerk/vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([]) 

  // --- Getters (computed) ---
  const itemCount = computed(() => items.value.reduce((acc, item) => acc + item.quantity, 0))
  const totalPrice = computed(() =>
    items.value.reduce((acc, item) => acc + item.price * item.quantity, 0)
  )

  // --- Actions ---
  const addToCart = (product, quantity = 1) => {
    const existing = items.value.find(i => i.productId === product._id)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image || '',
        quantity
      })
    }
  }

  const removeFromCart = (productId) => {
    items.value = items.value.filter(i => i.productId !== productId)
  }

  const updateQuantity = (productId, quantity) => {
    const item = items.value.find(i => i.productId === productId)
    if (item) item.quantity = quantity
  }

  const clearCart = () => {
    items.value = []
  }

  // --- Sync with Backend (for members only) ---
  const syncCartToServer = async (token) => {
    try {
      await axios.post('/api/cart/merge', { items: items.value }, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (err) {
      console.error('Cart sync failed:', err)
    }
  }

  const loadCartFromServer = async (token) => {
    try {
      const res = await axios.get('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      })
      items.value = res.data.items || []
    } catch (err) {
      console.error('Load cart failed:', err)
    }
  }

  // --- Local Storage Persistence (for guests) ---
  const saveToLocal = () => {
    localStorage.setItem('cart', JSON.stringify(items.value))
  }

  const loadFromLocal = () => {
    const stored = localStorage.getItem('cart')
    if (stored) items.value = JSON.parse(stored)
  }

  watch(items, saveToLocal, { deep: true })

  // Load existing cart when store initializes
  loadFromLocal()

  return {
    items,
    itemCount,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    syncCartToServer,
    loadCartFromServer,
  }
})
