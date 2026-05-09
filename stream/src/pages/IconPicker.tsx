import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getProfiles } from '../services/profileService';
import type { Profile } from '../services/profileService';
import './IconPicker.css';

const classicsIcons = [
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=red&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=yellow&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=blue&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=gray&backgroundColor=e2e2e2',
  'https://api.dicebear.com/7.x/bottts/svg?seed=mask&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/bottts/svg?seed=shades&backgroundColor=d1d4f9',
];

const elBimboIcons = [
  'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/icon/1.webp',
  'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/icon/2.webp',
  'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/icon/3.webp',
  'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/icon/4.webp',
  'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/icon/5.webp',
  'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/icon/6.webp',
  'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/icon/7.webp',
  'https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/icon/8.webp',
];

const avataaarsIcons = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Toby&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Coco&backgroundColor=d1d4f9',
];

const personasIcons = [
  'https://api.dicebear.com/7.x/personas/svg?seed=Lucky&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/personas/svg?seed=Garfield&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/personas/svg?seed=Cuddles&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/personas/svg?seed=Midnight&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/personas/svg?seed=Shadow&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/personas/svg?seed=Oliver&backgroundColor=ffdfbf',
];

const loreleiIcons = [
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Bear&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Lilly&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Peanut&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Simba&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Daisy&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Nala&backgroundColor=ffdfbf',
];

const bigEarsIcons = [
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Boots&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Tiger&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Oscar&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Gracie&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Ziggy&backgroundColor=b6e3f4',
];

const pixelIcons = [
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Mario&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Luigi&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Yoshi&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Peach&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Toad&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Bowser&backgroundColor=ffdfbf',
];

function IconRow({
  icons,
  label,
  onSelect,
}: {
  icons: string[];
  label: string;
  onSelect: (icon: string) => void;
}) {
  return (
    <div className="ip-icon-row-wrapper">
      <div className="ip-icon-row">
        {icons.map((icon, idx) => (
          <img
            key={idx}
            src={icon}
            alt={`${label} Icon ${idx + 1}`}
            className="ip-icon-item"
            onClick={() => onSelect(icon)}
          />
        ))}
      </div>
    </div>
  );
}

export default function IconPicker() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [historyIcons, setHistoryIcons] = useState<string[]>([]);

  useEffect(() => {
    getProfiles().then((profiles) => {
      const found = profiles.find((p) => p.id === id);
      setProfile(found || null);

      if (found) {
        // Build history: prioritized from the profile's own icon_history
        const dbHistory = found.icon_history || [];
        
        // As a secondary fallback for this browser, check localStorage
        const localHistoryStr = localStorage.getItem(`icon_history_${id}`);
        const localHistory = localHistoryStr ? JSON.parse(localHistoryStr) : [];
        
        // Ensure the current image is at least in the list
        const combined = Array.from(new Set([found.image, ...dbHistory, ...localHistory]));
        setHistoryIcons(combined.filter(Boolean));
      }
    });
  }, [id]);

  if (!profile) {
    return null;
  }

  const handleSelect = (icon: string) => {
    navigate(`/EditProfile/${profile.id}`, { state: { newIcon: icon } });
  };

  return (
    <div className="ip-container">
      <header className="ip-header">
        <div className="ip-logo" onClick={() => navigate('/')}>
          <img src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/logo.gif" alt="LSFPlus" style={{ height: '45px' }} />
        </div>
      </header>

      <main className="ip-main">
        <div className="ip-topbar">
          <button className="ip-back-btn" onClick={() => navigate(`/EditProfile/${profile.id}`)}>
            <ArrowLeft size={24} />
          </button>
          <div className="ip-title-group">
            <h1 className="ip-title">Choose a profile icon</h1>
            <div className="ip-subtitle-row">
              <span className="ip-subtitle">For {profile.name}</span>
              <img src={profile.image} alt="current icon" className="ip-current-icon" />
            </div>
          </div>
        </div>

        <div className="ip-categories">
          {historyIcons.length > 0 && (
            <div className="ip-category">
              <h2 className="ip-category-title">History</h2>
              <IconRow icons={historyIcons} label="History" onSelect={handleSelect} />
            </div>
          )}

          <div className="ip-category">
            <h2 className="ip-category-title">The Classics</h2>
            <IconRow icons={classicsIcons} label="Classic" onSelect={handleSelect} />
          </div>

          <div className="ip-category">
            <div className="ip-category-header">
              <img src="https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/el-bimbo-p.webp" alt="Ang Huling El Bimbo" className="ip-category-logo" />
            </div>
            <IconRow icons={elBimboIcons} label="Ang Huling El Bimbo" onSelect={handleSelect} />
          </div>

          <div className="ip-category">
            <h2 className="ip-category-title">Avataaars</h2>
            <IconRow icons={avataaarsIcons} label="Avataaar" onSelect={handleSelect} />
          </div>

          <div className="ip-category">
            <h2 className="ip-category-title">Personas</h2>
            <IconRow icons={personasIcons} label="Persona" onSelect={handleSelect} />
          </div>

          <div className="ip-category">
            <h2 className="ip-category-title">Lorelei</h2>
            <IconRow icons={loreleiIcons} label="Lorelei" onSelect={handleSelect} />
          </div>

          <div className="ip-category">
            <h2 className="ip-category-title">Big Ears</h2>
            <IconRow icons={bigEarsIcons} label="Big Ear" onSelect={handleSelect} />
          </div>

          <div className="ip-category">
            <h2 className="ip-category-title">Pixel Art</h2>
            <IconRow icons={pixelIcons} label="Pixel" onSelect={handleSelect} />
          </div>
        </div>
      </main>
    </div>
  );
}
