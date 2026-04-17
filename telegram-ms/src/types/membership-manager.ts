export interface Member {
  membership_number: string;
  en_name: string;
  ar_name?: string | null;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  telegram_id?: string | null;
  telegram_username?: string | null;
}
