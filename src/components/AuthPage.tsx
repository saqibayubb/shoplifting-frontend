'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ShieldAlert, Loader2, User, Mail, Lock, Zap, Shield, Activity } from 'lucide-react';
import styles from './AuthPage.module.css';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!form.name.trim()) return setError('Full name is required.');
        if (form.password.length < 6)
          return setError('Password must be at least 6 characters.');
        await signup(form.email, form.password, form.name);
      } else {
        await login(form.email, form.password);
      }
      router.push('/dashboard');
    } catch (err: any) {
      const msg =
        {
          'auth/user-not-found': 'No account found with this email.',
          'auth/wrong-password': 'Incorrect password. Try again.',
          'auth/email-already-in-use': 'This email is already registered.',
          'auth/invalid-email': 'Please enter a valid email address.',
          'auth/invalid-credential':
            'Invalid credentials. Check your email and password.',
        }[err.code] || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.root}>
      {/* Animated background elements */}
      <div className={styles.gridBg} />
      <motion.div
        className={styles.gradientOrb1}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className={styles.gradientOrb2}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Left panel */}
      <motion.div
        className={styles.leftPanel}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className={styles.brand}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <ShieldAlert size={40} className={styles.brandIcon} />
          </motion.div>
          <div>
            <h1 className={styles.brandName}>
              ShopGuard<span className={styles.brandAI}>AI</span>
            </h1>
            <p className={styles.brandTagline}>Real-time Detection System</p>
          </div>
        </motion.div>

        <motion.div
          className={styles.hero}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className={styles.heroTitle}>
            Protect Your Store with{' '}
            <span className={styles.heroAccent}>Intelligent Surveillance</span>
          </h2>
          <p className={styles.heroSub}>
            Advanced AI algorithms analyze CCTV footage in real-time, detecting
            suspicious behavior and alerting you instantly.
          </p>
        </motion.div>

        <motion.div
          className={styles.features}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {[
            { icon: Zap, label: 'Lightning Fast', value: '<2s response' },
            { icon: Shield, label: 'High Accuracy', value: '99.2% detection' },
            { icon: Activity, label: 'Always On', value: '24/7 monitoring' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              className={styles.featureCard}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <feature.icon size={24} className={styles.featureIcon} />
              <div>
                <p className={styles.featureLabel}>{feature.label}</p>
                <p className={styles.featureValue}>{feature.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Right panel */}
      <motion.div
        className={styles.rightPanel}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className={styles.authCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${
                mode === 'login' ? styles.tabActive : ''
              }`}
              onClick={() => {
                setMode('login');
                setError('');
              }}
            >
              Sign In
            </button>
            <button
              className={`${styles.tab} ${
                mode === 'signup' ? styles.tabActive : ''
              }`}
              onClick={() => {
                setMode('signup');
                setError('');
              }}
            >
              Create Account
            </button>
            <motion.div
              className={styles.tabIndicator}
              animate={{
                x: mode === 'signup' ? '100%' : '0%',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  className={styles.field}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label>Full Name</label>
                  <div className={styles.inputWrap}>
                    <User size={18} className={styles.inputIcon} />
                    <input
                      type="text"
                      name="name"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className={styles.field}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label>Email Address</label>
              <div className={styles.inputWrap}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </motion.div>

            <motion.div
              className={styles.field}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label>Password</label>
              <div className={styles.inputWrap}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder={
                    mode === 'signup' ? 'Min. 6 characters' : '••••••••'
                  }
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete={
                    mode === 'signup' ? 'new-password' : 'current-password'
                  }
                />
                <button
                  type="button"
                  className={styles.passToggle}
                  onClick={() => setShowPass((s) => !s)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className={styles.error}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className={styles.spin} />
                  {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : mode === 'login' ? (
                'Access Dashboard'
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>

          <p className={styles.switchText}>
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
              }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
