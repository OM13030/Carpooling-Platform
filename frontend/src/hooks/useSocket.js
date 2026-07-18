import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../features/auth/authStore';
import { useTripsStore } from '../features/trips/tripsStore';
import { useRidesStore } from '../features/rides/ridesStore';

export const useSocket = () => {
  const socketRef = useRef(null);
  const token = useAuthStore(state => state.accessToken);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const addLocalMessage = useTripsStore(state => state.addLocalMessage);
  const updateLocalLocation = useTripsStore(state => state.updateLocalLocation);
  const fetchMyRequests = useRidesStore(state => state.fetchMyRequests);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    socketRef.current = io({
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      console.log('Socket.io connected:', socketRef.current.id);
    });

    socketRef.current.on('chat:message_received', (message) => {
      addLocalMessage(message);
    });

    socketRef.current.on('trip:location_update', (locationUpdate) => {
      updateLocalLocation(locationUpdate);
    });

    socketRef.current.on('request:received', () => {
      fetchMyRequests();
    });

    socketRef.current.on('request:status_updated', (data) => {
      fetchMyRequests();
      window.dispatchEvent(new CustomEvent('request:status_changed', { detail: data }));
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket.io disconnected');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, token]);

  const joinTrip = (tripId) => {
    if (socketRef.current) {
      socketRef.current.emit('trip:join', tripId);
    }
  };

  const sendLocation = (tripId, lat, lng) => {
    if (socketRef.current) {
      socketRef.current.emit('trip:location', { tripId, lat, lng });
    }
  };

  const sendMessage = (tripId, content) => {
    if (socketRef.current) {
      socketRef.current.emit('chat:message', { tripId, content });
    }
  };

  return {
    socket: socketRef.current,
    joinTrip,
    sendLocation,
    sendMessage
  };
};
export default useSocket;
