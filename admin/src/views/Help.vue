<template>
  <div class="help-page">
    <div class="help-header">
      <i class="fas fa-question-circle"></i>
      <h1>How can we help you?</h1>
      <p>Find answers to your questions or contact our support team.</p>
    </div>

    <div class="help-layout">
      
      <div class="help-column-left">
        <div class="card">
          <div class="card-header">
            <h4>Frequently Asked Questions (FAQs)</h4>
          </div>
          <div class="card-body">
            
            <div class="faq-item">
              <h5>How do I add a new product?</h5>
              <p>
                To add a new product, navigate to the <strong>Product</strong> tab on the sidebar. Click the <strong>"New Product"</strong> button on the top right. Fill out all the required fields like name, SKU, price, and quantity, then click "Save Product".
              </p>
            </div>
            
            <div class="faq-item">
              <h5>How do I lock a customer account?</h5>
              <p>
                Go to the <strong>Customers</strong> tab. Find the customer in the list and click the red <strong>"Lock"</strong> button. A confirmation pop-up will appear. Click "Lock" again to confirm.
              </p>
            </div>

            <div class="faq-item">
              <h5>How do I update an order status?</h5>
              <p>
                From the <strong>Orders</strong> list, click the "Edit" (pencil) icon on the order you wish to update. On the "Edit Order" page, use the dropdown menus under <strong>"Update Status"</strong> to change the Payment Status or Order Status, then click "Save Changes".
              </p>
            </div>
            
          </div>
        </div>
      </div>

      <div class="help-column-right">
        <div class="card">
          <div class="card-header">
            <h4>Contact Support</h4>
          </div>
          <div class="card-body">
            <p class="support-text">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <div class="info-block-new">
              <i class="fas fa-envelope"></i>
              <div class="info-text-new">
                <span>Email Support</span>
                <strong>admin.support@healthycrave.com</strong>
              </div>
            </div>
            <div class="info-block-new">
              <i class="fas fa-phone"></i>
              <div class="info-text-new">
                <span>Phone Support</span>
                <strong>(+84) 234 567 890</strong>
              </div>
            </div>
            <button class="btn btn-primary btn-full">
              <i class="fas fa-life-ring"></i>
              <span>Open Support Ticket</span>
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
// Trang này hiện không cần logic JavaScript
</script>

<style scoped src="./Help.css"></style>