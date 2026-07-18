const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'access_secret');
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.user._id})`);

    socket.join(`user_${socket.user._id}`);
    socket.join(`org_${socket.user.organizationId}`);

    socket.on('trip:join', (tripId) => {
      socket.join(`trip_${tripId}`);
      logger.info(`Socket ${socket.id} joined trip room: trip_${tripId}`);
    });

    socket.on('support:join', (targetUserId) => {
      const userId = targetUserId || socket.user._id;
      if (socket.user.role === 'admin' || socket.user._id === userId) {
        socket.join(`support_${userId}`);
        logger.info(`Socket ${socket.id} joined support room: support_${userId}`);
      }
    });

    socket.on('support:typing', (data) => {
      const { userId, isTyping } = data;
      socket.to(`support_${userId}`).emit('support:typing', { userId, isTyping });
    });

    socket.on('support:read', (data) => {
      const { userId } = data;
      socket.to(`support_${userId}`).emit('support:read_receipt', { userId });
    });

    socket.on('trip:location', async (data) => {
      const { tripId, lat, lng } = data;
      if (!tripId || !lat || !lng) return;

      const tripService = require('../services/trip.service'); 
      try {
        const { routeUpdate } = await tripService.updateTripLocation(socket.user._id, tripId, lat, lng);
        
        io.to(`trip_${tripId}`).emit('trip:location_update', {
          tripId,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          distanceKm: routeUpdate?.distanceKm,
          durationMin: routeUpdate?.durationMin,
          points: routeUpdate?.points,
          updatedAt: new Date()
        });
      } catch (err) {
        logger.error(`Failed to handle socket trip:location: ${err.message}`);
      }
    });

    socket.on('chat:message', async (data) => {
      const { tripId, content } = data;
      if (!tripId || !content) return;

      const miscService = require('../services/misc.service');
      try {
        const message = await miscService.createTripMessage(tripId, socket.user._id, content);
        const populatedMessage = await message.populate('senderId', 'name profilePhotoUrl');
        
        io.to(`trip_${tripId}`).emit('chat:message_received', populatedMessage);
      } catch (err) {
        logger.error(`Failed to handle socket chat:message: ${err.message}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => io;

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

const emitToTrip = (tripId, event, data) => {
  if (io) {
    io.to(`trip_${tripId}`).emit(event, data);
  }
};

const emitToOrg = (orgId, event, data) => {
  if (io) {
    io.to(`org_${orgId}`).emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIo,
  emitToUser,
  emitToTrip,
  emitToOrg
};
