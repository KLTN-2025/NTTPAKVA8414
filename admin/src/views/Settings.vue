<template>
  <div class="settings-page">    
    <div class="card">
      <div class="card-header">
        <h4>Display Settings</h4>
      </div>
      <div class="card-body">
        <div class="setting-row">
          <div class="setting-info">
            <h5>Night Mode</h5>
            <p>Switch between light and dark theme.</p>
          </div>
          <div class="setting-action">
            <label class="toggle-switch">
              <input type="checkbox" v-model="isNightMode" @change="toggleNightMode" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isNightMode = ref(false);

// Hàm cập nhật giao diện
function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark-mode');
    isNightMode.value = true;
  } else {
    document.documentElement.classList.remove('dark-mode');
    isNightMode.value = false;
  }
}

// Hàm khi bấm nút gạt
function toggleNightMode() {
  // Lưu lựa chọn vào localStorage
  localStorage.setItem('theme', isNightMode.value ? 'dark' : 'light');
  applyTheme(isNightMode.value);
}

// === LOGIC MỚI ===
// Khi trang được tải, kiểm tra xem người dùng đã chọn theme gì lần trước
onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark') {
    applyTheme(true);
  } else if (savedTheme === 'light') {
    applyTheme(false);
  } else {
    // Nếu chưa lưu, kiểm tra cài đặt của hệ thống (OS)
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark);
  }
});
</script>

<style scoped src="@/styling/Settings.css"></style>