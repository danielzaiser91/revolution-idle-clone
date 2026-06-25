const STORAGE_KEY = 'revolutionIdleCloneSave';

class Decimal {
  constructor(m, e) {
    if (m === 0 || m === 0.0) {
      this.m = 0;
      this.e = 0;
    } else {
      this.m = m;
      this.e = e;
      this.normalize();
    }
  }

  static fromNumber(value) {
    if (value === 0) return Decimal.zero();
    if (!Number.isFinite(value)) {
      return Decimal.fromString(String(value));
    }
    const absValue = Math.abs(value);
    const exponent = Math.floor(Math.log10(absValue));
    return new Decimal(value / 10 ** exponent, exponent);
  }

  static fromString(value) {
    if (typeof value !== 'string') return Decimal.fromNumber(Number(value));
    const normalized = value.trim().toLowerCase();
    if (normalized === '0' || normalized === '0.0') return Decimal.zero();
    const match = normalized.match(/^([-+]?\d*\.?\d+)(e([-+]?\d+))?$/);
    if (!match) return Decimal.zero();
    const mantissa = parseFloat(match[1]);
    const exponent = match[3] ? parseInt(match[3], 10) : 0;
    return new Decimal(mantissa, exponent);
  }

  static fromLog10(log) {
    if (!Number.isFinite(log)) {
      return log === -Infinity ? Decimal.zero() : new Decimal(Infinity, 0);
    }
    const exponent = Math.floor(log);
    const mantissa = Math.pow(10, log - exponent);
    return new Decimal(mantissa, exponent);
  }

  static one() {
    return new Decimal(1, 0);
  }

  static zero() {
    return new Decimal(0, 0);
  }

  static max(a, b) {
    return a.gt(b) ? a : b;
  }

  static min(a, b) {
    return a.lt(b) ? a : b;
  }

  clone() {
    return new Decimal(this.m, this.e);
  }

  normalize() {
    if (this.m === 0) {
      this.e = 0;
      return this;
    }
    const absM = Math.abs(this.m);
    if (absM >= 10) {
      const expo = Math.floor(Math.log10(absM));
      this.m /= 10 ** expo;
      this.e += expo;
    } else if (absM < 1) {
      const expo = Math.floor(Math.log10(absM));
      this.m /= 10 ** expo;
      this.e += expo;
    }
    return this;
  }

  toNumber() {
    if (this.e > 308) return Infinity;
    if (this.e < -308) return 0;
    return this.m * 10 ** this.e;
  }

  toString(places = 2) {
    if (this.m === 0) return '0';
    if (this.e < 6) {
      const value = this.toNumber();
      return Number.isFinite(value) ? value.toFixed(places).replace(/\.0+$/, '') : `${this.m.toFixed(places)}e${this.e}`;
    }
    return `${this.m.toFixed(places)}e${this.e}`;
  }

  abs() {
    return new Decimal(Math.abs(this.m), this.e);
  }

  add(other) {
    if (!(other instanceof Decimal)) other = Decimal.fromNumber(other);
    if (this.m === 0) return other.clone();
    if (other.m === 0) return this.clone();
    const a = this.clone();
    const b = other.clone();
    if (a.e > b.e + 20) return a;
    if (b.e > a.e + 20) return b;
    if (a.e >= b.e) {
      const scale = 10 ** (b.e - a.e);
      return new Decimal(a.m + b.m * scale, a.e).normalize();
    }
    const scale = 10 ** (a.e - b.e);
    return new Decimal(a.m * scale + b.m, b.e).normalize();
  }

  sub(other) {
    if (!(other instanceof Decimal)) other = Decimal.fromNumber(other);
    return this.add(other.neg());
  }

  neg() {
    return new Decimal(-this.m, this.e);
  }

  mul(other) {
    if (!(other instanceof Decimal)) other = Decimal.fromNumber(other);
    if (this.m === 0 || other.m === 0) return Decimal.zero();
    return new Decimal(this.m * other.m, this.e + other.e).normalize();
  }

  div(other) {
    if (!(other instanceof Decimal)) other = Decimal.fromNumber(other);
    if (other.m === 0) return new Decimal(Infinity, 0);
    if (this.m === 0) return Decimal.zero();
    return new Decimal(this.m / other.m, this.e - other.e).normalize();
  }

  pow(power) {
    if (power instanceof Decimal) {
      power = power.log10();
    }
    if (typeof power !== 'number') power = Number(power);
    if (this.m === 0) return Decimal.zero();
    const log = this.log10() * power;
    return Decimal.fromLog10(log);
  }

  log10() {
    if (this.m === 0) return -Infinity;
    return this.e + Math.log10(Math.abs(this.m));
  }

  cmp(other) {
    if (!(other instanceof Decimal)) other = Decimal.fromNumber(other);
    if (this.m === 0 && other.m === 0) return 0;
    if (this.e !== other.e) return this.e > other.e ? 1 : -1;
    if (this.m === other.m) return 0;
    return this.m > other.m ? 1 : -1;
  }

