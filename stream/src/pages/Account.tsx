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
  Zap,
  Lock,
  Check,
  MonitorSmartphone,
  ShieldAlert,
  Users
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Account.css';

export default function Account() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'membership' | 'security' | 'devices' | 'profiles'>('overview');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [signOutAll, setSignOutAll] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email ?? null);
    });

    const stored = localStorage.getItem('activeProfile');
    if (stored) {
      setActiveProfile(JSON.parse(stored));
    }

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
          window.location.href = '/login';
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
            <div className="mobile-account-logo">LSFPlus</div>
          </header>

          <div className="mobile-account-content">
            <h1 className="mobile-account-title">Account</h1>
            <p className="mobile-account-intro">
              Visit your Account on lsfplus.com to update your payment details, change your plan and other account management features.
            </p>

            <section className="mobile-account-section">
              <h2 className="mobile-section-title">Membership Details</h2>
              <div className="mobile-card">
                <div className="mobile-card-badge">Member since April 2020</div>
                <div className="mobile-card-main">
                  <h3 className="mobile-plan-name">Premium plan</h3>
                  <p className="mobile-payment-info">Next payment: May 4, 2026</p>
                  <div className="mobile-payment-method">
                    <div className="mobile-provider-logo">
                        <Zap size={14} fill="#0d68b1" color="#0d68b1" />
                    </div>
                    <span>Celcom *** *** ***0499</span>
                  </div>
                </div>
                
                <div className="mobile-card-links">
                  <button className="mobile-card-link">
                    <div className="mobile-card-link-left">
                      <span>Buy an extra member slot</span>
                      <span className="mobile-tag-new">New</span>
                    </div>
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
                        <span>Email</span>
                        <p>{userEmail || 'zedsmash154@gmail.com'}</p>
                      </div>
                    </div>
                    <ChevronRight size={20} color="#333" />
                </button>
                <button className="mobile-card-link mobile-card-link--large">
                    <div className="mobile-card-link-left">
                      <Smartphone size={22} color="#333" />
                      <div className="mobile-link-text">
                        <span>Mobile phone</span>
                        <p>016-742 8352</p>
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
                <button className="mobile-card-link mobile-card-link--large">
                    <div className="mobile-card-link-left">
                      <Users size={22} color="#333" />
                      <span>Profile Transfer</span>
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
        {/* Top Navbar */}
        <nav className="account-nav">
        <div className="account-nav__left">
          <div className="account-nav__logo" onClick={() => navigate('/browse')}>
            LSFPlus
          </div>
        </div>
        <div className="account-nav__right">
          <div className="account-nav__profile">
            <img 
              src={activeProfile?.image || "/images/avatar-1.png"} 
              alt="Profile" 
              className="account-nav__avatar" 
            />
            <span className="account-nav__caret">▼</span>
          </div>
        </div>
      </nav>

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
                        Member since April 2020
                      </div>
                      
                      <div className="account-card__body">
                        <div className="account-plan-info">
                          <h2 className="account-plan-title">Premium plan</h2>
                          <p className="account-payment-date">Next payment: 4 May 2026</p>
                          
                          <div className="account-payment-method">
                            <div className="celcom-logo">
                              <div className="celcom-icon"><Zap size={14} fill="#0d68b1" color="#0d68b1" /></div>
                              <span>Celcom</span>
                            </div>
                            <span className="account-masked-number">*** *** ***0499</span>
                          </div>
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
                      <button className="account-link-item">
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
                         <div className="account-verified-row">
                           <Check size={14} color="#333" />
                           <span>Verified</span>
                         </div>
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

              {(activeTab !== 'overview' && activeTab !== 'security') && (
                <div className="account-placeholder">
                  <h1 className="account-title">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                  <p className="account-subtitle">Coming soon...</p>
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
