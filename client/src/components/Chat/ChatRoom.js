import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { useSocket } from '../../context/SocketContext';
import './ChatRoom.css';

function ChatRoom() {
  const { userId } = useParams();
  const history = useHistory();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshotMetadata, setScreenshotMetadata] = useState({});
  
  // Use the socket context
  const { socket, currentUser, joinRoom, sendMessage: socketSendMessage, onReceiveMessage } = useSocket();
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Fetch user info
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      history.push('/');
      return;
    }

    // Get chat user info
    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    fetchUser();
  }, [userId, history]);

  // Join chat room when socket and users are ready
  useEffect(() => {
    if (socket && currentUser && user) {
      // Create a unique room ID for the two users
      const roomId = [currentUser._id, userId].sort().join('-');
      joinRoom(roomId);

      // Load previous messages
      const fetchMessages = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`http://localhost:5000/api/messages/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMessages(res.data);
        } catch (err) {
          console.error('Error fetching messages:', err);
        }
      };

      fetchMessages();

      // Set up message listener
      const cleanupListener = onReceiveMessage((message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      return () => {
        cleanupListener();
      };
    }
  }, [socket, currentUser, user, userId, joinRoom, onReceiveMessage]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (currentUser && user && socket) {
      const roomId = [currentUser._id, userId].sort().join('-');
      
      const messageData = {
        sender: currentUser._id,
        recipient: userId,
        content: newMessage,
        isScreenshot: false,
        roomId
      };

      // Send message through socket
      // Use the context's sendMessage function instead of direct socket.emit
      socketSendMessage(messageData);

      // Save message to database
      try {
        const token = localStorage.getItem('token');
        await axios.post('http://localhost:5000/api/messages', messageData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Error sending message:', err);
      }

      setNewMessage('');
    }
  };

  const captureScreenshot = () => {
    setIsCapturing(true);
  };
  
  const goToScreenshotEditor = () => {
    // Create a unique room ID for the two users
    const roomId = [currentUser._id, userId].sort().join('-');
    history.push(`/screenshot/${roomId}`);
  };

  const takeScreenshot = async () => {
    if (chatContainerRef.current) {
      try {
        const canvas = await html2canvas(chatContainerRef.current);
        const imgData = canvas.toDataURL('image/png');
        
        // Save screenshot locally
        saveAs(imgData, `chat-screenshot-${Date.now()}.png`);
        
        // Send screenshot as a message
        if (currentUser && user && socket) {
          const roomId = [currentUser._id, userId].sort().join('-');
          
          const messageData = {
            sender: currentUser._id,
            recipient: userId,
            content: 'Sent a screenshot',
            isScreenshot: true,
            screenshotMetadata: screenshotMetadata,
            roomId
          };

          // Use the context's sendMessage function instead of direct socket.emit
          socketSendMessage(messageData);

          // Save message to database
          try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/messages', messageData, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (err) {
            console.error('Error sending screenshot message:', err);
          }
        }
      } catch (err) {
        console.error('Error capturing screenshot:', err);
      }
    }
    setIsCapturing(false);
    setScreenshotMetadata({});
  };

  const cancelScreenshot = () => {
    setIsCapturing(false);
    setScreenshotMetadata({});
  };

  const updateScreenshotMetadata = (e) => {
    const { name, value } = e.target;
    setScreenshotMetadata(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!user || !currentUser) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="chat-room">
      <div className="chat-header">
        <button onClick={() => history.push('/chats')} className="back-button">
          Back
        </button>
        <h2>{user.username}</h2>
        <div className="header-buttons">
          <button onClick={captureScreenshot} className="screenshot-button">
            Quick Screenshot
          </button>
          <button onClick={goToScreenshotEditor} className="editor-button">
            Advanced Editor
          </button>
        </div>
      </div>

      <div className="chat-container" ref={chatContainerRef}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.sender === currentUser._id ? 'sent' : 'received'}`}
          >
            {msg.isScreenshot ? (
              <div className="screenshot-message">
                <p>Screenshot</p>
                {msg.screenshotMetadata && Object.entries(msg.screenshotMetadata).map(([key, value]) => (
                  <p key={key}><strong>{key}:</strong> {value}</p>
                ))}
              </div>
            ) : (
              <p>{msg.content}</p>
            )}
            <span className="timestamp">
              {new Date(msg.createdAt).toLocaleTimeString()}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isCapturing ? (
        <div className="screenshot-overlay">
          <div className="screenshot-form">
            <h3>Add Details to Screenshot</h3>
            <input
              type="text"
              name="title"
              placeholder="Title"
              value={screenshotMetadata.title || ''}
              onChange={updateScreenshotMetadata}
            />
            <textarea
              name="description"
              placeholder="Description"
              value={screenshotMetadata.description || ''}
              onChange={updateScreenshotMetadata}
            ></textarea>
            <div className="screenshot-actions">
              <button onClick={takeScreenshot} className="capture-btn">
                Capture & Send
              </button>
              <button onClick={cancelScreenshot} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={sendMessage} className="message-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit">Send</button>
        </form>
      )}
    </div>
  );
}

export default ChatRoom;