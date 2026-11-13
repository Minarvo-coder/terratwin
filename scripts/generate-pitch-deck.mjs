import pptxgen from 'pptxgenjs';
import path from 'path';
import fs from 'fs';

const pptxPath = path.resolve('c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/TerraTwin_Hackathon_Winning_Deck.pptx');
const legacyPptxPath = path.resolve('c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/TerraTwin_Pitch_Deck.pptx');

console.log('Generating Hackathon-Winning 8-Slide Presentation for Team HEXARCHY...');

// 1. Initialize presentation
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10.0 x 5.625 inches
pres.author = 'Team HEXARCHY';
pres.company = 'NASA Space Apps Challenge 2026';
pres.title = 'TerraTwin — Planetary Analog Portfolio Optimizer';
pres.subject = 'Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars';

// Master Theme Colors
const C = {
  bg: '070B14',          // Deep Cosmic Space Black
  cardBg: '0E172A',      // Premium Glass Navy
  cardBgAlt: '0A1120',   // Darker Contrast Slate
  cardBorder: '1E293B',  // Clean subtle border
  cardBorderCyan: '0284C7', // Active Cyan border
  accentCyan: '00D2FF',  // Electric Mission Cyan
  accentBlue: '2563EB',  // NASA Blue
  accentGreen: '10B981', // Synergy Emerald
  accentAmber: 'F59E0B', // Mission Gold
  accentRed: 'F43F5E',   // High-Risk Coral Red
  accentPurple: '8B5CF6',// Geochemical Purple
  textWhite: 'FFFFFF',   // Pure White
  textLight: 'F1F5F9',   // Off-white headline
  textMuted: '94A3B8',   // Slate gray body
  textDim: '64748B',     // Dim helper
};

// Helper: Common slide background and subtle aerospace border
function initSlide(slide, categoryLabel) {
  slide.background = { color: C.bg };
  
  // Top thin accent rule
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 0.05,
    fill: { color: C.accentCyan },
    line: { color: C.accentCyan, width: 0 }
  });

  // Top Category Pill & Event Tag (if provided)
  if (categoryLabel) {
    slide.addText(categoryLabel.toUpperCase(), {
      x: 0.7, y: 0.35, w: 5.0, h: 0.22,
      fontSize: 8.5, bold: true, color: C.accentCyan, fontFace: 'Arial',
      charSpacing: 1.5
    });
    slide.addText('NASA SPACE APPS CHALLENGE 2026  •  TEAM HEXARCHY', {
      x: 5.5, y: 0.35, w: 3.8, h: 0.22,
      fontSize: 8, bold: true, color: C.textDim, align: 'right', fontFace: 'Arial'
    });
  }
}

