# Revolution Idle Clone — Design-Dokument

## Ziel
Dieses Projekt beschreibt die Spielstruktur von Revolution Idle und implementiert eine erste Prototyp-Version bis zum Abschluss des ersten Reset-Layers: Infinity.

## Kernsysteme

### 1. Circles / Farben
- 10 Circles: Red, Orange, Yellow, Green, Turquoise, Cyan, Blue, Purple, Pink, White
- Jede Circle hat:
  - Startkosten
  - Kostenmultiplikator
  - Basis-Lap-Speed (laps/s pro Level)
  - Level, Level-Cap, Ascension-Power
  - Mult-Gain pro Revolution
- Alle Circles beginnen gesperrt außer Red.
- Neue Circles werden freigeschaltet, wenn die vorherige Circle mindestens 5 Level erreicht hat.

### 2. Score-Produktion
- Score pro Sekunde wird als:
  - `Score/Revolution * Summe aller Circle-Revolutionen pro Sekunde`
- `Score/Revolution` basiert auf dem Produkt aller Circle-Mults und dem Prestige-Mult:
  - `Score/Revolution = ([Produkt aller Circle-Mults] * P.Mult) ^ CommonExponent`
- Common Exponent wird für den Prototype als 1 verwendet.

### 3. Upgrades, Ascension und Level-Cap
- Circles können bis zum aktuellen Level-Cap gelevelt werden.
- Der Basis-Level-Cap ist 100 und steigt bei jeder Ascension um +10.
- Ascension:
  - Setzt eine Circle auf Level 5 zurück.
  - Erhöht Mult-Gain mit Ascension Power.
  - Erhöht den Level-Cap.
- Kostenmultiplikator jeder Circle erhöht sich nach Ascension um +0.1.

### 4. Prestige
- Prestige wird bei 1e10 Score verfügbar.
- Prestige gewährt:
  - `P.Mult` (statischer Multiplikator)
  - `P.Exponent` (zusätzliche logarithmische Skalierung)
- Prestige setzt Circle-Progress, Ascensions und Promotion-Level zurück.

### 5. Promotion
- Ab P.Mult > x1000 werden Promotionen freigeschaltet.
- 4 Promotionstypen:
  1. Mult-Gain-Mult
  2. Lap-Speed-Mult
  3. Ascension-Power
  4. Promotion-Power
- Promotionen verbessern permanent die gesamte Run-Leistung nach Prestige.

### 6. Infinity
- Bei ca. 1.79e308 Score wird der Infinity-Button verfügbar.
- Infinity setzt:
  - Score
  - Circles + Ascensions
  - P.Mult und P.Exponent
  - Promotionen
  - Generator-Power (wenn implementiert)
  - Stardust
- Infinity gewährt Infinity Points (IP).
- IP können für permanente Infinity-Upgrades ausgegeben werden.

## Technik
- Das Spiel verwendet eine einfache `SciNum`-Repräsentation zur Unterstützung großer Zahlen im wissenschaftlichen Format.
- Automatische Speicherung erfolgt in `localStorage`.
- UI ist als reine HTML/JavaScript-Frontend-Implementierung gebaut.

## Umsetzungsumfang für diesen Prototyp
- Voller Revolution-Layer mit Circles, Ascension, Prestige und Promotions.
- Basis-Infinity-Layer mit Kosten, IP und einigen Upgrade-Effekten.
- Keine vollständige Eternity-Implementierung; stattdessen eine Hinweisnotiz am Ende von Infinity.

## Abdeckung
- Implementiert:
  - Circle-Fortschritt
  - Ascension-Logik
  - Prestige-Mechanik
  - Promotionen
  - Infinity-Unlock
  - Infinity-Upgrades
- Ausgelassen / später:
  - Komplette Infinity Challenges
  - Generators als tieferes System
  - Stardust/Stars als separater Shop
  - Eternity, Supernova, Dilation, Animal-System
