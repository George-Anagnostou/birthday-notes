"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccentColor, getAccentCSSVars } from "@/lib/theme-config";
import type { AccentColor } from "@/lib/theme-config";

export default function Home() {
  const router = useRouter();
  const [recipientName, setRecipientName] = useState<string>("");
  const [recipientId, setRecipientId] = useState<string>("");
  const [accent, setAccent] = useState<AccentColor>(getAccentColor(undefined));

  useEffect(() => {
    // Fetch recipient info from API
    const fetchRecipientInfo = async () => {
      try {
        const response = await fetch("/api/recipient-info");
        if (response.ok) {
          const data = await response.json();
          setRecipientName(data.recipientName || "Your Friend");
          setRecipientId(data.recipientId || "");
          // Use recipient_id to determine accent color
          const accentColor = getAccentColor(data.recipientId);
          setAccent(accentColor);
        }
      } catch (error) {
        setRecipientName("Your Friend");
        setAccent(getAccentColor(undefined));
      }
    };

    fetchRecipientInfo();
  }, []);

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

      <div className="max-w-2xl w-full relative z-10">
        {/* Main content card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-12 border border-gray-100 transform transition-all duration-500 hover:shadow-3xl">
          <div className="text-center space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <div
                className="w-20 h-1 rounded-full mx-auto mb-6 animate-pulse"
                style={{ backgroundColor: accent.primary }}
              ></div>

              <div className="flex items-center justify-center gap-4 md:gap-6">
                {/* Floating confetti emojis - side by side */}
                <div className="text-3xl md:text-4xl flex-shrink-0"
                     style={{
                       animation: 'float 3s ease-in-out infinite',
                       animationDelay: '0s'
                     }}>
                  🎉
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-title)' }}>
                  Happy Birthday
                </h1>

                <div className="text-2xl md:text-3xl flex-shrink-0"
                     style={{
                       animation: 'float 3s ease-in-out infinite',
                       animationDelay: '1.5s'
                     }}>
                  🎂
                </div>
              </div>

              <h2
                className="text-4xl md:text-5xl font-bold tracking-tight transition-all duration-300 hover:scale-105"
                style={{ color: accent.primary, fontFamily: 'var(--font-signature)' }}
              >
                {recipientName || "..."}
              </h2>

              <div
                className="w-20 h-1 rounded-full mx-auto animate-pulse"
                style={{ backgroundColor: accent.primary, animationDelay: '0.5s' }}
              ></div>
            </div>

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

            {/* Description */}
            <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed" style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}>
              Leave a heartfelt message to celebrate this special day
            </p>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col items-center gap-6">
              <button
                onClick={() => router.push("/submit")}
                className="group relative px-8 py-4 rounded-xl text-white text-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1"
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
                <span className="relative z-10">Write Your Message</span>
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                     style={{
                       background: `linear-gradient(135deg, ${accent.primary} 0%, ${accent.dark} 100%)`,
                     }}
                ></div>
              </button>

              <button
                onClick={() => router.push("/recipient/login")}
                className="px-6 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 hover:shadow-md"
                style={{
                  backgroundColor: 'transparent',
                  color: accent.primary,
                  borderColor: accent.light,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 400,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = accent.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = accent.light;
                }}
              >
                View Your Notes
              </button>
            </div>

            {/* Footer text */}
            <p className="text-sm text-gray-500 pt-4" style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}>
              Your message will be treasured forever
            </p>
          </div>
        </div>

        {/* Subtle bottom accent */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-400">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: accent.primary }}
            ></div>
            <span>Celebrating special moments</span>
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
