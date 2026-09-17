export type ScaleReferenceType = 'credit_card' | 'quarter' | 'ruler' | 'none';

export interface NicheQuestion {
  id: string;
  label: string;
  options: string[];
}

export interface NicheConfig {
  id: string;
  name: string;
  icon: string;
  accentColor: string;
  badgeColor: string;
  borderColor: string;
  description: string;
  evidencePrompt: string;
  checklist: string[];
  valuationRubric: string;
  sampleComps: string;
  questions: NicheQuestion[];
}

export interface ConditionAnswers {
  functional: 'yes' | 'no' | 'untested' | 'na';
  complete: 'yes' | 'no' | 'na';
  wearNotes: string;
  tuningStrategy?: string;
  scaleReference?: ScaleReferenceType;
  askingPrice?: number;
  suspectedBrand?: string;
  userNotes?: string;
  nicheSpecificAnswers?: Record<string, string>;
}

export interface EstimatedDimensions {
  widthCm: number;
  heightCm: number;
  depthCm?: number;
  calibrationMethod: string;
  rawMeasurementText: string;
}

export interface DistributionPath {
  id: string;
  type: 'online_marketplace' | 'specialty_auction' | 'private_collectors' | 'local_consignment';
  targetPlatform: string;
  suitabilityScore: number;
  estimatedPayout: string;
  turnaroundTime: string;
  stepsToExecute: string[];
  customPostCopy: string;
  proTips: string[];
}

export type NextActionType = 'list_now' | 'lot_it' | 'hold_research' | 'pass';

export interface PhotoOpAngle {
  angleName: string;
  coachingInstructions: string;
  importance: 'essential' | 'high' | 'optional';
}

export interface StagingPhotoGuide {
  backdropRecommendation: string;
  lightingRecipe: string;
  photoAngles: PhotoOpAngle[];
  aiStagingPrompt?: string;
  stagedImageUrl?: string;
}

export interface MarketRange {
  low: number;
  median: number;
  high: number;
  compsCount?: number;
  numberOfComps?: number;
  compDateRange: string;
}

export interface NetEstimate {
  salePrice: number;
  marketplaceFee: number;
  paymentFee?: number;
  paymentProcessingFee?: number;
  shippingCost?: number;
  estimatedShipping?: number;
  packingCost?: number;
  packingMaterials?: number;
  acquisitionCost?: number;
  estimatedNetProfit?: number;
  netProfit?: number;
  netMarginPercent?: number;
}