// -------------------------------------------------------------
// SLIDE 1: Title & Cinematic Hook
// -------------------------------------------------------------
{
  const s = pres.addSlide();
  initSlide(s, null);

  // Challenge Category Pill
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 0.45, w: 3.2, h: 0.3, r: 0.15,
    fill: { color: '0F1D38' }, line: { color: C.accentCyan, width: 1 }
  });
  s.addText('NASA SPACE APPS CHALLENGE 2026', {
    x: 0.8, y: 0.45, w: 3.2, h: 0.3,
    fontSize: 8.5, bold: true, color: C.accentCyan, align: 'center', valign: 'middle'
  });

  // Cinematic Hook
  s.addText('BEFORE WE LAND ON MARS & THE MOON, WE MUST MASTER EARTH', {
    x: 0.8, y: 0.9, w: 8.4, h: 0.25,
    fontSize: 9.5, bold: true, color: C.accentAmber, fontFace: 'Arial', charSpacing: 1.2
  });

  // Project Title
  s.addText('TERRATWIN', {
    x: 0.8, y: 1.15, w: 8.4, h: 0.9,
    fontSize: 48, bold: true, color: C.accentCyan, fontFace: 'Arial'
  });

  // Subtitle
  s.addText('The World\'s First Planetary Analog Portfolio Optimizer', {
    x: 0.8, y: 2.05, w: 8.4, h: 0.4,
    fontSize: 16, bold: true, color: C.textWhite, fontFace: 'Arial'
  });

  // Challenge Track Card
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 2.6, w: 8.4, h: 0.8, r: 0.08,
    fill: { color: C.cardBg }, line: { color: C.cardBorder, width: 1 }
  });
  s.addText('OFFICIAL CHALLENGE TRACK', {
    x: 1.0, y: 2.7, w: 8.0, h: 0.2,
    fontSize: 8, bold: true, color: C.accentAmber
  });
  s.addText('Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars', {
    x: 1.0, y: 2.92, w: 8.0, h: 0.38,
    fontSize: 11.5, bold: true, color: C.textWhite
  });

  // Team Card (6 Members with Clean Grid Layout)
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 3.55, w: 8.4, h: 1.55, r: 0.08,
    fill: { color: C.cardBgAlt }, line: { color: C.accentBlue, width: 1 }
  });
  s.addText('TEAM HEXARCHY  •  INTERDISCIPLINARY MISSION CREW', {
    x: 1.0, y: 3.68, w: 8.0, h: 0.22,
    fontSize: 9, bold: true, color: C.accentCyan, charSpacing: 1
  });
  
  // Member Column 1
  s.addText(
    '• Minarvo Dhar Chowdhory — Team Lead & System Architect\n' +
    '• Mohammad mobashir — Algorithm & Math Lead\n' +
    '• Ishita Bera — Topography & Geomorphology Lead',
    {
      x: 1.0, y: 3.95, w: 4.0, h: 0.95,
      fontSize: 9, color: C.textWhite, lineSpacingMultiple: 1.3
    }
  );
  // Member Column 2
  s.addText(
    '• Mayank Biswas — Database, Security & QA Lead\n' +
    '• Ifat Alia — Planetary Science & Dataset Lead\n' +
    '• Jannat Fatema — 3D WebGL & GIS Visualization Lead',
    {
      x: 5.2, y: 3.95, w: 4.0, h: 0.95,
      fontSize: 9, color: C.textWhite, lineSpacingMultiple: 1.3
    }
  );

  s.addNotes('Good morning judges, we are Team HEXARCHY, and we are proud to present TerraTwin. Before NASA lands astronauts for permanent Artemis lunar bases or deploys rovers across Mars, testing hardware on Earth is essential. TerraTwin is an intelligent planetary analog suite that mathematically identifies and optimizes multi-site Earth portfolios for lunar and Martian exploration.');
}

