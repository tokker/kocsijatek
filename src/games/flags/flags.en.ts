import type { FlagSpec } from './FlagSvg'
import type { Difficulty } from '../difficulty'

export interface FlagQuestion {
  id: string
  spec: FlagSpec
  choices: { en: string[]; hu?: string[] }
  correctIndex: number
  difficulty: Difficulty
}

/**
 * A nehézséget a HAMIS válaszok adják. Egy három sávos zászló mellé négy
 * találomra választott ország nevét kirakni triviális feladat; négy
 * hasonló zászlójú országot felsorolni viszont tényleg tudást igényel.
 */
export const FLAG_QUESTIONS: FlagQuestion[] = [
  // ─────────────────────────────── MEDIUM ───────────────────────────────
  {
    id: 'france',
    spec: { kind: 'vertical', colors: ['#002395', '#FFFFFF', '#ED2939'] },
    choices: { en: ['Netherlands', 'France', 'Russia', 'Luxembourg'] },
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 'italy',
    spec: { kind: 'vertical', colors: ['#008C45', '#F4F5F0', '#CD212A'] },
    choices: { en: ['Ireland', 'Italy', 'Hungary', 'Mexico'] },
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 'germany',
    spec: { kind: 'horizontal', colors: ['#000000', '#DD0000', '#FFCE00'] },
    choices: { en: ['Belgium', 'Germany', 'Uganda', 'Angola'] },
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 'japan',
    spec: { kind: 'disc', field: '#FFFFFF', disc: '#BC002D' },
    choices: { en: ['Bangladesh', 'Palau', 'Japan', 'Laos'] },
    correctIndex: 2,
    difficulty: 'medium',
  },
  {
    id: 'switzerland',
    spec: { kind: 'swissCross', field: '#D52B1E', cross: '#FFFFFF' },
    choices: { en: ['Denmark', 'Switzerland', 'Georgia', 'Tonga'] },
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 'sweden',
    spec: { kind: 'nordic', field: '#006AA7', cross: '#FECC00' },
    choices: { en: ['Finland', 'Sweden', 'Iceland', 'Norway'] },
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 'denmark',
    spec: { kind: 'nordic', field: '#C60C30', cross: '#FFFFFF' },
    choices: { en: ['Denmark', 'Norway', 'Iceland', 'Faroe Islands'] },
    correctIndex: 0,
    difficulty: 'medium',
  },
  {
    id: 'poland',
    spec: { kind: 'horizontal', colors: ['#FFFFFF', '#DC143C'] },
    choices: { en: ['Indonesia', 'Monaco', 'Poland', 'Singapore'] },
    correctIndex: 2,
    difficulty: 'medium',
  },
  {
    id: 'belgium',
    spec: { kind: 'vertical', colors: ['#000000', '#FAE042', '#ED2939'] },
    choices: { en: ['Germany', 'Belgium', 'Chad', 'Romania'] },
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 'ireland',
    spec: { kind: 'vertical', colors: ['#169B62', '#FFFFFF', '#FF883E'] },
    choices: { en: ['Italy', 'Ireland', "Côte d'Ivoire", 'India'] },
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 'austria',
    spec: { kind: 'horizontal', colors: ['#ED2939', '#FFFFFF', '#ED2939'] },
    choices: { en: ['Latvia', 'Peru', 'Austria', 'Lebanon'] },
    correctIndex: 2,
    difficulty: 'medium',
  },
  {
    id: 'netherlands',
    spec: { kind: 'horizontal', colors: ['#AE1C28', '#FFFFFF', '#21468B'] },
    choices: { en: ['Russia', 'Netherlands', 'Luxembourg', 'Croatia'] },
    correctIndex: 1,
    difficulty: 'medium',
  },

  // ──────────────────────────────── HARD ────────────────────────────────
  {
    id: 'hungary',
    spec: { kind: 'horizontal', colors: ['#CE2939', '#FFFFFF', '#477050'] },
    choices: { en: ['Bulgaria', 'Iran', 'Hungary', 'Tajikistan'] },
    correctIndex: 2,
    difficulty: 'hard',
  },
  {
    id: 'bulgaria',
    spec: { kind: 'horizontal', colors: ['#FFFFFF', '#00966E', '#D62612'] },
    choices: { en: ['Hungary', 'Bulgaria', 'Italy', 'Iran'] },
    correctIndex: 1,
    difficulty: 'hard',
  },
  {
    id: 'russia',
    spec: { kind: 'horizontal', colors: ['#FFFFFF', '#0039A6', '#D52B1E'] },
    choices: { en: ['Netherlands', 'Slovakia', 'Russia', 'Slovenia'] },
    correctIndex: 2,
    difficulty: 'hard',
  },
  {
    id: 'romania',
    spec: { kind: 'vertical', colors: ['#002B7F', '#FCD116', '#CE1126'] },
    choices: { en: ['Moldova', 'Andorra', 'Romania', 'Belgium'] },
    correctIndex: 2,
    difficulty: 'hard',
  },
  {
    id: 'ukraine',
    spec: { kind: 'horizontal', colors: ['#0057B7', '#FFD700'] },
    choices: { en: ['Sweden', 'Ukraine', 'Kazakhstan', 'Bosnia'] },
    correctIndex: 1,
    difficulty: 'hard',
  },
  {
    id: 'finland',
    spec: { kind: 'nordic', field: '#FFFFFF', cross: '#003580' },
    choices: { en: ['Iceland', 'Finland', 'Sweden', 'Åland'] },
    correctIndex: 1,
    difficulty: 'hard',
  },
  {
    id: 'norway',
    spec: { kind: 'nordic', field: '#BA0C2F', cross: '#FFFFFF', inner: '#00205B' },
    choices: { en: ['Iceland', 'Denmark', 'Norway', 'Faroe Islands'] },
    correctIndex: 2,
    difficulty: 'hard',
  },
  {
    id: 'iceland',
    spec: { kind: 'nordic', field: '#02529C', cross: '#FFFFFF', inner: '#DC1E35' },
    choices: { en: ['Norway', 'Iceland', 'Finland', 'Estonia'] },
    correctIndex: 1,
    difficulty: 'hard',
  },
  {
    id: 'estonia',
    spec: { kind: 'horizontal', colors: ['#0072CE', '#000000', '#FFFFFF'] },
    choices: { en: ['Botswana', 'Estonia', 'Sierra Leone', 'Gabon'] },
    correctIndex: 1,
    difficulty: 'hard',
  },
  {
    id: 'lithuania',
    spec: { kind: 'horizontal', colors: ['#FDB913', '#006A44', '#C1272D'] },
    choices: { en: ['Bolivia', 'Ghana', 'Lithuania', 'Myanmar'] },
    correctIndex: 2,
    difficulty: 'hard',
  },
  {
    id: 'nigeria',
    spec: { kind: 'vertical', colors: ['#008751', '#FFFFFF', '#008751'] },
    choices: { en: ['Pakistan', 'Nigeria', 'Algeria', 'Saudi Arabia'] },
    correctIndex: 1,
    difficulty: 'hard',
  },
  {
    id: 'peru',
    spec: { kind: 'vertical', colors: ['#D91023', '#FFFFFF', '#D91023'] },
    choices: { en: ['Canada', 'Austria', 'Peru', 'Malta'] },
    correctIndex: 2,
    difficulty: 'hard',
  },
  {
    id: 'indonesia',
    spec: { kind: 'horizontal', colors: ['#CE1126', '#FFFFFF'] },
    choices: { en: ['Poland', 'Indonesia', 'Singapore', 'Bahrain'] },
    correctIndex: 1,
    difficulty: 'hard',
  },

  // ─────────────────────────────── BRUTAL ───────────────────────────────
  {
    id: 'luxembourg',
    spec: { kind: 'horizontal', colors: ['#ED2939', '#FFFFFF', '#00A1DE'] },
    choices: { en: ['Netherlands', 'Luxembourg', 'Croatia', 'Slovakia'] },
    correctIndex: 1,
    difficulty: 'brutal',
  },
  {
    id: 'gabon',
    spec: { kind: 'horizontal', colors: ['#009E60', '#FCD116', '#3A75C4'] },
    choices: { en: ['Gabon', 'Sierra Leone', 'Rwanda', 'Guinea-Bissau'] },
    correctIndex: 0,
    difficulty: 'brutal',
  },
  {
    id: 'sierra-leone',
    spec: { kind: 'horizontal', colors: ['#1EB53A', '#FFFFFF', '#0072C6'] },
    choices: { en: ['Gabon', 'Estonia', 'Sierra Leone', 'Lesotho'] },
    correctIndex: 2,
    difficulty: 'brutal',
  },
  {
    id: 'mali',
    spec: { kind: 'vertical', colors: ['#14B53A', '#FCD116', '#CE1126'] },
    choices: { en: ['Guinea', 'Senegal', 'Mali', 'Cameroon'] },
    correctIndex: 2,
    difficulty: 'brutal',
  },
  {
    id: 'guinea',
    spec: { kind: 'vertical', colors: ['#CE1126', '#FCD116', '#009460'] },
    choices: { en: ['Mali', 'Guinea', 'Benin', 'Ethiopia'] },
    correctIndex: 1,
    difficulty: 'brutal',
  },
  {
    id: 'ivory-coast',
    spec: { kind: 'vertical', colors: ['#F77F00', '#FFFFFF', '#009E60'] },
    choices: { en: ['Ireland', 'India', "Côte d'Ivoire", 'Niger'] },
    correctIndex: 2,
    difficulty: 'brutal',
  },
  {
    id: 'armenia',
    spec: { kind: 'horizontal', colors: ['#D90012', '#0033A0', '#F2A800'] },
    choices: { en: ['Colombia', 'Armenia', 'Venezuela', 'Ecuador'] },
    correctIndex: 1,
    difficulty: 'brutal',
  },
  {
    id: 'yemen',
    spec: { kind: 'horizontal', colors: ['#CE1126', '#FFFFFF', '#000000'] },
    choices: { en: ['Egypt', 'Iraq', 'Syria', 'Yemen'] },
    correctIndex: 3,
    difficulty: 'brutal',
  },
  {
    id: 'faroe',
    spec: { kind: 'nordic', field: '#FFFFFF', cross: '#0065BD', inner: '#ED2939' },
    choices: { en: ['Åland', 'Faroe Islands', 'Iceland', 'Norway'] },
    correctIndex: 1,
    difficulty: 'brutal',
  },
  {
    id: 'bangladesh',
    spec: { kind: 'disc', field: '#006A4E', disc: '#F42A41', discX: 40 },
    choices: { en: ['Japan', 'Palau', 'Bangladesh', 'Niger'] },
    correctIndex: 2,
    difficulty: 'brutal',
  },
  {
    id: 'palau',
    spec: { kind: 'disc', field: '#4AADD6', disc: '#FFDE00', discX: 38 },
    choices: { en: ['Palau', 'Bangladesh', 'Japan', 'Kiribati'] },
    correctIndex: 0,
    difficulty: 'brutal',
  },
  {
    id: 'laos',
    spec: {
      kind: 'bandsDisc',
      colors: ['#CE1126', '#002868', '#CE1126'],
      weights: [1, 2, 1],
      disc: '#FFFFFF',
    },
    choices: { en: ['Thailand', 'Laos', 'Cambodia', 'North Korea'] },
    correctIndex: 1,
    difficulty: 'brutal',
  },
]
