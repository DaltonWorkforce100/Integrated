import type { ApplianceItem, InsightArticle, ProjectItem } from '../types/teracore';

export const TERACORE_BRAND = {
  name: 'Teracore Integrated Solution',
  shortName: 'Teracore',
  tagline: 'Powering Possibilities. Securing What Matters. Connecting the Future.',
  ceoName: 'Steve Onwubiko',
  ceoTitle: 'Chief Executive Officer',
  phoneDisplay: '+234 706 602 2908',
  phoneHref: 'tel:+2347066022908',
  whatsappNumber: '2347066022908',
  email: 'trevorstones336@gmail.com',
  operatingAreas: 'Enugu (Headquarters) · Lagos · Abuja · Port Harcourt · Commercial Deployments Nationwide',
  headquarters: 'Enugu State, Nigeria',
};

export function buildWhatsAppUrl(prefilledMessage: string): string {
  return `https://wa.me/${TERACORE_BRAND.whatsappNumber}?text=${encodeURIComponent(prefilledMessage)}`;
}

export const ASSETS = {
  heroInfrastructure: '/src/assets/images/hero_teracore_infrastructure_1794648156606.jpg',
  solarArray: '/src/assets/images/service_solar_array_1794648158333.jpg',
  cctvSurveillance: '/src/assets/images/service_cctv_surveillance_1794648156368.jpg',
  itInfrastructure: '/src/assets/images/service_it_infrastructure_1794648159084.jpg',
  ceoPortrait: '/src/assets/images/ceo_steve_onwubiko_1794648158233.jpg',
};

export const TRUST_PILLARS = [
  {
    title: 'Engineered Installations',
    detail: 'Structured site assessments and load calculations prior to deployment.',
  },
  {
    title: 'Tier-1 Equipment Standards',
    detail: 'Genuine inverters, LiFePO4 batteries, IP optics, and enterprise networking.',
  },
  {
    title: 'Trained Technical Teams',
    detail: 'Dedicated solar, security, and IT engineers under unified supervision.',
  },
  {
    title: 'Transparent Proposals',
    detail: 'Clear equipment schedules and honest sizing without hidden compromises.',
  },
  {
    title: 'Responsive Support Desk',
    detail: 'Scheduled preventative maintenance and timely post-handover assistance.',
  },
];

export const WHY_TERACORE_BENEFITS = [
  {
    index: '01',
    title: 'Unified Technical Expertise',
    description:
      'Power, surveillance, and office networks depend on each other. Our engineers design all three layers to work cohesively rather than as conflicting contractor silos.',
  },
  {
    index: '02',
    title: 'Tailored System Sizing',
    description:
      'We audit your actual energy load, camera blind spots, or workstation concurrency before specifying hardware—avoiding undersized inverters or overbuilt budgets.',
  },
  {
    index: '03',
    title: 'Verified Hardware Quality',
    description:
      'Every deployment uses traceable inverters, deep-cycle lithium storage, weatherproof IP cameras, and certified Cat6a/fiber cabling built for Nigerian operating conditions.',
  },
  {
    index: '04',
    title: 'Clean, Architectural Execution',
    description:
      'Neat conduit routing, labelled distribution boards, rack cable management, and clear handover documentation come standard on every residential and commercial site.',
  },
  {
    index: '05',
    title: 'Customer-Focused Delivery',
    description:
      'Direct communication channels, transparent milestone timelines, and plain-language walkthroughs ensure your team knows how to operate every system confidently.',
  },
  {
    index: '06',
    title: 'Ongoing Maintenance & Care',
    description:
      'Installation is the start of reliability. We offer structured maintenance checks, remote diagnostics, firmware updates, and rapid fault resolution.',
  },
];

export const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Consultation',
    description:
      'We listen to your operational challenges, property layout, power reliability goals, security risks, or IT bottlenecks.',
  },
  {
    step: '02',
    title: 'Assessment & Planning',
    description:
      'Our engineers conduct a technical site survey, load calculation, and camera/network mapping to deliver an itemized proposal.',
  },
  {
    step: '03',
    title: 'Implementation',
    description:
      'Certified technicians execute clean installation, conduit work, configuration, stress-testing, and user training.',
  },
  {
    step: '04',
    title: 'Support & Maintenance',
    description:
      'Post-handover monitoring guidance, warranty coordination, and scheduled preventative maintenance keep uptime consistent.',
  },
];

