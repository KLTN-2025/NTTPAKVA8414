// services/chatbotApi.js
import axios from 'axios'

const API_TIMEOUT = 15000

/**
 * Get initial greeting message
 */
export async function getGreeting() {
  try {
    const response = await axios.get('/api/chatbot/greeting', {
      timeout: API_TIMEOUT
    })
    return response.data
  } catch (error) {
    console.error('Greeting API error:', error)
    return {
      success: false,
      error: getErrorMessage(error)
    }
  }
}

/**
 * Send a message to the chatbot
 */
export async function sendMessage(payload) {
  try {
    const response = await axios.post('/api/chatbot/message', payload, {
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch (error) {
    console.error('Chat API error:', error)
    
    if (error.response?.status === 429) {
      const retryAfter = error.response.data?.retryAfter || 60
      return {
        success: false,
        error: `You're sending messages too quickly. Please wait ${retryAfter} seconds.`,
        isRateLimited: true,
        retryAfter
      }
    }
    
    return {
      success: false,
      error: getErrorMessage(error)
    }
  }
}

/**
 * Extract user-friendly error message
 */
function getErrorMessage(error) {
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.'
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  
  if (error.response?.status === 500) {
    return 'Server error. Please try again later.'
  }
  
  if (error.response?.status === 429) {
    return "You're sending messages too quickly. Please wait a moment."
  }
  
  if (!navigator.onLine) {
    return 'No internet connection. Please check your network.'
  }
  
  return "I'm having trouble connecting. Please try again."
}

export const chatbotApi = {
  getGreeting,
  sendMessage
}

export default chatbotApi