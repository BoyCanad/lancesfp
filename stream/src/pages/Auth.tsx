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
      // Check if the user exists using our custom RPC function
      const { data: userExists, error: rpcError } = await supabase.rpc('check_email_exists', { 
        lookup_email: normalizedEmail 
      });

      if (rpcError) throw rpcError;

      if (userExists) {
        // EXISTING USER -> Go to Password Login screen
        setStep(2);
      } else {
        // NEW USER -> Send Sign-Up Email
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${window.location.origin}/signup`,
          }
        });
        
        if (otpError) throw otpError;
        
        setResendCooldown(30);
        setStep(3); // Go to OTP Sent screen
      }
    } catch (error: any) {
      setModal({
        isOpen: true,
        title: 'Request Failed',
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

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

          {/* STEP 3: MAGIC LINK SENT (New Users) */}
          {step === 3 && (
            <>
              <h1 className="auth-title">Check your email</h1>
              <p className="auth-subtitle">
                We sent a sign-up link to the email below. Simply tap the link to create your account.
              </p>

              <div className="auth-email-display" onClick={() => setStep(1)}>
                <span>{email}</span>
                <span className="auth-edit-link">Change</span>
              </div>

              <div className="auth-footer" style={{marginTop: '24px'}}>
                <p className="auth-footer-text">
                  Didn't get a link? Check your spam or {resendCooldown > 0 ? (
                    <span style={{color: '#e50914'}}>resend in {resendCooldown}s</span>
                  ) : (
                    <button type="button" className="auth-toggle-btn" onClick={handleEmailSubmit}>
                      resend it
                    </button>
                  )}.
                </p>
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
