import { shuffleArray } from '../lib/utils.js';

const TOPIC_BANK = {
  sdlc: {
    lesson:
      'Software Development Life Cycle (SDLC) is a structured process used to design, build, test, and deploy software reliably. Typical phases include planning, analysis, design, implementation, testing, deployment, and maintenance. Teams choose models such as Waterfall, Agile, or Spiral depending on project risk, requirements volatility, and feedback needs.',
    questions: [
      {
        prompt: 'Which SDLC phase focuses on understanding business needs and requirements?',
        options: ['Testing', 'Analysis', 'Deployment', 'Maintenance'],
        correct: 1,
      },
      {
        prompt: 'What is the key strength of Agile compared with Waterfall?',
        options: ['No documentation needed', 'Early iterative feedback', 'No testing required', 'Fixed requirements only'],
        correct: 1,
      },
      {
        prompt: 'Which phase validates that software meets expected behavior?',
        options: ['Testing', 'Planning', 'Design', 'Requirements elicitation'],
        correct: 0,
      },
      {
        prompt: 'Maintenance in SDLC mainly addresses what after release?',
        options: ['Marketing campaigns', 'Bug fixes and improvements', 'UI mockup creation', 'Initial requirement collection'],
        correct: 1,
      },
      {
        prompt: 'A project with rapidly changing requirements usually benefits most from:',
        options: ['Pure Waterfall', 'Agile iterations', 'No process model', 'Skipping design'],
        correct: 1,
      },
    ],
  },
  testing: {
    lesson:
      'Software testing verifies functionality, reliability, and quality. Unit testing checks small components in isolation. Integration testing validates interactions between modules. System testing evaluates complete workflows. Regression testing ensures new changes do not break existing behavior.',
    questions: [
      {
        prompt: 'Unit tests primarily focus on:',
        options: ['Entire production environment', 'Single functions or modules', 'Only UI layouts', 'Business contracts'],
        correct: 1,
      },
      {
        prompt: 'Integration testing is best for validating:',
        options: ['Single method correctness', 'Module interactions', 'Team standups', 'Code formatting'],
        correct: 1,
      },
      {
        prompt: 'Regression testing is performed to:',
        options: ['Rewrite architecture', 'Ensure old features still work', 'Remove test cases', 'Skip release checks'],
        correct: 1,
      },
      {
        prompt: 'Which statement about testing is true?',
        options: ['Testing guarantees zero defects', 'Testing provides confidence, not absolute proof', 'Testing replaces requirements', 'Testing is only done at the end'],
        correct: 1,
      },
      {
        prompt: 'System testing evaluates:',
        options: ['Code style only', 'Entire application behavior', 'Variable naming', 'Single API response field'],
        correct: 1,
      },
    ],
  },
  requirements: {
    lesson:
      'Requirements engineering captures what stakeholders need from the system. Functional requirements describe system behavior. Non-functional requirements define qualities such as performance, security, and usability. Clear, testable requirements reduce rework and help align teams.',
    questions: [
      {
        prompt: 'Which is a non-functional requirement?',
        options: ['Reset password flow', 'Response time under 2 seconds', 'Create user account', 'Submit quiz answer'],
        correct: 1,
      },
      {
        prompt: 'Good requirements should be:',
        options: ['Ambiguous', 'Testable and clear', 'Optional to validate', 'Written after implementation'],
        correct: 1,
      },
      {
        prompt: 'The main purpose of requirements elicitation is to:',
        options: ['Skip stakeholder input', 'Understand stakeholder needs', 'Deploy quickly', 'Generate UI colors'],
        correct: 1,
      },
      {
        prompt: 'Functional requirements define:',
        options: ['System behavior', 'Brand identity', 'Office policy', 'Database vendor'],
        correct: 0,
      },
      {
        prompt: 'Poor requirements often cause:',
        options: ['Less communication needed', 'Project rework and scope confusion', 'Faster delivery always', 'No impact on quality'],
        correct: 1,
      },
    ],
  },
};

function detectTopic(title = '', topics = []) {
  const combined = `${title} ${topics.join(' ')}`.toLowerCase();
  if (combined.includes('sdlc')) return 'sdlc';
  if (combined.includes('test')) return 'testing';
  if (combined.includes('requirement')) return 'requirements';
  return 'sdlc';
}

export function generateFallbackContent({ title, topics, questionCount }) {
  const key = detectTopic(title, topics);
  const bank = TOPIC_BANK[key] || TOPIC_BANK.sdlc;
  const selected = shuffleArray(bank.questions).slice(0, questionCount);

  return {
    lesson: bank.lesson,
    questions: selected,
  };
}
