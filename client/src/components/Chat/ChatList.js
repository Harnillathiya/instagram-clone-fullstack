import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import axios from 'axios';
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      history.push('/');
      return;
    }

    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
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
        const res = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
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

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            filteredUsers.map(user => (
              <ListItem
                button
                component={Link}
                to={`/chat/${user._id}`}
                key={user._id}
                sx={{
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar>{user.username.charAt(0).toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.username}
                  secondary={
                    <Stack direction="row" alignItems="center">
                      <CircleIcon sx={{ fontSize: 8, mr: 0.5 }} color={user.online ? 'success' : 'error'} />
                      {user.online ? 'Online' : 'Offline'}
                    </Stack>
                  }
                />
                {user.unreadCount > 0 && (
                  <Badge badgeContent={user.unreadCount} color="primary" />
                )}
              </ListItem>
            ))
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