// src/stores/cartStore.js
import { defineStore } from 'pinia'
import { ref, computed, watch, hydrate } from 'vue'
import axios from 'axios'
import { useAuth } from '@clerk/vue'
import { useToast } from 'vue-toastification'
import { buildImagePath } from '@/utilities/helper'

const toast = useToast()

export const useCartStore = defineStore('cart', () => {
  const MAX_CART_SIZE = 10  // Prevent server overloading
  const items = ref([])     // [{ productId, name, price, image, stock, quantity }]
  const { getToken, isLoaded, isSignedIn } = useAuth()

  const itemCount = computed(() => items.value.reduce((acc, it) => acc + (it.quantity || 0), 0))
  const totalPrice = computed(() => {
    return items.value.reduce((acc, it) => {
      return acc + price * (it.quantity || 0)
    }, 0)
  })

  function findIndex(productId) {
    return items.value.findIndex(i => String(i.productId) === String(productId))
  }

  function validateQuantity(q) {
    q = Number(q)
    if (!Number.isInteger(q) || q <= 0) return null
    return q
  }

  function addItemToCart(product, quantity = 1) {
    if (!product || !(product._id || product.id)) return false
    const id = product._id
    const idx = findIndex(id)
    const qty = validateQuantity(quantity) ?? 1
    if (idx >= 0) {
      if (items.value[idx].quantity + qty <= product.stock){
        items.value[idx].quantity = items.value[idx].quantity + qty
        toast.success('Item quantity updated!')
        return true
      }
      else {
        toast.error('Stock exceeded, can\'t increase quantity!')
        return false
      }
    }

    if (items.value.length >= MAX_CART_SIZE) {
      toast.warning(`You have reached max cart size (${MAX_CART_SIZE} items)`)
      return false
    }

    items.value.push({
      productId: id,
      name: product.name ?? null,
      price: product.price,
      stock: product.stock,
      image: product.images[0] ? buildImagePath(product.images[0]) : '',
      quantity: qty
    })
    toast.success(`Add new item to cart!\n${items.value.length}/${MAX_CART_SIZE} items`)
    return true
  }

  function removeFromCart(productId) {
    items.value = items.value.filter(i => String(i.productId) !== String(productId))
    toast.success(`Drop item from cart!\n${items.value.length}/${MAX_CART_SIZE} items`)
  }

  function updateQuantity(productId, quantity) {
    const q = validateQuantity(quantity)
    if (q === null) {
      removeFromCart(productId)
      return false
    }
    const idx = findIndex(productId)
    if (idx === -1) 
      return false
    
    if (q <= items.value[idx].stock){
      items.value[idx].quantity = q
      toast.success('Item quantity updated!')
      return true
    }
    else {
      toast.error('Stock exceeded, can\'t increase quantity!')
      return false
    }
  }

  function clearCart() {
    items.value = []
  }

  // --- Sync with Backend (for members only) ---
  async function syncCartToServer() {
    try {
      if (isLoaded && isSignedIn){
        console.log('Detect sign-in, performing sync...')

        const token = await getToken.value()
        const mappedItems = items.value.map(item => { return {
              productId: item.productId,
              quantity: item.quantity
            }
          }) || null
        const res = await axios.post('/api/cart/sync', 
          { 
            guestItems: mappedItems,
            overrideRemoteCart: true
          }, 
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
        console.log('Finished syncing')
        return true
      }
      else {
        console.log('No sync performed')
        return false
      }
    } catch (err) {
      console.error('Cart sync failed:', err)
      return { success: false, error: err }
    }
  }

  async function loadCartFromServer() {
    try {
      const { getToken, isLoaded, isSignedIn } = useAuth()
      if (isLoaded && isSignedIn){
        const token = await getToken.value()
        const res = await axios.get('/api/cart/get', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
      
        const serverItems = Array.isArray(res.data?.items) ? res.data.items : []
        // normalize server items to our shape and merge duplicates
        const normalized = []
        const seen = new Map()
        for (const it of serverItems) {
          const id = String(it.productId ?? it.product_id ?? it._id)
          const qty = validateQuantity(it.quantity) ?? 0
          if (!id || qty <= 0) continue
          if (seen.has(id)) {
            seen.set(id, seen.get(id) + qty)
          } else seen.set(id, qty)

          const name = it.name ?? it.title ?? null
          const price = it.price ?? it.selling_price ?? null
          const image = it.image ?? ''
          normalized.push({ productId: id, name, price, image, quantity: qty })
        }
        // rebuild items by seen map to ensure unique entries and respect MAX_CART_SIZE
        const merged = []
        for (const [id, qty] of seen.entries()) {
          if (merged.length >= MAX_CART_SIZE) break
          const sample = normalized.find(n => n.productId === id) || {}
          merged.push({ productId: id, name: sample.name ?? null, price: sample.price ?? null, image: sample.image ?? '', quantity: qty })
        }
        items.value = merged
        return { success: true }
      }
    } catch (err) {
      console.error('Load cart failed:', err)
      return { success: false, error: err }
    }
  }

  async function refetchFromServer() {
    try {
      const ids = items.value.map(item => item.productId)
      if (ids.length > 0){
        const response = await axios.post('/api/products/bulk-fetch', { productIds: ids })
        if (response.data?.success){
          const updatedProducts = response.data?.products
          const updatedIdsList = updatedProducts.map(p => p.productId)

          items.value = items.value.filter(item => updatedIdsList.includes(item.productId))
          
          updatedProducts.forEach(uProd => {
            const idx = findIndex(uProd.productId)
            items.value[idx] = {
              ...uProd, 
              quantity: Math.min(items.value[idx].quantity, uProd.stock)
            }
          });
        }
      }
    } catch (err) {
      console.error('Error fetching updated product data')
    }
  }

  watch(isSignedIn, async (newStatus, _) => {
    if (!newStatus.value) {
      //syncCartToServer()
      clearCart()
    }
    else {
      //
    }
  })

  return {
    items,
    itemCount,
    totalPrice,
    addItemToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    syncCartToServer,
    loadCartFromServer,
    refetchFromServer
  }
}, {
  persist: {
    storage: localStorage 
  }
})