  gt(other) {
    return this.cmp(other) > 0;
  }

  gte(other) {
    return this.cmp(other) >= 0;
  }

  lt(other) {
    return this.cmp(other) < 0;
  }

  lte(other) {
    return this.cmp(other) <= 0;
  }

  eq(other) {
    return this.cmp(other) === 0;
  }

  toJSON() {
    return { m: this.m, e: this.e };
  }

  static fromJSON(value) {
    if (value == null) return Decimal.zero();
    if (typeof value === 'string') return Decimal.fromString(value);
    if (typeof value === 'number') return Decimal.fromNumber(value);
    return new Decimal(value.m, value.e);
  }
}

const circleDefinitions = [
  { name: 'Red', cost: 4, costMult: 1.2, speed: 0.2, baseGain: 0.01 },
  { name: 'Orange', cost: 100, costMult: 1.24, speed: 0.1, baseGain: 0.02 },
  { name: 'Yellow', cost: 1_000, costMult: 1.28, speed: 0.067, baseGain: 0.03 },
  { name: 'Green', cost: 10_000, costMult: 1.32, speed: 0.05, baseGain: 0.04 },
  { name: 'Turquoise', cost: 1_000_000, costMult: 1.36, speed: 0.04, baseGain: 0.05 },
  { name: 'Cyan', cost: 1e9, costMult: 1.4, speed: 0.033, baseGain: 0.06 },
  { name: 'Blue', cost: 1e12, costMult: 1.44, speed: 0.029, baseGain: 0.08 },
  { name: 'Purple', cost: 1e15, costMult: 1.48, speed: 0.025, baseGain: 0.1 },
  { name: 'Pink', cost: 1e18, costMult: 1.52, speed: 0.022, baseGain: 0.12 },
  { name: 'White', cost: 1e27, costMult: 1.56, speed: 0.02, baseGain: 0.15 },
];

const promotionDefinitions = [
  { id: 'multGain', name: 'Mult Gain Mult', effect: level => 1 + 0.05 * level },
  { id: 'lapSpeed', name: 'Lap Speed Mult', effect: level => 1 + 0.05 * level },
  { id: 'ascPower', name: 'Ascension Power', effect: level => 1 + 0.05 * level },
  { id: 'promoPower', name: 'Promotion Power', effect: level => 1 + 0.02 * level },
];

const infinityUpgradesDefinition = [
  { id: 'scoreBoost', name: 'Score Boost', description: 'Additive score bonus from Infinity.', baseCost: 1, costMult: 2, effect: level => 1 + 0.1 * level },
  { id: 'ipMult', name: 'IP Gain', description: 'Increase Infinity Point gain.', baseCost: 2, costMult: 2.25, effect: level => 1 + 0.25 * level },
  { id: 'gpPower', name: 'Generator Power', description: 'Increase Generator Power exponent.', baseCost: 5, costMult: 2.5, effect: level => 0.666 + 0.02 * level },
  { id: 'challengeUnlock', name: 'Challenges', description: 'Unlock Infinity Challenges.', baseCost: 10, costMult: 3, effect: level => level },
  { id: 'starUnlock', name: 'Stars', description: 'Unlock Stars and Stardust.', baseCost: 25, costMult: 4, effect: level => level },
];

const generatorDefinitions = [
  { id: 'g1', name: 'Generator 1', baseCost: Decimal.fromNumber(100), baseInterval: 1 },
  { id: 'g2', name: 'Generator 2', baseCost: Decimal.fromNumber(1_000), baseInterval: 1.2 },
  { id: 'g3', name: 'Generator 3', baseCost: Decimal.fromNumber(10_000), baseInterval: 1.5 },
  { id: 'g4', name: 'Generator 4', baseCost: Decimal.fromNumber(100_000), baseInterval: 2 },
  { id: 'g5', name: 'Generator 5', baseCost: Decimal.fromNumber(1_000_000), baseInterval: 2.5 },
];

const stardustUpgradesDefinition = [
  { id: 'starBase', name: 'Star Base', description: 'Increase star effect base.', baseCost: Decimal.fromNumber(1e4), costMult: 3, maxLevel: 10, effect: level => 2.75 + 0.275 * level },
  { id: 'starExponent', name: 'Star Exponent', description: 'Increase star exponent.', baseCost: Decimal.fromNumber(2e4), costMult: 3, maxLevel: 10, effect: level => 0.4 + 0.05 * level },
  { id: 'stardustSpeed', name: 'Stardust Speed', description: 'Stars generate Stardust faster.', baseCost: Decimal.fromNumber(5e3), costMult: 2.5, maxLevel: 10, effect: level => 1 + 0.05 * level },
  { id: 'stardustIP', name: 'Stardust IP', description: 'Increase IP gain from Stardust.', baseCost: Decimal.fromNumber(2e4), costMult: 3, maxLevel: 20, effect: level => 1 + 0.1 * level },
];

