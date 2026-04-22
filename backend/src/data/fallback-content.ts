import { shuffleArray } from '../lib/utils.js';
import type { GeneratedContent, GeneratedQuestion } from '../types/index.js';

interface TopicBankEntry {
  lesson: string;
  questions: GeneratedQuestion[];
}

function makeMeta(topic: string, subtopic: string, bloom: GeneratedQuestion['metadata']['bloomLevel'], solo: GeneratedQuestion['metadata']['soloLevel']): GeneratedQuestion['metadata'] {
  return { topic, subtopic, bloomLevel: bloom, soloLevel: solo };
}

const TOPIC_BANK: Record<string, TopicBankEntry> = {
  sdlc: {
    lesson:
      'Software Development Life Cycle (SDLC) is a structured process used to design, build, test, and deploy software reliably. Typical phases include planning, analysis, design, implementation, testing, deployment, and maintenance. Teams choose models such as Waterfall, Agile, or Spiral depending on project risk, requirements volatility, and feedback needs.',
    questions: [
      {
        prompt: 'Which SDLC phase focuses on understanding business needs and requirements?',
        options: ['Testing', 'Analysis', 'Deployment', 'Maintenance'],
        correct: 1,
        explanations: [
          'Testing validates behavior, it does not focus on understanding needs.',
          'Correct. Analysis is the phase where business needs and requirements are gathered and documented.',
          'Deployment releases the software to users, it happens after understanding needs.',
          'Maintenance occurs after release to fix issues, not to understand initial needs.',
        ],
        metadata: makeMeta('SDLC', 'Phases', 'remember', 'unistructural'),
      },
      {
        prompt: 'What is the key strength of Agile compared with Waterfall?',
        options: ['No documentation needed', 'Early iterative feedback', 'No testing required', 'Fixed requirements only'],
        correct: 1,
        explanations: [
          'Agile still requires documentation, though it is leaner than Waterfall.',
          'Correct. Agile emphasizes short iterations and early feedback from stakeholders.',
          'Testing is integral to Agile; it is not skipped.',
          'Agile embraces changing requirements, unlike Waterfall which prefers fixed requirements.',
        ],
        metadata: makeMeta('SDLC', 'Agile vs Waterfall', 'understand', 'multistructural'),
      },
      {
        prompt: 'Which phase validates that software meets expected behavior?',
        options: ['Testing', 'Planning', 'Design', 'Requirements elicitation'],
        correct: 0,
        explanations: [
          'Correct. Testing is the phase where the software is validated against expected behavior.',
          'Planning defines scope and resources, it does not validate behavior.',
          'Design creates architecture and models, it does not validate the running software.',
          'Requirements elicitation gathers needs, it does not validate implementation.',
        ],
        metadata: makeMeta('SDLC', 'Phases', 'remember', 'unistructural'),
      },
      {
        prompt: 'Maintenance in SDLC mainly addresses what after release?',
        options: ['Marketing campaigns', 'Bug fixes and improvements', 'UI mockup creation', 'Initial requirement collection'],
        correct: 1,
        explanations: [
          'Marketing campaigns are not part of the SDLC maintenance phase.',
          'Correct. Maintenance focuses on fixing bugs, improving performance, and adapting the software after release.',
          'UI mockups are created during design, not maintenance.',
          'Initial requirements are collected during analysis, not maintenance.',
        ],
        metadata: makeMeta('SDLC', 'Maintenance', 'understand', 'multistructural'),
      },
      {
        prompt: 'A project with rapidly changing requirements usually benefits most from:',
        options: ['Pure Waterfall', 'Agile iterations', 'No process model', 'Skipping design'],
        correct: 1,
        explanations: [
          'Waterfall struggles with changing requirements because each phase must complete before the next begins.',
          'Correct. Agile iterations accommodate change through short cycles and continuous stakeholder feedback.',
          'Lack of a process model leads to chaos and poor quality, not benefit.',
          'Skipping design produces technical debt and unpredictable outcomes.',
        ],
        metadata: makeMeta('SDLC', 'Process Model Selection', 'apply', 'relational'),
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
        explanations: [
          'Testing the entire production environment is the domain of system or acceptance testing.',
          'Correct. Unit tests isolate and verify the correctness of individual functions or modules.',
          'UI layouts may be checked by visual or UI tests, but unit tests focus on logic, not layout.',
          'Business contracts are validated through integration or acceptance testing, not unit tests.',
        ],
        metadata: makeMeta('Testing', 'Unit Testing', 'remember', 'unistructural'),
      },
      {
        prompt: 'Integration testing is best for validating:',
        options: ['Single method correctness', 'Module interactions', 'Team standups', 'Code formatting'],
        correct: 1,
        explanations: [
          'Single method correctness is validated by unit testing, not integration testing.',
          'Correct. Integration testing validates that modules interact correctly and data flows between them.',
          'Team standups are a Scrum practice, not a testing activity.',
          'Code formatting is checked by linters, not integration tests.',
        ],
        metadata: makeMeta('Testing', 'Integration Testing', 'remember', 'unistructural'),
      },
      {
        prompt: 'Regression testing is performed to:',
        options: ['Rewrite architecture', 'Ensure old features still work', 'Remove test cases', 'Skip release checks'],
        correct: 1,
        explanations: [
          'Rewriting architecture is a redesign activity, not the purpose of regression testing.',
          'Correct. Regression testing re-runs existing tests to ensure new changes have not broken previously working features.',
          'Regression testing does not remove test cases; it relies on existing test suites.',
          'Regression testing is a release check, not something to skip.',
        ],
        metadata: makeMeta('Testing', 'Regression Testing', 'understand', 'multistructural'),
      },
      {
        prompt: 'Which statement about testing is true?',
        options: ['Testing guarantees zero defects', 'Testing provides confidence, not absolute proof', 'Testing replaces requirements', 'Testing is only done at the end'],
        correct: 1,
        explanations: [
          'Testing cannot guarantee zero defects; it can only reduce the likelihood of undiscovered bugs.',
          'Correct. Testing increases confidence in quality but cannot provide absolute proof of correctness.',
          'Testing validates against requirements; it does not replace them.',
          'Testing should occur throughout development, not just at the end.',
        ],
        metadata: makeMeta('Testing', 'Testing Principles', 'evaluate', 'relational'),
      },
      {
        prompt: 'System testing evaluates:',
        options: ['Code style only', 'Entire application behavior', 'Variable naming', 'Single API response field'],
        correct: 1,
        explanations: [
          'Code style is checked by static analysis tools, not system testing.',
          'Correct. System testing evaluates the complete, integrated application against specified requirements.',
          'Variable naming is a code review concern, not a system testing objective.',
          'A single API response field would be checked by unit or integration testing, not system testing.',
        ],
        metadata: makeMeta('Testing', 'System Testing', 'remember', 'unistructural'),
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
        explanations: [
          'Reset password flow describes system behavior, making it a functional requirement.',
          'Correct. Response time is a quality attribute, which is a non-functional requirement.',
          'Creating a user account describes behavior, so it is functional.',
          'Submitting a quiz answer describes behavior, so it is functional.',
        ],
        metadata: makeMeta('Requirements', 'Non-functional Requirements', 'apply', 'multistructural'),
      },
      {
        prompt: 'Good requirements should be:',
        options: ['Ambiguous', 'Testable and clear', 'Optional to validate', 'Written after implementation'],
        correct: 1,
        explanations: [
          'Ambiguous requirements lead to misunderstandings and rework.',
          'Correct. Good requirements are testable, clear, and unambiguous so they can be validated.',
          'Requirements must be validated; they cannot be optional to validate.',
          'Requirements should guide implementation, not be written after it.',
        ],
        metadata: makeMeta('Requirements', 'Requirement Quality', 'understand', 'multistructural'),
      },
      {
        prompt: 'The main purpose of requirements elicitation is to:',
        options: ['Skip stakeholder input', 'Understand stakeholder needs', 'Deploy quickly', 'Generate UI colors'],
        correct: 1,
        explanations: [
          'Skipping stakeholder input would defeat the purpose of requirements elicitation.',
          'Correct. Elicitation is the process of discovering and understanding stakeholder needs and constraints.',
          'Deployment speed is a project management concern, not the goal of elicitation.',
          'UI colors are a design detail, not the outcome of requirements elicitation.',
        ],
        metadata: makeMeta('Requirements', 'Elicitation', 'understand', 'unistructural'),
      },
      {
        prompt: 'Functional requirements define:',
        options: ['System behavior', 'Brand identity', 'Office policy', 'Database vendor'],
        correct: 0,
        explanations: [
          'Correct. Functional requirements specify what the system should do — its behavior and features.',
          'Brand identity is a marketing or design concern, not a functional requirement.',
          'Office policy is an organizational matter, not a system requirement.',
          'Database vendor selection is an architectural decision, not a functional requirement.',
        ],
        metadata: makeMeta('Requirements', 'Functional Requirements', 'remember', 'unistructural'),
      },
      {
        prompt: 'Poor requirements often cause:',
        options: ['Less communication needed', 'Project rework and scope confusion', 'Faster delivery always', 'No impact on quality'],
        correct: 1,
        explanations: [
          'Poor requirements usually increase communication overhead due to confusion.',
          'Correct. Poor requirements lead to rework, scope creep, and misaligned expectations.',
          'Poor requirements typically slow delivery because of frequent corrections.',
          'Poor requirements have a direct negative impact on quality and project success.',
        ],
        metadata: makeMeta('Requirements', 'Impact of Poor Requirements', 'analyze', 'relational'),
      },
    ],
  },
};

function detectTopic(title: string, topics: string[]): keyof typeof TOPIC_BANK {
  const combined = `${title} ${topics.join(' ')}`.toLowerCase();
  if (combined.includes('sdlc')) return 'sdlc';
  if (combined.includes('test')) return 'testing';
  if (combined.includes('requirement')) return 'requirements';
  return 'sdlc';
}

export function generateFallbackContent(params: {
  title: string;
  topics: string[];
  questionCount: number;
}): GeneratedContent {
  const key = detectTopic(params.title, params.topics);
  const bank = TOPIC_BANK[key] ?? TOPIC_BANK.sdlc!;
  const selected = shuffleArray(bank.questions).slice(0, params.questionCount);
  // Fallback content is synthetic (no RAG grounding) — return an empty sources array
  // so the UI still renders and downstream code doesn't need special cases.
  return { lesson: bank.lesson, questions: selected, sources: [] };
}