// -------------------------------------------------------------
// SLIDE 2: The Problem (The Multi-Billion Dollar Blindspot)
// -------------------------------------------------------------
{
  const s = pres.addSlide();
  initSlide(s, 'The Multi-Billion Dollar Bottleneck');

  s.addText('No Single Place on Earth Replicates Mars or the Moon', {
    x: 0.7, y: 0.6, w: 8.6, h: 0.45,
    fontSize: 22, bold: true, color: C.textWhite
  });

  // Hero Stat Box (Dramatic High-Risk Warning)
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.7, y: 1.15, w: 8.6, h: 1.25, r: 0.08,
    fill: { color: '220D13' }, line: { color: C.accentRed, width: 1.5 }
  });
  s.addText('>60%', {
    x: 0.9, y: 1.25, w: 2.1, h: 1.05,
    fontSize: 48, bold: true, color: C.accentRed, align: 'center', valign: 'middle'
  });
  s.addText('OF CRITICAL ENVIRONMENTAL VARIABLES REMAIN UNTESTED\nWhen space exploration hardware is tested at only a single Earth analog site, leaving rovers, lander plumes, and life-detection instruments vulnerable to catastrophic flight failures on extraterrestrial soil.', {
    x: 3.1, y: 1.3, w: 6.0, h: 0.95,
    fontSize: 10.5, bold: true, color: C.textWhite, lineSpacingMultiple: 1.35
  });

  // Two Comparative Pillars
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.7, y: 2.55, w: 4.15, h: 2.6, r: 0.08,
    fill: { color: C.cardBg }, line: { color: C.cardBorder, width: 1 }
  });
  s.addText('THE FLAW OF SINGLE-SITE TESTING', {
    x: 0.9, y: 2.7, w: 3.75, h: 0.25,
    fontSize: 10.5, bold: true, color: C.accentAmber
  });
  s.addText(
    '• Fragmented Literature: Mission teams spend months manually cross-referencing isolated scientific papers.\n' +
    '• Dangerous Compromises: Choosing one site (e.g. Atacama) forces teams to ignore lunar topography or mineralogy.\n' +
    '• Unquantified Risk: Zero mathematical metrics exist to measure what remains untested before launch.',
    {
      x: 0.9, y: 3.05, w: 3.75, h: 1.9,
      fontSize: 9, color: C.textMuted, lineSpacingMultiple: 1.35
    }
  );

  s.addShape(pres.ShapeType.roundRect, {
    x: 5.15, y: 2.55, w: 4.15, h: 2.6, r: 0.08,
    fill: { color: C.cardBg }, line: { color: C.cardBorder, width: 1 }
  });
  s.addText('THE PLANETARY ANALOG REALITY', {
    x: 5.35, y: 2.7, w: 3.75, h: 0.25,
    fontSize: 10.5, bold: true, color: C.accentCyan
  });
  s.addText(
    '• Lake Salda (Turkey): Matches Jezero Crater hydromagnesite carbonates, but completely lacks Martian cold (-60°C).\n' +
    '• Atacama Yungay (Chile): Matches hyper-aridity and UV flux, but fails to match steep lunar impact slopes.\n' +
    '• Mauna Kea (USA): Matches basaltic volcanic tephra, but lacks hyper-saline sulfate evaporite chemistry.',
    {
      x: 5.35, y: 3.05, w: 3.75, h: 1.9,
      fontSize: 9, color: C.textMuted, lineSpacingMultiple: 1.35
    }
  );

  s.addNotes('Every planetary scientist knows an inconvenient truth: Earth does not possess a single twin for Mars or the Moon. Lake Salda matches Jezero Crater\'s carbonate minerals, but lacks Martian extreme cold. The Atacama Desert matches extreme aridity, but misses lunar slopes. Testing at just one site leaves over 60% of critical mission variables untested, leading to unforeseen hardware risks.');
}

// -------------------------------------------------------------
// SLIDE 3: The Solution (Combinatorial Synergy Engine)
// -------------------------------------------------------------
{
  const s = pres.addSlide();
  initSlide(s, 'The Algorithmic Breakthrough');

  s.addText('Combinatorial Multi-Site Portfolio Optimization', {
    x: 0.7, y: 0.6, w: 8.6, h: 0.45,
    fontSize: 22, bold: true, color: C.textWhite
  });

  const cards = [
    {
      step: '01',
      title: 'QUANTIFIED MATCHING',
      accent: C.accentCyan,
      body: '• 12 physical dimensions normalized via empirical tolerance windows.\n• Bounded [0, 1] Euclidean distance:\n  S = 100 × (1 - D)\n• Completely deterministic & reproducible with zero AI hallucination.'
    },
    {
      step: '02',
      title: 'COMBINATORIAL ENSEMBLE',
      accent: C.accentBlue,
      body: '• Exhaustively evaluates C(n, 2) pairs & C(n, 3) trios without replacement.\n• Credits the optimal site per feature to eliminate individual blindspots.\n• Achieves >90% cumulative feature coverage over target profiles.'
    },
    {
      step: '03',
      title: 'MEASURED SYNERGY GAIN',
      accent: C.accentGreen,
      body: '• Mathematical metric:\n  ΔS = S_portfolio - max(S_i)\n• Proven +14% to +22% coverage leap over the single best Earth site.\n• Automatically flags residual deficits for total mission transparency.'
    }
  ];

  cards.forEach((c, idx) => {
    const x = 0.7 + idx * 2.95;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 1.25, w: 2.7, h: 3.9, r: 0.08,
      fill: { color: C.cardBg }, line: { color: c.accent, width: 1.2 }
    });
    // Step pill
    s.addText(c.step, {
      x: x + 0.15, y: 1.45, w: 0.6, h: 0.25,
      fontSize: 10, bold: true, color: c.accent
    });
    s.addText(c.title, {
      x: x + 0.15, y: 1.75, w: 2.4, h: 0.35,
      fontSize: 11, bold: true, color: C.textWhite
    });
    s.addText(c.body, {
      x: x + 0.15, y: 2.2, w: 2.4, h: 2.8,
      fontSize: 9, color: C.textMuted, lineSpacingMultiple: 1.35
    });
  });

  s.addNotes('TerraTwin replaces guesswork with mathematics. Instead of searching for one impossible twin, our combinatorial engine evaluates combinations of two or three complementary Earth sites. By taking the best-matching site for each specific environmental parameter, TerraTwin builds an optimized testing portfolio, delivering a verified Synergy Gain that elevates test coverage above 90%.');
}

