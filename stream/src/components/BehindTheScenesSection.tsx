import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Music } from 'lucide-react';
import './BehindTheScenesSection.css';

interface BTSItem {
  id: string;
  title: string;
  description: string;
  image: string;
  mobileImage?: string;
  thumb: string;
  videoUrl?: string;
  musicUrl?: string;
}

interface BTSTab {
  id: string;
  label: string;
  items: BTSItem[];
}

const btsData: BTSTab[] = [
  {
    id: 'costumes',
    label: 'Costumes',
    items: [
      {
        id: 'cost1',
        title: "Casual",
        description: "The casual wear of the Eraserheads era, characterized by oversized tees and rugged denim, symbolizes the unpolished authenticity and rebellious spirit of 1990s Filipino youth. This utilitarian aesthetic mirrors the songs' themes of camaraderie, capturing the bittersweet shift from carefree student life to the realities of adulthood.",
        image: '/images/casual.webp',
        mobileImage: '/images/casual-mobile.webp',
        thumb: '/images/casual.webp'
      },
      {
        id: 'cost2',
        title: "Streetwear",
        description: "Streetwear during the \"Tindahan ni Aling Nena\" era featured a playful, \"kanto-style\" aesthetic of loose collared shirts and high-waisted shorts, reflecting the vibrant and humorous side of neighborhood life in the Philippines. This look symbolizes the simplicity and charm of local community interactions, capturing a sense of youthful optimism and the relatable, everyday hustle of the Filipino \"everyman.\"",
        image: '/images/street.webp',
        mobileImage: '/images/street-mobile.webp',
        thumb: '/images/street.webp'
      },
      {
        id: 'cost3',
        title: "Academic Heritage",
        description: "The combination of a Sunday dress or long-sleeved white shirt with the **Sablay** symbolizes a profound respect for Filipino heritage and the hard-earned transition from student to scholar. This formal attire, contrasted by the parents' casual wear, highlights the graduate’s individual achievement while grounding the ceremony in the supportive, everyday reality of the family's journey.",
        image: '/images/acad.webp',
        mobileImage: '/images/acad-mobile.webp',
        thumb: '/images/acad.webp'
      },
      {
        id: 'cost4',
        title: "The Disciplined Youth",
        description: "The white T-shirt and dark cargo pants worn during the \"Pare Ko/Yoko\" sequence evoke a raw, military-inspired aesthetic that symbolizes the loss of innocence and the harsh intrusion of discipline into the characters' lives. This utilitarian uniform reflects the collective struggle of the youth as they transition from carefree individuality to a world of rigid order and internal conflict.",
        image: '/images/disciplined.webp',
        mobileImage: '/images/disciplined-mobile.webp',
        thumb: '/images/disciplined.webp'
      },
      {
        id: 'cost5',
        title: "The Ethereal Ensemble",
        description: "The all-white attire worn during the titular \"Ang Huling El Bimbo\" sequence creates a celestial, dreamlike aesthetic that symbolizes purity, forgiveness, and the spiritual reunion of the characters beyond their earthly tragedies. This monochromatic palette strips away the grit of their past, serving as a powerful visual representation of peace and the enduring nature of memories that remain untarnished by time.",
        image: '/images/ensemble.webp',
        mobileImage: '/images/ensemble-mobile.webp',
        thumb: '/images/ensemble.webp'
      }
    ]
  },
  {
    id: 'music',
    label: 'Music',
    items: [
      {
        id: 'mus1',
        title: "Minsan",
        description: "“Minsan” is a heartfelt reflection on friendship, nostalgia, and the bittersweet passage of time. It tells the story of people who once shared deep connections and carefree moments, only to drift apart as life moves forward.",
        image: '/images/bts-minsan.webp',
        mobileImage: '/images/bts-minsan-mobile.webp',
        thumb: '/images/bts-minsan.webp',
        videoUrl: '/watch/minsan',
        musicUrl: '/music/minsan'
      },
      {
        id: 'mus2',
        title: "Tindahan ni Aling Nena",
        description: "A lively and colorful performance of “Tindahan ni Aling Nena” from Ang Huling El Bimbo, this scene brings energy and humor while subtly reflecting the group’s youthful bond and everyday life.",
        image: '/images/bts-tindahan.webp',
        mobileImage: '/images/bts-tindahan-mobile.webp',
        thumb: '/images/bts-tindahan.webp',
        videoUrl: '/watch/tindahan',
        musicUrl: '/music/tindahan'
      },
      {
        id: 'mus3',
        title: "Alapaap/Overdrive",
        description: "This high-octane performance of “Alapaap / Overdrive” captures the raw rebellion and fleeting freedom of youth. It’s an emotional escape fueled by the reckless energy that ultimately shapes the characters' journey.",
        image: '/images/bts-alapaap.webp',
        mobileImage: '/images/bts-alapaap-mobile.webp',
        thumb: '/images/bts-alapaap.webp',
        videoUrl: '/watch/alapaap',
        musicUrl: '/music/alapaap'
      },
      {
        id: 'mus4',
        title: "Spoliarium/Graduation",
        description: "The “Spoliarium/Graduation” sequence moves from the visceral trauma of Joy’s stolen innocence to the bitter irony of celebration. Marko’s ill-timed confession of love serves as a heartbreaking reminder of a future already shattered by the darkness preceding it.",
        image: '/images/bts-spoliarium.webp',
        mobileImage: '/images/bts-spoliarium-mobile.webp',
        thumb: '/images/bts-spoliarium.webp',
        videoUrl: '/watch/spoliarium',
        musicUrl: '/music/spoliarium'
      },
      {
        id: 'mus5',
        title: "Pare Ko/Yoko",
        description: "This high-energy ROTC sequence transforms military drills into a vibrant spectacle of brotherhood. Set to the iconic **“Pare Ko,”** it balances sharp choreography with the raw “friendzone” angst that defines the bond between the three leads.",
        image: '/images/bts-pare-ko.webp',
        mobileImage: '/images/bts-pare-ko-mobile.webp',
        thumb: '/images/bts-pare-ko.webp',
        videoUrl: '/watch/pare-ko',
        musicUrl: '/music/pare-ko'
      },
      {
        id: 'mus6',
        title: "Tama Ka/Ligaya",
        description: "The “Tama Ka / Ligaya” mashup contrasts the finality of a breakup with the warmth of nostalgia. It masterfully captures the bittersweet irony of moving on while still clinging to a lost happiness.",
        image: '/images/bts-tama-ka.webp',
        mobileImage: '/images/bts-tama-ka-mobile.webp',
        thumb: '/images/bts-tama-ka.webp',
        videoUrl: '/watch/tama-ka',
        musicUrl: '/music/tama-ka'
      },
      {
        id: 'mus7',
        title: "Ang Huling El Bimbo",
        description: "The heart-wrenching “Ang Huling El Bimbo” finale mirrors a graceful past against a tragic present. As a tribute to Joy, it captures the regret of a friendship ended too soon, closing the story with the haunting beauty of a dream that can never be reclaimed.",
        image: '/images/bts-el-bimbo.webp',
        mobileImage: '/images/bts-el-bimbo-mobile.webp',
        thumb: '/images/bts-el-bimbo.webp',
        videoUrl: '/watch/el-bimbo',
        musicUrl: '/music/el-bimbo'
      }
    ]
  }
];