export const REFERENCE_PROJECTS: ProjectItem[] = [
  {
    id: 'ref-solar-commercial-hybrid',
    title: 'Commercial Office Hybrid Solar & Lithium Microgrid',
    category: 'solar',
    location: 'Victoria Island, Lagos · Reference Architecture',
    description:
      'Three-phase hybrid solar architecture engineered to eliminate daytime diesel generator runtime for multi-floor corporate offices while sustaining server room and lighting loads overnight.',
    equipmentUsed: 'Three-phase Hybrid Inverters · Monocrystalline PV Array · Rack-mounted LiFePO4 Battery Bank · Automatic Changeover & Surge Protection',
    results: 'Designed for continuous daytime solar priority and seamless sub-20ms backup switchover for critical IT workstations.',
    imageUrl: ASSETS.solarArray,
    published: true,
    isReferenceBlueprint: true,
  },
  {
    id: 'ref-cctv-perimeter-ip',
    title: 'Multi-Zone Commercial IP Surveillance & NVR Command Setup',
    category: 'cctv',
    location: 'Abuja Business District · Reference Architecture',
    description:
      'Full-perimeter high-definition PoE IP camera network covering entry gates, parking bays, reception lobbies, and warehouse loading docks with encrypted mobile and desktop remote viewing.',
    equipmentUsed: '4K/5MP Color-Night-Vision IP Turret & Bullet Cameras · PoE+ Managed Switches · Redundant NVR Storage · Dedicated Backup Power',
    results: '24/7 continuous recording retention paired with instant motion zone alerts accessible to authorized management remotely.',
    imageUrl: ASSETS.cctvSurveillance,
    published: true,
    isReferenceBlueprint: true,
  },
  {
    id: 'ref-it-structured-network',
    title: 'Enterprise Structured Cabling & Core Network Deployment',
    category: 'it',
    location: 'Ikeja & Lekki Offices · Reference Architecture',
    description:
      'Complete office IT backbone deployment featuring neatly terminated Cat6a horizontal cabling, segmented VLAN switches, dual-WAN firewall failover, and ceiling-mounted enterprise Wi-Fi 6 access points.',
    equipmentUsed: '42U/24U Server Cabinets · Cat6a Shielded Patch Panels · Enterprise Managed Switches · Dual-WAN Router & Ceiling Access Points',
    results: 'Eliminates dead Wi-Fi zones and unplanned office downtime with documented port mapping and UPS-protected rack power.',
    imageUrl: ASSETS.itInfrastructure,
    published: true,
    isReferenceBlueprint: true,
  },
];

