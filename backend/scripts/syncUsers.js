// syncUsers.js
// Vui lòng không chạy file này thường xuyên, vì sẽ bị giới hạn lượt dùng API
require('dotenv').config();
const mongoose = require('mongoose');
const { clerkClient } = require('@clerk/express');

const Customer = require('../models/Customers')

async function syncUsers() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI
    );
    console.log('Connected to MongoDB');

    const users = await clerkClient.users.getUserList({ limit: 100 });

    let synced = 0;
    let skipped = 0;

    for (const clerkUser of users.data) {
      try {
        const existingUser = await Customer.findOne({ clerkId: clerkUser.id });

        const userData = {
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: `${clerkUser.lastName || ''} ${clerkUser.firstName || ''}`.trim() || 'Unknown',
          phone: clerkUser.phoneNumbers[0]?.phoneNumber || '',
          image_url: clerkUser.imageUrl || '',
          account_status: clerkUser.banned ? 'banned' : 'active',
          role: clerkUser.publicMetadata?.role || 'customer'
        };

        if (existingUser) {
          await Customer.findOneAndUpdate(
            { clerkId: clerkUser.id },
            userData,
            { new: true }
          );
          console.log(`Updated user: ${userData.email}`);
        } else {
          await Customer.create(userData);
          console.log(`Created user: ${userData.email}`);
        }
        synced++;
      } catch (err) {
        console.error(`Error syncing user ${clerkUser.id}:`, err.message);
        skipped++;
      }
    }

    console.log('\n=== Sync Complete ===');
    console.log(`Successfully synced: ${synced}`);
    console.log(`Skipped (errors): ${skipped}`);
    console.log(`Total processed: ${users.data.length}`);

  } catch (error) {
    console.error('Sync failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the sync
syncUsers();