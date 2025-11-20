'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { renderMarkdown } from '@/lib/markdown';
import { logger } from '@/lib/logger';

export default function SubmitPage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check if user has valid access code
    const accessCode = sessionStorage.getItem('accessCode');
    if (!accessCode) {
      router.push('/');
    }
  }, [router]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Limit to 5 images
    if (files.length + selectedImages.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB');
        return;
      }
      validFiles.push(file);
    }

    // Create previews
    const newPreviews: string[] = [];
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setImagePreviews([...imagePreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setSelectedImages([...selectedImages, ...validFiles]);
    setError('');
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const accessCode = sessionStorage.getItem('accessCode');

      // Upload images first if any are selected
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        const formData = new FormData();
        selectedImages.forEach(image => {
          formData.append('images', image);
        });

        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          setError(uploadData.error || 'Failed to upload images');
          setLoading(false);
          return;
        }

        const uploadData = await uploadResponse.json();
        imageUrls = uploadData.urls;
      }

      // Submit note with image URLs
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message, accessCode, images: imageUrls }),
      });

      if (response.ok) {
        setSubmitted(true);
        setName('');
        setMessage('');
        setSelectedImages([]);
        setImagePreviews([]);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit your message. Please try again.');
      }
    } catch (error: unknown) {
      setError('Something went wrong. Please try again.');
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(message);
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

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Photos (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                You can add up to 5 images. Each image must be less than 5MB.
              </p>

              <div className="space-y-3">
                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-pink-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* File Input */}
                {selectedImages.length < 5 && (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-pink-200 rounded-xl p-6 text-center cursor-pointer hover:border-pink-400 transition-all bg-pink-50 hover:bg-pink-100">
                      <div className="text-3xl mb-2">📸</div>
                      <p className="text-sm text-gray-600">
                        Click to select images
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedImages.length}/5 images selected
                      </p>
                    </div>
                  </label>
                )}
              </div>
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
