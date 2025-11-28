// Simple Socket.io-client demo for subscribing to backend broadcast events
import { io } from "socket.io-client";
const socket = io(process.env.REACT_APP_WS_URL || "http://localhost:8000", {
  path: "/socket.io",
  transports: ["websocket"],
  autoConnect: true,
});
socket.on("connect", () => {
  console.log("WS connected", socket.id);
});
socket.on("broadcast", (msg) => {
  console.log("Broadcast message received:", msg);
});
export default socket;