import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { usersAPI, messagesAPI } from '../../services/api';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import DownloadIcon from '@mui/icons-material/Download';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import './ScreenshotTool.css';

function ScreenshotTool() {
  const { chatId } = useParams();
  const history = useHistory();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [fileFormat, setFileFormat] = useState('png');
  const [fileName, setFileName] = useState(`chat-screenshot-${Date.now()}`);
  const [customStyles, setCustomStyles] = useState({
    backgroundColor: '#f9f9f9',
    sentBubbleColor: '#efefef',
    receivedBubbleColor: '#ffffff',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px'
  });
  
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      history.push('/');
      return;
    }

    const fetchChatData = async () => {
      try {
        setIsLoading(true);
        // Parse chatId to get both user IDs
        const [user1Id, user2Id] = chatId.split('-');
        
        // Fetch messages
        const messagesRes = await messagesAPI.getChatMessages(chatId);
        
        // Fetch user details for both users
        const user1Res = await usersAPI.getUserById(user1Id);
        
        const user2Res = await usersAPI.getUserById(user2Id);
        
        setMessages(messagesRes.data);
        setUsers({
          [user1Id]: user1Res.data,
          [user2Id]: user2Res.data
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching chat data:', err);
        setIsLoading(false);
      }
    };

    fetchChatData();
  }, [chatId, history]);

  const handleEditMessage = (message) => {
    setSelectedMessage(message);
    setEditedContent(message.content);
    setEditMode(true);
  };

  const saveEditedMessage = () => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg._id === selectedMessage._id 
          ? { ...msg, content: editedContent } 
          : msg
      )
    );
    setEditMode(false);
    setSelectedMessage(null);
  };

  const handleStyleChange = (e) => {
    const { name, value } = e.target;
    setCustomStyles(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const captureAndDownload = async () => {
    if (chatContainerRef.current) {
      try {
        const canvas = await html2canvas(chatContainerRef.current);
        const imgData = canvas.toDataURL(`image/${fileFormat}`);
        saveAs(imgData, `${fileName}.${fileFormat}`);
      } catch (err) {
        console.error('Error capturing screenshot:', err);
      }
    }
  };

  if (isLoading) {
    return <Box className="loading" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Typography>Loading chat data...</Typography></Box>;
  }

  return (
    <Box sx={{ width: '100vw', height: '100vh', minHeight: '100vh', minWidth: '100vw', m: 0, p: 0, bgcolor: customStyles.backgroundColor, display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={2} sx={{ borderRadius: 0, p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => history.goBack()} color="primary">
            <ArrowBackIosNewIcon />
          </IconButton>
          <Typography variant="h6">Edit & Download Chat</Typography>
        </Stack>
        <Button onClick={captureAndDownload} variant="contained" startIcon={<DownloadIcon />}>Download</Button>
      </Paper>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ flex: 1, px: 2, pb: 2 }}>
        {/* Options Panel */}
        <Paper elevation={1} sx={{ minWidth: 260, maxWidth: 320, p: 2, mb: { xs: 2, md: 0 }, flexShrink: 0 }}>
          <Stack spacing={2}>
            <TextField
              label="File Name"
            value={fileName} 
            onChange={(e) => setFileName(e.target.value)} 
              fullWidth
              size="small"
          />
            <FormControl fullWidth size="small">
              <InputLabel>Format</InputLabel>
              <Select
            value={fileFormat} 
                label="Format"
            onChange={(e) => setFileFormat(e.target.value)}
          >
                <MenuItem value="png">PNG</MenuItem>
                <MenuItem value="jpeg">JPEG</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <Typography variant="body2" mb={0.5}>Background</Typography>
              <input type="color" name="backgroundColor" value={customStyles.backgroundColor} onChange={handleStyleChange} style={{ width: 40, height: 32, border: 'none', background: 'none' }} />
            </Box>
            <Box>
              <Typography variant="body2" mb={0.5}>Sent Bubble</Typography>
              <input type="color" name="sentBubbleColor" value={customStyles.sentBubbleColor} onChange={handleStyleChange} style={{ width: 40, height: 32, border: 'none', background: 'none' }} />
            </Box>
            <Box>
              <Typography variant="body2" mb={0.5}>Received Bubble</Typography>
              <input type="color" name="receivedBubbleColor" value={customStyles.receivedBubbleColor} onChange={handleStyleChange} style={{ width: 40, height: 32, border: 'none', background: 'none' }} />
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel>Font</InputLabel>
              <Select
            name="fontFamily" 
            value={customStyles.fontFamily} 
                label="Font"
            onChange={handleStyleChange}
          >
                <MenuItem value="Arial, sans-serif">Arial</MenuItem>
                <MenuItem value="'Segoe UI', sans-serif">Segoe UI</MenuItem>
                <MenuItem value="'Roboto', sans-serif">Roboto</MenuItem>
                <MenuItem value="'Open Sans', sans-serif">Open Sans</MenuItem>
                <MenuItem value="'Comic Sans MS', cursive">Comic Sans</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Font Size</InputLabel>
              <Select
            name="fontSize" 
            value={customStyles.fontSize} 
                label="Font Size"
            onChange={handleStyleChange}
          >
                <MenuItem value="12px">Small</MenuItem>
                <MenuItem value="14px">Medium</MenuItem>
                <MenuItem value="16px">Large</MenuItem>
                <MenuItem value="18px">Extra Large</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* Chat Preview */}
        <Paper elevation={1} sx={{ flex: 1, p: 2, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', background: customStyles.backgroundColor }}>
          <Stack spacing={2}>
        {messages.map((msg, index) => (
              <Box
            key={index} 
                sx={{
                  display: 'flex',
                  flexDirection: msg.sender === Object.keys(users)[0] ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
            }}
            onClick={() => handleEditMessage(msg)}
          >
                <Avatar sx={{ bgcolor: msg.sender === Object.keys(users)[0] ? 'primary.main' : 'grey.400', ml: msg.sender === Object.keys(users)[0] ? 2 : 0, mr: msg.sender === Object.keys(users)[0] ? 0 : 2 }}>
                  {users[msg.sender]?.username?.charAt(0).toUpperCase() || '?'}
                </Avatar>
                <Box
                  sx={{
                    bgcolor: msg.sender === Object.keys(users)[0] ? customStyles.sentBubbleColor : customStyles.receivedBubbleColor,
                    color: 'text.primary',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    minWidth: 80,
                    maxWidth: '70%',
                    boxShadow: 1,
                  }}
                >
                  <Box sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                {users[msg.sender]?.username || 'Unknown User'}
                    </Typography>
                  </Box>
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
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                  </Typography>
                </Box>
              </Box>
        ))}
          </Stack>
        </Paper>
      </Stack>

      {/* Edit Dialog */}
      <Dialog open={editMode} onClose={() => setEditMode(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Message</DialogTitle>
        <DialogContent>
          <TextField
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={saveEditedMessage} variant="contained">Save</Button>
          <Button onClick={() => setEditMode(false)} variant="outlined">Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ScreenshotTool;