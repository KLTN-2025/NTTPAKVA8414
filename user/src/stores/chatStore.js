// stores/chatStore.js

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chatbotApi } from '@/services/chatbotApi'
import { useCartStore } from '@/stores/cartStore'
import { formatPrice } from '@/utilities/helper'

export const useChatStore = defineStore('chat', () => {
  // State
  const messages = ref([])
  const currentFlow = ref(null)
  const flowState = ref({})
  const isLoading = ref(false)
  const isOpen = ref(false)
  const suggestions = ref([])
  const error = ref(null)
  
  // Configuration
  const MAX_MESSAGES = 20
  
  // Getters
  const messageCount = computed(() => messages.value.length)
  const hasActiveFlow = computed(() => currentFlow.value !== null)
  const conversationHistory = computed(() => {
    return messages.value.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }))
  })
  
  // Actions
  async function initialize() {
    if (messages.value.length > 0) {
      return
    }
    
    try {
      isLoading.value = true
      const response = await chatbotApi.getGreeting()
      
      if (response.success) {
        addBotMessage(response.reply)
        suggestions.value = response.suggestions || []
        currentFlow.value = response.currentFlow
        flowState.value = response.flowState || {}
      } else {
        addBotMessage("Hi! I'm HealthyCrave Bot. I can help you with nutrition guidance or building a recipe. What would you like to do?")
        suggestions.value = ['Nutrition Guidance', 'Build a Recipe']
      }
    } catch (err) {
      console.error('Failed to initialize chat:', err)
      addBotMessage("Hi! I'm HealthyCrave Bot. I can help you with nutrition guidance or building a recipe. What would you like to do?")
      suggestions.value = ['Nutrition Guidance', 'Build a Recipe']
    } finally {
      isLoading.value = false
    }
  }

  async function sendMessage(text) {
    if (!text || text.trim() === '' || isLoading.value) {
      return
    }
    
    const trimmedText = text.trim()
    
    // Add user message
    addUserMessage(trimmedText)
    suggestions.value = []
    error.value = null
    
    try {
      isLoading.value = true
      
      
      const response = await chatbotApi.sendMessage({
        message: trimmedText,
        conversationHistory: conversationHistory.value.slice(-MAX_MESSAGES),
        currentFlow: currentFlow.value,
        flowState: flowState.value
      })
      
      if (response.success) {
        // Update flow state
        currentFlow.value = response.currentFlow
        flowState.value = response.flowState || {}
        suggestions.value = response.suggestions || []
        
        // Handle cart action if present
        if (response.action?.type === 'addToCart') {
          await handleCartAction(response.action)
        } else if (response.reply) {
          addBotMessage(response.reply)
        }
        
        if (response.autoProgress) {
          await sendMessage('confirm')
        }
      } else {
        error.value = response.error || 'Failed to get response'
        addBotMessage(response.error || "I'm having trouble processing that. Please try again.")
      }
    } catch (err) {
      console.error('Chat error:', err)
      error.value = err.message
      addBotMessage("I'm having trouble connecting. Please try again.")
    } finally {
      isLoading.value = false
    }
  }
  
  async function handleCartAction(action) {
    const cartStore = useCartStore()
    let failedItems = []
    
    for (const product of action.products) {
      if (cartStore.items.length >= 10) {
        failedItems.push(product.name)
        continue
      }
      
      cartStore.addItemToCart({
        _id: product.productId,
        name: product.name,
        price: product.price,
        stock: product.stock || 999,
        images: [product.image]
      }, product.quantity)
    }
    
    let message = ''
    
    if (addedCount > 0) {
      const total = cartStore.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      message += `Your cart has been updated! Cart total: ${formatPrice(total)}`
    }
    
    if (failedItems.length > 0) {
      message += `\nCouldn't add: ${failedItems.join(', ')} (cart limit reached).`
    }
    
    message += '\n\nGlad I could help! Feel free to ask anytime.'
    
    addBotMessage(message)
    suggestions.value = ['Nutrition Guidance', 'Build a Recipe']
  }
  
  function addUserMessage(text) {
    messages.value.push({
      id: Date.now(),
      sender: 'user',
      text,
      timestamp: new Date()
    })
    trimMessages()
  }

  function addBotMessage(text) {
    messages.value.push({
      id: Date.now(),
      sender: 'bot',
      text,
      timestamp: new Date()
    })
    trimMessages()
  }
  

  function trimMessages() {
    if (messages.value.length > MAX_MESSAGES) {
      messages.value = messages.value.slice(-MAX_MESSAGES)
    }
  }

  async function selectSuggestion(suggestion) {
    await sendMessage(suggestion)
  }

  function restart() {
    messages.value = []
    currentFlow.value = null
    flowState.value = {}
    suggestions.value = []
    error.value = null
    initialize()
  }

  function toggle() {
    isOpen.value = !isOpen.value
    if (isOpen.value && messages.value.length === 0) {
      initialize()
    }
  }

  function open() {
    isOpen.value = true
    if (messages.value.length === 0) {
      initialize()
    }
  }

  function close() {
    isOpen.value = false
  }

  function clearMessages() {
    messages.value = []
    currentFlow.value = null
    flowState.value = {}
    suggestions.value = []
  }
  
  return {
    messages,
    currentFlow,
    flowState,
    isLoading,
    isOpen,
    suggestions,
    error,
    
    messageCount,
    hasActiveFlow,
    conversationHistory,
    
    initialize,
    sendMessage,
    selectSuggestion,
    restart,
    toggle,
    open,
    close,
    clearMessages,
    addUserMessage,
    addBotMessage,
  }
}, {
  persist: {
    storage: localStorage,
    paths: ['messages', 'currentFlow', 'flowState', 'suggestions']
  }
})