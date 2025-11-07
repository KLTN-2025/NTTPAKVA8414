// src/stores/productCache.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProductCacheStore = defineStore('productCache', () => {
  const DEFAULT_TTL = 10 * 60 * 1000 // 10 minutes
  // products: { [product_id]: { selling_price, current_stock, ts } }
  const products = ref({})

  function updateProduct(productId, selling_price, current_stock) {
    if (!productId) 
      return
    products.value[String(productId)] = {
      selling_price: selling_price ?? null,
      current_stock: Number.isFinite(current_stock) ? current_stock : null,
      ts: Date.now()
    }
  }

  function bulkUpdate(arr) {
    // arr: [{ product_id, selling_price, current_stock }]
    if (!Array.isArray(arr)) return
    for (const p of arr) {
      if (!p || !p.product_id) continue
      updateProduct(p.product_id, p.selling_price ?? p.price ?? null, p.current_stock ?? null)
    }
  }

  function getProduct(productId, maxAge = DEFAULT_TTL) {
    if (!productId) return null
    const key = String(productId)
    const entry = products.value[key]
    if (!entry) return null
    if (Date.now() - entry.ts > maxAge) {
      // expired
      return null
    }
    // return shallow copy so callers can't accidentally mutate cache
    return { selling_price: entry.selling_price, current_stock: entry.current_stock, ts: entry.ts }
  }

  function getAllProducts() {
    // return a shallow copy
    return { ...products.value }
  }

  function removeProduct(productId) {
    if (!productId) return
    delete products.value[String(productId)]
  }

  function clearCache() {
    products.value = {}
  }

  return {
    updateProduct,
    bulkUpdate,
    getProduct,
    getAllProducts,
    removeProduct,
    clearCache,
    DEFAULT_TTL
  }
})
