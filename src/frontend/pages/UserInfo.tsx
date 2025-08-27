import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { clearAuthState } from '../utils/auth';

interface MemberInfo {
  membership_number: string;
  ar_name: string;
  latin_name: string;
  whatsapp: string;
  email: string;
  sex: string;
  birth_date: string;
  country: string;
  city: string;
  district: string;
  university: string;
  major: string;
  graduation_year: string;
  blood_type: string;
  phone: string;
}

interface UserInfoProps {
  onNavigate: (page: string) => void;
  initialMemberInfo?: MemberInfo;
}

export function UserInfo({ onNavigate, initialMemberInfo }: UserInfoProps) {
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(initialMemberInfo || null);
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateMember = async () => {
    if (!memberInfo) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/member/${memberInfo.membership_number}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberInfo),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Information updated successfully');
        setEditMode(false);
      } else {
        setError(data.error || 'Update failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (!memberInfo) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/member/${memberInfo.membership_number}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Password changed successfully');
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Password change failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!memberInfo) {
    return (
      <Layout title="Member Information">
        <div className="text-center">
          <p className="text-red-600">No member information available</p>
          <Button onClick={() => onNavigate('landing')} className="mt-4">
            Go to Home
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Member Information">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Welcome, {memberInfo.latin_name}</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setEditMode(!editMode)}
              variant={editMode ? 'secondary' : 'primary'}
            >
              {editMode ? 'Cancel' : 'Edit Information'}
            </Button>
            <Button
              onClick={() => {
                clearAuthState();
                onNavigate('landing');
              }}
              variant="secondary"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card title="Personal Information">
            <div className="grid gap-4">
              <Input
                label="Membership Number"
                value={memberInfo.membership_number}
                onChange={() => {}} // Read-only
                disabled={true}
              />
              
              <Input
                label="Arabic Name"
                value={memberInfo.ar_name}
                onChange={(value) => setMemberInfo({...memberInfo, ar_name: value})}
                disabled={!editMode}
              />
              
              <Input
                label="Latin Name"
                value={memberInfo.latin_name}
                onChange={(value) => setMemberInfo({...memberInfo, latin_name: value})}
                disabled={!editMode}
              />
              
              <Input
                label="Email"
                type="email"
                value={memberInfo.email}
                onChange={(value) => setMemberInfo({...memberInfo, email: value})}
                disabled={!editMode}
              />
              
              <Input
                label="Phone"
                value={memberInfo.phone}
                onChange={(value) => setMemberInfo({...memberInfo, phone: value})}
                disabled={!editMode}
              />
              
              <Input
                label="WhatsApp"
                value={memberInfo.whatsapp}
                onChange={(value) => setMemberInfo({...memberInfo, whatsapp: value})}
                disabled={!editMode}
              />
              
              <Input
                label="Sex"
                value={memberInfo.sex}
                onChange={(value) => setMemberInfo({...memberInfo, sex: value})}
                disabled={!editMode}
              />
              
              <Input
                label="Birth Date"
                type="date"
                value={memberInfo.birth_date}
                onChange={(value) => setMemberInfo({...memberInfo, birth_date: value})}
                disabled={!editMode}
              />
              
              <Input
                label="Blood Type"
                value={memberInfo.blood_type}
                onChange={(value) => setMemberInfo({...memberInfo, blood_type: value})}
                disabled={!editMode}
              />
            </div>
          </Card>

          {/* Location & Education */}
          <Card title="Location & Education">
            <div className="grid gap-4">
              <Input
                label="Country"
                value={memberInfo.country}
                onChange={(value) => setMemberInfo({...memberInfo, country: value})}
                disabled={!editMode}
              />
              
              <Input
                label="City"
                value={memberInfo.city}
                onChange={(value) => setMemberInfo({...memberInfo, city: value})}
                disabled={!editMode}
              />
              
              <Input
                label="District"
                value={memberInfo.district}
                onChange={(value) => setMemberInfo({...memberInfo, district: value})}
                disabled={!editMode}
              />
              
              <Input
                label="University"
                value={memberInfo.university}
                onChange={(value) => setMemberInfo({...memberInfo, university: value})}
                disabled={!editMode}
              />
              
              <Input
                label="Major"
                value={memberInfo.major}
                onChange={(value) => setMemberInfo({...memberInfo, major: value})}
                disabled={!editMode}
              />
              
              <Input
                label="Graduation Year"
                value={memberInfo.graduation_year}
                onChange={(value) => setMemberInfo({...memberInfo, graduation_year: value})}
                disabled={!editMode}
              />
            </div>

            {editMode && (
              <div className="mt-6">
                <Button
                  onClick={handleUpdateMember}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Updating...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Password Change Section */}
        <div className="mt-6">
          <Card title="Change Password">
            {!showPasswordForm ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Update your password for both the membership system and Moodle LMS
                </p>
                <Button
                  onClick={() => setShowPasswordForm(true)}
                  variant="secondary"
                >
                  Change Password
                </Button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword}>
                <div className="grid gap-4 max-w-md mx-auto">
                  <Input
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    required
                  />
                  
                  <Input
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={setNewPassword}
                    required
                  />
                  
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    required
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? 'Changing...' : 'Change Password'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowPasswordForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
