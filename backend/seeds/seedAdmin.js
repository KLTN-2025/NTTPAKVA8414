const { mongoose } = require('mongoose')
const { bcrypt }=  require('bcryptjs')
const { Admin } = require('../models/Admins')

require('dotenv').config(); 

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");

    // Check if an admin already exists
    const existingAdmin = await Admin.findOne({ role: "owner" });
    if (existingAdmin) {
      console.log("Admin account already exists. Skipping creation.");
      return;
    }

    // Create the first admin
    const adminPassword = process.env.ADMIN_PASSWORD || "admin"; 
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = new Admin({
      name: process.env.ADMIN_NAME || "Admin",
      email: process.env.ADMIN_EMAIL || "admin@gmail.com",
      password: hashedPassword,
      role: "owner",
      account_status: "active",
    });

    await admin.save();
    console.log("Admin account created successfully:");
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${process.env.ADMIN_PASSWORD || "admin"}`);

  } catch (error) {
    console.error("Error creating admin:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB connection closed");
  }
};

seedAdmin();
