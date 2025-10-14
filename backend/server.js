const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const app = express();

const corsOptions = {
  origin: [
    'http://localhost:5173',  //public
    'http://localhost:5174'   //admin
  ]
}
app.use(cors(corsOptions)).use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const routes = require('./routes'); 
app.use('/api', routes); 

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));


app.get('/', (_, res) => res.send('HealthyCrave API'));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));