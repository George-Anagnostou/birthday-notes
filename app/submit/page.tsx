'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import RichTextEditor from '@/components/RichTextEditor';
import type { Note } from '@/types/note';
import { getAccentColor, getAccentCSSVars } from '@/lib/theme-config';
import type { AccentColor } from '@/lib/theme-config';

// Postcard background colors with vintage feel
const colors = [
  "bg-amber-50",
  "bg-rose-50",
  "bg-sky-50",
  "bg-lime-50",
  "bg-purple-50",
  "bg-orange-50",
  "bg-teal-50",
  "bg-pink-50",
];

// Postcard border accent colors
const borderColors = [
  "border-amber-300",
  "border-rose-300",
  "border-sky-300",
  "border-lime-300",
  "border-purple-300",
  "border-orange-300",
  "border-teal-300",
  "border-pink-300",
];

const rotations = [
  "rotate-1",
  "-rotate-1",
  "rotate-2",
  "-rotate-2",
  "rotate-3",
  "-rotate-3",
];

export default function SubmitPage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [accessCode, setAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [recipientName, setRecipientName] = useState<string>('');
  const [submittedNote, setSubmittedNote] = useState<Note | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [accent, setAccent] = useState<AccentColor>(getAccentColor(undefined));
  const router = useRouter();

  useEffect(() => {
    // Fetch recipient info from API
    const fetchRecipientInfo = async () => {
      try {
        const response = await fetch('/api/recipient-info');
        if (response.ok) {
          const data = await response.json();
          setRecipientName(data.recipientName || 'Your Friend');
          // Use recipient_id to determine accent color
          const accentColor = getAccentColor(data.recipientId);
          setAccent(accentColor);
        }
      } catch (error) {
        setRecipientName('Your Friend');
        setAccent(getAccentColor(undefined));
      }
    };

    fetchRecipientInfo();
  }, []);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Create previews with proper error handling
    const previewPromises = validFiles.map(file => {
      return new Promise<{ preview: string; file: File } | null>((resolve) => {
        const reader = new FileReader();

        reader.onloadend = () => {
          resolve({ preview: reader.result as string, file });
        };

        reader.onerror = () => {
          logger.error(`Failed to read file: ${file.name}`, reader.error);
          // Resolve with null instead of rejecting to continue processing other files
          resolve(null);
        };

        reader.readAsDataURL(file);
      });
    });

    // Wait for all previews to load
    const results = await Promise.all(previewPromises);

    // Filter out failed reads
    const successfulPreviews: string[] = [];
    const successfulFiles: File[] = [];
    const failedFiles: string[] = [];

    results.forEach((result) => {
      if (result) {
        successfulPreviews.push(result.preview);
        successfulFiles.push(result.file);
      } else {
        // This shouldn't happen often, but handle gracefully
        failedFiles.push('Unknown file');
      }
    });

    setImagePreviews([...imagePreviews, ...successfulPreviews]);
    setSelectedImages([...selectedImages, ...successfulFiles]);

    // Inform user if any files failed
    if (failedFiles.length > 0) {
      setError(`Some files could not be previewed. ${successfulFiles.length} of ${validFiles.length} images loaded successfully.`);
    } else {
      setError('');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Show preview without submitting to database
    setShowPreview(true);
  };

  const handleEdit = () => {
    // Go back to editing
    setShowPreview(false);
    setError('');
  };

  const handleConfirmSubmit = async () => {
    setError('');
    setLoading(true);

    try {
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
        const data = await response.json();
        // Use the note returned from the API which includes recipient_id
        if (data.note) {
          setSubmittedNote(data.note);
        } else {
          // Fallback: construct note object manually (shouldn't happen)
          const note: Note = {
            id: data.noteId || '0',
            name,
            message,
            timestamp: Date.now(),
            images: imageUrls,
            recipient_id: 'default',
          };
          setSubmittedNote(note);
        }
        setSubmitted(true);
        setShowPreview(false);
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

  // Preview mode - show card preview before actual submission
  if (showPreview && !submitted) {
    // Use a random index for card styling
    const cardIndex = Math.floor(Math.random() * colors.length);
    const color = colors[cardIndex];
    const borderColor = borderColors[cardIndex];
    const rotation = rotations[cardIndex % rotations.length];

    // Create a preview note object
    const previewNote = {
      id: 'preview',
      name,
      message,
      timestamp: Date.now(),
      images: imagePreviews, // Use local previews instead of uploaded URLs
      recipient_id: 'preview',
    };

    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 py-12">
        {/* Enlarged image overlay with polaroid frame */}
        {enlargedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer backdrop-blur-2xl"
            style={{
              background: "rgba(255, 255, 255, 0.01)",
              backdropFilter: "blur(40px) saturate(180%)",
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
            }}
            onClick={() => setEnlargedImage(null)}
          >
            <div
              className="bg-white p-4 pb-12 shadow-2xl animate-in fade-in zoom-in duration-300 ring-1 ring-black/5"
              style={{
                maxWidth: "70vw",
                maxHeight: "70vh",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={enlargedImage}
                alt="Enlarged view"
                className="w-full h-full object-contain"
                style={{
                  maxWidth: "calc(70vw - 2rem)",
                  maxHeight: "calc(70vh - 5rem)",
                }}
              />
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">👀</div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 mb-4">
              Preview Your Message
            </h2>
            <p className="text-gray-600 mb-2">
              Here&apos;s how your note will appear on the memory board
            </p>
            <p className="text-gray-600 text-sm">
              Make any edits or submit when you&apos;re happy with it!
            </p>
          </div>

          {/* Card Preview */}
          <div className="flex justify-center mb-8">
            <div
              className={`${color} ${rotation} relative rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:rotate-0 transform border-4 ${borderColor} max-w-md w-full`}
              style={{
                minHeight: "300px",
                backgroundImage:
                  "repeating-linear-gradient(90deg, rgba(0,0,0,0.02) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.02) 3px)",
              }}
            >
              <div className="p-6 space-y-4">
                {/* Postcard header with name and date */}
                <div className="border-b-2 border-gray-300 pb-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800 italic">
                      From: {previewNote.name}
                    </h3>
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 48 48"
                      fill="none"
                    >
                      {/* Outer white stamp border */}
                      <rect x="2" y="2" width="44" height="44" fill="white" />
                      {/* Flag area (inset from border) */}
                      {/* Red stripes */}
                      <rect x="6" y="6" width="36" height="2.8" fill="#B22234" />
                      <rect x="6" y="11.6" width="36" height="2.8" fill="#B22234" />
                      <rect x="6" y="17.2" width="36" height="2.8" fill="#B22234" />
                      <rect x="6" y="22.8" width="36" height="2.8" fill="#B22234" />
                      <rect x="6" y="28.4" width="36" height="2.8" fill="#B22234" />
                      <rect x="6" y="34" width="36" height="2.8" fill="#B22234" />
                      <rect x="6" y="39.6" width="36" height="2.4" fill="#B22234" />
                      {/* Blue canton */}
                      <rect x="6" y="6" width="15" height="16" fill="#3C3B6E" />
                      {/* White stars */}
                      <circle cx="9" cy="9" r="0.7" fill="white" />
                      <circle cx="12.5" cy="9" r="0.7" fill="white" />
                      <circle cx="16" cy="9" r="0.7" fill="white" />
                      <circle cx="19.5" cy="9" r="0.7" fill="white" />
                      <circle cx="10.75" cy="12" r="0.7" fill="white" />
                      <circle cx="14.25" cy="12" r="0.7" fill="white" />
                      <circle cx="17.75" cy="12" r="0.7" fill="white" />
                      <circle cx="9" cy="15" r="0.7" fill="white" />
                      <circle cx="12.5" cy="15" r="0.7" fill="white" />
                      <circle cx="16" cy="15" r="0.7" fill="white" />
                      <circle cx="19.5" cy="15" r="0.7" fill="white" />
                      <circle cx="10.75" cy="18" r="0.7" fill="white" />
                      <circle cx="14.25" cy="18" r="0.7" fill="white" />
                      <circle cx="17.75" cy="18" r="0.7" fill="white" />
                      {/* Perforated border */}
                      <rect
                        x="2"
                        y="2"
                        width="44"
                        height="44"
                        stroke="#888"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                        fill="none"
                      />
                    </svg>
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-1">
                    {new Date(previewNote.timestamp).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </div>
                </div>

                {/* Message content */}
                <div
                  className="text-gray-700 break-words prose prose-sm max-w-none prose-headings:text-gray-800 prose-headings:font-bold prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1"
                  style={{
                    fontFamily: "Georgia, serif",
                    lineHeight: "1.6",
                  }}
                  dangerouslySetInnerHTML={{ __html: previewNote.message }}
                />

                {/* Polaroid photos section */}
                {previewNote.images && previewNote.images.length > 0 && (
                  <div className="relative mt-6 min-h-[140px]">
                    {previewNote.images.length === 1 && (
                      <div className="flex justify-center">
                        <div
                          className="bg-white p-2 pb-6 shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                          style={{ transform: `rotate(-3deg)` }}
                          onClick={() => setEnlargedImage(previewNote.images[0])}
                        >
                          <img
                            src={previewNote.images[0]}
                            alt="Photo 1"
                            className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {previewNote.images.length === 2 && (
                      <div className="flex justify-center items-end">
                        <div
                          className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-20 transition-all duration-200 relative cursor-pointer"
                          style={{ transform: `rotate(-4deg)`, zIndex: 2 }}
                          onClick={() => setEnlargedImage(previewNote.images[0])}
                        >
                          <img
                            src={previewNote.images[0]}
                            alt="Photo 1"
                            className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                          />
                        </div>
                        <div
                          className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-20 transition-all duration-200 relative cursor-pointer"
                          style={{ transform: `rotate(3deg) translateX(-12px)`, zIndex: 1 }}
                          onClick={() => setEnlargedImage(previewNote.images[1])}
                        >
                          <img
                            src={previewNote.images[1]}
                            alt="Photo 2"
                            className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {previewNote.images.length >= 3 && (
                      <div className="flex justify-center items-end">
                        <div
                          className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-20 transition-all duration-200 relative cursor-pointer"
                          style={{ transform: `rotate(-5deg)`, zIndex: 1 }}
                          onClick={() => setEnlargedImage(previewNote.images[0])}
                        >
                          <img
                            src={previewNote.images[0]}
                            alt="Photo 1"
                            className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                          />
                        </div>
                        <div
                          className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-20 transition-all duration-200 relative cursor-pointer"
                          style={{ transform: `rotate(1deg) translateX(-10px)`, zIndex: 3 }}
                          onClick={() => setEnlargedImage(previewNote.images[1])}
                        >
                          <img
                            src={previewNote.images[1]}
                            alt="Photo 2"
                            className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                          />
                        </div>
                        <div
                          className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-20 transition-all duration-200 relative cursor-pointer"
                          style={{ transform: `rotate(4deg) translateX(-18px)`, zIndex: 2 }}
                          onClick={() => setEnlargedImage(previewNote.images[2])}
                        >
                          <img
                            src={previewNote.images[2]}
                            alt="Photo 3"
                            className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Postcard texture overlay */}
              <div
                className="absolute inset-0 pointer-events-none rounded-lg"
                style={{
                  background:
                    "radial-gradient(circle at 20% 80%, rgba(0,0,0,0.03) 0%, transparent 50%)",
                }}
              ></div>
            </div>
          </div>

          {/* Action buttons */}
          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 py-2 px-4 rounded-lg mb-4 max-w-md mx-auto">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleEdit}
              className="bg-white text-purple-600 font-semibold py-3 px-8 rounded-xl border-2 border-purple-200 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              ← Edit Message
            </button>
            <button
              onClick={handleConfirmSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-semibold py-3 px-8 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Submitting...' : 'Confirm & Submit 🎂'}
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Review your message carefully before submitting
          </p>
        </div>
      </main>
    );
  }

  if (submitted && submittedNote) {
    // Use a random index for card styling
    const cardIndex = Math.floor(Math.random() * colors.length);
    const color = colors[cardIndex];
    const borderColor = borderColors[cardIndex];
    const rotation = rotations[cardIndex % rotations.length];

    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 py-12">
        {/* Enlarged image overlay with polaroid frame */}
        {enlargedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer backdrop-blur-2xl"
            style={{
              background: "rgba(255, 255, 255, 0.01)",
              backdropFilter: "blur(40px) saturate(180%)",
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
            }}
            onClick={() => setEnlargedImage(null)}
          >
            <div
              className="bg-white p-4 pb-12 shadow-2xl animate-in fade-in zoom-in duration-300 ring-1 ring-black/5"
              style={{
                maxWidth: "70vw",
                maxHeight: "70vh",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={enlargedImage}
                alt="Enlarged view"
                className="w-full h-full object-contain"
                style={{
                  maxWidth: "calc(70vw - 2rem)",
                  maxHeight: "calc(70vh - 5rem)",
                }}
              />
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 mb-4">
              Thank You!
            </h2>
            <p className="text-gray-600 mb-2">
              Your birthday message has been submitted successfully!
            </p>
            <p className="text-gray-600 text-sm">
              Here&apos;s how it will appear on the memory board:
            </p>
          </div>

          {/* Card Preview */}
          <div className="flex justify-center mb-8">
            <div
              className={`${color} ${rotation} relative rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:rotate-0 transform border-4 ${borderColor} max-w-md w-full`}
              style={{
                minHeight: "300px",
                backgroundImage:
                  "repeating-linear-gradient(90deg, rgba(0,0,0,0.02) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.02) 3px)",
              }}
            >
              <div className="p-6 space-y-4">
                {/* Postcard header with name and date */}
                <div className="border-b-2 border-gray-300 pb-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800 italic">
                      From: {submittedNote.name}
                    </h3>
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 48 48"
                      fill="none"
                    >
                      {/* Outer white stamp border */}
                      <rect x="2" y="2" width="44" height="44" fill="white" />

                      {/* Flag area (inset from border) */}
                      {/* Red stripes */}
                      <rect x="6" y="6" width="36" height="2.8" fill="#B22234" />
                      <rect x="6" y="11.6" width="36" height="2.8" fill="#B22234" />
                      <rect x="6" y="17.2" width="36" height="2.8" fill="#B22234" />
                      <rect x="6" y="22.8" width="36" height="2.8" fill="#B22234" />
                      <rect x="6" y="28.4" width="36" height="2.8" fill="#B22234" />
                      <rect x="6" y="34" width="36" height="2.8" fill="#B22234" />
                      <rect x="6" y="39.6" width="36" height="2.4" fill="#B22234" />

                      {/* Blue canton */}
                      <rect x="6" y="6" width="15" height="16" fill="#3C3B6E" />

                      {/* White stars */}
                      <circle cx="9" cy="9" r="0.7" fill="white" />
                      <circle cx="12.5" cy="9" r="0.7" fill="white" />
                      <circle cx="16" cy="9" r="0.7" fill="white" />
                      <circle cx="19.5" cy="9" r="0.7" fill="white" />

                      <circle cx="10.75" cy="12" r="0.7" fill="white" />
                      <circle cx="14.25" cy="12" r="0.7" fill="white" />
                      <circle cx="17.75" cy="12" r="0.7" fill="white" />

                      <circle cx="9" cy="15" r="0.7" fill="white" />
                      <circle cx="12.5" cy="15" r="0.7" fill="white" />
                      <circle cx="16" cy="15" r="0.7" fill="white" />
                      <circle cx="19.5" cy="15" r="0.7" fill="white" />

                      <circle cx="10.75" cy="18" r="0.7" fill="white" />
                      <circle cx="14.25" cy="18" r="0.7" fill="white" />
                      <circle cx="17.75" cy="18" r="0.7" fill="white" />

                      {/* Perforated border */}
                      <rect
                        x="2"
                        y="2"
                        width="44"
                        height="44"
                        stroke="#888"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                        fill="none"
                      />
                    </svg>
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-1">
                    {new Date(submittedNote.timestamp).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </div>
                </div>

                {/* Message content */}
                <div
                  className="text-gray-700 break-words prose prose-sm max-w-none prose-headings:text-gray-800 prose-headings:font-bold prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1"
                  style={{
                    fontFamily: "Georgia, serif",
                    lineHeight: "1.6",
                  }}
                  dangerouslySetInnerHTML={{ __html: submittedNote.message }}
                />

                {/* Polaroid photos section - displayed at bottom if present */}
                {submittedNote.images && submittedNote.images.length > 0 && (
                  <div className="relative mt-6 min-h-[140px]">
                    {submittedNote.images.length === 1 && (
                      // Single photo: centered, angled slightly
                      <div className="flex justify-center">
                        <div
                          className="bg-white p-2 pb-6 shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                          style={{
                            transform: `rotate(-3deg)`,
                          }}
                          onClick={() => submittedNote.images && setEnlargedImage(submittedNote.images[0])}
                        >
                          <img
                            src={submittedNote.images[0]}
                            alt="Photo 1"
                            className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {submittedNote.images.length === 2 && (
                      // Two photos: side by side with slight overlap
                      <div className="flex justify-center items-end">
                        <div
                          className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-20 transition-all duration-200 relative cursor-pointer"
                          style={{
                            transform: `rotate(-4deg)`,
                            zIndex: 2,
                          }}
                          onClick={() => submittedNote.images && setEnlargedImage(submittedNote.images[0])}
                        >
                          <img
                            src={submittedNote.images[0]}
                            alt="Photo 1"
                            className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                          />
                        </div>
                        <div
                          className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-20 transition-all duration-200 relative cursor-pointer"
                          style={{
                            transform: `rotate(3deg) translateX(-12px)`,
                            zIndex: 1,
                          }}
                          onClick={() => submittedNote.images && setEnlargedImage(submittedNote.images[1])}
                        >
                          <img
                            src={submittedNote.images[1]}
                            alt="Photo 2"
                            className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {submittedNote.images.length === 3 && (
                      // Three photos: slight overlap, fan arrangement
                      <div className="flex justify-center items-end">
                        <div
                          className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-20 transition-all duration-200 relative cursor-pointer"
                          style={{
                            transform: `rotate(-5deg)`,
                            zIndex: 1,
                          }}
                          onClick={() => submittedNote.images && setEnlargedImage(submittedNote.images[0])}
                        >
                          <img
                            src={submittedNote.images[0]}
                            alt="Photo 1"
                            className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                          />
                        </div>
                        <div
                          className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-20 transition-all duration-200 relative cursor-pointer"
                          style={{
                            transform: `rotate(1deg) translateX(-10px)`,
                            zIndex: 3,
                          }}
                          onClick={() => submittedNote.images && setEnlargedImage(submittedNote.images[1])}
                        >
                          <img
                            src={submittedNote.images[1]}
                            alt="Photo 2"
                            className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                          />
                        </div>
                        <div
                          className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-20 transition-all duration-200 relative cursor-pointer"
                          style={{
                            transform: `rotate(4deg) translateX(-18px)`,
                            zIndex: 2,
                          }}
                          onClick={() => submittedNote.images && setEnlargedImage(submittedNote.images[2])}
                        >
                          <img
                            src={submittedNote.images[2]}
                            alt="Photo 3"
                            className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {submittedNote.images.length === 4 && (
                      // Four photos: 2x2 grid with center overlap
                      <div className="flex justify-center items-center">
                        <div className="relative">
                          {/* Top row */}
                          <div className="flex items-center justify-center mb-[-30px]">
                            <div
                              className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-30 transition-all duration-200 cursor-pointer relative"
                              style={{
                                transform: `rotate(-4deg)`,
                                zIndex: 2,
                                marginRight: "-15px",
                              }}
                              onClick={() =>
                                submittedNote.images && setEnlargedImage(submittedNote.images[0])
                              }
                            >
                              <img
                                src={submittedNote.images[0]}
                                alt="Photo 1"
                                className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                              />
                            </div>
                            <div
                              className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-30 transition-all duration-200 cursor-pointer relative"
                              style={{
                                transform: `rotate(3deg)`,
                                zIndex: 1,
                                marginLeft: "-15px",
                              }}
                              onClick={() =>
                                submittedNote.images && setEnlargedImage(submittedNote.images[1])
                              }
                            >
                              <img
                                src={submittedNote.images[1]}
                                alt="Photo 2"
                                className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                              />
                            </div>
                          </div>
                          {/* Bottom row */}
                          <div className="flex items-center justify-center">
                            <div
                              className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-30 transition-all duration-200 cursor-pointer relative"
                              style={{
                                transform: `rotate(2deg)`,
                                zIndex: 3,
                                marginRight: "-15px",
                              }}
                              onClick={() =>
                                submittedNote.images && setEnlargedImage(submittedNote.images[2])
                              }
                            >
                              <img
                                src={submittedNote.images[2]}
                                alt="Photo 3"
                                className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                              />
                            </div>
                            <div
                              className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-30 transition-all duration-200 cursor-pointer relative"
                              style={{
                                transform: `rotate(-3deg)`,
                                zIndex: 4,
                                marginLeft: "-15px",
                              }}
                              onClick={() =>
                                submittedNote.images && setEnlargedImage(submittedNote.images[3])
                              }
                            >
                              <img
                                src={submittedNote.images[3]}
                                alt="Photo 4"
                                className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {submittedNote.images.length === 5 && (
                      // Five photos: staggered arrangement with minimal overlap
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex justify-center items-end">
                          <div
                            className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-20 transition-all duration-200 relative cursor-pointer"
                            style={{
                              transform: `rotate(-5deg)`,
                              zIndex: 1,
                            }}
                            onClick={() => submittedNote.images && setEnlargedImage(submittedNote.images[0])}
                          >
                            <img
                              src={submittedNote.images[0]}
                              alt="Photo 1"
                              className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                            />
                          </div>
                          <div
                            className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-20 transition-all duration-200 relative cursor-pointer"
                            style={{
                              transform: `rotate(2deg) translateX(-8px)`,
                              zIndex: 2,
                            }}
                            onClick={() => submittedNote.images && setEnlargedImage(submittedNote.images[1])}
                          >
                            <img
                              src={submittedNote.images[1]}
                              alt="Photo 2"
                              className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                            />
                          </div>
                          <div
                            className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-20 transition-all duration-200 relative cursor-pointer"
                            style={{
                              transform: `rotate(-2deg) translateX(-14px)`,
                              zIndex: 3,
                            }}
                            onClick={() => submittedNote.images && setEnlargedImage(submittedNote.images[2])}
                          >
                            <img
                              src={submittedNote.images[2]}
                              alt="Photo 3"
                              className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                            />
                          </div>
                        </div>
                        <div className="flex justify-center items-end -mt-3">
                          <div
                            className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-20 transition-all duration-200 relative cursor-pointer"
                            style={{
                              transform: `rotate(4deg)`,
                              zIndex: 4,
                            }}
                            onClick={() => submittedNote.images && setEnlargedImage(submittedNote.images[3])}
                          >
                            <img
                              src={submittedNote.images[3]}
                              alt="Photo 4"
                              className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                            />
                          </div>
                          <div
                            className="bg-white p-2 pb-6 shadow-lg hover:scale-110 hover:z-20 transition-all duration-200 relative cursor-pointer"
                            style={{
                              transform: `rotate(-3deg) translateX(-8px)`,
                              zIndex: 5,
                            }}
                            onClick={() => submittedNote.images && setEnlargedImage(submittedNote.images[4])}
                          >
                            <img
                              src={submittedNote.images[4]}
                              alt="Photo 5"
                              className="max-w-[70px] max-h-[70px] md:max-w-[95px] md:max-h-[95px] object-contain"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Postcard texture overlay */}
              <div
                className="absolute inset-0 pointer-events-none rounded-lg"
                style={{
                  background:
                    "radial-gradient(circle at 20% 80%, rgba(0,0,0,0.03) 0%, transparent 50%)",
                }}
              ></div>
            </div>
          </div>

          {/* Action button */}
          <div className="text-center">
            <button
              onClick={() => {
                setSubmitted(false);
                setSubmittedNote(null);
                setName('');
                setMessage('');
                setSelectedImages([]);
                setImagePreviews([]);
                setAccessCode('');
              }}
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Submit Another Message 💌
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Your message will be included in the birthday memory board 💝
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen p-4 py-12 relative overflow-hidden"
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

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="w-16 h-1 rounded-full mx-auto mb-6 animate-pulse"
            style={{ backgroundColor: accent.primary }}
          ></div>

          <div className="flex items-center justify-center gap-3 md:gap-5 mb-3">
            {/* Floating emojis - side by side */}
            <div className="text-2xl md:text-3xl flex-shrink-0"
                 style={{
                   animation: 'float 3s ease-in-out infinite',
                   animationDelay: '0s'
                 }}>
              🎈
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light tracking-tight text-gray-900">
              Birthday Wishes
            </h1>

            <div className="text-2xl md:text-3xl flex-shrink-0"
                 style={{
                   animation: 'float 3s ease-in-out infinite',
                   animationDelay: '1.5s'
                 }}>
              ✨
            </div>
          </div>

          <h2
            className="text-3xl md:text-4xl font-serif font-bold tracking-tight mb-6 transition-all duration-300 hover:scale-105"
            style={{ color: accent.primary }}
          >
            for {recipientName || '...'}
          </h2>

          <div
            className="w-16 h-1 rounded-full mx-auto mb-4 animate-pulse"
            style={{ backgroundColor: accent.primary, animationDelay: '0.5s' }}
          ></div>

          <p className="text-gray-600 text-lg font-light">
            Share your heartfelt message
          </p>

          {/* CSS for float animation */}
          <style jsx>{`
            @keyframes float {
              0%, 100% {
                transform: translateY(-10px);
              }
              50% {
                transform: translateY(10px);
              }
            }
          `}</style>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100 transform transition-all duration-500 hover:shadow-3xl">
          <form onSubmit={handlePreview} className="space-y-6">
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
                Access Code
              </label>
              <div className="relative">
                <input
                  type={showAccessCode ? "text" : "password"}
                  id="accessCode"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-2 transition-all"
                  style={{
                    borderColor: accessCode ? accent.primary : undefined,
                    boxShadow: accessCode ? `0 0 0 1px ${accent.primary}` : undefined
                  }}
                  placeholder="Enter access code"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowAccessCode(!showAccessCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showAccessCode ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-2 transition-all"
                style={{
                  borderColor: name ? accent.primary : undefined,
                  boxShadow: name ? `0 0 0 1px ${accent.primary}` : undefined
                }}
                placeholder="Enter your name"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Your Birthday Message
              </label>
              <RichTextEditor
                value={message}
                onChange={setMessage}
                placeholder="Write your heartfelt birthday wishes here..."
                maxLength={5000}
              />
              <p className="mt-1 text-sm text-gray-500 text-right font-light">
                {message.replace(/<[^>]*>/g, '').length} / 5000 characters
              </p>
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Photos <span className="text-gray-400 font-light">(Optional)</span>
              </label>
              <p className="text-xs text-gray-500 mb-3 font-light">
                Up to 5 images, each less than 5MB
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
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-white/90 text-gray-600 rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-white"
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
                    <div
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all"
                      style={{
                        borderColor: accent.primary,
                        backgroundColor: `${accent.light}40`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${accent.light}80`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${accent.light}40`;
                      }}
                    >
                      <div className="text-3xl mb-2">📸</div>
                      <p className="text-sm text-gray-600 font-medium">
                        Click to select images
                      </p>
                      <p className="text-xs text-gray-500 mt-1 font-light">
                        {selectedImages.length}/5 images selected
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 py-3 px-4 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-lg font-medium text-white text-lg transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: accent.primary,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = accent.hover;
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = accent.primary;
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                }
              }}
            >
              {loading ? 'Preparing Preview... ⏳' : 'Preview Your Message 👀'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: accent.primary }}
            ></div>
            <span className="font-light">Your message will be treasured forever</span>
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: accent.primary, animationDelay: '0.5s' }}
            ></div>
          </div>
        </div>
      </div>
    </main>
  );
}
