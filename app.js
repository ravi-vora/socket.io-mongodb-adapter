const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/mongo-adapter");
const { MongoClient } = require("mongodb");
const { createServer } = require('http')
const express = require('express')

const DB = "adapters";
const COLLECTION = "socket.io-adapter-events";

const app = express();

app.use(express.static('view'))

const server = createServer(app);
const io = new Server(server);

const mongoClient = new MongoClient("mongodb://0.0.0.0:27017", {
  useUnifiedTopology: true,
});

const main = async () => {
  await mongoClient.connect();

  const mongoCollection = mongoClient.db(DB).collection(COLLECTION);

  await mongoCollection.createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 3600, background: true }
  );

  io.adapter(createAdapter(mongoCollection, {
    addCreatedAtField: true
  }));

  io.on('connection', ( socket ) => {
    console.log(socket.id)
    socket.on('message', (payload) => {
        socket.broadcast.emit('message', payload)
    })
  })
  server.listen(process.argv[2] || 3000, () => console.log(`server is running on port :: ${process.argv[2] || 3000}`));
}

main();