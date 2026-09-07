import { io } from 'socket.io-client';

let socket = null;

/**
 * Get or initialize the singleton Socket.IO connection
 * @returns {Socket}
 */
export const getSocket = () => {
  if (!socket) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    // Strip trailing /api for socket connection
    const socketUrl = apiBase.replace(/\/api\/?$/, '');

    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to server:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection error:', err.message);
    });
  }

  return socket;
};

/**
 * Join creator notification room to receive real-time violation alerts across all exams
 * @param {string} creatorId
 */
export const joinCreatorRoom = (creatorId) => {
  if (!creatorId) return;
  const s = getSocket();
  if (s.connected) {
    s.emit('join_creator', creatorId);
  } else {
    s.once('connect', () => {
      s.emit('join_creator', creatorId);
    });
  }
};

/**
 * Join specific exam room for live monitoring
 * @param {string} examId
 */
export const joinExamRoom = (examId) => {
  if (!examId) return;
  const s = getSocket();
  if (s.connected) {
    s.emit('join_exam', examId);
  } else {
    s.once('connect', () => {
      s.emit('join_exam', examId);
    });
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default getSocket;
