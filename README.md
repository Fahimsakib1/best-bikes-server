# Best Bikes
Best Bikes is a platform to sell 2nd hand and used bikes. Where buyers can buy bikes and sellers can add their bikes for sale. There is a Admin in this website who can manage all the types of users and can remove any buyer and seller from the system. After adding the products seller can see the list of products and buyers can also seel the products they have purchased. There are many other features also which are described below.

This website is made by using React Router DOM, Firebase Authentication, amd Mongodb as the database. CRUD operation is the major part of this project. Besides tailwind css is used for the styling purpose. Some component libraries are also used for the design. React hot and sweet alert is added to show the alerts for better user experience.

This is project is basically divided in two parts. 
- Client Side
- Server Side


## Made the data and Hosted in Mongodb Server
- As this is a project which needs many data regarding to the brand and product details, so I have made all the data hosted on mongodb server.
- There is one database in this project and some database collections for the relevant purpose
- categoriesCollection is used for loading the brand category on the home page
- usersCollection is for the users who has signed up in this website and saved the user role in database
- bikeDetailsCollection is used for storing all the bike information that the seller has added to the server.
- reportedProductsCollection is used to getting the reported products by the user. Admin can delete this reports is he wants
- For deployment purpose I have hosted all the server data to vercel and add the vercel route link to get the from the client side
- CRUD operation is also implemented where needed in this website.
- JWT is one of the core purpose of this project also. It helps to secure the server side. If a user's token is not verified then he cant go on that route in clint side.



### GitHub Link (Client Side) of This Project: 
Github Link Client Side: https://github.com/programming-hero-web-course-4/b612-used-products-resale-clients-side-Fahimsakib1


### GitHub Link (Server Side) of This Project:
Github Link Server Side:  https://github.com/programming-hero-web-course-4/b612-used-products-resale-server-side-Fahimsakib1


### Firebase Live Site Link:
Live Site Link: 