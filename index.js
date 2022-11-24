const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;


//set up middle wares
app.use(cors());
app.use(express.json());

//require dotenv
require('dotenv').config();


//userrName: bestBikes
//password: DOkVGAHDhzxeVVXA

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.axoxgat.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run(){
    try{
        const categoriesCollection = client.db('bestBikes').collection('categories');
        const bikeDetailsCollection = client.db('bestBikes').collection('bikeDetailsBrandWise');

        //get all the categories
        app.get('/categories', async(req, res) => {
            const query = {};
            const result = await categoriesCollection.find(query).toArray();
            res.send(result);
        })

        //get all the bike details based on category name
        app.get('/category/:id', async(req, res) => {
            const id = req.params.id;
            const query = {category_id : id};
            const result = await bikeDetailsCollection.find(query).toArray();
            res.send(result);
        })
    }

    finally{

    }
}
run().catch(error => console.log(error))



app.get('/', (req, res) => {
    res.send('Best Bikes Server is running');
})

app.listen(port, (req, res) => {
    console.log('Best Bikes Server is running on Port', port)
})


