'use client';

import { useState, useEffect } from 'react';
import { Note } from '@/types/note';
import { useCloudPrint } from '@/hooks/use-cloud-print';

export default function AdminPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Get stored admin password for cloud print
  const storedPassword = typeof window !== 'undefined'
    ? sessionStorage.getItem('adminPassword') || ''
    : '';

  // Cloud print hook
  const { printCards: cloudPrintCards, isPrinting: isCloudPrinting, error: cloudPrintError } = useCloudPrint({
    adminPassword: storedPassword,
  });

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

  const handleLogout = () => {
    sessionStorage.removeItem('adminPassword');
    setAuthenticated(false);
    setShowPassword(true);
    setNotes([]);
    setPassword('');
  };

  const copyInviteLink = () => {
    const link = window.location.origin;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCloudPrint = async () => {
    const result = await cloudPrintCards();
    if (!result.success) {
      alert(`Failed to generate PDF: ${result.error}`);
    }
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
                {loading ? 'Verifying...' : 'Access Admin Panel'}
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
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </main>
    );
  }

  // Calculate statistics
  const totalNotes = notes.length;
  const totalWords = notes.reduce((sum, note) => sum + note.message.split(/\s+/).length, 0);
  const avgWordsPerNote = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0;
  const sortedNotes = [...notes].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8">
      {/* Error message for cloud print */}
      {cloudPrintError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg max-w-md">
          {cloudPrintError}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-end mb-4">
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white font-semibold py-2 px-4 rounded-xl hover:bg-red-600 transition-all"
            >
              Logout 🚪
            </button>
          </div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage and view all birthday wishes</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-pink-100">
            <div className="text-4xl mb-2">📝</div>
            <div className="text-3xl font-bold text-pink-600">{totalNotes}</div>
            <div className="text-gray-600">Total Messages</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-100">
            <div className="text-4xl mb-2">💭</div>
            <div className="text-3xl font-bold text-purple-600">{totalWords}</div>
            <div className="text-gray-600">Total Words</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-100">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-3xl font-bold text-blue-600">{avgWordsPerNote}</div>
            <div className="text-gray-600">Avg Words/Message</div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-pink-100 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={copyInviteLink}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-2 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              {copiedLink ? 'Link Copied! ✓' : 'Copy Invite Link 🔗'}
            </button>
            <button
              onClick={handleCloudPrint}
              disabled={isCloudPrinting}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-2 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCloudPrinting ? 'Generating PDF...' : 'Download PDF 📥'}
            </button>
            <a
              href="/scrapbook"
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-2 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 inline-block"
            >
              View Scrapbook 📔
            </a>
            <a
              href="/print"
              className="bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold py-2 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 inline-block"
            >
              Print Preview 🖨️
            </a>
          </div>
        </div>

        {/* Notes list */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-pink-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">All Messages ({totalNotes})</h2>
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-600">No messages yet. Share the invite link to start collecting wishes!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {sortedNotes.map((note, index) => (
                <div
                  key={note.id}
                  className="border-2 border-gray-100 rounded-xl p-4 hover:border-pink-200 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{note.name}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(note.timestamp).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span className="text-sm bg-pink-100 text-pink-700 px-3 py-1 rounded-full">
                      #{totalNotes - index}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap break-words mt-2">
                    {note.message}
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    {note.message.split(/\s+/).length} words
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
