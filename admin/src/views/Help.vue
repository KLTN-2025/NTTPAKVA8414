<template>
  <div class="help-page">
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
                Click <strong>Product</strong> tab on the sidebar, then click
                the <strong>New Product</strong> button on the top right. Fill
                out the required fields, then click
                <strong>Save Product</strong>. Remember that
                <strong>Quantity</strong> cannot be edited, and is set to 0 on
                creating new product.
              </p>
            </div>

            <div class="faq-item">
              <h5>How do I lock a customer account?</h5>
              <p>
                Go to the <strong>Customers</strong> tab. Find the customer in
                the list and click the red <strong>"Lock"</strong> button. A
                confirmation pop-up will appear. Click "Lock" again to confirm.
              </p>
            </div>

            <div class="faq-item">
              <h5>How do I update an order status?</h5>
              <p>
                From the <strong>Orders</strong> list, click the "Edit" (pencil)
                icon on the order you wish to update. On the "Edit Order" page,
                use the dropdown menus under <strong>"Update Status"</strong> to
                change the Payment Status or Order Status, then click "Save
                Changes".
              </p>
            </div>
            <div class="faq-item">
              <h5>How do I import products?</h5>
              <p>
                1. Go to <strong>Inventory</strong> page, click
                <strong>Create New Supply Order</strong>, then fill out the
                fields in the <strong>Order Information</strong> form.
                <strong>Remember to note down the supplier name.</strong>
              </p>
              <p>
                2. Add the products and required import quantities, then click
                <strong>Saved as Draft</strong>.
              </p>
              <p>
                3. Go to Supplier page, choose the supplier name, find the order
                you created, then click <strong>Order -> Confirm</strong> to
                confirm / <strong>Edit</strong> to change details.
              </p>
              <p>
                4. Click <strong> Receive -> Mark as Received</strong>, enter
                the actual quantity you receive for each product, then click
                <strong>Confirm</strong>.
              </p>
              <p>
                5. Go back to the "Inventory" page to confirm the new
                quantities.
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
              Can't find the answer you're looking for? Our support team is here
              to help.
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

<style scoped src="./Help.css"></style>