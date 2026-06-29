"use client";

import { useEffect, useRef, useState } from "react";

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const fadeIntervalRef = useRef<number | null>(null);

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
      if (audio && !isPlaying) {
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
  }, [isPlaying]);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes music-wave-bar-1 {
            0% { height: 4px; }
            100% { height: 16px; }
          }
          @keyframes music-wave-bar-2 {
            0% { height: 4px; }
            100% { height: 22px; }
          }
          @keyframes music-wave-bar-3 {
            0% { height: 4px; }
            100% { height: 18px; }
          }
          @keyframes music-wave-bar-4 {
            0% { height: 4px; }
            100% { height: 12px; }
          }
          .music-wave-active-1 { animation: music-wave-bar-1 0.6s ease-in-out infinite alternate; }
          .music-wave-active-2 { animation: music-wave-bar-2 0.8s ease-in-out infinite alternate; }
          .music-wave-active-3 { animation: music-wave-bar-3 0.7s ease-in-out infinite alternate; }
          .music-wave-active-4 { animation: music-wave-bar-4 0.5s ease-in-out infinite alternate; }
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
        className="fixed bottom-6 right-6 z-[90] w-11 h-11 rounded-full flex items-center justify-center bg-white/70 backdrop-blur-md border border-[#b4975a]/30 shadow-[0_4px_16px_rgba(63,70,66,0.12)] hover:shadow-[0_6px_20px_rgba(63,70,66,0.18)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer select-none"
      >
        <div className="flex items-end justify-center gap-[3px] h-6 w-6">
          <span 
            className={`w-[2.5px] bg-[#b4975a] rounded-full transition-all duration-300 ${
              isPlaying ? "music-wave-active-1" : "h-[6px]"
            }`} 
          />
          <span 
            className={`w-[2.5px] bg-[#b4975a] rounded-full transition-all duration-300 ${
              isPlaying ? "music-wave-active-2" : "h-[10px]"
            }`} 
          />
          <span 
            className={`w-[2.5px] bg-[#b4975a] rounded-full transition-all duration-300 ${
              isPlaying ? "music-wave-active-3" : "h-[8px]"
            }`} 
          />
          <span 
            className={`w-[2.5px] bg-[#b4975a] rounded-full transition-all duration-300 ${
              isPlaying ? "music-wave-active-4" : "h-[5px]"
            }`} 
          />
        </div>
      </button>
    </>
  );
}
