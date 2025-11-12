'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { renderMarkdown } from '@/lib/markdown';

export default function SubmitPage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user has valid access code
    const accessCode = sessionStorage.getItem('accessCode');
    if (!accessCode) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const accessCode = sessionStorage.getItem('accessCode');
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message, accessCode }),
      });

      if (response.ok) {
        setSubmitted(true);
        setName('');
        setMessage('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit your message. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-pink-100">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 mb-4">
              Thank You!
            </h2>
            <p className="text-gray-600 mb-6">
              Your birthday message has been submitted successfully! It will be part of a beautiful surprise.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
              }}
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Submit Another Message 💌
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 mb-2">
            Share Your Birthday Wishes
          </h1>
          <p className="text-gray-600 text-lg">
            Write a heartfelt message that will be treasured forever ✨
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-pink-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="Enter your name"
                required
                maxLength={100}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Your Birthday Message
                </label>
                <div className="flex gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      !showPreview
                        ? 'bg-pink-100 text-pink-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      showPreview
                        ? 'bg-pink-100 text-pink-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {!showPreview ? (
                <>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                    placeholder="Write your heartfelt birthday wishes here...&#10;&#10;You can use markdown formatting:&#10;# Heading&#10;**bold** or *italic*&#10;- List item"
                    rows={8}
                    required
                    maxLength={5000}
                  />
                  <p className="mt-1 text-sm text-gray-500 text-right">
                    {message.length} / 5000 characters
                  </p>
                </>
              ) : (
                <>
                  <div
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl min-h-[200px] bg-gray-50 prose prose-sm max-w-none prose-headings:text-gray-800 prose-headings:font-bold prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1"
                    dangerouslySetInnerHTML={{
                      __html: message ? renderMarkdown(message) : '<p class="text-gray-400 italic">Your formatted message will appear here...</p>',
                    }}
                  />
                  <p className="mt-1 text-sm text-gray-500 text-right">
                    {message.length} / 5000 characters
                  </p>
                </>
              )}
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
              {loading ? 'Submitting...' : 'Submit Your Wishes 🎂'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Your message will be included in a special birthday collection 💝
          </p>
        </div>
      </div>
    </main>
  );
}
