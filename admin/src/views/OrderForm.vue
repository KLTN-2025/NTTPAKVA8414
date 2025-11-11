<template>
  <div class="order-form-page">
    <nav class="form-breadcrumbs">
      <router-link to="/">Dashboard</router-link>
      <i class="fas fa-chevron-right"></i>
      <router-link to="/orders">Orders</router-link>
      <i class="fas fa-chevron-right"></i>
      <strong>{{ isEditMode ? `Edit Order #${orderId}` : 'New Order' }}</strong>
    </nav>

    <form @submit.prevent="handleSubmit" class="product-form-layout">
      
      <div class="form-column-left">
        <div class="card">
          <div class="card-header">
            <h4>Customer Details</h4>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label>Customer Name</label>
              <input type="text" v-model="order.customer.name" disabled />
            </div>
            <div class="form-row-grid-2">
              <div class="form-group">
                <label>Email</label>
                <input type="text" v-model="order.customer.email" disabled />
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input type="text" v-model="order.customer.phone" disabled />
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h4>Update Status</h4>
          </div>
          <div class="card-body">
            <div class="form-row-grid-2">
              <div class="form-group">
                <label for="paymentStatus">Payment Status</label>
                <select id="paymentStatus" v-model="order.payment">
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
              <div class="form-group">
                <label for="orderStatus">Order Status</label>
                <select id="orderStatus" v-model="order.status">
                  <option value="Shipping">Shipping</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-column-right">
        <div class="card">
          <div class="card-header">
            <h4>Order Items</h4>
          </div>
          <div class="card-body">
            <div v-for="item in order.items" :key="item.name" class="order-item-stub">
              <img :src="item.image" :alt="item.name" />
              <span class="item-name">{{ item.name }}</span>
              <span class="item-qty">x {{ item.qty }}</span>
              <span class="item-price">{{ item.price }}</span>
            </div>
            <hr class="item-divider" />
            <div class="order-total-stub">
              <strong>Total:</strong>
              <strong>{{ order.total }}</strong>
            </div>
          </div>
        </div>
        
        <div class="form-action-buttons">
          <router-link to="/orders" class="btn btn-secondary">
            Cancel
          </router-link>
          <button type="submit" class="btn btn-primary">
            {{ isEditMode ? 'Save Changes' : 'Create Order' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute();
const router = useRouter();

const orderId = ref(route.params.id);
const isEditMode = computed(() => !!orderId.value);

// Hàm format tiền tệ VNĐ
const formatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

// Dữ liệu giả lập cho form
const order = ref({
  id: '',
  customer: { name: '', email: '', phone: '' },
  payment: 'Unpaid',
  status: 'Shipping',
  total: formatter.format(0),
  items: []
});

onMounted(() => {
  if (isEditMode.value) {
    // Giả lập tải data cho đơn hàng
    console.log("Fetching data for order ID:", orderId.value);
    // (Trong dự án thật, bạn sẽ gọi API ở đây)
    if (orderId.value === 'HC1021') { // Dựa trên ID từ trang list
      order.value = {
        id: 'HC1021',
        customer: {
          name: 'Trần Văn An',
          email: 'tranvanan@example.com',
          phone: '0905 123 456'
        },
        payment: 'Paid',
        status: 'Shipping',
        total: formatter.format(250000),
        items: [
          { name: 'Bông Cải Xanh', qty: 2, price: formatter.format(50000), image: 'https://via.placeholder.com/40' },
          { name: 'Ức Gà', qty: 3, price: formatter.format(200000), image: 'https://via.placeholder.com/40' }
        ]
      }
    } else {
       console.log("Mock data not found, showing defaults.");
    }
  } else {
    // (Đây là logic cho trang "New Order")
    console.log("Creating new order");
  }
});

function handleSubmit() {
  if (isEditMode.value) {
    console.log("Updating order:", orderId.value, order.value);
    alert("Order Updated!");
  } else {
    console.log("Creating order:", order.value);
    alert("Order Created!");
  }
  router.push('/orders');
}
</script>

<style src="./OrderForm.css"></style>