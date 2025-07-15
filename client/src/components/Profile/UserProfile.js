import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Avatar,
  TextField,
  Button,
  Stack,
  Typography,
  Snackbar,
  Alert,
  IconButton,
  Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useHistory } from 'react-router-dom';

function UserProfile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', avatar: null });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const history = useHistory();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
        setForm({ username: res.data.username, email: res.data.email, password: '', avatar: null });
        setAvatarPreview(res.data.avatarUrl || '');
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to load user info', severity: 'error' });
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, avatar: file }));
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Update avatar if changed
      if (form.avatar) {
        const formData = new FormData();
        formData.append('avatar', form.avatar);
        await axios.post('http://localhost:5000/api/users/me/avatar', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      // Update user info
      const updateData = { username: form.username, email: form.email };
      if (form.password) updateData.password = form.password;
      await axios.put('http://localhost:5000/api/users/me', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
      setEditMode(false);
      setForm((prev) => ({ ...prev, password: '', avatar: null }));
      // Refresh user info
      const res = await axios.get('http://localhost:5000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      setAvatarPreview(res.data.avatarUrl || '');
    } catch (err) {
      setSnackbar({ open: true, message: 'Update failed. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <Typography align="center" sx={{ mt: 4 }}>Loading...</Typography>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f9f9f9', py: 4 }}>
      <Box sx={{ maxWidth: 500, mx: 'auto', bgcolor: '#fff', p: 4, borderRadius: 2, boxShadow: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <IconButton onClick={() => history.goBack()} color="primary">
            <ArrowBackIosNewIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={500}>User Profile</Typography>
        </Stack>
        <Box display="flex" justifyContent="center" mb={2}>
          <Avatar src={avatarPreview} sx={{ width: 80, height: 80 }}>
            {user.username.charAt(0).toUpperCase()}
          </Avatar>
        </Box>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<PhotoCamera />}
              disabled={!editMode}
              sx={{ alignSelf: 'center', mb: 1 }}
            >
              Change Avatar
              <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </Button>
            <TextField
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              fullWidth
              disabled={!editMode}
              required
            />
            <TextField
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              disabled={!editMode}
              required
              type="email"
            />
            <TextField
              label="New Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              fullWidth
              disabled={!editMode}
              type="password"
              placeholder="Leave blank to keep current password"
            />
            {editMode ? (
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setEditMode(false);
                    setForm({ username: user.username, email: user.email, password: '', avatar: null });
                    setAvatarPreview(user.avatarUrl || '');
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            ) : (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
                sx={{ alignSelf: 'flex-end' }}
              >
                Edit
              </Button>
            )}
          </Stack>
        </form>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default UserProfile; 