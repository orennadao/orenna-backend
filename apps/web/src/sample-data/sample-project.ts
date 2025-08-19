import type { Project } from '@orenna/api-client';

export const sampleProject: Project = {
  id: 1,
  name: "Costa Rica Reforestation Initiative",
  description: "A comprehensive reforestation project in the Monteverde Cloud Forest region of Costa Rica, focusing on restoring 1,000 hectares of degraded agricultural land to native cloud forest. This project will sequester approximately 2,500 tonnes of CO2 equivalent over 20 years while providing habitat for endangered species including the Resplendent Quetzal and Three-wattled Bellbird.",
  type: "forest",
  category: "reforestation",
  status: "active",
  location: "Monteverde, Costa Rica",
  budget: 450000,
  progress: 35,
  impactScore: 8.7,
  expectedImpact: "This project will sequester 2,500 tCO2e over 20 years, restore critical cloud forest habitat, protect biodiversity including 15 endangered species, provide sustainable livelihoods for 25 local families, and improve water quality for downstream communities through forest watershed protection.",
  methodology: "Verified Carbon Standard (VCS) Improved Forest Management (IFM) methodology v1.7, with additional biodiversity and community co-benefits verified through the Climate, Community & Biodiversity Alliance (CCBA) standards. Remote sensing and ground-based monitoring every 6 months.",
  stakeholders: "Local indigenous communities, Costa Rican Ministry of Environment, Monteverde Conservation League, International carbon credit buyers",
  timeline: {
    duration: "20 years",
    startDate: "2024-01-15",
    endDate: "2044-01-15"
  },
  createdAt: "2023-11-15T10:30:00Z",
  updatedAt: "2024-08-15T14:22:00Z",
  // Additional marketplace-specific data
  marketData: {
    tokenPrice: 25.50,
    forwardPrice: 22.00,
    availableTokens: 1250,
    totalTokens: 2500,
    availableForwards: 750,
    totalForwards: 1500,
    priceChange24h: 2.5,
    deliveryMonths: 12,
    recentTrades: [
      {
        type: "token",
        amount: 50,
        price: 25.50,
        timestamp: "2024-08-18T14:00:00Z"
      },
      {
        type: "forward",
        amount: 100,
        price: 22.00,
        timestamp: "2024-08-18T11:00:00Z"
      },
      {
        type: "token",
        amount: 25,
        price: 25.25,
        timestamp: "2024-08-17T16:30:00Z"
      }
    ]
  }
};

export const sampleProjects: Project[] = [
  sampleProject,
  {
    id: 2,
    name: "Madagascar Mangrove Restoration",
    description: "Restoration of 500 hectares of mangrove forests along Madagascar's west coast to protect coastal communities from sea-level rise and storms while sequestering carbon.",
    type: "conservation",
    category: "mangrove",
    status: "pending",
    location: "Mahajanga Province, Madagascar",
    budget: 280000,
    progress: 0,
    impactScore: 9.1,
    expectedImpact: "Sequester 1,800 tCO2e, protect 3 coastal villages from storm surge, restore critical habitat for lemurs and endemic bird species.",
    methodology: "VCS Wetlands Restoration and Conservation methodology v3.0",
    stakeholders: "Local fishing communities, Madagascar National Parks, WWF Madagascar",
    timeline: {
      duration: "15 years",
      startDate: "2024-10-01",
      endDate: "2039-10-01"
    },
    createdAt: "2024-01-20T09:15:00Z",
    updatedAt: "2024-08-10T11:45:00Z"
  },
  {
    id: 3,
    name: "Brazilian Amazon Avoided Deforestation",
    description: "Protection of 5,000 hectares of primary Amazon rainforest through sustainable land management and community-based conservation programs.",
    type: "carbon",
    category: "redd+",
    status: "active",
    location: "Acre State, Brazil",
    budget: 750000,
    progress: 67,
    impactScore: 9.8,
    expectedImpact: "Avoid emissions of 15,000 tCO2e, protect habitat for jaguars and other endangered species, support 40 indigenous families.",
    methodology: "VCS REDD+ methodology v1.6 with CCBA Gold Standard",
    stakeholders: "Indigenous communities, Brazilian Forest Service, Conservation International",
    timeline: {
      duration: "30 years",
      startDate: "2022-06-01",
      endDate: "2052-06-01"
    },
    createdAt: "2022-03-10T08:00:00Z",
    updatedAt: "2024-08-16T13:20:00Z"
  }
];