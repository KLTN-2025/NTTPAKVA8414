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
            <span>123 Healthy St, Ho Chi Minh City</span>
          </div>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="contact-form-panel">
        <h2>Just Say Hello!</h2>
        <p>
          Do you fancy saying hi to me or you want to get started with your project and you need my help? Feel free to contact me.
        </p>
        
        <div class="form-row-grid">
          <div class="form-group">
            <label for="name" class="sr-only">Your Name</label>
            <input type="text" id="name" v-model="form.name" required placeholder="Template Cookie" />
          </div>
          <div class="form-group">
            <label for="email" class="sr-only">Your Email</label>
            <input type="email" id="email" v-model="form.email" required placeholder="zakirsoft@gmail.com" />
          </div>
        </div>

        <div class="form-group">
          <label for="message" class="sr-only">Message</label>
          <textarea id="message" v-model="form.message" rows="5" required placeholder="Hello!"></textarea>
        </div>
        <div class="form-group">
          <label for="subject" class="sr-only">Subject</label>
          <input type="text" id="subject" v-model="form.subject" required placeholder="Subjects" />
        </div>

        <div v-if="formMessage.text" :class="['form-message', formMessage.type]">
          {{ formMessage.text }}
        </div>

        <button type="submit" class="submit-btn" :disabled="isSending">
          {{ isSending ? 'Sending...' : 'Send Message' }}
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
import { ref } from 'vue'
import '@fortawesome/fontawesome-free/css/all.min.css';

// State cho Form
const form = ref({
  name: '',
  email: '',
  subject: '',
  message: '' // "Hello!"
});

// State cho UX
const isSending = ref(false);
const formMessage = ref({ type: '', text: '' }); // type = 'success' hoặc 'error'

// Hàm sleep giả lập thời gian gửi
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleSubmit() {
  if (isSending.value) return; 

  isSending.value = true;
  formMessage.value = { type: 'info', text: 'Sending your message...' };

  try {
    await sleep(1500); 
    
    formMessage.value = { 
      type: 'success', 
      text: 'Thank you for your message! We will get back to you soon.' 
    };
    
    form.value = { name: '', email: '', subject: '', message: '' };

  } catch (error) {
    console.error(error);
    formMessage.value = { 
      type: 'error', 
      text: 'Sorry, something went wrong. Please try again.' 
    };
  } finally {
    isSending.value = false;
  }
}
</script>

<style scoped src="./Contact.css"></style>