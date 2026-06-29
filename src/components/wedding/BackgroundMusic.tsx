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
        className="fixed bottom-6 right-6 z-[90] w-[42px] h-[42px] rounded-full flex items-center justify-center bg-white/5 backdrop-blur-md border-[0.5px] border-[#b4975a]/30 shadow-[0_4px_20px_rgba(180,151,90,0.08)] opacity-40 hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-500 cursor-pointer select-none"
      >
        <div className={`w-[34px] h-[34px] relative transition-transform duration-500 ${isPlaying ? "vinyl-spin-active" : "vinyl-spin-paused"}`}>
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full stroke-[#b4975a]">
            {/* Outer edge */}
            <circle cx="12" cy="12" r="10" strokeWidth="0.8" />
            {/* Grooves */}
            <circle cx="12" cy="12" r="7.5" strokeDasharray="3 2" strokeWidth="0.5" opacity="0.6" />
            <circle cx="12" cy="12" r="5" strokeWidth="0.5" opacity="0.4" />
            {/* Center label backing */}
            <circle cx="12" cy="12" r="3.2" fill="#b4975a" fillOpacity="0.08" strokeWidth="0.3" strokeDasharray="1 1" />
            {/* Center G-clef (Khóa Sol) */}
            <g transform="translate(7.17, 6.96) scale(0.42)" fill="#b4975a">
              <path d="M13 11V7.5L15.2 5.29C16 4.5 16.15 3.24 15.59 2.26C15.14 1.47 14.32 1 13.45 1C13.24 1 13 1.03 12.81 1.09C11.73 1.38 11 2.38 11 3.5V6.74L7.86 9.91C6.2 11.6 5.7 14.13 6.61 16.34C7.38 18.24 9.06 19.55 11 19.89V20.5C11 20.76 10.77 21 10.5 21H9V23H10.5C11.85 23 13 21.89 13 20.5V20C15.03 20 17.16 18.08 17.16 15.25C17.16 12.95 15.24 11 13 11M13 3.5C13 3.27 13.11 3.09 13.32 3.03C13.54 2.97 13.77 3.06 13.88 3.26C14 3.46 13.96 3.71 13.8 3.87L13 4.73V3.5M11 11.5C10.03 12.14 9.3 13.24 9.04 14.26L11 14.78V17.83C9.87 17.53 8.9 16.71 8.43 15.57C7.84 14.11 8.16 12.45 9.26 11.33L11 9.5V11.5M13 18V12.94C14.17 12.94 15.18 14.04 15.18 15.25C15.18 17 13.91 18 13 18Z" />
            </g>
            {/* Stylized shine highlights */}
            <path d="M12 2 A10 10 0 0 1 20 8" strokeWidth="0.8" strokeLinecap="round" opacity="0.4" />
            <path d="M12 22 A10 10 0 0 1 4 16" strokeWidth="0.8" strokeLinecap="round" opacity="0.4" />
          </svg>
        </div>

        {/* Diagonal slash line when muted/paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg viewBox="0 0 24 24" fill="none" className="w-[34px] h-[34px] stroke-[#b4975a]/80">
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
