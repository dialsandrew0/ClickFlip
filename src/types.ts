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
  accentColor: string; // e.g., 'emerald', 'amber', 'indigo', 'purple', 'rose'
  badgeColor: string; // Tailwind classes
  borderColor: string;
  description: string;
  evidencePrompt: string; // What specific elements of evidence the user should look for
  checklist: string[]; // Forensic checklist of evidence (e.g., Signatures, Mintmarks)
  valuationRubric: string; // How value is determined
  sampleComps: string; // Where comps are typically sourced
  questions: NicheQuestion[]; // Dynamic niche-specific appraisal questions
}

export interface ConditionAnswers {
  functional: 'yes' | 'no' | 'untested' | 'na';
  complete: 'yes' | 'no' | 'na';
  wearNotes: string;
  tuningStrategy?: string; // Appraisal Strategy Preset e.g. 'conservative_thrift', 'yard_sale_flip', etc.
  scaleReference?: ScaleReferenceType; // Standard scale calibration object
  nicheSpecificAnswers?: Record<string, string>; // Maps niche question ID to user answer
}

export interface EstimatedDimensions {
  widthCm: number;
  heightCm: number;
  depthCm?: number;
  calibrationMethod: string; // e.g. "Calibrated via Standard Credit Card (85.6mm x 53.98mm)"
  rawMeasurementText: string;
}

export interface DistributionPath {
  id: string;
  type: 'online_marketplace' | 'specialty_auction' | 'private_collectors' | 'local_consignment';
  targetPlatform: string;
  suitabilityScore: number; // 0 to 100
  estimatedPayout: string;
  turnaroundTime: string;
  stepsToExecute: string[];
  customPostCopy: string;
  proTips: string[];
}

export interface NextMoveStrategy {
  bestOverallPath: string;
  pathways: DistributionPath[];
}

export interface PhotoOpAngle {
  angleName: string;
  coachingInstructions: string;
  importance: 'essential' | 'high' | 'optional';
}

export interface StagingPhotoGuide {
  backdropRecommendation: string;
  lightingRecipe: string;
  photoAngles: PhotoOpAngle[];
  aiStagingPrompt: string;
  stagedImageUrl?: string;
}

export interface AnalysisVerdict {
  identifiedName: string;
  category?: string;
  confidence: number; // 0 to 100
  confidenceScore?: number;
  lowValue: number;
  highValue: number;
  currency: string;
  verdict: 'BUY' | 'SKIP' | 'PONDER';
  verdictReasoning?: string;
  authenticityStatus?: string;
  inspectionPointsToVerify?: string;
  marginEstimate?: string;
  reproTells: string[];
  keyIdentifiers: string[];
  listingTitle: string;
  listingKeywords: string[];
  suggestedListingPrice: number;
  descriptionWriteup: string;
  ebaySoldSearchUrl: string;
  measurementsCm?: { widthCm: number; heightCm: number; depthCm?: number };
  estimatedDimensions?: EstimatedDimensions; // Physical dimensions calculated by Gemini using scale reference object
  valuationMethodology?: string; // Raw forensic valuation formula used (e.g. "90% Silver Melt Floor + New Orleans Mintmark Ceiling")
  nextMoveStrategy?: NextMoveStrategy; // Strategic action pathways (eBay, Auction Houses, Private Collectors, Consignment)
  stagingPhotoGuide?: StagingPhotoGuide; // AI photo staging recipe & coaching angles
}

export interface ScannedItem {
  id: string;
  image: string; // base64 or object URL
  nicheId: string;
  scannedAt: string;
  condition: ConditionAnswers;
  quickVerdictOnly: boolean;
  status: 'pending' | 'success' | 'failed';
  error?: string;
  verdict?: AnalysisVerdict;
}

export interface OfflineQueueItem {
  id: string;
  image: string; // base64
  capturedAt: string;
  nicheId: string;
  condition: ConditionAnswers;
  quickVerdictOnly: boolean;
}
