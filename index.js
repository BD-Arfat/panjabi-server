const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = 3000

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lzni2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log("MongoDB Connected Successfully!");

    // ✅ এখানে তোমার ডাটাবেস কালেকশন ব্যবহার করতে পারবে
    const productCollection = client.db("panjabi-server").collection("products");
    const cartsCollection = client.db("panjabi-server").collection("carts");
    const usersCollection = client.db("panjabi-server").collection("users");
    const reviewCollection = client.db("panjabi-server").collection("review");



    // verifyToken
    const verifyToken = (req, res, next) => {
      console.log('inside verifyToken', req.headers);
      if(!req.headers.authorization){
        return res.status(401).send({message : 'forbidden hiden'})
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded)=>{
        if(error){
          return res.status(401).send({message : 'forbidden access'})
        }
        req.decoded = decoded
        next()
      })
    }

    // jwt function
    app.post('/jwt',  async (req, res) => {
      console.log(req.headers)
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: '2h',
      })
      res.send({ token })
    })


    // admin
    app.get('/user/admin/:email', verifyToken, async(req,res) =>{
      const email = req.params.email;
      if(email !== req.decoded.email){
        return res.send(403).send({message : 'unauthorized access'})
      }
      const query = {email : email};
      const user = await usersCollection.findOne(query);
      let admin = false;
      if(user){
        admin = user?.role === 'admin'
      }
      res.send({admin})
    })


    // 🔹 API Route: সব প্রোডাক্ট পাওয়া যাবে
    app.get('/products', async (req, res) => {
      const products = await productCollection.find().toArray();
      res.send(products);
    });

    app.get('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result)
    });

    app.post('/carts', async (req, res) => {
      const cartsItem = req.body;
      const result = await cartsCollection.insertOne(cartsItem);
      res.send(result)
    })

    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const carts = await cartsCollection.find(query).toArray();
      res.send(carts)
    });

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartsCollection.deleteOne(query);
      res.send(result)
    });

    app.post('/users', async (req, res) => {
      const cartItem = req.body;
      const query = { email: cartItem.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', inSertId: null })
      }
      const result = await usersCollection.insertOne(cartItem);
      res.send(result)
    });

    app.get('/users', verifyToken, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    });

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result)
    });

    app.patch('/users/role/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      // ইউজারের বর্তমান রোল খুঁজে বের করা
      const user = await usersCollection.findOne(query);

      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }

      // নতুন রোল নির্ধারণ (toggle)
      const newRole = user.role === 'admin' ? 'user' : 'admin';

      const updatedDoc = {
        $set: { role: newRole }
      };

      const result = await usersCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    // Review
    app.post('/review', async (req, res) => {
      const cartItem = req.body;
      const result = await reviewCollection.insertOne(cartItem);
      res.send(result)
    });

    app.get('/review', async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result)
    });

    app.get('/review/:id', async (req, res) => {
      const id = req.params.id;
      const query = { productId: id };
      const result = await reviewCollection.find(query).toArray();
      res.send(result)
    })

  } catch (error) {
    console.error("Database Connection Error:", error);
  }
}

run();

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
