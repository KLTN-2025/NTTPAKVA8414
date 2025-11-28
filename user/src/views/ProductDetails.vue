<template>
  <div class="min-h-screen w-full bg-gray-50">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div class="bg-red-50 border border-red-200 rounded-lg p-8 transition-all hover:shadow-lg">
        <h2 class="text-2xl font-bold text-red-800 mb-2">Error Loading Product</h2>
        <p class="text-red-600 mb-4">{{ error }}</p>
        <button @click="fetchProduct" class="mt-4 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all hover:shadow-md">
          Try Again
        </button>
      </div>
    </div>

    <!-- Product Content -->
    <div v-else-if="product" class="flex flex-col items-center mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <!-- Breadcrumb -->
      <nav style="text-align: left;" class="mb-8 w-[90%]">
        <ol  class="flex space-x-2 text-gray-500 gap-2 text-lg sm:text-xl">
          <li><a href="/" class="hover:text-green-600 transition-colors">Home</a></li>
          <li> / </li>
          <li><a href="/" class="hover:text-green-600 transition-colors">{{ product.category?.name }}</a></li>
          <li> / </li>
          <li class="text-gray-900 font-bold">{{ product.name }}</li>
        </ol>
      </nav>

      <div style="padding: 0.5rem;" class="w-[90%] my-4 shadow-lg">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
        <!-- Image Carousel -->
        <div style="padding-top: 0.25rem;" class="space-y-4">
          <div class="bg-white rounded-xl shadow-md overflow-hidden aspect-square relative transition-shadow hover:shadow-xl">
            <img 
              :src="buildImagePath(product.images[currentImageIndex]) || 
              'https://via.placeholder.com/600x600?text=No+Image'" 
              :alt="product.name"
              class="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
            >
            
            <!-- Carousel Navigation -->
            <button 
              v-if="product.images.length > 1"
              @click="previousImage"
              class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all hover:scale-110"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              v-if="product.images.length > 1"
              @click="nextImage"
              class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all hover:scale-110"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <!-- Image Thumbnails -->
          <div v-if="product.images.length > 1" class="flex gap-3 overflow-x-auto pb-2">
            <button
              v-for="(image, index) in product.images"
              :key="index"
              @click="currentImageIndex = index"
              :class="[
                'flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 transition-all',
                currentImageIndex === index ? 'border-green-600 shadow-md' : 'border-gray-200 hover:border-gray-400'
              ]"
            >
              <img :src="buildImagePath(image)" :alt="`${product.name} - ${index + 1}`" class="w-full h-full object-cover">
            </button>
          </div>
        </div>

        <!-- Product Info -->
        <div class="space-y-12">
          <!-- Title and Brand -->
          <div style="padding-bottom: 0.25rem;">
            <p v-if="product.brand" class="text-xl sm:text-2xl font-medium text-gray-500">{{ product.brand.name }}</p>
            <h1 
            style="padding-bottom: 0.25rem 0;"
            class="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{{ product.name }}</h1>

            <p style="padding-bottom: 0.25rem;" class="text-lg text-gray-600">
              SKU: <span class="text-green-700 font-bold">{{ product.sku }}</span>
            </p>
            <!-- Attributes/Tags -->
            <div v-if="product.attributes.length" class="flex flex-wrap gap-2">
              <span
                v-for="attr in product.attributes"
                :key="attr._id"
                style="padding: 0 0.5rem"
                class="inline-block text-base sm:text-lg font-medium bg-gray-100 text-gray-700 rounded-full transition-all hover:bg-gray-200"
              >
                {{ attr.name }}
              </span>
            </div>
          </div>

          <!-- Description -->
          <div style="padding: 0.25rem 0;" class="border-y border-gray-200">
            <h2 class="font-medium text-lg sm:text-xl">Description</h2>
            <p class="text-gray-600 text-base sm:text-lg leading-relaxed">{{ product.description }}</p>
          </div>

          <!-- Price -->
          <div class="py-6 border-y border-gray-200">
            <div class="text-3xl sm:text-4xl font-bold text-green-600">
              {{ formatPrice(product.price) }}
            </div>
            <p class="text-base sm:text-lg text-gray-500 mt-2">{{ product.size }} {{ product.unit }}</p>
          </div>

          <!-- Stock Status -->
          <div style="margin: 0.5rem 0;">
            <span v-if="product.in_stock" class="inline-flex items-center px-4 py-2 rounded-full text-lg font-medium bg-green-100 text-green-800 transition-all hover:bg-green-200">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              In Stock ({{ product.stock }} available)
            </span>
            <span v-else class="inline-flex items-center px-4 py-2 rounded-full text-lg font-medium bg-red-100 text-red-800">
              Out of Stock
            </span>
          </div>



          <!-- Quantity Selector & Add to Cart -->
          <div class="space-y-4 py-4">
            <div>
              <label 
              style="margin: 0.5rem 0;"
              class="block text-lg sm:text-xl font-medium text-gray-700">Quantity</label>
              <div class="flex items-center gap-4">
                <button
                  @click="decreaseQuantity"
                  :disabled="quantity <= 1"
                  class="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:border-green-500"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                  </svg>
                </button>
                <input
                  v-model.number="quantity"
                  type="number"
                  min="1"
                  :max="product.stock"
                  class="w-20 h-10 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                <button
                  @click="increaseQuantity"
                  :disabled="quantity >= product.stock"
                  class="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:border-green-500"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              @click="addToCart"
              :disabled="!product.in_stock || addingToCart"
              style="margin-top: 1rem; padding: 0.25rem 0;"
              class="w-full bg-green-600 text-white text-lg rounded-lg font-semibold hover:bg-green-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              <span v-if="addingToCart">Adding to Cart...</span>
              <span v-else-if="!product.in_stock">Out of Stock</span>
              <span v-else>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
      </div>
      

      <!-- Reviews Section -->
      <div style="margin-top: 1rem; padding: 0.5rem;" class="bg-white rounded-xl shadow-md p-6 sm:p-8 lg:p-10 w-[90%]">
        <h2 class="text-xl sm:text-2xl font-bold mb-8">Customer Reviews</h2>

        <div class="mb-10 pb-10 border-b border-gray-200">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

            <div class="text-center md:text-left">
              <div class="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{{ reviews.avgRating }}</div>
              <div class="flex justify-center md:justify-start mb-3">
                <svg v-for="star in 5" :key="star" 
                  :class="star <= Math.round(reviews.avgRating) ? 'text-yellow-400' : 'text-gray-300'"
                  class="w-6 h-6 sm:w-7 sm:h-7 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <p class="text-gray-600 text-base sm:text-lg">Based on {{ reviews.totalReviews }} reviews</p>
            </div>

            <div class="space-y-3">
              <div v-for="(value, key) in reviews.breakdown" :key="key" class="flex items-center gap-4">
                <span class="text-lg font-medium w-16">{{ key }} star</span>
                <div class="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-yellow-400 rounded-full transition-all duration-500"
                    :style="{ width: (reviews.total_reviews == 0 ? 0 : 100 * value / reviews.totalReviews) + '%' }"
                  ></div>
                </div>
                <span class="text-lg text-gray-600 w-16 text-right">{{ reviews.totalReviews == 0 ? 0 : Math.round(100 * value / reviews.totalReviews) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <SignedIn>
          <div style="margin-top: 0.5rem;" class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <button
              @click="showReviewForm = !showReviewForm"
              :disabled="isSignedIn"
              class="text-lg px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
            >
              Write a Review
            </button>
          </div>
        </SignedIn>

        <div v-if="showReviewForm" class="mb-10 p-6 sm:p-8 bg-gray-50 rounded-xl transition-all">
          <form @submit.prevent="submitReview" class="space-y-6">
            <div>
              <label class="block text-lg font-medium text-gray-700 mb-3">Rating</label>
              <div class="flex gap-2">
                <button
                  v-for="star in 5"
                  :key="star"
                  type="button"
                  @click="newReview.rating = star"
                  class="focus:outline-none transition-transform hover:scale-110"
                >
                  <svg
                    :class="star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'"
                    class="w-10 h-10 hover:text-yellow-400 transition-colors"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-lg font-medium text-gray-700 mb-3">Your Review</label>
              <textarea
                v-model="newReview.comment"
                rows="5"
                placeholder="Share your experience with this product..."
                class="text-lg w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              ></textarea>
            </div>

            <div class="flex gap-4">
              <button
                type="submit"
                :disabled="!newReview.rating || submittingReview"
                class="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {{ submittingReview ? 'Submitting...' : 'Submit Review' }}
              </button>
              <button
                type="button"
                @click="cancelReview"
                class="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div v-if="reviewsLoading" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
        </div>

        <div v-else-if="reviews.length === 0" class="text-center py-16 text-gray-500">
          <svg class="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <p class="text-xl font-medium">No reviews yet</p>
          <p class="text-base mt-2">Be the first to review this product!</p>
        </div>

        <div v-else class="space-y-6">
          <div
            v-for="review in reviews.reviews"
            :key="review._id"
            class="pb-6 border-b border-gray-200 last:border-0 transition-all hover:bg-gray-50 p-4 rounded-lg"
          >
            <div class="flex-1">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold text-gray-900 text-lg">{{ review.reviewer.name }}</h4>
                <span class="text-sm text-gray-500">{{ formatDate(review.created_at) }}</span>
              </div>

              <div class="flex mb-3">
                <svg v-for="star in 5" :key="star"
                  :class="star <= review.rating ? 'text-yellow-400' : 'text-gray-300'"
                  class="w-5 h-5 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>

              <p v-if="review.comment" class="text-gray-700 text-base leading-relaxed">{{ review.comment }}</p>
              <p v-else class="text-gray-400 italic">No comment provided</p>
            </div>
          </div>
        </div>

        <div v-if="reviewPagination.total_pages > 1" class="mt-10 flex justify-center gap-3">
          <button
            @click="fetchReviews(reviewPagination.current_page - 1)"
            :disabled="!reviewPagination.has_prev_page"
            class="px-5 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>

          <button
            v-for="page in visiblePages"
            :key="page"
            @click="fetchReviews(page)"
            :class="[
              'px-5 py-2 border-2 rounded-lg transition-all',
              page === reviewPagination.current_page
                ? 'bg-green-600 text-white border-green-600'
                : 'border-gray-300 hover:bg-gray-50'
            ]"
          >
            {{ page }}
          </button>

          <button
            @click="fetchReviews(reviewPagination.current_page + 1)"
            :disabled="!reviewPagination.has_next_page"
            class="px-5 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

import { formatPrice, formatDate, buildImagePath } from '@/utilities/helper';
import { SignedIn, useAuth } from '@clerk/vue';
import { useCartStore } from '@/stores/cartStore'
import { useToast } from 'vue-toastification';

const route = useRoute();
const emit = defineEmits(['cart-updated']);
const cartStore = useCartStore()
const { getToken } = useAuth()
const toast = useToast()

/* --- State --- */
const product = ref(null);
const reviews = ref();
const loading = ref(true);
const reviewsLoading = ref(false);
const error = ref(null);
const currentImageIndex = ref(0);
const quantity = ref(1);
const addingToCart = ref(false);
const reviewPagination = reactive({
  page: 1,
  limit: 10,
  total_items: 0,
  total_pages: 0,
  has_next_page: false,
  has_prev_page: false
});
const showReviewForm = ref(false);
const newReview = reactive({
  rating: 0,
  comment: ''
});
const submittingReview = ref(false);
const productId = computed(() => route.params.id);

const visiblePages = computed(() => {
  const pages = [];
  const total = reviewPagination.total_pages || 0;
  const current = reviewPagination.current_page || 1;

  let start = Math.max(1, current - 2);
  let end = Math.min(total, current + 2);

  if (end - start < 4) {
    if (start === 1) {
      end = Math.min(total, start + 4);
    } else if (end === total) {
      start = Math.max(1, end - 4);
    }
  }

  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

/* --- Methods / Actions --- */
async function fetchProduct() {
  try {
    loading.value = true;
    error.value = null;

    const response = await axios.get(`/api/products/${productId.value}`);

    if (response.data?.success) {
      product.value = response.data.data;
      currentImageIndex.value = 0;
    } else {
      error.value = response.data?.message || 'Failed to load product';
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load product. Please try again.';
    console.error('Error fetching product:', err);
  } finally {
    loading.value = false;
  }
}

async function fetchReviews(page = 1) {
  try {
    reviewsLoading.value = true;
    const response = await axios.get(`/api/products/${productId.value}/reviews`, {
      params: {
        page,
        limit: reviewPagination.per_page,
      }
    });

    if (response.data?.success) {
      reviews.value = response.data.data || null;
      console.log(reviews.value)
      reviewPagination.page = reviews.value.page
      reviewPagination.limit = reviews.value.limit
      reviewPagination.total_items = reviews.value.totalReviews
      reviewPagination.total_pages = reviews.value.total_pages
      reviewPagination.has_next_page = reviewPagination.page < reviewPagination.total_pages
      reviewPagination.has_prev_page = reviewPagination.page > 1
    }
  } catch (err) {
    console.error('Error fetching reviews:', err);
  } finally {
    reviewsLoading.value = false;
  }
}

async function submitReview() {
  if (!newReview.rating) {
    toast.warning('Please select a rating');
    return;
  }

  try {
    submittingReview.value = true;
    const token = await getToken.value()
    const response = await axios.post(`/api/products/${productId.value}/reviews`, 
      {
        rating: newReview.rating,
        comment: newReview.comment || null
      }, 
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.data?.success) {
      // Reset form
      newReview.rating = 0;
      newReview.comment = '';
      showReviewForm.value = false;

      // Refresh reviews and product to update rating
      await fetchReviews(1);
      await fetchProduct();

      toast.success('Review submitted successfully!');
    }
  } catch (err) {
    toast.error('Failed to submit review. Please try again.');
  } finally {
    submittingReview.value = false;
  }
}

function cancelReview() {
  showReviewForm.value = false;
  newReview.rating = 0;
  newReview.comment = '';
}

async function addToCart() {
  if (!product.value?.in_stock) return;
  try {
    cartStore.addItemToCart(product.value, quantity.value)
    quantity.value = 1
  } catch (err) {
    console.error('Error adding to cart: ', err);
  } finally {
    addingToCart.value = false;
  }
}

function increaseQuantity() {
  if (product.value && typeof product.value.stock !== 'undefined') {
    if (quantity.value < product.value.stock) quantity.value++;
  } else {
    quantity.value++;
  }
}

function decreaseQuantity() {
  if (quantity.value > 1) quantity.value--;
}

function nextImage() {
  const imgs = product.value?.images || [];
  if (!imgs.length) return;

  if (currentImageIndex.value < imgs.length - 1) {
    currentImageIndex.value++;
  } else {
    currentImageIndex.value = 0;
  }
}

function previousImage() {
  const imgs = product.value?.images || [];
  if (!imgs.length) return;

  if (currentImageIndex.value > 0) {
    currentImageIndex.value--;
  } else {
    currentImageIndex.value = imgs.length - 1;
  }
}


onMounted(() => {
  fetchProduct();
  fetchReviews(1);
});

watch(productId, (newId, oldId) => {
  if (newId !== oldId) {
    fetchProduct();
    fetchReviews(1);
  }
});
</script>

<style scoped src="./ProductDetails.css"></style>