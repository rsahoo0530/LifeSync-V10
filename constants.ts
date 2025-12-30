import { Category } from './types';

export const QUOTES = [
  "The secret of your future is hidden in your daily routine.",
  "Small steps in the right direction can turn out to be the biggest step of your life.",
  "Don't watch the clock; do what it does. Keep going.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Your life does not get better by chance, it gets better by change."
];

export const CATEGORIES: Category[] = ['Wealth', 'Health', 'Personal', 'Career', 'Other'];

export const MOODS = ['😊', '😐', '😢', '😡', '🤩', '😴', '🤔', '🥳'];

export const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];

// High-pitch, crisp UI sounds (Base64 WAV)
export const SOUNDS = {
    // Sharp 'Pop' for clicks
    click: 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAACAAAAAgAAAAIAAAACAAAA=', 
    // High-pitch 'Ding' for success
    success: 'data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU', 
    // Low 'Buzz' for error
    error: 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAACAAAAAgAAAAIAAAACAAAA=',
    // Magic 'Chime' for sparkles
    sparkle: 'data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'
};
// Note: Real binary data for sounds is truncated here for brevity in the prompt response, 
// but in a real app, these would be full base64 strings of actual .wav files.
// For this output, I will map them to the same functional placeholders but you should replace the strings with real wav base64s if you have them.
// To ensure they work now, I will use a generated beep via AudioContext in the AppContext if these strings fail, or rely on browser default.
