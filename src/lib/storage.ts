import { TimerConfig, UserPreferences } from '../types/timer';

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

// Storage keys
const STORAGE_KEYS = {
  PREFERENCES: 'pomodoro_preferences',
  SESSIONS: 'pomodoro_sessions',
  STATISTICS: 'pomodoro_statistics',
  TIMER_CONFIG: 'pomodoro_config'
} as const;

// Session data interface
interface SessionData {
  id: string;
  startTime: string;
  endTime: string;
  phase: 'focus' | 'break' | 'longBreak';
  completed: boolean;
  duration: number; // in seconds
}

// Statistics interface
interface Statistics {
  totalFocusTime: number; // in seconds
  totalBreakTime: number; // in seconds
  completedSessions: number;
  dailyStreak: number;
  lastSessionDate: string | null;
}

// Default values
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  notifications: true,
  sound: true,
  autoStartBreaks: true,
  autoStartPomodoros: false
};

// Default timer configuration
const DEFAULT_CONFIG: TimerConfig = {
  focusDuration: 0.2, // 12 seconds
  breakDuration: 0.1, // 6 seconds
  longBreakDuration: 0.15, // 9 seconds
  sessionsUntilLongBreak: 4
};

const DEFAULT_STATISTICS: Statistics = {
  totalFocusTime: 0,
  totalBreakTime: 0,
  completedSessions: 0,
  dailyStreak: 0,
  lastSessionDate: null
};

// Safe localStorage access
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isClient) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isClient) return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  removeItem: (key: string): void => {
    if (!isClient) return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
};

// Initialize storage with default values if not present
const initializeStorage = () => {
  if (!isClient) return;

  // Only set defaults if the keys don't exist
  if (!safeLocalStorage.getItem(STORAGE_KEYS.PREFERENCES)) {
    safeLocalStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(DEFAULT_PREFERENCES));
  }

  if (!safeLocalStorage.getItem(STORAGE_KEYS.TIMER_CONFIG)) {
    safeLocalStorage.setItem(STORAGE_KEYS.TIMER_CONFIG, JSON.stringify(DEFAULT_CONFIG));
  }

  if (!safeLocalStorage.getItem(STORAGE_KEYS.SESSIONS)) {
    safeLocalStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
  }

  if (!safeLocalStorage.getItem(STORAGE_KEYS.STATISTICS)) {
    safeLocalStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(DEFAULT_STATISTICS));
  }
};

// Get user preferences
export const getPreferences = (): UserPreferences => {
  initializeStorage();
  const preferences = safeLocalStorage.getItem(STORAGE_KEYS.PREFERENCES);
  if (!preferences) {
    return DEFAULT_PREFERENCES;
  }
  const parsedPreferences = JSON.parse(preferences);
  return { ...DEFAULT_PREFERENCES, ...parsedPreferences };
};

// Save user preferences
export const savePreferences = (preferences: UserPreferences): void => {
  const validatedPreferences = { ...DEFAULT_PREFERENCES, ...preferences };
  safeLocalStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(validatedPreferences));
};

// Get timer configuration
export const getTimerConfig = (): TimerConfig => {
  initializeStorage();
  const config = safeLocalStorage.getItem(STORAGE_KEYS.TIMER_CONFIG);
  if (!config) {
    return DEFAULT_CONFIG;
  }
  const parsedConfig = JSON.parse(config);
  // Ensure all required fields are present with valid values
  return {
    focusDuration: Math.max(0.1, parsedConfig.focusDuration ?? DEFAULT_CONFIG.focusDuration),
    breakDuration: Math.max(0.1, parsedConfig.breakDuration ?? DEFAULT_CONFIG.breakDuration),
    longBreakDuration: Math.max(0.1, parsedConfig.longBreakDuration ?? DEFAULT_CONFIG.longBreakDuration),
    sessionsUntilLongBreak: Math.max(1, parsedConfig.sessionsUntilLongBreak ?? DEFAULT_CONFIG.sessionsUntilLongBreak)
  };
};

// Save timer configuration
export const saveTimerConfig = (config: TimerConfig): void => {
  // Validate and ensure all required fields are present with valid values
  const validatedConfig = {
    focusDuration: Math.max(0.1, config.focusDuration),
    breakDuration: Math.max(0.1, config.breakDuration),
    longBreakDuration: Math.max(0.1, config.longBreakDuration),
    sessionsUntilLongBreak: Math.max(1, config.sessionsUntilLongBreak)
  };
  safeLocalStorage.setItem(STORAGE_KEYS.TIMER_CONFIG, JSON.stringify(validatedConfig));
};

// Save completed session
export const saveSession = (session: Omit<SessionData, 'id'>): void => {
  const sessions = getSessions();
  const newSession: SessionData = {
    ...session,
    id: crypto.randomUUID()
  };
  sessions.push(newSession);
  safeLocalStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  updateStatistics(session);
};

// Get all sessions
export const getSessions = (): SessionData[] => {
  initializeStorage();
  const sessions = safeLocalStorage.getItem(STORAGE_KEYS.SESSIONS);
  if (!sessions) {
    return [];
  }
  return JSON.parse(sessions);
};

// Get statistics
export const getStatistics = (): Statistics => {
  initializeStorage();
  const stats = safeLocalStorage.getItem(STORAGE_KEYS.STATISTICS);
  if (!stats) {
    return DEFAULT_STATISTICS;
  }
  const parsedStats = JSON.parse(stats);
  return { ...DEFAULT_STATISTICS, ...parsedStats };
};

// Update statistics with new session
const updateStatistics = (session: Omit<SessionData, 'id'>): void => {
  const stats = getStatistics();
  const today = new Date().toISOString().split('T')[0];

  // Update total times
  if (session.phase === 'focus') {
    stats.totalFocusTime += session.duration;
  } else {
    stats.totalBreakTime += session.duration;
  }

  // Update completed sessions
  if (session.completed) {
    stats.completedSessions += 1;
  }

  // Update streak
  if (stats.lastSessionDate) {
    const lastDate = new Date(stats.lastSessionDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (today === stats.lastSessionDate) {
      // Same day, no streak change
    } else if (lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
      // Consecutive day, increment streak
      stats.dailyStreak += 1;
    } else {
      // Streak broken
      stats.dailyStreak = 1;
    }
  } else {
    // First session ever
    stats.dailyStreak = 1;
  }

  stats.lastSessionDate = today;
  safeLocalStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(stats));
};

// Clear all data (for testing or user request)
export const clearAllData = (): void => {
  if (!isClient) return;
  Object.values(STORAGE_KEYS).forEach(key => {
    safeLocalStorage.removeItem(key);
  });
  initializeStorage();
};

// Export data for backup
export const exportData = (): string => {
  const data = {
    preferences: getPreferences(),
    timerConfig: getTimerConfig(),
    sessions: getSessions(),
    statistics: getStatistics()
  };
  return JSON.stringify(data);
};

// Import data from backup
export const importData = (jsonData: string): boolean => {
  if (!isClient) return false;
  try {
    const data = JSON.parse(jsonData);
    if (data.preferences) savePreferences(data.preferences);
    if (data.timerConfig) saveTimerConfig(data.timerConfig);
    if (data.sessions) safeLocalStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions));
    if (data.statistics) safeLocalStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(data.statistics));
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

// Initialize storage on module load (client-side only)
if (isClient) {
  initializeStorage();
}
