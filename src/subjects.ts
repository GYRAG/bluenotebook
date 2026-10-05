// Subjects and their nav sections. Adding a Phase 2 subject = one entry here + content files.
export const SUBJECTS = {
  geometry: {
    label: 'გეომეტრია',
    sections: { basics: 'საფუძვლები', triangles: 'სამკუთხედი', quadrilaterals: 'ოთხკუთხედები', circles: 'წრეწირი' },
  },
  algebra: { label: 'ალგებრა', sections: { equations: 'განტოლებები' } },
  trig: { label: 'ტრიგონომეტრია', sections: { basics: 'საფუძვლები' } },
  precalc: { label: 'პრეკალკულუსი', sections: { functions: 'ფუნქციები' } }, // no Georgian school equivalent; transliterated
  'number-theory': { label: 'რიცხვთა თეორია', sections: { basics: 'საფუძვლები' } },
  sat: { label: 'SAT', sections: { math: 'მათემატიკა' } },
} as const satisfies Record<string, { label: string; sections: Record<string, string> }>;

export type SubjectId = keyof typeof SUBJECTS;
export const SUBJECT_IDS = Object.keys(SUBJECTS) as [SubjectId, ...SubjectId[]];
