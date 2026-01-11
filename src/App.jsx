import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { buildShareText, shareCast } from './utils/share';
import { updateStreakOnVisit } from './utils/streak';
import { 
  trackEvent, 
  getUserStats, 
  getUserIdentity,
  trackVisit,
  trackReading,
  downloadStatsCsv,
  loadStats,
  getStatsKey
} from './utils/analytics';
import {
  getUserContext,
  triggerHaptic,
  composeCast as miniAppComposeCast,
  openUrl,
  isInMiniApp as checkIsInMiniApp,
} from './utils/miniapp';
import { wagmiConfig } from './config/wagmi.js';

// Taro card data based on tarot.com meanings
// Source: https://www.tarot.com/tarot/cards
const ALL_CARDS = [
  // Major Arcana
  {
    id: 0,
    name: "The Fool",
    keyword: "New Beginnings",
    description: "The Fool represents new beginnings, having faith in the future, being inexperienced, not knowing what to expect, having beginner's luck, improvisation and believing in the universe. This card encourages you to take a leap of faith and embrace the unknown with an open heart.",
    imagePath: "/Assets/imagine/taro_cards/THE FOOL.png",
  },
  {
    id: 1,
    name: "The Magician",
    keyword: "Manifestation",
    description: "The Magician represents manifestation, resourcefulness, power, inspired action, using one's talents and abilities to achieve goals, and the ability to make things happen. This card encourages you to use your skills and resources to create the life you want.",
    imagePath: "/Assets/imagine/taro_cards/THE MAGICIAN.png",
  },
  {
    id: 2,
    name: "The High Priestess",
    keyword: "Intuition",
    description: "The High Priestess represents intuition, spiritual insight, divine feminine, the subconscious mind, and inner wisdom. This card encourages you to trust your intuition and listen to your inner voice for guidance.",
    imagePath: "/Assets/imagine/taro_cards/THE HIGH PRIESTESS.png",
  },
  {
    id: 3,
    name: "The Empress",
    keyword: "Abundance",
    description: "The Empress represents abundance, nurturing, fertility, beauty, and the divine feminine. This card encourages you to embrace your feminine energy, be nurturing to yourself and others, and enjoy the abundance in your life.",
    imagePath: "/Assets/imagine/taro_cards/THE EMPRESS.png",
  },
  {
    id: 4,
    name: "The Emperor",
    keyword: "Authority",
    description: "The Emperor represents authority, structure, control, fatherhood, and stability. This card encourages you to take charge of your life, establish structure, and be a leader in your own life.",
    imagePath: "/Assets/imagine/taro_cards/THE EMPEROR.png",
  },
  {
    id: 5,
    name: "The Hierophant",
    keyword: "Spiritual Guidance",
    description: "The Hierophant represents spiritual guidance, religious beliefs, conformity, tradition, and spiritual wisdom. This card encourages you to seek spiritual guidance and follow your spiritual path.",
    imagePath: "/Assets/imagine/taro_cards/THE HIEROPHANT.png",
  },
  {
    id: 6,
    name: "The Lovers",
    keyword: "Love",
    description: "The Lovers represents love, harmony, relationships, values alignment, and choices. This card encourages you to make choices that align with your values and to embrace love in all its forms.",
    imagePath: "/Assets/imagine/taro_cards/THE LOVERS.png",
  },
  {
    id: 7,
    name: "The Chariot",
    keyword: "Determination",
    description: "The Chariot represents determination, control, willpower, success, and direction. This card encourages you to take control of your life, stay focused on your goals, and move forward with determination.",
    imagePath: "/Assets/imagine/taro_cards/THE CHARIOT.png",
  },
  {
    id: 8,
    name: "Strength",
    keyword: "Inner Strength",
    description: "Strength represents inner strength, courage, compassion, and taming one's instincts. This card encourages you to tap into your inner strength and face challenges with courage and compassion.",
    imagePath: "/Assets/imagine/taro_cards/STRENGTH.png",
  },
  {
    id: 9,
    name: "The Hermit",
    keyword: "Soul Searching",
    description: "The Hermit represents soul searching, introspection, inner guidance, and solitude. This card encourages you to take time for introspection and listen to your inner guidance.",
    imagePath: "/Assets/imagine/taro_cards/THE HERMIT.png",
  },
  {
    id: 10,
    name: "Wheel of Fortune",
    keyword: "Change",
    description: "Wheel of Fortune represents change, cycles, destiny, turning points, and life lessons. This card encourages you to embrace change and trust that everything happens for a reason.",
    imagePath: "/Assets/imagine/taro_cards/WHEEL OF FORTUNE.png",
  },
  {
    id: 11,
    name: "Justice",
    keyword: "Justice",
    description: "Justice represents justice, fairness, truth, cause and effect, and law. This card encourages you to seek justice and fairness in all situations and to take responsibility for your actions.",
    imagePath: "/Assets/imagine/taro_cards/JUSTICE.png",
  },
  {
    id: 12,
    name: "The Hanged Man",
    keyword: "Suspension",
    description: "The Hanged Man represents suspension, restriction, letting go, and sacrifice. This card encourages you to let go of control and surrender to the flow of life.",
    imagePath: "/Assets/imagine/taro_cards/THE HANGED MAN.png",
  },
  {
    id: 13,
    name: "Death",
    keyword: "Endings",
    description: "Death represents endings, beginnings, change, transformation, and transition. This card encourages you to embrace change and transformation as necessary parts of life.",
    imagePath: "/Assets/imagine/taro_cards/DEATH.png",
  },
  {
    id: 14,
    name: "Temperance",
    keyword: "Balance",
    description: "Temperance represents balance, moderation, patience, purpose, and meaning. This card encourages you to find balance in your life and to have patience in achieving your goals.",
    imagePath: "/Assets/imagine/taro_cards/TEMPERANCE.png",
  },
  {
    id: 15,
    name: "The Devil",
    keyword: "Bondage",
    description: "The Devil represents bondage, addiction, sexuality, materialism, and playfulness. This card encourages you to examine what is holding you back and to break free from unhealthy attachments.",
    imagePath: "/Assets/imagine/taro_cards/THE DEVIL.png",
  },
  {
    id: 16,
    name: "The Tower",
    keyword: "Sudden Change",
    description: "The Tower represents sudden change, upheaval, chaos, revelation, and awakening. This card encourages you to embrace change even when it's difficult and to see it as an opportunity for growth.",
    imagePath: "/Assets/imagine/taro_cards/THE TOWER.png",
  },
  {
    id: 17,
    name: "The Star",
    keyword: "Hope",
    description: "The Star represents hope, faith, purpose, renewal, and spirituality. This card encourages you to have faith in the universe and to follow your dreams with hope and optimism.",
    imagePath: "/Assets/imagine/taro_cards/THE STAR.png",
  },
  {
    id: 18,
    name: "The Moon",
    keyword: "Illusion",
    description: "The Moon represents illusion, fear, anxiety, subconscious, and intuition. This card encourages you to trust your intuition and to face your fears rather than letting them control you.",
    imagePath: "/Assets/imagine/taro_cards/THE MOON.png",
  },
  {
    id: 19,
    name: "The Sun",
    keyword: "Positivity",
    description: "The Sun represents positivity, fun, warmth, success, and vitality. This card encourages you to embrace positivity and to celebrate your successes and the good things in your life.",
    imagePath: "/Assets/imagine/taro_cards/THE SUN.png",
  },
  {
    id: 20,
    name: "Judgement",
    keyword: "Judgement",
    description: "Judgement represents judgement, rebirth, inner calling, and absolution. This card encourages you to listen to your inner calling and to forgive yourself and others.",
    imagePath: "/Assets/imagine/taro_cards/JUDGEMENT.png",
  },
  {
    id: 21,
    name: "The World",
    keyword: "Completion",
    description: "The World represents completion, accomplishment, travel, and fulfillment. This card encourages you to celebrate your accomplishments and to embrace the fulfillment that comes from completing your goals.",
    imagePath: "/Assets/imagine/taro_cards/THE WORLD.png",
  },
  // Wands (Fire)
  {
    id: 22,
    name: "Ace of Wands",
    keyword: "Inspiration",
    description: "The Ace of Wands represents inspiration, new opportunities, growth, and potential. This card encourages you to embrace new opportunities and to have faith in your ability to grow and succeed.",
    imagePath: "/Assets/imagine/taro_cards/ACE OF WANDS.png",
  },
  {
    id: 23,
    name: "Two of Wands",
    keyword: "Planning",
    description: "The Two of Wands represents planning, progress, discovery, and making decisions. This card encourages you to plan for the future and to make decisions that will help you progress toward your goals.",
    imagePath: "/Assets/imagine/taro_cards/TWO OF WANDS.png",
  },
  {
    id: 24,
    name: "Three of Wands",
    keyword: "Expansion",
    description: "The Three of Wands represents expansion, foresight, overseas opportunities, and the first stage of fulfillment. This card encourages you to expand your horizons and to look for opportunities beyond your current situation.",
    imagePath: "/Assets/imagine/taro_cards/THREE OF WANDS.png",
  },
  {
    id: 25,
    name: "Four of Wands",
    keyword: "Celebration",
    description: "The Four of Wands represents celebration, harmony, home, and community. This card encourages you to celebrate your achievements and to enjoy the harmony and community in your life.",
    imagePath: "/Assets/imagine/taro_cards/FOUR OF WANDS.png",
  },
  {
    id: 26,
    name: "Five of Wands",
    keyword: "Conflict",
    description: "The Five of Wands represents conflict, disagreements, competition, and tension. This card encourages you to face conflicts head-on and to use them as opportunities for growth and learning.",
    imagePath: "/Assets/imagine/taro_cards/FIVE OF WANDS.png",
  },
  {
    id: 27,
    name: "Six of Wands",
    keyword: "Success",
    description: "The Six of Wands represents success, public recognition, progress, and self-confidence. This card encourages you to celebrate your successes and to have confidence in your abilities.",
    imagePath: "/Assets/imagine/taro_cards/SIX OF WANDS.png",
  },
  {
    id: 28,
    name: "Seven of Wands",
    keyword: "Challenge",
    description: "The Seven of Wands represents challenge, competition, perseverance, and defense. This card encourages you to stand your ground and to persevere through challenges and competition.",
    imagePath: "/Assets/imagine/taro_cards/SEVEN OF WANDS.png",
  },
  {
    id: 29,
    name: "Eight of Wands",
    keyword: "Speed",
    description: "The Eight of Wands represents speed, action, alignment, and air travel. This card encourages you to take action quickly and to align yourself with the flow of the universe.",
    imagePath: "/Assets/imagine/taro_cards/EIGHT OF WANDS.png",
  },
  {
    id: 30,
    name: "Nine of Wands",
    keyword: "Resilience",
    description: "The Nine of Wands represents resilience, courage, persistence, and test of faith. This card encourages you to be resilient and to have faith in your ability to overcome obstacles.",
    imagePath: "/Assets/imagine/taro_cards/NINE OF WANDS.png",
  },
  {
    id: 31,
    name: "Ten of Wands",
    keyword: "Burden",
    description: "The Ten of Wands represents burden, responsibility, hard work, and accomplishment. This card encourages you to take responsibility for your burdens and to work hard to achieve your goals.",
    imagePath: "/Assets/imagine/taro_cards/TEN OF WANDS.png",
  },
  {
    id: 32,
    name: "Page of Wands",
    keyword: "Inspiration",
    description: "The Page of Wands represents inspiration, ideas, discovery, and limitless potential. This card encourages you to embrace new ideas and to explore your limitless potential.",
    imagePath: "/Assets/imagine/taro_cards/PAGE OF WANDS.png",
  },
  {
    id: 33,
    name: "Knight of Wands",
    keyword: "Energy",
    description: "The Knight of Wands represents energy, passion, inspired action, and adventure. This card encourages you to take inspired action and to embrace adventure and passion in your life.",
    imagePath: "/Assets/imagine/taro_cards/KNIGHT OF WANDS.png",
  },
  {
    id: 34,
    name: "Queen of Wands",
    keyword: "Courage",
    description: "The Queen of Wands represents courage, confidence, independence, and social butterfly. This card encourages you to be confident and independent, and to embrace your social nature.",
    imagePath: "/Assets/imagine/taro_cards/QUEEN OF WANDS.png",
  },
  {
    id: 35,
    name: "King of Wands",
    keyword: "Leadership",
    description: "The King of Wands represents leadership, vision, entrepreneur, and honoring commitments. This card encourages you to be a leader and to honor your commitments and vision.",
    imagePath: "/Assets/imagine/taro_cards/KING OF WANDS.png",
  },
  // Cups (Water)
  {
    id: 36,
    name: "Ace of Cups",
    keyword: "Love",
    description: "The Ace of Cups represents love, new relationships, compassion, and creativity. This card encourages you to open your heart to love and to embrace compassion and creativity in your life.",
    imagePath: "/Assets/imagine/taro_cards/ACE OF CUPS.png",
  },
  {
    id: 37,
    name: "Two of Cups",
    keyword: "Unity",
    description: "The Two of Cups represents unity, partnership, mutual attraction, and love. This card encourages you to seek unity and partnership in your relationships and to embrace mutual attraction and love.",
    imagePath: "/Assets/imagine/taro_cards/TWO OF CUPS.png",
  },
  {
    id: 38,
    name: "Three of Cups",
    keyword: "Celebration",
    description: "The Three of Cups represents celebration, friendship, creativity, and community. This card encourages you to celebrate with friends and to embrace creativity and community in your life.",
    imagePath: "/Assets/imagine/taro_cards/THREE OF CUPS.png",
  },
  {
    id: 39,
    name: "Four of Cups",
    keyword: "Meditation",
    description: "The Four of Cups represents meditation, contemplation, apathy, and reevaluation. This card encourages you to take time for meditation and contemplation, and to reevaluate your situation.",
    imagePath: "/Assets/imagine/taro_cards/FOUR OF CUPS.png",
  },
  {
    id: 40,
    name: "Five of Cups",
    keyword: "Regret",
    description: "The Five of Cups represents regret, failure, disappointment, and pessimism. This card encourages you to learn from your disappointments and to focus on what you still have rather than what you've lost.",
    imagePath: "/Assets/imagine/taro_cards/FIVE OF CUPS.png",
  },
  {
    id: 41,
    name: "Six of Cups",
    keyword: "Revisiting",
    description: "The Six of Cups represents revisiting the past, childhood memories, innocence, and joy. This card encourages you to revisit happy memories from your past and to embrace innocence and joy in your life.",
    imagePath: "/Assets/imagine/taro_cards/SIX OF CUPS.png",
  },
  {
    id: 42,
    name: "Seven of Cups",
    keyword: "Opportunity",
    description: "The Seven of Cups represents opportunity, choices, wishful thinking, and illusion. This card encourages you to make wise choices and to distinguish between real opportunities and illusions.",
    imagePath: "/Assets/imagine/taro_cards/SEVEN OF CUPS.png",
  },
  {
    id: 43,
    name: "Eight of Cups",
    keyword: "Disappointment",
    description: "The Eight of Cups represents disappointment, abandonment, withdrawal, and escapism. This card encourages you to move on from disappointing situations and to seek fulfillment elsewhere.",
    imagePath: "/Assets/imagine/taro_cards/EIGHT OF CUPS.png",
  },
  {
    id: 44,
    name: "Nine of Cups",
    keyword: "Contentment",
    description: "The Nine of Cups represents contentment, satisfaction, gratitude, and wish come true. This card encourages you to be grateful for what you have and to enjoy the satisfaction of having your wishes fulfilled.",
    imagePath: "/Assets/imagine/taro_cards/NINE OF CUPS.png",
  },
  {
    id: 45,
    name: "Ten of Cups",
    keyword: "Divine Love",
    description: "The Ten of Cups represents divine love, blissful relationships, harmony, and alignment. This card encourages you to seek divine love and harmony in your relationships and life.",
    imagePath: "/Assets/imagine/taro_cards/TEN OF CUPS.png",
  },
  {
    id: 46,
    name: "Page of Cups",
    keyword: "Creative Opportunities",
    description: "The Page of Cups represents creative opportunities, intuitive messages, and curiosity. This card encourages you to be open to creative opportunities and to listen to your intuition.",
    imagePath: "/Assets/imagine/taro_cards/PAGE OF CUPS.png",
  },
  {
    id: 47,
    name: "Knight of Cups",
    keyword: "Creativity",
    description: "The Knight of Cups represents creativity, romance, bringing or receiving a message, and taking action. This card encourages you to be creative and to take action on your romantic and creative impulses.",
    imagePath: "/Assets/imagine/taro_cards/KNIGHT OF CUPS.png",
  },
  {
    id: 48,
    name: "Queen of Cups",
    keyword: "Compassionate",
    description: "The Queen of Cups represents compassionate, caring, emotionally stable, intuitive, and in flow. This card encourages you to be compassionate and caring, and to trust your intuition.",
    imagePath: "/Assets/imagine/taro_cards/QUEEN OF CUPS.png",
  },
  {
    id: 49,
    name: "King of Cups",
    keyword: "Emotionally Balanced",
    description: "The King of Cups represents emotionally balanced, compassionate, diplomatic, and wise. This card encourages you to be emotionally balanced and to use your wisdom and compassion in your dealings with others.",
    imagePath: "/Assets/imagine/taro_cards/KING OF CUPS.png",
  },
  // Swords (Air)
  {
    id: 50,
    name: "Ace of Swords",
    keyword: "Breakthroughs",
    description: "The Ace of Swords represents breakthroughs, new ideas, mental clarity, and success. This card encourages you to embrace new ideas and to seek mental clarity and success.",
    imagePath: "/Assets/imagine/taro_cards/ACE OF SWORDS.png",
  },
  {
    id: 51,
    name: "Two of Swords",
    keyword: "Difficult Decisions",
    description: "The Two of Swords represents difficult decisions, weighing options, inner conflict, and stalemate. This card encourages you to make difficult decisions and to resolve inner conflicts.",
    imagePath: "/Assets/imagine/taro_cards/TWO OF SWORDS.png",
  },
  {
    id: 52,
    name: "Three of Swords",
    keyword: "Heartbreak",
    description: "The Three of Swords represents heartbreak, emotional pain, sorrow, grief, and hurt. This card encourages you to acknowledge your pain and to work through your grief to heal.",
    imagePath: "/Assets/imagine/taro_cards/THREE OF SWARDS.png",
  },
  {
    id: 53,
    name: "Four of Swords",
    keyword: "Rest",
    description: "The Four of Swords represents rest, relaxation, meditation, and contemplation. This card encourages you to take time for rest and relaxation to recharge your energy.",
    imagePath: "/Assets/imagine/taro_cards/FOUR OF SWORDS.png",
  },
  {
    id: 54,
    name: "Five of Swords",
    keyword: "Conflict",
    description: "The Five of Swords represents conflict, disagreements, competition, defeat, and winning at all costs. This card encourages you to consider the cost of winning and to seek peaceful resolutions to conflicts.",
    imagePath: "/Assets/imagine/taro_cards/FIVE OF SWARDS.png",
  },
  {
    id: 55,
    name: "Six of Swords",
    keyword: "Transition",
    description: "The Six of Swords represents transition, change, rite of passage, and releasing baggage. This card encourages you to embrace change and to release baggage that is holding you back.",
    imagePath: "/Assets/imagine/taro_cards/SIX OF SWORDS.png",
  },
  {
    id: 56,
    name: "Seven of Swords",
    keyword: "Betrayal",
    description: "The Seven of Swords represents betrayal, deception, getting away with something, and acting strategically. This card encourages you to be aware of deception and to act strategically in your dealings.",
    imagePath: "/Assets/imagine/taro_cards/SEVEN OF SWORDS.png",
  },
  {
    id: 57,
    name: "Eight of Swords",
    keyword: "Negative Thoughts",
    description: "The Eight of Swords represents negative thoughts, self-imposed restriction, inner critic, and releasing negative thoughts. This card encourages you to release negative thoughts and to free yourself from self-imposed restrictions.",
    imagePath: "/Assets/imagine/taro_cards/EIGHT OF SWORDS.png",
  },
  {
    id: 58,
    name: "Nine of Swords",
    keyword: "Anxiety",
    description: "The Nine of Swords represents anxiety, worry, fear, depression, and nightmares. This card encourages you to face your fears and to seek help if you're struggling with anxiety or depression.",
    imagePath: "/Assets/imagine/taro_cards/NINE OF SWORDS.png",
  },
  {
    id: 59,
    name: "Ten of Swords",
    keyword: "Painful Endings",
    description: "The Ten of Swords represents painful endings, deep wounds, betrayal, and loss. This card encourages you to accept painful endings and to use them as opportunities for new beginnings.",
    imagePath: "/Assets/imagine/taro_cards/TEN OF SWORDS.png",
  },
  {
    id: 60,
    name: "Page of Swords",
    keyword: "New Ideas",
    description: "The Page of Swords represents new ideas, curiosity, thirst for knowledge, and new ways of communicating. This card encourages you to embrace new ideas and to communicate in new ways.",
    imagePath: "/Assets/imagine/taro_cards/PAGE OF SWORDS.png",
  },
  {
    id: 61,
    name: "Knight of Swords",
    keyword: "Ambitious",
    description: "The Knight of Swords represents ambitious, action-oriented, driven to succeed, and fast-thinking. This card encourages you to be ambitious and action-oriented in pursuing your goals.",
    imagePath: "/Assets/imagine/taro_cards/KNIGHT OF SWORDS.png",
  },
  {
    id: 62,
    name: "Queen of Swords",
    keyword: "Independent",
    description: "The Queen of Swords represents independent, unbiased judgement, clear boundaries, and direct communication. This card encourages you to be independent and to communicate clearly and directly.",
    imagePath: "/Assets/imagine/taro_cards/QUEEN OF SWORDS.png",
  },
  {
    id: 63,
    name: "King of Swords",
    keyword: "Mental Clarity",
    description: "The King of Swords represents mental clarity, intellectual power, authority, and truth. This card encourages you to seek mental clarity and to use your intellectual power wisely.",
    imagePath: "/Assets/imagine/taro_cards/KING OF SWORDS.png",
  },
  // Pentacles (Earth)
  {
    id: 64,
    name: "Ace of Pentacles",
    keyword: "A New Financial or Career Opportunity",
    description: "The Ace of Pentacles represents a new financial or career opportunity, manifestation, abundance, and prosperity. This card encourages you to embrace new opportunities for financial and career growth.",
    imagePath: "/Assets/imagine/taro_cards/ACE OF PENTACLES.png",
  },
  {
    id: 65,
    name: "Two of Pentacles",
    keyword: "Multiple Priorities",
    description: "The Two of Pentacles represents multiple priorities, time management, prioritisation, and organisation. This card encourages you to manage your time and priorities effectively.",
    imagePath: "/Assets/imagine/taro_cards/TWO OF PENTACLES.png",
  },
  {
    id: 66,
    name: "Three of Pentacles",
    keyword: "Collaboration",
    description: "The Three of Pentacles represents collaboration, learning, implementation, and teamwork. This card encourages you to collaborate with others and to learn from teamwork.",
    imagePath: "/Assets/imagine/taro_cards/THREE OF PENTACLES.png",
  },
  {
    id: 67,
    name: "Four of Pentacles",
    keyword: "Saving Money",
    description: "The Four of Pentacles represents saving money, security, conservatism, and scarcity. This card encourages you to save money and to build financial security.",
    imagePath: "/Assets/imagine/taro_cards/FOUR OF PENTACLES.png",
  },
  {
    id: 68,
    name: "Five of Pentacles",
    keyword: "Financial Loss",
    description: "The Five of Pentacles represents financial loss, poverty, lack mindset, isolation, and loneliness. This card encourages you to change your mindset from lack to abundance and to seek support when needed.",
    imagePath: "/Assets/imagine/taro_cards/FIVE OF PENTACLES.png",
  },
  {
    id: 69,
    name: "Six of Pentacles",
    keyword: "Giving",
    description: "The Six of Pentacles represents giving, receiving, sharing wealth, generosity, and charity. This card encourages you to give generously and to share your wealth with others.",
    imagePath: "/Assets/imagine/taro_cards/SIX OF PENTACLES.png",
  },
  {
    id: 70,
    name: "Seven of Pentacles",
    keyword: "Long-Term View",
    description: "The Seven of Pentacles represents long-term view, sustainable results, perseverance, and investment. This card encourages you to take a long-term view and to persevere in your investments and efforts.",
    imagePath: "/Assets/imagine/taro_cards/SEVEN OF PENTACLES.png",
  },
  {
    id: 71,
    name: "Eight of Pentacles",
    keyword: "Apprenticeship",
    description: "The Eight of Pentacles represents apprenticeship, repetitive tasks, mastery, skill development, and dedication. This card encourages you to dedicate yourself to mastering your skills.",
    imagePath: "/Assets/imagine/taro_cards/EIGHT OF PENTACLES.png",
  },
  {
    id: 72,
    name: "Nine of Pentacles",
    keyword: "Abundance",
    description: "The Nine of Pentacles represents abundance, luxury, self-sufficiency, and financial independence. This card encourages you to enjoy abundance and to build financial independence.",
    imagePath: "/Assets/imagine/taro_cards/NINE OF PENTACLES.png",
  },
  {
    id: 73,
    name: "Ten of Pentacles",
    keyword: "Wealth",
    description: "The Ten of Pentacles represents wealth, financial security, family, long-term success, and contribution. This card encourages you to build wealth and to contribute to your family's long-term success.",
    imagePath: "/Assets/imagine/taro_cards/TEN OF PENTACLES.png",
  },
  {
    id: 74,
    name: "Page of Pentacles",
    keyword: "Learning",
    description: "The Page of Pentacles represents learning, studying, apprenticeship, and new ideas. This card encourages you to embrace learning and to study new ideas and concepts.",
    imagePath: "/Assets/imagine/taro_cards/PAGE OF PENTACLES.png",
  },
  {
    id: 75,
    name: "Knight of Pentacles",
    keyword: "Hard Work",
    description: "The Knight of Pentacles represents hard work, productivity, routine, and conservatism. This card encourages you to work hard and to be productive in your routine tasks.",
    imagePath: "/Assets/imagine/taro_cards/KNIGHT OF PENTACLES.png",
  },
  {
    id: 76,
    name: "Queen of Pentacles",
    keyword: "Nurturing",
    description: "The Queen of Pentacles represents nurturing, practical, providing financially and emotionally, and being down-to-earth. This card encourages you to nurture yourself and others, both financially and emotionally.",
    imagePath: "/Assets/imagine/taro_cards/QUEEN OF PENTACLES.png",
  },
  {
    id: 77,
    name: "King of Pentacles",
    keyword: "Financial Success",
    description: "The King of Pentacles represents financial success, business acumen, security, and discipline. This card encourages you to build financial success through business acumen and discipline.",
    imagePath: "/Assets/imagine/taro_cards/KING OF PENTACLES.png",
  },
];

