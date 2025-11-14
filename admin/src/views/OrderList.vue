<template>
  <div class="order-list-page">
    
    <div class="list-header">
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input type="text" placeholder="Search by Order ID, Customer name..." />
      </div>
      
      <div class="header-actions">
        <button 
          v-if="selectedOrders.length > 0" 
          class="btn btn-danger-outline"
          @click="openBulkDeleteModal"
        >
          <i class="fas fa-trash-alt"></i>
          <span>Delete Selected ({{ selectedOrders.length }})</span>
        </button>
        
        <button class="btn btn-secondary" @click="isFilterVisible = true">
          <i class="fas fa-filter"></i>
          <span>Filter</span>
        </button>
        <button class="btn btn-secondary" @click="exportToCSV">
          <i class="fas fa-file-export"></i>
          <span>Export</span>
        </button>
        <router-link to="/orders/new" class="btn btn-primary">
          <i class="fas fa-plus"></i>
          <span>New Order</span>
        </router-link>
      </div>
    </div>

    <nav class="status-tabs">
      <button 
        v-for="status in statuses" 
        :key="status.slug"
        :class="['tab-btn', { 'active': activeTab === status.slug }]"
        @click="activeTab = status.slug"
      >
        {{ status.name }} ({{ status.count }})
      </button>
    </nav>

    <div class="table-container">
      <table class="order-table">
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox" 
                v-model="selectAllModel" 
                :indeterminate="isIndeterminate" 
              />
            </th>
            <th @click="handleSort('id')" class="sortable">
              Orders <i :class="getSortIcon('id')"></i>
            </th>
            <th @click="handleSort('customer')" class="sortable">
              Customer <i :class="getSortIcon('customer')"></i>
            </th>
            <th @click="handleSort('total')" class="sortable">
              Total <i :class="getSortIcon('total')"></i>
            </th>
            <th @click="handleSort('date')" class="sortable">
              Date <i :class="getSortIcon('date')"></i>
            </th>
            <th @click="handleSort('payment')" class="sortable">
              Payment <i :class="getSortIcon('payment')"></i>
            </th>
            <th @click="handleSort('status')" class="sortable">
              Status <i :class="getSortIcon('status')"></i>
            </th>
            <th class="action-header">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in sortedOrders" :key="order.id">
            <td>
              <input type="checkbox" v-model="selectedOrders" :value="order.id" />
            </td>
            <td>
              <div class="product-cell">
                <img :src="order.image" :alt="order.productName" />
                <div class="product-info">
                  <span class="order-id">#{{ order.id }}</span>
                  <span class="product-name">{{ order.productName }}</span>
                </div>
              </div>
            </td>
            <td>{{ order.customer }}</td>
            <td>{{ order.total }}</td>
            <td>
              <div class="date-cell">
                <span>{{ order.date }}</span>
                <span>{{ order.time }}</span>
              </div>
            </td>
            <td>
              <span 
                class="status-badge" 
                :class="order.payment === 'Paid' ? 'paid' : 'unpaid'"
              >
                {{ order.payment }}
              </span>
            </td>
            <td>
              <span 
                class="status-badge" 
                :class="getStatusClass(order.status)"
              >
                {{ order.status }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <router-link :to="'/orders/view/' + order.id" class="action-btn">
                  <i class="fas fa-eye"></i>
                </router-link>
                <router-link :to="'/orders/edit/' + order.id" class="action-btn">
                  <i class="fas fa-pencil-alt"></i>
                </router-link>
                <button 
                  class="action-btn btn-delete"
                  @click="openSingleDeleteModal(order.id, order.customer)"
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
      <span>1 - 8 of 441 Orders</span>
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
          <h3>{{ isBulkDelete ? 'Delete Orders' : 'Delete Order' }}</h3>
          <button @click="closeDeleteModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p v-if="isBulkDelete">
            Are you sure you want to delete the 
            <strong>{{ selectedOrders.length }} selected orders</strong>?
            This action cannot be undone.
          </p>
          <p v-else>
            Are you sure you want to delete the order
            <strong>#{{ orderToDeleteId }} (Customer: {{ orderToDeleteName }})</strong>?
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
            <h4>Filter Orders</h4>
            <button @click="isFilterVisible = false" class="close-btn">&times;</button>
          </div>
          <div class="filter-body">
            <div class="filter-group">
              <label>Payment Status</label>
              <select>
                <option value="">All</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Order Status</label>
              <select>
                <option value="">All</option>
                <option value="Shipping">Shipping</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
             <div class="filter-group">
              <label>Order Date</label>
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

// --- DỮ LIỆU GIẢ LẬP MỚI CHO HEALTHYCRAVE ---
const statuses = ref([
  { name: 'All Orders', count: 441, slug: 'all' },
  { name: 'Shipping', count: 100, slug: 'shipping' },
  { name: 'Completed', count: 300, slug: 'completed' },
  { name: 'Cancelled', count: 41, slug: 'cancel' },
]);
const activeTab = ref('all');

// Hàm format tiền tệ VNĐ
const formatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

const orders = ref([
  { id: 'HC1021', productName: 'Bông Cải Xanh, Ức Gà,... (3 items)', image: 'https://picsum.photos/300/27ae60/ffffff?text=V', customer: 'Trần Văn An', total: formatter.format(250000), date: '11/11/25', time: 'at 8:30 AM', payment: 'Paid', status: 'Shipping', price: 250000 },
  { id: 'HC1020', productName: 'Bánh Mì Keto (2 items)', image: 'https://picsum.photos/300/e67e22/ffffff?text=B', customer: 'Nguyễn Thị Bích', total: formatter.format(120000), date: '11/11/25', time: 'at 8:00 AM', payment: 'Unpaid', status: 'Cancelled', price: 120000 },
  { id: 'HC1019', productName: 'Sữa Hạnh Nhân (1 item)', image: 'https://picsum.photos/300/3498db/ffffff?text=D', customer: 'Leslie Alexander', total: formatter.format(85000), date: '11/10/25', time: 'at 5:00 PM', payment: 'Paid', status: 'Completed', price: 85000 },
  { id: 'HC1018', productName: 'Set ăn kiêng 1 tuần (5 items)', image: 'https://picsum.photos/300/f1c40f/ffffff?text=M', customer: 'Phạm Hùng', total: formatter.format(550000), date: '11/10/25', time: 'at 4:00 PM', payment: 'Paid', status: 'Shipping', price: 550000 },
  { id: 'HC1017', productName: 'Quả Bơ, Hạt Chia (2 items)', image: 'https://picsum.photos/300/1abc9c/ffffff?text=F', customer: 'Guy Hawkins', total: formatter.format(310000), date: '11/09/25', time: 'at 2:00 PM', payment: 'Unpaid', status: 'Cancelled', price: 310000 },
  { id: 'HC1016', productName: 'Cải Bó Xôi (1 item)', image: 'https://picsum.photos/300/2ecc71/ffffff?text=V', customer: 'Lê Thị Lanh', total: formatter.format(75000), date: '11/09/25', time: 'at 1:00 PM', payment: 'Paid', status: 'Completed', price: 75000 },
  { id: 'HC1015', productName: 'Hạt Chia, Kombucha (2 items)', image: 'https://picsum.photos/300/9b59b6/ffffff?text=S', customer: 'Jane Cooper', total: formatter.format(190000), date: '11/08/25', time: 'at 3:00 PM', payment: 'Paid', status: 'Completed', price: 190000 },
]);

// === LOGIC "SELECT ALL" ===
const selectedOrders = ref([]);
const isIndeterminate = computed(() => 
  selectedOrders.value.length > 0 && 
  selectedOrders.value.length < orders.value.length
);
const selectAllModel = computed({
  get() {
    return orders.value.length > 0 && 
           selectedOrders.value.length === orders.value.length;
  },
  set(value) {
    if (value) {
      selectedOrders.value = orders.value.map(o => o.id);
    } else {
      selectedOrders.value = [];
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
const sortedOrders = computed(() => {
  const key = sortKey.value;
  const direction = sortDirection.value === 'asc' ? 1 : -1;
  return [...orders.value].sort((a, b) => {
    let valA = a[key]; let valB = b[key];
    
    if (key === 'total') {
      valA = a['price']; // Dùng trường 'price' (số)
      valB = b['price'];
    } else if (key === 'date') {
      valA = new Date(valA);
      valB = new Date(valB);
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return -1 * direction;
    if (valA > valB) return 1 * direction;
    return 0;
  });
});

// === LOGIC MODAL XÓA ===
const isDeleteModalVisible = ref(false);
const orderToDeleteId = ref(null);
const orderToDeleteName = ref('');
const isBulkDelete = ref(false); 

function openSingleDeleteModal(id, customerName) {
  isBulkDelete.value = false;
  orderToDeleteId.value = id;
  orderToDeleteName.value = customerName; // Lấy tên khách hàng
  isDeleteModalVisible.value = true;
}
function openBulkDeleteModal() {
  isBulkDelete.value = true;
  isDeleteModalVisible.value = true;
}
function closeDeleteModal() {
  isDeleteModalVisible.value = false;
  isBulkDelete.value = false;
  orderToDeleteId.value = null;
  orderToDeleteName.value = '';
}
function confirmDelete() {
  if (isBulkDelete.value) {
    orders.value = orders.value.filter(
      (order) => !selectedOrders.value.includes(order.id)
    );
    selectedOrders.value = [];
  } else {
    orders.value = orders.value.filter(
      (order) => order.id !== orderToDeleteId.value
    );
  }
  closeDeleteModal();
}

// === LOGIC FILTER PANEL ===
const isFilterVisible = ref(false);

// === LOGIC EXPORT ===
function exportToCSV() {
  const headers = ['Order ID', 'Customer', 'Total', 'Date', 'Payment', 'Status'];
  let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
  orders.value.forEach(order => {
    const row = [
      order.id,
      `"${order.customer}"`, 
      order.total,
      order.date,
      order.payment,
      order.status
    ];
    csvContent += row.join(",") + "\n";
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "order_export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// === HÀM HELPER CHO STATUS ===
function getStatusClass(status) {
  if (status === 'Shipping') return 'shipping';
  if (status === 'Cancelled') return 'cancelled';
  if (status === 'Completed') return 'completed';
  return '';
}

</script>

<style scoped src="./OrderList.css"></style>