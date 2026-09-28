/**
 * 180-Day JavaScript Mastery Roadmap
 * Structured for clean, authentic, human-written practice files.
 */

export interface RoadmapDay {
  day: number;
  stage: string;
  stageFolder: string;
  topic: string;
  slug: string;
  category: 'Fundamentals' | 'Async JS' | 'Design Patterns' | 'Data Structures' | 'Algorithms' | 'Advanced Architecture';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  description: string;
  files: {
    core: string;
    practical: string;
    tests: string;
  };
}

export const JS_ROADMAP: RoadmapDay[] = [
  {
    day: 1,
    stage: 'Month 1: JavaScript Fundamentals',
    stageFolder: '01-fundamentals',
    topic: 'Execution Context and Scope',
    slug: '01-execution-context-and-scope',
    category: 'Fundamentals',
    difficulty: 'Beginner',
    description: 'Understanding variable scopes, function declarations, and call execution.',
    files: {
      core: `// Testing variable hoisting and function declarations

function greet(name) {
  return \`Hello, \${name}\`;
}

// Function declarations are available anywhere in scope
const message = greet('developer');
console.log(message);

// var is hoisted as undefined, let/const stay in TDZ
var count = 10;
let step = 1;

function increment() {
  count += step;
  return count;
}

console.log('Result:', increment());

module.exports = { greet, increment };
`,
      practical: `// Tracking execution steps using a lightweight call stack helper

class CallStackTracker {
  constructor() {
    this.stack = [];
  }

  // Push context when entering a function
  enter(name) {
    this.stack.push({ name, time: Date.now() });
  }

  // Pop context when leaving
  leave() {
    return this.stack.pop();
  }

  depth() {
    return this.stack.length;
  }
}

const tracker = new CallStackTracker();

function calculate(a, b) {
  tracker.enter('calculate');
  const sum = a + b;
  tracker.leave();
  return sum;
}

console.log('Calculated:', calculate(5, 10));

module.exports = { CallStackTracker, calculate };
`,
      tests: `const assert = require('assert');
const { greet, increment } = require('./01-core.js');
const { CallStackTracker, calculate } = require('./02-practical.js');

// Simple verification
assert.strictEqual(greet('Sam'), 'Hello, Sam');
assert.strictEqual(increment(), 12);
assert.strictEqual(calculate(2, 3), 5);

const tracker = new CallStackTracker();
tracker.enter('test');
assert.strictEqual(tracker.depth(), 1);
tracker.leave();
assert.strictEqual(tracker.depth(), 0);

console.log('All tests passed.');
`
    }
  },
  {
    day: 2,
    stage: 'Month 1: JavaScript Fundamentals',
    stageFolder: '01-fundamentals',
    topic: 'Closures and Private State',
    slug: '02-closures-and-private-state',
    category: 'Fundamentals',
    difficulty: 'Beginner',
    description: 'Encapsulating state using function closures.',
    files: {
      core: `// Closure holding private counter state

function createCounter(initial = 0) {
  let value = initial;

  return {
    add(n = 1) {
      value += n;
      return value;
    },
    sub(n = 1) {
      value -= n;
      return value;
    },
    get() {
      return value;
    }
  };
}

const counter = createCounter(5);
console.log('Counter:', counter.add(3)); // 8

module.exports = { createCounter };
`,
      practical: `// Simple memoize cache using a closure

function memoize(fn) {
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);
    // Return cached result if already computed
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Factorial calculation
const factorial = memoize(function (n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
});

console.log('Factorial 5:', factorial(5));

module.exports = { memoize, factorial };
`,
      tests: `const assert = require('assert');
const { createCounter } = require('./01-core.js');
const { memoize } = require('./02-practical.js');

// Test counter
const c = createCounter(10);
assert.strictEqual(c.add(2), 12);
assert.strictEqual(c.sub(5), 7);
assert.strictEqual(c.get(), 7);

// Test memoize
let runs = 0;
const double = memoize(x => {
  runs++;
  return x * 2;
});

assert.strictEqual(double(4), 8);
assert.strictEqual(double(4), 8);
assert.strictEqual(runs, 1);

console.log('All tests passed.');
`
    }
  },
  {
    day: 3,
    stage: 'Month 1: JavaScript Fundamentals',
    stageFolder: '01-fundamentals',
    topic: 'Prototypes and Inheritance',
    slug: '03-prototypes-and-inheritance',
    category: 'Fundamentals',
    difficulty: 'Intermediate',
    description: 'Working with prototypes and constructor functions.',
    files: {
      core: `// Prototype method sharing

function Task(title, priority) {
  this.title = title;
  this.priority = priority;
  this.completed = false;
}

// Shared method on prototype
Task.prototype.complete = function () {
  this.completed = true;
  return this.title + ' completed';
};

const task1 = new Task('Fix bug', 'high');
console.log(task1.complete());

module.exports = { Task };
`,
      practical: `// Minimal Object.create implementation

function createWithProto(proto) {
  function F() {}
  F.prototype = proto;
  return new F();
}

const baseUser = {
  role: 'member',
  hasAccess() {
    return this.role === 'admin';
  }
};

const admin = createWithProto(baseUser);
admin.role = 'admin';

console.log('Admin access:', admin.hasAccess());

module.exports = { createWithProto };
`,
      tests: `const assert = require('assert');
const { Task } = require('./01-core.js');
const { createWithProto } = require('./02-practical.js');

const t = new Task('Deploy app', 'urgent');
assert.strictEqual(t.completed, false);
t.complete();
assert.strictEqual(t.completed, true);

const proto = { active: true };
const obj = createWithProto(proto);
assert.strictEqual(obj.active, true);

console.log('All tests passed.');
`
    }
  }
];

export function getRoadmapDay(dayIndex: number): RoadmapDay {
  const normalizedIndex = (dayIndex - 1) % JS_ROADMAP.length;
  return JS_ROADMAP[normalizedIndex];
}
