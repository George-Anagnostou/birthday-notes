'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useCloudPrint } from '@/hooks/use-cloud-print';
import { getAccentColor, getAccentCSSVars } from '@/lib/theme-config';
import type { AccentColor } from '@/lib/theme-config';

export default function AdminPage() {
  const [copiedLink, setCopiedLink] = useState(false);
  const [accent, setAccent] = useState<AccentColor>(getAccentColor(undefined));

  // Admin authentication hook
  const {
    notes,
    loading,
    error,
    password,
    authenticated,
    showPassword,
    storedPassword,
    setPassword,
    handlePasswordSubmit,
    handleLogout,
  } = useAdminAuth();

  useEffect(() => {
    // Fetch recipient info from API to get accent color
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
  }, []);

  // Cloud print hook
  const { printCards: cloudPrintCards, isPrinting: isCloudPrinting, error: cloudPrintError } = useCloudPrint({
    adminPassword: storedPassword,
  });

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
              className="text-2xl font-bold text-center mb-6 tracking-tight"
              style={{ color: accent.primary, fontFamily: 'var(--font-title)' }}
            >
              Admin Access Required
            </h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                >
                  Admin Password
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
                  placeholder="Enter admin password"
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
      <main
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${accent.light} 0%, #ffffff 50%, ${accent.light} 100%)`,
          ...getAccentCSSVars(accent)
        }}
      >
        <div className="text-center relative z-10">
          <div className="text-4xl mb-4">✨</div>
          <p className="text-gray-600" style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}>
            Loading admin panel...
          </p>
        </div>
      </main>
    );
  }

  // Calculate statistics
  const totalNotes = notes.length;
  const totalWords = notes.reduce((sum, note) => {
    const plainText = note.message.replace(/<[^>]*>/g, '');
    return sum + plainText.split(/\s+/).filter(w => w.length > 0).length;
  }, 0);
  const avgWordsPerNote = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0;
  const sortedNotes = [...notes].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <main
      className="min-h-screen p-8 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${accent.light} 0%, #ffffff 50%, ${accent.light} 100%)`,
        ...getAccentCSSVars(accent)
      }}
    >
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full blur-3xl"
             style={{ backgroundColor: accent.primary }}></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full blur-3xl"
             style={{ backgroundColor: accent.primary }}></div>
      </div>

      {/* Error message for cloud print */}
      {cloudPrintError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg max-w-md">
          {cloudPrintError}
        </div>
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-end mb-4">
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white font-semibold py-2 px-4 rounded-xl hover:bg-red-600 transition-all"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              Logout 🚪
            </button>
          </div>

          <div
            className="w-16 h-1 rounded-full mx-auto mb-6 animate-pulse"
            style={{ backgroundColor: accent.primary }}
          ></div>

          <h1
            className="text-4xl md:text-5xl font-bold mb-2 tracking-tight"
            style={{ color: accent.primary, fontFamily: 'var(--font-title)' }}
          >
            Admin Dashboard
          </h1>

          <div
            className="w-16 h-1 rounded-full mx-auto mb-4 animate-pulse"
            style={{ backgroundColor: accent.primary, animationDelay: '0.5s' }}
          ></div>

          <p className="text-gray-600" style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}>
            Manage and view all birthday wishes
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border transition-all duration-300 hover:shadow-xl"
            style={{ borderColor: accent.light }}
          >
            <div className="text-4xl mb-2">📝</div>
            <div
              className="text-3xl font-bold"
              style={{ color: accent.primary, fontFamily: 'var(--font-title)' }}
            >
              {totalNotes}
            </div>
            <div className="text-gray-600" style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}>
              Total Messages
            </div>
          </div>
          <div
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border transition-all duration-300 hover:shadow-xl"
            style={{ borderColor: accent.light }}
          >
            <div className="text-4xl mb-2">💭</div>
            <div
              className="text-3xl font-bold"
              style={{ color: accent.primary, fontFamily: 'var(--font-title)' }}
            >
              {totalWords}
            </div>
            <div className="text-gray-600" style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}>
              Total Words
            </div>
          </div>
          <div
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border transition-all duration-300 hover:shadow-xl"
            style={{ borderColor: accent.light }}
          >
            <div className="text-4xl mb-2">📊</div>
            <div
              className="text-3xl font-bold"
              style={{ color: accent.primary, fontFamily: 'var(--font-title)' }}
            >
              {avgWordsPerNote}
            </div>
            <div className="text-gray-600" style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}>
              Avg Words/Message
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border mb-8"
          style={{ borderColor: accent.light }}
        >
          <h2
            className="text-xl font-bold mb-4"
            style={{ color: accent.primary, fontFamily: 'var(--font-title)' }}
          >
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={copyInviteLink}
              className="text-white font-semibold py-2 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              style={{
                backgroundColor: accent.primary,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = accent.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = accent.primary;
              }}
            >
              {copiedLink ? 'Link Copied! ✓' : 'Copy Invite Link 🔗'}
            </button>
            <button
              onClick={handleCloudPrint}
              disabled={isCloudPrinting}
              className="text-white font-semibold py-2 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: accent.dark,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                if (!isCloudPrinting) {
                  e.currentTarget.style.backgroundColor = accent.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isCloudPrinting) {
                  e.currentTarget.style.backgroundColor = accent.dark;
                }
              }}
            >
              {isCloudPrinting ? 'Generating PDF...' : 'Download PDF 📥'}
            </button>
            <a
              href="/memory-board"
              className="font-semibold py-2 px-6 rounded-xl border-2 hover:shadow-lg transform hover:scale-105 transition-all duration-200 inline-block"
              style={{
                backgroundColor: 'white',
                color: accent.primary,
                borderColor: accent.light,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accent.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = accent.light;
              }}
            >
              View Memory Board 📌
            </a>
            <a
              href="/print"
              className="font-semibold py-2 px-6 rounded-xl border-2 hover:shadow-lg transform hover:scale-105 transition-all duration-200 inline-block"
              style={{
                backgroundColor: 'white',
                color: accent.primary,
                borderColor: accent.light,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accent.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = accent.light;
              }}
            >
              Print Preview 🖨️
            </a>
          </div>
        </div>

        {/* Notes list */}
        <div
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border"
          style={{ borderColor: accent.light }}
        >
          <h2
            className="text-xl font-bold mb-4"
            style={{ color: accent.primary, fontFamily: 'var(--font-title)' }}
          >
            All Messages ({totalNotes})
          </h2>
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-600" style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                No messages yet. Share the invite link to start collecting wishes!
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {sortedNotes.map((note, index) => (
                <div
                  key={note.id}
                  className="border rounded-xl p-4 transition-all duration-200 hover:shadow-md"
                  style={{ borderColor: accent.light }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = accent.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = accent.light;
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3
                        className="font-bold text-lg"
                        style={{ color: accent.dark, fontFamily: 'var(--font-body)' }}
                      >
                        {note.name}
                      </h3>
                      <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                        {new Date(note.timestamp).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span
                      className="text-sm px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: accent.light,
                        color: accent.dark,
                        fontFamily: 'var(--font-body)',
                        fontWeight: 500,
                      }}
                    >
                      #{totalNotes - index}
                    </span>
                  </div>
                  <div
                    className="text-gray-700 break-words mt-2 prose prose-sm max-w-none prose-headings:text-gray-800 prose-headings:font-bold prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1"
                    dangerouslySetInnerHTML={{ __html: note.message }}
                  />
                  <div className="mt-2 text-sm text-gray-500" style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                    {note.message.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length} words
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
