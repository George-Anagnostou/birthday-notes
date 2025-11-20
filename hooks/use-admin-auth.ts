import { useState, useEffect } from 'react';
import { Note } from '@/types/note';
import { logger } from '@/lib/logger';

export interface UseAdminAuthReturn {
  notes: Note[];
  loading: boolean;
  error: string;
  password: string;
  authenticated: boolean;
  showPassword: boolean;
  setPassword: (password: string) => void;
  setError: (error: string) => void;
  handlePasswordSubmit: (e: React.FormEvent) => void;
  handleLogout: () => void;
  fetchNotes: (adminPassword: string) => Promise<void>;
  storedPassword: string;
}

/**
 * Custom hook for admin authentication and note fetching
 * Handles password verification, session management, and note retrieval
 */
export function useAdminAuth(): UseAdminAuthReturn {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  // Get stored admin password (client-side only, so no need for typeof window check)
  const storedPassword = sessionStorage.getItem('adminPassword') || '';

  // Check for stored admin session on mount
  useEffect(() => {
    const storedPassword = sessionStorage.getItem('adminPassword');
    if (storedPassword) {
      setLoading(true);
      fetchNotes(storedPassword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotes = async (adminPassword: string) => {
    try {
      const response = await fetch('/api/notes', {
        headers: {
          'x-admin-password': adminPassword,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes);
        setAuthenticated(true);
        setShowPassword(false);
        // Store password in session for persistence
        sessionStorage.setItem('adminPassword', adminPassword);
      } else {
        setError('Invalid password');
        // Clear any stored password if authentication fails
        sessionStorage.removeItem('adminPassword');
      }
    } catch (error: unknown) {
      setError('Failed to load notes');
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to load notes:', message);
      sessionStorage.removeItem('adminPassword');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    fetchNotes(password);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminPassword');
    setAuthenticated(false);
    setShowPassword(true);
    setNotes([]);
    setPassword('');
  };

  return {
    notes,
    loading,
    error,
    password,
    authenticated,
    showPassword,
    setPassword,
    setError,
    handlePasswordSubmit,
    handleLogout,
    fetchNotes,
    storedPassword,
  };
}
