export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeInput(input: string): string {
  return input.trim().toLowerCase();
}

export function escapeMarkdownV2(text: string): string {
  // Escape special characters for Telegram's MarkdownV2 format
  // Characters that need to be escaped: _ * [ ] ( ) ~ ` > # + - = | { } . !
  return text.replace(/[\_\*\[\]\(\)\~\`\>\#\+\-\=\|\{\}\.\!]/g, '\\$&');
}
