"use client";

import { useEffect, useRef, useState } from "react";
import { WEDDING_AUDIO_SRC, weddingAsset } from "@/lib/wedding-preload-assets";

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

  const startFadeIn = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (fadeIntervalRef.current) {
      window.clearInterval(fadeIntervalRef.current);
    }

    audio.volume = 0;
    audio.play()
      .then(() => {
        setIsPlaying(true);
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

  // Initialize audio and check user preference & native script status
  useEffect(() => {
    const audio = audioRef.current;

    // Keep Safari/iOS lock-screen artwork aligned with the wedding brand.
    // Without explicit Media Session metadata, WebKit may fall back to a
    // stale favicon cached from an earlier deployment.
    if ("mediaSession" in navigator && "MediaMetadata" in window) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "Nhật & Phương",
        artist: "Thiệp cưới",
        album: "26.12.2026",
        artwork: [
          { src: "/assets/brand/heart-icon-96.png", sizes: "96x96", type: "image/png" },
          { src: "/assets/brand/heart-icon-128.png", sizes: "128x128", type: "image/png" },
          { src: "/assets/brand/heart-icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/assets/brand/heart-icon-256.png", sizes: "256x256", type: "image/png" },
          { src: "/assets/brand/heart-icon-384.png", sizes: "384x384", type: "image/png" },
          { src: "/assets/brand/heart-icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      });
    }
    
    // 1. Sync React state with actual DOM audio state (in case native script already started it)
    const savedMuted = localStorage.getItem("wedding-music-muted");
    if (savedMuted === "1") {
      setIsMuted(true);
    } else if (audio && !audio.paused) {
      setIsPlaying(true);
      setIsMuted(false);
      setShowController(true);
    }

    // 2. Setup handlers for audio events
    const handlePlaySignal = () => {
      try {
        localStorage.removeItem("wedding-music-muted");
      } catch {}
      setIsMuted(false);
      setShowController(true);
      startFadeIn();
    };

    const handleIntroFinishedSignal = () => {
      setShowController(true);
      
      const audio = audioRef.current;
      if (audio && audio.paused) {
        const savedMuted = localStorage.getItem("wedding-music-muted");
        if (savedMuted === "1") return;
        
        const tryPlay = () => {
          audio.volume = 0.75;
          audio.play()
            .then(() => {
              setIsPlaying(true);
              setIsMuted(false);
            })
            .catch((err) => {
              console.log("React autoplay fallback deferred:", err);
            });
        };

        if (audio.readyState >= 2) {
          tryPlay();
        } else {
          audio.addEventListener("canplay", tryPlay, { once: true });
        }
      }
    };

    const handleNativePlay = () => {
      setIsPlaying(true);
      setIsMuted(false);
      setShowController(true);
    };

    window.addEventListener("playWeddingMusic", handlePlaySignal);
    window.addEventListener("introFinished", handleIntroFinishedSignal);
    window.addEventListener("wedding-music-playing-native", handleNativePlay);

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
      setShowController(true);
      handleIntroFinishedSignal();
    }

    return () => {
      window.removeEventListener("playWeddingMusic", handlePlaySignal);
      window.removeEventListener("introFinished", handleIntroFinishedSignal);
      window.removeEventListener("wedding-music-playing-native", handleNativePlay);
      if (fadeIntervalRef.current) {
        window.clearInterval(fadeIntervalRef.current);
      }
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null;
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
        id="wedding-audio"
        ref={audioRef}
        src={WEDDING_AUDIO_SRC}
        loop
        preload="none"
        playsInline
      />



      {showController && (
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Tắt nhạc nền" : "Bật nhạc nền"}
          className="wedding-music-controller fixed z-[90] w-[36px] h-[36px] md:w-[45px] md:h-[45px] rounded-full flex items-center justify-center opacity-90 hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-500 cursor-pointer select-none"
        >
          <div className="w-[36px] h-[36px] md:w-[45px] md:h-[45px] relative transition-transform duration-500 vinyl-spin-active">
            <img 
              src={weddingAsset("/assets/music-icon.png")}
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
