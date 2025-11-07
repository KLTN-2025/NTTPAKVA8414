// src/stores/cartStore.js
import { defineStore } from 'pinia'
import { ref, computed, watch, hydrate } from 'vue'
import axios from 'axios'
import { useProductCacheStore } from './productCacheStore'
import { useAuth } from '@clerk/vue'
import { useToast } from 'vue-toastification'
const toast = useToast()

export const useCartStore = defineStore('cart', () => {
  const MAX_CART_SIZE = 10  // Prevent server overloading
  const LOCAL_KEY = 'HealthyCraveCart' 
  const items = ref([])     // [{ product_id, name, price, image, quantity }]

  const productCache = useProductCacheStore()

  const itemCount = computed(() => items.value.reduce((acc, it) => acc + (it.quantity || 0), 0))
  const totalPrice = computed(() => {
    return items.value.reduce((acc, it) => {
      const cached = productCache.getProduct(it.productId)
      const price = (it.price ?? cached?.selling_price) ?? 0
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
    const id = product._id ?? product.id
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

    const price = product.selling_price ?? product.price ?? null
    items.value.push({
      productId: String(id),
      name: product.name ?? null,
      price,
      image: product.images[0] ?? '',
      quantity: qty
    })
    toast.success(`Add new item to cart!\n${items.value.length}/${MAX_CART_SIZE} items`)

    if (price !== null || Number.isFinite(product.stock)) {
      productCache.updateProduct(id, price, product.stock)
    }
    return true
  }

  function removeFromCart(productId) {
    items.value = items.value.filter(i => String(i.productId) !== String(productId))
    toast.success(`Drop item from cart!\n${items.value.length}/${MAX_CART_SIZE} items`)
  }

  function updateQuantity(productId, quantity) {
    const q = validateQuantity(quantity)
    const stock = productCache.getProduct(productId).current_stock
    if (q === null) {
      removeFromCart(productId)
      return false
    }
    const idx = findIndex(productId)
    if (idx === -1) 
      return false
    
    if (q <= stock){
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
    localStorage.removeItem(LOCAL_KEY)
  }

  // --- Sync with Backend (for members only) ---
  async function syncCartToServer() {
    try {
      const { getToken, isLoaded, isSignedIn } = useAuth()
      if (isLoaded && isSignedIn){
        const token = await getToken.value()
        const res = await axios.post('/api/cart/sync', { items: items.value }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        return { success: true, data: res.data }
      }
      else {
        return { success: false, message: 'User not logged in' }
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

  // --- Local Storage Persistence (for guests) ---
  function saveToLocal() {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(items.value))
    } catch (e) {
      console.error('saveToLocal failed', e)
    }
  }

  function loadFromLocal() {
    try {
      const stored = localStorage.getItem(LOCAL_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) return
      // merge duplicates and sanitize
      const map = new Map()
      for (const it of parsed) {
        const id = String(it.productId ?? it.product_id ?? it._id)
        const qty = validateQuantity(it.quantity) ?? 0
        if (!id || qty <= 0) continue
        map.set(id, (map.get(id) || 0) + qty)
      }
      const arr = []
      for (const [id, qty] of map.entries()) {
        if (arr.length >= MAX_CART_SIZE) break
        arr.push({ productId: id, name: null, price: null, image: '', quantity: qty })
      }
      items.value = arr
    } catch (e) {
      console.error('loadFromLocal failed', e)
    }
  }

  async function hydrateLocalItems() {
    for (const item of items.value) {
      const cached = productCache.getProduct(item.productId)
      if (cached) {
        if (!item.name) item.name = cached.name ?? cached.title ?? ''
        if (!item.price) item.price = cached.selling_price ?? cached.price ?? 0
        if (!item.image) item.image = cached.images?.[0] ?? ''
        continue
      }

      // Fallback: fetch from API if cache is empty
      try {
        const res = await axios.get(`/api/products/${item.productId}`)
        const data = res.data
        item.name = data.name ?? data.title ?? ''
        item.price = data.selling_price ?? data.price ?? 0
        item.image = data.images?.[0] ?? ''
        productCache.updateProduct(item.productId, item.price, data.current_stock)
      } catch (e) {
        console.error('hydrateLocalItems: failed to fetch', item.productId, e)
      }
    }
  }

  watch(items, saveToLocal, { deep: true })
  loadFromLocal()
  hydrateLocalItems()

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
    loadFromLocal,
    saveToLocal,
    hydrateLocalItems
  }
})
