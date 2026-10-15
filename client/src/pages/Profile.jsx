import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Button from '../components/Button';
import Card from '../components/Card';
import FormField from '../components/FormField';
import Input from '../components/Input';
import Modal from '../components/Modal';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passLoading, setPassLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await api.put('/users/profile', { name });
      updateUser(res.data.user);
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setPassLoading(true);
    try {
      await api.put('/users/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      showToast('Password changed successfully', 'success');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setPassLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteLoading(true);

    try {
      await api.delete('/users/me', { data: { password: deletePassword } });
      logout();
      showToast('Your account and its data have been deleted.', 'success');
      navigate('/register', { replace: true });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete account', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteModalOpen(false);
    setDeletePassword('');
  };

  return (
    <div className="container page-narrow">
      <header className="page-header">
        <div className="page-header-copy">
          <h1>Account Settings</h1>
          <p className="page-description">Manage your profile and security preferences.</p>
        </div>
      </header>

      <Card className="profile-section">
        <h2>Personal Information</h2>
        <form onSubmit={handleProfileSubmit}>
          <FormField label="Email Address" htmlFor="profileEmail" hint="Email cannot be changed.">
            <Input type="email" id="profileEmail" value={user?.email || ''} disabled />
          </FormField>

          <FormField label="Full Name" htmlFor="name">
            <Input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>

          <Button type="submit" loading={profileLoading}>Save Profile</Button>
        </form>
      </Card>

      <Card className="profile-section">
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordSubmit}>
          <FormField label="Current Password" htmlFor="currentPassword">
            <Input
              type="password"
              id="currentPassword"
              required
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
            />
          </FormField>

          <FormField label="New Password (min. 6 characters)" htmlFor="newPassword">
            <Input
              type="password"
              id="newPassword"
              required
              minLength={6}
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            />
          </FormField>

          <FormField label="Confirm New Password" htmlFor="confirmPassword">
            <Input
              type="password"
              id="confirmPassword"
              required
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
            />
          </FormField>

          <Button type="submit" loading={passLoading}>Change Password</Button>
        </form>
      </Card>

      <Card className="danger-zone">
        <h2>Delete my account</h2>
        <p>
          Permanently delete your account, warranty records, and uploaded bill files. This action cannot be undone.
        </p>
        <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
          Delete my account
        </Button>
      </Card>

      <Modal
        open={deleteModalOpen}
        title="Confirm account deletion"
        onClose={closeDeleteModal}
        actions={(
          <>
            <Button variant="secondary" onClick={closeDeleteModal} disabled={deleteLoading}>Cancel</Button>
            <Button type="submit" variant="danger" form="delete-account-form" loading={deleteLoading}>
              Permanently delete
            </Button>
          </>
        )}
      >
        <p className="modal-copy">
          Enter your password to permanently delete your account and all its warranty data and uploaded files.
        </p>
        <form id="delete-account-form" onSubmit={handleDeleteAccount}>
          <FormField label="Password" htmlFor="deleteAccountPassword">
            <Input
              type="password"
              id="deleteAccountPassword"
              autoComplete="current-password"
              required
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoFocus
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
