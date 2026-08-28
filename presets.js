window.DC_PRESETS = {
  builtin: [
    { id: "annoy-peak", name: "Annoy peak", sub: "3.15 / 2.87 kHz", l: 3150, r: 2870, wave: "sine", panRate: 6, panDepth: 100, wander: 22, wanderT: 24, pulse: 0 },
    { id: "canal", name: "Ear canal", sub: "4.0 / 3.7 kHz", l: 4000, r: 3720, wave: "sine", panRate: 5, panDepth: 100, wander: 30, wanderT: 28, pulse: 0 },
    { id: "confusion", name: "Confusion band", sub: "2.2 / 1.85 kHz", l: 2200, r: 1850, wave: "sine", panRate: 4, panDepth: 100, wander: 40, wanderT: 30, pulse: 8 },
    { id: "twin-beat", name: "Twin beat", sub: "3011 / 2974", l: 3011, r: 2974, wave: "sine", panRate: 3, panDepth: 70, wander: 8, wanderT: 18, pulse: 0 },
    { id: "phantom", name: "Slow phantom", sub: "same tone, crawl pan", l: 2680, r: 2680, wave: "sine", panRate: 2, panDepth: 100, wander: 6, wanderT: 40, pulse: 0 },
    { id: "alarm-crawl", name: "Alarm crawl", sub: "3.5k square, slow", l: 3480, r: 3310, wave: "square", panRate: 7, panDepth: 90, wander: 25, wanderT: 20, pulse: 18 },
    { id: "dissonant", name: "Dissonant grind", sub: "tritone 2500 / 3536", l: 2500, r: 3536, wave: "triangle", panRate: 5, panDepth: 80, wander: 16, wanderT: 26, pulse: 0 },
    { id: "mid-nasty", name: "Mid nasty", sub: "2.8 / 3.3 kHz saw", l: 2800, r: 3300, wave: "sawtooth", panRate: 6, panDepth: 100, wander: 35, wanderT: 16, pulse: 10 }
  ],
  high: [
    { id: "hi-6", name: "High 6 kHz", sub: "S290 strong", l: 6200, r: 5870, wave: "sine", panRate: 5, panDepth: 100, wander: 40, wanderT: 22, pulse: 0 },
    { id: "hi-8", name: "High 8 kHz", sub: "thin, piercing", l: 8120, r: 7780, wave: "sine", panRate: 4, panDepth: 100, wander: 50, wanderT: 20, pulse: 0 },
    { id: "hi-10", name: "High 10 kHz", sub: "edge of portable", l: 10150, r: 9740, wave: "sine", panRate: 4, panDepth: 100, wander: 60, wanderT: 18, pulse: 0 },
    { id: "hi-12", name: "High 12 kHz", sub: "speaker limit-ish", l: 12100, r: 11640, wave: "sine", panRate: 3, panDepth: 100, wander: 80, wanderT: 16, pulse: 0 }
  ],
  extreme: [
    { id: "x-15", name: "15 kHz hiss", sub: "very thin on S290", l: 15200, r: 14750, wave: "sine", panRate: 3, panDepth: 100, wander: 90, wanderT: 14, pulse: 0 },
    { id: "x-17", name: "Mosquito 17 k", sub: "younger ears", l: 17400, r: 16880, wave: "sine", panRate: 2, panDepth: 80, wander: 40, wanderT: 20, pulse: 0 },
    { id: "x-19", name: "19 kHz edge", sub: "often inaudible", l: 19000, r: 18600, wave: "sine", panRate: 2, panDepth: 70, wander: 30, wanderT: 24, pulse: 0 },
    { id: "x-split", name: "Split extreme", sub: "3.1k + 12k", l: 3120, r: 12400, wave: "sine", panRate: 8, panDepth: 100, wander: 50, wanderT: 18, pulse: 12 },
    { id: "x-harsh", name: "Harsh stack", sub: "square 4.2 / 2.1", l: 4210, r: 2090, wave: "square", panRate: 6, panDepth: 100, wander: 20, wanderT: 14, pulse: 22 },
    { id: "x-wander", name: "Lost source", sub: "max slow chaos", l: 2400, r: 3900, wave: "triangle", panRate: 1, panDepth: 100, wander: 220, wanderT: 36, pulse: 6 }
  ]
};
