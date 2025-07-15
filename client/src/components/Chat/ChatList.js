import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { usersAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import './ChatList.css';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Badge from '@mui/material/Badge';
import CircleIcon from '@mui/icons-material/Circle';
import Typography from '@mui/material/Typography';

function ChatList() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const history = useHistory();
  const { unreadCounts, clearUnreadCount } = useSocket();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      history.push('/');
      return;
    }

    const fetchCurrentUser = async () => {
      try {
        const res = await usersAPI.getCurrentUser();
        setCurrentUser(res.data);
      } catch (err) {
        console.error('Error fetching current user:', err);
        localStorage.removeItem('token');
        history.push('/');
      }
    };

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await usersAPI.getAllUsers();
        setUsers(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again.');
        setLoading(false);
      }
    };

    fetchCurrentUser();
    fetchUsers();
  }, [history]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/');
  };

  const handleUserClick = (userId) => {
    // Clear unread count when user clicks on a chat
    clearUnreadCount(userId);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Combine server unread counts with real-time socket updates
  const getUnreadCount = (user) => {
    const serverCount = user.unreadCount || 0;
    const socketCount = unreadCounts[user._id] || 0;
    return Math.max(serverCount, socketCount);
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <Paper elevation={3} className="chat-list-container">
      <Box sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {currentUser && (
              <>
                <Avatar sx={{ mr: 1, cursor: 'pointer' }} onClick={() => history.push('/profile')} >{currentUser.username.charAt(0).toUpperCase()}</Avatar>
                <Typography variant="h6">{currentUser.username}</Typography>
              </>
            )}
          </Box>
          <Button
            variant="outlined"
            startIcon={<LogoutOutlinedIcon />}
            onClick={handleLogout}
            sx={{ textTransform: 'none' }}
          >
            Logout
          </Button>
        </Stack>
      </Box>

      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          label="Search users..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error && <div className="error-message">{error}</div>}

      <Box sx={{ p: 2 }}>
        <List>
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => {
              const unreadCount = getUnreadCount(user);
              return (
                <ListItem
                  button
                  component={Link}
                  to={`/chat/${user._id}`}
                  key={user._id}
                  onClick={() => handleUserClick(user._id)}
                  sx={{
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={unreadCount}
                      color="error"
                      invisible={!unreadCount || unreadCount === 0}
                    >
                      <Avatar>{user.username.charAt(0).toUpperCase()}</Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: unreadCount > 0 ? 'bold' : 'normal',
                            color: unreadCount > 0 ? 'text.primary' : 'text.secondary'
                          }}
                        >
                          {user.username}
                        </Typography>
                        {unreadCount > 0 && (
                          <Box sx={{ ml: 1, width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Stack direction="row" alignItems="center">
                        <CircleIcon sx={{ fontSize: 8, mr: 0.5 }} color={user.online ? 'success' : 'error'} />
                        {user.online ? 'Online' : 'Offline'}
                      </Stack>
                    }
                  />
                </ListItem>
              );
            })
          ) : (
            <Typography variant="body1" align="center">
              {searchTerm ? 'No users found matching your search' : 'No users available'}
            </Typography>
          )}
        </List>
      </Box>

      <Box sx={{ p: 2 }}>
        <Stack direction="column" alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <div className="logo-icon">
              <i className="chat-icon">💬</i>
            </div>
            <Typography variant="h5" component="h1" className="logo-text">
              Realtime Chat
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Version 1.0.0
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
}

export default ChatList;