const challengeDefinitions = [
  { id: 'c1', name: 'Challenge 1', description: 'Promotions 2 and 4 are disabled; reward bonus on deep run.' },
  { id: 'c2', name: 'Challenge 2', description: 'Ascension power reduced; reward multiplier on score.' },
  { id: 'c3', name: 'Challenge 3', description: 'Common exponent lowered; reward bonus to IP gain.' },
  { id: 'c4', name: 'Challenge 4', description: 'Prestige and Promote weakened; reward stronger promotions after Infinity.' },
  { id: 'c5', name: 'Challenge 5', description: 'All promotions are weaker; reward improves their effectiveness.' },
  { id: 'c6', name: 'Challenge 6', description: 'Multipliers decay over time; reward boosts generator output.' },
  { id: 'c7', name: 'Challenge 7', description: 'All mults are divided by time in Infinity; reward boosts score over time.' },
  { id: 'c8', name: 'Challenge 8', description: 'Ascensions disabled; reward raises ascension power base.' },
  { id: 'c9', name: 'Challenge 9', description: 'Only four colors; reward adds Break Infinity progress.' },
];

function createInitialCircles() {
  return circleDefinitions.map((def, index) => ({
    name: def.name,
    level: index === 0 ? 5 : 0,
    ascensions: 0,
    mult: Decimal.one(),
    unlocked: index === 0,
    ...def,
  }));
}

function createInitialPromotions() {
  return promotionDefinitions.map(def => ({ ...def, level: 0 }));
}

function createInitialInfinityUpgrades() {
  return infinityUpgradesDefinition.map(item => ({
    ...item,
    level: 0,
    cost: Decimal.fromNumber(item.baseCost),
  }));
}

function createInitialGenerators() {
  return generatorDefinitions.map(def => ({
    ...def,
    level: 0,
    timer: 0,
    unlocked: false,
  }));
}

function createInitialStardustUpgrades() {
  return stardustUpgradesDefinition.map(item => ({
    ...item,
    level: 0,
    cost: item.baseCost.clone(),
  }));
}

function createInitialStars() {
  return {
    count: Decimal.zero(),
    unlocked: false,
  };
}

const defaultState = {
  score: Decimal.zero(),
  totalScore: Decimal.zero(),
  circles: createInitialCircles(),
  pMult: Decimal.one(),
  pExp: 1,
  prestigeCount: 0,
  promotions: createInitialPromotions(),
  promotionPoints: 0,
  infinityPoints: Decimal.zero(),
  infinityCount: 0,
  infinityUpgrades: createInitialInfinityUpgrades(),
  generators: createInitialGenerators(),
  gp: Decimal.zero(),
  stars: createInitialStars(),
  stardust: Decimal.zero(),
  stardustUpgrades: createInitialStardustUpgrades(),
  challengesUnlocked: false,
  completedChallenges: Array(challengeDefinitions.length).fill(false),
  run: 'Revolution',
  lastUpdate: Date.now(),
};

let state = loadState();
let lastTick = Date.now();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    const data = JSON.parse(raw);
    const loaded = {
      ...defaultState,
      score: Decimal.fromJSON(data.score),
      totalScore: Decimal.fromJSON(data.totalScore),
      circles: data.circles.map((c, index) => ({
        ...circleDefinitions[index],
        name: c.name,
        level: c.level,
        ascensions: c.ascensions,
        mult: Decimal.fromJSON(c.mult),
        unlocked: c.unlocked,
      })),
      pMult: Decimal.fromJSON(data.pMult),
      pExp: data.pExp,
      prestigeCount: data.prestigeCount,
      promotions: createInitialPromotions().map((promo, index) => ({
        ...promo,
        level: data.promotions && data.promotions[index] ? data.promotions[index].level : 0,
      })),
      promotionPoints: data.promotionPoints,
      infinityPoints: Decimal.fromJSON(data.infinityPoints),
      infinityCount: data.infinityCount,
      infinityUpgrades: createInitialInfinityUpgrades().map((upgrade, index) => {
        const saved = data.infinityUpgrades && data.infinityUpgrades[index];
        if (!saved) return upgrade;
        return {
          ...upgrade,
          level: saved.level,
          cost: Decimal.fromJSON(saved.cost),
        };
      }),
      generators: createInitialGenerators().map((generator, index) => {
        const saved = data.generators && data.generators[index];
        return {
          ...generator,
          level: saved ? saved.level : 0,
          timer: saved ? saved.timer : 0,
          unlocked: saved ? saved.unlocked : false,
        };
      }),
      gp: Decimal.fromJSON(data.gp),
      stars: {
        count: Decimal.fromJSON(data.stars?.count),
        unlocked: data.stars?.unlocked || false,
      },
      stardust: Decimal.fromJSON(data.stardust),
      stardustUpgrades: createInitialStardustUpgrades().map((upgrade, index) => {
        const saved = data.stardustUpgrades && data.stardustUpgrades[index];
        if (!saved) return upgrade;
        return {
          ...upgrade,
          level: saved.level,
          cost: Decimal.fromJSON(saved.cost),
        };
      }),
      challengesUnlocked: data.challengesUnlocked || false,
      completedChallenges: data.completedChallenges || Array(challengeDefinitions.length).fill(false),
      run: data.run || 'Revolution',
    };
    return loaded;
  } catch (error) {
    console.warn('Fehler beim Laden des Speichers:', error);
    return { ...defaultState };
  }
}

