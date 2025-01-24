const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const helmet = require("helmet");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
const uri = "mongodb+srv://lromnav497:lromnav497@cluster0.g0des.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

app.use(express.json());
app.use(helmet());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const port = process.env.PORT || 8080;

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
    console.log("Conexión exitosa a MongoDB!");

    const database = client.db("concesionariosDB");
    const concesionariosCollection = database.collection("concesionarios");

    app.get("/concesionarios", async (req, res) => {
      const concesionarios = await concesionariosCollection.find({}).toArray();
      
      const concesionariosSinIdCoches = concesionarios.map(concesionario => {
        const concesionarioSinIdCoche = { ...concesionario };
        concesionarioSinIdCoche.coches = concesionario.coches.map(coche => {
          const { _id, ...rest } = coche;
          return rest;
        });
        return concesionarioSinIdCoche;
      });

      res.json(concesionariosSinIdCoches);
    });

    app.post("/concesionarios", async (req, res) => {
      const result = await concesionariosCollection.insertOne(req.body);
      res.json({ message: "Concesionario creado", id: result.insertedId });
    });

    app.get("/concesionarios/:id", async (req, res) => {
      const concesionario = await concesionariosCollection.findOne({ _id: new ObjectId(req.params.id) });
      res.json(concesionario);
    });

    app.put("/concesionarios/:id", async (req, res) => {
      const result = await concesionariosCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
      );
      res.json({ message: "Concesionario actualizado", modifiedCount: result.modifiedCount });
    });

    app.delete("/concesionarios/:id", async (req, res) => {
      const result = await concesionariosCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      res.json({ message: "Concesionario borrado", deletedCount: result.deletedCount });
    });

    app.get("/concesionarios/:id/coches", async (req, res) => {
      const concesionario = await concesionariosCollection.findOne({ _id: new ObjectId(req.params.id) });
      res.json(concesionario.coches);
    });

    app.post("/concesionarios/:id/coches", async (req, res) => {
      const result = await concesionariosCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $push: { coches: req.body } }
      );
      res.json({ message: "Coche añadido", modifiedCount: result.modifiedCount });
    });

    app.get("/concesionarios/:id/coches/:cocheIndex", async (req, res) => {
      const concesionario = await concesionariosCollection.findOne({ _id: new ObjectId(req.params.id) });
      const coche = concesionario.coches[parseInt(req.params.cocheIndex)];
      res.json(coche);
    });

    app.put("/concesionarios/:id/coches/:cocheIndex", async (req, res) => {
      const concesionario = await concesionariosCollection.findOne({ _id: new ObjectId(req.params.id) });
      const cocheIndex = parseInt(req.params.cocheIndex);
      concesionario.coches[cocheIndex] = req.body;
      const result = await concesionariosCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { coches: concesionario.coches } }
      );
      res.json({ message: "Coche actualizado", modifiedCount: result.modifiedCount });
    });

    app.delete("/concesionarios/:id/coches/:cocheIndex", async (req, res) => {
      const concesionario = await concesionariosCollection.findOne({ _id: new ObjectId(req.params.id) });
      const cocheIndex = parseInt(req.params.cocheIndex);
      concesionario.coches.splice(cocheIndex, 1);
      const result = await concesionariosCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { coches: concesionario.coches } }
      );
      res.json({ message: "Coche eliminado", modifiedCount: result.modifiedCount });
    });

  } finally {
    //await client.close(); // Comentado para mantener la conexión abierta
  }
}

app.listen(port, () => {
  console.log(`Servidor desplegado en puerto: ${port}`);
});

run().catch(console.dir);
