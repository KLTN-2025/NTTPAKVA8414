<template>
  <div class="min-h-screen w-[80%] bg-gray-50">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-4xl mx-auto px-4 py-16 text-center">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 class="text-2xl font-bold text-red-800 mb-2">Error Loading Product</h2>
        <p class="text-red-600">{{ error }}</p>
        <button @click="fetchProduct" class="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Try Again
        </button>
      </div>
    </div>

    <!-- Product Content -->
    <div v-else-if="product" class="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumb -->
      <nav class="mb-6">
        <ol class="flex items-center space-x-2 text-gray-500 gap-2 text-xl">
          <li><a href="/" class="hover:text-green-600">Home</a></li>
          <li> / </li>
          <li><a href="/" class="hover:text-green-600">{{ product.category?.name }}</a></li>
          <li> / </li>
          <li class="text-gray-900 font-bold">{{ product.name }}</li>
        </ol>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <!-- Image Carousel -->
        <div class="space-y-4">
          <div class="bg-white rounded-lg shadow-md overflow-hidden aspect-square relative">
            <img 
              :src="product.images[currentImageIndex] || 'https://via.placeholder.com/600x600?text=No+Image'" 
              :alt="product.name"
              class="w-full h-full object-cover"
            >
            
            <!-- Carousel Navigation -->
            <button 
              v-if="product.images.length > 1"
              @click="previousImage"
              class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              v-if="product.images.length > 1"
              @click="nextImage"
              class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <!-- Image Thumbnails -->
          <div v-if="product.images.length > 1" class="flex gap-2 overflow-x-auto">
            <button
              v-for="(image, index) in product.images"
              :key="index"
              @click="currentImageIndex = index"
              :class="[
                'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition',
                currentImageIndex === index ? 'border-green-600' : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <img :src="image" :alt="`${product.name} - ${index + 1}`" class="w-full h-full object-cover">
            </button>
          </div>
        </div>

        <!-- Product Info -->
        <div class="flex flex-col gap-4 space-y-6">
          <!-- Title and Brand -->
          <div>
            <p v-if="product.brand" class="text-xl text-gray-500 mb-1">{{ product.brand.name }}</p>
            <p>
              <span>              
                SKU: <span class="text-green-700 font-bold">{{ product.sku }}</span>
              </span>
            </p>
            <h1 class="text-2xl font-bold text-gray-900 mb-4">{{ product.name }} {{ product.size }} {{ product.unit }}</h1>
            <p class="text-gray-600">{{ product.description }}</p>
          </div>

          <!-- Price -->
          <div class="py-4 border-y border-gray-200">
            <div class="text-4xl font-bold text-green-600">
              ₫{{ product.price.toLocaleString() }}
            </div>
            <p class="text-sm text-gray-500 mt-1">{{ product.size }} {{ product.unit }}</p>
          </div>

          <!-- Stock Status -->
          <div>
            <span v-if="product.in_stock" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              In Stock ({{ product.stock }} available)
            </span>
            <span v-else class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              Out of Stock
            </span>
          </div>

          <!-- Attributes/Tags -->
          <div v-if="product.attributes.length" class="flex flex-wrap gap-2">
            <span
              v-for="attr in product.attributes"
              :key="attr._id"
              class="inline-block px-4 py-2 text-m font-bold bg-gray-100 text-gray-700 rounded-full"
            >
              {{ attr.name }}
            </span>
          </div>

          <!-- Quantity Selector & Add to Cart -->
          <div class="flex flex-col gap-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <div class="flex items-center gap-3">
                <button
                  @click="decreaseQuantity"
                  :disabled="quantity <= 1"
                  class="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                  </svg>
                </button>
                <input
                  v-model.number="quantity"
                  type="number"
                  min="1"
                  :max="product.stock"
                  class="w-20 h-10 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                <button
                  @click="increaseQuantity"
                  :disabled="quantity >= product.stock"
                  class="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              @click="addToCart"
              :disabled="!product.in_stock || addingToCart"
              class="w-full py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <span v-if="addingToCart">Adding to Cart...</span>
              <span v-else-if="!product.in_stock">Out of Stock</span>
              <span v-else>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Reviews Section     -->
      <div class="bg-white rounded-lg shadow-md p-4 lg:p-8">
        <h2 class="text-2xl font-bold mb-6">Customer Reviews</h2>

        <div class="mb-8 pb-8 border-b border-gray-200">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">

            <div class="text-center md:text-left">
              <div class="text-5xl font-bold text-gray-900 mb-2">{{ reviews.avgRating }}</div>
              <div class="flex justify-center md:justify-start mb-2">
                <svg v-for="star in 5" :key="star" 
                  :class="star <= Math.round(reviews.avgRating) ? 'text-yellow-400' : 'text-gray-300'"
                  class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <p class="text-gray-600">Based on {{ reviews.totalReviews }} reviews</p>
            </div>

            <div class="space-y-2">
              <div v-for="(value, key) in reviews.breakdown" :key="key" class="flex items-center gap-3">
                <span class="text-sm font-medium w-12">{{ key }} star</span>
                <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-yellow-400 rounded-full"
                    :style="{ width: (reviews.total_reviews == 0 ? 0 : 100 * value / reviews.totalReviews) + '%' }"
                  ></div>
                </div>
                <span class="text-sm text-gray-600 w-12 text-right">{{ reviews.totalReviews == 0 ? 0 : 100 * value / reviews.totalReviews }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <button
            @click="showReviewForm = !showReviewForm"
            class="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
          >
            Write a Review
          </button>
        </div>

        <div v-if="showReviewForm" class="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 class="text-lg font-semibold mb-4">Write Your Review</h3>
          <form @submit.prevent="submitReview" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div class="flex gap-2">
                <button
                  v-for="star in 5"
                  :key="star"
                  type="button"
                  @click="newReview.rating = star"
                  class="focus:outline-none"
                >
                  <svg
                    :class="star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'"
                    class="w-8 h-8 hover:text-yellow-400 transition"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
              <textarea
                v-model="newReview.comment"
                rows="4"
                placeholder="Share your experience with this product..."
                class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              ></textarea>
            </div>

            <div class="flex gap-3">
              <button
                type="submit"
                :disabled="!newReview.rating || submittingReview"
                class="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {{ submittingReview ? 'Submitting...' : 'Submit Review' }}
              </button>
              <button
                type="button"
                @click="cancelReview"
                class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div v-if="reviewsLoading" class="text-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
        </div>

        <div v-else-if="reviews.length === 0" class="text-center py-12 text-gray-500">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <p class="text-lg font-medium">No reviews yet</p>
          <p class="text-sm mt-1">Be the first to review this product!</p>
        </div>

        <div v-else class="space-y-6">
          <div
            v-for="review in reviews.reviews"
            :key="review._id"
            class="pb-6 border-b border-gray-200 last:border-0"
          >
              <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="font-semibold text-gray-900">{{ review.reviewer.name }}</h4>
                  <span class="text-sm text-gray-500">{{ formatDate(review.created_at) }}</span>
                </div>

                <div class="flex mb-2">
                  <svg v-for="star in 5" :key="star"
                    :class="star <= review.rating ? 'text-yellow-400' : 'text-gray-300'"
                    class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>

                <p v-if="review.comment" class="text-gray-700">{{ review.comment }}</p>
                <p v-else class="text-gray-400 italic">No comment provided</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="reviewPagination.total_pages > 1" class="mt-8 flex justify-center gap-2">
          <button
            @click="fetchReviews(reviewPagination.current_page - 1)"
            :disabled="!reviewPagination.has_prev_page"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <button
            v-for="page in visiblePages"
            :key="page"
            @click="fetchReviews(page)"
            :class="[
              'px-4 py-2 border rounded-lg',
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
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const emit = defineEmits(['cart-updated']);

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

/* --- Computed --- */
const productId = computed(() => route.params.id);

/* visiblePages computed (max 5 pages, centered around current) */
const visiblePages = computed(() => {
  const pages = [];
  const total = reviewPagination.total_pages || 0;
  const current = reviewPagination.current_page || 1;

  let start = Math.max(1, current - 2);
  let end = Math.min(total, current + 2);

  // adjust if we have less than 5 pages shown and there are pages available
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
      // reset image index if images changed
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
      reviews.value = response.data || null;
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
    alert('Please select a rating');
    return;
  }

  try {
    submittingReview.value = true;

    const response = await axios.post(`/api/products/${productId.value}/reviews`, {
      rating: newReview.rating,
      comment: newReview.comment || null
    });

    if (response.data?.success) {
      // Reset form
      newReview.rating = 0;
      newReview.comment = '';
      showReviewForm.value = false;

      // Refresh reviews and product to update rating
      await fetchReviews(1);
      await fetchProduct();

      alert('Review submitted successfully!');
    }
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to submit review. Please try again.';
    alert(errorMessage);
    console.error('Error submitting review:', err);
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
    addingToCart.value = true;

    const response = await axios.post('/api/cart/add', {
      product_id: product.value._id,
      quantity: quantity.value
    });

    if (response.data?.success) {
      alert(`Added ${quantity.value} ${product.value.name} to cart!`);
      emit('cart-updated');
    }
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to add to cart. Please try again.';
    alert(errorMessage);
    console.error('Error adding to cart:', err);
  } finally {
    addingToCart.value = false;
  }
}

function increaseQuantity() {
  // original used this.product.stock — keep that check
  if (product.value && typeof product.value.stock !== 'undefined') {
    if (quantity.value < product.value.stock) quantity.value++;
  } else {
    // if no stock field, still allow increment
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

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/* --- Lifecycle / Watches --- */
onMounted(() => {
  fetchProduct();
  fetchReviews(1);
});

// re-fetch when productId route param changes
watch(productId, (newId, oldId) => {
  if (newId !== oldId) {
    fetchProduct();
    fetchReviews(1);
  }
});
</script>


<style scoped>
/* Custom scrollbar for image thumbnails */
.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Remove number input arrows */
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}
</style>