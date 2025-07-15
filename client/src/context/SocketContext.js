import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

const ENDPOINT = 'http://localhost:5000';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

let socketInstance = null;

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const history = useHistory();
  const socketInitialized = useRef(false);

  // Initialize socket connection and fetch current user
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    // Get current user info
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(res.data);

        // Initialize socket only after we have the user and if not already initialized
        if (!socketInitialized.current) {
          // Use the singleton socket instance if it exists, otherwise create a new one
          if (!socketInstance) {
            console.log('Creating new socket instance');
            socketInstance = io(ENDPOINT);
          } else {
            console.log('Using existing socket instance');
          }
          
          setSocket(socketInstance);
          socketInitialized.current = true;

          // Set up event listeners only once
          if (!socketInstance._eventsCount || !socketInstance._eventsCount['connect']) {
            socketInstance.on('connect', () => {
              setIsConnected(true);
              console.log('Socket connected');
            });

            socketInstance.on('disconnect', () => {
              setIsConnected(false);
              console.log('Socket disconnected');
            });

            // Listen for unread count updates
            socketInstance.on('unread_count_update', (data) => {
              setUnreadCounts(prev => ({
                ...prev,
                [data.senderId]: data.count
              }));
            });
          } else {
            // If socket is already connected, update state
            if (socketInstance.connected) {
              setIsConnected(true);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
        localStorage.removeItem('token');
        if (history) history.push('/');
      }
    };

    fetchCurrentUser();

    // Clean up on unmount - we don't disconnect the socket here
    // as it's a singleton that should persist across component unmounts
    return () => {
      // We only clean up event listeners specific to this component instance
      // The socket connection itself remains active
    };
  }, [history]);

  // Join a chat room
  const joinRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('join_room', roomId);
      console.log(`Joined room: ${roomId}`);
    }
  };

  // Send a message
  const sendMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit('send_message', messageData);
    }
  };

  // Listen for messages with duplicate prevention
  const onReceiveMessage = (callback) => {
    if (socket) {
      // Remove any existing listeners with the same event name to prevent duplicates
      socket.off('receive_message');
      // Add the new listener
      socket.on('receive_message', (message) => {
        callback(message);
        
        // Update unread count for the sender if message is not from current user
        if (message.sender !== currentUser?._id) {
          setUnreadCounts(prev => ({
            ...prev,
            [message.sender]: (prev[message.sender] || 0) + 1
          }));
        }
      });
      
      // Return cleanup function
      return () => {
        if (socket) {
          socket.off('receive_message', callback);
        }
      };
    }
    return () => {};
  };

  // Update unread count for a specific user
  const updateUnreadCount = (userId, count) => {
    setUnreadCounts(prev => ({
      ...prev,
      [userId]: count
    }));
  };

  // Clear unread count for a specific user
  const clearUnreadCount = (userId) => {
    setUnreadCounts(prev => ({
      ...prev,
      [userId]: 0
    }));
  };

  const value = {
    socket,
    currentUser,
    isConnected,
    unreadCounts,
    joinRoom,
    sendMessage,
    onReceiveMessage,
    updateUnreadCount,
    clearUnreadCount
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;