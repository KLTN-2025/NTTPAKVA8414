import { createRouter, createWebHistory } from "vue-router";
import Home from "../pages/Home.vue";
// import Products from "../pages/Products.vue";
// import ProductDetail from "../pages/ProductDetail.vue";
// import Cart from "../pages/Cart.vue";
// import About from "../pages/About.vue";

const routes = [
  { path: "/", name: "Home", component: Home },
  // { path: "/products", name: "Products", component: Products },
  // { path: "/product/:id", name: "ProductDetail", component: ProductDetail },
  // { path: "/cart", name: "Cart", component: Cart },
  // { path: "/about", name: "About", component: About },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;