function saveState() {
  const serialized = JSON.stringify({
    ...state,
    score: state.score,
    totalScore: state.totalScore,
    circles: state.circles.map(c => ({
      name: c.name,
      level: c.level,
      ascensions: c.ascensions,
      mult: c.mult,
      unlocked: c.unlocked,
    })),
    pMult: state.pMult,
    infinityPoints: state.infinityPoints,
    infinityUpgrades: state.infinityUpgrades.map(u => ({
      id: u.id,
      level: u.level,
      cost: u.cost,
    })),
    promotions: state.promotions.map(p => ({ id: p.id, level: p.level })),
    generators: state.generators.map(g => ({
      id: g.id,
      level: g.level,
      timer: g.timer,
      unlocked: g.unlocked,
    })),
    gp: state.gp,
    stars: {
      count: state.stars.count,
      unlocked: state.stars.unlocked,
    },
    stardust: state.stardust,
    stardustUpgrades: state.stardustUpgrades.map(u => ({ id: u.id, level: u.level, cost: u.cost })),
    challengesUnlocked: state.challengesUnlocked,
    completedChallenges: state.completedChallenges,
    run: state.run,
  });
  localStorage.setItem(STORAGE_KEY, serialized);
}

function getCircleCost(circle) {
  const base = Decimal.fromNumber(circle.cost);
  const multiplier = Decimal.fromNumber(circle.costMult + circle.ascensions * 0.1);
  return base.mul(multiplier.pow(circle.level));
}

function getCircleLapSpeed(circle) {
  const speedMult = state.promotions.find(p => p.id === 'lapSpeed').effect(state.promotions.find(p => p.id === 'lapSpeed').level);
  return Decimal.fromNumber(circle.level * circle.speed * speedMult);
}

function getCircleMultGain(circle) {
  const promoPower = state.promotions.find(p => p.id === 'promoPower').effect(state.promotions.find(p => p.id === 'promoPower').level);
  const ascBoost = Math.pow(10, circle.ascensions);
  const ascPower = state.promotions.find(p => p.id === 'ascPower').effect(state.promotions.find(p => p.id === 'ascPower').level);
  const gain = circle.baseGain * ascBoost * ascPower * promoPower;
  return Decimal.fromNumber(gain);
}

function computeScorePerRevolution() {
  const product = state.circles.reduce((acc, circle) => acc.mul(circle.mult), Decimal.one());
  const scoreBoost = state.infinityUpgrades.find(u => u.id === 'scoreBoost').effect(state.infinityUpgrades.find(u => u.id === 'scoreBoost').level);
  const gpEffect = getGPEffect();
  const starEffect = getStarEffect();
  const baseValue = product.mul(state.pMult).mul(Decimal.fromNumber(scoreBoost)).mul(gpEffect).mul(starEffect);
  return baseValue;
}

function getScoreRate() {
  const scorePerRev = computeScorePerRevolution();
  let totalLaps = Decimal.zero();
  state.circles.forEach(circle => {
    totalLaps = totalLaps.add(getCircleLapSpeed(circle));
  });
  const rate = scorePerRev.mul(totalLaps);
  return rate;
}

function canPrestige() {
  return state.score.gte(Decimal.fromNumber(1e10));
}

function canInfinity() {
  return state.score.gte(Decimal.fromNumber(1e308));
}

function canEternity() {
  return state.infinityPoints.gte(Decimal.fromNumber(1.79e308));
}

function computePrestigeGain() {
  if (state.score.lte(Decimal.fromNumber(1e10))) return Decimal.fromNumber(10);
  const exponent = Math.floor(state.score.log10() - 9);
  const gain = 10 ** Math.max(1, exponent);
  return Decimal.fromNumber(gain);
}

function infinityPointsGain() {
  const logValue = state.score.log10();
  if (!Number.isFinite(logValue) || logValue < 308) return Decimal.zero();
  const baseGain = Math.floor(logValue / 308);
  const ipMultiplier = state.infinityUpgrades.find(u => u.id === 'ipMult').effect(state.infinityUpgrades.find(u => u.id === 'ipMult').level);
  const challengeBonus = 1 + state.completedChallenges.filter(Boolean).length;
  return Decimal.fromNumber(baseGain).mul(Decimal.fromNumber(ipMultiplier)).mul(Decimal.fromNumber(challengeBonus));
}

