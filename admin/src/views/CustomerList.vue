<template>
  <div class="customer-list-page">
    
    <div class="list-header">
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input type="text" placeholder="Search by ID, name, email..." />
      </div>
      
      <div class="header-actions">
        <button class="btn btn-secondary" @click="isFilterVisible = true">
          <i class="fas fa-filter"></i>
          <span>Filter</span>
        </button>
        <button class="btn btn-secondary" @click="exportToCSV">
          <i class="fas fa-file-export"></i>
          <span>Export</span>
        </button>
      </div>
    </div>

    <div class="table-container">
      <table class="customer-table">
        <thead>
          <tr>
            <th @click="handleSort('id')" class="sortable">
              Account ID <i :class="getSortIcon('id')"></i>
            </th>
            <th @click="handleSort('name')" class="sortable">
              Name <i :class="getSortIcon('name')"></i>
            </th>
            <th @click="handleSort('email')" class="sortable">
              Email <i :class="getSortIcon('email')"></i>
            </th>
            <th @click="handleSort('address')" class="sortable">
              Address <i :class="getSortIcon('address')"></i>
            </th>
            <th @click="handleSort('phone')" class="sortable">
              Phone <i :class="getSortIcon('phone')"></i>
            </th>
            <th class="action-header">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in sortedCustomers" :key="customer.id" :class="{ 'locked': customer.isLocked }">
            <td>
              <span class="customer-id">#{{ customer.id }}</span>
            </td>
            <td>
              <div class="customer-cell">
                <span class="customer-name">{{ customer.name }}</span>
              </div>
            </td>
            <td>{{ customer.email }}</td>
            <td>{{ customer.address }}</td>
            <td>{{ customer.phone }}</td>
            
            <td>
              <div class="action-buttons">
                <button 
                  v-if="customer.isLocked" 
                  class="action-btn btn-unlock" 
                  @click="openLockModal(customer, false)"
                >
                  <i class="fas fa-check-circle"></i>
                  <span>Unlock</span>
                </button>
                
                <button 
                  v-else 
                  class="action-btn btn-lock"
                  @click="openLockModal(customer, true)"
                >
                  <i class="fas fa-ban"></i>
                  <span>Lock</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-footer">
      <span>1 - 5 of 13 Pages</span>
      <div class="page-controls">
        <span>The page on</span>
        <select>
          <option value="1">1</option>
        </select>
        <button><i class="fas fa-chevron-left"></i></button>
        <button><i class="fas fa-chevron-right"></i></button>
      </div>
    </div>

    <div v-if="isLockModalVisible" class="modal-overlay" @click.self="closeLockModal">
      <div class="modal-card">
        <div class="modal-header">
          <i class="fas info-icon" :class="isLocking ? 'fa-user-lock' : 'fa-user-check'"></i>
          <h3>{{ isLocking ? 'Lock Account' : 'Unlock Account' }}</h3>
          <button @click="closeLockModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p v-if="isLocking">
            Are you sure you want to **lock** the account for
            <strong>"{{ customerToLock.name }}"</strong>?
            They will not be able to log in.
          </p>
          <p v-else>
            Are you sure you want to **unlock** the account for
            <strong>"{{ customerToLock.name }}"</strong>?
            They will regain access to their account.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeLockModal" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="confirmLockToggle" class="btn" :class="isLocking ? 'btn-danger' : 'btn-success'">
            {{ isLocking ? 'Lock' : 'Unlock' }}
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
        </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="toast.visible" class="toast-notification" :class="toast.type">
        <i class="fas" :class="toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'"></i>
        <span>{{ toast.message }}</span>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// --- DỮ LIỆU GIẢ LẬP (ĐÃ CẬP NHẬT) ---
const customers = ref([
  { id: 'ID12451', name: 'Leslie Alexander', email: 'georgia@example.com', phone: '+62 819 1314 1435', address: '2972 Westheimer Rd. Santa Ana, Illinois 85486', avatar: 'https://via.placeholder.com/40/A', isLocked: false },
  { id: 'ID12452', name: 'Guy Hawkins', email: 'guys@example.com', phone: '+62 819 1314 1435', address: '4517 Washington Ave. Manchester, Kentucky 39495', avatar: 'https://via.placeholder.com/40/B', isLocked: false },
  { id: 'ID12453', name: 'Kristin Watson', email: 'kristin@example.com', phone: '+62 819 1314 1435', address: '2118 Thornridge Cir. Syracuse, Connecticut 35624', avatar: 'https://via.placeholder.com/40/C', isLocked: true },
]);

// === LOGIC "SELECT ALL" (ĐÃ XÓA) ===
// const selectedCustomers = ref([]);

// === LOGIC SẮP XẾP (SORTING) ===
const sortKey = ref('name'); 
const sortDirection = ref('asc'); 
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
const sortedCustomers = computed(() => {
  const key = sortKey.value;
  const direction = sortDirection.value === 'asc' ? 1 : -1;
  return [...customers.value].sort((a, b) => {
    let valA = a[key]; let valB = b[key];
    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    if (valA < valB) return -1 * direction;
    if (valA > valB) return 1 * direction;
    return 0;
  });
});

// === LOGIC MODAL XÓA (ĐÃ XÓA) ===

// === LOGIC MỚI: TOAST NOTIFICATION ===
const toast = ref({ visible: false, message: '', type: 'success' });
let toastTimer = null;
function showToast(message, type = 'success') {
  clearTimeout(toastTimer); 
  toast.value = { visible: true, message, type };
  toastTimer = setTimeout(() => {
    toast.value.visible = false;
  }, 3000);
}

// === LOGIC MỚI: LOCK/UNLOCK MODAL ===
const isLockModalVisible = ref(false);
const customerToLock = ref(null);
const isLocking = ref(false); // true = đang lock, false = đang unlock

function openLockModal(customer, lock) {
  customerToLock.value = customer;
  isLocking.value = lock;
  isLockModalVisible.value = true;
}

function closeLockModal() {
  isLockModalVisible.value = false;
  customerToLock.value = null;
}

function confirmLockToggle() {
  if (!customerToLock.value) return;
  const customer = customers.value.find(c => c.id === customerToLock.value.id);
  if (customer) {
    customer.isLocked = isLocking.value;
    const action = isLocking.value ? 'locked' : 'unlocked';
    showToast(`Account ${customer.name} has been ${action}.`, 'success');
  }
  closeLockModal();
}

// === LOGIC FILTER PANEL ===
const isFilterVisible = ref(false);

// === LOGIC EXPORT ===
function exportToCSV() {
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'Status'];
  let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
  customers.value.forEach(customer => {
    const row = [
      customer.id,
      `"${customer.name}"`, 
      customer.email,
      customer.phone,
      `"${customer.address}"`,
      customer.isLocked ? 'Locked' : 'Active'
    ];
    csvContent += row.join(",") + "\n";
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "customer_export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<style src="./CustomerList.css"></style>