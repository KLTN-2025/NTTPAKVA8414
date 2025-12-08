<template>
  <div>
    <div class="cart-banner-container">
      <img src="@/assets/images/Breadcrumbs.png" alt="Contact Us Banner" class="cart-banner-img" />
      <div class="cart-breadcrumbs-container">
        <nav class="cart-breadcrumbs">
          <router-link to="/">Home</router-link>
          <i class="fas fa-chevron-right breadcrumb-separator"></i> 
          <strong>Contact</strong>
        </nav>
      </div>
    </div>

    <div class="contact-page-container">
      
      <!--Main Form-->
      <div class="contact-split-layout">

        <div class="contact-info-panel">
          <h2>Contact Information</h2>
          <p>
            We're here to help! Reach out to us via phone, email, or visit our store.
          </p>
          
          <div class="info-block-new">
            <i class="fas fa-phone"></i>
            <div class="info-text-new">
              <span>(+84) 869 777777</span>
            </div>
          </div>

          <div class="info-block-new">
            <i class="fas fa-envelope"></i>
            <div class="info-text-new">
              <span>contact@healthycrave.com</span>
            </div>
          </div>

          <div class="info-block-new">
            <i class="fas fa-location-dot"></i>
            <div class="info-text-new">
              <span>123 Healthy St, Da Nang City</span>
            </div>
          </div>

          <div class="info-block-new support-hours">
            <i class="fas fa-clock"></i>
            <div class="info-text-new">
              <span>Mon - Fri: 8:00 AM - 6:00 PM</span>
              <span>Sat: 9:00 AM - 4:00 PM</span>
            </div>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="contact-form-panel">
          <h2>Send Us an Inquiry</h2>
          <p>
            Have a question or need assistance? Fill out the form below and our support team will get back to you as soon as possible.
          </p>
          
          <div class="form-row-grid">
            <div class="form-group">
              <label for="name">Your Name <span class="required">*</span></label>
              <input 
                type="text" 
                id="name" 
                v-model="form.name" 
                required 
                placeholder="Enter your full name"
                maxlength="100"
              />
            </div>
            <div class="form-group">
              <label for="phone">Phone Number <span class="required">*</span></label>
              <input 
                type="tel" 
                id="phone" 
                v-model="form.phone" 
                required 
                placeholder="e.g., 0901234567"
                pattern="(\+84|0)\d{9,10}"
                title="Please enter a valid Vietnamese phone number"
              />
            </div>
          </div>

          <div class="form-row-grid">
            <div class="form-group">
              <label for="email">Email Address (Optional)</label>
              <input 
                type="email" 
                id="email" 
                v-model="form.email" 
                placeholder="your.email@example.com"
              />
            </div>
            <div class="form-group">
              <label for="problemType">Type of Problem <span class="required">*</span></label>
              <select 
                id="problemType" 
                v-model="form.problemType" 
                required
                class="form-select"
              >
                <option value="" disabled>Select a problem type</option>
                <option v-for="type in problemTypes" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="details">
              Details <span class="required">*</span>
              <span class="char-count" :class="{ 'near-limit': form.details.length > 400 }">
                {{ form.details.length }}/500
              </span>
            </label>
            <textarea
              id="details"
              v-model="form.details"
              rows="5"
              required
              placeholder="Please describe your issue or question in detail..."
              maxlength="500"
            ></textarea>
          </div>

          <div v-if="formMessage.text" :class="['form-message', formMessage.type]">
            <i :class="formMessage.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
            {{ formMessage.text }}
          </div>

          <button type="submit" class="submit-btn" :disabled="isSending || !isFormValid">
            <i v-if="isSending" class="fas fa-spinner fa-spin"></i>
            {{ isSending ? 'Sending...' : 'Submit Inquiry' }}
          </button>
        </form>
      </div>
    </div>

    <div class="map-section">
      <iframe 
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d122690.6974201383!2d108.15616395!3d16.071731!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c792252a13%3A0x1df0cb4b867297e6!2zSOG6o2kgQ2jDonUsIMSQw6AgTuG6tW5nLCBWaWV0bmFt!5e0!3m2!1sen!2s!4v1678888888888!5m2!1sen!2s"
        width="100%" 
        height="450" 
        style="border:0;" 
        allowfullscreen="" 
        loading="lazy" 
        referrerpolicy="no-referrer-when-downgrade">
      </iframe>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router';
import axios from 'axios'
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useToast } from 'vue-toastification';
const toast = useToast()
const router = useRouter()

const problemTypes = ref([
  'Orders',
  'Products',
  'Shipping & Delivery',
  'Payment',
  'Website Bug',
  'Feedback & Suggestion',
  'Other'
])

const form = ref({
  name: '',
  phone: '',
  email: '',
  problemType: '',
  details: ''
})

const isSending = ref(false)
const formMessage = ref({ type: '', text: '' })

const isFormValid = computed(() => {
  return (
    form.value.name.trim() !== '' &&
    form.value.phone.trim() !== '' &&
    form.value.problemType !== '' &&
    form.value.details.trim() !== ''
  )
})

async function fetchProblemTypes() {
  try {
    const response = await axios.get('/api/support/problem-types')
    if (response.data?.success && response.data?.data) {
      problemTypes.value = response.data.data
    }
  } catch (error) {
    // Use hardcoded list as fallback
    console.log('Using default problem types')
  }
}

async function handleSubmit() {
  if (isSending.value || !isFormValid.value) return

  isSending.value = true
  formMessage.value = { type: 'info', text: 'Sending your inquiry...' }

  try {
    const payload = {
      sender_name: form.value.name.trim(),
      sender_phone: form.value.phone.trim(),
      sender_email: form.value.email.trim() || null,
      problem_type: form.value.problemType,
      details: form.value.details.trim()
    }

    const response = await axios.post('/api/support/inquiries', payload)

    if (response.data?.success) {
      formMessage.value = { 
        type: 'success', 
        text: response.data.message || 'Inquiry sent! Admin will contact you soon.' 
      }
      
      form.value = { 
        name: '', 
        phone: '', 
        email: '', 
        problemType: '', 
        details: '' 
      }
      toast.success("Inquiry sent! Admin will contact you soon")
      router.push("/")
    } else {
      toast.error("Error sending inquiry, please try again")
      throw new Error(response.data?.message || 'Failed to submit inquiry')
    }

  } catch (error) {
    console.error('Error submitting inquiry:', error)
    
    let errorMessage = 'Sorry, something went wrong. Please try again.'
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    formMessage.value = { 
      type: 'error', 
      text: errorMessage 
    }
  } finally {
    isSending.value = false
  }
}

// Fetch problem types on mount
onMounted(() => {
  fetchProblemTypes()
})
</script>

<style scoped src="@/styling/Contact.css"></style>