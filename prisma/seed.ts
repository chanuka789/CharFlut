import { PrismaClient, Role, OrderStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding CharFlut database...')

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123', 12)
  const customerPassword = await bcrypt.hash('Customer@123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@charflut.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@charflut.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  })

  const customer = await prisma.user.upsert({
    where: { email: 'customer@charflut.com' },
    update: {},
    create: {
      name: 'Alex Johnson',
      email: 'customer@charflut.com',
      password: customerPassword,
      role: Role.CUSTOMER,
    },
  })

  console.log(`✓ Users: admin@charflut.com / Admin@123, customer@charflut.com / Customer@123`)

  // ── Categories ─────────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'audio' }, update: {}, create: { name: 'Audio', slug: 'audio' } }),
    prisma.category.upsert({ where: { slug: 'wearables' }, update: {}, create: { name: 'Wearables', slug: 'wearables' } }),
    prisma.category.upsert({ where: { slug: 'photography' }, update: {}, create: { name: 'Photography', slug: 'photography' } }),
    prisma.category.upsert({ where: { slug: 'home-tech' }, update: {}, create: { name: 'Home Tech', slug: 'home-tech' } }),
    prisma.category.upsert({ where: { slug: 'gaming' }, update: {}, create: { name: 'Gaming', slug: 'gaming' } }),
    prisma.category.upsert({ where: { slug: 'mobile' }, update: {}, create: { name: 'Mobile', slug: 'mobile' } }),
  ])

  const [audio, wearables, photography, homeTech, gaming, mobile] = categories
  console.log(`✓ Categories: ${categories.length} created`)

  // ── Products ───────────────────────────────────────────────────────────────
  const productsData = [
    // Audio
    {
      name: 'AuraSound Pro X1',
      slug: 'aurasound-pro-x1',
      shortDesc: 'Studio-grade wireless headphones with adaptive ANC',
      description: 'Experience the future of personal audio with the AuraSound Pro X1. Featuring our proprietary ANC-IV chip that adapts to your environment in real time, these headphones deliver pristine 24-bit audio with a frequency response from 4Hz to 40kHz. The memory foam earcups and titanium headband ensure all-day comfort, while the 30-hour battery keeps you untethered for days.',
      price: 349,
      salePrice: 279,
      sku: 'AS-PRO-X1',
      stock: 42,
      categoryId: audio.id,
      tags: ['headphones', 'anc', 'wireless', 'studio'],
      colors: ['#1a1a2e', '#e2e8f0', '#ffd700'],
      published: true,
      featured: true,
      isNew: true,
      isBest: true,
      rating: 4.8,
      reviewCount: 312,
    },
    {
      name: 'VoidBuds Elite',
      slug: 'voidbuds-elite',
      shortDesc: 'True wireless earbuds with spatial audio',
      description: 'The VoidBuds Elite redefine what earbuds can be. With custom 12mm drivers and a six-mic array for crystal-clear calls, these earbuds fill any space with immersive spatial audio. IPX5 water resistance and a 36-hour total battery life (8 in-bud + 28 in case) make them your perfect daily companion.',
      price: 199,
      salePrice: null,
      sku: 'VB-ELITE',
      stock: 88,
      categoryId: audio.id,
      tags: ['earbuds', 'wireless', 'spatial-audio', 'ipx5'],
      colors: ['#0f0f23', '#f8fafc', '#6366f1'],
      published: true,
      featured: true,
      isNew: false,
      isBest: true,
      rating: 4.6,
      reviewCount: 187,
    },
    {
      name: 'SonicBar Neo',
      slug: 'sonicbar-neo',
      shortDesc: 'Dolby Atmos soundbar with wireless subwoofer',
      description: 'The SonicBar Neo transforms any living space into a cinema. With 11 discrete audio channels, Dolby Atmos, and DTS:X support, combined with a 8-inch wireless subwoofer delivering 200W of bass, every movie night becomes an event. Calibrates automatically to your room acoustics via our NeoCalibrate AI.',
      price: 599,
      salePrice: 449,
      sku: 'SB-NEO',
      stock: 25,
      categoryId: audio.id,
      tags: ['soundbar', 'dolby-atmos', 'home-theater'],
      colors: ['#1e1e2e', '#334155'],
      published: true,
      featured: false,
      isNew: false,
      isBest: true,
      rating: 4.7,
      reviewCount: 94,
    },
    {
      name: 'PulseWave Portable',
      slug: 'pulsewave-portable',
      shortDesc: '360° Bluetooth speaker with 20-hour battery',
      description: 'Go wherever the music takes you with PulseWave Portable. The omnidirectional acoustic design fills any space with rich, room-filling sound from a speaker small enough to fit in your backpack. Military-grade drop protection, IP67 waterproofing, and a beefy 20-hour battery mean it is ready for any adventure.',
      price: 129,
      salePrice: null,
      sku: 'PW-PORT',
      stock: 156,
      categoryId: audio.id,
      tags: ['bluetooth', 'portable', 'waterproof', 'outdoor'],
      colors: ['#0ea5e9', '#10b981', '#f59e0b', '#1e1e2e'],
      published: true,
      featured: false,
      isNew: true,
      isBest: false,
      rating: 4.4,
      reviewCount: 221,
    },
    // Wearables
    {
      name: 'Apex Watch Ultra',
      slug: 'apex-watch-ultra',
      shortDesc: 'The world\'s most advanced smartwatch',
      description: 'Apex Watch Ultra is the pinnacle of wearable technology. The titanium chassis houses a always-on micro-AMOLED display visible even in direct sunlight, advanced biometrics including ECG and continuous blood glucose monitoring, and an 18-day battery with solar charging. Tracks over 100 workout modes with military-standard GPS accuracy.',
      price: 799,
      salePrice: null,
      sku: 'AW-ULTRA',
      stock: 31,
      categoryId: wearables.id,
      tags: ['smartwatch', 'fitness', 'gps', 'titanium'],
      colors: ['#1e293b', '#f1f5f9', '#f59e0b'],
      published: true,
      featured: true,
      isNew: true,
      isBest: true,
      rating: 4.9,
      reviewCount: 456,
    },
    {
      name: 'FitBand Slim',
      slug: 'fitband-slim',
      shortDesc: 'Ultra-thin health tracker with 14-day battery',
      description: 'FitBand Slim proves that the best tech disappears. At just 8mm thick, this fitness tracker continuously monitors heart rate, SpO2, sleep stages, and stress levels without ever getting in the way. The color AMOLED touchscreen reads in any light, and the 14-day battery means you charge it twice a month.',
      price: 149,
      salePrice: 119,
      sku: 'FB-SLIM',
      stock: 203,
      categoryId: wearables.id,
      tags: ['fitness-tracker', 'health', 'slim', 'amoled'],
      colors: ['#1e1e2e', '#f8fafc', '#ec4899', '#3b82f6'],
      published: true,
      featured: false,
      isNew: false,
      isBest: true,
      rating: 4.5,
      reviewCount: 389,
    },
    {
      name: 'VisionAR Glasses',
      slug: 'visionar-glasses',
      shortDesc: 'Lightweight augmented reality glasses',
      description: 'VisionAR bridges the physical and digital worlds with style. These sleek AR glasses project a crisp, full-color display into your field of view while AI-powered scene understanding overlays relevant information in real time. Compatible with iOS and Android, they weigh just 47g and look indistinguishable from premium fashion eyewear.',
      price: 1299,
      salePrice: null,
      sku: 'VA-GLASS',
      stock: 12,
      categoryId: wearables.id,
      tags: ['ar', 'smart-glasses', 'augmented-reality'],
      colors: ['#1e1e2e', '#94a3b8'],
      published: true,
      featured: true,
      isNew: true,
      isBest: false,
      rating: 4.2,
      reviewCount: 67,
    },
    // Photography
    {
      name: 'LensFlare Pro 4K',
      slug: 'lensflare-pro-4k',
      shortDesc: 'Mirrorless camera with AI scene recognition',
      description: 'The LensFlare Pro 4K is the camera for the next generation of creators. A 45MP full-frame BSI sensor captures stunning detail in any light, while the EXPEED 8 AI processor recognizes over 1,000 subjects for instant perfect exposure. 8K RAW video, 120fps 4K, and in-body 8-axis stabilization make every shot count.',
      price: 2499,
      salePrice: 1999,
      sku: 'LF-PRO-4K',
      stock: 18,
      categoryId: photography.id,
      tags: ['camera', 'mirrorless', '4k', 'full-frame'],
      colors: ['#1e1e2e'],
      published: true,
      featured: true,
      isNew: true,
      isBest: true,
      rating: 4.9,
      reviewCount: 143,
    },
    {
      name: 'DroneView X5',
      slug: 'droneview-x5',
      shortDesc: 'Professional drone with 6K camera',
      description: 'Take your perspective to new heights with DroneView X5. The 6K three-axis stabilized gimbal captures cinematic footage in any condition, while obstacle avoidance and return-to-home AI keep it safe. 48-minute flight time and a 15km transmission range give you unparalleled creative freedom.',
      price: 1799,
      salePrice: null,
      sku: 'DV-X5',
      stock: 22,
      categoryId: photography.id,
      tags: ['drone', '6k', 'professional', 'aerial'],
      colors: ['#f1f5f9', '#1e1e2e'],
      published: true,
      featured: false,
      isNew: false,
      isBest: true,
      rating: 4.7,
      reviewCount: 88,
    },
    // Home Tech
    {
      name: 'HubCore Smart Hub',
      slug: 'hubcore-smart-hub',
      shortDesc: 'Central smart home controller with Matter support',
      description: 'HubCore brings every smart home device under one roof. With native Matter, Thread, Zigbee, and Z-Wave support, it connects to over 50,000 compatible devices from any brand. The built-in AI learns your routines and automates your home proactively, while local processing ensures your data never leaves home.',
      price: 249,
      salePrice: 199,
      sku: 'HC-HUB',
      stock: 67,
      categoryId: homeTech.id,
      tags: ['smart-home', 'hub', 'matter', 'thread'],
      colors: ['#f8fafc', '#1e1e2e'],
      published: true,
      featured: false,
      isNew: true,
      isBest: false,
      rating: 4.6,
      reviewCount: 201,
    },
    {
      name: 'AirPure 360 Pro',
      slug: 'airpure-360-pro',
      shortDesc: 'Whole-room HEPA air purifier with OLED display',
      description: 'Breathe easier with AirPure 360 Pro. The 360-degree intake captures particles as small as 0.1 microns, eliminating allergens, pollutants, smoke, and odors from rooms up to 800 sq ft in 20 minutes. The OLED air quality display shows real-time PM2.5, CO2, and VOC levels, and auto-adjusts fan speed accordingly.',
      price: 379,
      salePrice: null,
      sku: 'AP-360-PRO',
      stock: 45,
      categoryId: homeTech.id,
      tags: ['air-purifier', 'hepa', 'smart-home', 'health'],
      colors: ['#f8fafc', '#e2e8f0'],
      published: true,
      featured: false,
      isNew: false,
      isBest: true,
      rating: 4.8,
      reviewCount: 167,
    },
    // Gaming
    {
      name: 'NexForce Controller Pro',
      slug: 'nexforce-controller-pro',
      shortDesc: 'Precision gaming controller with haptic triggers',
      description: 'The NexForce Controller Pro is built for competitive play. Magnetic hall-effect sticks with zero drift, adaptive trigger resistance from 0 to 4kg, and full-body haptic motors that put you inside the game. A four-hour quick charge gives 30 hours of wireless play, and multi-platform support covers PC, PlayStation, Xbox, and Nintendo.',
      price: 179,
      salePrice: 149,
      sku: 'NF-CTRL-PRO',
      stock: 93,
      categoryId: gaming.id,
      tags: ['controller', 'gaming', 'haptic', 'wireless'],
      colors: ['#1e1e2e', '#f8fafc', '#7c3aed'],
      published: true,
      featured: true,
      isNew: false,
      isBest: true,
      rating: 4.7,
      reviewCount: 534,
    },
    {
      name: 'VR Headset Omni',
      slug: 'vr-headset-omni',
      shortDesc: 'Standalone VR headset with eye tracking',
      description: 'The Omni VR headset delivers PC-class VR without a PC. The dual 2.5K per-eye micro-OLED panels at 120Hz with foveated rendering powered by eye tracking deliver breathtaking visuals at a fraction of the performance cost. Inside-out tracking with full hand and finger tracking, plus optional wireless PC streaming.',
      price: 599,
      salePrice: null,
      sku: 'VR-OMNI',
      stock: 38,
      categoryId: gaming.id,
      tags: ['vr', 'headset', 'standalone', 'eye-tracking'],
      colors: ['#1e1e2e', '#e2e8f0'],
      published: true,
      featured: true,
      isNew: true,
      isBest: false,
      rating: 4.5,
      reviewCount: 212,
    },
    {
      name: 'StreamDeck Pro 32',
      slug: 'streamdeck-pro-32',
      shortDesc: '32-key LCD macro pad for streamers and creators',
      description: 'StreamDeck Pro 32 puts 32 customizable LCD keys at your fingertips. Each key displays live artwork, countdown timers, stream stats, and more. Deep integrations with OBS, Twitch, YouTube, Premiere Pro, and 200+ other apps let you automate anything with a single touch. The new rotary encoder row adds precision volume and speed control.',
      price: 249,
      salePrice: 199,
      sku: 'SD-PRO-32',
      stock: 57,
      categoryId: gaming.id,
      tags: ['stream-deck', 'macro', 'creator', 'streaming'],
      colors: ['#1e1e2e'],
      published: true,
      featured: false,
      isNew: false,
      isBest: false,
      rating: 4.8,
      reviewCount: 298,
    },
    // Mobile
    {
      name: 'MagCharge Pro Stand',
      slug: 'magcharge-pro-stand',
      shortDesc: '3-in-1 MagSafe wireless charging station',
      description: 'The MagCharge Pro Stand charges your entire Apple ecosystem simultaneously. 15W MagSafe-certified pad for iPhone, 5W pad for AirPods, and Apple Watch fast charge — all in an elegant anodized aluminum stand that adjusts from flat to 60°. A 65W USB-C port on the back charges your laptop too.',
      price: 149,
      salePrice: 119,
      sku: 'MC-PRO-STAND',
      stock: 124,
      categoryId: mobile.id,
      tags: ['charger', 'magsafe', 'wireless', '3-in-1'],
      colors: ['#f1f5f9', '#1e1e2e'],
      published: true,
      featured: false,
      isNew: false,
      isBest: true,
      rating: 4.6,
      reviewCount: 443,
    },
    {
      name: 'PowerBank Ultra 30K',
      slug: 'powerbank-ultra-30k',
      shortDesc: '30,000mAh power bank with 140W GaN charging',
      description: 'Power Bank Ultra 30K is the only power bank you will ever need. 30,000mAh of capacity charges most laptops twice and phones eight times. The 140W GaN USB-C port delivers true laptop charging while two additional ports handle phones and earbuds simultaneously. Charges itself fully in just 2.5 hours via 100W input.',
      price: 119,
      salePrice: null,
      sku: 'PB-ULTRA-30K',
      stock: 178,
      categoryId: mobile.id,
      tags: ['power-bank', 'gan', '140w', 'laptop-charging'],
      colors: ['#1e1e2e', '#1e40af'],
      published: true,
      featured: false,
      isNew: true,
      isBest: false,
      rating: 4.7,
      reviewCount: 361,
    },
    {
      name: 'PhoneShield Ultra',
      slug: 'phoneshield-ultra',
      shortDesc: 'Military-grade phone case with built-in kickstand',
      description: 'PhoneShield Ultra provides MIL-STD-810H protection in a profile only 1.8mm thicker than your naked phone. The integrated CNC-machined aluminum kickstand adjusts to any angle, and the raised camera and screen bezels add extra protection where it matters most. Available for iPhone 15 and Samsung Galaxy S24 series.',
      price: 79,
      salePrice: 59,
      sku: 'PS-ULTRA',
      stock: 267,
      categoryId: mobile.id,
      tags: ['phone-case', 'protection', 'military-grade', 'kickstand'],
      colors: ['#1e1e2e', '#0f172a', '#7c3aed', '#0ea5e9'],
      published: true,
      featured: false,
      isNew: false,
      isBest: false,
      rating: 4.4,
      reviewCount: 589,
    },
    {
      name: 'UltraLink USB-C Hub',
      slug: 'ultralink-usbc-hub',
      shortDesc: '12-in-1 USB-C hub with 4K HDMI and 10Gbps',
      description: 'UltraLink gives your laptop the ports it deserves. Two 4K HDMI 2.1 ports, a 10Gbps USB-A, two 10Gbps USB-C, SD and microSD card readers, Gigabit Ethernet, and a 3.5mm audio jack — all through a single USB-C cable. The 100W pass-through keeps your laptop charged while you work with every port occupied.',
      price: 89,
      salePrice: 69,
      sku: 'UL-HUB-12',
      stock: 213,
      categoryId: mobile.id,
      tags: ['usb-hub', 'usb-c', '4k', 'docking'],
      colors: ['#f1f5f9', '#1e1e2e'],
      published: true,
      featured: false,
      isNew: false,
      isBest: true,
      rating: 4.5,
      reviewCount: 721,
    },
    // Extra products for variety
    {
      name: 'KeyPro Mech 65%',
      slug: 'keypro-mech-65',
      shortDesc: 'Compact mechanical keyboard with hot-swap switches',
      description: 'KeyPro Mech 65% delivers a premium typing experience in a space-efficient layout. Hot-swappable switch sockets let you change from tactile to linear to clicky without soldering. The aluminum case and brass weight provide satisfying heft and resonance, while per-key RGB with 16M colors sets the mood.',
      price: 179,
      salePrice: null,
      sku: 'KP-MECH-65',
      stock: 76,
      categoryId: gaming.id,
      tags: ['keyboard', 'mechanical', 'hot-swap', 'rgb'],
      colors: ['#1e1e2e', '#f8fafc'],
      published: true,
      featured: false,
      isNew: true,
      isBest: false,
      rating: 4.8,
      reviewCount: 412,
    },
    {
      name: 'NovaMouse Pro X',
      slug: 'novamouse-pro-x',
      shortDesc: '26K DPI wireless gaming mouse with 95-hour battery',
      description: 'NovaMouse Pro X is engineered for the most demanding gamers. The Hero 26K optical sensor tracks at any speed with zero smoothing or filtering. At 63g with the optional ultralight shell, it is light enough for effortless flick shots but heavy enough for controlled tracking. 95-hour battery life eliminates charging anxiety.',
      price: 149,
      salePrice: 129,
      sku: 'NM-PRO-X',
      stock: 108,
      categoryId: gaming.id,
      tags: ['mouse', 'gaming', 'wireless', '26k-dpi'],
      colors: ['#1e1e2e', '#f8fafc'],
      published: true,
      featured: false,
      isNew: false,
      isBest: true,
      rating: 4.9,
      reviewCount: 876,
    },
    {
      name: 'LumaCast Projector 4K',
      slug: 'lumacast-projector-4k',
      shortDesc: 'Ultra-short throw laser projector, 120-inch screen',
      description: 'LumaCast turns any wall into a 120-inch 4K cinema in seconds. The triple-laser light source delivers 3,000 ANSI lumens with a color gamut exceeding 110% of BT.2020, and being an ultra-short throw projector it sits just 15cm from the wall. Built-in Android TV, Dolby Vision, and spatial audio complete the experience.',
      price: 2999,
      salePrice: 2499,
      sku: 'LC-PROJ-4K',
      stock: 9,
      categoryId: homeTech.id,
      tags: ['projector', '4k', 'laser', 'ultra-short-throw'],
      colors: ['#f8fafc', '#1e1e2e'],
      published: true,
      featured: true,
      isNew: false,
      isBest: false,
      rating: 4.7,
      reviewCount: 58,
    },
    {
      name: 'WristScan Health Band',
      slug: 'wristscan-health-band',
      shortDesc: 'Medical-grade health tracker with 24/7 ECG',
      description: 'WristScan goes beyond fitness to provide genuine health insight. Continuous ECG monitoring detects AFib with 98.3% accuracy. Optical blood pressure measurement calibrated to a cuff, skin temperature, and arterial oxygen saturation give your doctor-level data every minute of every day. FDA-cleared for clinical use.',
      price: 349,
      salePrice: null,
      sku: 'WS-HEALTH',
      stock: 44,
      categoryId: wearables.id,
      tags: ['health', 'ecg', 'blood-pressure', 'medical'],
      colors: ['#f8fafc', '#0ea5e9'],
      published: true,
      featured: false,
      isNew: true,
      isBest: false,
      rating: 4.6,
      reviewCount: 134,
    },
    {
      name: 'ActionCam 8K Ultra',
      slug: 'actioncam-8k-ultra',
      shortDesc: '8K action camera with HorizonSteady stabilization',
      description: 'ActionCam 8K Ultra captures adventure in stunning clarity. The 8K/30fps sensor with HorizonSteady keeps your footage level even through the most aggressive terrain. Shoot 4K at 240fps for incredible slow-motion, and the dual screen design lets you nail your framing every time. TimeWarp 4.0 creates hypnotic time-lapse videos with zero effort.',
      price: 599,
      salePrice: 499,
      sku: 'AC-8K-ULTRA',
      stock: 63,
      categoryId: photography.id,
      tags: ['action-camera', '8k', 'waterproof', 'stabilization'],
      colors: ['#1e1e2e', '#f8fafc'],
      published: true,
      featured: false,
      isNew: true,
      isBest: true,
      rating: 4.8,
      reviewCount: 267,
    },
    {
      name: 'StudyPods Focus',
      slug: 'studypods-focus',
      shortDesc: 'Open-ear earbuds designed for focus and learning',
      description: 'StudyPods Focus are designed for the way you work and learn. The open-ear acoustic design lets you stay aware of your surroundings while delivering clear audio for music, podcasts, and calls. Focus Mode amplifies speech frequencies and reduces distracting bass. 12-hour battery and ultra-light 6g per bud means you forget they are there.',
      price: 129,
      salePrice: 99,
      sku: 'SP-FOCUS',
      stock: 95,
      categoryId: audio.id,
      tags: ['earbuds', 'open-ear', 'focus', 'study'],
      colors: ['#f8fafc', '#6366f1', '#10b981'],
      published: true,
      featured: false,
      isNew: false,
      isBest: false,
      rating: 4.3,
      reviewCount: 156,
    },
  ]

  const products: any[] = []
  for (const data of productsData) {
    const existing = await prisma.product.findUnique({ where: { slug: data.slug } })
    if (!existing) {
      const product = await prisma.product.create({ data })
      products.push(product)
    } else {
      products.push(existing)
    }
  }

  // Add placeholder images
  for (const product of products) {
    const existingImages = await prisma.productImage.count({ where: { productId: product.id } })
    if (existingImages === 0) {
      const seed = product.slug.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0)
      const palettes = [
        ['1a1a2e', '16213e', '0f3460'],
        ['0f0f23', '1a1a3e', '2d2b69'],
        ['0d1117', '161b22', '21262d'],
        ['1e1e2e', '2a2a3e', '363650'],
      ]
      const palette = palettes[seed % palettes.length]

      await prisma.productImage.createMany({
        data: [
          { productId: product.id, url: `https://placehold.co/800x800/${palette[0]}/ffffff?text=${encodeURIComponent(product.name)}`, alt: product.name, position: 0 },
          { productId: product.id, url: `https://placehold.co/800x800/${palette[1]}/ffffff?text=View+2`, alt: `${product.name} angle 2`, position: 1 },
          { productId: product.id, url: `https://placehold.co/800x800/${palette[2]}/ffffff?text=View+3`, alt: `${product.name} angle 3`, position: 2 },
          { productId: product.id, url: `https://placehold.co/800x800/${palette[0]}/ffffff?text=Detail`, alt: `${product.name} detail`, position: 3 },
        ],
      })
    }
  }

  console.log(`✓ Products: ${products.length} created/found`)

  // ── Collections ────────────────────────────────────────────────────────────
  const collectionsData = [
    {
      name: 'Summer Picks 2025',
      slug: 'summer-picks-2025',
      tagline: 'Beat the heat with gear that keeps up',
      description: 'Curated tech for outdoor adventures, beach days, and everything in between.',
      gradient: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.15) 100%)',
      published: true,
      featured: true,
      curator: 'CharFlut Team',
    },
    {
      name: 'Creator Studio',
      slug: 'creator-studio',
      tagline: 'Tools for the modern creator',
      description: 'Everything you need to produce, stream, and share your best work.',
      gradient: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(0,194,255,0.15) 100%)',
      published: true,
      featured: true,
      curator: 'CharFlut Editors',
    },
    {
      name: 'Health & Wellness',
      slug: 'health-wellness',
      tagline: 'Tech that takes care of you',
      description: 'Smart devices designed to help you live healthier and feel better every day.',
      gradient: 'linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(0,194,255,0.15) 100%)',
      published: true,
      featured: false,
      curator: 'Dr. Sarah Chen',
    },
    {
      name: 'Gaming Arsenal',
      slug: 'gaming-arsenal',
      tagline: 'Gear up for victory',
      description: 'Pro-grade peripherals and accessories that give you the competitive edge.',
      gradient: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(124,58,237,0.15) 100%)',
      published: true,
      featured: true,
      curator: 'CharFlut Gaming',
    },
    {
      name: 'Smart Home Essentials',
      slug: 'smart-home-essentials',
      tagline: 'Your home, smarter',
      description: 'The best connected devices to make your home more comfortable, efficient, and secure.',
      gradient: 'linear-gradient(135deg, rgba(96,165,250,0.2) 0%, rgba(52,211,153,0.15) 100%)',
      published: true,
      featured: false,
      curator: 'CharFlut Home',
    },
    {
      name: 'Audio Obsessed',
      slug: 'audio-obsessed',
      tagline: 'For those who hear the difference',
      description: 'The finest headphones, earbuds, and speakers for audiophiles and casual listeners alike.',
      gradient: 'linear-gradient(135deg, rgba(244,114,182,0.2) 0%, rgba(249,168,212,0.15) 100%)',
      published: true,
      featured: false,
      curator: 'The Audio Team',
    },
    {
      name: 'Under $150',
      slug: 'under-150',
      tagline: 'Premium tech without premium prices',
      description: 'Exceptional gear curated for those who want quality without breaking the bank.',
      gradient: 'linear-gradient(135deg, rgba(255,211,44,0.2) 0%, rgba(124,58,237,0.15) 100%)',
      published: true,
      featured: false,
      curator: 'Value Picks',
    },
    {
      name: 'New Arrivals',
      slug: 'new-arrivals',
      tagline: 'First look at what\'s new',
      description: 'The freshest tech to hit our shelves — be the first to get your hands on what\'s new.',
      gradient: 'linear-gradient(135deg, rgba(0,194,255,0.2) 0%, rgba(124,58,237,0.15) 100%)',
      published: true,
      featured: true,
      curator: 'CharFlut Team',
    },
  ]

  const collections: any[] = []
  for (const data of collectionsData) {
    const existing = await prisma.collection.findUnique({ where: { slug: data.slug } })
    if (!existing) {
      const col = await prisma.collection.create({ data })
      collections.push(col)
    } else {
      collections.push(existing)
    }
  }
  console.log(`✓ Collections: ${collections.length} created/found`)

  // ── Collection–Product relationships ──────────────────────────────────────
  const productMap = Object.fromEntries(products.map(p => [p.slug, p]))
  const collectionMap = Object.fromEntries(collections.map(c => [c.slug, c]))

  const links: { collectionSlug: string; productSlug: string }[] = [
    // Summer Picks
    { collectionSlug: 'summer-picks-2025', productSlug: 'pulsewave-portable' },
    { collectionSlug: 'summer-picks-2025', productSlug: 'actioncam-8k-ultra' },
    { collectionSlug: 'summer-picks-2025', productSlug: 'fitband-slim' },
    { collectionSlug: 'summer-picks-2025', productSlug: 'voidbuds-elite' },
    // Creator Studio
    { collectionSlug: 'creator-studio', productSlug: 'lensflare-pro-4k' },
    { collectionSlug: 'creator-studio', productSlug: 'streamdeck-pro-32' },
    { collectionSlug: 'creator-studio', productSlug: 'droneview-x5' },
    { collectionSlug: 'creator-studio', productSlug: 'keypro-mech-65' },
    // Health & Wellness
    { collectionSlug: 'health-wellness', productSlug: 'apex-watch-ultra' },
    { collectionSlug: 'health-wellness', productSlug: 'wristscan-health-band' },
    { collectionSlug: 'health-wellness', productSlug: 'fitband-slim' },
    { collectionSlug: 'health-wellness', productSlug: 'airpure-360-pro' },
    // Gaming Arsenal
    { collectionSlug: 'gaming-arsenal', productSlug: 'nexforce-controller-pro' },
    { collectionSlug: 'gaming-arsenal', productSlug: 'vr-headset-omni' },
    { collectionSlug: 'gaming-arsenal', productSlug: 'novamouse-pro-x' },
    { collectionSlug: 'gaming-arsenal', productSlug: 'keypro-mech-65' },
    { collectionSlug: 'gaming-arsenal', productSlug: 'streamdeck-pro-32' },
    // Smart Home Essentials
    { collectionSlug: 'smart-home-essentials', productSlug: 'hubcore-smart-hub' },
    { collectionSlug: 'smart-home-essentials', productSlug: 'airpure-360-pro' },
    { collectionSlug: 'smart-home-essentials', productSlug: 'lumacast-projector-4k' },
    { collectionSlug: 'smart-home-essentials', productSlug: 'sonicbar-neo' },
    // Audio Obsessed
    { collectionSlug: 'audio-obsessed', productSlug: 'aurasound-pro-x1' },
    { collectionSlug: 'audio-obsessed', productSlug: 'voidbuds-elite' },
    { collectionSlug: 'audio-obsessed', productSlug: 'sonicbar-neo' },
    { collectionSlug: 'audio-obsessed', productSlug: 'pulsewave-portable' },
    { collectionSlug: 'audio-obsessed', productSlug: 'studypods-focus' },
    // Under $150
    { collectionSlug: 'under-150', productSlug: 'pulsewave-portable' },
    { collectionSlug: 'under-150', productSlug: 'studypods-focus' },
    { collectionSlug: 'under-150', productSlug: 'magcharge-pro-stand' },
    { collectionSlug: 'under-150', productSlug: 'ultralink-usbc-hub' },
    { collectionSlug: 'under-150', productSlug: 'phoneshield-ultra' },
    { collectionSlug: 'under-150', productSlug: 'powerbank-ultra-30k' },
    // New Arrivals
    { collectionSlug: 'new-arrivals', productSlug: 'aurasound-pro-x1' },
    { collectionSlug: 'new-arrivals', productSlug: 'apex-watch-ultra' },
    { collectionSlug: 'new-arrivals', productSlug: 'visionar-glasses' },
    { collectionSlug: 'new-arrivals', productSlug: 'lensflare-pro-4k' },
    { collectionSlug: 'new-arrivals', productSlug: 'wristscan-health-band' },
    { collectionSlug: 'new-arrivals', productSlug: 'actioncam-8k-ultra' },
  ]

  for (const link of links) {
    const col = collectionMap[link.collectionSlug]
    const prod = productMap[link.productSlug]
    if (!col || !prod) continue
    await prisma.collectionProduct.upsert({
      where: { collectionId_productId: { collectionId: col.id, productId: prod.id } },
      update: {},
      create: { collectionId: col.id, productId: prod.id },
    })
  }
  console.log(`✓ Collection-product links: ${links.length} processed`)

  // ── Reviews ────────────────────────────────────────────────────────────────
  const reviewsData = [
    { productSlug: 'aurasound-pro-x1', rating: 5, title: 'Best headphones I have ever owned', body: 'The ANC is absolutely phenomenal. I use these on planes and it feels like you are in a private recording studio. Sound quality is on par with my studio monitors.' },
    { productSlug: 'aurasound-pro-x1', rating: 5, title: 'Worth every penny', body: 'Initially hesitant about the price but after 2 months of daily use I have zero regrets. Incredibly comfortable for marathon sessions.' },
    { productSlug: 'aurasound-pro-x1', rating: 4, title: 'Great headphones, minor EQ needed', body: 'Out of the box the bass is slightly overpowering for my taste, but with the companion app equalizer set flat these are reference quality.' },
    { productSlug: 'apex-watch-ultra', rating: 5, title: 'Replaced three devices with one watch', body: 'Sold my GPS watch, fitness band, and ECG monitor. Apex Ultra does all three better than any of them did individually. Battery life is exceptional.' },
    { productSlug: 'apex-watch-ultra', rating: 5, title: 'Medical-grade accuracy', body: 'As a cardiologist I am impressed. The ECG correlation with clinical equipment is within 4ms. My patients love that they can share their data with me automatically.' },
    { productSlug: 'nexforce-controller-pro', rating: 5, title: 'No more stick drift ever', body: 'Switched from a competitor controller with severe drift issues. Hall effect sticks are simply a different league — precision is perfect and will stay that way for years.' },
    { productSlug: 'nexforce-controller-pro', rating: 4, title: 'Amazing haptics, software needs work', body: 'The hardware is flawless but the companion PC app for customizing trigger tension is still a bit rough. Core experience is 5 stars.' },
    { productSlug: 'lensflare-pro-4k', rating: 5, title: 'Career-changing camera', body: 'I switched from a competing brand after 10 years and will never go back. The AI subject tracking locked onto a hummingbird in flight and nailed 47 consecutive shots.' },
    { productSlug: 'voidbuds-elite', rating: 5, title: 'Spatial audio is jaw-dropping', body: 'First time I heard the spatial audio in a movie I had to take the earbuds out to check if someone was in the room with me. That is how good it is.' },
  ]

  for (const r of reviewsData) {
    const product = productMap[r.productSlug]
    if (!product) continue
    const existing = await prisma.review.findFirst({
      where: { productId: product.id, userId: customer.id },
    })
    if (!existing) {
      await prisma.review.create({
        data: {
          userId: customer.id,
          productId: product.id,
          rating: r.rating,
          title: r.title,
          body: r.body,
          verified: true,
        },
      })
    }
  }
  console.log(`✓ Reviews: ${reviewsData.length} processed`)

  // ── Customer address ───────────────────────────────────────────────────────
  const existingAddress = await prisma.address.findFirst({ where: { userId: customer.id } })
  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: customer.id,
        name: 'Alex Johnson',
        line1: '123 Tech Boulevard',
        line2: 'Apt 4B',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'United States',
        isDefault: true,
      },
    })
  }

  // ── Sample orders ──────────────────────────────────────────────────────────
  const existingOrders = await prisma.order.count({ where: { userId: customer.id } })
  if (existingOrders === 0) {
    const prod1 = productMap['aurasound-pro-x1']
    const prod2 = productMap['apex-watch-ultra']
    const prod3 = productMap['voidbuds-elite']

    await prisma.order.create({
      data: {
        userId: customer.id,
        status: OrderStatus.DELIVERED,
        total: prod1.salePrice || prod1.price,
        address: '123 Tech Boulevard, Apt 4B, San Francisco, CA 94105',
        items: {
          create: [{ productId: prod1.id, quantity: 1, price: prod1.salePrice || prod1.price }],
        },
      },
    })

    await prisma.order.create({
      data: {
        userId: customer.id,
        status: OrderStatus.SHIPPED,
        total: (prod2.salePrice || prod2.price) + (prod3.salePrice || prod3.price),
        address: '123 Tech Boulevard, Apt 4B, San Francisco, CA 94105',
        items: {
          create: [
            { productId: prod2.id, quantity: 1, price: prod2.salePrice || prod2.price },
            { productId: prod3.id, quantity: 1, price: prod3.salePrice || prod3.price },
          ],
        },
      },
    })

    await prisma.order.create({
      data: {
        userId: customer.id,
        status: OrderStatus.PROCESSING,
        total: 149,
        address: '123 Tech Boulevard, Apt 4B, San Francisco, CA 94105',
        items: {
          create: [{ productId: productMap['fitband-slim'].id, quantity: 1, price: 119 }],
        },
      },
    })
  }
  console.log('✓ Sample orders created')

  // ── Wishlist items ─────────────────────────────────────────────────────────
  const wishlistSlugs = ['apex-watch-ultra', 'vr-headset-omni', 'lensflare-pro-4k', 'nexforce-controller-pro']
  for (const slug of wishlistSlugs) {
    const product = productMap[slug]
    if (!product) continue
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: customer.id, productId: product.id } },
      update: {},
      create: { userId: customer.id, productId: product.id },
    })
  }
  console.log('✓ Wishlist items created')

  console.log('\n🎉 Seed complete!')
  console.log('   Admin:    admin@charflut.com    / Admin@123')
  console.log('   Customer: customer@charflut.com / Customer@123')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
