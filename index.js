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


//require jwt
const jwt = require('jsonwebtoken');


//require stripe secret key
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


//userrName: bestBikes
//password: DOkVGAHDhzxeVVXA

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.axoxgat.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




//verify JWT Function
function verifyJWT (req, res, next){
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).send('Unauthorized Access')
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
        if (error) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    })

}



async function run(){
    
    try{
        const categoriesCollection = client.db('bestBikes').collection('categories');
        const bikeDetailsCollection = client.db('bestBikes').collection('bikeDetailsBrandWise');
        const usersCollection = client.db('bestBikes').collection('users');
        const productsCollection = client.db('bestBikes').collection('products');
        const reportedProductsCollection = client.db('bestBikes').collection('reportedProducts');
        const bookingsCollection = client.db('bestBikes').collection('bookings');
        const paymentsCollection = client.db('bestBikes').collection('payments');


        //verify Admin middleware
        const verifyAdmin = (req, res, next) => {
            console.log("Inside Verify Admin",req.decoded.email);
            next();
        }

        //get all the categories
        app.get('/categories', async(req, res) => {
            const query = {};
            const result = await categoriesCollection.find(query).toArray();
            res.send(result);
        })

        //get all the bike details based on category
        app.get('/category/:id', async(req, res) => {
            const id = req.params.id;
            const query = {category_id :id};
            const result = await bikeDetailsCollection.find(query).sort({posted_date : -1}).toArray();
            res.send(result);
        })

        
        //post user info to database when user signs up and prevent user with same email try to multiple sign in.
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


         //get the Admin using email. The dashboard options will be shown based on the admin role
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
        app.get('/products', verifyJWT, async (req, res) => {
            
            const email = req.query.email;
            const decodedEmail = req.decoded.email
            
            if(email !== decodedEmail) {
                return res.status(403).send({message: 'Forbidden Access'})
            }
            
            const query = {email: email};
            const result = await bikeDetailsCollection.find(query).sort({posted_date: -1}).toArray();
            res.send(result);
        })

        
        //delete a product by the seller
        app.delete('/products/:id', verifyJWT,  async(req, res) => {
            
            const decodedEmail = req.decoded.email;
            const filter = {email: decodedEmail};
            const user = await usersCollection.findOne(filter);

            if(user?.role !== 'Seller') {
                return res.status(403).send({message: 'Forbidden Access'})
            }
            
            
            const id = req.params.id;
            console.log("Deleting ID", id)
            const query = {_id : ObjectId(id)};
            const result = await bikeDetailsCollection.deleteOne(query);
            res.send(result);
        })

        
        //get all sellers to show the admin on All Sellers route
        app.get('/sellers',  verifyJWT,  async(req, res) => {
            
            const decodedEmail = req.decoded.email;
            const filter = {email: decodedEmail};
            const user = await usersCollection.findOne(filter);

            if(user?.role !== 'Admin') {
                return res.status(403).send({message: 'Forbidden Access'})
            }
            
            const query = {
                role: 'Seller'
            }
            const result = await usersCollection.find(query).sort({photo: -1}).toArray();
            res.send(result);
        })

        
        //get all buyers to show the admin on All Buyers route
        app.get('/buyers', verifyJWT, async(req, res) => {
            
            const decodedEmail = req.decoded.email;
            const filter = {email: decodedEmail};
            const user = await usersCollection.findOne(filter);

            if(user?.role !== 'Admin') {
                return res.status(403).send({message: 'Forbidden Access'})
            }
            
            
            const query = {
                role: 'Buyer'
            }
            const result = await usersCollection.find(query).sort({photo: -1}).toArray();
            res.send(result);
        }) 



        //get the API for deleting a seller by admin
        app.delete('/sellers/:id', verifyJWT,  async(req, res) => {
            
            const decodedEmail = req.decoded.email;
            const filter = {email: decodedEmail};
            const user = await usersCollection.findOne(filter);

            if(user?.role !== 'Admin') {
                return res.status(403).send({message: 'Forbidden Access'})
            }
            
            
            const id = req.params.id;
            console.log("Deleting ID Of Seller", id)
            const query = {_id : ObjectId(id)};
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })


         //get the API for deleting a buyer by admin
        app.delete('/buyers/:id', verifyJWT,  async(req, res) => {
            
            const decodedEmail = req.decoded.email;
            const filter = {email: decodedEmail};
            const user = await usersCollection.findOne(filter);

            if(user?.role !== 'Admin') {
                return res.status(403).send({message: 'Forbidden Access'})
            }
            
            
            const id = req.params.id;
            //console.log("Deleting ID Of Buyer", id)
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
                const message = ` ${reportedProductInfo.reporterName}, You have already added this product's Report to us`;
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
            //console.log("Deleting Report ID ", id)
            const filter = {_id : ObjectId(id)}
            const result = await reportedProductsCollection.deleteOne(filter);
            res.send(result);
        })


        //Make a seller verified by admin
        app.put('/sellers', async(req, res) => {
            const email = req.query.email;
            const query = {email: email};
            //console.log(email);
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    status: 'Verified'
                }
            }
            const result1 = await usersCollection.updateOne(query, updatedDoc, options);
            const result2 = await bikeDetailsCollection.updateMany(query, updatedDoc, options);
            res.send(result2);
        })

        
        //update a products status to advertise by the seller
        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            console.log("Advertise ID", id);

            const query = {_id: ObjectId(id)}

            const options = {upsert: true};
            const updatedDoc = {
                $set: {
                    advertiseStatus: 'Advertised'
                }
            }
            const result = await bikeDetailsCollection.updateOne(query, updatedDoc, options)
            res.send(result);
        })


        //get the advertised products on the home page
        app.get('/advertisedProducts',  async (req, res) => {
            const query = {
                advertiseStatus: 'Advertised'
            };
            const result = await bikeDetailsCollection.find(query).toArray();
            res.send(result);
        })


        //post the booking details on database after booking a bike by the user 
        app.post('/bookings', async(req, res) => {
            const bookingInfo = req.body;
            //console.log(bookingInfo);
            const bookingProducts = await bookingsCollection.insertOne(bookingInfo);
            res.send(bookingProducts);
        })


        //update the booking status on the productsCollection after buyer booked a product
        app.put('/bookedProducts/:id', async (req, res) => {
            const id = req.params.id;
            //console.log("Booked Product ID", id);

            const query = {_id: ObjectId(id)}

            const options = {upsert: true};
            const updatedDoc = {
                $set: {
                    bookingStatus: 'Booked'
                }
            }
            const result = await bikeDetailsCollection.updateOne(query, updatedDoc, options)
            res.send(result);
        })


        //get the orders for the buyer by filtering buyer email
        app.get('/orders', async(req, res) => {
            const email = req.query.email;
            //console.log('Email From Buyer Order Page', email);
            const query = {buyerEmail: email};
            const result = await bookingsCollection.find(query).toArray();
            res.send(result);
        })

        
        
        
        ///////////////////    PAYMENT CODE ///////////////////
        
        
        //get the specific order by ID when buyer wants to pay
        app.get('/orders/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const order = await bookingsCollection.findOne(query);
            res.send(order)
        })


        //post the client er information from client side for payment
        app.post('/create-payment-intent', async(req, res) => {
            const order = req.body;
            const price = order.price;
            //console.log("Booking Price", price);
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                "payment_method_types": [
                    "card"
                ],

            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });

        })

        
        //post the payment info to database
        app.post('/payments', async(req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);

            
            const id = payment.bookingId;
            const query = {_id: ObjectId(id)};
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updateBookingData = await bookingsCollection.updateOne(query, updatedDoc)

            
            const bikeId = payment.bikeOriginalID;
            const query2 = {_id: ObjectId(bikeId)};
            const updatedDocument = {
                $set: {
                    bookingStatus: 'Paid'
                }
            }
            const updateBikeDetailsData = await bikeDetailsCollection.updateOne(query2, updatedDocument);

            res.send(result);
        })


        //delete the bike form the category details after payment from buyer
        app.delete('/payments/:id', async(req, res) => {
            const id = req.params.id;
            //console.log("Deleting Report ID ", id)
            const filter = {_id : ObjectId(id)}
            const result = await bikeDetailsCollection.deleteOne(filter);
            res.send(result);
        })

        
        
        
        
        
        
        ///////// JWT Token ////////////////

        //generate token when the user signs up 
        app.get('/jwt', async(req, res) => {
            const email = req.query.email;
            console.log("JWT", email)
            const query = { email: email }

            const user = await usersCollection.findOne(query)
            //console.log(user);
            
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '7d' })

                return res.send({ accessToken: token })
            }
            else {
                return res.status(403).send({ accessToken: 'User not Found' })
            }
        })

        //code for jwt token when the user login to the system
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log("User From Sever side: ", user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '7d' });
            res.send({ token })
        })



        
        //search with bike names and sort the bikes by ascending or descending order of price

        // app.get('/category/:id', async(req, res) => {
        //     const id = req.params.id;
        //     const query = {category_id :id};

        //     const service = req.query.service === 'asc' ? 1 : -1;

        //     const search = req.query.search;
        //     console.log(search);

        //     if(search.length){
        //         query = {
        //             $text : {$search: search},
        //             category_id :id
        //         }
        //     }

        //     const bikes = await bikeDetailsCollection.find(query).sort({resale_price: service}).toArray();
        //     res.send(bikes);


        //     // const result = await bikeDetailsCollection.find(query).sort({posted_date : -1}).toArray();
        //     // res.send(result);
        // })


        //Update User Profile
        app.put('/users', async(req, res) => {
            const updateUserInfo = req.body;
            
            const email = req.query.email;
            console.log("User from Update Profile Page", email);

            const query = {email: email};
            console.log("Email from Update Profile Page", email);

            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    name: updateUserInfo.name,
                    photo:updateUserInfo.photo
                }
            }
            const result = await usersCollection.updateOne(query, updatedDoc, options);
            res.send(result);
        })

        
        //get buyer's payment histiry by the buyer email;
        app.get('/paymentHistory', async (req, res) => {
            const email = req.query.email;
            console.log("User Email from Payment History Page", email);
            const query = {
                email: email
            }
            const result = await paymentsCollection.find(query).sort({_id: -1}).toArray();
            res.send(result);
        })

        
        //get all the registered users (role = buyer and role = seller but not admin) for admin
        app.get('/allUsers', async (req, res) => {
            
            const query = {}
            
            //jodi admin k chara baki user gula k show koraite chai
            // const query = {
                
            //     $and: [
            //         {role: {$ne: 'Admin'}}
            //     ]
            // }
            const result = await usersCollection.find(query).sort({_id: -1}).toArray();
            res.send(result);
        })

        //Admin can make any user admin if he/she wants
        app.put('/makeAdmin', async(req, res) => {
            const email = req.query.email;
            console.log("User Email From Client Side", email);

            const query = {email: email};
            const options = { upsert: true }

            const updatedDoc = {
                $set: {
                    role: 'Admin'
                }
            }
            const result = await usersCollection.updateOne(query, updatedDoc, options);
            res.send(result);

        })

    } 

    finally{

    }
}
run().catch(error => console.log(error))



app.get('/', (req, res) => {
    res.send('Best Bikes Store Server is running');
})

app.listen(port, (req, res) => {
    console.log('Best Bikes Store Server is running on Port', port)
})