// -------------------------------------------------------------
// SLIDE 4: Live Demo (Mission Control Flight Deck)
// -------------------------------------------------------------
{
  const s = pres.addSlide();
  initSlide(s, 'Working Software Demonstration');

  s.addText('Dual 3D Reconnaissance Flight Deck & Portfolio Engine', {
    x: 0.7, y: 0.6, w: 8.6, h: 0.45,
    fontSize: 22, bold: true, color: C.textWhite
  });

  // Left Window: 3D Mission Control
  const img1 = path.resolve('docs/screenshots/02-mission-control-dashboard.png');
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.7, y: 1.2, w: 4.2, h: 3.3, r: 0.06,
    fill: { color: '000000' }, line: { color: C.cardBorderCyan, width: 1.2 }
  });
  if (fs.existsSync(img1)) {
    s.addImage({
      path: img1,
      x: 0.72, y: 1.22, w: 4.16, h: 3.26,
      sizing: { type: 'contain', w: 4.16, h: 3.26 }
    });
  }
  s.addText('3D Planetary Target Flight Deck (Three.js & Leaflet GIS)', {
    x: 0.7, y: 4.58, w: 4.2, h: 0.25,
    fontSize: 9, bold: true, color: C.accentCyan, align: 'center'
  });

  // Right Window: Portfolio Synergy
  const img2 = path.resolve('docs/screenshots/07-mission-suite-portfolio.png');
  s.addShape(pres.ShapeType.roundRect, {
    x: 5.1, y: 1.2, w: 4.2, h: 3.3, r: 0.06,
    fill: { color: '000000' }, line: { color: C.accentGreen, width: 1.2 }
  });
  if (fs.existsSync(img2)) {
    s.addImage({
      path: img2,
      x: 5.12, y: 1.22, w: 4.16, h: 3.26,
      sizing: { type: 'contain', w: 4.16, h: 3.26 }
    });
  }
  s.addText('Combinatorial Portfolio Engine with +14.2% Synergy Gain', {
    x: 5.1, y: 4.58, w: 4.2, h: 0.25,
    fontSize: 9, bold: true, color: C.accentGreen, align: 'center'
  });

  // Bottom Interactive Pill Bar
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.7, y: 4.95, w: 8.6, h: 0.45, r: 0.06,
    fill: { color: C.cardBg }, line: { color: C.cardBorder, width: 1 }
  });
  s.addText('Interactive Mission Priority Sliders  •  Multi-Axis Radar Comparison  •  Elevation Transects  •  Instant CSV/JSON Manifest Export', {
    x: 0.7, y: 5.05, w: 8.6, h: 0.25,
    fontSize: 8.5, bold: true, color: C.textWhite, align: 'center'
  });

  s.addNotes('Here is our working application. On the left, our 3D flight deck tracks planetary targets like Jezero Crater and Shackleton Crater Rim with authentic NASA textures, synchronized with our Earth GIS map. As mission planners adjust priority sliders, our combinatorial engine instantly evaluates portfolios, displaying our green Synergy Gain metric and exportable campaign reports.');
}

