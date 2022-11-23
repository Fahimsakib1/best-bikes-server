const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;


//set up middle wares
app.use(cors());
app.use(express.json());

//require dotenv
require('dotenv').config();


app.get('/', (req, res) => {
    res.send('Best Bikes Server is running');
})

app.listen(port, (req, res) => {
    console.log('Best Bikes Server is running on Port', port)
})
