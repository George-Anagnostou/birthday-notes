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
          /* Greeting card page size: 5x7 inches */
          @page {
            size: 5in 7in;
            margin: 0;
          }

          /* Advanced typography settings */
          body {
            font-feature-settings: "liga" 1, "kern" 1;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            hyphens: auto;
            orphans: 3;
            widows: 3;
          }

          /* Hide screen-only elements */
          .no-print {
            display: none !important;
          }

          /* Each card starts on a new page and can span multiple pages if needed */
          .birthday-card {
            page-break-before: always;
            page-break-after: always;
          }

          /* First card doesn't need page break before */
          .birthday-card:first-child {
            page-break-before: auto;
          }

          /* Last card doesn't need page break after */
          .birthday-card:last-child {
            page-break-after: auto;
          }

          /* Keep header and footer together, don't break them */
          .card-header-decorative {
            page-break-inside: avoid;
            page-break-after: avoid;
            background: linear-gradient(135deg, #fce7f3 0%, #e9d5ff 50%, #dbeafe 100%) !important;
          }

          .card-footer-section {
            page-break-inside: avoid;
            page-break-before: avoid;
          }

          /* Prevent awkward breaks in headings */
          h1, h2, h3, h4 {
            page-break-after: avoid;
            break-after: avoid;
          }

          /* Prevent paragraphs from breaking awkwardly */
          p {
            orphans: 3;
            widows: 3;
          }

          /* Ensure colors print */
          * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }

          /* Card-specific styling */
          .card-border {
            border: 3px solid #ec4899 !important;
            box-shadow: none !important;
          }

          /* Image sizing for print */
          .birthday-card-image {
            max-width: 100%;
            max-height: 3in;
            width: auto;
            height: auto;
            object-fit: contain;
            display: block;
            margin: 0.75rem auto;
            page-break-inside: avoid;
            border-radius: 8px;
          }

          /* Gradient text fallback for print */
          .gradient-text {
            background: #ec4899 !important;
            -webkit-background-clip: text !important;
            background-clip: text !important;
          }
        }

        /* Screen preview styles - make it look like cards */
        @media screen {
          .birthday-card {
            width: 5in;
            min-height: 7in;
            margin: 2rem auto;
            background: white;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            page-break-after: always;
          }

          .birthday-card-image {
            max-width: 100%;
            max-height: 400px;
            width: auto;
            height: auto;
            object-fit: contain;
            display: block;
            margin: 0.75rem auto;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
        <div className="py-8">
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
                className="birthday-card card-border rounded-lg overflow-hidden"
              >
                {/* Card Header - Decorative */}
                <div className="card-header-decorative px-6 py-8 text-center border-b-4 border-pink-400">
                  {/* Decorative top element */}
                  <div className="text-4xl mb-3">🎉</div>

                  {/* Title */}
                  <h2
                    className="gradient-text text-3xl font-bold mb-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Happy Birthday
                  </h2>
                  <p
                    className="text-2xl font-bold text-pink-600 mb-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {birthdayName}!
                  </p>

                  {/* From line */}
                  <div className="mt-4 pt-4 border-t-2 border-pink-300/50">
                    <p className="text-sm text-gray-600" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                      A message from
                    </p>
                    <p
                      className="text-lg font-semibold text-purple-700 mt-1"
                      style={{ fontFamily: "'Caveat', cursive" }}
                    >
                      {note.name}
                    </p>
                  </div>
                </div>

                {/* Card Body - Message Content */}
                <div className="px-6 py-8">
                  <div
                    className="text-gray-800 leading-relaxed prose prose-sm max-w-none
                      prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mb-2
                      prose-p:my-2 prose-p:text-base prose-p:leading-relaxed
                      prose-ul:my-2 prose-ol:my-2 prose-li:my-1
                      prose-strong:text-pink-700 prose-em:text-purple-700
                      prose-img:rounded-lg prose-img:shadow-md"
                    style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '14px' }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(note.message) }}
                  />

                  {/* Display images if any */}
                  {note.images && note.images.length > 0 && (
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      {note.images.map((imageUrl, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={imageUrl}
                          alt={`Photo ${imgIndex + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* Letter footer */}
                  <div className="mt-8 pt-8 border-t-2 border-gray-200 text-right">
                    <p className="text-gray-600 italic">With love,</p>
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mt-2">
                      {note.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                      {new Date(Number(note.timestamp)).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Decorative bottom elements */}
                  <div className="mt-6 flex justify-center gap-3 text-2xl opacity-60">
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
