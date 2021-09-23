import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
// import router from './router'

import { addUser, removeUser, getUser, getUserInRoom } from './users.js';

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors())

const server = app.listen(PORT)
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    socket.emit('message', { user: 'admin', text: `${user.name}, welcome to the room ${user.room}` });
    socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name}, has joined!` });

    socket.join(user.room);

    io.to(user.room).emit('roomData', { room: user.room, users: getUserInRoom(user.room) })
    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('message', { user: user.name, text: message })

    callback();
  });


  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.` })
    }
  })
});

// app.use(router);

