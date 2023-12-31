const express = require("express");
const http = require('http');
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://animated-crumble-127a7b.netlify.app",
        methods: ["GET", "POST"],
      },
});
app.use(cors({ origin: "*" }));

const route = require("./route");
app.use(route);

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

io.on("connection", (socket) => {
    console.log(`Socket Connected`, socket.id);
    socket.on('room:join', data => {
        const {email, room} = data
        emailToSocketIdMap.set(email, socket.id);
        socketidToEmailMap.set(socket.id, email);
        io.to(room).emit('user:joined', {
            email, id: socket.id 
        });
        socket.join(room);
        io.to(socket.id).emit("room:join", data);
    });
    socket.on('user:call', ({ to, offer}) => {
        io.to(to).emit('incomming:call', {from: socket.id, offer});
    });

    socket.on('call:accepted', ({ to, ans }) => {
        io.to(to).emit('call:accepted', {from: socket.id, ans});
    });

    socket.on('peer:nego:needed', ({ to, offer }) => {
        io.to(to).emit('peer:nego:needed', {from: socket.id, offer});
    });

    socket.on('peer:nego:done', ({to, ans}) => {
        io.to(to).emit('peer:nego:final', {from: socket.id, ans});

    })
});
server.listen(8000, () => {
    console.log('Socket.io server is running on port 8000');
});