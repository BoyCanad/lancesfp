import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.session) {
          navigate('/CreateProfile');
        } else {
          alert('Account created! Please check your email to verify your account before logging in.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <header className="auth-header">
        <div className="auth-logo" onClick={() => navigate('/browse')}>
          LSFPlus
        </div>
      </header>

      <div className="auth-card-wrapper">
        <div className="auth-card">
          <h1 className="auth-title">{isSignUp ? 'Sign Up' : 'Sign In'}</h1>
          
          {errorMsg && <div className="auth-error">{errorMsg}</div>}

          <form onSubmit={handleAuth} className="auth-form">
            <input
              type="email"
              placeholder="Email address"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? (isSignUp ? 'Signing up...' : 'Signing in...') : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="auth-footer">
            <span className="auth-footer-text">
              {isSignUp ? 'Already have an account?' : 'New to LSFPlus?'}
            </span>
            <button 
              className="auth-toggle-btn" 
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Sign in now.' : 'Sign up now.'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
