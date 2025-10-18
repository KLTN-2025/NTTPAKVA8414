<template>
  <div class="home-page">
    <!-- Main Home Content -->
    <div class="home">
      <!-- Banner Quảng Cáo -->
      <section class="banner-section">
        <img src="../assets/images/Banner4.png" alt="Banner" class="banner-img" />
        <button class="banner-btn">Shop Now</button>
      </section>

      <!-- Banner Icons Section -->
      <section class="banner-icons-section">
        <div class="icon-item">
          <i class="fa-solid fa-truck"></i>
          <h4>Free Shipping</h4>
          <p>Freeshipping on all your order</p>
        </div>
        <div class="icon-item">
          <i class="fa-solid fa-headset"></i>
          <h4>Customer Support 24/7</h4>
          <p>Instant access to Support</p>
        </div>
        <div class="icon-item">
          <i class="fa-solid fa-shield-halved"></i>
          <h4>100% Secure Payment</h4>
          <p>We ensure your money is safe</p>
        </div>
        <div class="icon-item">
          <i class="fa-solid fa-rotate-left"></i>
          <h4>Money-Back Guarantee</h4>
          <p>30 days money-back guarantee</p>
        </div>
      </section>

      <!-- Featured Products -->
      <section class="featured-products">
        <h2>Featured Products</h2>
        <div class="products-grid">
          <!-- Product Cards (5 products) -->
          <div class="product-card">
            <div class="sale-tag">-10%</div>
            <div class="favorite-icon"><i class="fa-regular fa-heart"></i></div>
            <img src="../assets/images/Corn.png" alt="Product 1" />
            <div class="product-info">
              <div class="name-price">
                <h3>Corn</h3>
                <p class="price"><span class="old-price">$29.99</span>$19.99</p>
              </div>
              <div class="add-cart-wrapper"><i class="fa-solid fa-cart-plus"></i></div>
            </div>
          </div>

          <div class="product-card">
            <div class="sale-tag">-10%</div>
            <div class="favorite-icon"><i class="fa-regular fa-heart"></i></div>
            <img src="../assets/images/apple.png" alt="Product 2" />
            <div class="product-info">
              <div class="name-price">
                <h3>Apple</h3>
                <p class="price"><span class="old-price">$39.99</span>$29.99</p>
              </div>
              <div class="add-cart-wrapper"><i class="fa-solid fa-cart-plus"></i></div>
            </div>
          </div>

          <div class="product-card">
            <div class="sale-tag">-10%</div>
            <div class="favorite-icon"><i class="fa-regular fa-heart"></i></div>
            <img src="../assets/images/ChaniseCabbage.png" alt="Product 3" />
            <div class="product-info">
              <div class="name-price">
                <h3>Chanise Cabbage</h3>
                <p class="price"><span class="old-price">$49.99</span>$39.99</p>
              </div>
              <div class="add-cart-wrapper"><i class="fa-solid fa-cart-plus"></i></div>
            </div>
          </div>

          <div class="product-card">
            <div class="sale-tag">-10%</div>
            <div class="favorite-icon"><i class="fa-regular fa-heart"></i></div>
            <img src="../assets/images/GreenChili.png" alt="Product 4" />
            <div class="product-info">
              <div class="name-price">
                <h3>Green Chili</h3>
                <p class="price"><span class="old-price">$59.99</span>$49.99</p>
              </div>
              <div class="add-cart-wrapper"><i class="fa-solid fa-cart-plus"></i></div>
            </div>
          </div>

          <div class="product-card">
            <div class="sale-tag">-10%</div>
            <div class="favorite-icon"><i class="fa-regular fa-heart"></i></div>
            <img src="../assets/images/GreenLettuce.png" alt="Product 5" />
            <div class="product-info">
              <div class="name-price">
                <h3>Green Lettuce</h3>
                <p class="price"><span class="old-price">$69.99</span>$59.99</p>
              </div>
              <div class="add-cart-wrapper"><i class="fa-solid fa-cart-plus"></i></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Special Offers -->
      <section class="special-offers">
        <div class="offer-banner">
          <img src="../assets/images/Offer1.png" alt="Special Offer 1" />
          <button class="offer-btn">Shop Now</button>
        </div>
        <div class="offer-banner">
          <img src="../assets/images/Offer2.png" alt="Special Offer 2" />
          <button class="offer-btn">Shop Now</button>
        </div>
        <div class="offer-banner">
          <img src="../assets/images/Offer3.png" alt="Special Offer 3" />
          <button class="offer-btn">Shop Now</button>
        </div>
      </section>
    </div>

    <!-- Customer Reviews -->
    <section class="customer-reviews">
      <h2>What our customers say</h2>
      <div class="reviews-grid">
        <div class="review-card">
          <p class="review-text">"Great products! Healthy and tasty. Highly recommended."</p>
          <div class="review-footer">
            <img src="../assets/images/avatar.png" alt="Customer 1" class="avatar" />
            <div class="review-info">
              <h4>Jane Doe</h4>
              <div class="review-rating">
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star-half-alt"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="review-card">
          <p class="review-text">"Excellent service and fast delivery. Loved the taste."</p>
          <div class="review-footer">
            <img src="../assets/images/avatar.png" alt="Customer 2" class="avatar" />
            <div class="review-info">
              <h4>John Smith</h4>
              <div class="review-rating">
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="far fa-star"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="review-card">
          <p class="review-text">"Loved the packaging and freshness. Will order again!"</p>
          <div class="review-footer">
            <img src="../assets/images/avatar.png" alt="Customer 3" class="avatar" />
            <div class="review-info">
              <h4>Mary Johnson</h4>
              <div class="review-rating">
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star-half-alt"></i>
                <i class="far fa-star"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style src="./Home.css"></style>
