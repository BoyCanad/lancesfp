import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Lock, Pencil, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getProfiles, updateProfile } from '../services/profileService';
import { supabase } from '../supabaseClient';
import type { Profile } from '../services/profileService';
import './ProfileLock.css';

export default function ProfileLock() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [step, setStep] = useState<'intro' | 'pin' | 'manage'>('intro');
  const [modalAction, setModalAction] = useState<'pin' | 'delete'>('pin');
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    getProfiles().then((profiles) => {
      const found = profiles.find((p) => p.id === id);
      setProfile(found || null);
    });
  }, [id]);

  useEffect(() => {
    if (profile?.locked && step === 'intro') {
      setStep('manage');
    }
  }, [profile]);

  if (!profile) {
    return null;
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setVerifying(true);
    setPasswordError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No user email found");

      // Verify by signing in again
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (error) throw error;
      
      // Success
      setShowModal(false);
      if (modalAction === 'pin') {
        setStep('pin');
      } else {
        handleDeleteLock();
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Incorrect password. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value.substring(value.length - 1);
    setPin(newPin);

    // Auto-advance
    if (value && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  const handleSavePin = async () => {
    const fullPin = pin.join('');
    if (fullPin.length < 4) return;
    
    setSaving(true);
    try {
      await updateProfile(profile.id, { locked: true, pin: fullPin });
      navigate(`/ManageProfile/${id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLock = async () => {
    setSaving(true);
    try {
      await updateProfile(profile.id, { locked: false, pin: '' });
      navigate(`/ManageProfile/${id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateClick = () => {
    setModalAction('pin');
    setShowModal(true);
  };

  const handleDeleteClick = () => {
    setModalAction('delete');
    setShowModal(true);
  };

  const renderIntro = () => (
    <div className="pl-content">
      <h1 className="pl-title">Create a Profile Lock</h1>

      <div className="pl-profile-info">
        <span className="pl-for-text">For {profile.name}</span>
        <img src={profile.image} alt={profile.name} className="pl-avatar" />
      </div>

      <p className="pl-description">
        Make this profile private by adding a 4-digit PIN that will need to be entered to access it.
      </p>

      <button className="pl-create-btn" onClick={handleCreateClick}>
        Create a Profile Lock
      </button>

      <div className="pl-divider" />

      <p className="pl-footer-note">
        Note: You'll be asked to enter the account password when making changes to profile lock.
      </p>
    </div>
  );

  const renderManage = () => {
    if (isMobile) {
      return (
        <div className="pl-mobile-manage">
          <header className="pl-mobile-header">
            <button className="pl-mobile-back" onClick={() => navigate(`/EditProfile/${id}`)}>
              <ArrowLeft size={28} color="white" />
            </button>
            <h1 className="pl-mobile-title">Profile Lock</h1>
          </header>

          <main className="pl-mobile-content">
            <div className="pl-mobile-row" onClick={handleCreateClick}>
              <div className="pl-mobile-row-left">
                <Pencil size={24} color="white" />
                <span>Edit PIN</span>
              </div>
            </div>

            <div className="pl-mobile-delete-section">
              <button className="pl-mobile-delete-btn" onClick={handleDeleteClick}>
                <Trash2 size={24} color="#a3a3a3" />
                <span>Delete Profile Lock</span>
              </button>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="pl-content">
        <h1 className="pl-title">Manage Profile Lock</h1>

        <div className="pl-profile-info">
          <span className="pl-for-text">For {profile.name}</span>
          <img src={profile.image} alt={profile.name} className="pl-avatar" />
        </div>

        <div className="pl-lock-status-card">
          <Lock size={24} className="pl-lock-icon" />
          <div className="pl-lock-text">
            <span className="pl-lock-label">Profile Lock</span>
            <span className="pl-lock-value">On</span>
          </div>
        </div>

        <div className="pl-manage-divider" />

        <div className="pl-manage-actions">
          <button className="pl-edit-pin-btn" onClick={handleCreateClick}>
            Edit PIN
          </button>
          <button className="pl-delete-lock-btn" onClick={handleDeleteClick}>
            Delete Profile Lock
          </button>
        </div>

        <p className="pl-footer-note" style={{ marginTop: '2rem' }}>
          Note: You'll be asked to enter the account password when making changes to Profile Lock.
        </p>
      </div>
    );
  };

  const renderPin = () => (
    <div className="pl-content pl-pin-content">
      <h1 className="pl-title">Add a 4-digit PIN to create your Profile Lock</h1>
      <p className="pl-pin-subtitle">
        You'll be asked to re-enter your PIN when you select your profile on any device.
      </p>

      <div className="pl-pin-boxes">
        {pin.map((digit, i) => (
          <input
            key={i}
            ref={pinRefs[i]}
            type="password"
            className="pl-pin-input"
            value={digit}
            onChange={(e) => handlePinChange(i, e.target.value)}
            onKeyDown={(e) => handlePinKeyDown(i, e)}
            autoFocus={i === 0}
          />
        ))}
      </div>

      <p className="pl-footer-note" style={{ marginTop: '2rem' }}>
        Note: a profile PIN is not required to make changes to profile settings or to delete a profile.
      </p>

      <div className="pl-pin-actions">
        <button 
          className="pl-create-btn" 
          onClick={handleSavePin} 
          disabled={saving || pin.join('').length < 4}
        >
          {saving ? 'Saving...' : 'Save PIN'}
        </button>
        <button className="pl-cancel-btn" onClick={() => navigate(`/ManageProfile/${id}`)}>
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="pl-container">
      <header className="pl-header">
        <div className="pl-logo" onClick={() => navigate('/browse')}>LSFPlus</div>
        {/* Mock auth avatar at top right for exact match if desired, though omitted here for simplicity */}
      </header>

      <main className="pl-main">
        {step !== 'manage' || !isMobile ? (
          <button className="pl-back-btn" onClick={() => navigate(`/EditProfile/${id}`)}>
            <ArrowLeft size={24} />
          </button>
        ) : null}

        {step === 'intro' ? renderIntro() : step === 'pin' ? renderPin() : renderManage()}
      </main>

      {/* Password Modal Overlay */}
      {showModal && (
        <div className="pl-modal-overlay">
          <div className="pl-modal">
            <button className="pl-modal-close" onClick={() => setShowModal(false)}>
              <X size={24} color="#333" />
            </button>
            <form onSubmit={handlePasswordSubmit}>
              <h2 className="pl-modal-title">Confirm your password</h2>
              <p className="pl-modal-subtitle">Please enter your account password.</p>
              
              <input
                type="password"
                className="pl-modal-input"
                placeholder="Current Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {passwordError && <p className="pl-error-msg">{passwordError}</p>}

              <button type="submit" className="pl-modal-submit" disabled={verifying || !password}>
                {verifying ? 'Verifying...' : 'Submit'}
              </button>

              <a href="#" className="pl-modal-link" onClick={(e) => e.preventDefault()}>
                Create or reset password
              </a>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