function infinity() {
  if (!canInfinity()) return;
  const gain = infinityPointsGain();
  state.infinityPoints = state.infinityPoints.add(gain);
  state.infinityCount += 1;
  state.pMult = Decimal.one();
  state.pExp = 1;
  state.prestigeCount = 0;
  state.promotionPoints = 0;
  state.promotions.forEach(p => { p.level = 0; });
  state.circles = createInitialCircles();
  state.score = Decimal.zero();
  state.totalScore = Decimal.zero();
  state.gp = Decimal.zero();
  state.stardust = Decimal.zero();
  state.run = 'Infinity';
  saveState();
  render();
}

function eternate() {
  if (!canEternity()) return;
  state.run = 'Eternity';
  saveState();
  render();
}

function purchasePromotion(id) {
  const promo = state.promotions.find(p => p.id === id);
  if (!promo || state.promotionPoints <= 0) return;
  promo.level += 1;
  state.promotionPoints -= 1;
  saveState();
  render();
}

function purchaseInfinityUpgrade(id) {
  const upgrade = state.infinityUpgrades.find(u => u.id === id);
  if (!upgrade) return;
  if (state.infinityPoints.lt(upgrade.cost)) return;
  state.infinityPoints = state.infinityPoints.sub(upgrade.cost);
  upgrade.level += 1;
  upgrade.cost = upgrade.cost.mul(Decimal.fromNumber(upgrade.costMult));
  state.challengesUnlocked = state.infinityUpgrades.find(u => u.id === 'challengeUnlock').level > 0;
  state.stars.unlocked = state.infinityUpgrades.find(u => u.id === 'starUnlock').level > 0;
  state.generators.forEach((generator, index) => {
    generator.unlocked = state.infinityUpgrades.find(u => u.id === 'scoreBoost').level > 0 || index === 0;
  });
  saveState();
  render();
}

function purchaseGenerator(index) {
  const generator = state.generators[index];
  if (!generator.unlocked) return;
  const cost = getGeneratorCost(generator);
  if (state.infinityPoints.lt(cost)) return;
  state.infinityPoints = state.infinityPoints.sub(cost);
  generator.level += 1;
  saveState();
  render();
}

function getGeneratorCost(generator) {
  return generator.baseCost.mul(Decimal.fromNumber(10).pow(generator.level));
}

function getGeneratorInterval(generator) {
  return Decimal.fromNumber(generator.baseInterval).mul(Decimal.fromNumber(2).pow(generator.level));
}

function getGeneratorProduction(generator) {
  if (generator.level === 0) return Decimal.zero();
  return Decimal.fromNumber(generator.level).div(getGeneratorInterval(generator));
}

function buyStar() {
  const cost = getStarCost();
  if (!state.stars.unlocked || state.infinityPoints.lt(cost)) return;
  state.infinityPoints = state.infinityPoints.sub(cost);
  state.stars.count = state.stars.count.add(Decimal.one());
  saveState();
  render();
}

function getStarCost() {
  const base = Decimal.fromNumber(1e4);
  return base.mul(Decimal.fromNumber(1e3).pow(state.stars.count.toNumber()));
}

function purchaseStardustUpgrade(id) {
  const upgrade = state.stardustUpgrades.find(u => u.id === id);
  if (!upgrade || state.stardust.lt(upgrade.cost)) return;
  if (upgrade.maxLevel && upgrade.level >= upgrade.maxLevel) return;
  state.stardust = state.stardust.sub(upgrade.cost);
  upgrade.level += 1;
  upgrade.cost = upgrade.cost.mul(Decimal.fromNumber(upgrade.costMult));
  saveState();
  render();
}

function getGPEffect() {
  if (state.gp.eq(Decimal.zero())) return Decimal.one();
  const exponent = state.infinityUpgrades.find(u => u.id === 'gpPower').effect(state.infinityUpgrades.find(u => u.id === 'gpPower').level);
  return state.gp.pow(exponent).add(Decimal.one());
}

function getStarEffect() {
  if (!state.stars.unlocked || state.stars.count.eq(Decimal.zero())) return Decimal.one();
  const baseUpgrade = state.stardustUpgrades.find(u => u.id === 'starBase');
  const exponentUpgrade = state.stardustUpgrades.find(u => u.id === 'starExponent');
  const base = Decimal.fromNumber(baseUpgrade.effect(baseUpgrade.level));
  const exponent = exponentUpgrade.effect(exponentUpgrade.level);
  return state.stars.count.pow(exponent).mul(base).add(Decimal.one());
}

function getStardustGain(delta) {
  if (!state.stars.unlocked || state.stars.count.eq(Decimal.zero())) return Decimal.zero();
  const speedUpgrade = state.stardustUpgrades.find(u => u.id === 'stardustSpeed');
  const speed = Decimal.fromNumber(0.01).mul(state.stars.count).mul(Decimal.fromNumber(speedUpgrade.effect(speedUpgrade.level)));
  return speed.mul(Decimal.fromNumber(delta));
}

