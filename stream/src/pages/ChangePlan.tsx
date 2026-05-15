import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import SettingsHeader from '../components/SettingsHeader';
import './ChangePlan.css';

export default function ChangePlan() {
  const navigate = useNavigate();

  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      resolution: '4K + HDR',
      headerGradient: 'linear-gradient(135deg, #2a1b5d 0%, #1e3c72 100%)',
      price: 'Free',
      ads: 'No ads',
      quality: 'Best',
      fullResolution: '4K (Ultra HD) + HDR',
      spatialAudio: 'Included',
      devices: '2',
      downloadDevices: '2',
      current: true,
    },
    {
      id: 'all-access',
      name: 'All-Access Plan',
      resolution: '4K + HDR',
      headerGradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
      price: 'Not available',
      ads: 'No ads',
      quality: 'Best',
      fullResolution: '4K (Ultra HD) + HDR',
      exclusive: 'Exclusive Titles and Games',
      devices: '4',
      downloadDevices: '6',
    },
    {
      id: 'vip',
      name: 'VIP Plan',
      resolution: '4K + HDR',
      headerGradient: 'linear-gradient(135deg, #d80c16 0%, #2a1b5d 100%)',
      price: 'Not Available',
      ads: 'No ads',
      quality: 'Amazing',
      fullResolution: '4K (Ultra HD) + HDR',
      exclusive: 'Early access to titles & games + VIP room',
      exclusiveDetails: 'Exclusive early access to titles and games and Exclusive access to the VIP only room',
      devices: 'Unlimited',
      downloadDevices: 'Unlimited',
    },
  ];

  return (
    <div className="change-plan-page">
      <SettingsHeader />
      
      <main className="change-plan-main">
        <div className="change-plan-container">
          <button className="change-plan-back" onClick={() => navigate('/account')}>
            <ArrowLeft size={24} />
          </button>

          <h1 className="change-plan-title">Change Plan</h1>
          <p className="change-plan-subtitle">
            Try out a new plan. You can always switch back if you don't love it.
          </p>

          <div className="plans-grid">
            {plans.map((plan) => (
              <div key={plan.id} className={`plan-card ${plan.current ? 'plan-card--active' : ''}`}>
                {plan.current && (
                  <div className="current-plan-badge">Current Plan</div>
                )}
                
                <div className="plan-header" style={{ background: plan.headerGradient }}>
                  <div className="plan-header-content">
                    <div className="plan-name-row">
                      <h2 className="plan-name">{plan.name}</h2>
                      {plan.current && <Check size={20} className="plan-check" />}
                    </div>
                    <span className="plan-res">{plan.resolution}</span>
                  </div>
                </div>

                <div className="plan-details">
                  <div className="detail-item">
                    <span className="detail-label">Monthly price</span>
                    <span className="detail-value">{plan.price}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ads</span>
                    <span className="detail-value-badge">{plan.ads}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Video and sound quality</span>
                    <span className="detail-value">{plan.quality}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Resolution</span>
                    <span className="detail-value">{plan.fullResolution}</span>
                  </div>
                  {plan.spatialAudio && (
                    <div className="detail-item">
                      <span className="detail-label">Spatial audio (immersive sound)</span>
                      <span className="detail-value">{plan.spatialAudio}</span>
                    </div>
                  )}
                  {plan.exclusive && (
                    <div className="detail-item">
                      <span className="detail-label">{plan.id === 'vip' ? 'Early access & VIP room' : 'Exclusive Titles and Games'}</span>
                      <span className="detail-value">{plan.id === 'vip' ? 'Included' : 'Included'}</span>
                    </div>
                  )}
                  {plan.exclusiveDetails && (
                    <div className="detail-item-hint">
                      {plan.exclusiveDetails}
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Supported devices</span>
                    <span className="detail-value">TV, computer, mobile phone, tablet</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Devices your household can watch at the same time</span>
                    <span className="detail-value">{plan.devices}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Download devices</span>
                    <span className="detail-value">{plan.downloadDevices}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
