---
name: Radiometric Precision
colors:
  surface: '#101419'
  surface-dim: '#101419'
  surface-bright: '#36393f'
  surface-container-lowest: '#0a0e13'
  surface-container-low: '#181c21'
  surface-container: '#1c2025'
  surface-container-high: '#262a30'
  surface-container-highest: '#31353b'
  on-surface: '#e0e2ea'
  on-surface-variant: '#d8c3ad'
  inverse-surface: '#e0e2ea'
  inverse-on-surface: '#2d3136'
  outline: '#a08e7a'
  outline-variant: '#534434'
  surface-tint: '#ffb95f'
  primary: '#ffc174'
  on-primary: '#472a00'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#855300'
  secondary: '#ffb599'
  on-secondary: '#5a1c00'
  secondary-container: '#f66018'
  on-secondary-container: '#4f1700'
  tertiary: '#8ed5ff'
  on-tertiary: '#00354a'
  tertiary-container: '#38bdf8'
  on-tertiary-container: '#004965'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#ffdbce'
  secondary-fixed-dim: '#ffb599'
  on-secondary-fixed: '#370e00'
  on-secondary-fixed-variant: '#7f2b00'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#7bd0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#101419'
  on-background: '#e0e2ea'
  surface-variant: '#31353b'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  mono-data-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
  mono-data-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  mono-data-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers a high-density, scientific computational environment modeled after laboratory sensor diagnostics and thermal radiometry software. The target audience comprises computer vision researchers, synthetic sensor simulation engineers, autonomous perception scientists, and aerospace optical modelers.

The visual style is **Scientific Functionalism with Precision Bordering**:
- **Radiometric Palette Archetype:** The interface reflects calibrated mid-wave and long-wave infrared (MWIR/LWIR) sensor viewfinders: crisp "white-hot" luminescence against cold deep-space voids, avoiding all garish false-color gradients or rainbow UI chrome.
- **Instrument-Grade Information Architecture:** Prioritizes extreme data density, tabular alignments, visible dimensional units, telemetry status markers, and micro-metadata badges.
- **Rigor & Decisiveness:** Eliminates decorative skeuomorphism, bouncy spring mechanics, or heavy translucent blurs. Visual weight is communicated strictly through line structures, calibrated amber focus beacons, and disciplined value steps.

## Colors

The palette operates under a calibrated thermal display model: deep low-noise sensor black, step-graded gray body layers, white-hot typography, and a single calibrated thermal amber channel reserved strictly for active telemetry, affordances, and interactive inputs.

### Surface System
- `canvas-default`: `#0b0f14` (Deep detector background void)
- `surface-base`: `#121820` (Primary analytical surface, panel frames)
- `surface-elevated`: `#1a2330` (Nested cards, inspector drawers, modal layers)
- `surface-active`: `#243042` (Row hovers, selected segment backgrounds)

### Luminescence Scale (White-Hot Grayscale)
- `text-primary`: `#f8fafc` (Peak thermal target, max readability, headers, prime values)
- `text-secondary`: `#94a3b8` (Standard scientific descriptors, secondary metrics)
- `text-muted`: `#64748b` (Disabled values, grid line references, units, table column keys)
- `border-subtle`: `#1e293b` (Structural dividers, cell separators)
- `border-contrast`: `#334155` (Card boundaries, active bounding outlines)

### Interactive & Beacon Radiometry (Amber Spectrum)
- `interactive-primary`: `#f59e0b` (Calibrated primary action, active selection, primary state)
- `interactive-hover`: `#fb923c` (Interaction state, cursor target)
- `interactive-pressed`: `#ea580c` (Active trigger, pressed state)
- `interactive-glow`: `rgba(245, 158, 11, 0.15)` (Active viewport reticle, targeted coordinate focus ring)

### Telemetry Status
- `status-nominal`: `#10b981` (Validated signature, verified mesh format)
- `status-divergent`: `#f43f5e` (Simulation artifact, missing material parameter)
- `status-spec`: `#38bdf8` (Optical band specification, informational telemetry)

## Typography

The type system separates natural language and contextual orientation (handled by `Inter`) from raw scientific measurement, emissivity vectors, hash keys, and polygon coordinates (handled by `JetBrains Mono`).

### Type Application Rules
- **Tabular Precision:** All numbers, material parameters ($\epsilon \in [0.0, 1.0]$), thermal response wavelengths ($\mu\text{m}$), bounding-box dimensions, vertex counts, and SHA-256 hashes must always be typeset in `JetBrains Mono` with tabular numeral sizing enabled (`font-variant-numeric: tabular-nums`).
- **Data Labels:** Labels representing sensor categories, model classification classes, and hardware license badges use `label-caps` in uppercase format to emulate physical military and laboratory equipment plaques.
- **Hierarchy Restraint:** Avoid oversized consumer marketing type. The largest heading tops out at 36px, keeping the vertical visual budget concentrated on 3D viewports, parameter tables, and data streams.

## Layout & Spacing

This design system uses a technical workspace layout optimized for wide, data-rich displays while scaling systematically down to mobile inspection screens.

### Spatial Engine
- **Base Increment:** 4px geometric scaling base (`0.25rem`). Padding inside dense data matrices operates on 4px and 8px units, minimizing wasted display space.
- **Desktop Layout (≥ 1280px):** 12-column dynamic fluid grid with permanent, non-collapsible dual tool rails. Side inspector spans 3 columns (fixed minimum 340px width), viewport/data workspace spans 9 columns. Gutters are locked at 16px (`1rem`) to keep technical data cohesive.
- **Tablet Layout (768px - 1279px):** 8-column layout. The simulation parameter inspector shifts from a static side panel to a collapsible bottom-docked tray or modal sheet.
- **Mobile Layout (< 768px):** 4-column layout with 12px outer margins. Dense data lists swap multi-column matrices for vertical key-value telemetry cards.

