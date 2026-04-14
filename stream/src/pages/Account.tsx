import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Zap
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Account.css';

export default function Account() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email ?? null);
    });

    const stored = localStorage.getItem('activeProfile');
    if (stored) {
      setActiveProfile(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="account-page">
      {/* Top Navbar */}
      <nav className="account-nav">
        <div className="account-nav__left">
          <div className="account-nav__logo" onClick={() => navigate('/browse')}>
            NETFLIX
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

      <div className="account-layout">
        {/* Sidebar */}
        <aside className="account-sidebar">
          <button className="account-back-btn" onClick={() => navigate('/browse')}>
            <ArrowLeft size={18} />
            <span>Back to Netflix</span>
          </button>

          <div className="account-menu">
            <button className="account-menu-item active">
              <Home size={20} />
              <span>Overview</span>
            </button>
            <button className="account-menu-item">
              <CreditCard size={20} />
              <span>Membership</span>
            </button>
            <button className="account-menu-item">
              <ShieldCheck size={20} />
              <span>Security</span>
            </button>
            <button className="account-menu-item">
              <Smartphone size={20} />
              <span>Devices</span>
            </button>
            <button className="account-menu-item">
              <Smile size={20} />
              <span>Profiles</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="account-main">
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
                    <p className="account-link-desc">Share your Netflix with someone who doesn't live with you.</p>
                  </div>
                </div>
                <ChevronRight size={20} color="#666" />
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
