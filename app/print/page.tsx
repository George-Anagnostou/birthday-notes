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
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Playfair+Display:wght@400;700;900&family=Open+Sans:wght@400;600&display=swap');

        @media print {
          /* 5x7 inch greeting card format */
          @page {
            size: 5in 7in;
            margin: 0;
          }

          /* Hide screen-only elements */
          .no-print {
            display: none !important;
          }

          /* Remove wrapper padding */
          .print-wrapper {
            padding: 0 !important;
          }

          /* Simple card layout - each card starts on new page */
          .birthday-card {
            page-break-before: always;
            page-break-after: always;
            page-break-inside: auto;
            width: 5in !important;
            height: 7in !important;
            margin: 0 !important;
            padding: 0.75in !important;
            box-sizing: border-box !important;
            border: 3px solid #ec4899 !important;
            border-radius: 0.5rem;
            background: white !important;
            box-shadow: none !important;
          }

          /* First card doesn't need page break before */
          .birthday-card:first-child {
            page-break-before: auto;
          }

          /* Last card doesn't need page break after */
          .birthday-card:last-child {
            page-break-after: auto;
          }

          /* Keep header together */
          .card-header-decorative {
            page-break-inside: avoid;
            page-break-after: avoid;
            background: linear-gradient(135deg, #fce7f3 0%, #e9d5ff 50%, #dbeafe 100%) !important;
            padding: 0.75rem !important;
            margin-bottom: 0.75rem !important;
          }

          /* Keep footer/signature together */
          .card-footer-section {
            page-break-inside: avoid;
            margin-top: 0.75rem;
            padding-top: 0.75rem;
            border-top: 2px solid #e5e7eb;
          }

          /* Images - fit within 5x7 format */
          .card-body img {
            max-width: 100%;
            max-height: 1.5in;
            page-break-inside: avoid;
          }

          /* Typography adjustments for 5x7 */
          body {
            font-size: 10pt;
          }

          /* Ensure colors print */
          * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }

          /* Gradient text fallback for print */
          .gradient-text {
            background: #ec4899 !important;
            -webkit-background-clip: text !important;
            background-clip: text !important;
          }
        }

        /* Screen preview styles - 5x7 card preview */
        @media screen {
          .birthday-card {
            width: 5in;
            min-height: 7in;
            margin: 2rem auto;
            padding: 0.75in;
            background: white;
            border: 3px solid #ec4899;
            border-radius: 0.5rem;
            box-sizing: border-box;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          }

          .card-header-decorative {
            background: linear-gradient(135deg, #fce7f3 0%, #e9d5ff 50%, #dbeafe 100%);
            padding: 0.75rem;
            margin-bottom: 0.75rem;
            border-radius: 0.5rem;
          }

          .card-body {
            margin-bottom: 0.75rem;
          }

          .card-body img {
            max-height: 200px;
          }

          .card-footer-section {
            padding-top: 0.75rem;
            border-top: 2px solid #e5e7eb;
          }
        }
      `}</style>

      <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        {/* Header - hidden in print */}
        <div className="no-print bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white p-6 sticky top-0 z-50 shadow-lg">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Birthday Cards - Print View</h1>
              <p className="text-white/90 mt-1">
                {notes.length} {notes.length === 1 ? 'card' : 'cards'} • 5×7 inch format
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="bg-white text-purple-600 font-semibold py-2 px-6 rounded-xl hover:shadow-lg transition-all"
              >
                Print Cards 🖨️
              </button>
              <a
                href="/scrapbook"
                className="bg-white/20 text-white font-semibold py-2 px-6 rounded-xl hover:bg-white/30 transition-all"
              >
                Scrapbook
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
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Print content - Cards */}
        <div className="py-8 print-wrapper">
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
                className="birthday-card"
              >
                {/* Card Header */}
                <div className="card-header-decorative text-center rounded-lg">
                  <div className="text-3xl mb-2">🎉</div>
                  <h2
                    className="gradient-text text-2xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Happy Birthday {birthdayName}!
                  </h2>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                    From: <span className="font-semibold text-purple-700">{note.name}</span>
                  </p>
                </div>

                {/* Card Body - Message Content */}
                <div className="card-body">
                  <div
                    className="text-gray-800 leading-relaxed prose prose-sm max-w-none
                      prose-headings:text-gray-900 prose-headings:font-bold
                      prose-p:my-2 prose-ul:my-2 prose-ol:my-2
                      prose-strong:text-pink-700 prose-em:text-purple-700"
                    style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '13px' }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(note.message) }}
                  />

                  {/* Display images if any */}
                  {note.images && note.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {note.images.map((imageUrl, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={imageUrl}
                          alt={`Photo ${imgIndex + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Signature Footer */}
                <div className="card-footer-section text-right">
                  <p className="text-gray-600 italic text-sm">With love,</p>
                  <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mt-1">
                    {note.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                    {new Date(Number(note.timestamp)).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <div className="mt-4 flex justify-center gap-2 text-xl opacity-60">
                    💝 ✨ 🎂
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer - Print instructions (screen only) */}
        <div className="no-print text-center pb-12 px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-3">📋 Printing Instructions</h3>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li>• Each card is formatted for <strong>5×7 inch</strong> greeting card size</li>
              <li>• Set your printer to <strong>5×7 inch</strong> paper or use crop marks</li>
              <li>• Enable <strong>&ldquo;Background graphics&rdquo;</strong> in print settings for colors</li>
              <li>• Use <strong>portrait orientation</strong></li>
              <li>• Each message prints on a separate card for easy display</li>
              <li>• Consider using <strong>cardstock paper</strong> for best results</li>
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}
