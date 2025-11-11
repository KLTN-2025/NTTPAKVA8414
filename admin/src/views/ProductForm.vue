<template>
  <div class="product-form-page">
    
    <nav class="form-breadcrumbs">
      <router-link to="/">Dashboard</router-link>
      <i class="fas fa-chevron-right"></i>
      <router-link to="/products">Product</router-link>
      <i class="fas fa-chevron-right"></i>
      <strong>{{ pageTitle }}</strong>
    </nav>

    <form @submit.prevent="handleSubmit" class="product-form-layout">
      
      <div class="form-column-left">
        <div class="card">
          <div class="card-header">
            <h4>Product Information</h4>
            <p>Fill in the basic information for your diet product.</p>
          </div>
          <div class="card-body">
            
            <div class="form-group">
              <label for="productSku">SKU (Stock Keeping Unit)</label>
              <input type="text" id="productSku" placeholder="e.g., HC001" v-model="product.sku" :disabled="isViewMode" />
            </div>
            
            <div class="form-group">
              <label for="productName">Product Name</label>
              <input type="text" id="productName" placeholder="e.g., Organic Broccoli" v-model="product.name" :disabled="isViewMode" />
            </div>
            
            <div class="form-row-grid-2">
              <div class="form-group">
                <label for="productCategory">Product Category</label>
                <select id="productCategory" v-model="product.category" :disabled="isViewMode">
                  <option value="" disabled>Select product category</option>
                  <option value="Rau củ">Rau củ (Vegetables)</option>
                  <option value="Trái cây">Trái cây (Fruits)</option>
                  <option value="Low-Carb">Low-Carb</option>
                  <option value="Đồ uống">Đồ uống (Beverages)</option>
                </select>
              </div>
              <div class="form-group">
                <label for="productPrice">Price (VNĐ)</label>
                <input type="number" id="productPrice" placeholder="e.g., 50000" v-model.number="product.price" :disabled="isViewMode" />
              </div>
            </div>
            
            <div class="form-group">
              <label for="productQty">Quantity (in Stock)</label>
              <input type="number" id="productQty" placeholder="0" v-model.number="product.quantity" :disabled="isViewMode" />
            </div>

            <div class="form-group">
              <label for="productStatus">Status Product</label>
              <select id="productStatus" v-model="product.status" :disabled="isViewMode">
                <option value="Available">Available (Còn hàng)</option>
                <option value="Out of Stock">Out of Stock (Hết hàng)</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      <div class="form-column-right">
        <div class="card">
          <div class="card-header">
            <h4>Image Product</h4>
            <p class="note"><b>Note :</b> Format photos SVG, PNG, or JPG (Max size 4mb)</p>
          </div>
          <div class="card-body">
            <div class="image-upload-grid">
              <div class="image-upload-wrapper" :class="{ 'disabled': isViewMode }">
                <img v-if="imagePreview[0]" :src="imagePreview[0]" class="image-preview" alt="Preview 1" />
                <i v-else class="fas fa-image"></i>
                <span>Photo 1</span>
                <input type="file" @change="handleImageUpload($event, 0)" :disabled="isViewMode" />
              </div>
              <div class="image-upload-wrapper" :class="{ 'disabled': isViewMode }">
                <img v-if="imagePreview[1]" :src="imagePreview[1]" class="image-preview" alt="Preview 2" />
                <i v-else class="fas fa-image"></i>
                <span>Photo 2</span>
                <input type="file" @change="handleImageUpload($event, 1)" :disabled="isViewMode" />
              </div>
              <div class="image-upload-wrapper" :class="{ 'disabled': isViewMode }">
                <img v-if="imagePreview[2]" :src="imagePreview[2]" class="image-preview" alt="Preview 3" />
                <i v-else class="fas fa-image"></i>
                <span>Photo 3</span>
                <input type="file" @change="handleImageUpload($event, 2)" :disabled="isViewMode" />
              </div>
              <div class="image-upload-wrapper" :class="{ 'disabled': isViewMode }">
                <img v-if="imagePreview[3]" :src="imagePreview[3]" class="image-preview" alt="Preview 4" />
                <i v-else class="fas fa-image"></i>
                <span>Photo 4</span>
                <input type="file" @change="handleImageUpload($event, 3)" :disabled="isViewMode" />
              </div>
            </div>
          </div>
        </div>

        <div class="form-action-buttons">
          <router-link to="/products" v-if="isViewMode" class="btn btn-secondary btn-full">
            <i class="fas fa-arrow-left"></i>
            <span>Back to List</span>
          </router-link>
          
          <template v-else>
            <router-link to="/products" class="btn btn-secondary">
              {{ isEditMode ? 'Discard Changes' : 'Discard' }}
            </router-link>
            <button type="submit" class="btn btn-primary">
              {{ isEditMode ? 'Save Changes' : 'Save Product' }}
            </button>
          </template>
        </div>

      </div>
    </form>
  </div>
  
  <Teleport to="body">
    <div v-if="toast.visible" class="toast-notification" :class="toast.type">
      <i class="fas" :class="toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'"></i>
      <span>{{ toast.message }}</span>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute();
