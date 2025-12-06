<template>
  <div class="supply-order-form-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <button @click="goBack" class="back-link">
          <i class="fas fa-arrow-left"></i>
          Back
        </button>
        <h1>{{ isEditing ? 'Edit Supply Order' : 'Create Supply Order' }}</h1>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pageLoading" class="page-loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading...</span>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="order-form">
      <!-- Order Info Section -->
      <div class="form-section">
        <h2>Order Information</h2>
        
        <div class="form-row">
          <div class="form-group">
            <label>Supplier <span class="required">*</span></label>
            <select 
              v-model="form.supplier_id" 
              :disabled="isSupplierLocked"
              required
            >
              <option value="">Select a supplier</option>
              <option 
                v-for="supplier in suppliers" 
                :key="supplier._id" 
                :value="supplier._id"
              >
                {{ supplier.name }}
              </option>
            </select>
            <span v-if="isSupplierLocked" class="field-hint">
              Supplier cannot be changed for existing orders
            </span>
          </div>

          <div class="form-group">
            <label>Expected Arrival <span class="required">*</span></label>
            <input 
              type="date" 
              v-model="form.expected_arrival"
              :min="minDate"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label>Notes</label>
          <textarea 
            v-model="form.notes"
            placeholder="Add any notes for this order..."
            rows="3"
            maxlength="1000"
          ></textarea>
        </div>
      </div>

      <!-- Order Items Section -->
      <div class="form-section">
        <h2>Order Items</h2>

        <!-- Product Search -->
        <div class="product-search-section">
          <label>Add Product</label>
          <ProductSearchDropdown
            :exclude-ids="addedProductIds"
            @select="addProduct"
          />
        </div>

        <!-- Items Table -->
        <div class="items-table-container">
          <table v-if="form.items.length > 0" class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th class="col-number">Quantity</th>
                <th class="col-number">Unit Cost</th>
                <th class="col-number">Subtotal</th>
                <th class="col-action"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in form.items" :key="item.product_id">
                <td>
                  <span class="product-name">{{ item.product_name }}</span>
                </td>
                <td>
                  <span class="product-sku">{{ item.product_sku }}</span>
                </td>
                <td class="col-number">
                  <input 
                    type="number"
                    v-model.number="item.quantity_ordered"
                    min="1"
                    class="input-number"
                    @input="validateQuantity(index)"
                  />
                </td>
                <td class="col-number">
                  <div class="input-with-prefix">
                    <input 
                      type="number"
                      v-model.number="item.unit_cost"
                      min="0"
                      step="1000"
                      class="input-number"
                    />
                  </div>
                </td>
                <td class="col-number">
                  <span class="subtotal">{{ formatPrice(item.quantity_ordered * item.unit_cost) }}</span>
                </td>
                <td class="col-action">
                  <button 
                    type="button"
                    class="btn-remove"
                    @click="removeProduct(index)"
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-else class="empty-items">
            <i class="fas fa-box-open"></i>
            <span>No items added. Search and add products above.</span>
          </div>
        </div>

        <!-- Total -->
        <div v-if="form.items.length > 0" class="order-total">
          <span class="total-label">Total Cost:</span>
          <span class="total-value">{{ formatPrice(totalCost) }}</span>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="goBack">
          Cancel
        </button>
        <button 
          type="submit" 
          class="btn btn-primary"
          :disabled="!isFormValid || submitting"
        >
          <span v-if="submitting">Saving...</span>
          <span v-else>{{ isEditing ? 'Update Order' : 'Save as Draft' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuth } from '@clerk/vue'
import axios from 'axios'
import { formatPrice } from '@/utilities/helper'
import ProductSearchDropdown from '@/components/ProductSearchDropdown.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { getToken } = useAuth()

const orderId = computed(() => route.params.id)
const isEditing = computed(() => !!orderId.value)
const prefilledSupplierId = computed(() => route.query.supplierId)

// Data
const suppliers = ref([])
const pageLoading = ref(false)
const submitting = ref(false)

// Form
const form = reactive({
  supplier_id: '',
  expected_arrival: '',
  notes: '',
  items: []
})

const isSupplierLocked = computed(() => isEditing.value)

const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const addedProductIds = computed(() => form.items.map(item => item.product_id))

const totalCost = computed(() => {
  return form.items.reduce((sum, item) => {
    return sum + (item.quantity_ordered * item.unit_cost)
  }, 0)
})

const isFormValid = computed(() => {
  return form.supplier_id && 
         form.expected_arrival && 
         form.items.length > 0 &&
         form.items.every(item => item.quantity_ordered >= 1 && item.unit_cost >= 0)
})

async function fetchSuppliers() {
  try {
    const token = await getToken.value()
    const response = await axios.get('/api/admin/suppliers', {
        headers: {
            Authorization: `Bearer ${token}`
        },
        params: { limit: 100 }
    })
    if (response.data?.success) {
      suppliers.value = response.data.data
    }
  } catch (err) {
    toast.error('Failed to load suppliers')
  }
}

// Fetch existing order for editing
async function fetchOrder() {
  if (!orderId.value) return

  pageLoading.value = true
  try {
    const token = await getToken.value()
    const response = await axios.get(`/api/admin/supply-orders/${orderId.value}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    
    if (response.data?.success) {
      const order = response.data.data
      
      // Check if order can be edited
      if (order.status !== 'Draft') {
        toast.error('Only draft orders can be edited')
        router.push({ name: 'admin-supply-order-view', params: { id: orderId.value } })
        return
      }

      // Populate form
      form.supplier_id = order.supplier_id?._id || order.supplier_id
      form.expected_arrival = order.expected_arrival 
        ? new Date(order.expected_arrival).toISOString().split('T')[0] 
        : ''
      form.notes = order.notes || ''
      
      // Map items
      form.items = order.items.map(item => ({
        product_id: item.product_id?._id || item.product_id,
        product_name: item.product_id?.name || 'Unknown Product',
        product_sku: item.product_id?.SKU || 'N/A',
        quantity_ordered: item.quantity_ordered,
        unit_cost: item.unit_cost
      }))
    }
  } catch (err) {
    toast.error('Failed to load order')
    router.push('/admin/suppliers')
  } finally {
    pageLoading.value = false
  }
}

// Add product from search
function addProduct(product) {
  form.items.push({
    product_id: product._id,
    product_name: product.name,
    product_sku: product.SKU,
    quantity_ordered: 1,
    unit_cost: product.cost_price || 0
  })
}

// Remove product
function removeProduct(index) {
  form.items.splice(index, 1)
}

// Validate quantity
function validateQuantity(index) {
  if (form.items[index].quantity_ordered < 1) {
    form.items[index].quantity_ordered = 1
  }
}

// Submit form
async function handleSubmit() {
  if (!isFormValid.value) return

  submitting.value = true
  try {
    const payload = {
      supplier_id: form.supplier_id,
      expected_arrival: form.expected_arrival,
      notes: form.notes,
      items: form.items.map(item => ({
        product_id: item.product_id,
        quantity_ordered: item.quantity_ordered,
        unit_cost: item.unit_cost
      }))
    }

    let response
    const token = await getToken.value()
    if (isEditing.value) {
      response = await axios.put(`/api/admin/supply-orders/${orderId.value}`, payload, {
        headers: {
        Authorization: `Bearer ${token}`
      }
    })
    } else {
      response = await axios.post('/api/admin/supply-orders', payload, {
        headers: {
            Authorization: `Bearer ${token}`
        }
      })
    }

    if (response.data?.success) {
      toast.success(isEditing.value ? 'Order updated successfully' : 'Order created successfully')
      router.push('/admin/suppliers')
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Failed to save order'
    toast.error(message)
  } finally {
    submitting.value = false
  }
}

// Go back
function goBack() {
  router.back()
}

// Initialize
onMounted(async () => {
  pageLoading.value = true
  await fetchSuppliers()
  
  if (isEditing.value) {
    await fetchOrder()
  } else if (prefilledSupplierId.value) {
    form.supplier_id = prefilledSupplierId.value
  }
  
  pageLoading.value = false
})
</script>

<style src="./SupplyOrderForm.css"></style>