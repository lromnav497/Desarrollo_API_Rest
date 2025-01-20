const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const helmet = require("helmet"); // Requiere Helmet

// Inicializamos la aplicación
const app = express();

const uri = "mongodb+srv://lromnav497:lromnav497@cluster0.g0des.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Indicamos que la aplicación puede recibir JSON (API Rest)
app.use(express.json());
app.use(helmet()); // Usa Helmet

// Indicamos el puerto en el que vamos a desplegar la aplicación
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
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const database = client.db("concesionariosDB");
    const concesionariosCollection = database.collection("concesionarios");

    // Obtener todos los concesionarios
    app.get("/concesionarios", async (request, response) => {
      const concesionarios = await concesionariosCollection.find({}).toArray();
      response.json(concesionarios);
    });

    // Crear un nuevo concesionario
    app.post("/concesionarios", async (request, response) => {
      const result = await concesionariosCollection.insertOne(request.body);
      response.json({ message: "Concesionario creado", id: result.insertedId });
    });

    // Obtener un concesionario por ID
    app.get("/concesionarios/:id", async (request, response) => {
      const id = request.params.id;
      const concesionario = await concesionariosCollection.findOne({ _id: new ObjectId(id) });
      response.json(concesionario);
    });

    // Actualizar un concesionario por ID
    app.put("/concesionarios/:id", async (request, response) => {
      const id = request.params.id;
      const result = await concesionariosCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: request.body }
      );
      response.json({ message: "Concesionario actualizado", modifiedCount: result.modifiedCount });
    });

    // Borrar un concesionario por ID
    app.delete("/concesionarios/:id", async (request, response) => {
      const id = request.params.id;
      const result = await concesionariosCollection.deleteOne({ _id: new ObjectId(id) });
      response.json({ message: "Concesionario borrado", deletedCount: result.deletedCount });
    });

    // Obtener todos los coches de un concesionario por ID
    app.get("/concesionarios/:id/coches", async (request, response) => {
      const id = request.params.id;
      const concesionario = await concesionariosCollection.findOne({ _id: new ObjectId(id) });
      response.json(concesionario.coches);
    });

    // Añadir un nuevo coche a un concesionario por ID
    app.post("/concesionarios/:id/coches", async (request, response) => {
      const id = request.params.id;
      const coche = request.body;
      const result = await concesionariosCollection.updateOne(
        { _id: new ObjectId(id) },
        { $push: { coches: coche } }
      );
      response.json({ message: "Coche añadido", modifiedCount: result.modifiedCount });
    });

    // Obtener un coche por ID de un concesionario por ID
    app.get("/concesionarios/:id/coches/:cocheId", async (request, response) => {
      const id = request.params.id;
      const cocheId = request.params.cocheId;
      const concesionario = await concesionariosCollection.findOne({ _id: new ObjectId(id) });
      const coche = concesionario.coches.find(c => c._id.toString() === cocheId);
      response.json(coche);
    });

    // Actualizar un coche por ID de un concesionario por ID
    app.put("/concesionarios/:id/coches/:cocheId", async (request, response) => {
      const id = request.params.id;
      const cocheId = request.params.cocheId;
      const coche = request.body;
      const result = await concesionariosCollection.updateOne(
        { _id: new ObjectId(id), "coches._id": new ObjectId(cocheId) },
        { $set: { "coches.$": coche } }
      );
      response.json({ message: "Coche actualizado", modifiedCount: result.modifiedCount });
    });

    // Borrar un coche por ID de un concesionario por ID
    app.delete("/concesionarios/:id/coches/:cocheId", async (request, response) => {
      const id = request.params.id;
      const cocheId = request.params.cocheId;
      const result = await concesionariosCollection.updateOne(
        { _id: new ObjectId(id) },
        { $pull: { coches: { _id: new ObjectId(cocheId) } } }
      );
      response.json({ message: "Coche borrado", modifiedCount: result.modifiedCount });
    });

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close(); // Comentado para mantener la conexión abierta
  }
}
run().catch(console.dir);

// Arrancamos la aplicación
app.listen(port, () => {
  console.log(`Servidor desplegado en puerto: ${port}`);
});
