<template>
  <div class="product-list-page">
    
    <div class="product-list-header">
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input type="text" placeholder="Search for id, name product..." />
      </div>
      
      <div class="header-actions">
        <button 
          v-if="selectedProducts.length > 0" 
          class="btn btn-danger-outline"
          @click="openBulkDeleteModal"
        >
          <i class="fas fa-trash-alt"></i>
          <span>Delete Selected ({{ selectedProducts.length }})</span>
        </button>

        <button class="btn btn-secondary" @click="isFilterVisible = true">
          <i class="fas fa-filter"></i>
          <span>Filter</span>
        </button>
        <button class="btn btn-secondary" @click="exportToCSV">
          <i class="fas fa-file-export"></i>
          <span>Export</span>
        </button>
        <router-link to="/products/new" class="btn btn-primary">
          <i class="fas fa-plus"></i>
          <span>New Product</span>
        </router-link>
      </div>
    </div>

    <nav class="product-tabs">
      <button 
        v-for="cat in categories" :key="cat.slug"
        :class="['tab-btn', { 'active': activeTab === cat.slug }]"
        @click="activeTab = cat.slug"
      >
        {{ cat.name }} ({{ cat.count }})
      </button>
    </nav>

    <div class="table-container">
      <table class="product-table">
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox" 
                v-model="selectAllModel" 
                :indeterminate="isIndeterminate" 
              />
            </th>
            <th @click="handleSort('name')" class="sortable">
              Product <i :class="getSortIcon('name')"></i>
            </th>
            <th @click="handleSort('price')" class="sortable">
              Price <i :class="getSortIcon('price')"></i>
            </th>
            <th @click="handleSort('qty')" class="sortable">
              QTY <i :class="getSortIcon('qty')"></i>
            </th>
            <th @click="handleSort('date')" class="sortable">
              Date <i :class="getSortIcon('date')"></i>
            </th>
            <th @click="handleSort('status')" class="sortable">
              Status <i :class="getSortIcon('status')"></i>
            </th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in sortedProducts" :key="product.id">
            <td>
              <input type="checkbox" v-model="selectedProducts" :value="product.id" />
            </td>
            <td>
              <div class="product-cell">
                <img :src="product.image" :alt="product.name" />
                <div class="product-info">
                  <span class="product-id">{{ product.id }}</span>
                  <span class="product-name">{{ product.name }}</span>
                </div>
              </div>
            </td>
            <td>{{ product.price }}</td>
            <td>{{ product.qty }}</td>
            <td>
              <div class="date-cell">
                <span>{{ product.date }}</span>
                <span>{{ product.time }}</span>
              </div>
            </td>
            <td>
              <span 
                class="status-badge" 
                :class="product.status === 'Available' ? 'available' : 'out-of-stock'"
              >
                {{ product.status }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <router-link :to="'/products/view/' + product.id" class="action-btn">
                  <i class="fas fa-eye"></i>
                </router-link>
                <router-link :to="'/products/edit/' + product.id" class="action-btn">
                  <i class="fas fa-pencil-alt"></i>
                </router-link>
                <button 
                  class="action-btn btn-delete" 
                  @click="openSingleDeleteModal(product.id, product.name)"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-footer">
      <span>1 - 8 of 13 Pages</span>
      <div class="page-controls">
        <span>The page on</span>
        <select>
          <option value="1">1</option>
        </select>
        <button><i class="fas fa-chevron-left"></i></button>
        <button><i class="fas fa-chevron-right"></i></button>
      </div>
    </div>

    <div v-if="isDeleteModalVisible" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-card">
        <div class="modal-header">
          <i class="fas fa-exclamation-triangle warning-icon"></i>
          <h3>{{ isBulkDelete ? 'Delete Products' : 'Delete Product' }}</h3>
          <button @click="closeDeleteModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p v-if="isBulkDelete">
            Are you sure you want to delete the 
            <strong>{{ selectedProducts.length }} selected products</strong>?
            This action cannot be undone.
          </p>
          <p v-else>
            Are you sure you want to delete the product
            <strong>"{{ productToDeleteName }}"</strong>?
            This action cannot be undone.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="confirmDelete" class="btn btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
    
    <Teleport to="body">
      <div 
        class="filter-panel-overlay" 
        :class="{ 'open': isFilterVisible }"
        @click.self="isFilterVisible = false"
      >
        <div class="filter-panel">
          <div class="filter-header">
            <h4>Filter Products</h4>
            <button @click="isFilterVisible = false" class="close-btn">&times;</button>
          </div>
          <div class="filter-body">
            <div class="filter-group">
              <label>Category</label>
              <select>
                <option value="">All Categories</option>
                <option v-for="cat in categories" :key="cat.slug" :value="cat.slug">
                  {{ cat.name }}
                </option>
              </select>
            </div>
            <div class="filter-group">
              <label>Status</label>
              <select>
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Price Range</label>
              <div class="price-inputs">
                <input type="number" placeholder="Min" />
                <span>-</span>
                <input type="number" placeholder="Max" />
              </div>
            </div>
            <div class="filter-group">
              <label>Date Added</label>
              <div class="date-inputs">
                <input type="date" placeholder="Start Date" />
                <span>-</span>
                <input type="date" placeholder="End Date" />
              </div>
            </div>
          </div>
          <div class="filter-footer">
            <button class="btn btn-secondary" @click="isFilterVisible = false">Cancel</button>
            <button class="btn btn-primary">Apply Filters</button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// (Dữ liệu giả lập categories và products giữ nguyên)
const categories = ref([
  { name: 'Rau củ', count: 50, slug: 'vegetables' },
  { name: 'Trái cây', count: 26, slug: 'fruits' },
  { name: 'Low-Carb', count: 121, slug: 'low-carb' },
  { name: 'Đồ uống', count: 21, slug: 'beverages' },
]);
const activeTab = ref('vegetables'); 
const products = ref([
  { id: 'HC001', name: 'Bông Cải Xanh (Organic)', image: 'https://via.placeholder.com/40/27ae60/ffffff?text=V', price: '$2.50', qty: 150, date: '11/10/25', time: 'at 9:30 AM', status: 'Available' },
  { id: 'HC002', name: 'Ức Gà Phi Lê', image: 'https://via.placeholder.com/40/f1c40f/ffffff?text=M', price: '$5.00', qty: 80, date: '11/10/25', time: 'at 9:25 AM', status: 'Available' },
  { id: 'HC003', name: 'Bánh Mì Keto Hạnh Nhân', image: 'https://via.placeholder.com/40/e67e22/ffffff?text=B', price: '$7.20', qty: 0, date: '11/09/25', time: 'at 5:00 PM', status: 'Out of Stock' },
  { id: 'HC004', name: 'Sữa Hạnh Nhân (Không đường)', image: 'https://via.placeholder.com/40/3498db/ffffff?text=D', price: '$3.50', qty: 200, date: '11/09/25', time: 'at 4:30 PM', status: 'Available' },
  { id: 'HC005', name: 'Cải Bó Xôi (Spinach)', image: 'https://via.placeholder.com/40/2ecc71/ffffff?text=V', price: '$1.80', qty: 300, date: '11/08/25', time: 'at 11:00 AM', status: 'Available' },
  { id: 'HC006', name: 'Quả Bơ (Avocado)', image: 'https://via.placeholder.com/40/1abc9c/ffffff?text=F', price: '$1.50', qty: 0, date: '11/08/25', time: 'at 10:00 AM', status: 'Out of Stock' },
  { id: 'HC007', name: 'Hạt Chia (Organic)', image: 'https://via.placeholder.com/40/9b59b6/ffffff?text=S', price: '$6.00', qty: 90, date: '11/07/25', time: 'at 3:15 PM', status: 'Available' },
  { id: 'HC008', name: 'Trà Kombucha Vị Gừng', image: 'https://via.placeholder.com/40/e74c3c/ffffff?text=D', price: '$4.20', qty: 45, date: '11/07/25', time: 'at 1:00 PM', status: 'Available' },
]);


// === LOGIC "SELECT ALL" ===
const selectedProducts = ref([]);
const isIndeterminate = computed(() => 
  selectedProducts.value.length > 0 && 
  selectedProducts.value.length < products.value.length
);
const selectAllModel = computed({
  get() {
    return products.value.length > 0 && 
           selectedProducts.value.length === products.value.length;
  },
  set(value) {
    if (value) {
      selectedProducts.value = products.value.map(p => p.id);
    } else {
      selectedProducts.value = [];
    }
  }
});

// === LOGIC SẮP XẾP (SORTING) ===
const sortKey = ref('date'); 
const sortDirection = ref('desc'); 
function getSortIcon(key) {
  if (sortKey.value !== key) { return 'fas fa-sort'; }
  if (sortDirection.value === 'asc') { return 'fas fa-sort-up active-sort'; }
  return 'fas fa-sort-down active-sort';
}
function handleSort(key) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDirection.value = 'asc'; 
  }
}
const sortedProducts = computed(() => {
  const key = sortKey.value;
  const direction = sortDirection.value === 'asc' ? 1 : -1;
  return [...products.value].sort((a, b) => {
    let valA = a[key]; let valB = b[key];
    switch (key) {
      case 'price':
        valA = parseFloat(a.price.replace('$', ''));
        valB = parseFloat(b.price.replace('$', ''));
        break;
      case 'date':
        valA = new Date(a.date); valB = new Date(b.date);
        break;
      case 'name': case 'status':
        valA = a[key].toLowerCase(); valB = b[key].toLowerCase();
        break;
    }
    if (valA < valB) return -1 * direction;
    if (valA > valB) return 1 * direction;
    return 0;
  });
});

