import { useState } from 'react';
import './BehindTheScenesSection.css';

interface BTSItem {
  id: string;
  title: string;
  description: string;
  image: string;
  thumb: string;
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
        image: '/images/casual.png',
        thumb: '/images/casual.png'
      },
      {
        id: 'cost2',
        title: "Streetwear",
        description: "Streetwear during the \"Tindahan ni Aling Nena\" era featured a playful, \"kanto-style\" aesthetic of loose collared shirts and high-waisted shorts, reflecting the vibrant and humorous side of neighborhood life in the Philippines. This look symbolizes the simplicity and charm of local community interactions, capturing a sense of youthful optimism and the relatable, everyday hustle of the Filipino \"everyman.\"",
        image: '/images/street.png',
        thumb: '/images/street.png'
      },
      {
        id: 'cost3',
        title: "Academic Heritage",
        description: "The combination of a Sunday dress or long-sleeved white shirt with the **Sablay** symbolizes a profound respect for Filipino heritage and the hard-earned transition from student to scholar. This formal attire, contrasted by the parents' casual wear, highlights the graduate’s individual achievement while grounding the ceremony in the supportive, everyday reality of the family's journey.",
        image: '/images/acad.png',
        thumb: '/images/acad.png'
      },
      {
        id: 'cost4',
        title: "The Disciplined Youth",
        description: "The white T-shirt and dark cargo pants worn during the \"Pare Ko/Yoko\" sequence evoke a raw, military-inspired aesthetic that symbolizes the loss of innocence and the harsh intrusion of discipline into the characters' lives. This utilitarian uniform reflects the collective struggle of the youth as they transition from carefree individuality to a world of rigid order and internal conflict.",
        image: '/images/disciplined.png',
        thumb: '/images/disciplined.png'
      },
      {
        id: 'cost5',
        title: "The Ethereal Ensemble",
        description: "The all-white attire worn during the titular \"Ang Huling El Bimbo\" sequence creates a celestial, dreamlike aesthetic that symbolizes purity, forgiveness, and the spiritual reunion of the characters beyond their earthly tragedies. This monochromatic palette strips away the grit of their past, serving as a powerful visual representation of peace and the enduring nature of memories that remain untarnished by time.",
        image: '/images/ensemble.png',
        thumb: '/images/ensemble.png'
      }
    ]
  },
  {
    id: 'music',
    label: 'Music',
    items: [
      {
        id: 'mus1',
        title: "The Orchestra Recording",
        description: "A 90-piece orchestra recorded the legendary score at Abbey Road studios, adding a massive cinematic breadth to the beloved Broadway tunes.",
        image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=2670&auto=format&fit=crop',
        thumb: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=400&auto=format&fit=crop'
      }
    ]
  }
];

export default function BehindTheScenesSection() {
  const [activeTabId, setActiveTabId] = useState(btsData[0].id);
  const activeTab = btsData.find(t => t.id === activeTabId) || btsData[0];
  const [activeItemId, setActiveItemId] = useState(activeTab.items[0].id);

  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
    const newTab = btsData.find(t => t.id === tabId);
    if (newTab) setActiveItemId(newTab.items[0].id);
  };

  const activeItem = activeTab.items.find(i => i.id === activeItemId) || activeTab.items[0];

  return (
    <div className="bts-section">
      {/* Backgrounds - map through all items of the current tab to preload and fade smoothly */}
      {activeTab.items.map((item) => (
        <div
          key={item.id}
          className={`bts-bg ${item.id === activeItemId ? 'bts-bg--visible' : 'bts-bg--hidden'}`}
          style={{ backgroundImage: `url(${item.image})` }}
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
          <h2 className="bts-title">{activeItem.title}</h2>
          <p className="bts-desc">{activeItem.description}</p>
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
