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
        setSuccess('تم تحديث المعلومات بنجاح');
        setEditMode(false);
      } else {
        setError(data.error || 'فشل في التحديث');
      }
    } catch (error) {
      setError('خطأ في الشبكة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('كلمات المرور الجديدة غير متطابقة');
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
        setSuccess('تم تغيير كلمة المرور بنجاح');
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'فشل في تغيير كلمة المرور');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!memberInfo) {
    return (
      <Layout title="معلومات العضو">
        <div className="text-center">
          <p className="text-red-600">لا توجد معلومات عضو متاحة</p>
          <Button onClick={() => onNavigate('landing')} className="mt-4">
            الذهاب للرئيسية
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="معلومات العضو">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">مرحباً، {memberInfo.latin_name}</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setEditMode(!editMode)}
              variant={editMode ? 'secondary' : 'primary'}
            >
              {editMode ? 'إلغاء' : 'تحرير المعلومات'}
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
          <Card title="المعلومات الشخصية">
            <div className="grid gap-4">
              <Input
                label="رقم العضوية"
                value={memberInfo.membership_number}
                onChange={() => {}} // Read-only
                disabled={true}
              />
              
              <Input
                label="الاسم العربي"
                value={memberInfo.ar_name}
                onChange={(value) => setMemberInfo({...memberInfo, ar_name: value})}
                disabled={!editMode}
              />
              
              <Input
                label="الاسم اللاتيني"
                value={memberInfo.latin_name}
                onChange={(value) => setMemberInfo({...memberInfo, latin_name: value})}
                disabled={!editMode}
              />
              
              <Input
                label="البريد الإلكتروني"
                type="email"
                value={memberInfo.email}
                onChange={(value) => setMemberInfo({...memberInfo, email: value})}
                disabled={!editMode}
              />
              
              <Input
                label="الهاتف"
                value={memberInfo.phone}
                onChange={(value) => setMemberInfo({...memberInfo, phone: value})}
                disabled={!editMode}
              />
              
              <Input
                label="واتساب"
                value={memberInfo.whatsapp}
                onChange={(value) => setMemberInfo({...memberInfo, whatsapp: value})}
                disabled={!editMode}
              />
              
              <Input
                label="الجنس"
                value={memberInfo.sex}
                onChange={(value) => setMemberInfo({...memberInfo, sex: value})}
                disabled={!editMode}
              />
              
              <Input
                label="تاريخ الميلاد"
                type="date"
                value={memberInfo.birth_date}
                onChange={(value) => setMemberInfo({...memberInfo, birth_date: value})}
                disabled={!editMode}
              />
              
              <Input
                label="فصيلة الدم"
                value={memberInfo.blood_type}
                onChange={(value) => setMemberInfo({...memberInfo, blood_type: value})}
                disabled={!editMode}
              />
            </div>
          </Card>

          {/* Location & Education */}
          <Card title="الموقع والتعليم">
            <div className="grid gap-4">
              <Input
                label="البلد"
                value={memberInfo.country}
                onChange={(value) => setMemberInfo({...memberInfo, country: value})}
                disabled={!editMode}
              />
              
              <Input
                label="المدينة"
                value={memberInfo.city}
                onChange={(value) => setMemberInfo({...memberInfo, city: value})}
                disabled={!editMode}
              />
              
              <Input
                label="الحي"
                value={memberInfo.district}
                onChange={(value) => setMemberInfo({...memberInfo, district: value})}
                disabled={!editMode}
              />
              
              <Input
                label="الجامعة"
                value={memberInfo.university}
                onChange={(value) => setMemberInfo({...memberInfo, university: value})}
                disabled={!editMode}
              />
              
              <Input
                label="التخصص"
                value={memberInfo.major}
                onChange={(value) => setMemberInfo({...memberInfo, major: value})}
                disabled={!editMode}
              />
              
              <Input
                label="سنة التخرج"
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
                  {isLoading ? 'جاري التحديث...' : 'حفظ التغييرات'}
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Password Change Section */}
        <div className="mt-6">
          <Card title="تغيير كلمة المرور">
            {!showPasswordForm ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  تحديث كلمة المرور الخاصة بك في نظام العضوية ومنصة التعلم
                </p>
                <Button
                  onClick={() => setShowPasswordForm(true)}
                  variant="secondary"
                >
                  تغيير كلمة المرور
                </Button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword}>
                <div className="grid gap-4 max-w-md mx-auto">
                  <Input
                    label="كلمة المرور الحالية"
                    type="password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    required
                  />
                  
                  <Input
                    label="كلمة المرور الجديدة"
                    type="password"
                    value={newPassword}
                    onChange={setNewPassword}
                    required
                  />
                  
                  <Input
                    label="تأكيد كلمة المرور الجديدة"
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
                      {isLoading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowPasswordForm(false)}
                      className="flex-1"
                    >
                      إلغاء
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
