// Model for Telegram groups

export interface Group {
  id: string;
  chat_id: string;
  title: string;
  type: string;
  username: string | null;
  description: string | null;
  invite_link: string | null;
  is_active: number;
  member_count: number | null;
  admins: string; // JSON array string
  needs_admin_approval: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupModel {
  chat_id: string;
  title: string;
  type: string;
  username?: string | null;
  description?: string | null;
  invite_link?: string | null;
  is_active?: number;
  member_count?: number | null;
  admins?: string; // JSON array string
  needs_admin_approval?: number;
  notes?: string | null;
}

export interface GroupAdmin {
  user_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  status: 'creator' | 'administrator';
}

export interface GroupWithAdmins extends Omit<Group, 'admins'> {
  admins: GroupAdmin[];
}
