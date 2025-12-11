<template>
  <div class="product-card">
    <router-link :to="`/product/${product._id}`" class="product-link">
      <div class="product-image">
        <img
          :src="buildImagePath(product.images) || placeholderImage"
          :alt="product.name"
          @error="handleImageError"
        />
        <div v-if="hasDiscount" class="discount-badge">
          -{{ discountPercentage }}%
        </div>
        <div v-if="!product.in_stock" class="out-of-stock-badge">
          Out of Stock
        </div>
      </div>

      <div class="product-info">
        <div class="product-brand" v-if="product.brand">
          {{ product.brand.name }}
        </div>

        <h3 class="product-name">{{ product.name }}</h3>

        <div class="product-size" v-if="product.size">
          {{ product.size }} {{ product.unit }}
        </div>

        <div class="product-rating">
          <span>{{ product.rating }}</span>
          <div class="stars">
            <svg
              v-for="star in 5"
              :key="star"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              class="star-svg"
            >
              <!-- Gray background star -->
              <path
                d="M10 15.27L16.18 19L14.54 11.97L20 7.24L12.81 6.63L10 0L7.19 6.63L0 7.24L5.46 11.97L3.82 19L10 15.27Z"
                fill="#E5E7EB"
              />
              <!-- Yellow filled part - dynamically positioned -->
              <path
                d="M10 15.27L16.18 19L14.54 11.97L20 7.24L12.81 6.63L10 0L7.19 6.63L0 7.24L5.46 11.97L3.82 19L10 15.27Z"
                :fill="getStarFill(star)"
                :clip-path="getClipPath(star)"
              />
            </svg>
          </div>
        </div>

        <div
          class="product-attributes"
          v-if="product.attributes && product.attributes.length > 0"
        >
          <span
            v-for="attr in product.attributes.slice(0, 2)"
            :key="attr._id"
            class="attribute-tag"
          >
            {{ attr.name }}
          </span>
          <span v-if="product.attributes.length > 2" class="attribute-tag">
            +{{ product.attributes.length - 2 }}
          </span>
        </div>

        <div class="product-price">
          <span v-if="hasDiscount" class="old-price"
            >{{ formatPrice(product.original_price) }}₫</span
          >
          <span class="current-price">{{ formatPrice(product.price) }}₫</span>
        </div>
      </div>
    </router-link>
    <button
      @click.prevent="addToCart"
      class="add-to-cart-btn"
      :disabled="!product.in_stock"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 16C6 17.1046 5.10457 18 4 18C2.89543 18 2 17.1046 2 16C2 14.8954 2.89543 14 4 14C5.10457 14 6 14.8954 6 16Z"
          fill="currentColor"
        />
        <path
          d="M18 16C18 17.1046 17.1046 18 16 18C14.8954 18 14 17.1046 14 16C14 14.8954 14.8954 14 16 14C17.1046 14 18 14.8954 18 16Z"
          fill="currentColor"
        />
        <path
          d="M2 2H3.47934C3.92885 2 4.30763 2.32509 4.37781 2.76894L6.62219 16.2311C6.69237 16.6749 7.07115 17 7.52066 17H16C16.5523 17 17 16.5523 17 16V7C17 6.44772 16.5523 6 16 6H5.5M6 10H17"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span v-if="product.in_stock">Add to Cart</span>
      <span v-else>Out of Stock</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useCartStore } from "@/stores/cartStore";
import { buildImagePath } from "@/utilities/helper";
const { addItemToCart } = useCartStore();
const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

const router = useRouter();

const placeholderImage = "https://picsum.photos/3000x400?text=No+Image";

function getStarFill(starIndex) {
  const rating = props.product.rating;
  return starIndex <= rating ? "#F59E0B" : "transparent";
}

function getClipPath(starIndex) {
  const rating = props.product.rating;
  if (starIndex > Math.floor(rating) && starIndex <= rating) {
    // For partial fill, calculate percentage
    const percentage = (rating - Math.floor(rating)) * 100;
    return `inset(0 ${100 - percentage}% 0 0)`;
  }
  return "";
}

const hasDiscount = computed(() => {
  return (
    props.product.original_price &&
    props.product.original_price > props.product.price
  );
});

const discountPercentage = computed(() => {
  if (!hasDiscount.value) return 0;
  const discount =
    ((props.product.original_price - props.product.price) /
      props.product.original_price) *
    100;
  return Math.round(discount);
});

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price);
}

function handleImageError(event) {
  event.target.src = placeholderImage;
}

async function addToCart() {
  addItemToCart(props.product, 1);
}
</script>

<style src="./ProductCard.css"></style>
