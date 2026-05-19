import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { supabase } from '../supabaseClient';
import SettingsHeader from '../components/SettingsHeader';
import './ChangePlan.css';

export default function ChangePlan() {
  const navigate = useNavigate();
  const [currentPlanId, setCurrentPlanId] = useState<string>('free');
  const [saving, setSaving] = useState(false);
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.plan) {
        setCurrentPlanId(user.user_metadata.plan);
      }
    });
  }, []);

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlanId || saving) return;
    // Only free plan is actually available; others are locked
    if (planId !== 'free') return;

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { plan: planId },
      });
      if (error) throw error;
      setCurrentPlanId(planId);
      setSavedPlanId(planId);
      setTimeout(() => setSavedPlanId(null), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to update plan.');
    } finally {
      setSaving(false);
    }
  };

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

          {savedPlanId && (
            <div style={{
              background: '#e6f9ee',
              color: '#1a7a3c',
              border: '1px solid #a3d9b5',
              borderRadius: '8px',
              padding: '10px 16px',
              marginBottom: '20px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Check size={16} />
              Plan updated to <strong>{plans.find(p => p.id === savedPlanId)?.name}</strong>
            </div>
          )}

          <div className="plans-grid">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const isAvailable = plan.id === 'free';
              return (
                <div
                  key={plan.id}
                  className={`plan-card ${isCurrent ? 'plan-card--active' : ''} ${!isAvailable && !isCurrent ? 'plan-card--locked' : ''}`}
                  style={{ cursor: isCurrent || !isAvailable ? 'default' : 'pointer' }}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {isCurrent && (
                    <div className="current-plan-badge">Current Plan</div>
                  )}
                  {!isAvailable && !isCurrent && (
                    <div className="current-plan-badge" style={{ background: '#999' }}>Not Available</div>
                  )}
                  
                  <div className="plan-header" style={{ background: plan.headerGradient }}>
                    <div className="plan-header-content">
                      <div className="plan-name-row">
                        <h2 className="plan-name">{plan.name}</h2>
                        {isCurrent && <Check size={20} className="plan-check" />}
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
                    {(plan as any).spatialAudio && (
                      <div className="detail-item">
                        <span className="detail-label">Spatial audio (immersive sound)</span>
                        <span className="detail-value">{(plan as any).spatialAudio}</span>
                      </div>
                    )}
                    {(plan as any).exclusive && (
                      <div className="detail-item">
                        <span className="detail-label">{plan.id === 'vip' ? 'Early access & VIP room' : 'Exclusive Titles and Games'}</span>
                        <span className="detail-value">Included</span>
                      </div>
                    )}
                    {(plan as any).exclusiveDetails && (
                      <div className="detail-item-hint">
                        {(plan as any).exclusiveDetails}
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
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
