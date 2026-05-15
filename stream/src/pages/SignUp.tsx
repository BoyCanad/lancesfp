import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './SignUp.css';

export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Overview, 2: Plan Selection, 3: Password Creation
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      resolution: '4K + HDR',
      price: 'Free',
      ads: 'No ads',
      quality: 'Best',
      resLabel: '4K (Ultra HD) + HDR',
      devices: 'TV, computer, mobile phone, tablet',
      simultaneous: '2',
      download: '2',
      spatialAudio: 'Included',
      gradient: 'linear-gradient(135deg, #2a1b5d 0%, #1e3c72 100%)'
    },
    {
      id: 'all-access',
      name: 'All-Access Plan',
      resolution: '4K + HDR',
      price: 'Not available',
      ads: 'No ads',
      quality: 'Best',
      resLabel: '4K (Ultra HD) + HDR',
      devices: 'TV, computer, mobile phone, tablet',
      simultaneous: '4',
      download: '6',
      exclusive: 'Exclusive Titles and Games',
      gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)'
    },
    {
      id: 'vip',
      name: 'VIP Plan',
      resolution: '4K + HDR',
      price: 'Not Available',
      ads: 'No ads',
      quality: 'Amazing',
      resLabel: '4K (Ultra HD) + HDR',
      devices: 'TV, computer, mobile phone, tablet',
      simultaneous: 'Unlimited',
      download: 'Unlimited',
      exclusive: 'Early access to titles & games + VIP room',
      gradient: 'linear-gradient(135deg, #d80c16 0%, #2a1b5d 100%)'
    }
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleCompleteSignUp = async () => {
    if (selectedPlan !== 'free') return;
    setStep(3); // Move to password creation
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      // Password set! Now go to profile creation
      navigate('/CreateProfile');
    } catch (error: any) {
      alert(error.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isPlanAvailable = selectedPlan === 'free';

  return (
    <div className="signup-page">
      <header className="signup-header">
        <div className="signup-logo" onClick={() => navigate('/')}>
          <img src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif" alt="LSFPlus" style={{ height: '45px' }} />
        </div>
        <button className="signup-signout" onClick={handleSignOut}>Sign Out</button>
      </header>

      <main className="signup-main">
        {step === 1 ? (
          <div className="signup-step-container signup-overview">
            <div className="signup-icon-wrapper">
              <CheckCircle2 size={50} color="#e50914" strokeWidth={1} />
            </div>
            <span className="step-indicator">STEP <b>2</b> OF <b>3</b></span>
            <h1 className="signup-title">Choose your plan</h1>
            
            <ul className="signup-benefits">
              <li><Check size={24} color="#e50914" /> No commitments, cancel anytime.</li>
              <li><Check size={24} color="#e50914" /> Everything on LSFPlus for one low price.</li>
              <li><Check size={24} color="#e50914" /> No ads and no extra fees. Ever.</li>
            </ul>

            <button className="signup-btn" onClick={() => setStep(2)}>Next</button>
          </div>
        ) : step === 2 ? (
          <div className="signup-step-container signup-selection">
            <span className="step-indicator">STEP <b>2</b> OF <b>3</b></span>
            <h1 className="signup-title">Choose the plan that's right for you</h1>
            
            <div className="plans-selection-grid">
              {plans.map((plan) => (
                <div 
                  key={plan.id} 
                  className={`signup-plan-card ${selectedPlan === plan.id ? 'active' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="plan-card-header" style={{ background: plan.gradient }}>
                    <div className="plan-name-check">
                      <h2 className="plan-card-name">{plan.name}</h2>
                      {selectedPlan === plan.id && <div className="card-selected-check"><Check size={16} color="#fff" /></div>}
                    </div>
                    <span className="plan-card-res">{plan.resolution}</span>
                  </div>
                  
                  <div className="plan-card-details">
                    <div className="card-detail-item">
                      <span className="detail-label">Monthly price</span>
                      <span className="detail-value">{plan.price}</span>
                    </div>
                    <div className="card-detail-item">
                      <span className="detail-label">Video and sound quality</span>
                      <span className="detail-value">{plan.quality}</span>
                    </div>
                    <div className="card-detail-item">
                      <span className="detail-label">Resolution</span>
                      <span className="detail-value">{plan.resLabel}</span>
                    </div>
                    {plan.spatialAudio && (
                      <div className="card-detail-item">
                        <span className="detail-label">Spatial audio (immersive sound)</span>
                        <span className="detail-value">{plan.spatialAudio}</span>
                      </div>
                    )}
                    {plan.exclusive && (
                      <div className="card-detail-item">
                        <span className="detail-label">Exclusive</span>
                        <span className="detail-value">{plan.exclusive}</span>
                      </div>
                    )}
                    <div className="card-detail-item">
                      <span className="detail-label">Supported devices</span>
                      <span className="detail-value">{plan.devices}</span>
                    </div>
                    <div className="card-detail-item">
                      <span className="detail-label">Devices your household can watch at the same time</span>
                      <span className="detail-value">{plan.simultaneous}</span>
                    </div>
                    <div className="card-detail-item">
                      <span className="detail-label">Download devices</span>
                      <span className="detail-value">{plan.download}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="signup-disclaimer">
              HD (720p), Full HD (1080p), Ultra HD (4K) and HDR availability subject to your internet service and device capabilities. Not all content is available in all resolutions. See our <a href="#">Terms of Use</a> for more details.
            </p>

            <div className="signup-footer-btn-wrapper">
              <button 
                className="signup-btn" 
                onClick={handleCompleteSignUp}
                disabled={loading || !isPlanAvailable}
              >
                {loading ? 'Processing...' : (isPlanAvailable ? 'Next' : 'Not Available')}
              </button>
            </div>
          </div>
        ) : (
          <div className="signup-step-container signup-password">
            <span className="step-indicator">STEP <b>3</b> OF <b>3</b></span>
            <h1 className="signup-title">Create a password to start your membership</h1>
            <p className="signup-subtitle" style={{ color: '#333', marginBottom: '16px' }}>
              Just a few more steps and you're done! We hate paperwork, too.
            </p>
            
            <form onSubmit={handlePasswordSubmit} className="signup-password-form">
              <input
                type="password"
                placeholder="Add a password"
                className="signup-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
                minLength={6}
              />
              <div className="signup-footer-btn-wrapper" style={{ marginTop: '24px' }}>
                <button 
                  type="submit" 
                  className="signup-btn" 
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Next'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <footer className="signup-footer">
        <div className="signup-footer-container">
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
      </footer>
    </div>
  );
}
