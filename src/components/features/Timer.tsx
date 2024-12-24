'use client';

import { useState, useEffect, useCallback } from 'react';
import { TimerState, TimerConfig } from '../../types/timer';
import Button from '../core/Button';
import { initializeSounds, playSound, cleanupAudio } from '../../lib/sounds';
import {
  getPreferences,
  savePreferences,
  getTimerConfig,
  saveSession,
  getStatistics
} from '../../lib/storage';
import SettingsPanel from './SettingsPanel';

export default function Timer() {
  // Settings panel state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize timer state with stored config
  const [config, setConfig] = useState<TimerConfig>(() => {
    const savedConfig = getTimerConfig();
    return savedConfig;
  });

  const [stats, setStats] = useState(() => getStatistics());

  const [state, setState] = useState<TimerState>(() => {
    const savedConfig = getTimerConfig();
    const currentStats = getStatistics();
    return {
      isRunning: false,
      isPaused: false,
      currentPhase: 'focus',
      timeRemaining: Math.round(savedConfig.focusDuration * 60),
      completedSessions: currentStats.completedSessions || 0
    };
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMuted, setIsMuted] = useState(() => !getPreferences().sound);
  const [soundsInitialized, setSoundsInitialized] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  // Initialize state from localStorage on mount and when settings change
  useEffect(() => {
    const savedConfig = getTimerConfig();
    const preferences = getPreferences();
    const currentStats = getStatistics();
    
    setConfig(savedConfig);
    setIsMuted(!preferences.sound);
    setState(prev => ({
      ...prev,
      timeRemaining: Math.round(savedConfig.focusDuration * 60),
      completedSessions: currentStats.completedSessions
    }));
    setStats(currentStats);
  }, []);

  // Initialize sounds on first interaction
  const initializeSoundSystem = useCallback(async () => {
    if (!soundsInitialized) {
      const success = await initializeSounds();
      setSoundsInitialized(success);
    }
  }, [soundsInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  // Format time remaining into MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get duration for current phase
  const getCurrentPhaseDuration = (phase = state.currentPhase) => {
    switch (phase) {
      case 'focus':
        return config.focusDuration;
      case 'break':
        return config.breakDuration;
      case 'longBreak':
        return config.longBreakDuration;
      default:
        return config.focusDuration;
    }
  };

  // Calculate progress percentage
  const getProgress = () => {
    const totalSeconds = Math.round(getCurrentPhaseDuration() * 60);
    const progress = ((totalSeconds - state.timeRemaining) / totalSeconds) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  // Play phase transition sound
  const playPhaseSound = (nextPhase: 'focus' | 'break' | 'longBreak') => {
    if (isMuted || !soundsInitialized) return;

    switch (nextPhase) {
      case 'focus':
        playSound('timerComplete', { pitch: 1.2, volume: 0.6 });
        break;
      case 'break':
        playSound('timerComplete', { pitch: 0.8, volume: 0.6 });
        break;
      case 'longBreak':
        playSound('timerComplete', { pitch: 0.6, volume: 0.6 });
        break;
    }
  };

  // Save completed session
  const saveCompletedSession = () => {
    if (!sessionStartTime) return;

    const session = {
      startTime: sessionStartTime,
      endTime: new Date().toISOString(),
      phase: state.currentPhase,
      completed: true,
      duration: Math.round(getCurrentPhaseDuration() * 60)
    };

    saveSession(session);
    const updatedStats = getStatistics();
    setStats(updatedStats);
    setState(prev => ({
      ...prev,
      completedSessions: updatedStats.completedSessions
    }));
  };

  // Handle phase completion
  const handlePhaseComplete = useCallback(() => {
    setIsTransitioning(true);
    
    // Save completed session
    saveCompletedSession();

    const nextPhase = state.currentPhase === 'focus'
      ? (state.completedSessions + 1) % config.sessionsUntilLongBreak === 0
        ? 'longBreak'
        : 'break'
      : 'focus';

    const nextSessionCount = state.currentPhase === 'focus'
      ? state.completedSessions + 1
      : state.completedSessions;

    playPhaseSound(nextPhase);

    // Short delay for transition animation
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isRunning: nextPhase !== 'focus', // Auto-start breaks
        currentPhase: nextPhase,
        timeRemaining: Math.round(getCurrentPhaseDuration(nextPhase) * 60),
        completedSessions: nextSessionCount
      }));
      setIsTransitioning(false);
      
      // Start new session timer if auto-starting
      if (nextPhase !== 'focus') {
        setSessionStartTime(new Date().toISOString());
      }
    }, 500);
  }, [state.currentPhase, state.completedSessions, config.sessionsUntilLongBreak, config.focusDuration, config.breakDuration, config.longBreakDuration, playPhaseSound, saveCompletedSession, setIsTransitioning, setState, sessionStartTime]);

  // Timer controls
  const startTimer = async () => {
    await initializeSoundSystem();
    setSessionStartTime(new Date().toISOString());
    setState(prev => ({ ...prev, isRunning: true, isPaused: false }));
  };

  const pauseTimer = () => {
    setState(prev => ({ ...prev, isPaused: true }));
  };

  const resetTimer = () => {
    setIsTransitioning(true);
    setSessionStartTime(null);
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isRunning: false,
        isPaused: false,
        timeRemaining: Math.round(getCurrentPhaseDuration() * 60)
      }));
      setIsTransitioning(false);
    }, 300);
  };

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (state.isRunning && !state.isPaused && !isTransitioning) {
      interval = setInterval(() => {
        setState(prev => {
          if (prev.timeRemaining <= 0) {
            clearInterval(interval);
            handlePhaseComplete();
            return prev;
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [state.isRunning, state.isPaused, isTransitioning, handlePhaseComplete]);

  // Get phase-specific styles
  const getPhaseStyles = () => {
    switch (state.currentPhase) {
      case 'focus':
        return 'text-blue-500';
      case 'break':
        return 'text-green-500';
      case 'longBreak':
        return 'text-purple-500';
      default:
        return 'text-blue-500';
    }
  };

  // Handle mute toggle
  const handleMuteToggle = async () => {
    await initializeSoundSystem();
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Save sound preference
    const preferences = getPreferences();
    savePreferences({
      ...preferences,
      sound: !newMutedState
    });
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Handle settings changes
  const handleSettingsChange = () => {
    // Get the latest config and preferences
    const newConfig = getTimerConfig();
    const preferences = getPreferences();
    
    // Update state with new values
    setConfig(newConfig);
    setIsMuted(!preferences.sound);
    
    // Update timer if not running
    if (!state.isRunning) {
      setState(prev => ({
        ...prev,
        timeRemaining: Math.round(newConfig.focusDuration * 60)
      }));
    }
  };

  return (
    <div className="relative flex flex-col items-center space-y-8 p-8">
      {/* Settings button */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="absolute right-8 top-8 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-zinc-800"
        title="Settings"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Progress ring */}
      <div className={`relative transition-transform duration-300 ${isTransitioning ? 'scale-95' : 'scale-100'}`}>
        <svg className="w-64 h-64 transform -rotate-90">
          <circle
            className="text-gray-200"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="120"
            cx="128"
            cy="128"
          />
          <circle
            className={`${getPhaseStyles()} transition-all duration-1000 ease-in-out`}
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * ((100 - getProgress()) / 100)}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="120"
            cx="128"
            cy="128"
          />
        </svg>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          <div className={`text-6xl font-bold font-mono timer-display ${getPhaseStyles()}`}>
            {formatTime(state.timeRemaining)}
          </div>
        </div>
      </div>
      
      <div className={`text-xl transition-colors duration-300 ${getPhaseStyles()}`}>
        {state.currentPhase === 'longBreak' ? 'Long Break' : 
         `${state.currentPhase.charAt(0).toUpperCase() + state.currentPhase.slice(1)} Time`}
      </div>

      <div className="flex space-x-4">
        {!state.isRunning ? (
          <Button onClick={startTimer} className="button-hover-effect">Start</Button>
        ) : (
          <Button onClick={pauseTimer} variant="secondary" className="button-hover-effect">
            {state.isPaused ? 'Resume' : 'Pause'}
          </Button>
        )}
        <Button onClick={resetTimer} variant="outline" className="button-hover-effect">Reset</Button>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="text-sm text-gray-600">
            Sessions completed: {stats.completedSessions}
          </div>
          <div className="text-xs text-gray-500">
            {state.completedSessions % config.sessionsUntilLongBreak} / {config.sessionsUntilLongBreak} until long break
          </div>
        </div>

        <div className="flex space-x-8 text-sm text-gray-600">
          <div className="flex flex-col items-center">
            <span className="font-semibold">{formatDuration(stats.totalFocusTime)}</span>
            <span className="text-xs text-gray-500">Focus Time</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-semibold">{stats.dailyStreak}</span>
            <span className="text-xs text-gray-500">Day Streak</span>
          </div>
        </div>

        <button
          onClick={handleMuteToggle}
          className={`mt-2 text-sm ${isMuted ? 'text-gray-400' : 'text-gray-600'} hover:text-gray-800 transition-colors`}
        >
          {isMuted ? '🔇 Unmute' : '🔊 Mute'}
        </button>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}
