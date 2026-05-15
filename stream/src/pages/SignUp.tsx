import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './SignUp.css';

export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Overview, 2: Plan Selection
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: 'mobile',
      name: 'Mobile',
      resolution: '480p',
      price: '₱169',
      quality: 'Fair',
      resLabel: '480p',
      devices: 'Mobile phone, tablet',
      simultaneous: '1',
      download: '1',
      gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
    },
    {
      id: 'basic',
      name: 'Basic',
      resolution: '720p',
      price: '₱279',
      quality: 'Good',
      resLabel: '720p (HD)',
      devices: 'TV, computer, mobile phone, tablet',
      simultaneous: '1',
      download: '1',
      gradient: 'linear-gradient(135deg, #2a1b5d 0%, #4a00e0 100%)'
    },
    {
      id: 'standard',
      name: 'Standard',
      resolution: '1080p',
      price: '₱449',
      quality: 'Great',
      resLabel: '1080p (Full HD)',
      devices: 'TV, computer, mobile phone, tablet',
      simultaneous: '2',
      download: '2',
      gradient: 'linear-gradient(135deg, #1e3c72 0%, #8e2de2 100%)'
    },
    {
      id: 'premium',
      name: 'Premium',
      resolution: '4K + HDR',
      price: '₱619',
      quality: 'Best',
      resLabel: '4K (Ultra HD) + HDR',
      devices: 'TV, computer, mobile phone, tablet',
      simultaneous: '4',
      download: '6',
      spatialAudio: 'Included',
      popular: true,
      gradient: 'linear-gradient(135deg, #d80c16 0%, #8e2de2 100%)'
    }
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleCompleteSignUp = async () => {
    setLoading(true);
    // Here you would typically save the selected plan to the user's profile
    // For now, we'll just simulate a delay and redirect to profile creation
    setTimeout(() => {
      setLoading(false);
      navigate('/CreateProfile');
    }, 1500);
  };

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
        ) : (
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
                  {plan.popular && <div className="popular-badge">Most Popular</div>}
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
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Next'}
              </button>
            </div>
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
