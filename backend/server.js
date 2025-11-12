const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const { clerkMiddleware  } = require('@clerk/express')
require('dotenv').config()

const app = express()
app.use('/api/webhooks', require('./routes/webhooks'))

const corsOptions = {
  origin: [
    'http://localhost:5173',  //public
    'http://localhost:5174'   //admin
  ]
}

app.use(cors(corsOptions))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(clerkMiddleware())
app.use('/api', require('./routes/index'))

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/HealthyCrave', 
  { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err))


app.get('/', (_, res) => res.send('HealthyCrave API'))

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`Server running on port ${port}`))