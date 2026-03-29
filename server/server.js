const express = require("express");
const app = express();
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const http = require("http");
const cors = require("cors");
const ACTIONS = require("./utils/actions");

app.use(express.json());
app.use(cors());

const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// ─── MongoDB (optional) ───────────────────────────────────────────────────────
let User = null; // stays null if MongoDB is unavailable

const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI && !MONGO_URI.includes("localhost")) {
  const mongoose = require("mongoose");
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log("✅ Connected to MongoDB");
      const userSchema = new mongoose.Schema({
        username: String,
        roomId: String,
      });
      User = mongoose.model("User", userSchema);
    })
    .catch((err) => {
      console.warn("⚠️  MongoDB unavailable — running without DB:", err.message);
      console.warn("   Username uniqueness will be checked in-memory only.");
    });
} else {
  console.log("ℹ️  No cloud MONGO_URI set — running without MongoDB (in-memory mode).");
}

// ─── In-memory user store ─────────────────────────────────────────────────────
let userSocketMap = [];

function getUsersInRoom(roomId) {
  return userSocketMap.filter((u) => u.roomId === roomId);
}

function getRoomId(socketId) {
  return userSocketMap.find((u) => u.socketId === socketId)?.roomId;
}

// Check username uniqueness — uses DB if available, memory otherwise
async function isUsernameTaken(roomId, username) {
  if (User) {
    const existing = await User.findOne({ roomId, username });
    return !!existing;
  }
  // fallback: check in-memory map
  return userSocketMap.some((u) => u.roomId === roomId && u.username === username);
}

async function saveUser(username, roomId) {
  if (User) {
    const u = new User({ username, roomId });
    await u.save();
  }
  // in-memory save happens when we push to userSocketMap below
}

async function removeUser(username, roomId) {
  if (User) {
    await User.deleteOne({ username, roomId }).catch(() => {});
  }
}

// ─── Socket.IO ────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {

  socket.on(ACTIONS.JOIN_REQUEST, async ({ roomId, username }) => {
    try {
      const taken = await isUsernameTaken(roomId, username);
      if (taken) {
        io.to(socket.id).emit(ACTIONS.USERNAME_EXISTS);
        return;
      }

      await saveUser(username, roomId);

      const user = {
        username,
        roomId,
        status: ACTIONS.USER_ONLINE,
        cursorPosition: 0,
        typing: false,
        socketId: socket.id,
        currentFile: null,
      };
      userSocketMap.push(user);
      socket.join(roomId);
      socket.broadcast.to(roomId).emit(ACTIONS.USER_JOINED, { user });
      const users = getUsersInRoom(roomId);
      io.to(socket.id).emit(ACTIONS.JOIN_ACCEPTED, { user, users });
    } catch (error) {
      console.error("Error joining room:", error.message);
      io.to(socket.id).emit(ACTIONS.USER_JOIN_ERROR, { error: "Internal server error" });
    }
  });

  socket.on("disconnecting", async () => {
    const user = userSocketMap.find((u) => u.socketId === socket.id);
    if (!user) return;
    await removeUser(user.username, user.roomId);
    socket.broadcast.to(user.roomId).emit(ACTIONS.USER_DISCONNECTED, { user });
    userSocketMap = userSocketMap.filter((u) => u.socketId !== socket.id);
    socket.leave(user.roomId);
  });

  socket.on(ACTIONS.SYNC_FILES, ({ files, currentFile, socketId }) => {
    io.to(socketId).emit(ACTIONS.SYNC_FILES, { files, currentFile });
  });

  socket.on(ACTIONS.FILE_CREATED,  ({ file }) => socket.broadcast.to(getRoomId(socket.id)).emit(ACTIONS.FILE_CREATED,  { file }));
  socket.on(ACTIONS.FILE_UPDATED,  ({ file }) => socket.broadcast.to(getRoomId(socket.id)).emit(ACTIONS.FILE_UPDATED,  { file }));
  socket.on(ACTIONS.FILE_RENAMED,  ({ file }) => socket.broadcast.to(getRoomId(socket.id)).emit(ACTIONS.FILE_RENAMED,  { file }));
  socket.on(ACTIONS.FILE_DELETED,  ({ id })   => socket.broadcast.to(getRoomId(socket.id)).emit(ACTIONS.FILE_DELETED,  { id }));

  socket.on(ACTIONS.USER_OFFLINE, ({ socketId }) => {
    userSocketMap = userSocketMap.map((u) =>
      u.socketId === socketId ? { ...u, status: ACTIONS.USER_OFFLINE } : u,
    );
    socket.broadcast.to(getRoomId(socketId)).emit(ACTIONS.USER_OFFLINE, { socketId });
  });

  socket.on(ACTIONS.USER_ONLINE, ({ socketId }) => {
    userSocketMap = userSocketMap.map((u) =>
      u.socketId === socketId ? { ...u, status: ACTIONS.USER_ONLINE } : u,
    );
    socket.broadcast.to(getRoomId(socketId)).emit(ACTIONS.USER_ONLINE, { socketId });
  });

  socket.on(ACTIONS.SEND_MESSAGE, ({ message }) => {
    socket.broadcast.to(getRoomId(socket.id)).emit(ACTIONS.RECEIVE_MESSAGE, { message });
  });

  socket.on(ACTIONS.TYPING_START, ({ cursorPosition }) => {
    userSocketMap = userSocketMap.map((u) =>
      u.socketId === socket.id ? { ...u, typing: true, cursorPosition } : u,
    );
    const user = userSocketMap.find((u) => u.socketId === socket.id);
    if (user) socket.broadcast.to(user.roomId).emit(ACTIONS.TYPING_START, { user });
  });

  socket.on(ACTIONS.TYPING_PAUSE, () => {
    userSocketMap = userSocketMap.map((u) =>
      u.socketId === socket.id ? { ...u, typing: false } : u,
    );
    const user = userSocketMap.find((u) => u.socketId === socket.id);
    if (user) socket.broadcast.to(user.roomId).emit(ACTIONS.TYPING_PAUSE, { user });
  });
});

// ─── REST ─────────────────────────────────────────────────────────────────────
app.get("/",     (req, res) => res.send("API is running successfully"));
app.post("/post",(req, res) => res.json({ message: "Received POST request" }));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
