import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  visible: boolean;
  profileImage?: string | null;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ visible, profileImage }) => {
  return (
    <div className={`loading-overlay ${visible ? 'visible' : ''} ${profileImage ? 'overlay--profile' : ''}`}>
      <div className="spinner-container">
        <div className="netflix-spinner"></div>
        {profileImage && (
          <img src={profileImage} alt="Profile" className="spinner-avatar" />
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
