'use client';

import { useAdminAuth } from '@/hooks/use-admin-auth';
import { renderMarkdown } from '@/lib/markdown';

const colors = [
  'bg-pink-200',
  'bg-purple-200',
  'bg-blue-200',
  'bg-yellow-200',
  'bg-green-200',
  'bg-red-200',
  'bg-indigo-200',
  'bg-orange-200',
];

const rotations = [
  'rotate-1',
  '-rotate-1',
  'rotate-2',
  '-rotate-2',
  'rotate-3',
  '-rotate-3',
];

export default function ScrapbookPage() {
  // Admin authentication hook
  const {
    notes,
    loading,
    error,
    password,
    authenticated,
    showPassword,
    setPassword,
    handlePasswordSubmit,
    handleLogout,
  } = useAdminAuth();

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
                {loading ? 'Verifying...' : 'View Scrapbook'}
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
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white font-semibold py-2 px-4 rounded-xl hover:bg-red-600 transition-all"
          >
            Logout 🚪
          </button>
        </div>
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 mb-4">
            Birthday Scrapbook 🎉
          </h1>
          <p className="text-gray-600 text-lg">
            {notes.length} wonderful {notes.length === 1 ? 'message' : 'messages'} of love and celebration
          </p>
          <div className="mt-4 flex gap-4 justify-center">
            <a
              href="/print"
              className="bg-white text-purple-600 font-semibold py-2 px-6 rounded-xl border-2 border-purple-200 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              View Print Version 📄
            </a>
            <a
              href="/admin"
              className="bg-white text-pink-600 font-semibold py-2 px-6 rounded-xl border-2 border-pink-200 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Admin Panel ⚙️
            </a>
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-600 text-lg">
              No messages yet. Share the invite link to start collecting wishes!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
            {notes.map((note, index) => {
              const color = colors[index % colors.length];
              const rotation = rotations[index % rotations.length];

              return (
                <div
                  key={note.id}
                  className={`${color} ${rotation} p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:rotate-0 transform`}
                  style={{
                    minHeight: '200px',
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg text-gray-800">
                        {note.name}
                      </h3>
                      <span className="text-2xl">💝</span>
                    </div>
                    <div
                      className="text-gray-700 break-words prose prose-sm max-w-none prose-headings:text-gray-800 prose-headings:font-bold prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(note.message) }}
                    />
                    {/* Display images if any */}
                    {note.images && note.images.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
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
                    <div className="text-xs text-gray-600 mt-4">
                      {new Date(Number(note.timestamp)).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