// === LOGIC MODAL XÓA ===
const isDeleteModalVisible = ref(false);
const productToDeleteId = ref(null);
const productToDeleteName = ref('');
const isBulkDelete = ref(false); 

function openSingleDeleteModal(id, name) {
  isBulkDelete.value = false;
  productToDeleteId.value = id;
  productToDeleteName.value = name;
  isDeleteModalVisible.value = true;
}
function openBulkDeleteModal() {
  isBulkDelete.value = true;
  isDeleteModalVisible.value = true;
}
function closeDeleteModal() {
  isDeleteModalVisible.value = false;
  isBulkDelete.value = false;
  productToDeleteId.value = null;
  productToDeleteName.value = '';
}
function confirmDelete() {
  if (isBulkDelete.value) {
    products.value = products.value.filter(
      (product) => !selectedProducts.value.includes(product.id)
    );
    selectedProducts.value = [];
  } else {
    products.value = products.value.filter(
      (product) => product.id !== productToDeleteId.value
    );
  }
  closeDeleteModal();
}

// === LOGIC FILTER PANEL ===
const isFilterVisible = ref(false);

// === LOGIC EXPORT ===
function exportToCSV() {
  const headers = ['ID', 'Name', 'Price', 'Quantity', 'Status'];
  let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
  products.value.forEach(product => {
    const row = [
      product.id,
      `"${product.name}"`, 
      product.price,
      product.qty,
      product.status
    ];
    csvContent += row.join(",") + "\n";
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "product_export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<style scoped src="./ProductList.css"></style>