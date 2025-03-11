const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
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
    const productCollection = client.db("panjabi-server").collection("products"); // কালেকশনের নাম

    // 🔹 API Route: সব প্রোডাক্ট পাওয়া যাবে
    app.get('/products', async (req, res) => {
      const products = await productCollection.find().toArray();
      res.send(products);
    });

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
