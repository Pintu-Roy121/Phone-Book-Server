const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');


const port = process.env.PORT || 5000;

const app = express();

// middleware............................................................
app.use(cors());
app.use(express.json());



// Database Connection..................................................

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASSWORD}@cluster0.geiv5ao.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// verify JWT Token........................................
const verifyjwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized Access');
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
        if (error) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next()
    })

}



async function run() {
    try {
        const contactCollections = client.db('AddressBook').collection('contacts');

        // create Secret Token...........................................
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = {
                useremail: email
            }
            const user = await contactCollections.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '6d' })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: ' ' })
        })

        // get all contact from database...........................
        app.get('/allcontacts', verifyjwt, async (req, res) => {
            const email = req.query.email;
            // const decodedEmail = req.decoded.email;
            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'Forbidden access' })
            // }
            const query = {
                useremail: email
            };
            const result = await contactCollections.find(query).toArray();
            res.send(result);
        })

        // get specific contact ..................................
        app.get('/contact/:id', verifyjwt, async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: ObjectId(id)
            }
            const result = await contactCollections.findOne(query);
            res.send(result);
        })

        // Save all contact to database.............................
        app.post('/contacts', verifyjwt, async (req, res) => {
            const contact = req.body;
            const result = await contactCollections.insertOne(contact);
            res.send(result)
        });

        // Delete Contact ..............................
        app.delete('/contacts/:id', verifyjwt, async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: ObjectId(id)
            }
            const result = await contactCollections.deleteOne(query);
            res.send(result);
        })

        app.put('/singlecontact/:id', verifyjwt, async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const query = {
                _id: ObjectId(id)
            }
            const replacement = data;
            const result = await contactCollections.replaceOne(query, replacement);
            res.send(result);
        })

    }
    finally {

    }
}
run().catch(console.error);





app.get('/', async (req, res) => {
    res.send("Address Server is runnign");
})

app.listen(port, () => {
    console.log(`Server is running on PORT ${port}`);
})