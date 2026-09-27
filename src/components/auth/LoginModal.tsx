import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { resolveLoginModal } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export default function LoginModal() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener('kibabii-require-login', handler);
    return () => window.removeEventListener('kibabii-require-login', handler);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const userProfile = await login(email, password);
      setVisible(false);
      setEmail('');
      setPassword('');
      setLoading(false);
      
      // Resolve the pending promise so the original action continues
      resolveLoginModal(userProfile ? { id: userProfile.id, email: userProfile.email } as any : null);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your network and credentials.');
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    // Full-screen overlay
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#0f172a', 
        borderRadius: 24, 
        padding: 32,
        width: '90%', 
        maxWidth: 380, 
        color: 'white',
        border: '1px solid #1e293b',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <h2 style={{ color: '#ef4444', marginBottom: 8, fontSize: '1.5rem', fontWeight: 800 }}>
          Session Expired
        </h2>
        <p style={{ color: '#94a3b8', marginBottom: 24, fontSize: 14 }}>
          Please log in again to continue with your action.
        </p>

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 12,
            background: '#020617', border: '1px solid #334155',
            color: 'white', marginBottom: 12, fontSize: 15,
            boxSizing: 'border-box',
          }}
        />
        <div style={{ position: 'relative', width: '100%', marginBottom: 16 }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '12px 44px 12px 16px', borderRadius: 12,
              background: '#020617', border: '1px solid #334155',
              color: 'white', fontSize: 15,
              boxSizing: 'border-box',
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4,
            }}
            title={showPassword ? 'Hide password' : 'Show password'}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '14px',
            background: loading ? '#475569' : '#ef4444',
            color: 'white', border: 'none', borderRadius: 12,
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </div>
    </div>
  );
}
