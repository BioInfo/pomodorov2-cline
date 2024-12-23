export interface TimerConfig {
  focusDuration: number;  // Duration in minutes
  breakDuration: number;  // Duration in minutes
  longBreakDuration: number;  // Duration in minutes
  sessionsUntilLongBreak: number;
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  currentPhase: 'focus' | 'break' | 'longBreak';
  timeRemaining: number;  // Time in seconds
  completedSessions: number;
}

export interface TimerStats {
  totalFocusTime: number;  // Total focus time in minutes
  totalBreakTime: number;  // Total break time in minutes
  completedSessions: number;
  dailyStreak: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  sound: boolean;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

// Subscription tier types
export type SubscriptionTier = 'free' | 'premium' | 'pro';

export interface SubscriptionFeatures {
  customTimerDurations: boolean;
  aiInsights: boolean;
  calendarSync: boolean;
  advancedAnalytics: boolean;
  premiumThemes: boolean;
}
