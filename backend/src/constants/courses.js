export const COURSE_OPTIONS = [
  { code: 'SECI1013', name: 'Discrete Structure' },
  { code: 'SECJ1013', name: 'Programming Technique I' },
  { code: 'SECR1013', name: 'Digital Logic' },
  { code: 'SECP1513', name: 'Technology & Information System' },
  { code: 'SECI1113', name: 'Computational Mathematics' },
  { code: 'SECI1143', name: 'Probability & Statistical Data Analysis' },
  { code: 'SECJ1023', name: 'Programming Technique II' },
  { code: 'SECR1033', name: 'Computer Organisation and Architecture' },
  { code: 'SECD2523', name: 'Database' },
  { code: 'SECD2613', name: 'System Analysis and Design' },
  { code: 'SECJ2013', name: 'Data Structure and Algorithm' },
  { code: 'SECR2213', name: 'Network Communications' },
  { code: 'SECV2113', name: 'Human Computer Interaction' },
  { code: 'SECJ2203', name: 'Software Engineering' },
  { code: 'SECV2223', name: 'Web Programming' },
  { code: 'SECR2043', name: 'Operating Systems' },
  { code: 'SECJ2154', name: 'Object Oriented Programming' },
  { code: 'SECJ2253', name: 'Requirements Engineering & Software Modelling' },
  { code: 'SECJ2363', name: 'Software Project Management' },
  { code: 'SECJ3104', name: 'Applications Development' },
  { code: 'SECJ3553', name: 'Artificial Intelligence' },
  { code: 'SECJ3303', name: 'Internet Programming' },
  { code: 'SECJ3323', name: 'Software Design & Architecture' },
  { code: 'SECJ3603', name: 'Knowledge-Based & Expert Systems' },
  { code: 'SECJ3032', name: 'Software Engineering Project I' },
  { code: 'SECJ3203', name: 'Theory of Computer Science' },
  { code: 'SECJ3343', name: 'Software Quality Assurance' },
  { code: 'SECJ3563', name: 'Computational Intelligence' },
  { code: 'SECJ3623', name: 'Mobile Application Programming' },
  { code: 'SECJ3403', name: 'Special Topic in Software Engineering' },
  { code: 'SECJ3483', name: 'Web Technology' },
  { code: 'SECJ4118', name: 'Industrial Training (HW)' },
  { code: 'SECJ4114', name: 'Industrial Training Report' },
  { code: 'SECJ4134', name: 'Software Engineering Project II' },
  { code: 'SECD3761', name: 'Technopreneurship Seminar' },
  { code: 'UBSS1032', name: 'Introduction to Entrepreneurship' },
  { code: 'SECJ4383', name: 'Software Construction' },
  { code: 'SECJ4423', name: 'Real-Time Software Engineering' },
  { code: 'SECJ4463', name: 'Agent-Oriented Software Engineering' },
];

export function findCourseByCode(code) {
  return COURSE_OPTIONS.find((course) => course.code === code);
}

export function getCourseDisplayName(code) {
  const course = findCourseByCode(code);
  if (!course) return code;
  return `${course.name} (${code})`;
}