export const DEFAULT_INSIGHTS: InsightArticle[] = [
  {
    id: 'insight-solar-sizing-nigeria',
    title: 'How to Size a Hybrid Solar & Inverter System for Nigerian Homes and Offices',
    category: 'solar',
    summary:
      'Understand the difference between peak surge watts, continuous inverter kVA, and lithium battery kWh capacity before purchasing solar equipment.',
    readTime: '5 min read',
    published: true,
    body: `Many solar buyers focus exclusively on inverter kVA rating while overlooking daily kilowatt-hour (kWh) energy consumption and battery depth-of-discharge. In Nigeria, where solar systems often bridge extended grid outages, balanced sizing across three layers is essential.

1. Separate Continuous Load from Peak Surge
Inverter air conditioners, borehole pumps, and laser printers draw higher startup current than their running label suggests. A 5 kVA inverter may run steady office lighting and laptops smoothly, yet trip if a heavy inductive motor starts simultaneously without soft-start allowance.

2. Match Battery kWh to Your Nighttime Autonomy Window
Solar panels power daytime operations and charge your battery bank. Your lithium (LiFePO4) battery bank—measured in kilowatt-hours (kWh)—determines how long critical loads remain online after sunset. For example, a 1.5 kW continuous nighttime load over 8 hours requires 12 kWh of usable energy, which typically calls for at least 15 kWh of nominal lithium storage.

3. Roof Orientation, Shading, and Surge Protection
Even high-efficiency monocrystalline panels lose substantial yield if partially shaded by parapet walls or neighboring structures. Proper DC isolators, earthing, and Type 2 surge arresters protect your investment during intense seasonal thunderstorms.

Before committing to hardware, use Teracore's Solar System Estimator or book an on-site load audit so every component matches your real consumption profile.`,
  },
  {
    id: 'insight-ip-vs-hd-cctv',
    title: 'IP Cameras vs. HD Analog CCTV: Choosing the Right Security Architecture',
    category: 'cctv',
    summary:
      'Compare image clarity, cabling scalability, remote viewing reliability, and total ownership cost when securing commercial or residential premises.',
    readTime: '4 min read',
    published: true,
    body: `When planning surveillance for a home, estate, retail store, or corporate facility, one of the first engineering decisions is choosing between IP (Internet Protocol) network cameras and HD coaxial (DVR) systems.

IP Network Surveillance (NVR + PoE)
IP cameras transmit digital video over Cat6 Ethernet cables powered via PoE (Power over Ethernet). Each camera handles onboard image processing, delivering sharper facial and license-plate detail, intelligent line-crossing detection, and cleaner expansion across large multi-building sites using fiber uplinks.

HD Analog Surveillance (DVR + Coaxial)
For properties with existing RG59 coaxial cabling or compact single-building budgets, modern HD-TVI/CVI cameras remain a practical upgrade path—delivering 1080p to 5MP clarity without replacing legacy cables.

The Non-Negotiable Factor: Dedicated Backup Power
A surveillance system that shuts off during a power outage creates predictable security blind spots. Every Teracore CCTV deployment incorporates dedicated UPS or solar-hybrid power integration so cameras and NVR storage continue recording uninterrupted.`,
  },
  {
    id: 'insight-structured-cabling-office',
    title: 'Why Structured Cabling & Network Segmentation Matter for Growing Businesses',
    category: 'it',
    summary:
      'Prevent Wi-Fi congestion, tangled server closets, and security vulnerabilities with documented Cat6a cabling and VLAN architecture.',
    readTime: '4 min read',
    published: true,
    body: `As businesses scale past ten workstations, ad-hoc consumer routers and loose floor-level Ethernet cords quickly become operational liabilities. Slow file transfers, dropped VoIP calls, and unidentifiable cables cost teams hours every week.

1. Labelled Patch Panels & Tested Cat6a Runs
Structured cabling connects every wall port cleanly back to a central patch panel inside a ventilated rack. Each termination is tested and numbered, allowing instant port tracing when troubleshooting or relocating desks.

2. VLAN Segmentation for Guest vs. Staff Traffic
Separating corporate workstations, CCTV cameras, VoIP phones, and visitor Wi-Fi onto distinct Virtual LANs prevents guest devices from congesting critical business traffic or accessing internal servers.

3. Dual-WAN Failover & Rack UPS Protection
Pairing primary fiber internet with a secondary LTE/5G or microwave link through a business firewall keeps cloud workflows online even when one ISP experiences downtime.`,
  },
];

export const SOLAR_APPLIANCE_PRESETS: ApplianceItem[] = [
  { id: 'led-lights', name: 'LED Lights (per 10 bulbs)', watts: 100, defaultHours: 8, category: 'Lighting & Home' },
  { id: 'ceiling-fan', name: 'Ceiling / Standing Fan', watts: 65, defaultHours: 10, category: 'Cooling' },
  { id: 'inverter-ac-15', name: 'Inverter AC (1.5 HP)', watts: 1100, defaultHours: 6, category: 'Cooling' },
  { id: 'fridge', name: 'Refrigerator / Freezer (Inverter)', watts: 180, defaultHours: 12, category: 'Lighting & Home' },
  { id: 'tv', name: 'Smart TV & Decoder', watts: 140, defaultHours: 6, category: 'Lighting & Home' },
  { id: 'laptop', name: 'Office Laptop / Workstation', watts: 90, defaultHours: 8, category: 'Computing & Office' },
  { id: 'desktop', name: 'Desktop PC + Monitor', watts: 220, defaultHours: 8, category: 'Computing & Office' },
  { id: 'router-cctv', name: 'Wi-Fi Router + CCTV NVR', watts: 110, defaultHours: 24, category: 'Computing & Office' },
  { id: 'printer', name: 'Office Laser Printer (Intermittent)', watts: 500, defaultHours: 1, category: 'Computing & Office' },
  { id: 'water-pump', name: 'Water Borehole Pump (1 HP)', watts: 850, defaultHours: 1, category: 'Pumps & Heavy' },
];

