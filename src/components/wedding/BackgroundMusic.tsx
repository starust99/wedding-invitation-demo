"use client";

import { useEffect, useRef, useState } from "react";

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showController, setShowController] = useState(false);
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
      // Force play when the user clicks "Chạm để mở", overriding any previous mute choice
      try {
        localStorage.removeItem("wedding-music-muted");
      } catch (e) {}
      setIsMuted(false);
      setShowController(true);
      startFadeIn();
    };

    const handleIntroFinishedSignal = () => {
      setShowController(true);
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
    const isIntroSkipped = () => {
      try {
        const shouldForce = new URLSearchParams(window.location.search).get("intro") === "1";
        if (shouldForce) return false;

        return localStorage.getItem(sessionKeyHome) === "1" || 
               localStorage.getItem(sessionKeyPublic) === "1";
      } catch {
        return false;
      }
    };

    if (isIntroSkipped()) {
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

  // Listen to first user interaction to resume audio on reload if it wasn't explicitly muted
  useEffect(() => {
    let hasTriggered = false;

    const handleFirstInteraction = () => {
      if (hasTriggered) return;

      const audio = audioRef.current;
      if (audio && !isPlayingRef.current) {
        const savedMuted = localStorage.getItem("wedding-music-muted");
        if (savedMuted === "1") {
          removeListeners();
          return;
        }

        hasTriggered = true;
        audio.volume = 0.75;
        audio.play()
          .then(() => {
            setIsPlaying(true);
            setIsMuted(false);
            removeListeners();
          })
          .catch((err) => {
            console.log("Play on interaction failed:", err);
            hasTriggered = false;
          });
      } else if (isPlayingRef.current) {
        removeListeners();
      }
    };

    const removeListeners = () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction);

    return () => {
      removeListeners();
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

      {showController && (
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Tắt nhạc nền" : "Bật nhạc nền"}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[90] w-[36px] h-[36px] md:w-[45px] md:h-[45px] rounded-full flex items-center justify-center opacity-90 hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-500 cursor-pointer select-none"
        >
          <div className="w-[36px] h-[36px] md:w-[45px] md:h-[45px] relative transition-transform duration-500 vinyl-spin-active">
            <img 
              src="/assets/music-icon.png" 
              alt="Music Icon" 
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>

          {/* Diagonal slash line when muted */}
          {isMuted && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg viewBox="0 0 24 24" fill="none" className="w-[36px] h-[36px] md:w-[45px] md:h-[45px] stroke-[#b4975a]">
                <line 
                  x1="7" 
                  y1="17" 
                  x2="17" 
                  y2="7" 
                  strokeWidth="0.9" 
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
      )}
    </>
  );
}
