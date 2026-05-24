import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Activate.css';

/**
 * TV Activation database schema setup instructions:
 * 
 * CREATE TABLE public.device_codes (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   code TEXT NOT NULL UNIQUE,
 *   status TEXT NOT NULL DEFAULT 'pending', -- pending, approved
 *   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
 *   access_token TEXT,
 *   refresh_token TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
 *   expires_at TIMESTAMP WITH TIME ZONE NOT NULL
 * );
 * 
 * ALTER TABLE public.device_codes ENABLE ROW LEVEL SECURITY;
 * 
 * CREATE POLICY "Allow read access for anyone" ON public.device_codes
 *   FOR SELECT USING (true);
 * 
 * CREATE POLICY "Allow update for authenticated users only" ON public.device_codes
 *   FOR UPDATE TO authenticated USING (status = 'pending') WITH CHECK (status = 'approved');
 */

export default function Activate() {
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [user, setUser] = useState<any>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  // 1. Verify user session on mount
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      } else {
        // Redirect to login page with redirect URL parameter if not authenticated
        navigate(`/login?redirect=${encodeURIComponent('/activate')}`, { replace: true });
      }
    }
    checkUser();
  }, [navigate]);

  // Focus the first input on load
  useEffect(() => {
    if (user && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [user]);

  // Handle individual slot input change
  const handleChange = (index: number, val: string) => {
    // Keep only alphanumeric characters and uppercase them
    const cleanVal = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanVal && val !== '') return;

    const newCode = [...code];
    newCode[index] = cleanVal.slice(-1); // Only take last character if multiple typed
    setCode(newCode);
    setErrorMsg('');

    // Auto-focus next input if value is filled
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle key down actions (backspace, arrow keys)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        // Move focus and clear previous slot if current slot is already empty
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Just clear current slot
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle pasting code (e.g. LSF492 or LSF-492)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);

    if (pastedText) {
      const newCode = [...code];
      for (let i = 0; i < 6; i++) {
        newCode[i] = pastedText[i] || '';
      }
      setCode(newCode);
      setErrorMsg('');

      // Focus appropriate input box
      const targetFocusIndex = Math.min(pastedText.length, 5);
      inputRefs.current[targetFocusIndex]?.focus();
    }
  };

  const handleActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('').toUpperCase();

    if (fullCode.length !== 6) {
      setErrorMsg('Please enter a valid 6-character activation code.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      // 2. Fetch the current session tokens
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Your session expired. Please sign in again.');
      }

      // 3. Find the pending device code row
      const { data: rows, error: fetchError } = await supabase
        .from('device_codes')
        .select('*')
        .eq('code', fullCode)
        .eq('status', 'pending')
        .limit(1);

      if (fetchError || !rows || rows.length === 0) {
        console.error('Fetch Error:', fetchError, 'Rows:', rows);
        throw new Error('Invalid, inactive, or expired code. Please generate a new code on your TV.');
      }
      
      const deviceRow = rows[0];

      // Check if code has expired
      if (new Date(deviceRow.expires_at) < new Date()) {
        throw new Error('This activation code has expired. Please refresh the code on your TV.');
      }

      // Store device details for confirmation screen (if present in schema)
      if (deviceRow.device_name) {
        setDeviceName(deviceRow.device_name);
      } else if (deviceRow.device_type) {
        setDeviceName(deviceRow.device_type);
      }

      // 4. Update the row with user ID and JWT session tokens to approve the TV
      const { error: updateError } = await supabase
        .from('device_codes')
        .update({
          status: 'approved',
          user_id: session.user.id,
          access_token: session.access_token,
          refresh_token: session.refresh_token
        })
        .eq('id', deviceRow.id);

      if (updateError) {
        console.error('Update Error:', updateError);
        throw new Error('Could not authorize device. Please check database permissions or RLS rules.');
      }

      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong during activation.');
    }
  };

  const resetForm = () => {
    setCode(Array(6).fill(''));
    setStatus('idle');
    setErrorMsg('');
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 50);
  };

  if (!user) {
    return (
      <div className="activate-container">
        <header className="activate-header">
          <div className="activate-logo">
            <img src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif" alt="LSFPlus" style={{ height: '40px' }} />
          </div>
        </header>
        <div className="activate-card-wrapper">
          <div className="activate-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
            <div className="activate-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', borderTopColor: '#e50914', marginBottom: '1.5rem' }}></div>
            <p style={{ color: '#9ca3af', fontSize: '1rem' }}>Verifying account session...</p>
          </div>
        </div>
      </div>
    );
  }

  const isCodeComplete = code.every(char => char !== '');

  return (
    <div className="activate-container">
      <header className="activate-header">
        <div className="activate-logo" onClick={() => navigate('/browse')}>
          <img src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif" alt="LSFPlus" style={{ height: '40px' }} />
        </div>
        <button className="activate-back-btn" onClick={() => navigate('/browse')}>
          Back to Browse
        </button>
      </header>

      <div className="activate-card-wrapper">
        <div className="activate-card">
          
          {/* TV / SIGNAL GLOW ICON */}
          <div className="activate-tv-icon-container">
            <div className={`activate-tv-icon-wrapper ${status}`}>
              {status === 'success' ? (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : status === 'error' ? (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              ) : (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                  <polyline points="17 2 12 7 7 2" />
                </svg>
              )}
              {status === 'loading' && <div className="activate-signal-wave"></div>}
            </div>
          </div>

          {status === 'success' ? (
            <div className="activate-success-view">
              <h2 className="activate-success-title">Device Activated!</h2>
              <p className="activate-success-text">
                Your TV screen will refresh and sign in automatically in a few seconds. You can close this page or return to browsing.
              </p>

              <div className="activate-success-details">
                <div className="activate-detail-row">
                  <span className="activate-detail-label">Authorized Account</span>
                  <span className="activate-detail-val">{user.email}</span>
                </div>
                <div className="activate-detail-row">
                  <span className="activate-detail-label">Device Info</span>
                  <span className="activate-detail-val">{deviceName || 'Smart TV Device'}</span>
                </div>
                <div className="activate-detail-row">
                  <span className="activate-detail-label">Status</span>
                  <span className="activate-detail-val" style={{ color: '#10b981' }}>Connected</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="activate-back-btn" onClick={() => navigate('/browse')}>
                  Go to Homepage
                </button>
                <button className="activate-back-btn" onClick={resetForm} style={{ background: 'transparent' }}>
                  Activate another device
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="activate-title">Activate your TV</h2>
              <p className="activate-subtitle">
                Enter the code shown on your TV screen to link it to your account.
                <br />
                <span className="activate-user-pill">
                  Logged in as: <strong>{user.email}</strong>
                </span>
              </p>

              <form onSubmit={handleActivationSubmit} className="activate-form">
                <div className="activate-input-group">
                  <label className="activate-label">Enter 6-digit Code</label>
                  <div className="activate-code-grid">
                    {code.map((char, index) => (
                      <input
                        key={index}
                        id={`code-${index}`}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        maxLength={1}
                        className="activate-code-slot"
                        value={char}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        disabled={status === 'loading'}
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck="false"
                      />
                    ))}
                  </div>
                </div>

                {errorMsg && (
                  <div className="activate-error">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="activate-btn" 
                  disabled={status === 'loading' || !isCodeComplete}
                >
                  {status === 'loading' ? (
                    <>
                      <div className="activate-spinner"></div>
                      <span>Activating device...</span>
                    </>
                  ) : (
                    <>
                      <span>Activate Device</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

        </div>
      </div>

      <footer className="activate-footer">
        <span>© 2026 LSFPlus, Inc. All rights reserved.</span>
        <a href="#help" className="activate-footer-link">Need help?</a>
      </footer>
    </div>
  );
}
