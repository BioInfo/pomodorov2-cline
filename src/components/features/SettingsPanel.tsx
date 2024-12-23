'use client';

import { useState, useEffect } from 'react';
import { TimerConfig, UserPreferences } from '../../types/timer';
import Modal from '../core/Modal';
import { getPreferences, savePreferences, getTimerConfig, saveTimerConfig } from '../../lib/storage';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: () => void;
}

export default function SettingsPanel({ isOpen, onClose, onSettingsChange }: SettingsPanelProps) {
  // Timer configuration state
  const [config, setConfig] = useState<TimerConfig>(getTimerConfig());
  const [preferences, setPreferences] = useState<UserPreferences>(getPreferences());

  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load current settings when panel opens
  useEffect(() => {
    if (isOpen) {
      const savedConfig = getTimerConfig();
      setConfig(savedConfig);
      setPreferences(getPreferences());
    }
  }, [isOpen]);

  // Handle input change for timer durations
  const handleDurationChange = (field: keyof TimerConfig, value: string) => {
    // Remove any leading zeros and handle empty string
    const cleanValue = value.replace(/^0+(?=\d)/, '') || '0';
    const numValue = parseFloat(cleanValue);

    // Update config with the cleaned numeric value
    const newConfig = {
      ...config,
      [field]: numValue
    };

    // Save immediately to ensure value persists
    if (numValue > 0) {
      // Save to localStorage first
      saveTimerConfig(newConfig);
      // Then update local state with the saved value to ensure consistency
      const savedConfig = getTimerConfig();
      setConfig(savedConfig);
      // Notify parent of changes
      onSettingsChange();
    }

    // Validate input
    if (numValue <= 0) {
      setErrors(prev => ({
        ...prev,
        [field]: 'Duration must be greater than 0'
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle preference toggles
  const handlePreferenceChange = (field: keyof UserPreferences, value: boolean | string) => {
    const newPreferences = {
      ...preferences,
      [field]: value
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
    onSettingsChange();
  };

  // Save settings
  const handleSave = () => {
    // Validate all fields
    if (Object.keys(errors).length > 0) return;

    // Save all changes one final time
    saveTimerConfig(config);
    savePreferences(preferences);
    onSettingsChange();

    // Close the modal
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      onSave={handleSave}
    >
      <div className="space-y-6">
        {/* Timer Durations */}
        <section>
          <h3 className="mb-4 text-lg font-medium dark:text-white">Timer Durations</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Focus Duration (minutes)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={config.focusDuration}
                onChange={(e) => handleDurationChange('focusDuration', e.target.value)}
                onBlur={(e) => {
                  // Force update with stored value on blur
                  const savedConfig = getTimerConfig();
                  setConfig(savedConfig);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white sm:text-sm"
              />
              {errors.focusDuration && (
                <p className="mt-1 text-sm text-red-600">{errors.focusDuration}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Break Duration (minutes)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={config.breakDuration}
                onChange={(e) => handleDurationChange('breakDuration', e.target.value)}
                onBlur={(e) => {
                  const savedConfig = getTimerConfig();
                  setConfig(savedConfig);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white sm:text-sm"
              />
              {errors.breakDuration && (
                <p className="mt-1 text-sm text-red-600">{errors.breakDuration}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Long Break Duration (minutes)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={config.longBreakDuration}
                onChange={(e) => handleDurationChange('longBreakDuration', e.target.value)}
                onBlur={(e) => {
                  const savedConfig = getTimerConfig();
                  setConfig(savedConfig);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white sm:text-sm"
              />
              {errors.longBreakDuration && (
                <p className="mt-1 text-sm text-red-600">{errors.longBreakDuration}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sessions Until Long Break
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={config.sessionsUntilLongBreak}
                onChange={(e) => handleDurationChange('sessionsUntilLongBreak', e.target.value)}
                onBlur={(e) => {
                  const savedConfig = getTimerConfig();
                  setConfig(savedConfig);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white sm:text-sm"
              />
              {errors.sessionsUntilLongBreak && (
                <p className="mt-1 text-sm text-red-600">{errors.sessionsUntilLongBreak}</p>
              )}
            </div>
          </div>
        </section>

        {/* Theme Settings */}
        <section>
          <h3 className="mb-4 text-lg font-medium dark:text-white">Theme</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Color Theme
              </label>
              <select
                value={preferences.theme}
                onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white sm:text-sm"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section>
          <h3 className="mb-4 text-lg font-medium dark:text-white">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sound Notifications
              </label>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.sound}
                  onChange={(e) => handlePreferenceChange('sound', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Browser Notifications
              </label>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.notifications}
                  onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Auto-start Settings */}
        <section>
          <h3 className="mb-4 text-lg font-medium dark:text-white">Auto-start</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto-start Breaks
              </label>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.autoStartBreaks}
                  onChange={(e) => handlePreferenceChange('autoStartBreaks', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto-start Pomodoros
              </label>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.autoStartPomodoros}
                  onChange={(e) => handlePreferenceChange('autoStartPomodoros', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}
