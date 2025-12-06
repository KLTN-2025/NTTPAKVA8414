// scripts/createTrx.js

const mongoose = require('mongoose');
require('dotenv').config();

const Transaction = require('../models/Transactions');
const CustomerOrder = require('../models/CustomerOrders');
const SupplyOrder = require('../models/SupplyOrders');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/HealthyCrave';


async function createCustomerPaymentTransaction(order) {
  const existing = await Transaction.findOne({
    ref_type: 'CustomerOrder',
    ref_id: order._id,
    category: 'customer_payment',
    is_deleted: false
  });

  if (existing) {
    return { created: false, reason: 'already_exists' };
  }

  const methodMap = {
    'cod': 'cash',
    'transfer': 'bank_transfer'
  };
  const method = methodMap[order.payment_method] || 'other';

  const transactionDate = order.updatedAt || order.order_date || new Date();

  await Transaction.create({
    date: transactionDate,
    type: 'inflow',
    category: 'customer_payment',
    amount: order.total_amount,
    method: method,
    ref_type: 'CustomerOrder',
    ref_id: order._id,
    description: `Payment for Order #${order._id.toString().slice(-4).toUpperCase()}`,
    is_auto_generated: true,
    created_by: null
  });

  return { created: true };
}


async function createSupplierPaymentTransaction(supplyOrder) {
  const existing = await Transaction.findOne({
    ref_type: 'SupplyOrder',
    ref_id: supplyOrder._id,
    category: 'supplier_payment',
    is_deleted: false
  });

  if (existing) {
    return { created: false, reason: 'already_exists' };
  }

  const amount = supplyOrder.total_cost_received ?? supplyOrder.total_cost_ordered ?? 0;

  if (amount <= 0) {
    return { created: false, reason: 'zero_amount' };
  }

  const transactionDate = supplyOrder.received_at || supplyOrder.updatedAt || new Date();

  await Transaction.create({
    date: transactionDate,
    type: 'outflow',
    category: 'supplier_payment',
    amount: amount,
    method: 'bank_transfer',
    ref_type: 'SupplyOrder',
    ref_id: supplyOrder._id,
    description: `Payment for PO #${supplyOrder._id.toString().slice(-4).toUpperCase()}`,
    is_auto_generated: true,
    created_by: null
  });

  return { created: true };
}


async function createRefundTransaction(order) {
  const existing = await Transaction.findOne({
    ref_type: 'CustomerOrder',
    ref_id: order._id,
    category: 'refund',
    is_deleted: false
  });

  if (existing) {
    return { created: false, reason: 'already_exists' };
  }

  const transactionDate = order.updatedAt || new Date();

  await Transaction.create({
    date: transactionDate,
    type: 'outflow',
    category: 'refund',
    amount: order.total_amount,
    method: 'bank_transfer',
    ref_type: 'CustomerOrder',
    ref_id: order._id,
    description: `Refund for Order #${order._id.toString().slice(-4).toUpperCase()}`,
    is_auto_generated: true,
    created_by: null
  });

  return { created: true };
}

async function migrate() {
  console.log('Transaction Migration Script');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB!');

    // Stats
    let customerPaymentsCreated = 0;
    let customerPaymentsSkipped = 0;
    let refundsCreated = 0;
    let refundsSkipped = 0;
    let supplierPaymentsCreated = 0;
    let supplierPaymentsSkipped = 0;

    // 1. Migrate customer order payments
    const paidOrders = await CustomerOrder.find({ 
      payment_status: 'paid' 
    }).lean();

    for (const order of paidOrders) {
      const result = await createCustomerPaymentTransaction(order);
      if (result.created) {
        customerPaymentsCreated++;
        process.stdout.write('.');
      } else {
        customerPaymentsSkipped++;
      }
    }
    console.log(`Created: ${customerPaymentsCreated}, Skipped: ${customerPaymentsSkipped}`);

    // 2. Migrate refunds for cancelled orders that were paid
    console.log('--- Processing Refunds ---');
    const refundedOrders = await CustomerOrder.find({ 
      payment_status: 'refunded',
      order_status: 'cancelled'
    }).lean();
    console.log(`Found ${refundedOrders.length} refunded orders`);

    for (const order of refundedOrders) {
      const result = await createRefundTransaction(order);
      if (result.created) {
        refundsCreated++;
        process.stdout.write('.');
      } else {
        refundsSkipped++;
      }
    }
    console.log(`  Created: ${refundsCreated}, Skipped: ${refundsSkipped}`);

    // 3. Migrate supply order payments
    console.log('--- Processing Supply Order Payments ---');
    const receivedSupplyOrders = await SupplyOrder.find({ 
      status: 'Received' 
    }).lean();

    for (const supplyOrder of receivedSupplyOrders) {
      const result = await createSupplierPaymentTransaction(supplyOrder);
      if (result.created) {
        supplierPaymentsCreated++;
        process.stdout.write('.');
      } else {
        supplierPaymentsSkipped++;
      }
    }
    console.log(`  Created: ${supplierPaymentsCreated}, Skipped: ${supplierPaymentsSkipped}`);

    // Summary
    console.log('MIGRATION COMPLETE');
    console.log('Summary:');
    console.log(`  Customer Payments: ${customerPaymentsCreated} created, ${customerPaymentsSkipped} skipped`);
    console.log(`  Refunds:           ${refundsCreated} created, ${refundsSkipped} skipped`);
    console.log(`  Supplier Payments: ${supplierPaymentsCreated} created, ${supplierPaymentsSkipped} skipped`);
    console.log(`  Total Created: ${customerPaymentsCreated + refundsCreated + supplierPaymentsCreated}`);

  } catch (error) {
    console.error('');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run migration
migrate().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});