// -------------------------------------------------------------
// SLIDE 5: The 4-Tier Scientific Harmonization Framework
// -------------------------------------------------------------
{
  const s = pres.addSlide();
  initSlide(s, 'Rigorous Scientific Methodology');

  s.addText('The 4-Tier Harmonization Engine: Solving the "Physics Trap"', {
    x: 0.7, y: 0.6, w: 8.6, h: 0.45,
    fontSize: 22, bold: true, color: C.textWhite
  });

  const tiers = [
    {
      tag: 'TIER 1 • DIRECTLY COMPARABLE',
      color: C.accentCyan,
      desc: 'Physical quantities sharing invariant universal metrics across bodies:',
      items: '• Surface Temperature (°C) • Horn (1981) 3x3 Slope (deg)\n• Rock Abundance Area (%) • Broadband Surface Albedo (0-1)'
    },
    {
      tag: 'TIER 2 • RATIO & TIME-NORMALIZED',
      color: C.accentBlue,
      desc: 'Quantities requiring astronomical cycle transformation:',
      items: '• Diurnal Thermal Range (ΔT normalized for Earth 24h vs Mars 24.6h vs Moon 29.5d synodic cycle)\n• Regolith Bulk Density & Porosity Ratios'
    },
    {
      tag: 'TIER 3 • GEOCHEMICAL PROXIES',
      color: C.accentPurple,
      desc: 'Petrogenetic affinity matrices based on planetary mineralogy:',
      items: '• Lithology distance matrix matching basaltic lavas, carbonate microbialites, and sulfate evaporite complexes.'
    },
    {
      tag: 'TIER 4 • PHYSICALLY EXCLUDED FROM SCORING',
      color: C.accentRed,
      desc: 'Incompatible physical regimes recorded for context but strictly excluded:',
      items: '• Atmospheric Pressure (101 kPa vs 0.6 kPa vs 0 Pa) & Liquid Rainfall (Identically 0.0 mm). Excluding them prevents mathematical distortion!'
    }
  ];

  tiers.forEach((t, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.7 + col * 4.4;
    const y = 1.25 + row * 1.95;

    s.addShape(pres.ShapeType.roundRect, {
      x, y, w: 4.2, h: 1.75, r: 0.08,
      fill: { color: C.cardBg }, line: { color: t.color, width: 1.2 }
    });
    s.addText(t.tag, {
      x: x + 0.15, y: y + 0.15, w: 3.9, h: 0.22,
      fontSize: 9, bold: true, color: t.color
    });
    s.addText(t.desc, {
      x: x + 0.15, y: y + 0.4, w: 3.9, h: 0.35,
      fontSize: 8.5, color: C.textWhite
    });
    s.addText(t.items, {
      x: x + 0.15, y: y + 0.78, w: 3.9, h: 0.85,
      fontSize: 8, color: C.textMuted, lineSpacingMultiple: 1.3
    });
  });

  s.addNotes('One of our biggest breakthroughs is solving the cross-body physics trap. You cannot compare Earth sea-level pressure to the lunar vacuum or rainfall to Mars. Many teams fall into this trap. TerraTwin isolates incompatible parameters into Tier 4: we display them for mission context, but strictly exclude them from the similarity denominator so the math remains physically sound.');
}

