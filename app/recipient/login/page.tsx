'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccentColor, getAccentCSSVars } from '@/lib/theme-config';
import type { AccentColor } from '@/lib/theme-config';
import { logger } from '@/lib/logger';

export default function RecipientLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accent, setAccent] = useState<AccentColor>(getAccentColor(undefined));

  useEffect(() => {
    // Fetch recipient info to get accent color
    const fetchRecipientInfo = async () => {
      try {
        const response = await fetch('/api/recipient-info');
        if (response.ok) {
          const data = await response.json();
          const accentColor = getAccentColor(data.recipientId);
          setAccent(accentColor);
        }
      } catch (error) {
        setAccent(getAccentColor(undefined));
      }
    };

    fetchRecipientInfo();

    // Check if already logged in
    const savedPassword = sessionStorage.getItem('adminPassword');
    if (savedPassword) {
      // Already logged in, redirect to memory board
      router.push('/memory-board');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Verify password by attempting to fetch notes
      const response = await fetch('/api/notes', {
        headers: {
          'x-admin-password': password,
        },
      });

      if (response.ok) {
        // Password is valid, store it and redirect
        sessionStorage.setItem('adminPassword', password);
        router.push('/memory-board');
      } else {
        setError('Invalid password. Please try again.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Login error:', message);
      setError('Failed to verify password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${accent.light} 0%, #ffffff 50%, ${accent.light} 100%)`,
        ...getAccentCSSVars(accent)
      }}
    >
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full blur-3xl"
             style={{ backgroundColor: accent.primary }}></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl"
             style={{ backgroundColor: accent.primary }}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100">
          <div
            className="w-16 h-1 rounded-full mx-auto mb-6 animate-pulse"
            style={{ backgroundColor: accent.primary }}
          ></div>

          <h2
            className="text-2xl font-bold text-center mb-2 tracking-tight"
            style={{ color: accent.primary, fontFamily: 'var(--font-title)' }}
          >
            View Your Birthday Notes
          </h2>

          <p className="text-center text-gray-600 mb-6" style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}>
            Enter your password to view all the wonderful messages you&apos;ve received
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-2 transition-all"
                style={{
                  borderColor: password ? accent.primary : undefined,
                  boxShadow: password ? `0 0 0 1px ${accent.primary}` : undefined
                }}
                placeholder="Enter your password"
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 py-3 px-4 rounded-lg border border-red-100">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: accent.primary,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = accent.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = accent.primary;
                }
              }}
            >
              {loading ? 'Verifying...' : 'View Your Notes'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
