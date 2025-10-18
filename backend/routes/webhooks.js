const express = require('express');
const { Webhook } = require('svix');
const bodyParser = require('body-parser');
const Customer = require('../models/Customers'); 

const router = express.Router();

router.post(
  '/',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    // 1. Check for the webhook secret
    console.log('--- Webhook Endpoint Hit ---');

    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    // 2. Get the Svix headers for verification
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ error: 'Error occured -- no svix headers' });
    }

    // 3. Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;

    // 4. Verify the payload with the headers
    try {
      const payload = req.body.toString('utf8');
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('❌ Error verifying webhook:', err.message);
      return res.status(400).json({ 'Error': err.message });
    }

    // 5. Get the event type
    const eventType = evt.type;
    console.log(`✅ Webhook received: ${eventType}`);

    // 6. Handle the event
    try {
      switch (eventType) {
        // --- USER CREATED ---
        case 'user.created': {
          const { id, email_addresses, first_name, last_name, image_url, phone_numbers, private_metadata } = evt.data;

          await Customer.create({
            clerkId: id,
            email: email_addresses[0].email_address,
            name: `${first_name} ${last_name}`.trim(),
            phone: phone_numbers[0]?.phone_number || '',
            image_url: image_url,
            last_login: new Date(),
            role: private_metadata.role || 'customer',
          });
          break;
        }

        // --- USER UPDATED ---
        case 'user.updated': {
          console.log('Firing user.updated')
          const { id, email_addresses, first_name, last_name, image_url, phone_numbers, private_metadata } = evt.data;

          await Customer.findOneAndUpdate(
            { clerkId: id },
            {
              $set: {
                email: email_addresses[0].email_address,
                name: `${first_name} ${last_name}`.trim(),
                phone: phone_numbers[0]?.phone_number || '',
                image_url: image_url,
                last_login: new Date(),
                role: private_metadata.role || 'customer',
              },
            }
          );
          break;
        }

        // --- USER DELETED ---
        case 'user.deleted': {
          const { id } = evt.data;
          await Customer.findOneAndUpdate(
            { clerkId: id },
            {
              $set: {
                is_deleted: true,
                account_status: 'inactive',
              },
            }
          );
          break;
        }
      }
    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError);
      return res.status(500).json({ error: 'Database operation failed' });
    }

    res.status(200).json({ response: 'Success' });
  }
);

module.exports = router;