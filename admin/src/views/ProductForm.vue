<!--src/views/ProductForm.vue-->
<template>
  <div class="product-form-page">
    
    <nav class="form-breadcrumbs">
      <router-link to="/admin/dashboard">Dashboard</router-link>
      <i class="fas fa-chevron-right"></i>
      <router-link to="/admin/products">Product</router-link>
      <i class="fas fa-chevron-right"></i>
      <strong>{{ pageTitle }}</strong>
    </nav>

    <div v-if="loading" class="loading-overlay">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading...</span>
    </div>

    <div v-else-if="loadError" class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      <span>{{ loadError }}</span>
      <router-link to="/admin/products" class="btn btn-secondary">Back to List</router-link>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="product-form-layout">
      
      <div class="form-column-left">
        <div class="card">
          <div class="card-header">
            <h4>Product Information</h4>
            <p>Fill in the basic information for your diet product.</p>
          </div>
          <div class="card-body">
            
            <div class="form-group">
              <label for="productSku">SKU *</label>
              <input 
                type="text" 
                id="productSku" 
                placeholder="e.g., HC001" 
                v-model="product.SKU" 
                :disabled="isViewMode"
                required
              />
              <span v-if="errors.SKU" class="error-text">{{ errors.SKU }}</span>
            </div>
            
            <div class="form-group">
              <label for="productName">Product Name *</label>
              <input 
                type="text" 
                id="productName" 
                placeholder="e.g., Organic Broccoli" 
                v-model="product.name" 
                :disabled="isViewMode"
                required
              />
              <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
            </div>

            <div class="form-group">
              <label for="productDescription">Description *</label>
              <textarea 
                id="productDescription" 
                placeholder="Enter product description..."
                v-model="product.description" 
                :disabled="isViewMode"
                rows="4"
                required
              ></textarea>
              <span v-if="errors.description" class="error-text">{{ errors.description }}</span>
            </div>
            
            <div class="form-row-grid-2">
              <div class="form-group">
                <label for="productCategory">Category *</label>
                <select 
                  id="productCategory" 
                  v-model="product.category_id" 
                  :disabled="isViewMode"
                  @change="onCategoryChange"
                  required
                >
                  <option value="" disabled>Select category</option>
                  <option 
                    v-for="cat in categories" 
                    :key="cat._id" 
                    :value="cat._id"
                  >
                    {{ cat.category_name }}
                  </option>
                </select>
                <span v-if="errors.category_id" class="error-text">{{ errors.category_id }}</span>
              </div>

              <div class="form-group">
                <label for="productType">Product Type *</label>
                <select 
                  id="productType" 
                  v-model="product.type_id" 
                  :disabled="isViewMode || !product.category_id"
                  required
                >
                  <option value="" disabled>
                    {{ product.category_id ? 'Select type' : 'Select category first' }}
                  </option>
                  <option 
                    v-for="type in productTypes" 
                    :key="type._id" 
                    :value="type._id"
                  >
                    {{ type.name }}
                  </option>
                </select>
                <span v-if="errors.type_id" class="error-text">{{ errors.type_id }}</span>
              </div>
            </div>

            <div class="form-group">
              <label for="productBrand">Brand</label>
              <select 
                id="productBrand" 
                v-model="product.brand_id" 
                :disabled="isViewMode"
              >
                <option value="">No brand</option>
                <option 
                  v-for="brand in brands" 
                  :key="brand._id" 
                  :value="brand._id"
                >
                  {{ brand.name }}
                </option>
              </select>
            </div>

            <div class="form-row-grid-2">
              <div class="form-group">
                <label for="productSize">Size</label>
                <input 
                  type="number" 
                  id="productSize" 
                  placeholder="e.g., 500"
                  step="0.01"
                  v-model.number="product.size" 
                  :disabled="isViewMode"
                />
              </div>

              <div class="form-group">
                <label for="productUnit">Unit</label>
                <input 
                  type="text" 
                  id="productUnit" 
                  placeholder="e.g., ml, g, kg"
                  v-model="product.unit" 
                  :disabled="isViewMode"
                />
              </div>
            </div>
            
            <div class="form-row-grid-2">
              <div class="form-group">
                <label for="costPrice">Cost Price (VND) *</label>
                <input 
                  type="number" 
                  id="costPrice" 
                  placeholder="e.g., 40000" 
                  v-model.number="product.cost_price" 
                  :disabled="isViewMode"
                  min="0"
                  required
                />
                <span v-if="errors.cost_price" class="error-text">{{ errors.cost_price }}</span>
              </div>

              <div class="form-group">
                <label for="sellingPrice">Selling Price (VND) *</label>
                <input 
                  type="number" 
                  id="sellingPrice" 
                  placeholder="e.g., 50000" 
                  v-model.number="product.selling_price" 
                  :disabled="isViewMode"
                  min="0"
                  required
                />
                <span v-if="errors.selling_price" class="error-text">{{ errors.selling_price }}</span>
              </div>
            </div>
            
            <div class="form-group">
              <label for="productQty">Quantity (in Stock) *</label>
              <input 
                type="number" 
                id="productQty" 
                placeholder="0" 
                v-model.number="product.current_stock" 
                :disabled="isViewMode"
                min="0"
                required
              />
              <span v-if="errors.current_stock" class="error-text">{{ errors.current_stock }}</span>
            </div>

            <div class="form-group">
              <label>Attributes</label>
              <div class="attributes-grid">
                <label 
                  v-for="attr in attributes" 
                  :key="attr._id"
                  class="attribute-checkbox"
                  :class="{ 'disabled': isViewMode }"
                >
                  <input 
                    type="checkbox" 
                    :value="attr._id"
                    v-model="product.attributes"
                    :disabled="isViewMode"
                  />
                  <span>{{ attr.description }}</span>
                </label>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div class="form-column-right">
        <div class="card">
          <div class="card-header">
            <h4>Product Images</h4>
            <p class="note"><b>Note:</b> Format WebP, PNG, or JPG (Max size 3MB)</p>
          </div>
          <div class="card-body">
            <div class="image-upload-grid">
              <div 
                v-for="index in 4" 
                :key="index"
                class="image-upload-wrapper" 
                :class="{ 'disabled': isViewMode, 'has-image': imagePreview[index - 1] }"
              >
                <div v-if="imagePreview[index - 1]" class="image-preview-container">
                  <img :src="imagePreview[index - 1]" class="image-preview" 
                  :alt="`Preview ${index}`" />
                  <button 
                    v-if="!isViewMode" 
                    type="button"
                    class="remove-image-btn"
                    @click="removeImage(index - 1)"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div v-else class="upload-placeholder">
                  <i class="fas fa-image"></i>
                  <span>Photo {{ index }}</span>
                </div>
                <input 
                  v-if="!isViewMode"
                  type="file" 
                  accept="image/jpeg,image/png,image/webp"
                  @change="handleImageUpload($event, index - 1)" 
                />
              </div>
            </div>
            <span v-if="errors.images" class="error-text">{{ errors.images }}</span>
          </div>
        </div>

        <div class="form-action-buttons">
          <router-link to="/admin/products" v-if="isViewMode" class="btn btn-secondary btn-full">
            <i class="fas fa-arrow-left"></i>
            <span>Back to List</span>
          </router-link>
          
          <template v-else>
            <router-link to="/admin/products" class="btn btn-secondary">
              {{ isEditMode ? 'Discard Changes' : 'Discard' }}
            </router-link>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
              <span>{{ submitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Save Product') }}</span>
            </button>
          </template>
        </div>

      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { buildImagePath } from '@/utilities/helper'

import { useAuth } from '@clerk/vue'
const { getToken } = useAuth()

import { useToast } from 'vue-toastification'
const toast = useToast()

const route = useRoute()
const router = useRouter()

// Mode detection
const productId = ref(route.params.id)
const isEditMode = computed(() => route.name === 'admin-product-edit')
const isViewMode = computed(() => route.name === 'admin-product-view')
const isNewMode = computed(() => route.name === 'admin-product-new')

const pageTitle = computed(() => {
  if (isEditMode.value) return 'Edit Product'
  if (isViewMode.value) return 'Product Details'
  return 'Add Product'
})

// State
const loading = ref(false)
const loadError = ref(null)
const submitting = ref(false)
const errors = ref({})

// Dropdowns data
const categories = ref([])
const productTypes = ref([])
const brands = ref([])
const attributes = ref([])

// Form data
const product = ref({
  SKU: '',
  name: '',
  description: '',
  type_id: '',
  category_id: '',
  brand_id: '',
  size: null,
  unit: '',
  cost_price: null,
  selling_price: null,
  current_stock: 0,
  attributes: []
})

// Images
const imagePreview = ref([])
const imageFiles = ref([])
const existingImages = ref([]) // For edit mode
const imagesToRemove = ref([]) // Images to delete on update

// Fetch dropdown data
const fetchCategories = async () => {
  try {
    const token = await getToken.value()
    const response = await axios.get('/api/admin/categories', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    categories.value = response.data.data || []
  } catch (err) {
    console.error('Error fetching categories:', err)
  }
}

const fetchProductTypes = async () => {
  try {
    const token = await getToken.value()
    const response = await axios.get('/api/admin/product-types', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        category_id: product.value.category_id
      }
    })
    productTypes.value = response.data.data || []
  } catch (err) {
    console.error('Error fetching product types:', err)
  }
}

const fetchBrands = async () => {
  try {
    const token = await getToken.value()
    const response = await axios.get('/api/admin/brands', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    brands.value = response.data.data || []
  } catch (err) {
    console.error('Error fetching brands:', err)
  }
}

const fetchAttributes = async () => {
  try {
    const token = await getToken.value()
    const response = await axios.get('/api/admin/attributes', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    attributes.value = response.data.data || []
  } catch (err) {
    console.error('Error fetching attributes:', err)
  }
}

// Fetch product data for edit/view
const fetchProduct = async () => {
  loading.value = true
  loadError.value = null
  const token = await getToken.value()
  try {
    const response = await axios.get(`/api/admin/products/${productId.value}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    const data = response.data.data
    
    // Populate form
    product.value = {
      SKU: data.SKU,
      name: data.name,
      description: data.description,
      type_id: data.type_id?._id || '',
      category_id: data.type_id?.category_id || '',
      brand_id: data.brand_id?._id || '',
      size: data.size ? parseFloat(data.size.toString()) : null,
      unit: data.unit || '',
      cost_price: data.cost_price,
      selling_price: data.selling_price,
      current_stock: data.current_stock,
      attributes: data.attributes?.map(attr => attr._id) || []
    }
    
    // Load existing images
    existingImages.value = data.image_urls || []
    imagePreview.value = [...existingImages.value]
    
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Failed to load product'
    console.error('Error fetching product:', err)
  } finally {
    loading.value = false
  }
}

// Category change handler
const onCategoryChange = () => {
  product.value.type_id = '' // Reset type when category changes
}

// Image handling
const handleImageUpload = (event, index) => {
  if (isViewMode.value) return
  
  const file = event.target.files[0]
  if (!file) return
  
  // Validate file size (3MB)
  if (file.size > 3 * 1024 * 1024) {
    toast.error('Image size must be less than 3MB')
    return
  }
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    toast.error('Only JPG, PNG, and WebP images are allowed')
    return
  }
  
  imageFiles.value[index] = file
  
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value[index] = e.target.result
  }
  reader.readAsDataURL(file)
}

const removeImage = (index) => {
  // If it's an existing image, mark for removal
  if (isEditMode.value && existingImages.value[index]) {
    imagesToRemove.value.push(existingImages.value[index])
  }
  
  // Clear preview and file
  imagePreview.value[index] = null
  imageFiles.value[index] = null
  
  // Reorganize arrays
  imagePreview.value = imagePreview.value.filter((_, i) => i !== index)
  imageFiles.value = imageFiles.value.filter((_, i) => i !== index)
}

// Form validation
const validateForm = () => {
  errors.value = {}
  
  if (!product.value.SKU) errors.value.SKU = 'SKU is required'
  if (!product.value.name) errors.value.name = 'Product name is required'
  if (!product.value.description) errors.value.description = 'Description is required'
  if (!product.value.type_id) errors.value.type_id = 'Product type is required'
  if (!product.value.category_id) errors.value.category_id = 'Category is required'
  if (product.value.cost_price === null || product.value.cost_price < 0) {
    errors.value.cost_price = 'Valid cost price is required'
  }
  if (product.value.selling_price === null || product.value.selling_price < 0) {
    errors.value.selling_price = 'Valid selling price is required'
  }
  if (product.value.current_stock === null || product.value.current_stock < 0) {
    errors.value.current_stock = 'Valid stock quantity is required'
  }
  
  return Object.keys(errors.value).length === 0
}

// Form submission
const handleSubmit = async () => {
  if (!validateForm()) {
    toast.error('Please fix the errors in the form')
    return
  }
  
  submitting.value = true
  
  try {
    const formData = new FormData()
    const token = await getToken.value()

    // Add product data
    formData.append('type_id', product.value.type_id)
    formData.append('SKU', product.value.SKU)
    formData.append('name', product.value.name)
    formData.append('description', product.value.description)
    formData.append('cost_price', product.value.cost_price)
    formData.append('selling_price', product.value.selling_price)
    formData.append('current_stock', product.value.current_stock)
    
    if (product.value.brand_id) {
      formData.append('brand_id', product.value.brand_id)
    }
    
    if (product.value.size) {
      formData.append('size', product.value.size)
    }
    
    if (product.value.unit) {
      formData.append('unit', product.value.unit)
    }
    
    if (product.value.attributes.length > 0) {
      product.value.attributes.forEach(attr => {
      formData.append('attributes[]', attr)
      })
    }
    
    // Add images
    imageFiles.value.forEach((file) => {
      if (file) {
        formData.append('images', file)
      }
    })
    
    // For edit mode, add images to remove
    if (isEditMode.value && imagesToRemove.value.length > 0) {
      formData.append('remove_images', JSON.stringify(imagesToRemove.value))
    }

    
    // Submit
    if (isEditMode.value) {
      await axios.put(`/api/admin/products/${productId.value}`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      },
    })
      toast.success('Product updated successfully!', { timeout: 1500 })
    } else {
      await axios.post('/api/admin/products', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      })
      toast.success('Product created successfully!', { timeout: 1500 })
    }
    
    setTimeout(() => router.push('/admin/products'), 1500)
    
  } catch (err) {
    toast.error('Failed to save product')
  } finally {
    submitting.value = false
  }
}

// Initialize
onMounted(async () => {
  await Promise.all([
    fetchCategories(),
    fetchProductTypes(),
    fetchBrands(),
    fetchAttributes()
  ])
  
  if (productId.value && (isEditMode.value || isViewMode.value)) {
    await fetchProduct()
  }
})

watch(() => product.value.category_id, (newCategoryId) => {
  if (newCategoryId){
    fetchProductTypes()
  }
})
</script>

<style scoped src="./ProductForm.css"></style>