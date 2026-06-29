"use client";

import { useEffect, useRef, useState } from "react";

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const fadeIntervalRef = useRef<number | null>(null);

  const isPlayingRef = useRef(false);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Initialize audio and check user preference
  useEffect(() => {
    const savedMuted = localStorage.getItem("wedding-music-muted");
    if (savedMuted === "1") {
      setIsMuted(true);
    }
  }, []);

  const startFadeIn = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Clear any active fade interval
    if (fadeIntervalRef.current) {
      window.clearInterval(fadeIntervalRef.current);
    }

    audio.volume = 0;
    audio.play()
      .then(() => {
        setIsPlaying(true);
        // Smoothly fade volume in to 0.75 over 2.5 seconds
        const targetVolume = 0.75;
        const duration = 2500;
        const intervalTime = 100;
        const step = targetVolume / (duration / intervalTime);

        fadeIntervalRef.current = window.setInterval(() => {
          if (audio.volume + step >= targetVolume) {
            audio.volume = targetVolume;
            if (fadeIntervalRef.current) {
              window.clearInterval(fadeIntervalRef.current);
              fadeIntervalRef.current = null;
            }
          } else {
            audio.volume += step;
          }
        }, intervalTime);
      })
      .catch((err) => {
        console.log("Audio play blocked or failed: ", err);
        setIsPlaying(false);
      });
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      localStorage.setItem("wedding-music-muted", "1");
      setIsMuted(true);
    } else {
      audio.volume = 0.75;
      audio.play()
        .then(() => {
          setIsPlaying(true);
          localStorage.removeItem("wedding-music-muted");
          setIsMuted(false);
        })
        .catch((err) => console.log("Failed to play: ", err));
    }
  };

  useEffect(() => {
    const handlePlaySignal = () => {
      // Don't play if the user previously muted it
      const savedMuted = localStorage.getItem("wedding-music-muted");
      if (savedMuted === "1") return;

      startFadeIn();
    };

    const handleIntroFinishedSignal = () => {
      // If intro finished and we aren't playing yet, attempt autoplay
      const audio = audioRef.current;
      if (audio && !isPlayingRef.current) {
        const savedMuted = localStorage.getItem("wedding-music-muted");
        if (savedMuted === "1") return;
        
        // Auto-play attempt
        audio.volume = 0.75;
        audio.play()
          .then(() => {
            setIsPlaying(true);
            setIsMuted(false);
          })
          .catch(() => {
            // Browsers block autoplay without interaction, which is expected if intro was skipped
            setIsPlaying(false);
          });
      }
    };

    window.addEventListener("playWeddingMusic", handlePlaySignal);
    window.addEventListener("introFinished", handleIntroFinishedSignal);

    // Initial check: if the intro was already skipped on mount, try playing
    const sessionKeyHome = "wedding-splash:home";
    const sessionKeyPublic = "wedding-splash:public";
    const hasSeenSplash = () => {
      try {
        return localStorage.getItem(sessionKeyHome) === "1" || 
               localStorage.getItem(sessionKeyPublic) === "1";
      } catch {
        return false;
      }
    };

    if (hasSeenSplash()) {
      handleIntroFinishedSignal();
    }

    return () => {
      window.removeEventListener("playWeddingMusic", handlePlaySignal);
      window.removeEventListener("introFinished", handleIntroFinishedSignal);
      if (fadeIntervalRef.current) {
        window.clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes vinyl-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .vinyl-spin-active {
            animation: vinyl-spin 12s linear infinite;
          }
          .vinyl-spin-paused {
            animation: vinyl-spin 12s linear infinite;
            animation-play-state: paused;
          }
        `
      }} />
      
      <audio
        ref={audioRef}
        src="/assets/audio/co-chut-ngot-ngao.mp3"
        loop
        preload="auto"
      />

      <button
        onClick={togglePlay}
        aria-label={isPlaying ? "Tắt nhạc nền" : "Bật nhạc nền"}
        className="fixed bottom-6 right-6 z-[90] w-12 h-12 rounded-full flex items-center justify-center bg-white/5 backdrop-blur-md border-[0.5px] border-[#b4975a]/30 shadow-[0_4px_20px_rgba(180,151,90,0.08)] opacity-40 hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-500 cursor-pointer select-none"
      >
        <div className={`w-8 h-8 relative transition-transform duration-500 ${isPlaying ? "vinyl-spin-active" : "vinyl-spin-paused"}`}>
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full stroke-[#b4975a]">
            {/* Outer edge */}
            <circle cx="12" cy="12" r="10" strokeWidth="0.8" />
            {/* Grooves */}
            <circle cx="12" cy="12" r="7.5" strokeDasharray="3 2" strokeWidth="0.5" opacity="0.6" />
            <circle cx="12" cy="12" r="5" strokeWidth="0.5" opacity="0.4" />
            {/* Center label backing */}
            <circle cx="12" cy="12" r="3.2" fill="#b4975a" fillOpacity="0.08" strokeWidth="0.3" strokeDasharray="1 1" />
            {/* Center musical note */}
            <path
              d="M10.8 13.5 A 1.1 0.9 0 1 1 12.2 12.8 L 12.2 9 C 12.2 9 13.5 8.6 14.2 9.8"
              stroke="#b4975a"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="11.1" cy="13.2" r="0.8" fill="#b4975a" />
            {/* Stylized shine highlights */}
            <path d="M12 2 A10 10 0 0 1 20 8" strokeWidth="0.8" strokeLinecap="round" opacity="0.4" />
            <path d="M12 22 A10 10 0 0 1 4 16" strokeWidth="0.8" strokeLinecap="round" opacity="0.4" />
          </svg>
        </div>

        {/* Diagonal slash line when muted/paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 stroke-[#b4975a]/80">
              <line 
                x1="4" 
                y1="20" 
                x2="20" 
                y2="4" 
                strokeWidth="1.2" 
                strokeLinecap="round"
                style={{
                  strokeDasharray: 30,
                  strokeDashoffset: 0,
                  transition: "stroke-dashoffset 0.3s ease"
                }}
              />
            </svg>
          </div>
        )}
      </button>
    </>
  );
}
