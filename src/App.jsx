import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { buildShareText, shareCast } from './utils/share';
import { updateStreakOnVisit, getCurrentStreak } from './utils/streak';
import { 
  trackEvent, 
  getUserStats, 
  isAdminWallet, 
  getAdminStats, 
  exportAdminCSV, 
  ADMIN_WALLET,
  getUserIdentity,
  trackVisit,
  trackReading,
  downloadStatsCsv,
  loadStats,
  getStatsKey
} from './utils/analytics';

// Safety check for ethers
if (typeof ethers === 'undefined') {
  console.error('ethers.js not loaded');
}

// Taro card data based on tarot.com meanings
// Source: https://www.tarot.com/tarot/cards
const ALL_CARDS = [
  // Major Arcana
  {
    id: 0,
    name: "The Fool",
    keyword: "New Beginnings",
    description: "The Fool represents new beginnings, having faith in the future, being inexperienced, not knowing what to expect, having beginner's luck, improvisation and believing in the universe. This card encourages you to take a leap of faith and embrace the unknown with an open heart.",
    imagePath: "./Assets/imagine/taro_cards/THE FOOL.png",
  },
  {
    id: 1,
    name: "The Magician",
    keyword: "Manifestation",
    description: "The Magician represents manifestation, resourcefulness, power, inspired action, using one's talents and abilities to achieve goals, and the ability to make things happen. This card encourages you to use your skills and resources to create the life you want.",
    imagePath: "./Assets/imagine/taro_cards/THE MAGICIAN.png",
  },
  {
    id: 2,
    name: "The High Priestess",
    keyword: "Intuition",
    description: "The High Priestess represents intuition, spiritual insight, divine feminine, the subconscious mind, and inner wisdom. This card encourages you to trust your intuition and listen to your inner voice for guidance.",
    imagePath: "./Assets/imagine/taro_cards/THE HIGH PRIESTESS.png",
  },
  {
    id: 3,
    name: "The Empress",
    keyword: "Abundance",
    description: "The Empress represents abundance, nurturing, fertility, beauty, and the divine feminine. This card encourages you to embrace your feminine energy, be nurturing to yourself and others, and enjoy the abundance in your life.",
    imagePath: "./Assets/imagine/taro_cards/THE EMPRESS.png",
  },
  {
    id: 4,
    name: "The Emperor",
    keyword: "Authority",
    description: "The Emperor represents authority, structure, control, fatherhood, and stability. This card encourages you to take charge of your life, establish structure, and be a leader in your own life.",
    imagePath: "./Assets/imagine/taro_cards/THE EMPEROR.png",
  },
  {
    id: 5,
    name: "The Hierophant",
    keyword: "Spiritual Guidance",
    description: "The Hierophant represents spiritual guidance, religious beliefs, conformity, tradition, and spiritual wisdom. This card encourages you to seek spiritual guidance and follow your spiritual path.",
    imagePath: "./Assets/imagine/taro_cards/THE HIEROPHANT.png",
  },
  {
    id: 6,
    name: "The Lovers",
    keyword: "Love",
    description: "The Lovers represents love, harmony, relationships, values alignment, and choices. This card encourages you to make choices that align with your values and to embrace love in all its forms.",
    imagePath: "./Assets/imagine/taro_cards/THE LOVERS.png",
  },
  {
    id: 7,
    name: "The Chariot",
    keyword: "Determination",
    description: "The Chariot represents determination, control, willpower, success, and direction. This card encourages you to take control of your life, stay focused on your goals, and move forward with determination.",
    imagePath: "./Assets/imagine/taro_cards/THE CHARIOT.png",
  },
  {
    id: 8,
    name: "Strength",
    keyword: "Inner Strength",
    description: "Strength represents inner strength, courage, compassion, and taming one's instincts. This card encourages you to tap into your inner strength and face challenges with courage and compassion.",
    imagePath: "./Assets/imagine/taro_cards/STRENGTH.png",
  },
  {
    id: 9,
    name: "The Hermit",
    keyword: "Soul Searching",
    description: "The Hermit represents soul searching, introspection, inner guidance, and solitude. This card encourages you to take time for introspection and listen to your inner guidance.",
    imagePath: "./Assets/imagine/taro_cards/THE HERMIT.png",
  },
  {
    id: 10,
    name: "Wheel of Fortune",
    keyword: "Change",
    description: "Wheel of Fortune represents change, cycles, destiny, turning points, and life lessons. This card encourages you to embrace change and trust that everything happens for a reason.",
    imagePath: "./Assets/imagine/taro_cards/WHEEL OF FORTUNE.png",
  },
  {
    id: 11,
    name: "Justice",
    keyword: "Justice",
    description: "Justice represents justice, fairness, truth, cause and effect, and law. This card encourages you to seek justice and fairness in all situations and to take responsibility for your actions.",
    imagePath: "./Assets/imagine/taro_cards/JUSTICE.png",
  },
  {
    id: 12,
    name: "The Hanged Man",
    keyword: "Suspension",
    description: "The Hanged Man represents suspension, restriction, letting go, and sacrifice. This card encourages you to let go of control and surrender to the flow of life.",
    imagePath: "./Assets/imagine/taro_cards/THE HANGED MAN.png",
  },
  {
    id: 13,
    name: "Death",
    keyword: "Endings",
    description: "Death represents endings, beginnings, change, transformation, and transition. This card encourages you to embrace change and transformation as necessary parts of life.",
    imagePath: "./Assets/imagine/taro_cards/DEATH.png",
  },
  {
    id: 14,
    name: "Temperance",
    keyword: "Balance",
    description: "Temperance represents balance, moderation, patience, purpose, and meaning. This card encourages you to find balance in your life and to have patience in achieving your goals.",
    imagePath: "./Assets/imagine/taro_cards/TEMPERANCE.png",
  },
  {
    id: 15,
    name: "The Devil",
    keyword: "Bondage",
    description: "The Devil represents bondage, addiction, sexuality, materialism, and playfulness. This card encourages you to examine what is holding you back and to break free from unhealthy attachments.",
    imagePath: "./Assets/imagine/taro_cards/THE DEVIL.png",
  },
  {
    id: 16,
    name: "The Tower",
    keyword: "Sudden Change",
    description: "The Tower represents sudden change, upheaval, chaos, revelation, and awakening. This card encourages you to embrace change even when it's difficult and to see it as an opportunity for growth.",
    imagePath: "./Assets/imagine/taro_cards/THE TOWER.png",
  },
  {
    id: 17,
    name: "The Star",
    keyword: "Hope",
    description: "The Star represents hope, faith, purpose, renewal, and spirituality. This card encourages you to have faith in the universe and to follow your dreams with hope and optimism.",
    imagePath: "./Assets/imagine/taro_cards/THE STAR.png",
  },
  {
    id: 18,
    name: "The Moon",
    keyword: "Illusion",
    description: "The Moon represents illusion, fear, anxiety, subconscious, and intuition. This card encourages you to trust your intuition and to face your fears rather than letting them control you.",
    imagePath: "./Assets/imagine/taro_cards/THE MOON.png",
  },
  {
    id: 19,
    name: "The Sun",
    keyword: "Positivity",
    description: "The Sun represents positivity, fun, warmth, success, and vitality. This card encourages you to embrace positivity and to celebrate your successes and the good things in your life.",
    imagePath: "./Assets/imagine/taro_cards/THE SUN.png",
  },
  {
    id: 20,
    name: "Judgement",
    keyword: "Judgement",
    description: "Judgement represents judgement, rebirth, inner calling, and absolution. This card encourages you to listen to your inner calling and to forgive yourself and others.",
    imagePath: "./Assets/imagine/taro_cards/JUDGEMENT.png",
  },
  {
    id: 21,
    name: "The World",
    keyword: "Completion",
    description: "The World represents completion, accomplishment, travel, and fulfillment. This card encourages you to celebrate your accomplishments and to embrace the fulfillment that comes from completing your goals.",
    imagePath: "./Assets/imagine/taro_cards/THE WORLD.png",
  },
  // Wands (Fire)
  {
    id: 22,
    name: "Ace of Wands",
    keyword: "Inspiration",
    description: "The Ace of Wands represents inspiration, new opportunities, growth, and potential. This card encourages you to embrace new opportunities and to have faith in your ability to grow and succeed.",
    imagePath: "./Assets/imagine/taro_cards/ACE OF WANDS.png",
  },
  {
    id: 23,
    name: "Two of Wands",
    keyword: "Planning",
    description: "The Two of Wands represents planning, progress, discovery, and making decisions. This card encourages you to plan for the future and to make decisions that will help you progress toward your goals.",
    imagePath: "./Assets/imagine/taro_cards/TWO OF WANDS.png",
  },
  {
    id: 24,
    name: "Three of Wands",
    keyword: "Expansion",
    description: "The Three of Wands represents expansion, foresight, overseas opportunities, and the first stage of fulfillment. This card encourages you to expand your horizons and to look for opportunities beyond your current situation.",
    imagePath: "./Assets/imagine/taro_cards/THREE OF WANDS.png",
  },
  {
    id: 25,
    name: "Four of Wands",
    keyword: "Celebration",
    description: "The Four of Wands represents celebration, harmony, home, and community. This card encourages you to celebrate your achievements and to enjoy the harmony and community in your life.",
    imagePath: "./Assets/imagine/taro_cards/FOUR OF WANDS.png",
  },
  {
    id: 26,
    name: "Five of Wands",
    keyword: "Conflict",
    description: "The Five of Wands represents conflict, disagreements, competition, and tension. This card encourages you to face conflicts head-on and to use them as opportunities for growth and learning.",
    imagePath: "./Assets/imagine/taro_cards/FIVE OF WANDS.png",
  },
  {
    id: 27,
    name: "Six of Wands",
    keyword: "Success",
    description: "The Six of Wands represents success, public recognition, progress, and self-confidence. This card encourages you to celebrate your successes and to have confidence in your abilities.",
    imagePath: "./Assets/imagine/taro_cards/SIX OF WANDS.png",
  },
  {
    id: 28,
    name: "Seven of Wands",
    keyword: "Challenge",
    description: "The Seven of Wands represents challenge, competition, perseverance, and defense. This card encourages you to stand your ground and to persevere through challenges and competition.",
    imagePath: "./Assets/imagine/taro_cards/SEVEN OF WANDS.png",
  },
  {
    id: 29,
    name: "Eight of Wands",
    keyword: "Speed",
    description: "The Eight of Wands represents speed, action, alignment, and air travel. This card encourages you to take action quickly and to align yourself with the flow of the universe.",
    imagePath: "./Assets/imagine/taro_cards/EIGHT OF WANDS.png",
  },
  {
    id: 30,
    name: "Nine of Wands",
    keyword: "Resilience",
    description: "The Nine of Wands represents resilience, courage, persistence, and test of faith. This card encourages you to be resilient and to have faith in your ability to overcome obstacles.",
    imagePath: "./Assets/imagine/taro_cards/NINE OF WANDS.png",
  },
  {
    id: 31,
    name: "Ten of Wands",
    keyword: "Burden",
    description: "The Ten of Wands represents burden, responsibility, hard work, and accomplishment. This card encourages you to take responsibility for your burdens and to work hard to achieve your goals.",
    imagePath: "./Assets/imagine/taro_cards/TEN OF WANDS.png",
  },
  {
    id: 32,
    name: "Page of Wands",
    keyword: "Inspiration",
    description: "The Page of Wands represents inspiration, ideas, discovery, and limitless potential. This card encourages you to embrace new ideas and to explore your limitless potential.",
    imagePath: "./Assets/imagine/taro_cards/PAGE OF WANDS.png",
  },
  {
    id: 33,
    name: "Knight of Wands",
    keyword: "Energy",
    description: "The Knight of Wands represents energy, passion, inspired action, and adventure. This card encourages you to take inspired action and to embrace adventure and passion in your life.",
    imagePath: "./Assets/imagine/taro_cards/KNIGHT OF WANDS.png",
  },
  {
    id: 34,
    name: "Queen of Wands",
    keyword: "Courage",
    description: "The Queen of Wands represents courage, confidence, independence, and social butterfly. This card encourages you to be confident and independent, and to embrace your social nature.",
    imagePath: "./Assets/imagine/taro_cards/QUEEN OF WANDS.png",
  },
  {
    id: 35,
    name: "King of Wands",
    keyword: "Leadership",
    description: "The King of Wands represents leadership, vision, entrepreneur, and honoring commitments. This card encourages you to be a leader and to honor your commitments and vision.",
    imagePath: "./Assets/imagine/taro_cards/KING OF WANDS.png",
  },
  // Cups (Water)
  {
    id: 36,
    name: "Ace of Cups",
    keyword: "Love",
    description: "The Ace of Cups represents love, new relationships, compassion, and creativity. This card encourages you to open your heart to love and to embrace compassion and creativity in your life.",
    imagePath: "./Assets/imagine/taro_cards/ACE OF CUPS.png",
  },
  {
    id: 37,
    name: "Two of Cups",
    keyword: "Unity",
    description: "The Two of Cups represents unity, partnership, mutual attraction, and love. This card encourages you to seek unity and partnership in your relationships and to embrace mutual attraction and love.",
    imagePath: "./Assets/imagine/taro_cards/TWO OF CUPS.png",
  },
  {
    id: 38,
    name: "Three of Cups",
    keyword: "Celebration",
    description: "The Three of Cups represents celebration, friendship, creativity, and community. This card encourages you to celebrate with friends and to embrace creativity and community in your life.",
    imagePath: "./Assets/imagine/taro_cards/THREE OF CUPS.png",
  },
  {
    id: 39,
    name: "Four of Cups",
    keyword: "Meditation",
    description: "The Four of Cups represents meditation, contemplation, apathy, and reevaluation. This card encourages you to take time for meditation and contemplation, and to reevaluate your situation.",
    imagePath: "./Assets/imagine/taro_cards/FOUR OF CUPS.png",
  },
  {
    id: 40,
    name: "Five of Cups",
    keyword: "Regret",
    description: "The Five of Cups represents regret, failure, disappointment, and pessimism. This card encourages you to learn from your disappointments and to focus on what you still have rather than what you've lost.",
    imagePath: "./Assets/imagine/taro_cards/FIVE OF CUPS.png",
  },
  {
    id: 41,
    name: "Six of Cups",
    keyword: "Revisiting",
    description: "The Six of Cups represents revisiting the past, childhood memories, innocence, and joy. This card encourages you to revisit happy memories from your past and to embrace innocence and joy in your life.",
    imagePath: "./Assets/imagine/taro_cards/SIX OF CUPS.png",
  },
  {
    id: 42,
    name: "Seven of Cups",
    keyword: "Opportunity",
    description: "The Seven of Cups represents opportunity, choices, wishful thinking, and illusion. This card encourages you to make wise choices and to distinguish between real opportunities and illusions.",
    imagePath: "./Assets/imagine/taro_cards/SEVEN OF CUPS.png",
  },
  {
    id: 43,
    name: "Eight of Cups",
    keyword: "Disappointment",
    description: "The Eight of Cups represents disappointment, abandonment, withdrawal, and escapism. This card encourages you to move on from disappointing situations and to seek fulfillment elsewhere.",
    imagePath: "./Assets/imagine/taro_cards/EIGHT OF CUPS.png",
  },
  {
    id: 44,
    name: "Nine of Cups",
    keyword: "Contentment",
    description: "The Nine of Cups represents contentment, satisfaction, gratitude, and wish come true. This card encourages you to be grateful for what you have and to enjoy the satisfaction of having your wishes fulfilled.",
    imagePath: "./Assets/imagine/taro_cards/NINE OF CUPS.png",
  },
  {
    id: 45,
    name: "Ten of Cups",
    keyword: "Divine Love",
    description: "The Ten of Cups represents divine love, blissful relationships, harmony, and alignment. This card encourages you to seek divine love and harmony in your relationships and life.",
    imagePath: "./Assets/imagine/taro_cards/TEN OF CUPS.png",
  },
  {
    id: 46,
    name: "Page of Cups",
    keyword: "Creative Opportunities",
    description: "The Page of Cups represents creative opportunities, intuitive messages, and curiosity. This card encourages you to be open to creative opportunities and to listen to your intuition.",
    imagePath: "./Assets/imagine/taro_cards/PAGE OF CUPS.png",
  },
  {
    id: 47,
    name: "Knight of Cups",
    keyword: "Creativity",
    description: "The Knight of Cups represents creativity, romance, bringing or receiving a message, and taking action. This card encourages you to be creative and to take action on your romantic and creative impulses.",
    imagePath: "./Assets/imagine/taro_cards/KNIGHT OF CUPS.png",
  },
  {
    id: 48,
    name: "Queen of Cups",
    keyword: "Compassionate",
    description: "The Queen of Cups represents compassionate, caring, emotionally stable, intuitive, and in flow. This card encourages you to be compassionate and caring, and to trust your intuition.",
    imagePath: "./Assets/imagine/taro_cards/QUEEN OF CUPS.png",
  },
  {
    id: 49,
    name: "King of Cups",
    keyword: "Emotionally Balanced",
    description: "The King of Cups represents emotionally balanced, compassionate, diplomatic, and wise. This card encourages you to be emotionally balanced and to use your wisdom and compassion in your dealings with others.",
    imagePath: "./Assets/imagine/taro_cards/KING OF CUPS.png",
  },
  // Swords (Air)
  {
    id: 50,
    name: "Ace of Swords",
    keyword: "Breakthroughs",
    description: "The Ace of Swords represents breakthroughs, new ideas, mental clarity, and success. This card encourages you to embrace new ideas and to seek mental clarity and success.",
    imagePath: "./Assets/imagine/taro_cards/ACE OF SWORDS.png",
  },
  {
    id: 51,
    name: "Two of Swords",
    keyword: "Difficult Decisions",
    description: "The Two of Swords represents difficult decisions, weighing options, inner conflict, and stalemate. This card encourages you to make difficult decisions and to resolve inner conflicts.",
    imagePath: "./Assets/imagine/taro_cards/TWO OF SWORDS.png",
  },
  {
    id: 52,
    name: "Three of Swords",
    keyword: "Heartbreak",
    description: "The Three of Swords represents heartbreak, emotional pain, sorrow, grief, and hurt. This card encourages you to acknowledge your pain and to work through your grief to heal.",
    imagePath: "./Assets/imagine/taro_cards/THREE OF SWARDS.png",
  },
  {
    id: 53,
    name: "Four of Swords",
    keyword: "Rest",
    description: "The Four of Swords represents rest, relaxation, meditation, and contemplation. This card encourages you to take time for rest and relaxation to recharge your energy.",
    imagePath: "./Assets/imagine/taro_cards/FOUR OF SWORDS.png",
  },
  {
    id: 54,
    name: "Five of Swords",
    keyword: "Conflict",
    description: "The Five of Swords represents conflict, disagreements, competition, defeat, and winning at all costs. This card encourages you to consider the cost of winning and to seek peaceful resolutions to conflicts.",
    imagePath: "./Assets/imagine/taro_cards/FIVE OF SWARDS.png",
  },
  {
    id: 55,
    name: "Six of Swords",
    keyword: "Transition",
    description: "The Six of Swords represents transition, change, rite of passage, and releasing baggage. This card encourages you to embrace change and to release baggage that is holding you back.",
    imagePath: "./Assets/imagine/taro_cards/SIX OF SWORDS.png",
  },
  {
    id: 56,
    name: "Seven of Swords",
    keyword: "Betrayal",
    description: "The Seven of Swords represents betrayal, deception, getting away with something, and acting strategically. This card encourages you to be aware of deception and to act strategically in your dealings.",
    imagePath: "./Assets/imagine/taro_cards/SEVEN OF SWORDS.png",
  },
  {
    id: 57,
    name: "Eight of Swords",
    keyword: "Negative Thoughts",
    description: "The Eight of Swords represents negative thoughts, self-imposed restriction, inner critic, and releasing negative thoughts. This card encourages you to release negative thoughts and to free yourself from self-imposed restrictions.",
    imagePath: "./Assets/imagine/taro_cards/EIGHT OF SWORDS.png",
  },
  {
    id: 58,
    name: "Nine of Swords",
    keyword: "Anxiety",
    description: "The Nine of Swords represents anxiety, worry, fear, depression, and nightmares. This card encourages you to face your fears and to seek help if you're struggling with anxiety or depression.",
    imagePath: "./Assets/imagine/taro_cards/NINE OF SWORDS.png",
  },
  {
    id: 59,
    name: "Ten of Swords",
    keyword: "Painful Endings",
    description: "The Ten of Swords represents painful endings, deep wounds, betrayal, and loss. This card encourages you to accept painful endings and to use them as opportunities for new beginnings.",
    imagePath: "./Assets/imagine/taro_cards/TEN OF SWORDS.png",
  },
  {
    id: 60,
    name: "Page of Swords",
    keyword: "New Ideas",
    description: "The Page of Swords represents new ideas, curiosity, thirst for knowledge, and new ways of communicating. This card encourages you to embrace new ideas and to communicate in new ways.",
    imagePath: "./Assets/imagine/taro_cards/PAGE OF SWORDS.png",
  },
  {
    id: 61,
    name: "Knight of Swords",
    keyword: "Ambitious",
    description: "The Knight of Swords represents ambitious, action-oriented, driven to succeed, and fast-thinking. This card encourages you to be ambitious and action-oriented in pursuing your goals.",
    imagePath: "./Assets/imagine/taro_cards/KNIGHT OF SWORDS.png",
  },
  {
    id: 62,
    name: "Queen of Swords",
    keyword: "Independent",
    description: "The Queen of Swords represents independent, unbiased judgement, clear boundaries, and direct communication. This card encourages you to be independent and to communicate clearly and directly.",
    imagePath: "./Assets/imagine/taro_cards/QUEEN OF SWORDS.png",
  },
  {
    id: 63,
    name: "King of Swords",
    keyword: "Mental Clarity",
    description: "The King of Swords represents mental clarity, intellectual power, authority, and truth. This card encourages you to seek mental clarity and to use your intellectual power wisely.",
    imagePath: "./Assets/imagine/taro_cards/KING OF SWORDS.png",
  },
  // Pentacles (Earth)
  {
    id: 64,
    name: "Ace of Pentacles",
    keyword: "A New Financial or Career Opportunity",
    description: "The Ace of Pentacles represents a new financial or career opportunity, manifestation, abundance, and prosperity. This card encourages you to embrace new opportunities for financial and career growth.",
    imagePath: "./Assets/imagine/taro_cards/ACE OF PENTACLES.png",
  },
  {
    id: 65,
    name: "Two of Pentacles",
    keyword: "Multiple Priorities",
    description: "The Two of Pentacles represents multiple priorities, time management, prioritisation, and organisation. This card encourages you to manage your time and priorities effectively.",
    imagePath: "./Assets/imagine/taro_cards/TWO OF PENTACLES.png",
  },
  {
    id: 66,
    name: "Three of Pentacles",
    keyword: "Collaboration",
    description: "The Three of Pentacles represents collaboration, learning, implementation, and teamwork. This card encourages you to collaborate with others and to learn from teamwork.",
    imagePath: "./Assets/imagine/taro_cards/THREE OF PENTACLES.png",
  },
  {
    id: 67,
    name: "Four of Pentacles",
    keyword: "Saving Money",
    description: "The Four of Pentacles represents saving money, security, conservatism, and scarcity. This card encourages you to save money and to build financial security.",
    imagePath: "./Assets/imagine/taro_cards/FOUR OF PENTACLES.png",
  },
  {
    id: 68,
    name: "Five of Pentacles",
    keyword: "Financial Loss",
    description: "The Five of Pentacles represents financial loss, poverty, lack mindset, isolation, and loneliness. This card encourages you to change your mindset from lack to abundance and to seek support when needed.",
    imagePath: "./Assets/imagine/taro_cards/FIVE OF PENTACLES.png",
  },
  {
    id: 69,
    name: "Six of Pentacles",
    keyword: "Giving",
    description: "The Six of Pentacles represents giving, receiving, sharing wealth, generosity, and charity. This card encourages you to give generously and to share your wealth with others.",
    imagePath: "./Assets/imagine/taro_cards/SIX OF PENTACLES.png",
  },
  {
    id: 70,
    name: "Seven of Pentacles",
    keyword: "Long-Term View",
    description: "The Seven of Pentacles represents long-term view, sustainable results, perseverance, and investment. This card encourages you to take a long-term view and to persevere in your investments and efforts.",
    imagePath: "./Assets/imagine/taro_cards/SEVEN OF PENTACLES.png",
  },
  {
    id: 71,
    name: "Eight of Pentacles",
    keyword: "Apprenticeship",
    description: "The Eight of Pentacles represents apprenticeship, repetitive tasks, mastery, skill development, and dedication. This card encourages you to dedicate yourself to mastering your skills.",
    imagePath: "./Assets/imagine/taro_cards/EIGHT OF PENTACLES.png",
  },
  {
    id: 72,
    name: "Nine of Pentacles",
    keyword: "Abundance",
    description: "The Nine of Pentacles represents abundance, luxury, self-sufficiency, and financial independence. This card encourages you to enjoy abundance and to build financial independence.",
    imagePath: "./Assets/imagine/taro_cards/NINE OF PENTACLES.png",
  },
  {
    id: 73,
    name: "Ten of Pentacles",
    keyword: "Wealth",
    description: "The Ten of Pentacles represents wealth, financial security, family, long-term success, and contribution. This card encourages you to build wealth and to contribute to your family's long-term success.",
    imagePath: "./Assets/imagine/taro_cards/TEN OF PENTACLES.png",
  },
  {
    id: 74,
    name: "Page of Pentacles",
    keyword: "Learning",
    description: "The Page of Pentacles represents learning, studying, apprenticeship, and new ideas. This card encourages you to embrace learning and to study new ideas and concepts.",
    imagePath: "./Assets/imagine/taro_cards/PAGE OF PENTACLES.png",
  },
  {
    id: 75,
    name: "Knight of Pentacles",
    keyword: "Hard Work",
    description: "The Knight of Pentacles represents hard work, productivity, routine, and conservatism. This card encourages you to work hard and to be productive in your routine tasks.",
    imagePath: "./Assets/imagine/taro_cards/KNIGHT OF PENTACLES.png",
  },
  {
    id: 76,
    name: "Queen of Pentacles",
    keyword: "Nurturing",
    description: "The Queen of Pentacles represents nurturing, practical, providing financially and emotionally, and being down-to-earth. This card encourages you to nurture yourself and others, both financially and emotionally.",
    imagePath: "./Assets/imagine/taro_cards/QUEEN OF PENTACLES.png",
  },
  {
    id: 77,
    name: "King of Pentacles",
    keyword: "Financial Success",
    description: "The King of Pentacles represents financial success, business acumen, security, and discipline. This card encourages you to build financial success through business acumen and discipline.",
    imagePath: "./Assets/imagine/taro_cards/KING OF PENTACLES.png",
  },
];

