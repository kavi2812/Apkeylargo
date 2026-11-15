import { useCallback, useEffect, useRef, useState } from 'react';
import {
  COVER_NIGHT_DRIVE,
  DRIVE_AUDIO_TRACKS,
  SPOTIFY_PRESETS,
  YOUTUBE_PRESETS,
  extractYouTubeVideoId,
  toSpotifyEmbedUrl,
} from '../data/mediaCatalog';
import {
  DriveAudioTrack,
  MediaTab,
  SpotifyMode,
  SpotifyPlaylistPreset,
  YouTubeTrack,
} from '../types/launcher';

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (vol: number) => void;
  loadVideoById: (videoId: string) => void;
  getVideoData?: () => { title?: string; author?: string; video_id?: string };
  destroy: () => void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

class DriveSynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private stepTimer: number | null = null;
  private stepIndex = 0;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.22;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(normalized: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        Math.max(0, Math.min(0.45, normalized * 0.35)),
        this.ctx.currentTime,
        0.05
      );
    }
  }

  public start(preset: 'night-drive' | 'monsoon-lofi' | 'coastal-cruise') {
    this.stop();
    const ctx = this.ensureContext();
    this.stepIndex = 0;

    const progressions: Record<typeof preset, number[][]> = {
      'night-drive': [
        [110, 164.81, 220, 261.63],
        [98, 146.83, 196, 246.94],
        [87.31, 130.81, 174.61, 220],
        [82.41, 123.47, 164.81, 196],
      ],
      'monsoon-lofi': [
        [130.81, 196, 246.94, 293.66],
        [110, 164.81, 196, 246.94],
        [87.31, 130.81, 174.61, 207.65],
        [98, 146.83, 196, 246.94],
      ],
      'coastal-cruise': [
        [146.83, 220, 261.63, 329.63],
        [130.81, 196, 246.94, 293.66],
        [110, 164.81, 220, 261.63],
        [98, 146.83, 196, 246.94],
      ],
    };

    const chords = progressions[preset];
    const tempoMs = preset === 'night-drive' ? 1600 : preset === 'monsoon-lofi' ? 2100 : 1850;

    const triggerChord = () => {
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const chord = chords[this.stepIndex % chords.length];
      this.stepIndex += 1;

      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const env = this.ctx.createGain();

        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(preset === 'night-drive' ? 900 : 650, now);

        const dur = tempoMs / 1000;
        env.gain.setValueAtTime(0.0001, now);
        env.gain.exponentialRampToValueAtTime(idx === 0 ? 0.36 : 0.18, now + 0.18);
        env.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.96);

        osc.connect(filter);
        filter.connect(env);
        env.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + dur);
      });
    };

    triggerChord();
    this.stepTimer = window.setInterval(triggerChord, tempoMs);
    void ctx;
  }

  public stop() {
    if (this.stepTimer !== null) {
      window.clearInterval(this.stepTimer);
      this.stepTimer = null;
    }
  }
}

