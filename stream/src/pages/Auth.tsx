import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import NotificationModal from '../components/NotificationModal';
import './Auth.css';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Step 1: Email, Step 2: Password (Login), Step 3: OTP (Sign up)
  const [step, setStep] = useState<1 | 2 | 3>(1); 
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpType, setOtpType] = useState<'signup' | 'magiclink'>('signup');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info'
  });

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const navigate = useNavigate();

  // Handle the initial Email submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;

    const normalizedEmail = email.toLowerCase().trim();
    setEmail(normalizedEmail);
    setLoading(true);

    try {
      // Call our NEW, smarter RPC function
      const { data: userStatus, error: rpcError } = await supabase.rpc('check_user_status', { 
        lookup_email: normalizedEmail 
      });

      if (rpcError) throw rpcError;

      if (userStatus === 'complete') {
        // User exists AND finished setup. Send to Password screen.
        setStep(2); 
      } else {
        // Here is the magic: Tell our state which type of token Supabase is sending
        if (userStatus === 'not_found') {
          setOtpType('signup');
        } else if (userStatus === 'incomplete') {
          setOtpType('magiclink');
        }

        // Send an OTP to verify their email
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${window.location.origin}/signup`,
          }
        });
        
        if (otpError) throw otpError;
        
        setResendCooldown(30);
        setStep(3); // Go to OTP / Magic Link screen
      }
    } catch (error: any) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: error.message || 'An error occurred. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Login for existing users
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // If user is missing signup_completed metadata, set it now because they just logged in with a password
      if (data.user && !data.user.user_metadata?.signup_completed) {
        await supabase.auth.updateUser({
          data: { signup_completed: true }
        });
      }

      // Login successful! Redirect to browse
      navigate('/browse');
    } catch (error: any) {
      setModal({
        isOpen: true,
        title: 'Login Failed',
        message: error.message || 'Incorrect password. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    const token = otp.join('');
    if (token.length !== 6 || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: otpType
      });

      if (error) throw error;
      
      // Successfully verified!
      navigate('/browse'); 
      
    } catch (error: any) {
      setModal({ 
        isOpen: true, 
        title: 'Invalid Code', 
        message: 'The code you entered is incorrect or expired.', 
        type: 'error' 
      });
      setOtp(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="auth-container">
      <header className="auth-header">
        <div className="auth-logo" onClick={() => navigate('/browse')}>
          <img src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif" alt="LSFPlus" style={{ height: '45px' }} />
        </div>
      </header>

      <div className="auth-card-wrapper">
        <div className="auth-card">
          
          {/* STEP 1: EMAIL INPUT */}
          {step === 1 && (
            <>
              <h1 className="auth-title">Enter your info to sign in</h1>
              <p className="auth-subtitle">Or get started with a new account.</p>
              
              <form onSubmit={handleEmailSubmit} className="auth-form">
                <input
                  type="email"
                  placeholder="Email or mobile number"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
                <button 
                  type="submit" 
                  className="auth-btn auth-btn--continue"
                  disabled={loading}
                >
                  {loading ? 'Checking...' : 'Continue'}
                </button>
              </form>
              <div className="auth-recaptcha-text">
                This page is protected by Google reCAPTCHA to ensure you're not a bot.
              </div>
            </>
          )}

          {/* STEP 2: PASSWORD LOGIN (Existing Users) */}
          {step === 2 && (
            <>
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">Joining Netflix is easy.</p>

              <div className="auth-email-display" onClick={() => setStep(1)}>
                <span style={{color: '#737373'}}>{email}</span>
                <span className="auth-edit-link" style={{color: '#fff', fontSize: '0.9rem'}}>Edit</span>
              </div>
              
              <form onSubmit={handleLogin} className="auth-form">
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
                <button 
                  type="submit" 
                  className="auth-btn auth-btn--continue"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
              
              <div className="auth-footer">
                <button className="auth-toggle-btn">Forgot password?</button>
              </div>
            </>
          )}

          {/* STEP 3: OTP VERIFICATION / EMAIL LINK (New/Incomplete Users) */}
          {step === 3 && (
            <>
              <h1 className="auth-title">
                {otpType === 'signup' ? 'Finish signing up' : 'Enter the code we sent you'}
              </h1>
              <p className="auth-subtitle">
                {otpType === 'signup' 
                  ? <>We sent a sign-up link to <b>{email}</b>. Check your inbox and click the link to continue.</>
                  : <>We sent a 6-digit code to <b>{email}</b>. It may take a minute to arrive.</>
                }
              </p>

              {otpType !== 'signup' ? (
                <>
                  <div className="auth-otp-container">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        className="auth-otp-input"
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        maxLength={1}
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>

                  <button 
                    className="auth-btn auth-btn--continue"
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.join('').length < 6}
                    style={{marginTop: '24px'}}
                  >
                    {loading ? 'Verifying...' : 'Verify'}
                  </button>
                </>
              ) : (
                <div style={{textAlign: 'center', padding: '40px 0'}}>
                   <div className="auth-help-container" style={{display: 'flex', justifyContent: 'center', marginBottom: '24px'}}>
                     <div className="auth-loading-spinner" style={{margin: '0 auto'}}></div>
                   </div>
                   <p style={{color: '#737373', fontSize: '1rem', lineHeight: '1.6'}}>
                     Waiting for verification...<br/>
                     Please click the link in your email to choose your plan.
                   </p>
                </div>
              )}

              <div className="auth-footer" style={{marginTop: '24px'}}>
                <p className="auth-footer-text">
                  {otpType === 'signup' ? "Didn't get an email?" : "Didn't get a code?"} {resendCooldown > 0 ? (
                    <span style={{color: '#e50914'}}>Resend in {resendCooldown}s</span>
                  ) : (
                    <button type="button" className="auth-toggle-btn" onClick={handleEmailSubmit}>
                      {otpType === 'signup' ? 'Resend email' : 'Resend code'}
                    </button>
                  )}
                </p>
                <button 
                  className="auth-toggle-btn" 
                  onClick={() => setStep(1)}
                  style={{marginTop: '8px', fontSize: '0.9rem'}}
                >
                  Change email
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      <NotificationModal 
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
}