export default function BehindTheScenesSection() {
  const navigate = useNavigate();
  const [activeTabId, setActiveTabId] = useState(btsData[0].id);
  const activeTab = btsData.find(t => t.id === activeTabId) || btsData[0];
  const [activeItemId, setActiveItemId] = useState(activeTab.items[0].id);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
    const newTab = btsData.find(t => t.id === tabId);
    if (newTab) setActiveItemId(newTab.items[0].id);
  };

  const activeItem = activeTab.items.find(i => i.id === activeItemId) || activeTab.items[0];

  return (
    <div className="bts-section">
      {/* Backgrounds - map through all items from all tabs to enable cross-tab transitions */}
      {btsData.flatMap(tab => tab.items).map((item) => (
        <div
          key={item.id}
          className={`bts-bg ${item.id === activeItemId ? 'bts-bg--visible' : 'bts-bg--hidden'}`}
          style={{ backgroundImage: `url(${isMobile && item.mobileImage ? item.mobileImage : item.image})` }}
        />
      ))}

      <div className="bts-gradient" />

      <div className="bts-content">
        <div className="bts-tabs">
          {btsData.map((tab) => (
            <button
              key={tab.id}
              className={`bts-tab ${tab.id === activeTabId ? 'bts-tab--active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bts-info" key={activeItem.id}>
          <div className="bts-info-text">
            <h2 className="bts-title">{activeItem.title}</h2>
            <p className="bts-desc">{activeItem.description}</p>
            
            {activeTabId === 'music' && (
              <div className="bts-actions">
                <button 
                  className="bts-action-btn bts-action-btn--primary"
                  onClick={() => navigate(activeItem.videoUrl || '#')}
                >
                  <Play size={20} fill="currentColor" />
                  <span>Play Video</span>
                </button>
                <button 
                  className="bts-action-btn bts-action-btn--secondary"
                  onClick={() => navigate(activeItem.musicUrl || '#')}
                >
                  <Music size={20} />
                  <span>Play Music</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bts-thumbs">
          {activeTab.items.map((item) => (
            <div
              key={item.id}
              className={`bts-thumb ${item.id === activeItemId ? 'bts-thumb--active' : ''}`}
              onClick={() => setActiveItemId(item.id)}
            >
              <img src={item.thumb} alt={item.title} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
