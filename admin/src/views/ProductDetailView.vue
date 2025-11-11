<template>
  <div class="product-detail-page card">
    <div class="card-header">
      <h4>Product Details (Read-Only)</h4>
    </div>
    <div class="card-body">
      <p>Đang xem chi tiết cho sản phẩm có ID: <strong>{{ productId }}</strong></p>
      
      </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const productId = ref(route.params.id);
</script>

<style scoped>
/* Dùng chung style 'card' từ các file CSS khác (nếu bạn có file global) */
/* Nếu không, đây là style tạm: */
.card {
  background-color: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}
.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}
.card-header h4 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}
.card-body {
  padding: 1.5rem;
  font-size: 1rem;
  color: #111827;
}
</style>