function getChallengeBoost() {
  const completed = state.completedChallenges.filter(Boolean).length;
  return 1 + completed * 0.05;
}

function buyCircleLevel(index) {
  const circle = state.circles[index];
  if (!circle.unlocked) return;
  const cost = getCircleCost(circle);
  if (state.score.lt(cost)) return;
  state.score = state.score.sub(cost);
  circle.level += 1;
  circle.mult = circle.mult.add(getCircleMultGain(circle));
  unlockCircles();
  saveState();
  render();
}

function unlockCircles() {
  state.circles.forEach((circle, index) => {
    if (index === 0) return;
    const prev = state.circles[index - 1];
    if (prev.level >= 5) circle.unlocked = true;
  });
}

function ascendCircle(index) {
  const circle = state.circles[index];
  const cap = 100 + circle.ascensions * 10;
  if (circle.level < cap) return;
  circle.ascensions += 1;
  circle.level = 5;
  circle.mult = circle.mult.add(getCircleMultGain(circle));
  saveState();
  render();
}

function completeChallenge(index) {
  if (!state.challengesUnlocked || state.completedChallenges[index]) return;
  state.completedChallenges[index] = true;
  saveState();
  render();
}

function formatDecimal(value) {
  return value instanceof Decimal ? value.toString(2) : value;
}

function setupEventListeners() {
  document.getElementById('prestigeBtn').addEventListener('click', prestige);
  document.getElementById('infinityBtn').addEventListener('click', infinity);
  document.getElementById('eternityBtn').addEventListener('click', eternate);
}

