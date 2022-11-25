const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const usersCollection = client.db('bestBikes').collection('users');
        const productsCollection = client.db('bestBikes').collection('products');
        const reportedProductsCollection = client.db('bestBikes').collection('reportedProducts');

        //get all the categories
        app.get('/categories', async(req, res) => {
            const query = {};
            const result = await categoriesCollection.find(query).toArray();
            res.send(result);
        })

        //get all the bike details based on category name
        app.get('/category/:id', async(req, res) => {
            const id = req.params.id;
            const query = {category_id :id};
            const result = await bikeDetailsCollection.find(query).sort({posted_date : -1}).toArray();
            res.send(result);
        })

        //post user info to database when suer signs up and prevent user with same email try to multiple sign in.
        app.post('/users', async(req, res) => {
            const user = req.body;
            console.log(user);

            const query = {
                email: user.email 
            }

            const findAlreadyUserInDataBase = await usersCollection.find(query).toArray();
            console.log("User already in database", findAlreadyUserInDataBase.length);

            if (findAlreadyUserInDataBase.length) {
                const message = 'This Email Already Exists';
                return res.send({ acknowledged: false, message });
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        //get a specific user  based on  email to check he is seller or not. The dashboard options will be shown based on the user role
        app.get('/users/seller/:email', async(req, res) => {
            const email = req.params.email;
            //console.log("Seller Email",email)
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'Seller' });
        })

        //get a specific user  based on  email to check he is buyer or not. The dashboard options will be shown based on the user role
        app.get('/users/buyer/:email', async(req, res) => {
            const email = req.params.email;
            //console.log("Buyer Email",email)
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'Buyer' });
        })


         //get the Admin using email. The dashboard options will be shown based on the user role
        app.get('/users/admin/:email', async(req, res) => {
            const email = req.params.email;
            //console.log("Admin Email",email)
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'Admin' });
        })


        //get all the users based on email to show the user role on a badge on header section
        app.get('/users', async(req, res) => {
            const email = req.query.email;
            const filter = {email: email};
            const result = await usersCollection.findOne(filter);
            res.send(result);
        })

        //add product by seller
        app.post('/products', async(req, res) => {
            const productInfo = req.body;
            console.log(productInfo);
            const result = await bikeDetailsCollection.insertOne(productInfo);
            res.send(result);
        }) 


        //get the added products by seller using the seller email on My Products Page
        app.get('/products', async (req, res) => {
            
            const email = req.query.email;
            const query = {email: email};
            const result = await bikeDetailsCollection.find(query).sort({posted_date: -1}).toArray();
            res.send(result);
        })

        //delete a product by the seller
        app.delete('/products/:id', async(req, res) => {
            const id = req.params.id;
            console.log("Deleting ID", id)
            const query = {_id : ObjectId(id)};
            const result = await bikeDetailsCollection.deleteOne(query);
            res.send(result);
        })

        //get all sellers to show the admin on All Sellers route
        app.get('/sellers', async(req, res) => {
            const query = {
                role: 'Seller'
            }
            const result = await usersCollection.find(query).sort({photo: -1}).toArray();
            res.send(result);
        })

        //get all buyers to show the admin on All Buyers route
        app.get('/buyers', async(req, res) => {
            const query = {
                role: 'Buyer'
            }
            const result = await usersCollection.find(query).sort({photo: -1}).toArray();
            res.send(result);
        }) 

        //get the API for deleting a seller by admin
        app.delete('/sellers/:id', async(req, res) => {
            const id = req.params.id;
            console.log("Deleting ID Of Seller", id)
            const query = {_id : ObjectId(id)};
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })

         //get the API for deleting a buyer by admin
        app.delete('/buyers/:id', async(req, res) => {
            const id = req.params.id;
            console.log("Deleting ID Of Buyer", id)
            const query = {_id : ObjectId(id)};
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        }) 

        //Post Reported Products
        app.post('/reportedProducts', async(req, res) => {
            const reportedProductInfo = req.body;
            console.log(reportedProductInfo);
            
            const query = {
                productDataBaseId: reportedProductInfo.productDataBaseId ,
                reporterEmail:reportedProductInfo.reporterEmail
            }

            const alreadyStoredSameProductReportInDataBase = await reportedProductsCollection.find(query).toArray();
            console.log("Already Stored Same Report to Database", alreadyStoredSameProductReportInDataBase.length);
            
            if (alreadyStoredSameProductReportInDataBase.length) {
                const message = ` ${reportedProductInfo.reporterName}, You have already added this product's report to us`;
                return res.send({ acknowledged: false, message });
            }
            
            const result = await reportedProductsCollection.insertOne(reportedProductInfo);
            res.send(result);

        })

        //get all the reported Products
        app.get('/reportedProducts', async(req, res) => {
            const query = {}
            const result = await reportedProductsCollection.find(query).sort({report_posted_date : -1}).toArray();
            res.send(result);
        })

        //delete review By Admin
        app.delete('/reportedProducts/:id', async(req, res) => {
            const id = req.params.id;
            console.log("Deleting Report ID ", id)
            const filter = {_id : ObjectId(id)}
            const result = await reportedProductsCollection.deleteOne(filter);
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


