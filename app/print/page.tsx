'use client';

import { useState, useEffect } from 'react';
import { Note } from '@/types/note';
import { renderMarkdown } from '@/lib/markdown';

export default function PrintPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [birthdayName, setBirthdayName] = useState('');

  // Check for stored admin session on mount
  useEffect(() => {
    const storedPassword = sessionStorage.getItem('adminPassword');
    if (storedPassword) {
      setLoading(true);
      fetchNotes(storedPassword);
    }
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
        // Try to get birthday name from env, default to "You"
        setBirthdayName(process.env.NEXT_PUBLIC_BIRTHDAY_NAME || 'You');
      } else {
        setError('Invalid password');
        // Clear any stored password if authentication fails
        sessionStorage.removeItem('adminPassword');
      }
    } catch (err) {
      setError('Failed to load notes');
      console.error(err);
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

  const handlePrint = () => {
    window.print();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminPassword');
    setAuthenticated(false);
    setShowPassword(true);
    setNotes([]);
    setPassword('');
  };

  if (showPassword) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-pink-100">
            <h2 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 mb-6">
              Admin Access Required
            </h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  placeholder="Enter admin password"
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
                className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'View Print Version'}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="text-center">
          <div className="text-4xl mb-4">✨</div>
          <p className="text-gray-600">Loading birthday wishes...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            margin: 1in;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-after: always;
          }
        }
      `}</style>

      <main className="min-h-screen bg-white">
        {/* Header - hidden in print */}
        <div className="no-print bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white p-6">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Printable Birthday Letters</h1>
              <p className="text-white/90 mt-1">
                {notes.length} {notes.length === 1 ? 'message' : 'messages'} ready to print
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="bg-white text-purple-600 font-semibold py-2 px-6 rounded-xl hover:shadow-lg transition-all"
              >
                Print 🖨️
              </button>
              <a
                href="/scrapbook"
                className="bg-white/20 text-white font-semibold py-2 px-6 rounded-xl hover:bg-white/30 transition-all"
              >
                Scrapbook View
              </a>
              <a
                href="/admin"
                className="bg-white/20 text-white font-semibold py-2 px-6 rounded-xl hover:bg-white/30 transition-all"
              >
                Admin
              </a>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white font-semibold py-2 px-4 rounded-xl hover:bg-red-600 transition-all"
              >
                Logout 🚪
              </button>
            </div>
          </div>
        </div>

        {/* Print content */}
        <div className="max-w-4xl mx-auto p-8">
          {notes.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">
                No messages yet. Share the invite link to start collecting wishes!
              </p>
            </div>
          ) : (
            notes.map((note, index) => (
              <div
                key={note.id}
                className={`mb-12 pb-12 ${index < notes.length - 1 ? 'border-b-2 border-gray-200' : ''} ${index < notes.length - 1 ? 'page-break' : ''}`}
              >
                <div className="prose max-w-none">
                  {/* Letter header */}
                  <div className="mb-8 text-center border-b-4 border-pink-300 pb-4">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 mb-2">
                      A Birthday Wish for {birthdayName}
                    </h2>
                    <p className="text-gray-500">From: {note.name}</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(note.timestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Letter content */}
                  <div
                    className="text-gray-800 leading-relaxed text-lg prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-li:my-1"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(note.message) }}
                  />

                  {/* Letter footer */}
                  <div className="mt-8 pt-8 border-t-2 border-gray-200 text-right">
                    <p className="text-gray-600 italic">With love,</p>
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mt-2">
                      {note.name}
                    </p>
                  </div>

                  {/* Decorative elements */}
                  <div className="mt-8 flex justify-center gap-4 text-3xl no-print">
                    💝 ✨ 🎂 🎉 💐
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