function getRandomCards(count) {
  const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function TaroApp() {
  // Base path for GitHub Pages deployment
  const basePath = '/cbTARO';

  // Wallet connection using wagmi (like friend's example)
  const { isConnected, address } = useAccount();

  // Example function for calling smart contract (like friend's example)
  // async function handleClick() {
  //   if (!isConnected || !address) {
  //     return;
  //   }
  // 
  //   const { request } = await simulateContract(wagmiConfig, {
  //     account: address,
  //     address: chainConfig.contracts.checkIn,
  //     abi: checkInAbi,
  //     functionName: "checkInToBattle",
  //     args: [battleId],
  //   });
  //   const hash = await writeContract(wagmiConfig, request);
  //   await waitForTransactionReceipt(wagmiConfig, { hash, confirmations: 2 });
  // }

  const [gameStage, setGameStage] = useState("idle");
  const [selectedSpread, setSelectedSpread] = useState(null);
  const [cards, setCards] = useState([]);
  const [revealedIds, setRevealedIds] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");
  const [aiInterpretation, setAiInterpretation] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [previousGameStage, setPreviousGameStage] = useState("idle");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [streak, setStreak] = useState(0); // Simple streak state for UI
  const [userStats, setUserStats] = useState(null);

  // Farcaster states
  const [fid, setFid] = useState(null);
  const [pfpUrl, setPfpUrl] = useState(null);

  // Last reading state - "single source of truth" for share functionality
  const [lastReading, setLastReading] = useState(null);

  // Shared cast params state
  const [sharedFromCast, setSharedFromCast] = useState(false);

  // Share helper constants and functions (defined early for use in useEffect)
  const APP_URL = "https://0xagcheth.github.io/cbTARO/";
  const LAST_READING_KEY = "cbtaro:lastReading";
  
  /**
   * Convert relative path to absolute URL
   * @param {string} maybeRelative - Relative or absolute path
   * @returns {string} Absolute URL
   */
  function toAbsoluteUrl(maybeRelative) {
    if (!maybeRelative) return null;
    // If already absolute URL, return as is
    if (maybeRelative.startsWith('http://') || maybeRelative.startsWith('https://')) {
      return maybeRelative;
    }
    // Normalize relative path
    let cleanPath = maybeRelative.replace(/^\.\//, '').replace(/^\//, '');
    // Remove "public/" if present (GitHub Pages serves /public at root)
    cleanPath = cleanPath.replace(/^public\//, '');
    // Build absolute URL
    return new URL(cleanPath, APP_URL).toString();
  }
  
  /**
   * Load last reading from localStorage
   * @returns {Reading|null} Reading object or null
   */
  function loadLastReading() {
    try {
      const saved = localStorage.getItem(LAST_READING_KEY);
      if (!saved) return null;
      
      const reading = JSON.parse(saved);
      
      // Validate reading structure
      if (!reading || typeof reading !== 'object') {
        console.warn('Invalid reading format in localStorage');
        return null;
      }
      
      // Check required fields
      if (!reading.name || !reading.text || !reading.imageUrl) {
        console.warn('Reading missing required fields:', reading);
        return null;
      }
      
      // Validate imageUrl is absolute https URL
      if (!reading.imageUrl.startsWith('https://')) {
        console.warn('Reading imageUrl is not absolute https URL:', reading.imageUrl);
        // Try to fix it
        reading.imageUrl = toAbsoluteUrl(reading.imagePath || reading.imageUrl);
        if (!reading.imageUrl || !reading.imageUrl.startsWith('https://')) {
          return null;
        }
      }
      
      return reading;
              } catch (error) {
      console.warn('Failed to load last reading:', error);
      return null;
    }
  }

  // Check if we're in Farcaster Mini App environment
  const isInMiniApp = window.isInMiniApp || false;
  
  // Initialize Mini App and get user context
  useEffect(() => {
    async function initializeApp() {
      const isFarcasterApp = /farcaster/i.test(navigator.userAgent);
      const isBaseApp = /base/i.test(navigator.userAgent) || window.location.hostname.includes('base.org');
      
      console.log('🔍 [DIAGNOSTIC] App initialized:', {
        location: window.location.href,
        userAgent: navigator.userAgent,
        environment: isFarcasterApp ? 'Farcaster' : isBaseApp ? 'Base' : 'Browser',
        inMiniApp: isInMiniApp
      });

      // Get Farcaster user context if in Mini App
      if (isInMiniApp) {
        try {
          const userContext = await getUserContext();
          if (userContext) {
            console.log('[miniapp] 👤 User context loaded:', {
              fid: userContext.fid,
              username: userContext.username,
              displayName: userContext.displayName,
              theme: userContext.theme,
            });

            // Store FID and pfp for analytics
            if (userContext.fid) {
              setFid(userContext.fid);
            }
            if (userContext.pfpUrl) {
              setPfpUrl(userContext.pfpUrl);
            }

            // Auto-track visit with FID
            if (userContext.fid) {
              await trackVisit(userContext.fid, null);
            }
          }
              } catch (error) {
          console.error('[miniapp] Failed to get user context:', error);
        }
      }
    }

    initializeApp();
  }, [isInMiniApp]);

  // Update daily streak on mount and track visit
  // Also restore lastReading from localStorage
  useEffect(() => {
    // Restore lastReading from localStorage
    const savedReading = loadLastReading();
    if (savedReading) {
      setLastReading(savedReading);
      if (import.meta.env.DEV) {
        console.debug('Restored lastReading from localStorage:', savedReading);
      }
    }
    
    // Check if opened from shared cast
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sharedCastHash = urlParams.get('sharedCastHash') || localStorage.getItem('cbTARO_sharedCastHash');
      const sharedCastFid = urlParams.get('sharedCastFid') || localStorage.getItem('cbTARO_sharedCastFid');
      const viewerFid = urlParams.get('viewerFid') || localStorage.getItem('cbTARO_viewerFid');

      if (sharedCastHash || sharedCastFid || viewerFid) {
        setSharedFromCast(true);
        console.log('[cbTARO] Opened from shared cast:', { sharedCastHash, sharedCastFid, viewerFid });
        
        // Auto-hide notice after 5 seconds
        setTimeout(() => {
          setSharedFromCast(false);
        }, 5000);
      }
              } catch (error) {
      console.warn('[cbTARO] Failed to check shared params:', error);
    }
    
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
      const identity = { fid: null };
      const key = getStatsKey(identity.fid, null);
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
        // Get user identity (fid)
        const identity = await getUserIdentity();
        const fid = identity.fid;
        
        // Track visit locally
        trackVisit({ fid });
        
        // Update streak from local stats after tracking
        const stats = loadStats();
        const key = getStatsKey(fid);
        const row = stats.rows[key];
        if (row && row.streak) {
          const updatedStreak = Number(row.streak) || 0;
          setStreak(updatedStreak);
          setDailyStreak(updatedStreak);
        }
        
        // Track visit on server (if API configured)
        const serverStats = await trackEvent('visit', null, null);
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

  // Farcaster Mini App SDK ready() is called in src/main.jsx
  // No need to duplicate here - main.jsx handles it after DOMContentLoaded and React render


      // Function to play button sound with haptic feedback
      const playButtonSound = async () => {
        // Haptic feedback for Farcaster Mini App
        await triggerHaptic('light');
        
        // Audio feedback
        if (!soundEnabled) return;
        const audio = new Audio('/Assets/audio/tab.mp3');
        audio.volume = 0.3; // Set volume to 30%
        audio.play().catch(e => console.log('Audio play failed:', e));
      };

      // Function to play spread animation sound
      const playSpreadSound = () => {
        if (!soundEnabled) return;
        const audio = new Audio('/Assets/audio/spread.mp3');
        audio.volume = 0.4; // Set volume to 40%
        audio.play().catch(e => console.log('Audio play failed:', e));
      };

      /**
       * Get Farcaster Mini App SDK instance
       * @returns {Object|null} SDK instance or null
       */
      const getFarcasterSDK = () => {
        // Try multiple possible SDK locations
        return window.miniAppSDK || 
               window.farcaster?.sdk || 
               window.farcaster || 
               window.farcasterSDK || 
               window.sdk || 
               window.FarcasterSDK || 
               null;
      };

      /**
       * Check if we're in Mini App environment (Farcaster or Base)
       * @returns {boolean}
       */
      const isInMiniAppEnvironment = () => {
        const sdk = getFarcasterSDK();
        if (!sdk) return false;
        
        // Check if SDK has isInMiniApp method
        if (typeof sdk.isInMiniApp === 'function') {
          return sdk.isInMiniApp();
        }
        
        
        // Check window flags
        return window.isInMiniApp === true;
      };



      // Usage Logger Module
      const usageLogger = {
        // Get identity from Mini App context
        getIdentity() {
          let fid = '';

          // Try to get FID from Farcaster context (if available in Mini App)
          if (window.farcaster && window.farcaster.user) {
            fid = window.farcaster.user.fid || '';
          }

          return { fid };
        },

        // Generate storage key for identity
        getStorageKey() {
          const { fid } = this.getIdentity();
          return `cbtaro_usage_${fid || 'unknown'}`;
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
            const { fid } = this.getIdentity();
            const counts = this.loadCounts();

            // Create CSV content
            const csvContent = [
              'fid,oneCardCount,threeCardCount,customCount',
              `${fid},${counts.oneCardCount},${counts.threeCardCount},${counts.customCount}`
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

      // Share helper functions (continued - functions that use state)
      
      /**
       * Reading type definition
       * @typedef {Object} Reading
       * @property {string} id - Stable card ID (e.g., "the_fool")
       * @property {string} name - Visible card name
       * @property {string} text - Short interpretation/description
       * @property {string} imageUrl - Absolute https URL to card image (required)
       * @property {number} createdAt - Date.now() timestamp
       */
      
      /**
       * Get first drawn card from cards array
       * @param {Array} cards - Array of card objects
       * @returns {Object|null} First card or null
       */
      function getFirstDrawnCard(cards) {
        return (cards && cards.length > 0) ? cards[0] : null;
      }
      
      /**
       * Create Reading object from first card
       * @param {Array} cards - Array of card objects
       * @returns {Reading|null} Reading object or null
       */
      function createReadingFromCards(cards) {
        const firstCard = getFirstDrawnCard(cards);
        if (!firstCard) return null;
        
        // Generate stable ID from card name (lowercase, replace spaces with underscores)
        const cardId = firstCard.name.toLowerCase().replace(/\s+/g, '_');
        
        // Get absolute image URL
        const imageUrl = toAbsoluteUrl(firstCard.imagePath);
        if (!imageUrl || !imageUrl.startsWith('https://')) {
          console.warn('Invalid imageUrl for card:', firstCard.name);
          return null;
        }
        
        return {
          id: cardId,
          name: firstCard.name,
          text: firstCard.description || firstCard.keyword || '',
          imageUrl: imageUrl,
          createdAt: Date.now()
        };
      }
      
      /**
       * Save last reading to localStorage and state
       * @param {Array} cards - Array of card objects
       */
      function saveLastReading(cards) {
        const reading = createReadingFromCards(cards);
        if (!reading) {
          console.warn('Failed to create reading from cards');
          return;
        }
        
        // Update state
        setLastReading(reading);
        
        // Save to localStorage
        try {
          localStorage.setItem(LAST_READING_KEY, JSON.stringify(reading));
          if (import.meta.env.DEV) {
            console.debug('lastReading set:', reading);
          }
        } catch (error) {
          console.warn('Failed to save last reading:', error);
        }
      }
      
      // Legacy functions for backward compatibility (kept for now)
      function saveLastDraw(cards) {
        saveLastReading(cards);
      }
      
      function loadLastDraw() {
        const reading = loadLastReading();
        if (reading) {
          return {
            name: reading.name,
            imagePath: reading.imageUrl, // Legacy compatibility
            imageUrl: reading.imageUrl,
            timestamp: reading.createdAt
          };
        }
        return null;
      }

      /**
       * Build share payload from reading
       * @param {Reading} reading - Reading object
       * @returns {Object} Share payload with text and embeds
       */
      function buildSharePayload(reading) {
        if (!reading) return null;
        
        const baseShare = "https://0xagcheth.github.io/cbTARO/share";
        // Cache-bust parameter: v=Date.now() forces embed refresh (prevents caching)
        // This ensures Farcaster always fetches fresh meta tags for embed preview
        const shareUrl = `${baseShare}?v=${Date.now()}`;
        
        // Format text: card name + description + share link
        // shareUrl must be the last line with NO trailing whitespace
        const text = `🔮 cbTARO reading: ${reading.name}\n\n${reading.text}\n\n${shareUrl}`;
        
        // Embeds: first card image, then share URL (order matters)
        // shareUrl in embeds ensures embed card rendering
        const embeds = [reading.imageUrl, shareUrl];
        
        return { text, embeds };
      }

      /**
       * Share Daily Taro - Farcaster Mini App sharing
       * Strategy:
       * 1. Farcaster Mini App SDK composeCast if available
       * 2. Fallback to Warpcast compose URL
       * IMPORTANT: appUrl must be in text (not only in embeds)
       */
      async function shareDailyTaro() {
        const baseShare = "https://0xagcheth.github.io/cbTARO/share";
        // Cache-bust parameter: v=Date.now() forces embed refresh (prevents caching)
        // This ensures Farcaster always fetches fresh meta tags for embed preview
        const shareUrl = `${baseShare}?v=${Date.now()}`;
        
        const message = `🃏 Daily Taro

Today's card gave me a clear signal.
Sometimes one card is all you need.

🔮 Pulled with cbTARO on Base`;

        // IMPORTANT: shareUrl must be the last line with NO trailing whitespace/newlines
        // This ensures Farcaster can properly detect and render the embed card
        const castText = `${message}\n${shareUrl}`;

        try {
          // 1. Try Farcaster Mini App SDK first
          const sdk = window.miniAppSDK || window.farcaster?.sdk || window.farcaster || window.farcasterSDK || window.sdk || window.FarcasterSDK;
          const isInMiniApp = window.isInMiniApp || (sdk && typeof sdk.isInMiniApp === 'function' && sdk.isInMiniApp());
          
          if (isInMiniApp && sdk?.actions?.composeCast) {
            try {
              // Pass shareUrl in embeds to force embed card rendering
              // castText already contains shareUrl at the end, but embeds ensures preview
              await sdk.actions.composeCast({
                text: castText,
                embeds: [shareUrl]  // Embed shareUrl to render embed card
              });
              if (import.meta.env.DEV) {
                console.debug('[cbTARO] Shared via Farcaster Mini App SDK');
              }
              return true;
            } catch (error) {
              console.warn('[cbTARO] SDK composeCast failed, using fallback:', error);
              // Continue to fallback
            }
          }

          // 2. Fallback: Farcaster compose URL
          // castText already contains shareUrl at the end
          try {
            window.open(`https://farcaster.xyz/~/compose?text=${encodeURIComponent(castText)}`, "_blank");
            return true;
          } catch (error) {
            console.error('[cbTARO] Failed to open Farcaster compose:', error);
            return false;
          }
        } catch (error) {
          console.error('[cbTARO] shareDailyTaro failed:', error);
          // Last resort: try Warpcast URL
          try {
            const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(finalText)}`;
            window.open(composeUrl, '_blank', 'noopener,noreferrer');
            return true;
          } catch (e) {
            console.error('[cbTARO] Final fallback also failed:', e);
            return false;
          }
        }
      }

      const handleShare = async () => {
        try {
          playButtonSound();

          // Share Daily Taro using shareDailyTaro function
          await shareDailyTaro();
        } catch (error) {
          console.error('Share failed:', error);
          alert('Failed to share. Please try again.');
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

        // All spreads are free
        if (spread === "ONE") {
          usageLogger.increment("ONE");
          await startSpreadAnimation(spread);
        } else if (spread === "THREE") {
          usageLogger.increment("THREE");
          await startSpreadAnimation(spread);
        } else if (spread === "CUSTOM") {
          usageLogger.increment("CUSTOM");
          await startSpreadAnimation(spread);
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
            // Save last reading to localStorage and state
            saveLastReading(finalCards);

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
                trackReading({ fid, type: readingType });
              } catch (error) {
                if (import.meta.env.DEV) {
                  console.debug('Failed to track reading locally:', error);
                }
              }
            })();
            
            // Track on server (if API configured)
            trackEvent('reading', readingType, null).then((stats) => {
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

              {/* Avatar display */}
              {pfpUrl && (
                <div className="icon-btn avatar-btn" title="Profile">
                  <img className="avatar-img" src={pfpUrl} alt="pfp" />
                </div>
              )}

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

            {/* Main area with table and deck/cards */}
            <main className="taro-main">
              {/* Table */}
              <div className={`taro-table ${gameStage === "animating" ? "table-animating" : ""}`}>
                {/* When there's no spread — show deck */}
                {/* Shared cast notice */}
                {sharedFromCast && (
                  <div style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(75, 144, 226, 0.9)',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    zIndex: 10000,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    maxWidth: '90%',
                    textAlign: 'center'
                  }}>
                    Opened from shared cast
                  </div>
                )}

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
                        <div className="spread-label">Free</div>
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
                        <div className="spread-label">0.0001 ETH</div>
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
                      <div className="custom-modal-price-label">
                        Custom Reading: 0.001 ETH
                      </div>
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
              {isAllRevealed && (
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
                  <button 
                    className="taro-button" 
                    onClick={() => { playButtonSound(); handleShare(); }}
                    disabled={!lastReading}
                    title={!lastReading ? "Draw a card first" : "Share last reading"}
                  >
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
