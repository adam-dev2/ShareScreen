import express from 'express';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import 'dotenv/config';

const PORT = process.env.PORT || 4000;
const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL!;

app.use(cors({
  origin: FRONTEND_URL
}))


const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const Rooms = new Map<string, Socket[]>();

io.on('connection', (socket) => {
  socket.on('create-room', () => {
    let roomId = uuidv4();
    while (Rooms.has(roomId)) {
      roomId = uuidv4();
    }
    Rooms.set(roomId, [socket]);
    socket.join(roomId);
    socket.emit('roomId', { roomId });
  });

  socket.on('join-room', (data) => {
    const { roomId } = data;
    const room = Rooms.get(roomId);
    if (room) {
      room.push(socket);
      socket.join(roomId);
      // Notify only the sharer (everyone else in room except this viewer)
      socket.to(roomId).emit('viewer-joined');
    } else {
      socket.emit('room-error', {
        message: 'Room does not exist',
      });
    }
  });

  socket.on('offer', (data) => {
    const { roomId } = data;
    if (!roomId) {
      socket.emit('roomId-missing', { message: 'Room ID is missing' });
    } else {
      socket.to(roomId).emit('offer', data);
    }
  });

  socket.on('answer', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    const { roomId, candidate } = data;
    if (candidate && roomId) {
      socket.to(roomId).emit('ice-candidate', { candidate });
    }
  });

  socket.on('disconnect', () => {
    for (const [roomId, sockets] of Rooms.entries()) {
      if (sockets[0]?.id === socket.id) {
        socket.to(roomId).emit('sharer-disconnected');
        Rooms.delete(roomId);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
