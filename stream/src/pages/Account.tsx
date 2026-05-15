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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
        setIsVerified(user.user_metadata?.signup_completed === true);
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

  const MobileAccountView = () => (
    <div className={`mobile-account ${isChangingPassword ? 'password-active' : ''}`}>
      {!isChangingPassword ? (
        <>
          <header className="mobile-account-header">
            <button className="mobile-account-back" onClick={() => navigate('/browse')}>
              <ArrowLeft size={24} color="white" />
            </button>
            <div className="mobile-account-logo">
              <img src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif" alt="LSFPlus" style={{ height: '30px' }} />
            </div>
          </header>

          <div className="mobile-account-content">
            <h1 className="mobile-account-title">Account</h1>
            <p className="mobile-account-intro">
              Visit your Account on lsfplus.com to update your payment details, change your plan and other account management features.
            </p>

            <section className="mobile-account-section">
              <h2 className="mobile-section-title">Membership Details</h2>
              <div className="mobile-card">
                <div className="mobile-card-badge">Member since {memberSince}</div>
                <div className="mobile-card-main">
                  <h3 className="mobile-plan-name">Free Plan</h3>
                  <p className="mobile-payment-info">{userEmail || 'zedsmash154@gmail.com'}</p>
                </div>
                
                <div className="mobile-card-links">
                  <button className="mobile-card-link" onClick={() => navigate('/change-plan')}>
                    <span>Change plan</span>
                    <ChevronRight size={20} color="#333" />
                  </button>
                  <button className="mobile-card-link">
                    <span>View payment history</span>
                    <ChevronRight size={20} color="#333" />
                  </button>
                </div>
              </div>
            </section>

            <section className="mobile-account-section">
              <h2 className="mobile-section-title">Security</h2>
              <div className="mobile-card">
                <button className="mobile-card-link mobile-card-link--large" onClick={() => setIsChangingPassword(true)}>
                    <div className="mobile-card-link-left">
                      <Lock size={22} color="#333" />
                      <span>Password</span>
                    </div>
                    <ChevronRight size={20} color="#333" />
                </button>
                <button className="mobile-card-link mobile-card-link--large">
                    <div className="mobile-card-link-left">
                      <Mail size={22} color="#333" />
                      <div className="mobile-link-text">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>Email</span>
                          {isVerified ? (
                            <div className="account-verified-row" style={{ marginTop: '0' }}>
                              <Check size={12} color="#0071eb" />
                              <span style={{ fontSize: '11px', color: '#0071eb' }}>Verified</span>
                            </div>
                          ) : (
                            <div className="account-verified-row" style={{ marginTop: '0' }}>
                              <ShieldAlert size={12} color="#e50914" />
                              <span style={{ fontSize: '11px', color: '#e50914' }}>Unverified</span>
                            </div>
                          )}
                        </div>
                        <p>{userEmail || 'zedsmash154@gmail.com'}</p>
                      </div>
                    </div>
                    <ChevronRight size={20} color="#333" />
                </button>
              </div>
            </section>

            <section className="mobile-account-section">
              <h2 className="mobile-section-title">Devices</h2>
              <div className="mobile-card">
                <button className="mobile-card-link mobile-card-link--large">
                    <div className="mobile-card-link-left">
                      <MonitorSmartphone size={22} color="#333" />
                      <span>Access and devices</span>
                    </div>
                    <ChevronRight size={20} color="#333" />
                </button>
              </div>
            </section>

            <section className="mobile-account-section">
              <h2 className="mobile-section-title">Profiles</h2>
              <div className="mobile-profiles-list">
                {profiles.map((p) => (
                  <div key={p.id} className="mobile-profile-item" onClick={() => navigate(`/ManageProfile/${p.id}`)}>
                    <div className="mobile-profile-left">
                      <img src={p.image} alt={p.name} className="mobile-profile-avatar" />
                      <div className="mobile-profile-info">
                        <span className="mobile-profile-name">{p.name}</span>
                        <span className="mobile-profile-sub">All Maturity Ratings</span>
                      </div>
                    </div>
                    <ChevronRight size={20} color="#333" />
                  </div>
                ))}
                
                {profiles.length < 5 && (
                  <button className="mobile-add-profile-btn" onClick={() => navigate('/CreateProfile')}>
                    <div className="mobile-add-icon-wrapper">
                      <span className="mobile-add-plus">+</span>
                    </div>
                    <span>Add Profile</span>
                  </button>
                )}
              </div>
            </section>

            <section className="mobile-account-section">
              <h2 className="mobile-section-title">Parental Controls</h2>
              <div className="mobile-card">
                <button className="mobile-card-link mobile-card-link--large">
                    <div className="mobile-card-link-left">
                      <ShieldAlert size={22} color="#333" />
                      <span>Adjust parental controls</span>
                    </div>
                    <ChevronRight size={20} color="#333" />
                </button>
                <button className="mobile-card-link mobile-card-link--large">
                    <div className="mobile-card-link-left">
                      <ShieldCheck size={22} color="#333" />
                      <span>Privacy and data settings</span>
                    </div>
                    <ChevronRight size={20} color="#333" />
                </button>
              </div>
            </section>

            <div className="mobile-account-actions">
              <button className="mobile-action-btn">Cancel Membership</button>
              <button className="mobile-action-btn">Delete Account</button>
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
                          <h2 className="account-plan-title">Free plan</h2>
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
                          <h2 className="membership-plan-name">Free Plan</h2>
                          <p className="membership-plan-desc">4K video resolution with spatial audio, ad-free watching and more.</p>
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
