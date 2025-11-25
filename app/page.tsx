'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

export default function Home() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/verify-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        // Store access code in session storage
        sessionStorage.setItem('accessCode', code);
        router.push('/submit');
      } else {
        setError('Invalid access code. Please try again.');
      }
    } catch (error: unknown) {
      setError('Something went wrong. Please try again.');
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4">
      <div className="max-w-md w-full">
        {/* Decorative elements */}
        <div className="text-center mb-8">
          <div className="inline-block relative">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 mb-2">
              Birthday Wishes
            </h1>
            <div className="absolute -top-6 -right-8 text-4xl animate-bounce">✨</div>
            <div className="absolute -bottom-2 -left-6 text-3xl animate-pulse">🎂</div>
          </div>
          <p className="mt-6 text-gray-600 text-lg">
            You&apos;ve been invited to share a special birthday message!
          </p>
        </div>

        {/* Access code form */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-pink-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your invite code
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="Enter code here"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 py-2 px-4 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Verifying...' : 'Continue 💌'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have a code? Contact the organizer for access.
        </p>
      </div>
    </main>
  );
}
