<template>
  <div class="supplier-orders-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <router-link :to="{ name: 'admin-suppliers' }" class="back-link">
          <i class="fas fa-arrow-left"></i>
          Back to Suppliers
        </router-link>
        <span v-if="supplier" class="supplier-badge">{{ supplier.name }}</span>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="navigateToNewOrder">
          <i class="fas fa-plus"></i>
          <span>New Order</span>
        </button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <div class="filter-group">
        <label style="font-size: 14px; font-weight: 500;" >Status</label>
        <select v-model="filters.status" @change="fetchOrders">
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Ordered">Ordered</option>
          <option value="Received">Received</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
      <div class="filter-group">
        <label style="font-size: 14px; font-weight: 500;" >From</label>
        <input type="date" v-model="filters.dateBegin" @change="fetchOrders" />
      </div>
      <div class="filter-group">
        <label style="font-size: 14px; font-weight: 500;" >To</label>
        <input type="date" v-model="filters.dateEnd" @change="fetchOrders" />
      </div>
      <button class="btn btn-secondary btn-sm" @click="clearFilters">
        <i class="fas fa-times"></i>
        Clear
      </button>
    </div>

    <!-- Orders Table -->
    <div class="table-container">
      <div v-if="loading" class="table-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Loading orders...</span>
      </div>

      <table v-else class="orders-table">
        <thead>
          <tr>
            <th style="font-size: 14px; font-weight: 500;" >Order ID</th>
            <th style="font-size: 14px; font-weight: 500;" >Status</th>
            <th style="font-size: 14px; font-weight: 500;" >Expected Arrival</th>
            <th style="font-size: 14px; font-weight: 500;" >Total Cost</th>
            <th style="font-size: 14px; font-weight: 500;" >Created</th>
            <th style="font-size: 14px; font-weight: 500;"  class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="orders.length === 0">
            <tr>
              <td colspan="6" class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <span>No supply orders found</span>
              </td>
            </tr>
          </template>

          <tr v-for="order in orders" :key="order._id">
            <td>
              <span class="order-id"
                >#{{ order._id.slice(-6).toUpperCase() }}</span
              >
            </td>
            <td>
              <span
                :class="[
                  'status-badge',
                  `status-${order.status.toLowerCase()}`,
                ]"
              >
                {{ order.status }}
              </span>
            </td>
            <td>
              <span class="order-date">{{
                formatDate(order.expected_arrival)
              }}</span>
            </td>
            <td>
              <span class="order-cost">{{
                formatPrice(order.total_cost_ordered)
              }}</span>
              <span
                v-if="
                  order.status === 'Received' &&
                  order.total_cost_received !== order.total_cost_ordered
                "
                class="received-cost"
              >
                (Received: {{ formatPrice(order.total_cost_received) }})
              </span>
            </td>
            <td>
              <span class="order-date">{{ formatDate(order.createdAt) }}</span>
            </td>
            <td class="col-actions">
              <div class="action-buttons">
                <template v-if="order.status === 'Draft'">
                  <router-link
                    :to="{
                      name: 'admin-supply-order-edit',
                      params: { id: order._id },
                    }"
                    class="action-btn btn-edit"
                  >
                    <i class="fas fa-edit"></i>
                    Edit
                  </router-link>
                  <button
                    class="action-btn btn-status"
                    @click="openStatusModal(order, 'Ordered')"
                  >
                    <i class="fas fa-arrow-right"></i>
                    Order
                  </button>
                </template>

                <template v-else-if="order.status === 'Ordered'">
                  <router-link
                    :to="{
                      name: 'admin-supply-order-view',
                      params: { id: order._id },
                    }"
                    class="action-btn btn-view"
                  >
                    <i class="fas fa-eye"></i>
                    View
                  </router-link>
                  <router-link
                    :to="{
                      name: 'admin-supply-order-view',
                      params: { id: order._id },
                      query: { receive: 'true' },
                    }"
                    class="action-btn btn-receive"
                  >
                    <i class="fas fa-check"></i>
                    Receive
                  </router-link>
                </template>

                <template v-else>
                  <router-link
                    :to="{
                      name: 'admin-supply-order-view',
                      params: { id: order._id },
                    }"
                    class="action-btn btn-view"
                  >
                    <i class="fas fa-eye"></i>
                    View
                  </router-link>
                </template>

                <button
                  v-if="order.status === 'Draft' || order.status === 'Ordered'"
                  class="action-btn btn-cancel"
                  @click="openCancelModal(order)"
                >
                  <i class="fas fa-times"></i>
                  Cancel
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination-footer">
      <span>{{ paginationText }}</span>
      <div class="page-controls">
        <span>Page</span>
        <select v-model="currentPage" @change="fetchOrders">
          <option v-for="page in totalPages" :key="page" :value="page">
            {{ page }}
          </option>
        </select>
        <button @click="prevPage" :disabled="currentPage <= 1">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button @click="nextPage" :disabled="currentPage >= totalPages">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Status Change Modal -->
    <ConfirmationModal
      v-if="isStatusModalVisible"
      title="Submit Order"
      :message="`Are you sure you want to change order status to <strong>Ordered</strong>? The order items will be locked for editing.`"
      confirm-text="Confirm"
      type="info"
      :loading="modalLoading"
      @close="closeStatusModal"
      @confirm="confirmStatusChange"
    />

    <!-- Cancel Order Modal -->
    <ConfirmationModal
      v-if="isCancelModalVisible"
      title="Cancel Order"
      :message="`Are you sure you want to cancel order <strong>#${orderToCancel?._id
        .slice(-6)
        .toUpperCase()}</strong>? This action cannot be undone.`"
      confirm-text="Cancel Order"
      type="danger"
      :loading="modalLoading"
      @close="closeCancelModal"
      @confirm="confirmCancel"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuth } from "@clerk/vue";
import axios from "axios";
import { formatPrice, formatDate } from "@/utilities/helper";
import ConfirmationModal from "@/components/ConfirmationModal.vue";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { getToken } = useAuth();
const supplierId = computed(() => route.params.supplierId);

// Data
const supplier = ref(null);
const orders = ref([]);
const loading = ref(false);

// Pagination
const currentPage = ref(1);
const perPage = ref(10);
const totalItems = ref(0);
const totalPages = computed(
  () => Math.ceil(totalItems.value / perPage.value) || 1
);
const paginationText = computed(() => {
  const start = (currentPage.value - 1) * perPage.value + 1;
  const end = Math.min(currentPage.value * perPage.value, totalItems.value);
  return totalItems.value > 0
    ? `${start} - ${end} of ${totalItems.value}`
    : "No results";
});

// Filters
const filters = reactive({
  status: "",
  dateBegin: "",
  dateEnd: "",
});

// Modals
const isStatusModalVisible = ref(false);
const orderToChangeStatus = ref(null);
const isCancelModalVisible = ref(false);
const orderToCancel = ref(null);
const modalLoading = ref(false);

async function fetchOrders() {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: perPage.value,
    };

    if (filters.status) params.status = filters.status;
    if (filters.dateBegin) params.dateBegin = filters.dateBegin;
    if (filters.dateEnd) params.dateEnd = filters.dateEnd;

    const token = await getToken.value();
    const response = await axios.get(
      `/api/admin/suppliers/${supplierId.value}/supply-orders`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: params,
      }
    );

    if (response.data?.success) {
      orders.value = response.data.data;
      supplier.value = response.data.supplier;
      totalItems.value = response.data.pagination.totalItems;
    }
  } catch (err) {
    console.error("Failed to fetch orders:", err);
    toast.error("Failed to load supply orders");
  } finally {
    loading.value = false;
  }
}

function navigateToNewOrder() {
  router.push({
    name: "admin-supply-order-new",
    query: { supplierId: supplierId.value },
  });
}

// Pagination
function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchOrders();
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchOrders();
  }
}

function clearFilters() {
  filters.status = "";
  filters.dateBegin = "";
  filters.dateEnd = "";
  currentPage.value = 1;
  fetchOrders();
}

// Status Change Modal
function openStatusModal(order, newStatus) {
  orderToChangeStatus.value = { order, newStatus };
  isStatusModalVisible.value = true;
}

function closeStatusModal() {
  isStatusModalVisible.value = false;
  orderToChangeStatus.value = null;
}

async function confirmStatusChange() {
  if (!orderToChangeStatus.value) return;

  const { order, newStatus } = orderToChangeStatus.value;

  modalLoading.value = true;
  try {
    const response = await axios.patch(
      `/api/admin/supply-orders/${order._id}/status`,
      {
        status: newStatus,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data?.success) {
      toast.success(`Order status changed to ${newStatus}`);
      closeStatusModal();
      fetchOrders();
    }
  } catch (err) {
    const message =
      err.response?.data?.message || "Failed to update order status";
    toast.error(message);
  } finally {
    modalLoading.value = false;
  }
}

// Cancel Modal
function openCancelModal(order) {
  orderToCancel.value = order;
  isCancelModalVisible.value = true;
}

function closeCancelModal() {
  isCancelModalVisible.value = false;
  orderToCancel.value = null;
}

async function confirmCancel() {
  if (!orderToCancel.value) return;

  modalLoading.value = true;
  try {
    const response = await axios.patch(
      `/api/admin/supply-orders/${orderToCancel.value._id}/status`,
      {
        status: "Cancelled",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data?.success) {
      toast.success("Order cancelled successfully");
      closeCancelModal();
      fetchOrders();
    }
  } catch (err) {
    const message = err.response?.data?.message || "Failed to cancel order";
    toast.error(message);
  } finally {
    modalLoading.value = false;
  }
}

onMounted(() => {
  fetchOrders();
});

watch(supplierId, () => {
  currentPage.value = 1;
  fetchOrders();
});
</script>

<style src="./SupplierOrdersPage.css"></style>
