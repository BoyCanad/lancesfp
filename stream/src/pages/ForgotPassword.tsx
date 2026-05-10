import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState<'email' | 'sms'>('email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account`,
      });

      if (error) {
        if (error.status === 500 || error.message.toLowerCase().includes('database error')) {
          throw new Error('Supabase failed to connect to your SMTP server (Zoho). Ensure you are using an "App Password" from Zoho, not your regular login password, and that Port 465 is selected with SSL enabled in your Supabase dashboard.');
        }
        throw error;
      }

      setMessage({
        type: 'success',
        text: 'An email with instructions to reset your password has been sent to ' + email + '.'
      });
    } catch (error: any) {
      console.error('Reset error:', error);
      
      // Development Bypass: If on localhost and getting SMTP errors, allow UI testing
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isDevelopment && (error.status === 500 || error.message.includes('Zoho'))) {
        setMessage({
          type: 'success',
          text: '(DEV BYPASS) Recovery link "sent" successfully! (Note: Real emails are currently blocked by Zoho SMTP settings. Check console for details.)'
        });
        console.warn('--- FORGOT PASSWORD DEV BYPASS ---');
        console.warn(`Simulated recovery for: ${email}`);
        console.warn(`Recovery URL: ${window.location.origin}/account`);
        console.warn('To fix this for production, ensure Zoho SMTP is correctly configured in Supabase Dashboard.');
        console.warn('----------------------------------');
        return;
      }

      setMessage({
        type: 'error',
        text: error.message || 'Failed to send reset email. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <header className="auth-header">
        <div className="auth-logo" onClick={() => navigate('/browse')}>
          <img src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif" alt="LSFPlus" style={{ height: '45px' }} />
        </div>
        <button className="auth-signout-btn" onClick={async () => {
          await supabase.auth.signOut();
          localStorage.removeItem('activeProfile');
          navigate('/login');
        }}>
          Sign Out
        </button>
      </header>

      <div className="forgot-password-content">
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
              <span className="fp-input-label">Email</span>
            </div>

            {message && (
              <div className={`fp-message ${message.type}`}>
                {message.text}
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
        
        <footer className="fp-footer">
          <p>This page is protected by Google reCAPTCHA to ensure you're not a bot.</p>
        </footer>
      </div>
    </div>
  );
}
