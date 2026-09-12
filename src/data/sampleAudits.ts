import { InspectionReport } from '../types';

// Helper to create simple representative placeholder SVG frames for demo audits
function createPlaceholderFrame(label: string, subtext: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <rect width="640" height="360" fill="${color}"/>
    <rect x="20" y="20" width="600" height="320" rx="8" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-dasharray="8 8"/>
    <circle cx="320" cy="140" r="48" fill="rgba(255,255,255,0.15)"/>
    <text x="320" y="148" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#ffffff" text-anchor="middle">REC</text>
    <text x="320" y="220" font-family="system-ui, sans-serif" font-size="20" font-weight="600" fill="#ffffff" text-anchor="middle">${label}</text>
    <text x="320" y="248" font-family="system-ui, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)" text-anchor="middle">${subtext}</text>
    <rect x="30" y="30" width="100" height="24" rx="4" fill="rgba(0,0,0,0.5)"/>
    <text x="80" y="46" font-family="monospace" font-size="12" fill="#22c55e" text-anchor="middle">FRAME CAPTURE</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_AUDITS: InspectionReport[] = [
  {
    id: "audit-demo-laptop-1",
    createdAt: "2026-09-12T10:15:00Z",
    device: {
      deviceType: "Business Laptop",
      deviceCategory: "office_it",
      brand: "Dell",
      model: "Latitude 5420 (14-inch)",
      serialNumberOrTag: {
        detected: false,
        value: null,
        locationNotes: "Bottom D-cover plate service tag was obscured in video footage",
        confidence: "not_found",
      },
      estimatedYearOrGeneration: "2022 - 11th Gen Intel",
      summary: "Dell Latitude 5420 business laptop in good general physical condition, but missing underside serial number inspection and power-on boot demonstration.",
    },
    physical: {
      overallGrade: "good",
      score: 82,
      housingAndChassis: {
        status: "minor_wear",
        details: "Minimal scuffing on top aluminum cover edges. Hinge mechanism feels firm with no wobbling.",
      },
      screenOrDisplay: {
        hasScreen: true,
        status: "flawless",
        details: "Matte 14-inch FHD panel has no visible cracks, pressure marks, or dead pixels.",
      },
      portsAndConnectors: {
        status: "clean_intact",
        details: "Two Thunderbolt 4 USB-C ports, dual USB 3.2, HDMI 2.0, and RJ45 ports inspected clean with no lint or pin deformation.",
      },
      buttonsAndSwitches: {
        status: "all_intact",
        details: "Chiclet keyboard keys all present; trackpad click and power button tactility responsive.",
      },
      cablesAndWiring: {
        status: "healthy",
        details: "Internal ribbon and external AC adapter cable inspected intact.",
      },
      cleanliness: "clean",
      defectsList: [
        {
          area: "Top Lid Rim",
          severity: "minor",
          description: "Light 1.5cm cosmetic abrasion near right corner, does not penetrate coating.",
        },
        {
          area: "Base Rubber Feet",
          severity: "minor",
          description: "Slight friction wear on front rubber anti-slip footstrip.",
        },
      ],
    },
    functionality: {
      observableStatus: "untested_not_demonstrated",
      powerIndicator: {
        observed: false,
        state: "not_connected_or_shown",
        notes: "Device remained in closed/standby state throughout the captured video; power button not depressed in frame.",
      },
      displayOrScreenResponse: {
        observed: false,
        state: "blank_backlight",
        notes: "Display panel was not powered on during video clip.",
      },
      mechanicalOrMovingParts: {
        observed: true,
        state: "smooth_operation",
        notes: "Display hinges smoothly cycle through 180 degrees.",
      },
      audibleAlerts: {
        detected: false,
        notes: "No BIOS post beeps or cooling fan spins detected.",
      },
      demonstratedActions: [
        "Hinge opening and closing rotation",
        "Exterior 360-degree perimeter walkaround",
        "Keyboard deck visual scan",
      ],
      untestedRisks: [
        "Motherboard boot POST & OS loading unverified",
        "Battery health and charge cycle holding capacity unknown",
        "Display panel backlight & pixel integrity under active power unverified",
      ],
    },
    accessories: {
      overallCompleteness: "partially_complete",
      completenessScore: 50,
      summary: "Dell 65W USB-C AC power adapter shown, but AC wall mains cord and original packaging/documentation are missing from view.",
      items: [
        {
          name: "Dell 65W Type-C AC Adapter",
          category: "essential_power",
          presence: "present_verified",
          condition: "good",
          isOriginal: true,
          notes: "Original Dell brick identified, USB-C terminal clean with strain relief intact.",
        },
        {
          name: "3-Prong AC Wall Power Cord (Cloverleaf)",
          category: "cable_connector",
          presence: "missing_critical",
          condition: "unknown_not_present",
          notes: "Mains wall cable connecting to the AC brick was not placed in frame.",
        },
        {
          name: "Quick Setup Guide & Factory Box",
          category: "documentation_box",
          presence: "missing_optional",
          condition: "unknown_not_present",
          notes: "Loose asset inspection; packaging not included.",
        },
      ],
    },
    sufficiency: {
      isAuditComplete: false,
      confidenceScore: 68,
      readinessStatus: "requires_additional_video",
      missingRequirements: [
        {
          id: "req-1",
          category: "power_test",
          urgency: "critical",
          title: "Demonstrate Power-On Sequence",
          userInstruction: "Connect device to power, press the power button on camera, and record screen booting into BIOS or operating system.",
          reason: "Functional status cannot be verified without active power demonstration.",
        },
        {
          id: "req-2",
          category: "serial_plate",
          urgency: "critical",
          title: "Capture Bottom Service Tag Barcode",
          userInstruction: "Turn the laptop upside down and hold camera steady 15-20cm from the Dell 7-character Service Tag sticker.",
          reason: "Essential for corporate asset tracking and warranty entitlement verification.",
        },
        {
          id: "req-3",
          category: "accessories_display",
          urgency: "recommended",
          title: "Include 3-Prong AC Wall Lead",
          userInstruction: "Lay out the AC wall power cord alongside the charger brick so serial and plug status can be documented.",
          reason: "AC power cord is required for full operational handover.",
        },
      ],
      suggestedNextActions: [
        "Record 10-second follow-up video showing underside Service Tag and bootup.",
        "Add missing AC wall power cord.",
      ],
      recommendations: "Hold the audit in 'Pending Additional Video' state until power-on verification is completed.",
    },
    frames: [
      createPlaceholderFrame("Front Lid & Logo", "Dell Latitude 5420 Lid", "#1e293b"),
      createPlaceholderFrame("Open Keyboard Deck", "Chiclet Keys & Trackpad", "#334155"),
      createPlaceholderFrame("Left Side I/O Ports", "Thunderbolt 4 & USB-A", "#0f172a"),
      createPlaceholderFrame("Right Side I/O Ports", "RJ45, HDMI & Audio Jack", "#1e293b"),
      createPlaceholderFrame("65W AC Adapter", "Dell USB-C Power Brick", "#334155"),
    ],
    videoDurationSeconds: 14,
    inspectorNotes: "Intake inspection for employee workstation renewal.",
  },
  {
    id: "audit-demo-drill-2",
    createdAt: "2026-09-12T09:30:00Z",
    device: {
      deviceType: "Cordless Brushless Hammer Drill",
      deviceCategory: "power_tools",
      brand: "DeWalt",
      model: "DCD996 20V MAX XR 1/2-inch",
      serialNumberOrTag: {
        detected: true,
        value: "SN: 2021 48-WY 18839",
        locationNotes: "Rating plate sticker stamped clearly on motor housing flank",
        confidence: "high",
      },
      estimatedYearOrGeneration: "2021 Manufacturing Batch",
      summary: "DeWalt DCD996 20V hammer drill in fully operational condition with complete OEM accessories and clear rating plate.",
    },
    physical: {
      overallGrade: "fair",
      score: 74,
      housingAndChassis: {
        status: "moderate_scratches",
        details: "Expected trade wear on yellow composite housing; rubber overmold scuffed near grip base; no structural cracks.",
      },
      screenOrDisplay: {
        hasScreen: false,
        status: "not_applicable",
        details: "No digital screen.",
      },
      portsAndConnectors: {
        status: "clean_intact",
        details: "Slide-on battery rail terminals have minor surface rubbing but are clean with zero corrosion or bent prongs.",
      },
      buttonsAndSwitches: {
        status: "all_intact",
        details: "Variable speed trigger, forward/reverse selector shuttle, and 3-speed transmission selector engage with positive detents.",
      },
      cablesAndWiring: {
        status: "healthy",
        details: "Cordless tool; charger mains lead intact without sheath cracks.",
      },
      cleanliness: "dusty",
      defectsList: [
        {
          area: "Keyless Metal Chuck",
          severity: "minor",
          description: "Cosmetic surface oxidation and spiral scuffing from metal contact.",
        },
        {
          area: "Gearbox Housing",
          severity: "minor",
          description: "Powder coat wear on cast aluminum nose cone.",
        },
      ],
    },
    functionality: {
      observableStatus: "operational",
      powerIndicator: {
        observed: true,
        state: "lit_normal",
        notes: "Base-mounted 3-mode LED worklight illuminates brightly upon trigger pull.",
      },
      displayOrScreenResponse: {
        observed: true,
        state: "normal_boot",
        notes: "3-LED fuel gauge on battery pack shows 3 green bars.",
      },
      mechanicalOrMovingParts: {
        observed: true,
        state: "smooth_operation",
        notes: "Chuck demonstrated spinning in forward and reverse, brake halts rotation instantly upon trigger release.",
      },
      audibleAlerts: {
        detected: true,
        notes: "Motor whine is crisp and consistent with no bearing grind or electrical arcing sounds.",
      },
      demonstratedActions: [
        "Trigger depression with variable speed spin",
        "Forward and reverse rotation changeover",
        "Keyless ratcheting chuck tightening click",
        "Battery fuel gauge button press test",
      ],
      untestedRisks: [
        "Continuous load torque clutch slip points not dynamometer-tested",
      ],
    },
    accessories: {
      overallCompleteness: "complete",
      completenessScore: 100,
      summary: "All essential and secondary accessories present, OEM verified, and fully operational.",
      items: [
        {
          name: "DeWalt 20V MAX 5.0Ah Li-Ion Battery (DCB205)",
          category: "essential_power",
          presence: "present_verified",
          condition: "good",
          isOriginal: true,
          notes: "Fuel gauge active, casing latches securely onto drill base.",
        },
        {
          name: "DeWalt Multi-Voltage Fast Charger (DCB115)",
          category: "essential_power",
          presence: "present_verified",
          condition: "good",
          isOriginal: true,
          notes: "Power cord and status LEDs in undamaged condition.",
        },
        {
          name: "360-Degree Side Handle (Auxiliary Grip)",
          category: "attachment",
          presence: "present_verified",
          condition: "good",
          isOriginal: true,
          notes: "Clamps firmly onto nose ring collar.",
        },
        {
          name: "Steel Belt Hook & Bit Clip",
          category: "attachment",
          presence: "present_verified",
          condition: "good",
          isOriginal: true,
          notes: "Fastened with Phillips screw on left base.",
        },
        {
          name: "TSTAK Heavy Duty Molded Carrying Case",
          category: "protective_case",
          presence: "present_verified",
          condition: "worn",
          isOriginal: true,
          notes: "External scuffs, dual metal latches close securely.",
        },
      ],
    },
    sufficiency: {
      isAuditComplete: true,
      confidenceScore: 95,
      readinessStatus: "ready_for_certification",
      missingRequirements: [],
      suggestedNextActions: [
        "Apply silicone cleaner to chuck sleeves.",
        "Issue Asset Certification Certificate.",
      ],
      recommendations: "Asset passes all mechanical, electrical, and completeness standards for immediate warehouse redeployment.",
    },
    frames: [
      createPlaceholderFrame("Drill Profile & Model", "DeWalt DCD996 20V", "#ca8a04"),
      createPlaceholderFrame("Rating Plate Close-Up", "SN: 2021 48-WY 18839", "#854d0e"),
      createPlaceholderFrame("Operational Spin Test", "Chuck Rotation & Worklight", "#ca8a04"),
      createPlaceholderFrame("Battery & Charger Suite", "5.0Ah Pack + DCB115", "#713f12"),
      createPlaceholderFrame("Molded TSTAK Kit Box", "Complete Carrying Case", "#ca8a04"),
    ],
    videoDurationSeconds: 22,
    inspectorNotes: "Tool depot routine return audit. Cleared for certification.",
  },
  {
    id: "audit-demo-phone-3",
    createdAt: "2026-09-12T08:45:00Z",
    device: {
      deviceType: "Flagship Smartphone",
      deviceCategory: "consumer_electronics",
      brand: "Apple",
      model: "iPhone 13 Pro (Sierra Blue, 128GB/256GB)",
      serialNumberOrTag: {
        detected: false,
        value: null,
        locationNotes: "No external serial label visible; IMEI not shown in Settings/About or on SIM tray",
        confidence: "not_found",
      },
      estimatedYearOrGeneration: "2021 Release",
      summary: "iPhone 13 Pro showing significant rear back-glass impact fracture; power-on response and IMEI data missing from video footage.",
    },
    physical: {
      overallGrade: "damaged",
      score: 46,
      housingAndChassis: {
        status: "dents_or_cracks",
        details: "Spiderweb shatter on frosted rear glass spreading from upper-right camera island. Stainless steel frame has impact nick.",
      },
      screenOrDisplay: {
        hasScreen: true,
        status: "surface_scratches",
        details: "Ceramic Shield front glass intact with three micro-scratches under direct reflection.",
      },
      portsAndConnectors: {
        status: "debris_dust",
        details: "Lightning port cavity has visible pocket lint obstruction requiring cleaning.",
      },
      buttonsAndSwitches: {
        status: "all_intact",
        details: "Volume rocker, mute switch, and side power button click firmly.",
      },
      cablesAndWiring: {
        status: "not_applicable",
        details: "Integrated device.",
      },
      cleanliness: "dusty",
      defectsList: [
        {
          area: "Back Glass Panel",
          severity: "severe",
          description: "Extensive glass fracture with splintering, breaches IP68 water resistance.",
        },
        {
          area: "Camera Bezel Ring",
          severity: "moderate",
          description: "Gouge on wide-angle lens stainless steel perimeter (lens sapphire appears uncracked).",
        },
        {
          area: "Lightning Port",
          severity: "minor",
          description: "Fibrous lint compaction inside port pins.",
        },
      ],
    },
    functionality: {
      observableStatus: "untested_not_demonstrated",
      powerIndicator: {
        observed: false,
        state: "off",
        notes: "Device display was black throughout recording; no Apple logo or battery icon shown.",
      },
      displayOrScreenResponse: {
        observed: false,
        state: "no_power",
        notes: "Screen wake or touch responsiveness not demonstrated.",
      },
      mechanicalOrMovingParts: {
        observed: true,
        state: "not_applicable",
        notes: "Solid-state smartphone with no external moving parts.",
      },
      audibleAlerts: {
        detected: false,
        notes: "No haptic feedback or sound audible.",
      },
      demonstratedActions: [
        "Front and rear physical rotation",
        "Camera island tilt reflection",
      ],
      untestedRisks: [
        "Display OLED digitization and TrueTone functionality unconfirmed",
        "Cameras and FaceID sensor array operational status unknown",
        "Battery swelling underneath fractured back glass unconfirmed",
      ],
    },
    accessories: {
      overallCompleteness: "none_detected",
      completenessScore: 0,
      summary: "Only the bare smartphone was shown in video. No USB-C to Lightning cable, 20W charger, SIM tool, or box provided.",
      items: [
        {
          name: "USB-C to Lightning Fast Charge Cable",
          category: "cable_connector",
          presence: "missing_critical",
          condition: "unknown_not_present",
          notes: "Not presented during inspection.",
        },
        {
          name: "SIM Ejector Pin & Documentation Box",
          category: "documentation_box",
          presence: "missing_optional",
          condition: "unknown_not_present",
          notes: "Missing from capture.",
        },
      ],
    },
    sufficiency: {
      isAuditComplete: false,
      confidenceScore: 54,
      readinessStatus: "requires_additional_video",
      missingRequirements: [
        {
          id: "req-ph-1",
          category: "power_test",
          urgency: "critical",
          title: "Demonstrate Power-On & Screen Display",
          userInstruction: "Press side power button or plug into charger to demonstrate active screen display and touchscreen swipe.",
          reason: "Essential to verify if OLED panel and logic board survived the back-glass impact.",
        },
        {
          id: "req-ph-2",
          category: "serial_plate",
          urgency: "critical",
          title: "Provide IMEI / Serial Number",
          userInstruction: "Open Settings > General > About and record IMEI on screen, or remove SIM tray to show engraved IMEI.",
          reason: "Required for carrier blacklist check, Apple activation lock status, and ownership verification.",
        },
        {
          id: "req-ph-3",
          category: "accessories_display",
          urgency: "recommended",
          title: "Confirm Accessories Status",
          userInstruction: "If charging cable or protective case is included, place alongside device or confirm 'device only'.",
          reason: "Clarifies accessory completeness for valuation.",
        },
      ],
      suggestedNextActions: [
        "Record 15-second follow-up video with screen powered on to Settings > About.",
        "Show charging current / cable.",
      ],
      recommendations: "Device requires tier-2 glass refurbishment and power validation before trade-in valuation can be finalized.",
    },
    frames: [
      createPlaceholderFrame("Front Ceramic Shield", "iPhone 13 Pro Screen", "#0284c7"),
      createPlaceholderFrame("Back Glass Fracture", "Spiderweb Crack Detail", "#0369a1"),
      createPlaceholderFrame("Triple Camera Array", "Telephoto & Wide Lenses", "#075985"),
      createPlaceholderFrame("Lightning Port Base", "Speaker Holes & Port", "#0c4a6e"),
    ],
    videoDurationSeconds: 11,
    inspectorNotes: "Customer trade-in intake. Physical damage flagged.",
  },
];
