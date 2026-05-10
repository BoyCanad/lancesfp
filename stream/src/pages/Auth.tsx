import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import NotificationModal from '../components/NotificationModal';
import './Auth.css';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: Credentials
  const [authMethod, setAuthMethod] = useState<'password' | 'code'>('password');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSignUp, setIsSignUp] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info'
  });
  
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: '',
    requirements: {
      length: false,
      hasUpper: false,
      hasLower: false,
      hasNumber: false,
      hasSpecial: false
    }
  });

  const checkPasswordStrength = (pass: string) => {
    const requirements = {
      length: pass.length >= 8,
      hasUpper: /[A-Z]/.test(pass),
      hasLower: /[a-z]/.test(pass),
      hasNumber: /[0-9]/.test(pass),
      hasSpecial: /[^A-Za-z0-9]/.test(pass)
    };

    const metCount = Object.values(requirements).filter(Boolean).length;
    let score = (metCount / 5) * 100;
    
    let label = '';
    let color = '';

    if (pass.length === 0) {
      score = 0;
      label = '';
      color = '';
    } else if (metCount <= 2) {
      label = 'Weak';
      color = '#e50914'; // Netflix Red
    } else if (metCount <= 4) {
      label = 'Good';
      color = '#e87c03'; // Netflix Orange
    } else {
      label = 'Secure';
      color = '#46d369'; // Green
    }

    setPasswordStrength({ score, label, color, requirements });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (isSignUp) {
      checkPasswordStrength(value);
    }
  };

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

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const normalizedEmail = email.toLowerCase().trim();
    setEmail(normalizedEmail);
    
    // Move straight to password step to avoid 422 errors and abandoned accounts
    setIsSignUp(false);
    setAuthMethod('password');
    setStep(2);
  };

  const handleUseCode = async () => {
    if (resendCooldown > 0) return;
    setAuthMethod('code');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        }
      });
      
      if (error) {
        if (error.status === 422 || error.message.includes('not found')) {
          throw new Error('This account was not found. Please check your email or sign up.');
        } else if (error.status === 500 || error.message.includes('Database error')) {
          throw new Error('Supabase email limit reached (500). Please use your password instead or try again later.');
        }
        throw error;
      }
      
      setResendCooldown(30);
      setModal({
        isOpen: true,
        title: 'Code Sent',
        message: 'A 6-digit sign-in code has been sent to your email.',
        type: 'success'
      });
    } catch (error: any) {
      setModal({
        isOpen: true,
        title: 'Request Failed',
        message: error.message || 'Could not send sign-in code. Please use your password.',
        type: 'error'
      });
      setAuthMethod('password');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.substring(value.length - 1);
    setOtpCode(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otpCode.join('');
    if (token.length < 6) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup' // or 'signin' depending on context, using 'magiclink' usually works for both
      });
      // Note: verifyOtp type depends on what signInWithOtp used. 
      // Magiclink/Email OTP usually needs 'magiclink' or 'email' or 'signup'
      if (error) {
        const { error: error2 } = await supabase.auth.verifyOtp({ email, token, type: 'magiclink' });
        if (error2) throw error2;
      }
      navigate('/');
    } catch (error: any) {
      setModal({
        isOpen: true,
        title: 'Invalid Code',
        message: 'The code you entered is invalid or expired.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMethod === 'code') {
      return handleVerifyOtp(e);
    }
    setLoading(true);

    try {
      // 1. Try normal sign in first
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInErr) {
        if (signInErr.message.includes('Invalid login credentials')) {
          
          // 2. Check for legacy abandoned signups (from older version of app)
          const { error: dummyErr } = await supabase.auth.signInWithPassword({ 
            email, 
            password: 'Check_Only_Password_123!' 
          });
          
          if (!dummyErr) {
            // It's an abandoned signup! Set their real password now.
            const { error: updateErr } = await supabase.auth.updateUser({ password });
            if (updateErr) throw updateErr;
            navigate('/CreateProfile');
            return;
          }

          // 3. Not an abandoned signup, try creating a new account
          const { error: signUpErr } = await supabase.auth.signUp({
            email,
            password
          });

          if (signUpErr) {
            if (signUpErr.status === 422 && signUpErr.message.toLowerCase().includes('registered')) {
              // They are an existing user who just typed the wrong password
              throw new Error('Invalid login credentials');
            }
            // Other signup errors (e.g. weak password)
            throw signUpErr;
          }
          
          // 4. Signup successful
          navigate('/CreateProfile');
          return;
        }

        // Other sign in error
        throw signInErr;
      }
      
      // Sign in successful
      navigate('/');
    } catch (error: any) {
      const message = error.message || 'Authentication error';
      setModal({
        isOpen: true,
        title: 'Authentication Failed',
        message: message === 'Invalid login credentials' 
          ? 'The password you entered is incorrect. Please try again or check if you need to sign up.' 
          : message,
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
          {step === 1 ? (
            <>
              <h1 className="auth-title">Enter your info to sign in</h1>
              <p className="auth-subtitle">Or get started with a new account.</p>
              
              <form onSubmit={handleContinue} className="auth-form">
                <input
                  type="email"
                  placeholder="Email or mobile number"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
                <button type="submit" className="auth-btn auth-btn--continue">
                  Continue
                </button>
              </form>

              <div className="auth-help-container">
                <button className="auth-help-btn">
                  Get Help <span className="chevron-down">⌵</span>
                </button>
              </div>

              <div className="auth-recaptcha-text">
                This page is protected by Google reCAPTCHA to ensure you're not a bot.
              </div>
            </>
          ) : (
            <>
              <h1 className="auth-title">
                {authMethod === 'password' ? 'Enter your password' : 'Enter the code we sent to your email'}
              </h1>
              <p className="auth-subtitle">
                Sign in or enter a new password to create an account.
              </p>

              <div className="auth-email-display" onClick={() => { setStep(1); setAuthMethod('password'); }}>
                {email} <span className="auth-edit-link">Change</span>
              </div>

              {authMethod === 'password' ? (
                <form onSubmit={handleAuth} className="auth-form">
                  <div className="password-input-wrapper">
                    <input
                      type="password"
                      placeholder="Password"
                      className="auth-input"
                      value={password}
                      onChange={handlePasswordChange}
                      autoFocus
                      required
                    />
                    {password.length > 0 && (
                      <div className="password-strength-container">
                        <div className="strength-bar-bg">
                          <div 
                            className="strength-bar-fill" 
                            style={{ 
                              width: `${passwordStrength.score}%`, 
                              backgroundColor: passwordStrength.color 
                            }}
                          ></div>
                        </div>
                        <div className="strength-label" style={{ color: passwordStrength.color }}>
                          {passwordStrength.label}
                        </div>
                      </div>
                    )}
                  </div>
                  <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? 'Processing...' : 'Continue'}
                  </button>

                  <>
                      <div className="auth-divider">
                        <span>or</span>
                      </div>
                      <button 
                        type="button" 
                        className="auth-btn auth-btn--secondary" 
                        onClick={handleUseCode}
                        disabled={loading || resendCooldown > 0}
                      >
                        {resendCooldown > 0 ? `Try again in ${resendCooldown}s` : 'Use Sign-in Code'}
                      </button>
                    </>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="auth-form">
                  <div className="auth-otp-container">
                    {otpCode.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        className="auth-otp-input"
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        maxLength={1}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                  <p className="auth-otp-timer">This code will expire in 15 minutes.</p>
                  <p className="auth-otp-resend">
                    Didn't get a code? {resendCooldown > 0 ? (
                      <span className="auth-resend-wait">Resend in {resendCooldown}s</span>
                    ) : (
                      <button type="button" className="auth-resend-link" onClick={handleUseCode}>Resend code.</button>
                    )}
                  </p>
                  <button type="submit" className="auth-btn" disabled={loading || otpCode.join('').length < 6}>
                    {loading ? 'Verifying...' : 'Sign In'}
                  </button>
                </form>
              )}

              <div className="auth-help-container">
                <button className="auth-help-btn">
                  Get Help <span className="chevron-down">⌵</span>
                </button>
              </div>

              <div className="auth-recaptcha-text">
                This page is protected by Google reCAPTCHA to ensure you're not a bot.
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

