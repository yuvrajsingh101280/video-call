import express from "express";

import http from "http"
import cors from "cors"
import { Server } from "socket.io"
// app reference
const app = express()
const server = http.createServer(app)
const io = new Server(server, {


    cors: {

        origin: "*",
        credentials: true,
        methods: ["GET", "POST"]

    }

})


// socket connection


io.on("connection", (socket) => {

    console.log("Socket connected", socket.id)
    socket.on("initiateCall", ({ userId, signalData, myId }) => {


        io.to(userId).emit("incomingCall", { signalData, from: myId })


    })

    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal)
    })

    socket.on("endCall", ({ to }) => {



        io.to(to).emit("callEnded")

    })
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

})



// middlewares
app.use(express.json()) // allows us to parse the incoming request from json payload or req.body

app.use(cors())
// Port
const Port = process.env.PORT || 5000

app.get("/", (req, res) => {
    res.send("<h1>hey  land</h1>")
})


server.listen(Port, () => {

    console.log(`server is ruuning on port http://localhost:${Port}`)

})