### Layout Principles
- **No Floating Islands:** Panels abut or sit anchored against viewports using clear linear structural seams rather than floating pill-like groupings.
- **Information Density Priority:** Tables employ compact row heights (32px default, 24px tight) to render minimum 15 entries without viewport pagination.

## Elevation & Depth

Visual hierarchy uses **Calibrated Tonal Stratification and Micro-Line Enclosures**. Heavy blurred drop shadows are prohibited, as they evoke diffuse ambient consumer UI rather than high-contrast technical instrumentation.

### Layer Tiers
- **Tier 0 (Viewport Floor / Sensor Void):** `#0b0f14`. Used for real-time WebGL/Three.js thermal viewports, canvas backgrounds, and raw data streams.
- **Tier 1 (Base Panel Enclosure):** `#121820` with a 1px solid `#1e293b` border. Houses tables, filter sidebars, metadata summaries, and graph regions.
- **Tier 2 (Popovers, Tooltips & Inspect Flyouts):** `#1a2330` with a 1px solid `#334155` border. Augmented with a crisp, non-diffuse optical offset shadow: `0 4px 12px rgba(0, 0, 0, 0.6)`.
- **Tier 3 (Active Focus & Modal Target):** Grounded at `#1a2330`, bordered in `interactive-primary` (`#f59e0b`) or ringed with `0 0 0 1px #f59e0b, 0 0 8px rgba(245, 158, 11, 0.25)`.

### Border Discipline
Depth separation relies primarily on 1px borders rather than shadow radii. Inner nested panels must use `#1e293b`, while targeted active selections snap directly to `#f59e0b`.

## Shapes

The design system implements a strict, industrial geometry. Curves are restricted to subtle `0.25rem` (4px) micro-radii to prevent visual softening and maintain architectural sharpness.

### Geometry Hierarchy
- **Base Surfaces & Cards:** `rounded` (4px). Clean, technical edges matching lab monitor bezels.
- **Data Badges, Chips & Code Blocks:** `rounded` (4px). Compact bounding boundaries.
- **Form Controls & Inputs:** `rounded` (4px). Precise alignment with tabular rows.
- **Reticles & Viewport Coordinate Crosshairs:** 0px radius (sharp corners) to preserve measurement precision.
- **Circular Elements:** Reserved exclusively for telemetry node status dots (6px) or user avatar indicators. Never use rounded pill containers for buttons or tags.

## Components

### Primary & Action Buttons
- **Primary:** Solid `#f59e0b` background with jet `#0b0f14` text (`Inter` SemiBold 13px). Hover transitions to `#fb923c`. Active state triggers `#ea580c`. 
- **Secondary (Technical Outline):** Transparent background, 1px border `#334155`, text `#f8fafc`. Hover fills with `#1a2330` and elevates border to `#94a3b8`.
- **Ghost Action:** No default border. Hover fills with `#1e293b`.
- **Sizing:** Fixed at 32px height for standard interface buttons; 24px height for micro-actions inside data cells.

### Data Chips & Metadata Badges
- **Specification Chip:** Jet background `#121820`, 1px border `#1e293b`, text `#94a3b8` in `mono-data-sm`. Example: `LWIR 8-14μm`, `VERT: 42.1K`, `EMISSIVITY: 0.94`.
- **License / Verification Badge:** Monospaced label with prefix dot. Green dot (`#10b981`) for `CC-BY 4.0 [VERIFIED]`, Amber dot (`#f59e0b`) for `RESTRICTED / ACADEMIC`.

### Scientific Data Tables
- **Header:** Sticky `#121820` background, 28px height, `label-caps` in `#64748b`, bottom border 1px `#334155`.
- **Rows:** Alternating striping is avoided; differentiation is achieved through 1px horizontal borders in `#1e293b`. Hover activates `#1a2330` with an amber left edge line (2px `#f59e0b`).
- **Cells:** Vertical padding at `space-xs` (4px), horizontal at `space-md` (12px). All measurements aligned to decimal point or right-aligned.

### Input Fields & Filter Steppers
- **Base Container:** Background `#0b0f14`, 1px border `#334155`, text `#f8fafc` in `mono-data-md`, placeholder in `#475569`.
- **Focus Ring:** 1px solid `#f59e0b` with no offset blur.
- **Range Sliders (Wavelength / Temp Filtering):** 2px track in `#1e293b`. Filled segment in `#f59e0b`. Thumb is a sharp 12px × 12px square in `#f8fafc` with a 1px border in `#ea580c`.

### Checkboxes & Segmented Toggles
- **Checkbox:** 14px × 14px box, 1px border `#334155`, background `#121820`. Checked state: background `#f59e0b`, check glyph `#0b0f14`.
- **Segmented Radio Controller:** Segment strip inside `#0b0f14` tray. Active segment is `#1a2330` with `#f8fafc` text and 1px border `#f59e0b`. Inactive segment is `#64748b` text.

### 3D IR Viewport HUD Components
- **Viewport Frame:** Dark background `#0b0f14` surrounded by an inner hairline border (`#1e293b`).
- **Corner Reticles:** Four 8px corner tick marks in `#475569` denoting coordinate capture bounds.
- **Telemetry HUD Overlays:** Floating inspect cards anchored inside the 3D frame: background `rgba(18, 24, 32, 0.85)` with `backdrop-filter: blur(4px)`, 1px border `#334155`, delivering instant polygon, albedo, and thermal radiometric properties.