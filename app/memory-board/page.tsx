'use client';

import { useAdminAuth } from '@/hooks/use-admin-auth';

// Postcard background colors with vintage feel
const colors = [
  'bg-amber-50',
  'bg-rose-50',
  'bg-sky-50',
  'bg-lime-50',
  'bg-purple-50',
  'bg-orange-50',
  'bg-teal-50',
  'bg-pink-50',
];

// Postcard border accent colors
const borderColors = [
  'border-amber-300',
  'border-rose-300',
  'border-sky-300',
  'border-lime-300',
  'border-purple-300',
  'border-orange-300',
  'border-teal-300',
  'border-pink-300',
];

const rotations = [
  'rotate-1',
  '-rotate-1',
  'rotate-2',
  '-rotate-2',
  'rotate-3',
  '-rotate-3',
];

export default function MemoryBoardPage() {
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
                {loading ? 'Verifying...' : 'View Memory Board'}
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
            Birthday Memory Board 🎉
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-min">
            {notes.map((note, index) => {
              const color = colors[index % colors.length];
              const borderColor = borderColors[index % borderColors.length];
              const rotation = rotations[index % rotations.length];

              return (
                <div
                  key={note.id}
                  className={`${color} ${rotation} relative rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:rotate-0 transform border-4 ${borderColor}`}
                  style={{
                    minHeight: '300px',
                    backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.02) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.02) 3px)',
                  }}
                >
                  {/* Postcard stamp decoration */}
                  <div className="absolute top-3 right-3 w-12 h-12 border-2 border-gray-400 border-dashed rounded opacity-40 flex items-center justify-center text-xs text-gray-500 font-mono transform rotate-12">
                    ✓
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Polaroid photos section - displayed at top if present */}
                    {note.images && note.images.length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-4">
                        {note.images.map((imageUrl, imgIndex) => (
                          <div
                            key={imgIndex}
                            className="bg-white p-2 pb-8 shadow-lg transform hover:scale-110 transition-transform duration-200"
                            style={{
                              transform: `rotate(${imgIndex % 2 === 0 ? '-' : ''}${2 + (imgIndex % 3)}deg)`,
                            }}
                          >
                            <img
                              src={imageUrl}
                              alt={`Photo ${imgIndex + 1}`}
                              className="w-24 h-24 object-cover"
                            />
                            <div className="h-6"></div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Postcard header with name and date */}
                    <div className="border-b-2 border-gray-300 pb-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-800 italic">
                          From: {note.name}
                        </h3>
                        <span className="text-xl">💌</span>
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-1">
                        {note.timestamp && !isNaN(Number(note.timestamp))
                          ? new Date(Number(note.timestamp)).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'Date unavailable'}
                      </div>
                    </div>

                    {/* Message content */}
                    <div
                      className="text-gray-700 break-words prose prose-sm max-w-none prose-headings:text-gray-800 prose-headings:font-bold prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1"
                      style={{
                        fontFamily: 'Georgia, serif',
                        lineHeight: '1.6',
                      }}
                      dangerouslySetInnerHTML={{ __html: note.message }}
                    />
                  </div>

                  {/* Postcard texture overlay */}
                  <div className="absolute inset-0 pointer-events-none rounded-lg" style={{
                    background: 'radial-gradient(circle at 20% 80%, rgba(0,0,0,0.03) 0%, transparent 50%)',
                  }}></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