function render() {
  document.getElementById('score').textContent = formatDecimal(state.score);
  document.getElementById('scoreRate').textContent = formatDecimal(getScoreRate());
  document.getElementById('pMult').textContent = `x${formatDecimal(state.pMult)}`;
  document.getElementById('pExp').textContent = formatDecimal(Decimal.fromNumber(state.pExp));
  document.getElementById('infinityPoints').textContent = formatDecimal(state.infinityPoints);
  document.getElementById('runState').textContent = state.run;

  const circlesContainer = document.getElementById('circles');
  circlesContainer.innerHTML = '';
  state.circles.forEach((circle, index) => {
    const cost = getCircleCost(circle);
    const cap = 100 + circle.ascensions * 10;
    const card = document.createElement('div');
    card.className = 'circle-card';
    if (circle.unlocked && state.score.gte(cost)) card.classList.add('good');

    const header = document.createElement('h3');
    header.innerHTML = `${circle.name} <span class="small">Lvl ${circle.level}/${cap} Asc ${circle.ascensions}</span>`;
    card.appendChild(header);

    const info = document.createElement('div');
    info.innerHTML = `
      <div class="circle-row"><span>Cost</span><strong>${formatDecimal(cost)}</strong></div>
      <div class="circle-row"><span>Speed</span><strong>${formatDecimal(getCircleLapSpeed(circle))} laps/s</strong></div>
      <div class="circle-row"><span>Mult</span><strong>${formatDecimal(circle.mult)}</strong></div>
      <div class="circle-row"><span>Gain / lap</span><strong>${formatDecimal(getCircleMultGain(circle))}</strong></div>
    `;
    card.appendChild(info);

    const actions = document.createElement('div');
    actions.className = 'circle-row';
    const buyBtn = document.createElement('button');
    buyBtn.textContent = 'Buy Level';
    buyBtn.disabled = !circle.unlocked || state.score.lt(cost) || circle.level >= cap;
    buyBtn.addEventListener('click', () => buyCircleLevel(index));
    actions.appendChild(buyBtn);

    const ascBtn = document.createElement('button');
    ascBtn.textContent = 'Ascend';
    ascBtn.disabled = circle.level < cap || !circle.unlocked;
    ascBtn.addEventListener('click', () => ascendCircle(index));
    actions.appendChild(ascBtn);

    card.appendChild(actions);
    circlesContainer.appendChild(card);
  });

  document.getElementById('prestigeBtn').disabled = !canPrestige();
  document.getElementById('prestigeInfo').textContent = canPrestige()
    ? `Prestige to gain x${formatDecimal(computePrestigeGain())}.` : 'Reach 1e10 score to unlock Prestige.';

  const promotionsContainer = document.getElementById('promotions');
  promotionsContainer.innerHTML = '';
  state.promotions.forEach(promo => {
    const card = document.createElement('div');
    card.className = 'promo-card';
    const header = document.createElement('div');
    header.className = 'circle-row';
    header.innerHTML = `<strong>${promo.name}</strong><span>Level ${promo.level}</span>`;
    card.appendChild(header);
    const effect = document.createElement('div');
    effect.textContent = `Effect: x${promo.effect(promo.level).toFixed(2)}`;
    card.appendChild(effect);
    const buyBtn = document.createElement('button');
    buyBtn.textContent = 'Buy Promotion';
    buyBtn.disabled = state.promotionPoints <= 0;
    buyBtn.addEventListener('click', () => purchasePromotion(promo.id));
    card.appendChild(buyBtn);
    promotionsContainer.appendChild(card);
  });
  document.getElementById('promotionInfo').textContent = state.promotionPoints > 0
    ? `${state.promotionPoints} Promotion Point(s) available.`
    : 'Promotions unlock when Prestige Mult > x1000, or earn points from Prestige.';

  document.getElementById('infinityBtn').disabled = !canInfinity();
  document.getElementById('infinityInfo').textContent = canInfinity()
    ? `Infinity to gain ${formatDecimal(infinityPointsGain())} IP.`
    : 'Reach 1e308 score to unlock Infinity.';

  document.getElementById('eternityBtn').disabled = !canEternity();
  document.getElementById('eternityInfo').textContent = canEternity()
    ? 'You can now Eternate and enter the next layer.'
    : 'Reach 1.79e308 IP to unlock Eternity.';

  const upgradesContainer = document.getElementById('infinityUpgrades');
  upgradesContainer.innerHTML = '';
  state.infinityUpgrades.forEach(upgrade => {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    const header = document.createElement('div');
    header.className = 'circle-row';
    header.innerHTML = `<strong>${upgrade.name}</strong><span>Level ${upgrade.level}</span>`;
    card.appendChild(header);
    const desc = document.createElement('div');
    desc.textContent = `${upgrade.description} Effect: ${typeof upgrade.effect(upgrade.level) === 'number' ? upgrade.effect(upgrade.level).toFixed(2) : upgrade.effect(upgrade.level)}`;
    card.appendChild(desc);
    const costRow = document.createElement('div');
    costRow.className = 'circle-row';
    const costText = document.createElement('span');
    costText.textContent = `Cost: ${formatDecimal(upgrade.cost)} IP`;
    costRow.appendChild(costText);
    const buyBtn = document.createElement('button');
    buyBtn.textContent = 'Buy';
    buyBtn.disabled = state.infinityPoints.lt(upgrade.cost);
    buyBtn.addEventListener('click', () => purchaseInfinityUpgrade(upgrade.id));
    costRow.appendChild(buyBtn);
    card.appendChild(costRow);
    upgradesContainer.appendChild(card);
  });

  const generatorsContainer = document.getElementById('generators');
  generatorsContainer.innerHTML = '';
  state.generators.forEach((generator, index) => {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    const header = document.createElement('div');
    header.className = 'circle-row';
    header.innerHTML = `<strong>${generator.name}</strong><span>Level ${generator.level}</span>`;
    card.appendChild(header);

    const cost = getGeneratorCost(generator);
    const interval = getGeneratorInterval(generator);
    const output = getGeneratorProduction(generator);

    const details = document.createElement('div');
    details.innerHTML = `
      <div class="circle-row"><span>Cost</span><strong>${formatDecimal(cost)} IP</strong></div>
      <div class="circle-row"><span>Interval</span><strong>${formatDecimal(interval)} s</strong></div>
      <div class="circle-row"><span>Production</span><strong>${formatDecimal(output)} /s</strong></div>
    `;
    card.appendChild(details);

    const buyBtn = document.createElement('button');
    buyBtn.textContent = 'Buy Generator';
    buyBtn.disabled = !generator.unlocked || state.infinityPoints.lt(cost);
    buyBtn.addEventListener('click', () => purchaseGenerator(index));
    card.appendChild(buyBtn);
    generatorsContainer.appendChild(card);
  });

  const starsContainer = document.getElementById('stars');
  starsContainer.innerHTML = '';
  const starStatus = document.createElement('div');
  starStatus.innerHTML = `
    <div class="circle-row"><span>Stars</span><strong>${formatDecimal(state.stars.count)}</strong></div>
    <div class="circle-row"><span>Stardust</span><strong>${formatDecimal(state.stardust)}</strong></div>
    <div class="circle-row"><span>Star Effect</span><strong>${formatDecimal(getStarEffect())}</strong></div>
  `;
  starsContainer.appendChild(starStatus);

  const starButton = document.createElement('button');
  starButton.textContent = 'Buy Star';
  starButton.disabled = !state.stars.unlocked || state.infinityPoints.lt(getStarCost());
  starButton.addEventListener('click', buyStar);
  const starCostInfo = document.createElement('div');
  starCostInfo.textContent = `Next star cost: ${formatDecimal(getStarCost())} IP`;
  starsContainer.appendChild(starCostInfo);
  starsContainer.appendChild(starButton);

  const stardustHeader = document.createElement('h3');
  stardustHeader.textContent = 'Stardust Upgrades';
  starsContainer.appendChild(stardustHeader);
  state.stardustUpgrades.forEach(upgrade => {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    const title = document.createElement('div');
    title.className = 'circle-row';
    title.innerHTML = `<strong>${upgrade.name}</strong><span>Level ${upgrade.level}/${upgrade.maxLevel ?? '∞'}</span>`;
    card.appendChild(title);
    const desc = document.createElement('div');
    desc.textContent = `${upgrade.description} Effect: ${upgrade.effect(upgrade.level).toFixed(2)}.`;
    card.appendChild(desc);
    const costRow = document.createElement('div');
    costRow.className = 'circle-row';
    const costText = document.createElement('span');
    costText.textContent = `Cost: ${formatDecimal(upgrade.cost)} Stardust`;
    costRow.appendChild(costText);
    const buyBtn = document.createElement('button');
    buyBtn.textContent = 'Buy';
    buyBtn.disabled = state.stardust.lt(upgrade.cost) || (upgrade.maxLevel && upgrade.level >= upgrade.maxLevel);
    buyBtn.addEventListener('click', () => purchaseStardustUpgrade(upgrade.id));
    costRow.appendChild(buyBtn);
    card.appendChild(costRow);
    starsContainer.appendChild(card);
  });

  const challengePanel = document.getElementById('challengePanel');
  if (challengePanel) {
    challengePanel.innerHTML = '';
    const header = document.createElement('h3');
    header.textContent = 'Infinity Challenges';
    challengePanel.appendChild(header);
    if (!state.challengesUnlocked) {
      const notice = document.createElement('div');
      notice.textContent = 'Unlock Infinity Challenges with the Challenges upgrade.';
      challengePanel.appendChild(notice);
    } else {
      challengeDefinitions.forEach((challenge, index) => {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        const title = document.createElement('div');
        title.className = 'circle-row';
        title.innerHTML = `<strong>${challenge.name}</strong><span>${state.completedChallenges[index] ? 'Completed' : 'Incomplete'}</span>`;
        card.appendChild(title);
        const desc = document.createElement('div');
        desc.textContent = challenge.description;
        card.appendChild(desc);
        if (!state.completedChallenges[index]) {
          const completeBtn = document.createElement('button');
          completeBtn.textContent = 'Complete Challenge';
          completeBtn.addEventListener('click', () => completeChallenge(index));
          card.appendChild(completeBtn);
        }
        challengePanel.appendChild(card);
      });
    }
  }
}

