'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Video,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  Play,
  RotateCcw,
  User,
  Activity,
  Clock,
  FileVideo,
  Download,
  Upload,
} from 'lucide-react';
import styles from './Dashboard.module.css';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.8.27.170:7860';
const STATUS = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  DONE: 'done',
  ERROR: 'error',
} as const;

type StatusType = (typeof STATUS)[keyof typeof STATUS];

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<StatusType>(STATUS.IDLE);
  const [result, setResult] = useState<any>(null);
  const [outputVideoUrl, setOutputVideoUrl] = useState<string | null>(null);
  const [originalVideoUrl, setOriginalVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');

  // Load session data on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('detectionSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setResult(session.result);
        setOutputVideoUrl(session.outputVideoUrl);
        setOriginalVideoUrl(session.originalVideoUrl);
        setStatus(session.status);
      } catch (e) {
        console.error('Failed to load session:', e);
      }
    }
  }, []);

  // Save session data whenever results change
  useEffect(() => {
    if (result || outputVideoUrl) {
      const session = {
        result,
        outputVideoUrl,
        originalVideoUrl,
        status: STATUS.DONE,
      };
      localStorage.setItem('detectionSession', JSON.stringify(session));
    }
  }, [result, outputVideoUrl, originalVideoUrl]);

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  function handleFileSelect(selectedFile: File | null) {
    if (!selectedFile) return;
    if (!selectedFile.name.match(/\.(mp4|avi|mov|mkv|webm)$/i)) {
      setError(
        'Please upload a valid video file (MP4, AVI, MOV, MKV, WebM).'
      );
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setStatus(STATUS.IDLE);
    setResult(null);
    setOutputVideoUrl(null);
    setError('');
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }

  async function analyzeVideo() {
    if (!file) return;
    setStatus(STATUS.UPLOADING);
    setError('');
    setProgress(0);
    setProgressLabel('Uploading footage…');

    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      const formData = new FormData();
      formData.append('video', file);

      progressInterval = setInterval(() => {
        setProgress((p) => {
          if (p >= 80) {
            setProgressLabel('Analyzing frames…');
            if (progressInterval) clearInterval(progressInterval);
            return p;
          }
          if (p > 40) setProgressLabel('Processing with AI model…');
          return p + Math.random() * 10;
        });
      }, 400);

      setStatus(STATUS.PROCESSING);

      const token = await currentUser?.getIdToken();
      const response = await fetch(`${API_BASE}/detect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (progressInterval) clearInterval(progressInterval);
      setProgress(100);
      setProgressLabel('Done!');

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.detail || errData.message || `Server error: ${response.status}`
        );
      }

      const contentType = response.headers.get('content-type') || '';

      if (
        contentType.startsWith('video/') ||
        contentType === 'application/octet-stream'
      ) {
        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);
        setOutputVideoUrl(videoUrl);
        setResult({ shoplifting_detected: null, video_only: true });
      } else {
        const data = await response.json();
        setResult(data);
        const nested = data.result || data.data || {};
        if (data.video_b64) {
          const byteChars = atob(data.video_b64);
          const byteArr = new Uint8Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            byteArr[i] = byteChars.charCodeAt(i);
          }
          const blob = new Blob([byteArr], { type: 'video/mp4' });
          setOutputVideoUrl(URL.createObjectURL(blob));
        } else {
          const outputUrl =
            data.video_url ||
            data.download_url ||
            data.output_url ||
            data.output_video_url ||
            data.result_video_url ||
            data.video ||
            data.file_url ||
            data.processed_video_url ||
            nested.video_url ||
            nested.download_url ||
            nested.output_url;
          if (outputUrl) {
            setOutputVideoUrl(
              outputUrl.startsWith('http') ? outputUrl : `${API_BASE}${outputUrl}`
            );
          }
        }
        
        // Extract original video URL
        const origUrl = data.original_video_url || nested.original_video_url;
        if (origUrl) {
          setOriginalVideoUrl(
            origUrl.startsWith('http') ? origUrl : `${API_BASE}${origUrl}`
          );
        }
      }

      setStatus(STATUS.DONE);
    } catch (err: any) {
      if (progressInterval) clearInterval(progressInterval);
      console.error('Analysis error:', err);
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to backend. Make sure the backend server is running on http://localhost:7860'
          : err.message || 'Failed to analyze video. Ensure the backend is running.'
      );
      setStatus(STATUS.ERROR);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setStatus(STATUS.IDLE);
    setResult(null);
    setOutputVideoUrl(null);
    setOriginalVideoUrl(null);
    setError('');
    setProgress(0);
    setProgressLabel('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    localStorage.removeItem('detectionSession');
  }

  const isProcessing =
    status === STATUS.UPLOADING || status === STATUS.PROCESSING;
  const isDone = status === STATUS.DONE;

  return (
    <div className={styles.root}>
      <div className={styles.gridBg} />

      {/* Navbar */}
      <motion.nav
        className={styles.nav}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <div className={styles.navBrand}>
          <ShieldAlert size={24} className={styles.navIcon} />
          <span>
            ShopGuard<span className={styles.brandAI}>AI</span>
          </span>
        </div>
        <div className={styles.navRight}>
          <div className={styles.navUser}>
            <div className={styles.userAvatar}>
              {currentUser?.displayName?.[0]?.toUpperCase() || (
                <User size={14} />
              )}
            </div>
            <span className={styles.userName}>
              {currentUser?.displayName || currentUser?.email}
            </span>
          </div>
          <motion.button
            className={styles.logoutBtn}
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </motion.button>
        </div>
      </motion.nav>

      <main className={styles.main}>
        <motion.div
          className={styles.pageHeader}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div>
            <h1 className={styles.pageTitle}>Detection Console</h1>
            <p className={styles.pageSub}>
              Upload CCTV footage to analyze for shoplifting activity
            </p>
          </div>
          <motion.div
            className={styles.statusBadge}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className={styles.statusDot} />
            <span>System Online</span>
          </motion.div>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          className={styles.uploadSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={styles.panelLabel}>
            <FileVideo size={14} />
            <span>FOOTAGE INPUT</span>
          </div>

          {!file && !result && !outputVideoUrl ? (
            <motion.div
              className={`${styles.dropzone} ${
                isDragging ? styles.dragging : ''
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className={styles.dzInner}>
                <motion.div
                  className={styles.dzIconWrap}
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Upload size={32} />
                </motion.div>
                <p className={styles.dzTitle}>Drop CCTV footage here</p>
                <p className={styles.dzSub}>or click to browse files</p>
                <div className={styles.dzFormats}>
                  MP4 · AVI · MOV · MKV · WebM
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
              />
            </motion.div>
          ) : (
            <motion.div
              className={styles.fileSelectedRow}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className={styles.fileChip}>
                <FileVideo size={15} />
                <span className={styles.fileName}>
                  {file?.name || 'Previous session video'}
                </span>
                {file && (
                  <span className={styles.fileSize}>
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                )}
                <motion.button
                  className={styles.removeBtn}
                  onClick={reset}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={13} />
                </motion.button>
              </div>
              <div className={styles.actionRow}>
                {file && (
                  <motion.button
                    className={styles.analyzeBtn}
                    onClick={analyzeVideo}
                    disabled={isProcessing || isDone}
                    whileHover={
                      isProcessing || isDone ? {} : { scale: 1.05 }
                    }
                    whileTap={isProcessing || isDone ? {} : { scale: 0.95 }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className={styles.spin} />{' '}
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <Play size={16} /> Run Analysis
                      </>
                    )}
                  </motion.button>
                )}
                {(isDone || status === STATUS.ERROR) && (
                  <motion.button
                    className={styles.resetBtn}
                    onClick={reset}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RotateCcw size={15} /> New Video
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {isProcessing && (
              <motion.div
                className={styles.progressWrap}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className={styles.progressLabels}>
                  <span>{progressLabel}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className={styles.progressTrack}>
                  <motion.div
                    className={styles.progressBar}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                className={styles.alert}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <AlertTriangle size={15} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Videos Row */}
        {(file || isDone || outputVideoUrl) && (
          <motion.div
            className={styles.videosRow}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className={styles.videoPanel}>
              <div className={styles.panelLabel}>
                <Video size={14} />
                <span>ORIGINAL FOOTAGE</span>
              </div>
              {preview ? (
                <video src={preview} controls className={styles.videoPlayer} />
              ) : originalVideoUrl ? (
                <video src={originalVideoUrl} controls className={styles.videoPlayer} />
              ) : isDone || outputVideoUrl ? (
                <div className={styles.videoPlaceholder}>
                  <Video size={32} />
                  <span>Original footage not available</span>
                  <p>Video processed but original not saved</p>
                </div>
              ) : (
                <div className={styles.videoPlaceholder}>
                  <Video size={32} />
                  <span>No video loaded</span>
                </div>
              )}
            </div>

            <div className={`${styles.videoPanel} ${styles.outputPanel}`}>
              <div className={styles.panelLabel}>
                <Activity size={14} />
                <span>PROCESSED OUTPUT</span>
                {outputVideoUrl && (
                  <a
                    href={outputVideoUrl}
                    download="shoplifting_detection_output.mp4"
                    className={styles.downloadLink}
                  >
                    <Download size={13} /> Download
                  </a>
                )}
              </div>

              {isProcessing ? (
                <div
                  className={`${styles.videoPlaceholder} ${styles.processing}`}
                >
                  <Loader2 size={32} className={styles.spin} />
                  <span>Processing video…</span>
                  <p>AI model is analyzing frames</p>
                </div>
              ) : outputVideoUrl ? (
                <video
                  src={outputVideoUrl}
                  controls
                  className={styles.videoPlayer}
                />
              ) : isDone ? (
                <div className={styles.videoPlaceholder}>
                  <Video size={32} />
                  <span>No output video returned</span>
                  <p>Check your backend response</p>
                </div>
              ) : (
                <div className={styles.videoPlaceholder}>
                  <ShieldAlert size={32} />
                  <span>Awaiting analysis</span>
                  <p>Click Run Analysis to start</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Stats Section */}
        {isDone && result && !result.video_only && (
          <motion.div
            className={styles.statsSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className={`${styles.verdictCard} ${
                result.shoplifting_detected ? styles.danger : styles.safe
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className={styles.verdictIcon}>
                {result.shoplifting_detected ? (
                  <AlertTriangle size={26} />
                ) : (
                  <CheckCircle2 size={26} />
                )}
              </div>
              <div>
                <div className={styles.verdictTitle}>
                  {result.shoplifting_detected
                    ? 'Shoplifting Detected'
                    : 'No Threat Detected'}
                </div>
                <div className={styles.verdictSub}>
                  {result.shoplifting_detected
                    ? 'Suspicious behavior identified in footage'
                    : 'Footage appears normal — no suspicious activity'}
                </div>
              </div>
            </motion.div>

            <div className={styles.metricsGrid}>
              {[
                {
                  label: 'Confidence',
                  value:
                    result.confidence != null
                      ? `${(result.confidence * 100).toFixed(1)}%`
                      : '—',
                  bar: result.confidence,
                },
                {
                  label: 'Frames Analyzed',
                  value: result.frames_analyzed ?? '—',
                },
                {
                  label: 'Flagged Frames',
                  value: result.flagged_frames ?? '—',
                },
                {
                  label: 'Duration',
                  value:
                    result.duration_seconds != null
                      ? `${result.duration_seconds}s`
                      : '—',
                },
              ].map((metric, i) => (
                <motion.div
                  key={i}
                  className={styles.metricCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  <span className={styles.metricLabel}>{metric.label}</span>
                  <span className={styles.metricVal}>{metric.value}</span>
                  {metric.bar != null && (
                    <div className={styles.metricBarTrack}>
                      <motion.div
                        className={styles.metricBarFill}
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.bar * 100}%` }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        style={{
                          background: result.shoplifting_detected
                            ? '#ef4444'
                            : '#00ffb4',
                        }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {result.incident_timestamps?.length > 0 && (
              <motion.div
                className={styles.timestampsSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <div className={styles.tsLabel}>
                  <Clock size={13} /> Incident Timestamps
                </div>
                <div className={styles.tsList}>
                  {result.incident_timestamps.map((t: string, i: number) => (
                    <motion.span
                      key={i}
                      className={styles.tsChip}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.1 + i * 0.05 }}
                    >
                      {t}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {result.message && (
              <div className={styles.resultNote}>{result.message}</div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