// -------------------------------------------------------------
// SLIDE 6: 100% Authentic NASA Datasets
// -------------------------------------------------------------
{
  const s = pres.addSlide();
  initSlide(s, 'Authentic Telemetry Lineage');

  s.addText('100% Authentic NASA Datasets — Zero Synthetic Data', {
    x: 0.7, y: 0.6, w: 8.6, h: 0.45,
    fontSize: 22, bold: true, color: C.textWhite
  });

  const datasets = [
    {
      domain: 'MARS ORBITAL & ROVER TELEMETRY',
      accent: C.accentCyan,
      items: '• MGS MOLA MEGDR: 0 m IAU2000 areoid datum, regional slope & roughness\n• Mars 2020 Perseverance MEDA: In situ deltaic surface thermal amplitude\n• MSL Curiosity REMS: In situ Gale Crater floor diurnal ground temperature\n• MER Opportunity Athena: In situ jarosite evaporite geochemistry'
    },
    {
      domain: 'LUNAR RECONNAISSANCE TELEMETRY',
      accent: C.accentBlue,
      items: '• LRO LOLA LDEM: 1,737.4 km lunar sphere relief & Shackleton polar rim transects\n• LRO Diviner DLRE: Cryogenic 40K permanently shadowed cold trap thermometry\n• Apollo 11 & CCGE: Basaltic mare mineralogy & ambient lunar exosphere datum'
    },
    {
      domain: 'EARTH OBSERVATION ARCHIVES',
      accent: C.accentGreen,
      items: '• NASA Langley POWER: 25-yr solar irradiance flux & climatological temperature\n• Copernicus GLO-30 DEM & SRTM: High-resolution digital terrain slope gradients\n• MODIS Terra / Sentinel-2: Multispectral broadband albedo & mineralogy'
    },
    {
      domain: 'LIVE REMOTE SENSING & PROVENANCE',
      accent: C.accentAmber,
      items: '• NASA EOSDIS GIBS: Real-time MODIS & VIIRS daily satellite imagery tile layers\n• 156 Verified Measurements: 100% of telemetry links directly to official NASA PDS and Earthdata HTTPS catalog URLs.'
    }
  ];

  datasets.forEach((d, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.7 + col * 4.4;
    const y = 1.25 + row * 1.95;

    s.addShape(pres.ShapeType.roundRect, {
      x, y, w: 4.2, h: 1.75, r: 0.08,
      fill: { color: C.cardBg }, line: { color: d.accent, width: 1.2 }
    });
    s.addText(d.domain, {
      x: x + 0.15, y: y + 0.15, w: 3.9, h: 0.22,
      fontSize: 9, bold: true, color: d.accent
    });
    s.addText(d.items, {
      x: x + 0.15, y: y + 0.42, w: 3.9, h: 1.2,
      fontSize: 8.5, color: C.textMuted, lineSpacingMultiple: 1.35
    });
  });

  s.addNotes('Scientific validity is our bedrock. TerraTwin uses zero synthetic data. Every number is backed by an authentic instrument: MGS MOLA and LRO LOLA for topographic slopes, Perseverance MEDA and LRO Diviner for thermal ranges, NASA POWER and MODIS for Earth observation, and live satellite tiles streamed via NASA GIBS. Every value is linked to its official NASA archive URL.');
}

// -------------------------------------------------------------
// SLIDE 7: Mission Impact & Differentiation
// -------------------------------------------------------------
{
  const s = pres.addSlide();
  initSlide(s, 'Mission Value & Differentiation');

  s.addText('Measurable Impact for Artemis & Mars Exploration', {
    x: 0.7, y: 0.6, w: 8.6, h: 0.45,
    fontSize: 22, bold: true, color: C.textWhite
  });

  const impacts = [
    {
      title: 'ARTEMIS & CLPS LANDERS',
      accent: C.accentCyan,
      body: '• De-risk rover mobility, wheel slip, and rocket plume-surface blast dynamics on volcanic cinder fields (e.g. Mauna Kea & Craters of the Moon) before launch.\n• Protects multi-million dollar landing gear.'
    },
    {
      title: 'ASTROBIOLOGY FIELD TESTING',
      accent: C.accentBlue,
      body: '• Calibrate life-detection instruments and sample-caching drills for Mars Sample Return at verified geochemical analogs (Lake Salda microbialites & Río Tinto gossans).\n• Provides scientifically defensible campaign plans.'
    },
    {
      title: 'WHAT MAKES US DIFFERENT',
      accent: C.accentGreen,
      body: '• First tool to model multi-site portfolios rather than single sites.\n• Quantifies Synergy Gain mathematically.\n• Rigorous 4-Tier Harmonization excludes atmospheric pressure.\n• Zero black-box AI guessing in the scoring engine.'
    }
  ];

  impacts.forEach((imp, idx) => {
    const x = 0.7 + idx * 2.95;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 1.25, w: 2.7, h: 3.9, r: 0.08,
      fill: { color: C.cardBg }, line: { color: imp.accent, width: 1.2 }
    });
    s.addText(imp.title, {
      x: x + 0.15, y: 1.45, w: 2.4, h: 0.4,
      fontSize: 10.5, bold: true, color: imp.accent
    });
    s.addText(imp.body, {
      x: x + 0.15, y: 2.05, w: 2.4, h: 2.9,
      fontSize: 9, color: C.textMuted, lineSpacingMultiple: 1.4
    });
  });

  s.addNotes('The impact of TerraTwin is immediate. Commercial lunar lander contractors preparing for Artemis can de-risk rover wheels on Hawaii\'s basaltic tephra, while astrobiologists calibrate life-detection tools at Lake Salda. What makes us uniquely innovative is that we don\'t just find a single site—we solve the multi-site portfolio problem and prevent invalid comparisons with our 4-Tier physics framework.');
}

