export interface GridTheme {
  id: string
  name: { en: string; hu?: string }
  words: string[]
}

/**
 * Témánként legalább 11 szó, hogy egy 8-10 szavas rács se használja fel
 * mindet — így ugyanaz a téma két különböző körben más feladvány.
 */
export const GRID_THEMES: GridTheme[] = [
  {
    id: 'astronomy',
    name: { en: 'Astronomy' },
    words: ['PLANET', 'COMET', 'ORBIT', 'GALAXY', 'NEBULA', 'ECLIPSE', 'METEOR', 'QUASAR', 'COSMOS', 'GRAVITY', 'PULSAR', 'CRATER'],
  },
  {
    id: 'kitchen',
    name: { en: 'In the kitchen' },
    words: ['SPOON', 'WHISK', 'KETTLE', 'BLENDER', 'SKILLET', 'LADLE', 'GRATER', 'SIEVE', 'TONGS', 'PANTRY', 'MORTAR', 'COLANDER'],
  },
  {
    id: 'music',
    name: { en: 'Music' },
    words: ['TEMPO', 'CHORD', 'VIOLIN', 'SONATA', 'RHYTHM', 'OCTAVE', 'BALLAD', 'TREBLE', 'MELODY', 'HARMONY', 'CONCERT', 'CLARINET'],
  },
  {
    id: 'weather',
    name: { en: 'Weather' },
    words: ['THUNDER', 'DRIZZLE', 'BLIZZARD', 'MONSOON', 'CYCLONE', 'FROST', 'TORNADO', 'BREEZE', 'SLEET', 'HUMID', 'RAINBOW', 'OVERCAST'],
  },
  {
    id: 'landforms',
    name: { en: 'Landforms' },
    words: ['ISTHMUS', 'PLATEAU', 'FJORD', 'TUNDRA', 'DELTA', 'CANYON', 'GLACIER', 'SAVANNA', 'ESTUARY', 'LAGOON', 'MESA', 'RAVINE'],
  },
  {
    id: 'animals',
    name: { en: 'Unusual animals' },
    words: ['OTTER', 'LEMUR', 'BADGER', 'PANGOLIN', 'GIBBON', 'WOMBAT', 'MEERKAT', 'TAPIR', 'IGUANA', 'OSPREY', 'MARMOT', 'AXOLOTL'],
  },
  {
    id: 'chemistry',
    name: { en: 'Chemistry' },
    words: ['ISOTOPE', 'CATALYST', 'SOLVENT', 'POLYMER', 'ALKALI', 'ENZYME', 'VALENCE', 'OXIDE', 'PLASMA', 'NEUTRON', 'ACIDIC', 'CRYSTAL'],
  },
  {
    id: 'architecture',
    name: { en: 'Architecture' },
    words: ['ARCH', 'VAULT', 'COLUMN', 'FACADE', 'ATRIUM', 'GABLE', 'SPIRE', 'BUTTRESS', 'CORNICE', 'ROTUNDA', 'PORTICO', 'MEZZANINE'],
  },
]
