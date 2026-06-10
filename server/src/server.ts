import express from 'express';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors'
import 'dotenv/config';

const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors({
  origin: ['http://localhost:5173']
}))
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});
const Rooms = new Map<string, Socket[]>();

io.on('connection', (socket) => {

  socket.on('create-room', () => {
    let roomId = uuidv4();
    console.log(roomId);

    while (Rooms.has(roomId)) {
      roomId = uuidv4();
    }
    Rooms.set(roomId, [socket]);
    socket.join(roomId)
    socket.emit('roomId', {
      roomId
    })
  })

  socket.on('join-room', (data) => {
    const { roomId } = data;
    const room = Rooms.get(roomId);

    if (room) {
      room.push(socket)
      socket.join(roomId);
      socket.to(roomId).emit('viewer-joined');
    } else {
      socket.emit('room-error', {
        roomId,
        message: 'There is no such room'
      });
    }
  });

  socket.on('offer', (data) => {
    const { roomId } = data;
    if (!roomId) {
      socket.emit('roomId-missing', {
        message: 'Room Id Mixing'
      });
    } else {
      socket.to(roomId).emit('offer', data);
    }
  });

  socket.on('answer', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    if (data.candidate) {
      socket.to(data.roomId).emit('ice-candidate', data.candidate);
    }
  })

})


httpServer.listen(PORT, () => {
  console.log(`Server is Listening on port: ${PORT}`);
})
