export type DeviceCategory =
  | 'consumer_electronics'
  | 'office_it'
  | 'power_tools'
  | 'appliances'
  | 'audio_visual'
  | 'networking'
  | 'industrial_measurement'
  | 'other';

export type PhysicalGrade = 'mint' | 'good' | 'fair' | 'poor' | 'damaged';

export type HousingStatus = 'pristine' | 'minor_wear' | 'moderate_scratches' | 'dents_or_cracks' | 'broken';

export type ScreenStatus = 'not_applicable' | 'flawless' | 'surface_scratches' | 'cracked_glass' | 'damaged_lcd';

export type PortsStatus = 'clean_intact' | 'minor_wear' | 'debris_dust' | 'bent_pins_corrosion' | 'uninspected';

export type ButtonsStatus = 'all_intact' | 'worn' | 'missing_or_stuck' | 'uninspected';

export type CablesStatus = 'healthy' | 'minor_abrasion' | 'frayed_exposed_copper' | 'not_applicable';

export type CleanlinessStatus = 'clean' | 'dusty' | 'heavily_soiled' | 'sticky_residue';

export interface DefectItem {
  area: string;
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
}

export interface SerialNumberInfo {
  detected: boolean;
  value: string | null;
  locationNotes: string;
  confidence: 'high' | 'medium' | 'low' | 'not_found';
}

export interface DeviceIdentification {
  deviceType: string;
  deviceCategory: DeviceCategory;
  brand: string;
  model: string;
  serialNumberOrTag: SerialNumberInfo;
  estimatedYearOrGeneration?: string;
  summary: string;
}

export interface PhysicalStatus {
  overallGrade: PhysicalGrade;
  score: number;
  housingAndChassis: {
    status: HousingStatus;
    details: string;
  };
  screenOrDisplay: {
    hasScreen: boolean;
    status: ScreenStatus;
    details: string;
  };
  portsAndConnectors: {
    status: PortsStatus;
    details: string;
  };
  buttonsAndSwitches: {
    status: ButtonsStatus;
    details: string;
  };
  cablesAndWiring: {
    status: CablesStatus;
    details: string;
  };
  cleanliness: CleanlinessStatus;
  defectsList: DefectItem[];
}

export type ObservableFunctionalStatus =
  | 'operational'
  | 'partially_functional'
  | 'non_functional'
  | 'untested_not_demonstrated';

export interface FunctionalityStatus {
  observableStatus: ObservableFunctionalStatus;
  powerIndicator: {
    observed: boolean;
    state: 'lit_normal' | 'blinking_error' | 'off' | 'not_connected_or_shown';
    notes: string;
  };
  displayOrScreenResponse: {
    observed: boolean;
    state: 'normal_boot' | 'abnormal_artifacts' | 'blank_backlight' | 'no_power' | 'not_applicable';
    notes: string;
  };
  mechanicalOrMovingParts: {
    observed: boolean;
    state: 'smooth_operation' | 'unusual_noise_vibration' | 'seized_stuck' | 'not_applicable';
    notes: string;
  };
  audibleAlerts?: {
    detected: boolean;
    notes: string;
  };
  demonstratedActions: string[];
  untestedRisks: string[];
}

export type AccessoryCategory =
  | 'essential_power'
  | 'control_input'
  | 'cable_connector'
  | 'protective_case'
  | 'attachment'
  | 'documentation_box'
  | 'other';

export type AccessoryPresence =
  | 'present_verified'
  | 'partially_present'
  | 'missing_critical'
  | 'missing_optional';

export type AccessoryCondition = 'good' | 'worn' | 'damaged' | 'unknown_not_present';

export interface AccessoryItem {
  name: string;
  category: AccessoryCategory;
  presence: AccessoryPresence;
  condition: AccessoryCondition;
  isOriginal?: boolean;
  notes: string;
}

export type AccessoriesCompleteness =
  | 'complete'
  | 'partially_complete'
  | 'missing_critical'
  | 'none_detected';

export interface AccessoriesAudit {
  overallCompleteness: AccessoriesCompleteness;
  completenessScore: number;
  summary: string;
  items: AccessoryItem[];
}

export interface MissingRequirementItem {
  id: string;
  category:
    | 'serial_plate'
    | 'all_angles'
    | 'ports_underside'
    | 'power_test'
    | 'accessories_display'
    | 'label_clarity';
  urgency: 'critical' | 'recommended' | 'optional';
  title: string;
  userInstruction: string;
  reason: string;
}

export interface AuditSufficiency {
  isAuditComplete: boolean;
  confidenceScore: number;
  readinessStatus:
    | 'ready_for_certification'
    | 'requires_additional_video'
    | 'requires_additional_info';
  missingRequirements: MissingRequirementItem[];
  suggestedNextActions: string[];
  recommendations: string;
}

export interface InspectionReport {
  id: string;
  createdAt: string;
  device: DeviceIdentification;
  physical: PhysicalStatus;
  functionality: FunctionalityStatus;
  accessories: AccessoriesAudit;
  sufficiency: AuditSufficiency;
  frames: string[];
  videoDurationSeconds?: number;
  inspectorNotes?: string;
  continuationCount?: number;
}
