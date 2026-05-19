import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Home, 
  CreditCard, 
  ShieldCheck, 
  Smartphone, 
  Smile, 
  ChevronRight, 
  Layers, 
  Mail,
  Lock,
  Check,
  MonitorSmartphone,
  ShieldAlert,
  Settings,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getProfiles, type Profile } from '../services/profileService';
import SettingsHeader from '../components/SettingsHeader';
import './Account.css';

export default function Account() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'membership' | 'security' | 'devices' | 'profiles'>('overview');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [signOutAll, setSignOutAll] = useState(true);

  const [memberSince, setMemberSince] = useState<string>('April 2020');
  const [planId, setPlanId] = useState<string>('free');

  const PLAN_NAMES: Record<string, string> = {
    'free': 'Free Plan',
    'all-access': 'All-Access Plan',
    'vip': 'VIP Plan',
  };
  const PLAN_DESCRIPTIONS: Record<string, string> = {
    'free': '4K video resolution with spatial audio, ad-free watching and more.',
    'all-access': '4K video resolution, exclusive titles & games, ad-free watching on up to 4 devices.',
    'vip': 'Amazing quality 4K HDR, early access to titles & games, VIP room access, and unlimited devices.',
  };
  const planName = PLAN_NAMES[planId] ?? 'Free Plan';
  const planDesc = PLAN_DESCRIPTIONS[planId] ?? '4K video resolution with spatial audio, ad-free watching and more.';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
        setIsVerified(user.user_metadata?.signup_completed === true);
        if (user.user_metadata?.plan) {
          setPlanId(user.user_metadata.plan);
        }
        if (user.created_at) {
          const date = new Date(user.created_at);
          const month = date.toLocaleString('default', { month: 'long' });
          const year = date.getFullYear();
          setMemberSince(`${month} ${year}`);
        }
      }
    });

    const stored = localStorage.getItem('activeProfile');
    if (stored) {
      setActiveProfile(JSON.parse(stored));
    }

    getProfiles().then(setProfiles).catch(console.error);

    // Check if we arrived here via a password recovery link
    if (location.state?.recover) {
      setActiveTab('security');
      setIsChangingPassword(true);
    }
  }, [location.state]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      // 1. Get current user email for verification
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User email not found.');

      // 2. Verify current password ONLY if NOT in recovery mode
      if (!location.state?.recover) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword
        });

        if (signInError) {
          throw new Error('Current password is incorrect.');
        }
      }

      // 3. Current password is correct, proceed with update
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      if (signOutAll) {
        setPasswordStatus({ type: 'success', message: 'Password updated. Signing out all devices...' });
        setTimeout(async () => {
          await supabase.auth.signOut({ scope: 'global' });
          localStorage.removeItem('activeProfile');
          navigate('/login');
        }, 2000);
        return;
      }

      // Auto-close after success
      setTimeout(() => setIsChangingPassword(false), 2000);
    } catch (error: any) {
      setPasswordStatus({ type: 'error', message: error.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const MobileAccountView = () => {
    return (
      <div className={`mobile-account ${isChangingPassword ? 'password-active' : ''}`}>
        {!isChangingPassword ? (
          <>
            {/* White Background Header */}
            <header className="mobile-account-header">
              <div className="mobile-account-logo" onClick={() => navigate('/browse')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <img 
                  src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif" 
                  alt="LSFPlus" 
                  style={{ height: '32px', display: 'block' }} 
                />
              </div>
              <div className="mobile-account-profile-dropdown" onClick={() => navigate('/browse')}>
                <img 
                  src={activeProfile?.image || 'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/avatar-1.png'} 
                  alt="Profile" 
                />
                <span className="mobile-dropdown-arrow">▼</span>
              </div>
            </header>

            {/* Horizontal Navigation Tabs */}
            <div className="mobile-tabs-container">
              <div className="mobile-tabs-scroll">
                <button 
                  className={`mobile-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button 
                  className={`mobile-tab-btn ${activeTab === 'membership' ? 'active' : ''}`}
                  onClick={() => setActiveTab('membership')}
                >
                  Membership
                </button>
                <button 
                  className={`mobile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                  onClick={() => setActiveTab('security')}
                >
                  Security
                </button>
                <button 
                  className={`mobile-tab-btn ${activeTab === 'devices' ? 'active' : ''}`}
                  onClick={() => setActiveTab('devices')}
                >
                  Devices
                </button>
                <button 
                  className={`mobile-tab-btn ${activeTab === 'profiles' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profiles')}
                >
                  Profiles
                </button>
              </div>
              <div className="mobile-tabs-fade-right">
                <ChevronRight size={18} color="#666" />
              </div>
            </div>

            {/* Mobile Content Area */}
            <div className="mobile-account-content">
              
              {activeTab === 'overview' && (
                <>
                  <div className="mobile-account-headings">
                    <h1 className="mobile-account-title-large">Account</h1>
                    <p className="mobile-account-subtitle-medium">Membership details</p>
                  </div>

                  {/* Card 1: Membership details */}
                  <div className="mobile-replicated-card">
                    <div className="mobile-premium-badge">
                      Member since {memberSince}
                    </div>
                    
                    <div className="mobile-card-body-padding">
                      <h2 className="mobile-card-plan-title">{planName}</h2>
                      <p className="mobile-card-next-payment">Next payment: 11 June 2026</p>
                      
                      <div className="mobile-card-payment-row">
                        {/* Paytm logo Vector SVG */}
                        <svg width="45" height="15" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.8 9.5H8.3v21h5v-6.9h5.5c4.7 0 8-2.6 8-7.1 0-4.4-3.3-7-8-7zm-.6 9.4h-4.9V14h4.9c2 0 3.3 1 3.3 2.4s-1.3 2.5-3.3 2.5zm22.4-9.4c-4.4 0-7.8 2.6-7.8 7.1v13.9h5v-5.6c1.1 1 2.8 1.6 4.7 1.6 4.7 0 8.1-2.9 8.1-8.5V9.5h-5v8c0 2.5-1.4 3.7-3.4 3.7-1.9 0-3.1-1.1-3.1-3.3v-8.4h5v-9.5zm23.6 0H54v14c0 3.2 2 5 5 5 2.1 0 3.7-1 4.5-2.2v2h4.8V9.5h-4.8v8.3c0 2-1 3-2.5 3-1.6 0-2.3-1-2.3-2.6V9.5h5zm20.8 4.7V9.5h-4.8v9.4c0 2-1 3-2.5 3-1.6 0-2.3-1-2.3-2.6V9.5h-4.8v14c0 3.2 2 5 5 5 2.1 0 3.7-1 4.5-2.2v2h4.8v-14zm19.6-4.7h-5.2v21h4.8V9.5z" fill="#00baf2" />
                          <path d="M109.8 9.5H99.3v21h5v-6.9h5.5c4.7 0 8-2.6 8-7.1 0-4.4-3.3-7-8-7zm-.6 9.4H104.3V14h4.9c2 0 3.3 1 3.3 2.4s-1.3 2.5-3.3 2.5z" fill="#002970" />
                        </svg>
                        <span className="mobile-card-masked-dots">•••• •••• •••• 5555</span>
                      </div>
                    </div>

                    <div className="mobile-card-divider"></div>

                    <button className="mobile-card-row-btn" onClick={() => setActiveTab('membership')}>
                      <span>Manage membership</span>
                      <ChevronRight size={20} color="#000" />
                    </button>
                  </div>

                  <p className="mobile-card-section-header">Quick links</p>

                  {/* Card 2: Quick Links */}
                  <div className="mobile-quick-links-card">
                    <button className="mobile-link-row-item" onClick={() => navigate('/change-plan')}>
                      <div className="mobile-link-row-left">
                        <Layers size={22} />
                        <span>Change plan</span>
                      </div>
                      <ChevronRight size={20} color="#000" />
                    </button>
                    
                    <button className="mobile-link-row-item" onClick={() => setActiveTab('membership')}>
                      <div className="mobile-link-row-left">
                        <CreditCard size={22} />
                        <span>Manage payment method</span>
                      </div>
                      <ChevronRight size={20} color="#000" />
                    </button>

                    <button className="mobile-link-row-item" onClick={() => setActiveTab('devices')}>
                      <div className="mobile-link-row-left">
                        <MonitorSmartphone size={22} />
                        <span>Manage access and devices</span>
                      </div>
                      <ChevronRight size={20} color="#000" />
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'membership' && (
                <>
                  <div className="mobile-account-headings">
                    <h1 className="mobile-account-title-large">Membership</h1>
                    <p className="mobile-account-subtitle-medium">Plan & Payment details</p>
                  </div>

                  <div className="mobile-replicated-card">
                    <div className="mobile-card-body-padding">
                      <h2 className="mobile-card-plan-title">{planName}</h2>
                      <p className="mobile-card-next-payment" style={{ marginBottom: 0 }}>
                        {planDesc}
                      </p>
                    </div>
                    <div className="mobile-card-divider"></div>
                    <button className="mobile-card-row-btn" onClick={() => navigate('/change-plan')}>
                      <span>Change plan</span>
                      <ChevronRight size={20} color="#000" />
                    </button>
                  </div>

                  <p className="mobile-card-section-header">Payment Method</p>
                  <div className="mobile-replicated-card">
                    <div className="mobile-card-body-padding">
                      <h2 className="mobile-card-plan-title">Next payment</h2>
                      <p className="mobile-card-next-payment">11 June 2026</p>
                      
                      <div className="mobile-card-payment-row">
                        <div className="mastercard-icon" style={{ transform: 'scale(1.2)', transformOrigin: 'left center' }}>
                          <div className="mc-circle red"></div>
                          <div className="mc-circle orange"></div>
                        </div>
                        <span className="mobile-card-masked-dots" style={{ marginLeft: '12px' }}>•••• •••• •••• 5555</span>
                      </div>
                    </div>
                    <div className="mobile-card-divider"></div>
                    <button className="mobile-card-row-btn">
                      <span>Redeem gift card or promo code</span>
                      <ChevronRight size={20} color="#000" />
                    </button>
                    <div className="mobile-card-divider"></div>
                    <button className="mobile-card-row-btn">
                      <span>View billing history</span>
                      <ChevronRight size={20} color="#000" />
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'security' && (
                <>
                  <div className="mobile-account-headings">
                    <h1 className="mobile-account-title-large">Security</h1>
                    <p className="mobile-account-subtitle-medium">Protect your account</p>
                  </div>

                  <div className="mobile-quick-links-card">
                    <button className="mobile-link-row-item" onClick={() => setIsChangingPassword(true)}>
                      <div className="mobile-link-row-left">
                        <Lock size={22} />
                        <span>Update password</span>
                      </div>
                      <ChevronRight size={20} color="#000" />
                    </button>

                    <button className="mobile-link-row-item">
                      <div className="mobile-link-row-left">
                        <Mail size={22} />
                        <div className="mobile-link-text-stack">
                          <span>Email</span>
                          <p>{userEmail || 'zedsmash154@gmail.com'}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} color="#000" />
                    </button>
                  </div>

                  <p className="mobile-card-section-header">Parental Controls & Privacy</p>
                  <div className="mobile-quick-links-card">
                    <button className="mobile-link-row-item">
                      <div className="mobile-link-row-left">
                        <ShieldAlert size={22} />
                        <span>Adjust parental controls</span>
                      </div>
                      <ChevronRight size={20} color="#000" />
                    </button>

                    <button className="mobile-link-row-item">
                      <div className="mobile-link-row-left">
                        <ShieldCheck size={22} />
                        <span>Privacy and data settings</span>
                      </div>
                      <ChevronRight size={20} color="#000" />
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'devices' && (
                <>
                  <div className="mobile-account-headings">
                    <h1 className="mobile-account-title-large">Devices</h1>
                    <p className="mobile-account-subtitle-medium">Manage signed-in devices</p>
                  </div>

                  <div className="mobile-replicated-card">
                    <div className="mobile-card-body-padding">
                      <h2 className="mobile-card-plan-title">Access and devices</h2>
                      <p className="mobile-card-next-payment" style={{ marginBottom: 0 }}>
                        Review devices that have recently streamed on this account and sign out of individual sessions.
                      </p>
                    </div>
                    <div className="mobile-card-divider"></div>
                    <button className="mobile-card-row-btn">
                      <span>Manage active devices</span>
                      <ChevronRight size={20} color="#000" />
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'profiles' && (
                <>
                  <div className="mobile-account-headings">
                    <h1 className="mobile-account-title-large">Profiles</h1>
                    <p className="mobile-account-subtitle-medium">Manage profiles and restrictions</p>
                  </div>

                  <div className="mobile-quick-links-card" style={{ marginBottom: '20px' }}>
                    {profiles.map((p) => (
                      <button key={p.id} className="mobile-link-row-item" onClick={() => navigate(`/ManageProfile/${p.id}`)}>
                        <div className="mobile-link-row-left">
                          <img 
                            src={p.image} 
                            alt={p.name} 
                            style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} 
                          />
                          <div className="mobile-link-text-stack">
                            <span>{p.name}</span>
                            <p>All Maturity Ratings</p>
                          </div>
                        </div>
                        <ChevronRight size={20} color="#000" />
                      </button>
                    ))}
                  </div>

                  {profiles.length < 5 && (
                    <button 
                      className="mobile-action-btn" 
                      onClick={() => navigate('/CreateProfile')}
                      style={{ margin: '0 16px 30px 16px', width: 'calc(100% - 32px)', backgroundColor: '#fff', border: '1px solid #ccc' }}
                    >
                      + Add Profile
                    </button>
                  )}
                </>
              )}

              {/* Action Buttons at the Bottom */}
              <div className="mobile-account-actions" style={{ padding: '10px 16px 100px 16px' }}>
                <button className="mobile-action-btn" style={{ borderColor: '#e50914', color: '#e50914' }}>
                  Cancel Membership
                </button>
                <button className="mobile-action-btn" style={{ borderColor: '#999', color: '#333' }}>
                  Delete Account
                </button>
              </div>

            </div>
          </>
        ) : (
          <div className="mobile-password-view">
            <header className="mobile-password-header">
              <button onClick={() => setIsChangingPassword(false)}>
                <ArrowLeft size={24} />
              </button>
              <h1>Change password</h1>
            </header>
            <div className="mobile-password-content">
              <form className="password-form" onSubmit={handlePasswordUpdate}>
                {!location.state?.recover && (
                  <div className="password-input-group">
                    <input 
                      type="password" 
                      placeholder="Current Password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <button type="button" className="forgot-link" onClick={() => navigate('/forgot-password')}>Forgot Password?</button>
                  </div>
                )}

                <div className="password-input-group">
                  <input 
                    type="password" 
                    placeholder="New password (6-60 characters)" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="password-input-group">
                  <input 
                    type="password" 
                    placeholder="Re-enter new password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {passwordStatus && (
                  <div className={`password-status-msg ${passwordStatus.type}`}>
                    {passwordStatus.message}
                  </div>
                )}

                <label className="password-checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={signOutAll} 
                    onChange={(e) => setSignOutAll(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label">Sign out all devices</span>
                </label>

                <div className="password-actions">
                  <button type="submit" className="password-save-btn" disabled={passwordLoading}>
                    {passwordLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" className="password-cancel-btn" onClick={() => setIsChangingPassword(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="account-page">
      <MobileAccountView />
      
      <div className="desktop-account-layout">
        <SettingsHeader />

      <div className={`account-layout ${isChangingPassword ? 'changing-password' : ''}`}>
        {/* Sidebar */}
        {!isChangingPassword && (
          <aside className="account-sidebar">
            <button className="account-back-btn" onClick={() => navigate('/browse')}>
              <ArrowLeft size={18} />
              <span>Back to LSFPlus</span>
            </button>

            <div className="account-menu">
              <button 
                className={`account-menu-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <Home size={20} />
                <span>Overview</span>
              </button>
              <button 
                className={`account-menu-item ${activeTab === 'membership' ? 'active' : ''}`}
                onClick={() => setActiveTab('membership')}
              >
                <CreditCard size={20} />
                <span>Membership</span>
              </button>
              <button 
                className={`account-menu-item ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <ShieldCheck size={20} />
                <span>Security</span>
              </button>
              <button 
                className={`account-menu-item ${activeTab === 'devices' ? 'active' : ''}`}
                onClick={() => setActiveTab('devices')}
              >
                <Smartphone size={20} />
                <span>Devices</span>
              </button>
              <button 
                className={`account-menu-item ${activeTab === 'profiles' ? 'active' : ''}`}
                onClick={() => setActiveTab('profiles')}
              >
                <Smile size={20} />
                <span>Profiles</span>
              </button>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className={`account-main ${isChangingPassword ? 'password-view' : ''}`}>
          {isChangingPassword ? (
            <div className="change-password-container">
              <div className="password-header">
                <button className="password-back-icon" onClick={() => setIsChangingPassword(false)}>
                  <ArrowLeft size={24} />
                </button>
                <div className="password-content">
                  <h1 className="password-title">Change password</h1>
                  <p className="password-desc">Protect your account with a unique password at least 6 characters long.</p>
                </div>
              </div>

              <form className="password-form" onSubmit={handlePasswordUpdate}>
                {!location.state?.recover && (
                  <div className="password-input-group">
                    <input 
                      type="password" 
                      placeholder="Current Password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <button type="button" className="forgot-link" onClick={() => navigate('/forgot-password')}>Forgot Password?</button>
                  </div>
                )}

                <div className="password-input-group">
                  <input 
                    type="password" 
                    placeholder="New password (6-60 characters)" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="password-input-group">
                  <input 
                    type="password" 
                    placeholder="Re-enter new password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {passwordStatus && (
                  <div className={`password-status-msg ${passwordStatus.type}`}>
                    {passwordStatus.message}
                  </div>
                )}

                <label className="password-checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={signOutAll} 
                    onChange={(e) => setSignOutAll(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label">Sign out all devices</span>
                </label>

                <div className="password-actions">
                  <button type="submit" className="password-save-btn" disabled={passwordLoading}>
                    {passwordLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" className="password-cancel-btn" onClick={() => setIsChangingPassword(false)}>Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <>
                  <h1 className="account-title">Account</h1>
                  <p className="account-subtitle">Membership Details</p>

                  <section className="account-section">
                    <div className="account-card">
                      <div className="account-badge">
                        Member since {memberSince}
                      </div>
                      
                      <div className="account-card__body">
                        <div className="account-plan-info">
                          <h2 className="account-plan-title">{planName}</h2>
                          <p className="account-payment-date">{userEmail || 'zedsmash154@gmail.com'}</p>
                        </div>
                      </div>

                      <button className="account-card__action">
                        <span>Manage membership</span>
                        <ChevronRight size={20} color="#666" />
                      </button>
                    </div>
                  </section>

                  <p className="account-section-label">Quick Links</p>
                  
                  <section className="account-section">
                    <div className="account-quick-links-card">
                      <button className="account-link-item" onClick={() => navigate('/change-plan')}>
                        <div className="account-link-item__left">
                          <Layers size={22} className="account-link-icon" />
                          <span>Change plan</span>
                        </div>
                        <ChevronRight size={20} color="#666" />
                      </button>

                      <button className="account-link-item">
                        <div className="account-link-item__left">
                          <CreditCard size={22} className="account-link-icon" />
                          <span>Manage payment method</span>
                        </div>
                        <ChevronRight size={20} color="#666" />
                      </button>

                      <button className="account-link-item">
                        <div className="account-link-item__left">
                          <Mail size={22} className="account-link-icon" />
                          <div className="account-link-text-stack">
                            <div className="account-link-with-badge">
                              <span>Buy an extra member slot</span>
                              <span className="account-new-badge">New</span>
                            </div>
                            <p className="account-link-desc">Share your LSFPlus with someone who doesn't live with you.</p>
                          </div>
                        </div>
                        <ChevronRight size={20} color="#666" />
                      </button>
                      <button className="account-link-item">
                        <div className="account-link-item__left">
                          <MonitorSmartphone size={22} className="account-link-icon" />
                          <span>Manage access and devices</span>
                        </div>
                        <ChevronRight size={20} color="#666" />
                      </button>

                      <button className="account-link-item" onClick={() => setIsChangingPassword(true)}>
                        <div className="account-link-item__left">
                          <Lock size={22} className="account-link-icon" />
                          <span>Update password</span>
                        </div>
                        <ChevronRight size={20} color="#666" />
                      </button>

                      <button className="account-link-item">
                        <div className="account-link-item__left">
                          <Smile size={22} className="account-link-icon" />
                          <span>Transfer a profile</span>
                        </div>
                        <ChevronRight size={20} color="#666" />
                      </button>

                      <button className="account-link-item">
                        <div className="account-link-item__left">
                          <ShieldAlert size={22} className="account-link-icon" />
                          <span>Adjust parental controls</span>
                        </div>
                        <ChevronRight size={20} color="#666" />
                      </button>

                      <button className="account-link-item">
                        <div className="account-link-item__left">
                          <Settings size={22} className="account-link-icon" />
                          <div className="account-link-text-stack">
                            <span>Edit settings</span>
                            <p className="account-link-desc">Languages, subtitles, autoplay, notifications, privacy and more</p>
                          </div>
                        </div>
                        <ChevronRight size={20} color="#666" />
                      </button>
                    </div>
                  </section>

                  <section className="account-section">
                    <div className="account-quick-links-card manage-profiles-card" onClick={() => setActiveTab('profiles')}>
                      <div className="manage-profiles-content">
                        <div className="manage-profiles-left">
                          <h3 className="manage-profiles-title">Manage profiles</h3>
                          <p className="manage-profiles-sub">{profiles.length} profiles</p>
                        </div>
                        <div className="manage-profiles-right">
                          <div className="profile-avatars-stack">
                            {profiles.slice(0, 4).map((p) => (
                              <img key={p.id} src={p.image} alt={p.name} className="stacked-avatar" />
                            ))}
                          </div>
                          <ChevronRight size={20} color="#666" />
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'security' && (
            <>
              <h1 className="account-title">Security</h1>
              <p className="account-subtitle">Account Details</p>

              <section className="account-section">
                <div className="account-quick-links-card">
                  <button className="account-link-item" onClick={() => setIsChangingPassword(true)}>
                    <div className="account-link-item__left">
                      <Lock size={22} className="account-link-icon" />
                      <span>Password</span>
                    </div>
                    <ChevronRight size={20} color="#666" />
                  </button>

                  <button className="account-link-item">
                    <div className="account-link-item__left">
                      <Mail size={22} className="account-link-icon" />
                      <div className="account-link-text-stack">
                         <span>Email</span>
                         <span className="account-detail-value">{userEmail || 'zedsmash154@gmail.com'}</span>
                         {isVerified ? (
                           <div className="account-verified-row">
                             <Check size={14} color="#333" />
                             <span>Verified</span>
                           </div>
                         ) : (
                           <div className="account-verified-row unverified">
                             <ShieldAlert size={14} color="#e50914" />
                             <span style={{color: '#e50914'}}>Action Required</span>
                           </div>
                         )}
                      </div>
                    </div>
                    <ChevronRight size={20} color="#666" />
                  </button>

                  <button className="account-link-item">
                    <div className="account-link-item__left">
                      <Smartphone size={22} className="account-link-icon" />
                      <div className="account-link-text-stack">
                         <span>Mobile phone</span>
                         <span className="account-detail-value">016-742 8352</span>
                      </div>
                    </div>
                    <ChevronRight size={20} color="#666" />
                  </button>
                </div>
              </section>

              <p className="account-section-label">Access and Privacy</p>

              <section className="account-section">
                <div className="account-quick-links-card">
                  <button className="account-link-item">
                    <div className="account-link-item__left">
                      <MonitorSmartphone size={22} className="account-link-icon" />
                      <div className="account-link-text-stack">
                        <span>Access and devices</span>
                        <p className="account-link-desc">Manage signed-in devices</p>
                      </div>
                    </div>
                    <ChevronRight size={20} color="#666" />
                  </button>

                  <button className="account-link-item">
                    <div className="account-link-item__left">
                      <Smile size={22} className="account-link-icon" />
                      <div className="account-link-text-stack">
                        <div className="account-link-with-badge">
                          <span>Profile Transfer</span>
                          <span className="account-new-badge">New</span>
                        </div>
                        <p className="account-link-desc">Off</p>
                      </div>
                    </div>
                    <ChevronRight size={20} color="#666" />
                  </button>
                </div>
              </section>
            </>
          )}

              {activeTab === 'profiles' && (
                <>
                  <h1 className="account-title">Profiles</h1>
                  <p className="account-subtitle">Manage profiles and parental controls for your account.</p>

                  <section className="account-section">
                    <div className="account-quick-links-card">
                       <button className="account-link-item">
                        <div className="account-link-item__left">
                          <Smile size={22} className="account-link-icon" />
                          <div className="account-link-text-stack">
                            <span>Transfer a profile</span>
                            <p className="account-link-desc">Copy a profile to another account</p>
                          </div>
                        </div>
                        <ChevronRight size={20} color="#666" />
                      </button>
                      <button className="account-link-item">
                        <div className="account-link-item__left">
                          <ShieldAlert size={22} className="account-link-icon" />
                          <div className="account-link-text-stack">
                            <span>Adjust parental controls</span>
                            <p className="account-link-desc">Set maturity ratings and block titles for all profiles.</p>
                          </div>
                        </div>
                        <ChevronRight size={20} color="#666" />
                      </button>
                    </div>
                  </section>

                  <p className="account-section-label">Profile Settings</p>
                  
                  <section className="account-section">
                    <div className="account-quick-links-card account-profiles-card">
                      {profiles.map((p) => (
                        <button key={p.id} className="account-link-item" onClick={() => navigate(`/ManageProfile/${p.id}`)}>
                          <div className="account-link-item__left">
                            <img src={p.image} alt={p.name} className="account-profile-avatar" />
                            <div className="account-link-text-stack">
                              <div className="account-profile-name-row">
                                <span>{p.name}</span>
                                {activeProfile?.id === p.id && (
                                  <span className="account-profile-badge">Your Profile</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight size={20} color="#666" />
                        </button>
                      ))}

                      {profiles.length < 5 && (
                        <div className="account-add-profile-section">
                          <button className="account-add-profile-btn-large" onClick={() => navigate('/CreateProfile')}>
                            Add Profile
                          </button>
                          <p className="account-add-profile-caption">
                            Add up to 5 profiles for anyone who lives with you.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'membership' && (
                <div className="membership-tab-content">
                  <h1 className="account-title">Membership</h1>
                  <p className="account-subtitle">Plan Details</p>

                  <section className="account-section">
                    <div className="membership-card premium">
                      <div className="membership-card-top-border"></div>
                      <div className="membership-card-content">
                        <div className="membership-plan-info">
                          <h2 className="membership-plan-name">{planName}</h2>
                          <p className="membership-plan-desc">{planDesc}</p>
                        </div>

                        <div className="membership-actions">
                          <button className="membership-action-item" onClick={() => navigate('/change-plan')}>
                            <span>Change plan</span>
                            <ChevronRight size={20} color="#666" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  <p className="account-section-label">Payment Info</p>

                  <section className="account-section">
                    <div className="membership-card">
                      <div className="membership-card-content">
                        <div className="payment-info-header">
                          <h2 className="payment-next-title">Next payment</h2>
                          <p className="payment-next-date">May 25, 2026</p>
                          <div className="payment-method-row">
                             <div className="mastercard-icon">
                               <div className="mc-circle red"></div>
                               <div className="mc-circle orange"></div>
                             </div>
                             <span className="payment-card-number">•••• •••• •••• 5555</span>
                          </div>
                        </div>

                        <div className="membership-actions">
                          <button className="membership-action-item">
                            <span>Manage payment method</span>
                            <ChevronRight size={20} color="#666" />
                          </button>
                          <button className="membership-action-item">
                            <span>Redeem gift or promo code</span>
                            <ChevronRight size={20} color="#666" />
                          </button>
                          <button className="membership-action-item">
                            <span>View payment history</span>
                            <ChevronRight size={20} color="#666" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  </div>
  );
}