export function usePersistentMedia() {
  const [activeTab, setActiveTab] = useState<MediaTab>('spotify');
  const [spotifyMode, setSpotifyModeState] = useState<SpotifyMode>('drive-audio');
  const [lastSource, setLastSource] = useState<'youtube' | 'music'>('music');

  // Spotify Embed state
  const [spotifyPresets] = useState<SpotifyPlaylistPreset[]>(SPOTIFY_PRESETS);
  const [activeSpotifyPresetId, setActiveSpotifyPresetId] = useState<string>(
    SPOTIFY_PRESETS[0].id
  );
  const [customSpotifyEmbedUrl, setCustomSpotifyEmbedUrl] = useState<string | null>(null);
  const [customSpotifyLabel, setCustomSpotifyLabel] = useState<string>('Custom Spotify');

  // Drive Audio (Synth + USB Audio files)
  const [driveTracks, setDriveTracks] = useState<DriveAudioTrack[]>(DRIVE_AUDIO_TRACKS);
  const [driveTrackIndex, setDriveTrackIndex] = useState(0);
  const [drivePlaying, setDrivePlaying] = useState(false);
  const [driveProgressSec, setDriveProgressSec] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [muted, setMuted] = useState(false);

  // YouTube state
  const [youtubeTracks, setYoutubeTracks] = useState<YouTubeTrack[]>(YOUTUBE_PRESETS);
  const [youtubeIndex, setYoutubeIndex] = useState(0);
  const [youtubePlaying, setYoutubePlaying] = useState(false);
  const [youtubeReady, setYoutubeReady] = useState(false);

  const synthRef = useRef<DriveSynthEngine | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const youtubeIndexRef = useRef(0);
  const youtubeTracksRef = useRef(youtubeTracks);

  youtubeIndexRef.current = youtubeIndex;
  youtubeTracksRef.current = youtubeTracks;

  const currentDriveTrack = driveTracks[driveTrackIndex] ?? driveTracks[0];
  const currentYouTubeTrack = youtubeTracks[youtubeIndex] ?? youtubeTracks[0];
  const activeSpotifyPreset =
    spotifyPresets.find((p) => p.id === activeSpotifyPresetId) ?? spotifyPresets[0];
  const activeSpotifyEmbedUrl = customSpotifyEmbedUrl ?? activeSpotifyPreset.embedUrl;

  // Initialize Audio element and Drive Synth once
  useEffect(() => {
    synthRef.current = new DriveSynthEngine();
    const audio = new Audio();
    audio.preload = 'auto';
    audioElRef.current = audio;

    const handleTimeUpdate = () => {
      setDriveProgressSec(Math.floor(audio.currentTime || 0));
    };
    const handleEnded = () => {
      setDriveTrackIndex((prev) => (prev + 1) % driveTracks.length);
      setDriveProgressSec(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      synthRef.current?.stop();
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [driveTracks.length]);

  // Keep Drive Audio volume synced
  useEffect(() => {
    const effVol = muted ? 0 : volume / 100;
    synthRef.current?.setVolume(effVol);
    if (audioElRef.current) {
      audioElRef.current.volume = effVol;
    }
    if (ytPlayerRef.current && youtubeReady) {
      if (muted) ytPlayerRef.current.mute();
      else {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(volume);
      }
    }
  }, [volume, muted, youtubeReady]);

  // Progress ticker for synth tracks
  useEffect(() => {
    if (!drivePlaying || currentDriveTrack.kind !== 'synth-groove') return;
    const id = window.setInterval(() => {
      setDriveProgressSec((prev) => {
        if (prev + 1 >= currentDriveTrack.durationSec) {
          setDriveTrackIndex((idx) => (idx + 1) % driveTracks.length);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [drivePlaying, currentDriveTrack, driveTracks.length]);

  // Start/stop Drive Audio engine on track or playing change
  useEffect(() => {
    const audio = audioElRef.current;
    const synth = synthRef.current;
    if (!audio || !synth) return;

    if (!drivePlaying) {
      synth.stop();
      audio.pause();
      return;
    }

    if (currentDriveTrack.kind === 'local-file' && currentDriveTrack.objectUrl) {
      synth.stop();
      if (audio.src !== currentDriveTrack.objectUrl) {
        audio.src = currentDriveTrack.objectUrl;
      }
      void audio.play().catch(() => {
        setDrivePlaying(false);
      });
    } else {
      audio.pause();
      synth.start(currentDriveTrack.synthPreset ?? 'night-drive');
    }
  }, [drivePlaying, currentDriveTrack]);

  // Load YouTube IFrame Player API once into persistent DOM node #creta-yt-player
  useEffect(() => {
    let mounted = true;

    const initPlayer = () => {
      if (!mounted || !window.YT?.Player || ytPlayerRef.current) return;
      const el = document.getElementById('creta-yt-player');
      if (!el) return;

      ytPlayerRef.current = new window.YT.Player('creta-yt-player', {
        videoId: YOUTUBE_PRESETS[0].videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: (ev) => {
            if (!mounted) return;
            setYoutubeReady(true);
            ev.target.setVolume(volume);
          },
          onStateChange: (ev) => {
            if (!mounted) return;
            const PS = window.YT?.PlayerState;
            if (!PS) return;
            if (ev.data === PS.PLAYING) {
              setYoutubePlaying(true);
              setLastSource('youtube');
              setActiveTab('youtube');
              // Pause Drive Audio so YouTube and Drive Audio don't overlap
              setDrivePlaying(false);
            } else if (ev.data === PS.PAUSED) {
              setYoutubePlaying(false);
            } else if (ev.data === PS.ENDED) {
              const nextIdx =
                (youtubeIndexRef.current + 1) % youtubeTracksRef.current.length;
              setYoutubeIndex(nextIdx);
              const nextTrack = youtubeTracksRef.current[nextIdx];
              if (nextTrack) {
                ev.target.loadVideoById(nextTrack.videoId);
              }
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        document.body.appendChild(tag);
      }
    }

    return () => {
      mounted = false;
    };
  }, []);

  const setSpotifyMode = useCallback((mode: SpotifyMode) => {
    setSpotifyModeState(mode);
    setLastSource('music');
    setActiveTab('spotify');
  }, []);

  // Controls
  const toggleDrivePlay = useCallback(() => {
    setLastSource('music');
    setActiveTab('spotify');
    setDrivePlaying((prev) => {
      const next = !prev;
      if (next) {
        // Pause YouTube if active
        ytPlayerRef.current?.pauseVideo();
        setYoutubePlaying(false);
      }
      return next;
    });
  }, []);

  const nextDriveTrack = useCallback(() => {
    setLastSource('music');
    setActiveTab('spotify');
    setDriveTrackIndex((prev) => (prev + 1) % driveTracks.length);
    setDriveProgressSec(0);
    setDrivePlaying(true);
    ytPlayerRef.current?.pauseVideo();
    setYoutubePlaying(false);
  }, [driveTracks.length]);

  const prevDriveTrack = useCallback(() => {
    setLastSource('music');
    setActiveTab('spotify');
    setDriveTrackIndex((prev) => (prev - 1 + driveTracks.length) % driveTracks.length);
    setDriveProgressSec(0);
    setDrivePlaying(true);
    ytPlayerRef.current?.pauseVideo();
    setYoutubePlaying(false);
  }, [driveTracks.length]);

  const selectDriveTrack = useCallback((idx: number) => {
    setLastSource('music');
    setActiveTab('spotify');
    setDriveTrackIndex(idx);
    setDriveProgressSec(0);
    setDrivePlaying(true);
    ytPlayerRef.current?.pauseVideo();
    setYoutubePlaying(false);
  }, []);

  const addLocalAudioFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added: DriveAudioTrack[] = Array.from(files).map((file, i) => ({
      id: `usb-${Date.now()}-${i}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'USB / Local Audio',
      album: 'USB Storage',
      durationSec: 200,
      coverUrl: COVER_NIGHT_DRIVE,
      kind: 'local-file',
      objectUrl: URL.createObjectURL(file),
    }));
    setDriveTracks((prev) => {
      const startIndex = prev.length;
      setDriveTrackIndex(startIndex);
      return [...prev, ...added];
    });
    setDriveProgressSec(0);
    setDrivePlaying(true);
    ytPlayerRef.current?.pauseVideo();
    setYoutubePlaying(false);
  }, []);

  const selectYouTubeTrack = useCallback((idx: number) => {
    const track = youtubeTracksRef.current[idx];
    if (!track) return;
    setLastSource('youtube');
    setActiveTab('youtube');
    setYoutubeIndex(idx);
    setDrivePlaying(false);
    setYoutubePlaying(true);
    ytPlayerRef.current?.loadVideoById(track.videoId);
  }, []);

  const toggleYouTubePlay = useCallback(() => {
    if (!ytPlayerRef.current) return;
    setLastSource('youtube');
    setActiveTab('youtube');
    if (youtubePlaying) {
      ytPlayerRef.current.pauseVideo();
      setYoutubePlaying(false);
    } else {
      setDrivePlaying(false);
      ytPlayerRef.current.playVideo();
      setYoutubePlaying(true);
    }
  }, [youtubePlaying]);

  const nextYouTubeTrack = useCallback(() => {
    const nextIdx = (youtubeIndexRef.current + 1) % youtubeTracksRef.current.length;
    selectYouTubeTrack(nextIdx);
  }, [selectYouTubeTrack]);

  const prevYouTubeTrack = useCallback(() => {
    const prevIdx =
      (youtubeIndexRef.current - 1 + youtubeTracksRef.current.length) %
      youtubeTracksRef.current.length;
    selectYouTubeTrack(prevIdx);
  }, [selectYouTubeTrack]);

  const loadCustomYouTubeUrl = useCallback((input: string): boolean => {
    const videoId = extractYouTubeVideoId(input);
    if (!videoId) return false;
    const customTrack: YouTubeTrack = {
      id: `yt-custom-${videoId}`,
      videoId,
      title: `YouTube Video (${videoId})`,
      channel: 'Custom URL',
      category: 'Custom',
    };
    setYoutubeTracks((prev) => {
      const existingIdx = prev.findIndex((t) => t.videoId === videoId);
      if (existingIdx !== -1) {
        setYoutubeIndex(existingIdx);
        return prev;
      }
      setYoutubeIndex(prev.length);
      return [...prev, customTrack];
    });
    setLastSource('youtube');
    setActiveTab('youtube');
    setDrivePlaying(false);
    setYoutubePlaying(true);
    ytPlayerRef.current?.loadVideoById(videoId);
    return true;
  }, []);

  const loadCustomSpotifyUrl = useCallback((input: string): boolean => {
    const embedUrl = toSpotifyEmbedUrl(input);
    if (!embedUrl) return false;
    setCustomSpotifyEmbedUrl(embedUrl);
    setCustomSpotifyLabel('Custom Spotify Link');
    setSpotifyModeState('embed');
    setLastSource('music');
    setActiveTab('spotify');
    return true;
  }, []);

  const selectSpotifyPreset = useCallback((presetId: string) => {
    setCustomSpotifyEmbedUrl(null);
    setActiveSpotifyPresetId(presetId);
    setSpotifyModeState('embed');
    setLastSource('music');
    setActiveTab('spotify');
  }, []);

  // Unified active source helper for Screensaver & SWC keyboard shortcuts
  const activePlayingSource: 'youtube' | 'drive-audio' | 'spotify-embed' = youtubePlaying
    ? 'youtube'
    : drivePlaying
      ? 'drive-audio'
      : lastSource === 'youtube'
        ? 'youtube'
        : spotifyMode === 'embed'
          ? 'spotify-embed'
          : 'drive-audio';

  const toggleActivePlay = useCallback(() => {
    if (activePlayingSource === 'youtube') {
      toggleYouTubePlay();
    } else {
      toggleDrivePlay();
    }
  }, [activePlayingSource, toggleYouTubePlay, toggleDrivePlay]);

  const nextActiveTrack = useCallback(() => {
    if (activePlayingSource === 'youtube') {
      nextYouTubeTrack();
    } else {
      nextDriveTrack();
    }
  }, [activePlayingSource, nextYouTubeTrack, nextDriveTrack]);

  const prevActiveTrack = useCallback(() => {
    if (activePlayingSource === 'youtube') {
      prevYouTubeTrack();
    } else {
      prevDriveTrack();
    }
  }, [activePlayingSource, prevYouTubeTrack, prevDriveTrack]);

  return {
    activeTab,
    setActiveTab,
    spotifyMode,
    setSpotifyMode,
    spotifyPresets,
    activeSpotifyPreset,
    activeSpotifyEmbedUrl,
    customSpotifyEmbedUrl,
    customSpotifyLabel,
    selectSpotifyPreset,
    loadCustomSpotifyUrl,
    driveTracks,
    driveTrackIndex,
    currentDriveTrack,
    drivePlaying,
    driveProgressSec,
    toggleDrivePlay,
    nextDriveTrack,
    prevDriveTrack,
    selectDriveTrack,
    addLocalAudioFiles,
    youtubeTracks,
    youtubeIndex,
    currentYouTubeTrack,
    youtubePlaying,
    youtubeReady,
    toggleYouTubePlay,
    nextYouTubeTrack,
    prevYouTubeTrack,
    selectYouTubeTrack,
    loadCustomYouTubeUrl,
    volume,
    setVolume: setVolumeState,
    muted,
    toggleMute: () => setMuted((m) => !m),
    activePlayingSource,
    toggleActivePlay,
    nextActiveTrack,
    prevActiveTrack,
  };
}
