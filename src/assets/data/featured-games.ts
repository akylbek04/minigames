import type { Game } from "../../types/game";
import vacationCafeSimulator from "../images/games/vacation-cafe-simulator-card.jpg";
import winterBurrow from "../images/games/winter-burrow-card.jpg";
import shelveThePotions from "../images/games/shelve-the-potions-card.jpg";
import heartopia from "../images/games/heartopia-card.jpg";
import palia from "../images/games/palia-card.jpg";
import catMailCo from "../images/games/cat-mail-co-card.jpg";
import tinyGlade from "../images/games/tiny-glade-card.jpg";
import tailsideCozyCafeSim from "../images/games/tailside-cozy-cafe-sim-card.jpg";
import islandersNewShores from "../images/games/islanders-new-shores-card.jpg";

export const featuredGames: Game[] = [
  {
    slug: "vacation-cafe-simulator",
    name: "Vacation Cafe Simulator",
    category: "strategy",
    price: "Free",
    shortDescription:
      "Cozy Italian Vacation Cafe. No timers, no stress, cook traditional dishes, upgrade and customize, just relax and grow your dream cafe.",
    rating: 4.8,
    likesCount: 28_750,
    cardImage: vacationCafeSimulator,
    featured: true,
  },
  {
    slug: "winter-burrow",
    name: "Winter Burrow",
    category: "farm",
    price: "Free",
    shortDescription:
      "A cozy woodland survival game about a mouse restoring their childhood burrow.",
    rating: 4.9,
    likesCount: 32_400,
    cardImage: winterBurrow,
    featured: true,
  },
  {
    slug: "shelve-the-potions",
    name: "Shelve the Potions!",
    category: "puzzle",
    price: "Free",
    shortDescription: "Organize 2000+ potions on shelves after the witch's cats knocked them over.",
    rating: 4.7,
    likesCount: 21_300,
    cardImage: shelveThePotions,
    featured: true,
  },
  {
    slug: "heartopia",
    name: "Heartopia",
    category: "strategy",
    price: "$1.99",
    shortDescription:
      "A multiplayer life simulation game crafted for creativity, freedom, and peace.",
    rating: 4.6,
    likesCount: 46_800,
    cardImage: heartopia,
    featured: true,
  },
  {
    slug: "palia",
    name: "Palia",
    category: "strategy",
    price: "Free",
    shortDescription: "A cozy community sim MMO set in a beautiful open world.",
    rating: 4.8,
    likesCount: 89_500,
    cardImage: palia,
    featured: true,
  },
  {
    slug: "cat-mail-co",
    name: "Cat Mail Co.",
    category: "puzzle",
    price: "Free",
    shortDescription: "Sort and deliver mail as a cat courier in a charming seaside town.",
    rating: 4.9,
    likesCount: 38_200,
    cardImage: catMailCo,
    featured: true,
  },
  {
    slug: "tiny-glade",
    name: "Tiny Glade",
    category: "arcade",
    price: "Free",
    shortDescription: "A cozy castle building toy with no rules and no way to fail.",
    rating: 4.9,
    likesCount: 67_300,
    cardImage: tinyGlade,
    featured: true,
  },
  {
    slug: "tailside-cozy-cafe-sim",
    name: "Tailside: Cozy Cafe Sim",
    category: "strategy",
    price: "Free",
    shortDescription: "Run a cafe for woodland creatures in a relaxing pixel-art town.",
    rating: 4.8,
    likesCount: 35_600,
    cardImage: tailsideCozyCafeSim,
    featured: true,
  },
  {
    slug: "islanders-new-shores",
    name: "ISLANDERS: New Shores",
    category: "strategy",
    price: "Free",
    shortDescription: "Build settlements on procedurally generated islands to maximize your score.",
    rating: 4.9,
    likesCount: 54_200,
    cardImage: islandersNewShores,
    featured: true,
  },
];
