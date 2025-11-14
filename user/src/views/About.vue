<template>
  <div class="cart-banner-container">
    <img src="@/assets/images/Breadcrumbs.png" alt="About Us Banner" class="cart-banner-img" />
    <div class="cart-breadcrumbs-container">
      <nav class="cart-breadcrumbs">
        <router-link to="/">Home</router-link>
        <i class="fas fa-chevron-right breadcrumb-separator"></i> 
        <strong>About</strong>
      </nav>
    </div>
  </div>

  <div class="about-page-container">
    
    <section class="about-section our-story-section section-animate">
      <h2 class="section-title">Our Story</h2>
      <p class="section-text">
        HealthyCrave started from a simple idea: how to make clean, organic, and healthy food easily accessible
         to everyone, even the busiest of people? We noticed a growing gap between the desire to eat well 
         and the time it takes to find trusted, high-quality ingredients.
        <br><br>
        We believe that healthy eating is the foundation of a happy, fulfilling life, 
        and our mission is to bring that foundation right to your doorstep. We partner 
        directly with local farms and trusted suppliers who share our passion for sustainability 
        and quality. Every product on our shelves is hand-picked, vetted, and delivered with care, 
        ensuring that you and your family receive only the best.
      </p>
    </section>

    <section class="about-section layout-text-left section-animate">
      <div class="about-content">
        <h2 class="section-title">100% Trusted Organic Food Store</h2>
        <p class="section-text">
          Metill porttitor ligula in nunc varius sagittis. Proin dui nisi, laoreet ut tempor ac, cursus vitae eros. Cras quis ultricies elit. In ut quam tincidunt, commodo odio et, vehicula massa. Phasellus nec purus tristique, aliquam dolor in, eleifend lacus. In et commo.
        </p>
      </div>
      <div class="about-image-wrapper">
        <img src="@/assets/images/About1.png" alt="Farmer holding vegetables" />
      </div>
    </section>

    <section class="about-section layout-image-left section-animate">
      <div class="about-image-wrapper">
        <img src="@/assets/images/About2.png" alt="Smiling farmer with a basket of food" />
      </div>
      <div class="about-content">
        <h2 class="section-title">100% Trusted Organic Food Store</h2>
        <p class="section-text">
          Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante.
        </p>
        <div class="icon-grid">
          <div class="icon-item">
            <i class="fas fa-carrot icon-bg"></i>
            <div class="icon-text">
              <h4>100% Organic food</h4>
              <p>100% healthy food</p>
            </div>
          </div>
          <div class="icon-item">
            <i class="fas fa-headset icon-bg"></i>
            <div class="icon-text">
              <h4>Great Support 24/7</h4>
              <p>Quick support</p>
            </div>
          </div>
          <div class="icon-item">
            <i class="fas fa-comments icon-bg"></i>
            <div class="icon-text">
              <h4>Customer Feedback</h4>
              <p>Our happy customer</p>
            </div>
          </div>
          <div class="icon-item">
            <i class="fas fa-lock icon-bg"></i>
            <div class="icon-text">
              <h4>100% Secure Payment</h4>
              <p>We ensure your money is safe</p>
            </div>
          </div>
           <div class="icon-item">
            <i class="fas fa-shipping-fast icon-bg"></i>
            <div class="icon-text">
              <h4>Free Shipping</h4>
              <p>Free shipping on all orders</p>
            </div>
          </div>
           <div class="icon-item">
            <i class="fas fa-leaf icon-bg"></i>
            <div class="icon-text">
              <h4>100% Organic Food</h4>
              <p>100% healthy food</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="about-section delivery-section layout-text-left section-animate">
      <div class="about-content">
        <h2 class="section-title">We Delivered, You Enjoy Your Order.</h2>
        <p class="section-text">
          Ut suscipit egestas suscipit. Sed posuere pellentesque nunc, ultrices consectetur elit semper non. Nam vitae semper sapien. Ut non suscipit nisi, nec pellen tesque.
        </p>
        <ul class="checklist">
          <li><i class="fas fa-check-circle"></i>Faucibus scelerisque eleifend nulla.</li>
          <li><i class="fas fa-check-circle"></i>Faucibus scelerisque eleifend nulla.</li>
          <li><i class="fas fa-check-circle"></i>Maecenas et lorem et massa.</li>
        </ul>
        <router-link to="/products" class="shop-now-btn">Shop Now <i class="fas fa-arrow-right"></i></router-link>
      </div>
      <div class="about-image-wrapper">
        <img src="@/assets/images/About3.png" alt="Delivery man holding a crate of food" />
      </div>
    </section>

    <section class="testimonial-section section-animate">
      <div class="testimonial-header">
        <h2 class="section-title">Client Testimonial</h2>
        <div class="slider-nav">
          <button class="nav-arrow"><i class="fas fa-arrow-left"></i></button>
          <button class="nav-arrow active"><i class="fas fa-arrow-right"></i></button>
        </div>
      </div>
      <div class="testimonial-grid">
        <div class="testimonial-card">
          <span class="quote-icon">“</span>
          <p class="review-text">Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae.</p>
          <div class="review-author">
            <div class="author-info">
              <h4>Robert Fox</h4>
              <div class="stars">★★★★★</div>
            </div>
          </div>
        </div>
        <div class="testimonial-card">
          <span class="quote-icon">“</span>
          <p class="review-text">Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae.</p>
          <div class="review-author">
            <div class="author-info">
              <h4>Dianne Russell</h4>
              <div class="stars">★★★★★</div>
            </div>
          </div>
        </div>
        <div class="testimonial-card">
          <span class="quote-icon">“</span>
          <p class="review-text">Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae.</p>
          <div class="review-author">
            <div class="author-info">
              <h4>Eleanor Pena</h4>
              <div class="stars">★★★★★</div>
            </div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
// Cần import FontAwesome cho các icon
import '@fortawesome/fontawesome-free/css/all.min.css';
</script>

<style scoped src="./About.css"></style>