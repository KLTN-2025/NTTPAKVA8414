const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const { clerkMiddleware  } = require('@clerk/express')
const { connectRedis } = require('./config/redis')
require('dotenv').config()

const app = express()

app.use('/api/webhooks', require('./routes/webhooks'))

const corsOptions = {
  origin: [
    'http://localhost:5173',  //Allow customer access
    'http://localhost:5174'   //Allow admin access
  ]
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(clerkMiddleware())
app.use('/api', require('./routes/index'))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (_, res) => res.send('HealthyCrave API'))

const startServer = async () => {
  try {
    await connectRedis()
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/HealthyCrave') 
    console.log('MongoDB connected')
    
    const port = process.env.PORT || 5000
    app.listen(port, () => console.log(`Server running on port ${port}`))
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

startServer()