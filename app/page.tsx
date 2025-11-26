'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [recipientName, setRecipientName] = useState<string>('');

  useEffect(() => {
    // Fetch recipient name from API
    const fetchRecipientName = async () => {
      try {
        const response = await fetch('/api/recipient-info');
        if (response.ok) {
          const data = await response.json();
          setRecipientName(data.recipientName || 'Your Friend');
        }
      } catch (error) {
        setRecipientName('Your Friend');
      }
    };

    fetchRecipientName();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block relative">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 mb-2">
              Birthday Wishes
            </h1>
            <div className="absolute -top-6 -right-8 text-4xl animate-bounce">✨</div>
            <div className="absolute -bottom-2 -left-6 text-3xl animate-pulse">🎂</div>
          </div>
          <p className="mt-6 text-gray-600 text-lg">
            Share a special birthday message for {recipientName || '...'}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-pink-100">
          <div className="text-center space-y-6">
            <p className="text-gray-700">
              Click below to write your birthday wishes
            </p>
            <button
              onClick={() => router.push('/submit')}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Write a Message 💌
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Your message will be included in a special birthday collection
        </p>
      </div>
    </main>
  );
}
