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

/**
 * Convert priority codes (P0, P1, P2, P3) to Arabic words
 * If the priority is not a code, return it as is
 */
export function formatPriorityToArabic(priority: string): string {
  if (!priority) return priority;
  
  const trimmedPriority = priority.trim();
  const upperPriority = trimmedPriority.toUpperCase();
  
  // Check if it matches P0, P1, P2, or P3 (case insensitive)
  const priorityMap: Record<string, string> = {
    'P0': 'مستعجل جداً أو طارئ',
    'P1': 'مستعجل',
    'P2': 'متوسط',
    'P3': 'غير مستعجل'
  };
  
  if (priorityMap[upperPriority]) {
    return priorityMap[upperPriority];
  }
  
  // Return as is if it's not a priority code
  return priority;
}