function rebuildState() {
  state.circles.forEach((circle, index) => {
    if (index === 0) return;
    const prev = state.circles[index - 1];
    if (prev.level >= 5) circle.unlocked = true;
  });
  state.generators.forEach((generator, index) => {
    if (index === 0) {
      generator.unlocked = state.infinityUpgrades.find(u => u.id === 'scoreBoost').level >= 1;
    } else {
      generator.unlocked = state.infinityUpgrades.find(u => u.id === 'scoreBoost').level >= 1;
    }
  });
  state.stars.unlocked = state.infinityUpgrades.find(u => u.id === 'starUnlock').level > 0;
  state.challengesUnlocked = state.infinityUpgrades.find(u => u.id === 'challengeUnlock').level > 0;
}

function processGenerators(delta) {
  const gpGain = state.generators.reduce((acc, generator, index) => {
    if (!generator.unlocked || generator.level === 0) return acc;
    const production = getGeneratorProduction(generator);
    const influence = index === 0 ? 1 : Math.pow(0.5, index);
    return acc.add(production.mul(Decimal.fromNumber(influence)));
  }, Decimal.zero());
  state.gp = state.gp.add(gpGain.mul(Decimal.fromNumber(delta)));
}

function processStardust(delta) {
  state.stardust = state.stardust.add(getStardustGain(delta));
}

function gameLoop() {
  const now = Date.now();
  const delta = Math.min((now - lastTick) / 1000, 1);
  lastTick = now;

  const scoreRate = getScoreRate();
  const gained = scoreRate.mul(Decimal.fromNumber(delta));
  state.score = state.score.add(gained);
  state.totalScore = state.totalScore.add(gained);

  processGenerators(delta);
  processStardust(delta);
  rebuildState();
  saveState();
  render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('load', () => {
  setupEventListeners();
  if (!state.circles || state.circles.length === 0) state.circles = createInitialCircles();
  if (!state.promotions || state.promotions.length === 0) state.promotions = createInitialPromotions();
  if (!state.infinityUpgrades || state.infinityUpgrades.length === 0) state.infinityUpgrades = createInitialInfinityUpgrades();
  if (!state.generators || state.generators.length === 0) state.generators = createInitialGenerators();
  if (!state.stardustUpgrades || state.stardustUpgrades.length === 0) state.stardustUpgrades = createInitialStardustUpgrades();
  rebuildState();
  render();
  lastTick = Date.now();
  requestAnimationFrame(gameLoop);
});
