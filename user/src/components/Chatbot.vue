<template>
  <div class="chatbot-container">
    <Transition name="chat-window-fade">
      <div v-if="isOpen" class="chatbot-window">
        <div class="chat-header">
          <h4><i class="fa-solid fa-seedling"></i> Tư vấn Dinh dưỡng AI</h4>
          <button @click="toggleChat" class="close-btn">&times;</button>
        </div>

        <div class="chat-body" ref="chatBody">
          <div v-for="(msg, index) in messages" :key="index" 
               :class="['message', msg.sender]">
            <p>{{ msg.text }}</p>
          </div>
          
          <div v-if="isBotTyping" class="message bot">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
        
        <div class="chat-footer">
          <div v-if="showSuggestions" class="suggestion-chips">
            <button 
              v-for="suggestion in suggestions" 
              :key="suggestion" 
              @click="handleSuggestionClick(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>
          
          <div class="chat-input-row"> 
            <input 
              type="text" 
              v-model="newMessage" 
              @keyup.enter="sendMessage" 
              placeholder="Hỏi tôi về dinh dưỡng..."
              ref="inputField" :disabled="isLoading" />
            <button @click="sendMessage" :disabled="isLoading"> <i class="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <button @click="toggleChat" class="chatbot-fab" :class="{ 'is-open': isOpen }">
      <i :class="isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-comments'"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import './Chatbot.css'

const isOpen = ref(false)
const newMessage = ref('')
const chatBody = ref(null) 

// --- CÁC BIẾN MỚI ---
const inputField = ref(null) // Để focus vào ô input
const isBotTyping = ref(false) // Để hiển thị "..."
const isLoading = ref(false) // Để vô hiệu hóa nút
// --------------------

const suggestions = ref([
  'Tạo lộ trình dinh dưỡng',
  'Tìm công thức nấu ăn',
  'Sản phẩm hữu cơ là gì?'
])
const showSuggestions = ref(true) 

const messages = ref([
  { sender: 'bot', text: 'Chào bạn! Tôi có thể giúp bạn tạo lộ trình dinh dưỡng hoặc tìm công thức nấu ăn.' }
])

// --- CẬP NHẬT: Tự động focus khi mở ---
const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    // Chờ cho DOM được cập nhật
    nextTick(() => {
      inputField.value?.focus() // Tự động focus
    })
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBody.value) {
      chatBody.value.scrollTop = chatBody.value.scrollHeight
    }
  })
}

const handleSuggestionClick = (suggestion) => {
  if (isLoading.value) return; 
  newMessage.value = suggestion
  sendMessage()
}

// --- CẬP NHẬT: Thêm logic isBotTyping ---
const sendMessage = () => {
  const text = newMessage.value.trim()
  if (text === '' || isLoading.value) return;

  isLoading.value = true; 
  showSuggestions.value = false; 
  messages.value.push({ sender: 'user', text: text })
  newMessage.value = ''
  scrollToBottom() // Cuộn xuống ngay khi user gửi

  // Bật "đang gõ"
  isBotTyping.value = true;
  nextTick(scrollToBottom); // Cuộn xuống để xem "đang gõ"

  // Giả lập AI trả lời (tăng lên 1.5s cho thật hơn)
  setTimeout(() => {
    isBotTyping.value = false; // Tắt "đang gõ"
    
    messages.value.push({ 
      sender: 'bot', 
      text: 'Đây là câu trả lời giả lập. Để trả lời thật, cần kết nối backend.' 
    })
    
    isLoading.value = false; // Tải xong
    showSuggestions.value = true; // Hiển thị lại gợi ý
    scrollToBottom() // Cuộn xuống xem tin nhắn mới
  }, 1500) // Tăng thời gian chờ
}
</script>