export interface RiskFlagItem {
  type: 'authenticity' | 'condition_uncertainty' | 'sell_through' | 'reproduction' | string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface RiskFlagsObject {
  reproductionRisk?: 'low' | 'medium' | 'high';
  conditionUncertainty?: 'low' | 'medium' | 'high';
  authenticityConcerns?: 'low' | 'medium' | 'high';
  slowSellThrough?: 'low' | 'medium' | 'high';
  notes?: string[];
}

export type RiskFlags = RiskFlagItem[] | RiskFlagsObject;

export interface BuyCeilingDetails {
  maxPurchasePrice: number;
  targetMarginPercent?: number;
  logicExplanation?: string;
}

export interface ListingPlatform {
  title: string;
  description: string;
  keywords?: string[];
  tags?: string[];
  suggestedPrice?: number;
  suggestedPriceFormat?: string;
  priceFormat?: 'buy_it_now' | 'auction' | 'local_cash';
  platformNotes?: string;
}

export interface ListingGeneratorOutputs {
  ebay?: ListingPlatform;
  reverb?: ListingPlatform;
  poshmark?: ListingPlatform;
  facebook?: ListingPlatform;
  facebookMarketplace?: ListingPlatform;
  mercari?: ListingPlatform;
}

export interface NextMoveStrategy {
  primaryAction?: NextActionType;
  actionTitle?: string;
  actionReason?: string;
  targetPlatform?: string;
  recommendedPriceFormat?: 'buy_it_now' | 'auction' | 'local_cash';
  suggestedTargetPrice?: number;
  bundleTheme?: string;
  estimatedTurnaroundTime?: string;
  bestOverallPath?: string;
  pathways?: DistributionPath[];
  turnaroundDays?: string;
  priorityChecklist?: string[];
}

export interface ViolinBowForensics {
  isViolinOrBowedString: boolean;
  instrumentType?: 'violin' | 'viola' | 'cello' | 'double_bass' | 'bow' | 'other';
  probableOrigin?: string;
  probableEra?: string;
  labelAnalysis?: {
    transcription?: string;
    verdict: 'facsimile_trade' | 'genuine_workshop' | 'master_luthier' | 'modern_commercial' | 'unlabeled';
    explanation: string;
    tariffActEra?: string;
  };
  purflingAssessment?: {
    type: 'inlaid_3ply' | 'painted_scratched' | 'uncertain';
    qualityNotes: string;
  };
  tonewoodFlameGrade?: string;
  crackSeverityMap?: {
    hasSoundpostCrack: boolean;
    hasBassBarCrack: boolean;
    hasPegboxCheekCrack: boolean;
    hasNeckButtonDamage: boolean;
    hasOpenSeams: boolean;
    valueDiscountPercent: number;
    luthierRepairEstimate?: string;
  };
  bowEvaluation?: {
    included: boolean;
    stickWood?: 'Pernambuco' | 'Brazilwood' | 'Carbon Fiber' | 'Snakewood' | 'Unknown';
    fittingsMetal?: 'Solid Sterling Silver' | 'Nickel-Silver' | '14k/18k Gold' | 'Alloy';
    frogEyeStyle?: 'Parisian Eye (pearl in silver ring)' | 'Single Pearl Dot' | 'Plain Ebony' | 'Carved';
    probableMakerOrWorkshop?: string;
    headCondition?: 'Intact with bone/ivory plate' | 'Hairline crack (high risk)' | 'Repaired';
    estimatedBowValue?: number;
  };
  makerTiersBenchmarked?: string;
  auctionHouseComps?: {
    tarisioSoldBenchmark?: string;
    bromptonsSoldBenchmark?: string;
    reverbPriceGuideBenchmark?: string;
  };
}

export interface AnalysisVerdict {
  identifiedName: string;
  category?: string;
  detectedNicheId?: string;
  detectedNicheName?: string;
  makerBrand?: string;
  approximateEra?: string;
  confidence: number;
  confidenceReason?: string;
  isOfflineHeuristic?: boolean;
  marketRange?: MarketRange;
  netEstimate?: NetEstimate;
  buyCeiling?: number | BuyCeilingDetails;
  riskFlags?: RiskFlags;
  listings?: ListingGeneratorOutputs;
  nextMoveStrategy?: NextMoveStrategy;
  violinForensics?: ViolinBowForensics;
  tarisioSearchUrl?: string;
  
  // Legacy & Compatibility fields
  lowValue: number;
  highValue: number;
  currency: string;
  verdict: 'BUY' | 'SKIP' | 'PONDER';
  verdictReasoning?: string;
  authenticityStatus?: string;
  inspectionPointsToVerify?: string;
  marginEstimate?: string;
  reproTells?: string[];
  keyIdentifiers?: string[];
  listingTitle: string;
  listingKeywords: string[];
  suggestedListingPrice: number;
  descriptionWriteup: string;
  ebaySoldSearchUrl: string;
  reverbSoldSearchUrl?: string;
  measurementsCm?: { widthCm: number; heightCm: number; depthCm?: number };
  estimatedDimensions?: EstimatedDimensions;
  valuationMethodology?: string;
  stagingPhotoGuide?: StagingPhotoGuide;
}

export type ResaleStatus = 'scouted' | 'sourced' | 'purchased' | 'listed' | 'sold' | 'passed' | 'archived';

export interface ScannedItem {
  id: string;
  image: string;
  additionalImages?: string[];
  nicheId: string;
  detectedNicheId?: string;
  detectedNicheName?: string;
  scannedAt: string;
  condition: ConditionAnswers;
  quickVerdictOnly: boolean;
  status: 'pending' | 'success' | 'failed' | 'offline_draft';
  error?: string;
  verdict?: AnalysisVerdict;
  acquisitionCost?: number;
  resaleStatus?: ResaleStatus;
  buyPrice?: number;
  soldPrice?: number;
  actualPurchasePrice?: number;
  targetListPrice?: number;
  actualSalePrice?: number;
  platformListed?: string;
  dateAcquired?: string;
  dateSold?: string;
  notes?: string;
  correctedName?: string;
  isSavedToLedger?: boolean;
  isArchived?: boolean;
  archiveReason?: string;
  archivedAt?: string;
}

export interface OfflineQueueItem {
  id: string;
  image: string;
  additionalImages?: string[];
  capturedAt: string;
  nicheId: string;
  condition: ConditionAnswers;
  quickVerdictOnly: boolean;
  userNotes?: string;
  askingPrice?: number;
}
