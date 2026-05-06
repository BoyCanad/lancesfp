import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
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

function IconRow({
  icons,
  label,
  showArrows,
  onSelect,
}: {
  icons: string[];
  label: string;
  showArrows: boolean;
  onSelect: (icon: string) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [icons]);

  const scrollLeft = () => rowRef.current?.scrollBy({ left: -360, behavior: 'smooth' });
  const scrollRight = () => rowRef.current?.scrollBy({ left: 360, behavior: 'smooth' });

  const showLeft = showArrows && canScrollLeft;
  const showRight = showArrows && canScrollRight;

  return (
    <div className="ip-icon-row-wrapper">
      {showLeft && (
        <div className="ip-left-scroll" onClick={scrollLeft}>
          <ChevronLeft size={28} />
        </div>
      )}
      <div
        className="ip-icon-row"
        ref={rowRef}
        onScroll={checkScroll}
      >
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
      {showRight && (
        <div className="ip-right-scroll" onClick={scrollRight}>
          <ChevronRight size={28} />
        </div>
      )}
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
              <IconRow icons={historyIcons} label="History" showArrows={true} onSelect={handleSelect} />
            </div>
          )}

          <div className="ip-category">
            <h2 className="ip-category-title">The Classics</h2>
            <IconRow icons={classicsIcons} label="Classic" showArrows={false} onSelect={handleSelect} />
          </div>

          <div className="ip-category">
            <div className="ip-category-header">
              <img src="/images/el-bimbo-logo.webp" alt="Ang Huling El Bimbo" className="ip-category-logo" />
            </div>
            <IconRow icons={elBimboIcons} label="Ang Huling El Bimbo" showArrows={true} onSelect={handleSelect} />
          </div>
        </div>
      </main>
    </div>
  );
}
