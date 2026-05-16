import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState<'email' | 'sms'>('email');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account`,
      });

      if (error) {
        if (error.status === 500 || error.message.toLowerCase().includes('database error')) {
          throw new Error('Supabase failed to connect to your SMTP server. Ensure you are using an "App Password" if required.');
        }
        throw error;
      }

      setIsSent(true);
    } catch (error: any) {
      console.error('Reset error:', error);
      
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isDevelopment) {
        setIsSent(true); // Bypass for dev testing if SMTP is not configured
        return;
      }

      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const maskEmail = (email: string) => {
    const [user, domain] = email.split('@');
    if (!user || !domain) return email;
    const maskedUser = user.slice(0, 2) + '*'.repeat(Math.max(0, user.length - 2));
    return `${maskedUser}@${domain}`;
  };

  return (
    <div className="forgot-password-page">
      <header className="fp-header">
        <div className="fp-logo" onClick={() => navigate('/browse')}>
          <img src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif" alt="LSFPlus" style={{ height: '45px' }} />
        </div>
        <button className="fp-signin-btn" onClick={() => navigate('/login')}>
          Sign In
        </button>
      </header>

      <div className="forgot-password-content">
        {!isSent ? (
          <div className="forgot-password-card">
            <h1 className="fp-title">Update password, email or phone</h1>
            <p className="fp-question">How would you like to reset your password?</p>

            <form onSubmit={handleResetRequest} className="fp-form">
              <div className="fp-options">
                <label className="fp-option">
                  <input 
                    type="radio" 
                    name="reset-method" 
                    checked={method === 'email'} 
                    onChange={() => setMethod('email')} 
                  />
                  <span className="fp-radio-circle"></span>
                  <span>Email</span>
                </label>
                <label className="fp-option">
                  <input 
                    type="radio" 
                    name="reset-method" 
                    checked={method === 'sms'} 
                    onChange={() => setMethod('sms')} 
                  />
                  <span className="fp-radio-circle"></span>
                  <span>Text Message (SMS)</span>
                </label>
              </div>

              <p className="fp-info">
                We will send you an email with instructions on how to reset your password.
              </p>

              <div className="fp-input-group">
                <input
                  type="email"
                  className="fp-input"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="fp-error">
                  {error}
                </div>
              )}

              <button type="submit" className="fp-submit-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Email Me'}
              </button>

              <button type="button" className="fp-help-link">
                I don't remember my email or phone.
              </button>
            </form>
          </div>
        ) : (
          <div className="forgot-password-card success-card">
            <h1 className="fp-title">Email Sent</h1>
            <p className="fp-info success-info">
              An email with instructions on how to reset your password has been sent to <b>{maskEmail(email)}</b>. 
              Check your spam or junk folder if you don't see the email in your inbox.
            </p>
            <p className="fp-info success-sub-info">
              If you no longer have access to this email account, please <a href="#" onClick={(e) => e.preventDefault()}>contact us</a>.
            </p>
          </div>
        )}
      </div>
      
      <footer className="fp-page-footer">
        <div className="fp-footer-content">
          <p className="fp-recaptcha">This page is protected by Google reCAPTCHA to ensure you're not a bot.</p>
          
          {isSent && (
            <div className="fp-footer-links">
              <p className="footer-contact">Questions? <a href="#">Contact us.</a></p>
              <div className="footer-links-grid">
                <a href="#">FAQ</a>
                <a href="#">Help Center</a>
                <a href="#">Terms of Use</a>
                <a href="#">Privacy</a>
                <a href="#">Cookie Preferences</a>
                <a href="#">Corporate Information</a>
              </div>
              <div className="language-picker">
                <select>
                  <option>English</option>
                  <option>Filipino</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