export const SOLAR_FAQS = [
  {
    q: 'Can solar power air conditioners and office equipment reliably?',
    a: 'Yes. Properly sized hybrid solar systems with inverter-grade air conditioners and adequate lithium battery storage comfortably run commercial offices and residential homes. Our engineers calculate both running wattage and startup surge before recommending an inverter capacity.',
  },
  {
    q: 'What is the difference between a hybrid inverter and a standard inverter?',
    a: 'A hybrid inverter manages solar PV input, grid/generator power, and battery charging simultaneously in one integrated unit—prioritizing free solar energy first and switching seamlessly during outages without manual intervention.',
  },
  {
    q: 'How long does a typical installation take?',
    a: 'Residential hybrid deployments typically complete within 2 to 4 days after equipment delivery and site preparation. Larger commercial installations are scheduled in phased engineering milestones to minimize operational disruption.',
  },
  {
    q: 'Do you provide maintenance and after-sales technical support?',
    a: 'Yes. Teracore provides system handover training, remote monitoring guidance, and scheduled preventative maintenance including panel cleaning checks, terminal torque inspection, and firmware updates.',
  },
];

export const CCTV_FAQS = [
  {
    q: 'Can I view my CCTV cameras remotely on my phone when travelling?',
    a: 'Yes. Every NVR and IP surveillance setup we commission includes secure mobile and desktop app configuration so authorized users can review live feeds and playback recordings anywhere with internet access.',
  },
  {
    q: 'Will my cameras keep recording during a power outage?',
    a: 'Yes, when paired with our dedicated surveillance UPS or integrated solar-inverter backup circuit. Keeping cameras active during grid outages is a standard design priority in every Teracore security proposal.',
  },
  {
    q: 'How many days of footage can the system store?',
    a: 'Retention depends on camera count, resolution, motion-recording schedule, and hard drive capacity. We size enterprise surveillance drives (typically 14 to 45+ days) based on your security policy.',
  },
  {
    q: 'Can Teracore upgrade or fix an existing CCTV installation?',
    a: 'Yes. We audit existing cabling, recorders, and blind spots, then replace faulty cameras, upgrade DVR storage, or transition key zones to higher-clarity IP optics.',
  },
];

export const IT_FAQS = [
  {
    q: 'Can Teracore handle complete office IT setup from scratch?',
    a: 'Yes. We design and deploy structured Cat6a cabling, server racks, managed switches, business Wi-Fi access points, workstation procurement, and cloud productivity setups for new or expanding offices.',
  },
  {
    q: 'Do you offer ongoing IT support for businesses without a full-time IT department?',
    a: 'Yes. Businesses can engage Teracore for scheduled preventative IT maintenance, helpdesk troubleshooting, network health monitoring, and rapid on-site hardware/software support.',
  },
  {
    q: 'How do you prevent office Wi-Fi dead zones and internet drops?',
    a: 'Instead of relying on single consumer routers, we deploy ceiling-mounted enterprise access points wired via PoE back to a central managed switch, alongside dual-WAN failover routers where uptime is mission-critical.',
  },
  {
    q: 'Can IT infrastructure be integrated with our solar and CCTV power?',
    a: 'Yes. That is a core Teracore advantage—we ensure server racks, routers, and PoE switches sit cleanly on clean UPS/solar-backed circuits for uninterrupted uptime.',
  },
];