const router = useRouter();

// === LOGIC MỚI: KIỂM TRA CHẾ ĐỘ ===
const productId = ref(route.params.id);
// Kiểm tra tên route thay vì chỉ kiểm tra ID
const isEditMode = computed(() => route.name === 'admin-product-edit');
const isViewMode = computed(() => route.name === 'admin-product-view');
const isNewMode = computed(() => route.name === 'admin-product-new');

// Tự động đổi tiêu đề
const pageTitle = computed(() => {
  if (isEditMode.value) return 'Edit Product';
  if (isViewMode.value) return 'Product Details';
  return 'Add Product';
});
// ==================================

// Dữ liệu form
const product = ref({
  sku: '',
  name: '',
  category: '',
  price: null,
  quantity: null,
  status: 'Available'
});

const imagePreview = ref([]);
const imageFiles = ref([]);

// Logic Toast (Giữ nguyên)
const toast = ref({ visible: false, message: '', type: 'success' });
let toastTimer = null;
function showToast(message, type = 'success') {
  clearTimeout(toastTimer);
  toast.value = { visible: true, message, type };
  toastTimer = setTimeout(() => {
    toast.value.visible = false;
  }, 3000);
}

// Logic Tải dữ liệu (Giữ nguyên, vì cả Edit và View đều cần tải)
onMounted(() => {
  if (productId.value) { // Tải nếu có ID (cho cả Edit và View)
    console.log("Fetching data for product ID:", productId.value);
    // (Giả lập tải data)
    if (productId.value === 'HC001') {
      product.value = {
        sku: 'HC001',
        name: 'Bông Cải Xanh (Organic)',
        category: 'Rau củ',
        price: 50000,
        quantity: 150,
        status: 'Available'
      };
      imagePreview.value[0] = 'https://via.placeholder.com/100/27ae60/ffffff?text=V';
    }
  }
});

function handleImageUpload(event, index) {
  if (isViewMode.value) return; // Không cho upload ở chế độ View
  const file = event.target.files[0];
  if (file) {
    imageFiles.value[index] = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value[index] = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

// Xử lý Submit (Nó sẽ không chạy ở View mode vì nút submit bị ẩn)
function handleSubmit() {
  if (isEditMode.value) {
    console.log("Updating Product:", productId.value, product.value);
    showToast('Product Updated Successfully!', 'success');
    setTimeout(() => router.push('/products'), 1000);
  } else {
    console.log("Creating Product:", product.value);
    showToast('Product Created Successfully!', 'success');
    setTimeout(() => router.push('/products'), 1000);
  }
}
</script>

<style scoped src="./ProductForm.css"></style>