// -------------------------------------------------------------
// SLIDE 8: Team HEXARCHY & Post-Hackathon Roadmap
// -------------------------------------------------------------
{
  const s = pres.addSlide();
  initSlide(s, 'Looking Forward');

  s.addText('Team HEXARCHY & Post-Hackathon Roadmap', {
    x: 0.7, y: 0.6, w: 8.6, h: 0.45,
    fontSize: 22, bold: true, color: C.textWhite
  });

  // Left Column: Team Leadership
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.7, y: 1.25, w: 4.15, h: 3.9, r: 0.08,
    fill: { color: C.cardBg }, line: { color: C.accentCyan, width: 1.2 }
  });
  s.addText('TEAM HEXARCHY  •  MISSION ROSTER', {
    x: 0.9, y: 1.45, w: 3.75, h: 0.25,
    fontSize: 10, bold: true, color: C.accentCyan, charSpacing: 1
  });
  s.addText(
    '• Minarvo Dhar Chowdhory\n  Team Leader & System Architect\n' +
    '• Mohammad mobashir\n  Algorithm & Math Lead\n' +
    '• Ishita Bera\n  Topography & Geomorphology Lead\n' +
    '• Mayank Biswas\n  Database, Security & QA Lead\n' +
    '• Ifat Alia\n  Planetary Science & Dataset Lead\n' +
    '• Jannat Fatema\n  3D WebGL & GIS Visualization Lead',
    {
      x: 0.9, y: 1.8, w: 3.75, h: 3.1,
      fontSize: 9, color: C.textWhite, lineSpacingMultiple: 1.25
    }
  );

  // Right Column: Roadmap & Tools
  s.addShape(pres.ShapeType.roundRect, {
    x: 5.15, y: 1.25, w: 4.15, h: 3.9, r: 0.08,
    fill: { color: C.cardBg }, line: { color: C.accentGreen, width: 1.2 }
  });
  s.addText('POST-HACKATHON ROADMAP & TECH STACK', {
    x: 5.35, y: 1.45, w: 3.75, h: 0.25,
    fontSize: 10, bold: true, color: C.accentGreen, charSpacing: 1
  });
  s.addText(
    'WHAT WE WILL BUILD NEXT:\n' +
    '• Ingest global 1 km rasters via NASA Earthdata CMR API\n' +
    '• Live daily sol weather telemetry feeds from Mars rovers\n' +
    '• Expand to icy worlds (Titan methane lakes & Europa)\n\n' +
    'ENTERPRISE TECH STACK:\n' +
    '• Next.js 16 (React 19, TypeScript App Router)\n' +
    '• Supabase (Cloud PostgreSQL with Row Level Security)\n' +
    '• Three.js 3D WebGL Engine & Leaflet GIS\n' +
    '• Antigravity AI pair programming accelerator',
    {
      x: 5.35, y: 1.8, w: 3.75, h: 3.1,
      fontSize: 9, color: C.textMuted, lineSpacingMultiple: 1.35
    }
  );

  s.addNotes('Team HEXARCHY brought together systems engineering, mathematics, geology, security, and 3D visualization to build TerraTwin with Antigravity and Supabase. Looking forward, our roadmap includes querying global 1-kilometer NASA Earthdata rasters on the fly and expanding to icy worlds like Titan. Thank you, and we welcome your questions!');
}

// Save presentation
await pres.writeFile({ fileName: pptxPath });
console.log(`\nSUCCESS: Generated Hackathon-Winning Deck at:\n${pptxPath}`);
const stats = fs.statSync(pptxPath);
console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);

try {
  await pres.writeFile({ fileName: legacyPptxPath });
  console.log(`Also updated ${legacyPptxPath}`);
} catch (err) {
  console.log(`Note: ${legacyPptxPath} is currently open in PowerPoint and was not overwritten.`);
}
