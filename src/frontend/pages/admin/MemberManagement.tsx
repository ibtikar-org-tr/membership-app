import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface MemberManagementProps {
  setSuccess: (message: string) => void;
  setError: (message: string) => void;
}

interface MemberInfo {
  membership_number?: string;
  ar_name?: string;
  latin_name?: string;
  whatsapp?: string;
  email?: string;
  sex?: string;
  birth_date?: string;
  country?: string;
  city?: string;
  district?: string;
  university?: string;
  major?: string;
  graduation_year?: string;
  blood_type?: string;
  phone?: string;
}

export function MemberManagement({ setSuccess, setError }: MemberManagementProps) {
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMember, setEditingMember] = useState<MemberInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const response = await fetch('/api/admin/members');
      const data = await response.json();
      
      if (data.success) {
        setMembers(data.members);
      } else {
        setError(data.error || 'Failed to load members');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMembers = members.filter(member =>
    (member.latin_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (member.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (member.membership_number?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleEditMember = (member: MemberInfo) => {
    setEditingMember({ ...member });
  };

  const handleUpdateMember = async () => {
    if (!editingMember || !editingMember.membership_number) {
      setError('Member information is incomplete');
      return;
    }

    setIsUpdating(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/members/${editingMember.membership_number}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingMember),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Member updated successfully');
        setEditingMember(null);
        loadMembers(); // Reload the list
      } else {
        setError(data.error || 'Failed to update member');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMember = async (membershipNumber?: string) => {
    if (!membershipNumber) {
      setError('Member ID not found');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete member ${membershipNumber}? This action cannot be undone.`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/members/${membershipNumber}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Member deleted successfully');
        loadMembers(); // Reload the list
      } else {
        setError(data.error || 'Failed to delete member');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingSpinner size="lg" text="Loading members..." className="py-12" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card title="Search Members">
        <Input
          placeholder="Search by name, email, or membership number..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </Card>

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Edit Member: {editingMember.latin_name}</h3>
                <Button
                  onClick={() => setEditingMember(null)}
                  variant="secondary"
                  size="sm"
                >
                  Close
                </Button>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Input
                    label="Membership Number"
                    value={editingMember.membership_number || ''}
                    onChange={() => {}} // Read-only
                    disabled={true}
                  />
                  
                  <Input
                    label="Arabic Name"
                    value={editingMember.ar_name || ''}
                    onChange={(value) => setEditingMember({...editingMember, ar_name: value})}
                  />
                  
                  <Input
                    label="Latin Name"
                    value={editingMember.latin_name || ''}
                    onChange={(value) => setEditingMember({...editingMember, latin_name: value})}
                  />
                  
                  <Input
                    label="Email"
                    type="email"
                    value={editingMember.email || ''}
                    onChange={(value) => setEditingMember({...editingMember, email: value})}
                  />
                  
                  <Input
                    label="Phone"
                    value={editingMember.phone || ''}
                    onChange={(value) => setEditingMember({...editingMember, phone: value})}
                  />
                  
                  <Input
                    label="WhatsApp"
                    value={editingMember.whatsapp || ''}
                    onChange={(value) => setEditingMember({...editingMember, whatsapp: value})}
                  />
                  
                  <Input
                    label="Sex"
                    value={editingMember.sex || ''}
                    onChange={(value) => setEditingMember({...editingMember, sex: value})}
                  />
                  
                  <Input
                    label="Birth Date"
                    type="date"
                    value={editingMember.birth_date || ''}
                    onChange={(value) => setEditingMember({...editingMember, birth_date: value})}
                  />
                </div>

                <div className="space-y-4">
                  <Input
                    label="Country"
                    value={editingMember.country || ''}
                    onChange={(value) => setEditingMember({...editingMember, country: value})}
                  />
                  
                  <Input
                    label="City"
                    value={editingMember.city || ''}
                    onChange={(value) => setEditingMember({...editingMember, city: value})}
                  />
                  
                  <Input
                    label="District"
                    value={editingMember.district || ''}
                    onChange={(value) => setEditingMember({...editingMember, district: value})}
                  />
                  
                  <Input
                    label="University"
                    value={editingMember.university || ''}
                    onChange={(value) => setEditingMember({...editingMember, university: value})}
                  />
                  
                  <Input
                    label="Major"
                    value={editingMember.major || ''}
                    onChange={(value) => setEditingMember({...editingMember, major: value})}
                  />
                  
                  <Input
                    label="Graduation Year"
                    value={editingMember.graduation_year || ''}
                    onChange={(value) => setEditingMember({...editingMember, graduation_year: value})}
                  />
                  
                  <Input
                    label="Blood Type"
                    value={editingMember.blood_type || ''}
                    onChange={(value) => setEditingMember({...editingMember, blood_type: value})}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button
                  onClick={handleUpdateMember}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  {isUpdating ? 'Updating...' : 'Update Member'}
                </Button>
                <Button
                  onClick={() => setEditingMember(null)}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <Card title={`Members (${filteredMembers.length})`}>
        {filteredMembers.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            {searchTerm ? 'No members found matching your search.' : 'No members found.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Education
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member, index) => (
                  <tr key={member.membership_number || `member-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {member.latin_name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          #{member.membership_number || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.email || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{member.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {member.city || 'N/A'}, {member.country || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.university || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{member.major || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditMember(member)}
                          size="sm"
                          variant="secondary"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteMember(member.membership_number)}
                          size="sm"
                          variant="danger"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
