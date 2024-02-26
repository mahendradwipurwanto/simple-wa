const express = require('express')
const {createServer} = require('node:http')
const {RemoteAuth} = require("whatsapp-web.js")
const mongoose = require("mongoose");
const {Server} = require("socket.io")
const {Client} = require("whatsapp-web.js")
const {MongoStore} = require("wwebjs-mongo");

const app = express()
const server = createServer(app)
const MONGO_URI = "mongodb+srv://ngodingin:Ngodingin2023*@whatsapp-api-js.bzhjig9.mongodb.net/whatsapp-api-js"

let store;

mongoose.connect(MONGO_URI).then(() => {
    store = new MongoStore({mongoose});
    console.log("Connected to MongoDB")
}).catch((err) => {
    console.log("Error connecting to MongoDB", err)
})

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", methods: ["GET", "POST"]
    }
})

server.listen(3000, () => {
    console.log('listening at port 3000')
})

const Sessions = {}

app.get('/', (req, res) => {
    res.status(200).json({message: 'Hello World'})
})

app.get('/init-client', (req, res) => {
    //called function to create session
    createWhatsappSession(req.query.id)
    res.status(200).json({message: 'Client is ready'})
})

app.get('/get-session', (req, res) => {
    //called function to get session
    getWhatsappSession(req.query.id)
    res.status(200).json({message: 'Client is ready'})
})

//when get action from socket io to create session
io.on("connection", (socket) => {
    socket.on("create-session", (id) => {
        createWhatsappSession(id, socket)
    })

    socket.on("get-session", (id) => {
        getWhatsappSession(id)
    })
})

const createWhatsappSession = (id, socket) => {
    const client = new Client({
        puppeteer: {
            headless: true
        }, authStrategy: new RemoteAuth({
            clientId: id,
            store: store,
            backupSyncIntervalMs: 300000
        })
    })

    client.on("qr", (qr) => {
        console.log("qr sended", qr)
        socket.emit("qr", {
            qr,
        })
    })

    client.on("authenticated", (session) => {
        console.log("authenticated", session)
    })

    client.on("ready", () => {
        console.log("client is ready")
        Sessions[id] = client
        socket.emit("ready", {
            id, message: "Client is ready"
        })
    })

    client.on("remote_session_saved", () => {
        console.log("remote session saved")
    })
}

const getWhatsappSession = (id) => {
    const client = new Client({
        puppeteer: {
            headless: false
        }, authStrategy: new RemoteAuth({
            clientId: id,
            store: store,
            backupSyncIntervalMs: 300000
        })
    })

    client.on("ready", () => {
        console.log("client is ready")

        socket.emit("ready", {
            id, message: "Client is ready"
        })
    })

    client.on("qr", (qr) => {
        console.log("qr sended", qr)
        socket.emit("qr", {
            qr,
        })
    })
}
