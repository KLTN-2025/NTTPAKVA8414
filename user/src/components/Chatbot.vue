<template>
  <div class="chatbot-container">
    <!-- Chat Window -->
    <Transition name="chat-window-fade">
      <div v-if="chatStore.isOpen" class="chatbot-window">
        <!-- Header -->
        <div class="chat-header">
          <h4><i class="fa-solid fa-seedling"></i> HealthyCrave Bot</h4>
          <div class="header-buttons">
            <button 
              @click="handleRestart" 
              class="header-btn restart-btn"
              title="Restart conversation"
              :disabled="chatStore.isLoading"
            >
              <i class="fa-solid fa-rotate-right"></i>
            </button>
            <button @click="chatStore.close" class="header-btn close-btn">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div class="chat-body" ref="chatBody">
          <div 
            v-for="msg in chatStore.messages" 
            :key="msg.id" 
            :class="['message', msg.sender]"
          >
            <p v-html="formatMessage(msg.text)"></p>
          </div>
          
          <!-- Typing Indicator -->
          <div v-if="chatStore.isLoading" class="message bot">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="chat-footer">
          <!-- Suggestions -->
          <div v-if="chatStore.suggestions.length > 0 && !chatStore.isLoading" class="suggestion-chips">
            <button 
              v-for="suggestion in chatStore.suggestions" 
              :key="suggestion" 
              @click="handleSuggestionClick(suggestion)"
              :disabled="chatStore.isLoading"
            >
              {{ suggestion }}
            </button>
          </div>
          
          <!-- Input -->
          <div class="chat-input-row">
            <input 
              type="text" 
              v-model="inputMessage" 
              @keyup.enter="handleSend" 
              placeholder="Type your message..."
              ref="inputField"
              :disabled="chatStore.isLoading"
            />
            <button 
              @click="handleSend" 
              :disabled="chatStore.isLoading || !inputMessage.trim()"
            >
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- FAB Button -->
    <button 
      @click="handleToggle" 
      class="chatbot-fab" 
      :class="{ 'is-open': chatStore.isOpen }"
    >
      <i :class="chatStore.isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-comments'"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import { useChatStore } from '@/stores/chatStore'

const chatStore = useChatStore()
const inputMessage = ref('')
const chatBody = ref(null)
const inputField = ref(null)

/**
 * Toggle chat window
 */
function handleToggle() {
  chatStore.toggle()
  if (chatStore.isOpen) {
    nextTick(() => {
      inputField.value?.focus()
      scrollToBottom()
    })
  }
}

/**
 * Send message
 */
async function handleSend() {
  const text = inputMessage.value.trim()
  if (!text || chatStore.isLoading) return
  
  inputMessage.value = ''
  await chatStore.sendMessage(text)
  scrollToBottom()
}

/**
 * Handle suggestion click
 */
async function handleSuggestionClick(suggestion) {
  if (chatStore.isLoading) return
  await chatStore.selectSuggestion(suggestion)
  scrollToBottom()
}

/**
 * Handle restart
 */
function handleRestart() {
  if (chatStore.isLoading) return
  chatStore.restart()
  scrollToBottom()
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
  nextTick(() => {
    if (chatBody.value) {
      chatBody.value.scrollTop = chatBody.value.scrollHeight
    }
  })
}

/**
 * Format message text (handle newlines)
 */
function formatMessage(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

// Watch for new messages to auto-scroll
watch(
  () => chatStore.messages.length,
  () => {
    scrollToBottom()
  }
)

// Watch for loading state to scroll to typing indicator
watch(
  () => chatStore.isLoading,
  (loading) => {
    if (loading) {
      scrollToBottom()
    }
  }
)
</script>

<style src="./Chatbot.css"></style>