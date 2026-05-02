// Model for tracking group members

export interface GroupMember {
  id: string;
  chat_id: string;
  user_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  status: 'member' | 'left' | 'kicked' | 'banned' | 'restricted' | 'creator' | 'administrator';
  joined_at: string;
  left_at: string | null;
  last_seen: string | null;
  invited_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupMemberModel {
  chat_id: string;
  user_id: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  status?: 'member' | 'left' | 'kicked' | 'banned' | 'restricted' | 'creator' | 'administrator';
  joined_at?: string;
  left_at?: string | null;
  last_seen?: string | null;
  invited_by?: string | null;
  notes?: string | null;
}

export type MemberStatus = 'member' | 'left' | 'kicked' | 'banned' | 'restricted' | 'creator' | 'administrator';

export interface MemberChangeEvent {
  type: 'joined' | 'left' | 'added' | 'removed' | 'banned' | 'unbanned' | 'promoted' | 'demoted';
  chat_id: string;
  user_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  invited_by?: string;
  timestamp: string;
}
