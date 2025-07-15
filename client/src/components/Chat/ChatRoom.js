import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { useSocket } from '../../context/SocketContext';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import SendIcon from '@mui/icons-material/Send';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import './ChatRoom.css';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';

function ChatRoom() {
  const { userId } = useParams();
  const history = useHistory();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshotMetadata, setScreenshotMetadata] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Use the socket context
  const { socket, currentUser, joinRoom, sendMessage: socketSendMessage, onReceiveMessage } = useSocket();
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

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
        roomId,
        createdAt: new Date().toISOString() // Add this line
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

  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  if (!user || !currentUser) {
    return <Box className="loading"><Typography>Loading...</Typography></Box>;
  }

  return (
    <Paper
      elevation={0}
      className="chat-room"
      sx={{
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
        minWidth: '100vw',
        p: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
      }}
    >
      <Box className="chat-header" sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => history.push('/chats')} color="primary">
            <ArrowBackIosNewIcon />
          </IconButton>
          <Avatar
            onClick={() => history.push('/profile')}
            sx={{ cursor: 'pointer' }}
          >
            {user.username.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h6">{user.username}</Typography>
        </Stack>
        <IconButton onClick={handleMenuOpen} color="primary">
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
        >
          <MenuItem
            onClick={() => {
              handleMenuClose();
              captureScreenshot();
            }}
            >
            <CameraAltOutlinedIcon sx={{ mr: 1 }} /> Quick Screenshot
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              goToScreenshotEditor();
            }}
            >
            <EditOutlinedIcon sx={{ mr: 1 }} /> Advanced Editor
          </MenuItem>
        </Menu>
      </Box>

      <Box className="chat-container" ref={chatContainerRef} sx={{ flex: 1, overflowY: 'auto', p: 2, background: '#f9f9f9' }}>
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: msg.sender === currentUser._id ? 'row-reverse' : 'row',
              mb: 1.5,
              alignItems: 'flex-end',
            }}
          >
            <Avatar sx={{ bgcolor: msg.sender === currentUser._id ? 'primary.main' : 'grey.400', ml: msg.sender === currentUser._id ? 2 : 0, mr: msg.sender === currentUser._id ? 0 : 2 }}>
              {msg.sender === currentUser._id ? currentUser.username.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
            </Avatar>
            <Box
              sx={{
                bgcolor: msg.sender === currentUser._id ? 'primary.light' : 'grey.200',
                color: 'text.primary',
                px: 2,
                py: 1,
                borderRadius: 2,
                minWidth: 80,
                maxWidth: '70%',
                boxShadow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === currentUser._id ? 'flex-end' : 'flex-start',
              }}
            >
              {msg.isScreenshot ? (
                <Box className="screenshot-message">
                  <Typography variant="body2" fontWeight="bold">Screenshot</Typography>
                  {msg.screenshotMetadata && Object.entries(msg.screenshotMetadata).map(([key, value]) => (
                    <Typography key={key} variant="caption"><strong>{key}:</strong> {value}</Typography>
                  ))}
                </Box>
              ) : (
                <Typography variant="body1">{msg.content}</Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'right', width: '100%' }}>
                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </Typography>
            </Box>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {isCapturing && (
        <Dialog
          open={isCapturing}
          onClose={cancelScreenshot}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2, p: 2 }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', fontWeight: 500 }}>
            Add Details to Screenshot
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Title"
                name="title"
                value={screenshotMetadata.title || ''}
                onChange={updateScreenshotMetadata}
                fullWidth
                autoFocus
                variant="outlined"
              />
              <TextField
                label="Description"
                name="description"
                value={screenshotMetadata.description || ''}
                onChange={updateScreenshotMetadata}
                fullWidth
                multiline
                minRows={3}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Button
              onClick={takeScreenshot}
              variant="contained"
              startIcon={<CameraAltOutlinedIcon />}
              sx={{ minWidth: 160 }}
            >
              Capture & Send
            </Button>
            <Button
              onClick={cancelScreenshot}
              variant="outlined"
              color="secondary"
              sx={{ minWidth: 120 }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Box
        component="form"
        onSubmit={sendMessage}
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: '#fff',
          position: 'relative'
        }}
      >
        <IconButton
          onClick={() => setShowEmojiPicker((val) => !val)}
          sx={{ mr: 1 }}
        >
          <InsertEmoticonIcon />
        </IconButton>
        {showEmojiPicker && (
          <Box sx={{ position: 'absolute', bottom: 56, left: 0, zIndex: 10 }}>
            <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="light" />
          </Box>
        )}
        <TextField
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          fullWidth
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '999px', // fully rounded
              pr: 0, // remove extra padding on right
            },
            '& .MuiOutlinedInput-input': {
              py: 1.5, // adjust vertical padding if needed
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end" sx={{ mr: 1 }}>
                <IconButton
                  type="submit"
                  color="primary"
                  disabled={!newMessage.trim()}
                  sx={{
                    background: 'none',
                    borderRadius: '50%',
                    '&:hover': { background: 'rgba(25, 118, 210, 0.08)' },
                    p: 1,
                  }}
                  tabIndex={-1}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Paper>
  );
}

export default ChatRoom;