function getRandomCards(count) {
  const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function TaroApp() {
  // Base path for GitHub Pages deployment
  const basePath = '/cbTARO';

  // Helper function for short address display
  function shortAddress(addr) {
    if (!addr || addr.length < 10) return addr || "";
    return addr.slice(0, 6) + "…" + addr.slice(-4);
  }

  const [gameStage, setGameStage] = useState("idle");
  const [selectedSpread, setSelectedSpread] = useState(null);
  const [cards, setCards] = useState([]);
  const [revealedIds, setRevealedIds] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [userQuestion, setUserQuestion] = useState("");
  const [aiInterpretation, setAiInterpretation] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [previousGameStage, setPreviousGameStage] = useState("idle");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [streak, setStreak] = useState(0); // Simple streak state for UI
  const [userStats, setUserStats] = useState(null);
  const [showAdminStats, setShowAdminStats] = useState(false);
  const [adminStats, setAdminStats] = useState([]);
  const [isLoadingAdminStats, setIsLoadingAdminStats] = useState(false);

  // Wallet and payment states
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [txStatus, setTxStatus] = useState("idle"); // idle, paying, success, error

  // Farcaster states
  const [fid, setFid] = useState(null);
  const [pfpUrl, setPfpUrl] = useState(null);

  // Update daily streak on mount and track visit
  useEffect(() => {
    // Local streak (fallback) - update immediately for UI
    const streakValue = updateStreakOnVisit();
    const numericStreak = Number(streakValue) || 0;
    setStreak(numericStreak);
    setDailyStreak(numericStreak);
    
    if (import.meta.env.DEV) {
      console.debug('Streak initialized:', numericStreak);
    }
    
    // Also load streak from localStorage stats if available
    try {
      const stats = loadStats();
      const identity = { fid: null, wallet: walletAddress || null };
      const key = getStatsKey(identity.fid, identity.wallet);
      const row = stats.rows[key];
      if (row && row.streak) {
        setDailyStreak(row.streak);
      }
    } catch (error) {
      // Ignore
    }
    
    // Track visit locally and on server
    (async () => {
      try {
        // Get user identity (fid, wallet)
        const identity = await getUserIdentity();
        const fid = identity.fid;
        const wallet = walletAddress || identity.wallet;
        
        // Track visit locally
        trackVisit({ fid, wallet });
        
        // Update streak from local stats after tracking
        const stats = loadStats();
        const key = getStatsKey(fid, wallet);
        const row = stats.rows[key];
        if (row && row.streak) {
          const updatedStreak = Number(row.streak) || 0;
          setStreak(updatedStreak);
          setDailyStreak(updatedStreak);
        }
        
        // Track visit on server (if API configured)
        const serverStats = await trackEvent('visit', null, wallet);
        if (serverStats) {
          setDailyStreak(serverStats.streak || streak); // Use server streak if available
          setUserStats(serverStats);
        } else {
          // Fallback: try to get stats without tracking
          const existingStats = await getUserStats();
          if (existingStats) {
            setDailyStreak(existingStats.streak || streak);
            setUserStats(existingStats);
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.debug('Analytics error:', error);
        }
      }
    })();
  }, []);

  // Farcaster Mini App SDK bootstrap - call ready() after first render
  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      try {
        // Dynamic import of Farcaster Mini App SDK
        const mod = await import("@farcaster/miniapp-sdk");
        const sdk = mod.default || mod.sdk || mod;
        
        // Check if we're inside Mini App environment
        const inMiniApp = typeof sdk?.isInMiniApp === "function" ? sdk.isInMiniApp() : false;
        
        if (!inMiniApp) {
          if (import.meta.env.DEV) {
            console.debug("[miniapp] Not in Mini App environment, skipping ready()");
          }
          return;
        }

        // Call ready() to hide splash screen
        if (typeof sdk?.actions?.ready === "function") {
          await sdk.actions.ready();
          if (!cancelled && import.meta.env.DEV) {
            console.debug("[miniapp] sdk.actions.ready() called successfully");
          }
        } else {
          if (import.meta.env.DEV) {
            console.debug("[miniapp] sdk.actions.ready is not a function");
          }
        }
      } catch (e) {
        if (!cancelled && import.meta.env.DEV) {
          console.debug("[miniapp] ready call failed", e);
        }
      }
    })();
    
    return () => {
      cancelled = true;
    };
  }, []);

  // Farcaster Mini App SDK initialization (backup check)
  useEffect(() => {
    console.log('🎯 React component mounted, checking Farcaster SDK...');

    // Small delay to ensure global script has run
        const timer = setTimeout(() => {
          if (!window.checkFarcasterReady || !window.checkFarcasterReady()) {
            // Fallback if global script failed
            console.log('🔄 Fallback SDK check from React component');

            const sdk = window.farcaster || window.farcasterSDK || window.sdk || window.FarcasterSDK;
            if (sdk && sdk.actions && typeof sdk.actions.ready === 'function') {
              try {
                sdk.actions.ready();
                console.log('✅ Fallback: farcaster.actions.ready() called');
              } catch (error) {
                console.error('❌ Fallback SDK error:', error);
              }
            } else if (window.parent !== window) {
              console.log('📱 Fallback: iframe detected, sending ready message');
              window.parent.postMessage({ type: 'ready' }, '*');
            }
          }
        }, 2000);

        return () => clearTimeout(timer);
      }, []);

      // Function to play button sound
      const playButtonSound = () => {
        if (!soundEnabled) return;
        const audio = new Audio('./Assets/audio/tab.mp3');
        audio.volume = 0.3; // Set volume to 30%
        audio.play().catch(e => console.log('Audio play failed:', e));
      };

      // Function to play spread animation sound
      const playSpreadSound = () => {
        if (!soundEnabled) return;
        const audio = new Audio('./Assets/audio/spread.mp3');
        audio.volume = 0.4; // Set volume to 40%
        audio.play().catch(e => console.log('Audio play failed:', e));
      };

      // Wallet and payment functions
      const connectWallet = async () => {
        if (!window.ethereum) {
          alert('MetaMask or compatible wallet not found!');
          return null;
        }

        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const address = await signer.getAddress();

          setIsWalletConnected(true);
          setWalletAddress(address);

          return { provider, signer, address };
        } catch (error) {
          console.error('Failed to connect wallet:', error);
          return null;
        }
      };

      // Resolve Farcaster identity from miniapp context
      const resolveFarcasterIdentity = (address) => {
        try {
          // Try different possible SDK global names and paths
          const user = window.farcaster?.context?.user ||
                      window.farcasterSDK?.context?.user ||
                      window.sdk?.context?.user ||
                      window.FarcasterSDK?.context?.user ||
                      window.farcaster?.user ||
                      window.farcasterSDK?.user;

          if (user?.fid) {
            setFid(user.fid);
          }
          if (user?.pfpUrl) {
            setPfpUrl(user.pfpUrl);
          }

          console.log('🎭 Farcaster identity resolved:', { fid: user?.fid, hasPfp: !!user?.pfpUrl });
        } catch (error) {
          console.log('🎭 No Farcaster context available:', error.message);
        }
      };

      // Handle connect button click
      const handleConnect = async () => {
        playButtonSound();
        const result = await connectWallet();
        if (result?.address) {
          resolveFarcasterIdentity(result.address);
        }
      };

      const ensureBase = async (provider) => {
        const network = await provider.getNetwork();
        if (network.chainId !== 8453) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x2105' }],
            });
            // Reload provider after network switch
            return new ethers.providers.Web3Provider(window.ethereum);
          } catch (error) {
            console.error('Failed to switch to Base network:', error);
            throw new Error('Please switch to Base network manually');
          }
        }
        return provider;
      };

      const payETH = async (signer, amountETH) => {
        const TREASURY = '0xD4bF185c846F6CAbDaa34122d0ddA43765E754A6';

        const tx = await signer.sendTransaction({
          to: TREASURY,
          value: ethers.utils.parseEther(amountETH.toString())
        });
        const receipt = await tx.wait();

        return { txHash: tx.hash, receipt };
      };


      // Usage Logger Module
      const usageLogger = {
        // Get identity from Mini App context
        getIdentity() {
          let fid = '';
          let currentWalletAddress = walletAddress || '';

          // Try to get FID from Farcaster context (if available in Mini App)
          if (window.farcaster && window.farcaster.user) {
            fid = window.farcaster.user.fid || '';
          }

          return { fid, walletAddress: currentWalletAddress };
        },

        // Generate storage key for identity
        getStorageKey() {
          const { fid, walletAddress } = this.getIdentity();
          return `cbtaro_usage_${fid || 'unknown'}_${walletAddress || 'unknown'}`;
        },

        // Load counts from localStorage
        loadCounts() {
          const key = this.getStorageKey();
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              return JSON.parse(stored);
            } catch (e) {
              console.error('Failed to parse usage counts:', e);
            }
          }
          return { oneCardCount: 0, threeCardCount: 0, customCount: 0 };
        },

        // Save counts to localStorage
        saveCounts(counts) {
          const key = this.getStorageKey();
          localStorage.setItem(key, JSON.stringify(counts));
        },

        // Increment count for specific spread type
        increment(type) {
          const counts = this.loadCounts();
          if (type === 'ONE') counts.oneCardCount++;
          else if (type === 'THREE') counts.threeCardCount++;
          else if (type === 'CUSTOM') counts.customCount++;
          this.saveCounts(counts);
        },

        // Export data as CSV
        exportCsv() {
          const { fid, walletAddress } = this.getIdentity();
          const counts = this.loadCounts();

          // Create CSV content
          const csvContent = [
            'fid,walletAddress,oneCardCount,threeCardCount,customCount',
            `${fid},${walletAddress},${counts.oneCardCount},${counts.threeCardCount},${counts.customCount}`
          ].join('\n');

          // Create and download file
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', 'cbTARO_usage.csv');
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      };

      // Share functions
      const getShareText = (spreadType) => {
        // Base text without app link (buildShareText will add it)
        if (spreadType === "ONE") {
          return `🃏 Daily Taro

Today's card gave me a clear signal.
Sometimes one card is all you need.

🔮 Pulled with cbTARO on Base`;
        } else if (spreadType === "THREE") {
          return `🔮 3-Card Taro Reading

Past. Present. Direction.
The pattern actually makes sense.

✨ Pulled with cbTARO on Base`;
        } else if (spreadType === "CUSTOM") {
          return `🧿 Custom Taro Reading

Asked a real question.
Got a real answer.

✨ cbTARO · Taro on Base`;
        }
        return "";
      };

      const generateCardsImage = async (cards) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1200;
        canvas.height = 630;

        // Dark background
        ctx.fillStyle = '#0a1230';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Card images
        const cardWidth = 150;
        const cardHeight = cardWidth * 1.46;
        const totalCardsWidth = cards.length * cardWidth + (cards.length - 1) * 20;
        const startX = (canvas.width - totalCardsWidth) / 2;
        const centerY = canvas.height / 2 - cardHeight / 2;

        for (let i = 0; i < cards.length; i++) {
          const card = cards[i];
          const x = startX + i * (cardWidth + 20);
          const y = centerY;

          try {
            try {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = card.imagePath;
              });

              ctx.drawImage(img, x, y, cardWidth, cardHeight);
            } catch (error) {
              console.warn('Failed to load card image:', card.imagePath, error);
              // Draw placeholder
              ctx.fillStyle = '#1a1a2e';
              ctx.fillRect(x, y, cardWidth, cardHeight);
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 2;
              ctx.strokeRect(x, y, cardWidth, cardHeight);

              ctx.fillStyle = '#fff';
              ctx.font = '12px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(card.name, x + cardWidth/2, y + cardHeight/2);
            }
          } catch (error) {
            console.error('Failed to load card image:', error);
            // Draw placeholder
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(x, y, cardWidth, cardHeight);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, cardWidth, cardHeight);

            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(card.name, x + cardWidth/2, y + cardHeight/2);
          }
        }

        // Footer text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('cbTARO · Taro on Base', canvas.width / 2, canvas.height - 20);

        return canvas.toDataURL('image/png');
      };

      const generateAITextImage = async (aiText) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1200;
        canvas.height = 630;

        // Dark background
        ctx.fillStyle = '#0a1230';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('Custom Taro Interpretation', canvas.width / 2, 50);

        // AI Text with word wrapping
        ctx.fillStyle = '#fff';
        ctx.font = '18px Georgia, serif';
        ctx.textAlign = 'left';

        const maxWidth = canvas.width - 100;
        const lineHeight = 24;
        let y = 100;

        const words = aiText.split(' ');
        let line = '';

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth > maxWidth && i > 0) {
            ctx.fillText(line, 50, y);
            line = words[i] + ' ';
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 50, y);

        return canvas.toDataURL('image/png');
      };

      // Share helper functions
      const APP_URL = "https://0xagcheth.github.io/cbTARO/";
      const LAST_DRAW_KEY = "cbTARO_lastDraw";
      
      // Normalize path: remove leading "./" or "/"
      function normalizePath(imagePath) {
        if (!imagePath) return null;
        // Remove leading "./" or "/"
        let cleanPath = imagePath.replace(/^\.\//, '').replace(/^\//, '');
        // Remove "public/" if present (GitHub Pages serves /public at root)
        cleanPath = cleanPath.replace(/^public\//, '');
        return cleanPath;
      }
      
      // Convert clean path to absolute GitHub Pages URL with encoding
      function toAbsoluteGhPagesUrl(cleanPath) {
        return `${APP_URL}${encodeURI(cleanPath)}`;
      }
      
      // Get first drawn card
      function getFirstDrawnCard(cards) {
        return (cards && cards.length > 0) ? cards[0] : null;
      }
      
      // Get first card image URL
      function getFirstCardImageUrl(cards) {
        const firstCard = getFirstDrawnCard(cards);
        if (firstCard?.imagePath) {
          const normalized = normalizePath(firstCard.imagePath);
          if (normalized) {
            return toAbsoluteGhPagesUrl(normalized);
          }
        }
        return null;
      }
      
      // Save last drawn card to localStorage
      function saveLastDraw(cards) {
        const firstCard = getFirstDrawnCard(cards);
        if (firstCard) {
          const imageUrl = getFirstCardImageUrl(cards);
          const drawData = {
            name: firstCard.name,
            imagePath: firstCard.imagePath,
            imageUrl: imageUrl,
            timestamp: Date.now()
          };
          try {
            localStorage.setItem(LAST_DRAW_KEY, JSON.stringify(drawData));
            console.log("Saved last draw:", drawData);
          } catch (error) {
            console.warn("Failed to save last draw:", error);
          }
        }
      }
      
      // Load last saved draw from localStorage
      function loadLastDraw() {
        try {
          const saved = localStorage.getItem(LAST_DRAW_KEY);
          if (saved) {
            const drawData = JSON.parse(saved);
            // Check if data is not too old (24 hours)
            const age = Date.now() - drawData.timestamp;
            if (age < 24 * 60 * 60 * 1000) {
              return drawData;
            }
          }
        } catch (error) {
          console.warn("Failed to load last draw:", error);
        }
        return null;
      }

      const handleShare = async () => {
        try {
          playButtonSound();

          const APP_URL = "https://0xagcheth.github.io/cbTARO/";

          // 1. Берём ПЕРВУЮ карту
          const card = cards && cards.length > 0 ? cards[0] : null;

          // 2. Абсолютный URL картинки
          let cardImageUrl = "";
          if (card?.imagePath) {
            // Убираем "./" если есть
            let cleanPath = card.imagePath.replace(/^\.\//, "");
            // Добавляем "public/" если его нет (на GitHub Pages файлы доступны С /public/ в пути)
            if (!cleanPath.startsWith("public/")) {
              cleanPath = "public/" + cleanPath;
            }
            cardImageUrl = APP_URL + encodeURI(cleanPath);
          } else {
            // Fallback на f.png если карты нет
            cardImageUrl = APP_URL + encodeURI("public/Assets/imagine/f.png");
          }

          // 3. Формируем текст с гарантированной ссылкой в конце
          let baseText = getShareText(selectedSpread);
          if (card?.name) {
            // Добавляем название карты в начало
            baseText = `🔮 Reveal Your Reading\nCard: ${card.name}\n\n${baseText}`;
          }
          // Используем buildShareText для гарантированного добавления ссылки в конце
          const text = buildShareText(baseText);
          
          // Debug logging
          const isDev = process.env.NODE_ENV === 'development' || window.location.search.includes('debug=1');
          if (isDev) {
            console.debug('SHARE text:', text);
            console.debug('SHARE card:', card);
            console.debug('SHARE cardImageUrl:', cardImageUrl);
          }

          // 4. Build embeds array
          const embeds = [APP_URL];
          if (cardImageUrl) {
            embeds.push(cardImageUrl);
          }

          // 5. Use shareCast helper (handles SDK, navigator.share, clipboard)
          const shared = await shareCast({ text: baseText, embeds: [cardImageUrl].filter(Boolean) });
          
          if (!shared) {
            // Fallback: Use Farcaster compose intent URL if shareCast failed
            if (isDev) {
              console.debug('SHARE using fallback compose URL');
            }
            
            const baseUrl = 'https://farcaster.xyz/~/compose';
            const params = new URLSearchParams();
            params.set("text", text);
            
            // Use embeds[] format (repeated parameters)
            embeds.forEach((embed) => {
              params.append("embeds[]", embed);
            });
            
            const url = `${baseUrl}?${params.toString()}`;
            if (isDev) {
              console.debug('SHARE URL:', url);
            }
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        } catch (error) {
          console.error('Share failed:', error);
          alert('Failed to share reading. Please try again.');
        }
      };

      // 1. Click "Choose Your Spread"
      const handleChooseSpreadClick = () => {
        playButtonSound();
        setGameStage("choosing");
      };

      // Function to get AI interpretation using free API
      const getAIInterpretation = async (cards, question) => {
        try {
          // Using Hugging Face Inference API (free tier)
          // You can also use other free APIs like Groq, Cohere, etc.
          const cardNames = cards.map(c => c.name).join(", ");
          const cardKeywords = cards.map(c => c.keyword).join(", ");
          const cardDescriptions = cards.map(c => c.description).join("\n");

          const prompt = `You are a master taro reader who creates deeply personalized, spiritually resonant interpretations based on the unique energies of each card combination.

CRITICAL: Respond ONLY in English, regardless of the question's language. Always provide the reading in English.


The seeker asked: "${question}"

Here are the specific cards drawn in this unique reading:

${cards.map((c, i) =>
  `Position ${i + 1}: ${c.positionLabel}
Card: ${c.name} (Keyword: ${c.keyword})
Meaning: ${c.description}`
).join("\n\n")}

Now, create a bespoke interpretation that weaves these specific card energies together. Analyze how these particular cards interact and what their unique combination reveals about the seeker's situation.

Focus deeply on:
- The specific symbolism and energies of each individual card
- How these cards relate to each other in this spread
- The unique message this card combination creates for this question
- The spiritual wisdom this particular set of cards brings

Structure your mystical guidance:

🌟 **Divine Message from the Cards** - Interpret the unique energies and symbolism of this specific card combination
⚡ **Sacred Actions to Consider** - Practical spiritual steps based on these particular cards' guidance
🔮 **Mystic Awareness** - Important insights and potential challenges revealed by this card spread
✨ **Soul's Journey** - The deeper spiritual meaning and hope this reading brings

Make this reading feel like it was crafted specifically for this seeker with this exact card combination. Reference the specific cards by name and connect their meanings in meaningful ways. Avoid generic advice - be specific to these cards' energies and symbolism.

Important: This must be a unique interpretation for this specific card spread. Make it feel personal, spiritually deep, and directly connected to these particular cards. Always respond in English.`;

          // Using Hugging Face Inference API with a free model
          const response = await fetch(
            "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                // Note: For production, you'd need to add your API key
                // "Authorization": "Bearer YOUR_HUGGINGFACE_API_KEY"
              },
              body: JSON.stringify({
                inputs: prompt,
                parameters: {
                  max_new_tokens: 300,
                  temperature: 0.7,
                  return_full_text: false
                }
              })
            }
          );

          if (!response.ok) {
            // Fallback to a simple interpretation if API fails
            return generateFallbackInterpretation(cards, question);
          }

          const data = await response.json();
          return data[0]?.generated_text || generateFallbackInterpretation(cards, question);
        } catch (error) {
          console.error("AI API error:", error);
          // Fallback interpretation
          return generateFallbackInterpretation(cards, question);
        }
      };

      // Fallback interpretation if API is unavailable
      const generateFallbackInterpretation = (cards, question) => {
        const cardNames = cards.map(c => c.name).join(", ");
        const themes = cards.map(c => c.keyword).join(", ");

        const cardDetails = cards.map((c, i) =>
          `${c.name} in the ${c.positionLabel} position brings ${c.keyword.toLowerCase()} energy`
        ).join(". ");

        return `🌟 **Divine Message from the Cards:** The sacred combination of ${cardNames} creates a unique spiritual tapestry for your question "${question}". ${cardDetails}. This rare alignment speaks of transformation and divine timing.

⚡ **Sacred Actions to Consider:** Drawing from the specific wisdom of ${cards[0].name}'s ${cards[0].keyword.toLowerCase()} energy, consider embracing new perspectives. The ${cards[1].name} suggests deepening your intuitive connection, while ${cards[2].name} guides you toward authentic action that honors your soul's purpose.

🔮 **Mystic Awareness:** Pay special attention to the ${cards[1].name}'s message about balance and harmony. This card warns against forcing outcomes - trust the natural flow revealed by this divine arrangement.

✨ **Soul's Journey:** This unique card spread carries the blessing of ${themes}. Each card contributes its sacred energy to guide you toward greater wisdom and spiritual growth. Trust that this specific combination appeared for your highest good.`;
      };

      // 2. Select specific spread (1, 3, or CUSTOM cards)
      const handleSelectSpread = async (spread) => {
        setSelectedSpread(spread);
        setAiInterpretation(null);

        // Handle different payment requirements
        if (spread === "ONE") {
          // Free - log usage and start animation
          usageLogger.increment("ONE");
          await startSpreadAnimation(spread);
        } else if (spread === "THREE") {
          // Pay 0.0001 ETH each time for 3-card spread
          try {
            setTxStatus("paying");
            const wallet = await connectWallet();
            if (!wallet) {
              setTxStatus("error");
              alert("Please connect your wallet first");
              return;
            }

            const provider = await ensureBase(wallet.provider);
            const signer = provider.getSigner();

            const result = await payETH(signer, 0.0001);
            setTxHash(result.txHash);
            setTxStatus("success");

            // Log usage and start animation
            usageLogger.increment("THREE");

            // Small delay to show success
            setTimeout(() => {
              setTxStatus("idle");
              startSpreadAnimation(spread);
            }, 2000);
          } catch (error) {
            console.error("Payment failed:", error);
            setTxStatus("error");
            if (error.message.includes("user rejected")) {
              alert("Payment cancelled. 3-card reading requires 0.0001 ETH payment.");
            } else {
              alert(`Payment failed: ${error.message}`);
            }
            return;
          }
        } else if (spread === "CUSTOM") {
          // Pay 0.0005 ETH for custom reading
          try {
            setTxStatus("paying");
            const wallet = await connectWallet();
            if (!wallet) {
              setTxStatus("error");
              alert("Please connect your wallet first");
              return;
            }

            const provider = await ensureBase(wallet.provider);
            const signer = provider.getSigner();

            const result = await payETH(signer, 0.0005);
            setTxHash(result.txHash);
            setTxStatus("success");

            // Log usage and start animation
            usageLogger.increment("CUSTOM");

            // Small delay to show success
            setTimeout(() => {
              setTxStatus("idle");
              startSpreadAnimation(spread);
            }, 2000);
          } catch (error) {
            console.error("Payment failed:", error);
            setTxStatus("error");
            if (error.message.includes("user rejected")) {
              alert("Payment cancelled. Custom reading requires 0.0005 ETH payment.");
            } else {
              alert(`Payment failed: ${error.message}`);
            }
            return;
          }
        }
      };

      const startSpreadAnimation = async (spread) => {
        setIsLoading(true);

        try {
          // Small pause for smoothness
          await new Promise((resolve) => setTimeout(resolve, 300));

          playSpreadSound();
          setGameStage("animating");

          // Small pause for "magical animation"
          setTimeout(async () => {
            let count = 3; // Default for custom
            if (spread === "ONE") count = 1;
            else if (spread === "THREE") count = 3;
            else if (spread === "CUSTOM") count = 3; // Custom always uses 3 cards

            const newCards = getRandomCards(count);

            // Add positional labels based on spread type
            let finalCards;
            if (spread === "THREE") {
              const labeled = newCards.map((card, idx) => ({
                ...card,
                positionLabel:
                  idx === 0
                    ? "Today's Energy"
                    : idx === 1
                    ? "Support"
                    : "Challenge",
              }));
              finalCards = labeled;
            } else if (spread === "CUSTOM") {
              const labeled = newCards.map((card, idx) => ({
                ...card,
                positionLabel:
                  idx === 0
                    ? "Past/Foundation"
                    : idx === 1
                    ? "Present/Situation"
                    : "Future/Guidance",
              }));
              finalCards = labeled;

              // Don't generate AI interpretation yet - wait for user to reveal all cards
            } else {
              finalCards = newCards;
            }

            setCards(finalCards);
            // Save drawn cards to localStorage so they persist
            saveLastDraw(finalCards);

            // Track reading event (locally and on server)
            const readingTypeMap = {
              "ONE": "one",
              "THREE": "three",
              "CUSTOM": "custom"
            };
            const readingType = readingTypeMap[spread] || null;
            
            // Track locally
            (async () => {
              try {
                const identity = await getUserIdentity();
                const fid = identity.fid;
                const wallet = walletAddress || identity.wallet;
                trackReading({ fid, wallet, type: readingType });
              } catch (error) {
                if (import.meta.env.DEV) {
                  console.debug('Failed to track reading locally:', error);
                }
              }
            })();
            
            // Track on server (if API configured)
            trackEvent('reading', readingType, walletAddress).then((stats) => {
              if (stats) {
                setUserStats(stats);
                // Update streak from server if available
                if (stats.streak) {
                  setDailyStreak(stats.streak);
                }
              }
            }).catch((error) => {
              if (import.meta.env.DEV) {
                console.debug('Failed to track reading:', error);
              }
            });

            setRevealedIds([]);
            setActiveCard(null);
            setGameStage("spread");
          }, 1200);
        } catch (err) {
          console.error("Error:", err);
          setGameStage(spread === "CUSTOM" ? "custom" : "idle");
        } finally {
          setIsLoading(false);
        }
      };

      // Generate AI interpretation when all cards are revealed in custom reading
      const generateCustomInterpretation = async () => {
        if (selectedSpread === "CUSTOM" && isAllRevealed && !aiInterpretation && userQuestion.trim()) {
          setIsGeneratingAI(true);
          try {
            const interpretation = await getAIInterpretation(cards, userQuestion);
            setAiInterpretation(interpretation);
          } catch (error) {
            console.error('AI interpretation failed:', error);
            alert('Failed to generate AI interpretation. Please try again.');
          } finally {
            setIsGeneratingAI(false);
          }
        }
      };

      // 3. Click on card → flip + show description
      const handleCardClick = (card) => {
        playButtonSound();
        // If card is already revealed — show description
        if (revealedIds.includes(card.id)) {
          setActiveCard(card);
          setGameStage("reading");
          return;
        }

        // Add card to revealed list
        setRevealedIds((prev) => [...prev, card.id]);
        setActiveCard(card);
        setGameStage("reading");

        // Check if this was the last card in custom reading
        const newRevealedIds = [...revealedIds, card.id];
        if (selectedSpread === "CUSTOM" && newRevealedIds.length === cards.length) {
          // Small delay before generating interpretation
          setTimeout(() => {
            generateCustomInterpretation();
          }, 1000);
        }
      };

      // 4. Close card description (click on background / "Close" button)
      const handleCloseReading = () => {
        // If there are still unrevealed cards → return to spread
        if (cards.some((c) => !revealedIds.includes(c.id))) {
          setGameStage("spread");
        } else {
          // All cards revealed → theoretically can show "New Reading" button
          setGameStage("spread");
        }
        setActiveCard(null);
      };

      // 5. New reading (reset state)
      const handleNewSpread = () => {
        setGameStage("idle");
        setSelectedSpread(null);
        setCards([]);
        setRevealedIds([]);
        setActiveCard(null);
        setTxHash(null);
        setUserQuestion("");
        setAiInterpretation(null);
      };

      const isAllRevealed = cards.length > 0 && cards.every((c) => revealedIds.includes(c.id));

      // Test render - remove this after debugging
      if (testRender) {
        console.log("TaroApp is rendering:", testRender);
      }

      return (
        <div className="taro-root">
          {/* BUILD MARKER: 2026-01-09-1 - Vite Production Build */}
          <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 99999, background: 'red', color: 'white', padding: '4px 8px', fontSize: '10px' }}>
            BUILD: 2026-01-09-1
          </div>
          {/* Mystical background */}
          <div className="taro-background" />

          {/* Top Bar */}
          <div className="topbar">
            <div className="topbar-spacer" />
            <div className="topbar-title">cbTaro</div>
            <div className="topbar-actions">
              <button
                className="icon-btn"
                onClick={() => { playButtonSound(); setSoundEnabled(v => !v); }}
                aria-label="Sound"
                title={soundEnabled ? "Sound: ON" : "Sound: OFF"}
              >
                {soundEnabled ? "🔊" : "🔇"}
              </button>

              <button
                className="icon-btn avatar-btn"
                onClick={handleConnect}
                aria-label="Connect wallet"
                title={isWalletConnected ? `Connected: ${shortAddress(walletAddress)}` : "Connect Wallet"}
              >
                {pfpUrl ? <img className="avatar-img" src={pfpUrl} alt="pfp" /> : <span className="avatar-fallback">🌐</span>}
              </button>

              <button
                className="icon-btn"
                onClick={() => { playButtonSound(); setPreviousGameStage(gameStage); setShowGallery(true); }}
                aria-label="Menu"
                title="Menu"
              >
                ☰
              </button>
            </div>
          </div>

          <div className="taro-container">

            {/* Small block with hash after "payment" (hidden, as payment is disabled) */}
            {txHash && (
              <div className="taro-hash">
                <span>Your reading is recorded:</span>
                <code>{txHash}</code>
              </div>
            )}

            {/* Main area with table and deck/cards */}
            <main className="taro-main">
              {/* Table */}
              <div className={`taro-table ${gameStage === "animating" ? "table-animating" : ""}`}>
                {/* When there's no spread — show deck */}
                {gameStage === "idle" && (
                  <div className="taro-deck" onClick={handleChooseSpreadClick}>
                    <div className="taro-deck-inner" />
                  </div>
                )}

                {/* Control buttons container */}
                <div className="control-buttons">
                  {/* Sound toggle button */}
                  <button
                    className="sound-toggle-btn"
                    onClick={() => { playButtonSound(); setSoundEnabled(!soundEnabled); }}
                    title={soundEnabled ? "Disable sound" : "Enable sound"}
                  >
                    {soundEnabled ? "🔊" : "🔇"}
                  </button>

                  {/* Gallery button with streak badge */}
                  <div className="all-taro-wrap">
                  <button
                    className="gallery-button"
                    onClick={() => { playButtonSound(); setPreviousGameStage(gameStage); setShowGallery(true); }}
                      title="View all taro cards"
                  >
                    ☰
                  </button>
                    <div className="all-taro-right">
                      {/* Daily streak badge - ALWAYS VISIBLE */}
                      <div className="streak-badge">
                        🔥 {streak}
                </div>
                      {/* Admin buttons - only visible for admin wallet */}
                      {isAdminWallet(walletAddress) && (
                        <>
            <button
                            className="admin-button"
                            onClick={async () => {
                playButtonSound();
                              setShowAdminStats(true);
                              setIsLoadingAdminStats(true);
                try {
                                const stats = await getAdminStats(walletAddress);
                                setAdminStats(stats || []);
                } catch (error) {
                                console.error('Failed to load admin stats:', error);
                                alert('Failed to load admin stats. Make sure you are connected with the admin wallet.');
                                setShowAdminStats(false);
                              } finally {
                                setIsLoadingAdminStats(false);
                              }
                            }}
                            title="Admin Statistics"
            >
              📊
            </button>
                    <button
                            className="admin-download-button"
                          onClick={() => {
                            playButtonSound();
                              try {
                                downloadStatsCsv();
                              } catch (error) {
                                console.error('Failed to download stats:', error);
                                alert('Failed to download stats CSV');
                              }
                            }}
                            title="Download stats CSV"
                          >
                            📥
                        </button>
                    </>
                  )}
                      {/* Reading stats (dev mode or if stats available) */}
                      {(import.meta.env.DEV || userStats) && userStats && userStats.total_readings > 0 && (
                        <div className="stats-badge">
                          Reads: {userStats.total_readings}
                          {import.meta.env.DEV && (
                            <span className="stats-breakdown">
                              (1:{userStats.one_card_count} 3:{userStats.three_card_count} C:{userStats.custom_count})
                            </span>
                          )}
                    </div>
                  )}
                </div>
              </div>
                      </div>
                    </div>

          {/* Export CSV button - only visible for admin wallet */}
          {isAdminWallet(walletAddress) && (
            <button
              className="export-csv-btn"
              onClick={() => {
                playButtonSound();
                try {
                  usageLogger.exportCsv();
                } catch (error) {
                  console.error('Export failed:', error);
                  alert('Failed to export CSV');
                }
              }}
              title="Export usage statistics"
            >
              📊
            </button>
          )}

                {/* Spread selection modal */}
                {gameStage === "choosing" && (
                  <div className="taro-modal choosing-modal">
                    <div className="spread-selection">
                      {/* Single card on the left */}
                      <div
                        className="spread-option single-card-option"
                        onClick={() => !isLoading && (playButtonSound(), handleSelectSpread("ONE"))}
                        style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                      >
                        <div className="spread-preview">
                          <div className="preview-card single-preview-card">
                            <div className="preview-card-inner">
                              <div className="preview-card-back"></div>
                              <div className="preview-card-front">
                                <img
                                  src="./Assets/imagine/taro_cards/the_fool.png"
                                  alt="Single Card"
                                  className="preview-card-image"
                                  onError={(e) => {
                                    e.target.src = "./Assets/imagine/taro_cards/the_magician.png";
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Three cards on the right */}
                      <div
                        className="spread-option three-cards-option"
                        onClick={() => !isLoading && (playButtonSound(), handleSelectSpread("THREE"))}
                        style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                      >
                        <div className="spread-preview">
                          <div className="preview-card three-preview-card left-card">
                            <div className="preview-card-inner">
                              <div className="preview-card-back"></div>
                              <div className="preview-card-front">
                                <img
                                  src="./Assets/imagine/taro_cards/the_fool.png"
                                  alt="Three Cards"
                                  className="preview-card-image"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="preview-card three-preview-card center-card">
                            <div className="preview-card-inner">
                              <div className="preview-card-back"></div>
                              <div className="preview-card-front">
                                <img
                                  src="./Assets/imagine/taro_cards/the_magician.png"
                                  alt="Three Cards"
                                  className="preview-card-image"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="preview-card three-preview-card right-card">
                            <div className="preview-card-inner">
                              <div className="preview-card-back"></div>
                              <div className="preview-card-front">
                                <img
                                  src="./Assets/imagine/taro_cards/the_high_priestess.png"
                                  alt="Three Cards"
                                  className="preview-card-image"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom buttons container */}
                    <div className="modal-bottom-buttons">
                    <button
                        className="modal-back-btn"
                        onClick={() => { playButtonSound(); setGameStage("idle"); }}
                        title="Back to main screen"
                      >
                        &lt;
                    </button>
                    <button
                      className="custom-reading-overlay-button"
                      disabled={isLoading}
                      onClick={() => { playButtonSound(); setGameStage("custom"); }}
                    >
                      <img
                        src="./Assets/imagine/cr.png"
                        alt="Custom Reading"
                        className="custom-reading-underlay-image"
                      />
                    </button>
                    </div>
                  </div>
                )}

                {/* Custom reading modal */}
                {gameStage === "custom" && (
                  <div className="taro-modal custom-reading-modal">
                    <div className="custom-modal-content">
                    <textarea
                        className="custom-modal-input"
                      placeholder="What would you like to know? Ask in any language! (e.g., 'Will I find love this year?', 'What should I focus on in my career?', '¿Encontraré el amor este año?')"
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      rows={4}
                      disabled={isLoading}
                    />
                      <div className="custom-modal-actions">
                      <button
                          className="custom-modal-btn secondary"
                        onClick={() => {
                          setGameStage("choosing");
                          setUserQuestion("");
                        }}
                        disabled={isLoading}
                      >
                          &lt;
                      </button>
                      <button
                          className="custom-modal-btn primary"
                        onClick={() => handleSelectSpread("CUSTOM")}
                        disabled={isLoading || !userQuestion.trim()}
                      >
                        {isLoading ? "Reading..." : "Get Reading"}
                      </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment state (not used, as payment is disabled) */}
                {gameStage === "paying" && (
                  <div className="taro-modal">
                    <h2>Processing Transaction…</h2>
                    <p>Please confirm payment in your wallet.</p>
                  </div>
                )}

                {/* Animation before spread */}
                {gameStage === "animating" && (
                  <div className="taro-animating">
                  </div>
                )}

                {/* Card spread (1 or 3 cards) */}
                {(gameStage === "spread" || gameStage === "reading") && (
                  <div className="taro-spread">
                    {cards.map((card, index) => {
                      const isRevealed = revealedIds.includes(card.id);
                      const spreadType = selectedSpread;
                      const offsetClass =
                        spreadType === "THREE"
                          ? index === 0
                            ? "card-left"
                            : index === 1
                            ? "card-center"
                            : "card-right"
                          : "card-single";

                      return (
                        <div
                          key={card.id}
                          className={`taro-card ${offsetClass} ${isRevealed ? "card-revealed" : ""}`}
                          onClick={() => handleCardClick(card)}
                        >
                          <div className="taro-card-inner">
                            {/* Card back */}
                            <div className="taro-card-back"></div>

                            {/* Card face */}
                            <div className="taro-card-front">
                              {card.imagePath ? (
                                <img
                                  src={card.imagePath}
                                  alt={card.name}
                                  className="taro-card-image"
                                  onError={(e) => {
                                    console.error('Failed to load image:', card.imagePath);
                                    e.target.style.display = 'none';
                                    // Show fallback content
                                    e.target.parentElement.innerHTML = `
                                      <div class="taro-card-fallback">
                                        <div class="taro-card-name">${card.name}</div>
                                        <div class="taro-card-keyword">${card.keyword}</div>
                                      </div>
                                    `;
                                  }}
                                />
                              ) : (
                                <div className="taro-card-fallback">
                              <div className="taro-card-name">{card.name}</div>
                              <div className="taro-card-keyword">{card.keyword}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </main>

            {/* Interaction panel at bottom */}
            <footer className="taro-footer">
              {isAllRevealed && gameStage !== "paying" && (
                <>
                  {selectedSpread === "CUSTOM" && (
                    <>
                      {!aiInterpretation && !isGeneratingAI && (
                        <button
                          className="taro-button"
                          onClick={() => {
                            playButtonSound();
                            if (!userQuestion.trim()) {
                              alert('Please enter your question before getting a reading.');
                              return;
                            }
                            generateCustomInterpretation();
                          }}
                          style={{ marginRight: "1rem" }}
                          disabled={isGeneratingAI}
                        >
                          {isGeneratingAI ? "Generating..." : "Get Reading"}
                        </button>
                      )}
                      {isGeneratingAI && (
                        <div className="taro-generating" style={{ marginRight: "1rem", color: "#ffd700" }}>
                          ✨ Generating reading...
                        </div>
                      )}
                      {aiInterpretation && (
                        <button
                          className="taro-button"
                          onClick={() => { playButtonSound(); setAiInterpretation(aiInterpretation); }}
                          style={{ marginRight: "1rem" }}
                        >
                          View AI Reading
                        </button>
                      )}
                    </>
                  )}
                  <button className="taro-button" onClick={() => { playButtonSound(); handleShare(); }}>
                    🔁 Share reading
                  </button>
                  <button className="taro-button secondary" onClick={() => { playButtonSound(); handleNewSpread(); }}>
                    &lt;
                  </button>
                </>
              )}
            </footer>

            {/* Reading panel (card description) */}
            {activeCard && gameStage === "reading" && (
              <div className="taro-reading-overlay" onClick={handleCloseReading}>
                <div className="taro-reading-panel" onClick={(e) => e.stopPropagation()}>
                  <h2>{activeCard.name}</h2>
                  {activeCard.imagePath && (
                    <div className="taro-reading-card-image">
                      <img src={activeCard.imagePath} alt={activeCard.name} />
                    </div>
                  )}
                  {activeCard.positionLabel && (
                    <p className="taro-reading-position">{activeCard.positionLabel}</p>
                  )}
                  <p className="taro-reading-keyword">Keyword: {activeCard.keyword}</p>
                  <p className="taro-reading-text">{activeCard.description}</p>
                </div>
              </div>
            )}

            {/* Gallery modal */}
            {showGallery && (
              <div className="taro-reading-overlay" onClick={() => setShowGallery(false)}>
                <div className="gallery-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="gallery-content">
                    {/* Major Arcana */}
                    <div className="gallery-section">
                      <h3>Major Arcana</h3>
                      <div className="gallery-grid">
                        {ALL_CARDS.slice(0, 22).map((card) => (
                          <div key={card.id} className="gallery-card" onClick={() => {
                            playButtonSound();
                            setActiveCard(card);
                            setGameStage("reading");
                            setShowGallery(false);
                          }}>
                            <img src={card.imagePath} alt={card.name} />
                            <div className="gallery-card-info">
                              <div className="gallery-card-name">{card.name}</div>
                              <div className="gallery-card-keyword">{card.keyword}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Wands */}
                    <div className="gallery-section">
                      <h3>Wands</h3>
                      <div className="gallery-grid">
                        {ALL_CARDS.slice(22, 36).map((card) => (
                          <div key={card.id} className="gallery-card" onClick={() => {
                            playButtonSound();
                            setActiveCard(card);
                            setGameStage("reading");
                            setShowGallery(false);
                          }}>
                            <img src={card.imagePath} alt={card.name} />
                            <div className="gallery-card-info">
                              <div className="gallery-card-name">{card.name}</div>
                              <div className="gallery-card-keyword">{card.keyword}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cups */}
                    <div className="gallery-section">
                      <h3>Cups</h3>
                      <div className="gallery-grid">
                        {ALL_CARDS.slice(36, 50).map((card) => (
                          <div key={card.id} className="gallery-card" onClick={() => {
                            playButtonSound();
                            setActiveCard(card);
                            setGameStage("reading");
                            setShowGallery(false);
                          }}>
                            <img src={card.imagePath} alt={card.name} />
                            <div className="gallery-card-info">
                              <div className="gallery-card-name">{card.name}</div>
                              <div className="gallery-card-keyword">{card.keyword}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Swords */}
                    <div className="gallery-section">
                      <h3>Swords</h3>
                      <div className="gallery-grid">
                        {ALL_CARDS.slice(50, 64).map((card) => (
                          <div key={card.id} className="gallery-card" onClick={() => {
                            playButtonSound();
                            setActiveCard(card);
                            setGameStage("reading");
                            setShowGallery(false);
                          }}>
                            <img src={card.imagePath} alt={card.name} />
                            <div className="gallery-card-info">
                              <div className="gallery-card-name">{card.name}</div>
                              <div className="gallery-card-keyword">{card.keyword}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pentacles */}
                    <div className="gallery-section">
                      <h3>Pentacles</h3>
                      <div className="gallery-grid">
                        {ALL_CARDS.slice(64, 78).map((card) => (
                          <div key={card.id} className="gallery-card" onClick={() => {
                            playButtonSound();
                            setActiveCard(card);
                            setGameStage("reading");
                            setShowGallery(false);
                          }}>
                            <img src={card.imagePath} alt={card.name} />
                            <div className="gallery-card-info">
                              <div className="gallery-card-name">{card.name}</div>
                              <div className="gallery-card-keyword">{card.keyword}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button className="gallery-close-btn" onClick={() => { playButtonSound(); setShowGallery(false); setGameStage(previousGameStage); }}>
                    Close Gallery
                  </button>
                </div>
              </div>
            )}

            {/* Admin Stats modal */}
            {showAdminStats && (
              <div className="taro-reading-overlay" onClick={() => setShowAdminStats(false)}>
                <div className="admin-stats-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="admin-stats-content">
                    <h2>📊 Admin Statistics</h2>
                    {isLoadingAdminStats ? (
                      <div className="admin-stats-loading">Loading statistics...</div>
                    ) : (
                      <>
                        <div className="admin-stats-actions">
                          <button
                            className="admin-export-btn"
                            onClick={async () => {
                              try {
                                playButtonSound();
                                const blob = await exportAdminCSV(walletAddress);
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `cbtaro_stats_${Date.now()}.csv`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                window.URL.revokeObjectURL(url);
                              } catch (error) {
                                console.error('Failed to export CSV:', error);
                                alert('Failed to export CSV. Make sure you are connected with the admin wallet.');
                              }
                            }}
                          >
                            Download CSV
                          </button>
                        </div>
                        <div className="admin-stats-table-container">
                          <table className="admin-stats-table">
                            <thead>
                              <tr>
                                <th>FID</th>
                                <th>Wallet</th>
                                <th>Total Readings</th>
                                <th>One Card</th>
                                <th>Three Card</th>
                                <th>Custom</th>
                                <th>Streak</th>
                                <th>Last Visit</th>
                                <th>Last Seen</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminStats.length === 0 ? (
                                <tr>
                                  <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                                    No statistics available yet.
                                  </td>
                                </tr>
                              ) : (
                                adminStats.map((stat) => (
                                  <tr key={stat.fid}>
                                    <td>{stat.fid}</td>
                                    <td className="wallet-cell">{stat.wallet ? shortAddress(stat.wallet) : '-'}</td>
                                    <td>{stat.total_readings}</td>
                                    <td>{stat.one_card_count}</td>
                                    <td>{stat.three_card_count}</td>
                                    <td>{stat.custom_count}</td>
                                    <td>{stat.streak}</td>
                                    <td>{stat.last_visit_day_key || '-'}</td>
                                    <td>{stat.last_seen_ts ? new Date(stat.last_seen_ts).toLocaleString() : '-'}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                    <button className="admin-close-btn" onClick={() => { playButtonSound(); setShowAdminStats(false); }}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI Interpretation panel for custom reading */}
            {selectedSpread === "CUSTOM" && isAllRevealed && aiInterpretation && (
              <div className="taro-reading-overlay" onClick={() => setAiInterpretation(null)}>
                <div className="taro-reading-panel taro-ai-panel" onClick={(e) => e.stopPropagation()}>
                  <h2>✨ Your Personalized Reading</h2>
                  <p className="taro-reading-question">Question: "{userQuestion}"</p>
                  {isGeneratingAI ? (
                    <div className="taro-ai-loading">
                      Generating reading...
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: aiInterpretation.replace(/\n/g, '<br/>') }} />
                  )}
                  <button className="taro-button" onClick={() => setAiInterpretation(null)}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        );
      }

    export default TaroApp;
