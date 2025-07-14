import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
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
        const messagesRes = await axios.get(`http://localhost:5000/api/messages/chat/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch user details for both users
        const user1Res = await axios.get(`http://localhost:5000/api/users/${user1Id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const user2Res = await axios.get(`http://localhost:5000/api/users/${user2Id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
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
    return <div className="loading">Loading chat data...</div>;
  }

  return (
    <div className="screenshot-tool">
      <div className="screenshot-header">
        <button onClick={() => history.goBack()} className="back-button">
          Back
        </button>
        <h2>Edit & Download Chat</h2>
        <button onClick={captureAndDownload} className="download-button">
          Download
        </button>
      </div>

      <div className="screenshot-options">
        <div className="option-group">
          <label>File Name:</label>
          <input 
            type="text" 
            value={fileName} 
            onChange={(e) => setFileName(e.target.value)} 
          />
        </div>
        
        <div className="option-group">
          <label>Format:</label>
          <select 
            value={fileFormat} 
            onChange={(e) => setFileFormat(e.target.value)}
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
          </select>
        </div>
        
        <div className="option-group">
          <label>Background:</label>
          <input 
            type="color" 
            name="backgroundColor" 
            value={customStyles.backgroundColor} 
            onChange={handleStyleChange} 
          />
        </div>
        
        <div className="option-group">
          <label>Sent Bubble:</label>
          <input 
            type="color" 
            name="sentBubbleColor" 
            value={customStyles.sentBubbleColor} 
            onChange={handleStyleChange} 
          />
        </div>
        
        <div className="option-group">
          <label>Received Bubble:</label>
          <input 
            type="color" 
            name="receivedBubbleColor" 
            value={customStyles.receivedBubbleColor} 
            onChange={handleStyleChange} 
          />
        </div>
        
        <div className="option-group">
          <label>Font:</label>
          <select 
            name="fontFamily" 
            value={customStyles.fontFamily} 
            onChange={handleStyleChange}
          >
            <option value="Arial, sans-serif">Arial</option>
            <option value="'Segoe UI', sans-serif">Segoe UI</option>
            <option value="'Roboto', sans-serif">Roboto</option>
            <option value="'Open Sans', sans-serif">Open Sans</option>
            <option value="'Comic Sans MS', cursive">Comic Sans</option>
          </select>
        </div>
        
        <div className="option-group">
          <label>Font Size:</label>
          <select 
            name="fontSize" 
            value={customStyles.fontSize} 
            onChange={handleStyleChange}
          >
            <option value="12px">Small</option>
            <option value="14px">Medium</option>
            <option value="16px">Large</option>
            <option value="18px">Extra Large</option>
          </select>
        </div>
      </div>

      <div 
        className="chat-preview" 
        ref={chatContainerRef}
        style={{
          backgroundColor: customStyles.backgroundColor,
          fontFamily: customStyles.fontFamily,
          fontSize: customStyles.fontSize
        }}
      >
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.sender === Object.keys(users)[0] ? 'sent' : 'received'}`}
            style={{
              backgroundColor: msg.sender === Object.keys(users)[0] 
                ? customStyles.sentBubbleColor 
                : customStyles.receivedBubbleColor
            }}
            onClick={() => handleEditMessage(msg)}
          >
            <div className="message-header">
              <span className="username">
                {users[msg.sender]?.username || 'Unknown User'}
              </span>
            </div>
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
      </div>

      {editMode && (
        <div className="edit-overlay">
          <div className="edit-form">
            <h3>Edit Message</h3>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            ></textarea>
            <div className="edit-actions">
              <button onClick={saveEditedMessage} className="save-btn">
                Save
              </button>
              <button onClick={() => setEditMode(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScreenshotTool;