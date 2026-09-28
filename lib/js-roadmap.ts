/**
 * 180-Day JavaScript Mastery Roadmap (From Scratch to Lead Architect)
 * Organized into 6 progressive stages.
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
  // --------------------------------------------------------------------------
  // MONTH 1: CORE JAVASCRIPT & EXECUTION INTERNALS (Days 1 - 30)
  // --------------------------------------------------------------------------
  {
    day: 1,
    stage: 'Month 1: JavaScript Fundamentals & Execution Context',
    stageFolder: '01-fundamentals',
    topic: 'Execution Context, Call Stack & Hoisting Deep Dive',
    slug: '01-execution-context-and-hoisting',
    category: 'Fundamentals',
    difficulty: 'Beginner',
    description: 'Understand how JavaScript engines parse and execute code with creation and execution phases.',
    files: {
      core: `/**
 * Day 01 - Part 1: Execution Context & Hoisting Deep Dive
 * 
 * In JavaScript, code runs inside an Execution Context.
 * Every context has two phases:
 * 1. Creation Phase: Memory allocated for variables (var = undefined, let/const in TDZ), functions hoisted in full.
 * 2. Execution Phase: Code executed line by line, values assigned.
 */

console.log('--- Phase 1: Function vs Variable Hoisting ---');

// Function declarations are hoisted completely with their definitions
console.log('greet():', typeof greet === 'function' ? greet('JavaScript Learner') : 'not found');

function greet(name) {
  return \`Welcome to Day 1 of JS Mastery, \${name}!\`;
}

// 'var' is hoisted as undefined
console.log('hoistedVar before declaration:', hoistedVar); // undefined
var hoistedVar = 'I am initialized now';
console.log('hoistedVar after declaration:', hoistedVar);

// Temporal Dead Zone (TDZ) for let/const
try {
  // @ts-ignore
  console.log(tdzVariable); // ReferenceError
} catch (err) {
  console.log('Caught expected TDZ error for let/const:', err.message);
}
let tdzVariable = 'Declared after TDZ';

module.exports = { greet, hoistedVar, tdzVariable };
`,
      practical: `/**
 * Day 01 - Part 2: Practical Execution Context Inspector
 * Simulates a mini call stack tracker to visualize function execution layers.
 */

class MiniCallStack {
  constructor() {
    this.stack = [];
  }

  enterContext(contextName, scopeVariables = {}) {
    const frame = {
      contextName,
      variables: { ...scopeVariables },
      timestamp: Date.now()
    };
    this.stack.push(frame);
    console.log(\`[Pushed Frame]: Entering \${contextName} (Depth: \${this.stack.length})\`);
    return frame;
  }

  exitContext() {
    const frame = this.stack.pop();
    if (frame) {
      console.log(\`[Popped Frame]: Exited \${frame.contextName} (Depth: \${this.stack.length})\`);
    }
    return frame;
  }

  getCurrentDepth() {
    return this.stack.length;
  }
}

// Practical usage
const callStack = new MiniCallStack();
callStack.enterContext('Global Context');

function calculateTotal(price, taxRate) {
  callStack.enterContext('calculateTotal', { price, taxRate });
  const tax = price * taxRate;
  const total = price + tax;
  callStack.exitContext();
  return total;
}

calculateTotal(100, 0.18);
callStack.exitContext();

module.exports = { MiniCallStack, calculateTotal };
`,
      tests: `/**
 * Day 01 - Part 3: Verification & Unit Tests
 */

const assert = require('assert');
const { greet } = require('./01-core.js');
const { MiniCallStack, calculateTotal } = require('./02-practical.js');

console.log('Running Day 1 Verification Tests...');

// Test 1: Hoisted function returns correct greeting
const greeting = greet('Dev');
assert.strictEqual(greeting, 'Welcome to Day 1 of JS Mastery, Dev!');

// Test 2: Calculate total applies correct computation
const total = calculateTotal(200, 0.10);
assert.strictEqual(total, 220);

// Test 3: Call stack returns to zero after completion
const stack = new MiniCallStack();
stack.enterContext('TestFrame');
assert.strictEqual(stack.getCurrentDepth(), 1);
stack.exitContext();
assert.strictEqual(stack.getCurrentDepth(), 0);

console.log('✅ Day 1 Tests Passed Successfully! (3/3)');
`
    }
  },
  {
    day: 2,
    stage: 'Month 1: JavaScript Fundamentals & Execution Context',
    stageFolder: '01-fundamentals',
    topic: 'Lexical Scope & Closures with Private State Encapsulation',
    slug: '02-closures-and-lexical-scope',
    category: 'Fundamentals',
    difficulty: 'Beginner',
    description: 'Master closures, scope chain lookup, and how to create secure private state without classes.',
    files: {
      core: `/**
 * Day 02 - Part 1: Closures and Lexical Scope
 * 
 * A closure is the combination of a function bundled together (enclosed)
 * with references to its surrounding state (the lexical environment).
 * In JavaScript, closures give inner functions access to an outer function's scope.
 */

function createCounter(initialValue = 0) {
  // Private internal state - inaccessible from outside
  let count = initialValue;
  const history = [];

  return {
    increment(by = 1) {
      count += by;
      history.push({ action: 'increment', by, count });
      return count;
    },
    decrement(by = 1) {
      count -= by;
      history.push({ action: 'decrement', by, count });
      return count;
    },
    getValue() {
      return count;
    },
    getHistory() {
      // Return shallow copy to prevent external mutation
      return [...history];
    }
  };
}

module.exports = { createCounter };
`,
      practical: `/**
 * Day 02 - Part 2: Practical Real-World Closure: Memoize Utility
 * Caches function results using closures without polluting the global scope.
 */

function memoize(fn) {
  const cache = new Map();

  return function memoized(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// Expensive calculation example
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

const fastFactorial = memoize(factorial);

module.exports = { memoize, fastFactorial };
`,
      tests: `/**
 * Day 02 - Part 3: Verification & Edge Case Tests
 */

const assert = require('assert');
const { createCounter } = require('./01-core.js');
const { memoize } = require('./02-practical.js');

console.log('Running Day 2 Verification Tests...');

// Test 1: Counter maintains state
const counter = createCounter(10);
assert.strictEqual(counter.increment(5), 15);
assert.strictEqual(counter.decrement(3), 12);
assert.strictEqual(counter.getValue(), 12);

// Test 2: Memoize caches identical arguments
let callCount = 0;
const add = memoize((a, b) => {
  callCount++;
  return a + b;
});

assert.strictEqual(add(2, 3), 5);
assert.strictEqual(add(2, 3), 5); // From cache
assert.strictEqual(callCount, 1, 'Function should only be called once for same arguments');

console.log('✅ Day 2 Tests Passed Successfully! (2/2)');
`
    }
  },
  {
    day: 3,
    stage: 'Month 1: JavaScript Fundamentals & Execution Context',
    stageFolder: '01-fundamentals',
    topic: 'Prototypes, Prototype Chain and Inheritance Internals',
    slug: '03-prototypes-and-prototype-chain',
    category: 'Fundamentals',
    difficulty: 'Intermediate',
    description: 'How prototypal inheritance actually works in JavaScript under the syntactic sugar of classes.',
    files: {
      core: `/**
 * Day 03 - Part 1: Prototypes & Prototype Chain
 * Every JavaScript object has a private property which holds a link to another object called its prototype.
 */

function Vehicle(make, model, year) {
  this.make = make;
  this.model = model;
  this.year = year;
}

// Methods added to Vehicle.prototype are shared across all instances
Vehicle.prototype.getInfo = function() {
  return \`\${this.year} \${this.make} \${this.model}\`;
};

// Prototypal Inheritance
function ElectricCar(make, model, year, batteryRange) {
  Vehicle.call(this, make, model, year); // Call super constructor
  this.batteryRange = batteryRange;
}

// Inherit prototype methods
ElectricCar.prototype = Object.create(Vehicle.prototype);
ElectricCar.prototype.constructor = ElectricCar;

ElectricCar.prototype.charge = function() {
  return \`Charging \${this.model} to \${this.batteryRange} miles range\`;
};

module.exports = { Vehicle, ElectricCar };
`,
      practical: `/**
 * Day 03 - Part 2: Custom 'Object.create' Polyfill
 * Understanding how Object.create links prototypes under the hood.
 */

function customObjectCreate(proto, propertiesObject) {
  if (typeof proto !== 'object' && typeof proto !== 'function') {
    throw new TypeError('Object prototype may only be an Object or null');
  }

  function F() {}
  F.prototype = proto;
  const obj = new F();

  if (propertiesObject !== undefined) {
    Object.defineProperties(obj, propertiesObject);
  }

  return obj;
}

module.exports = { customObjectCreate };
`,
      tests: `/**
 * Day 03 - Part 3: Verification & Prototype Chain Inspection Tests
 */

const assert = require('assert');
const { Vehicle, ElectricCar } = require('./01-core.js');
const { customObjectCreate } = require('./02-practical.js');

console.log('Running Day 3 Verification Tests...');

const tesla = new ElectricCar('Tesla', 'Model 3', 2024, 350);
assert.strictEqual(tesla.getInfo(), '2024 Tesla Model 3');
assert.strictEqual(tesla.charge(), 'Charging Model 3 to 350 miles range');

// Inspect prototype chain
assert.strictEqual(tesla instanceof ElectricCar, true);
assert.strictEqual(tesla instanceof Vehicle, true);
assert.strictEqual(tesla instanceof Object, true);

// Test custom Object.create
const base = { role: 'engineer' };
const dev = customObjectCreate(base);
assert.strictEqual(dev.role, 'engineer');
assert.strictEqual(Object.getPrototypeOf(dev), base);

console.log('✅ Day 3 Tests Passed Successfully! (3/3)');
`
    }
  },
  {
    day: 4,
    stage: 'Month 1: JavaScript Fundamentals & Execution Context',
    stageFolder: '01-fundamentals',
    topic: 'The "this" Keyword: Call, Apply, and Bind Polyfills from Scratch',
    slug: '04-this-keyword-and-bind-polyfills',
    category: 'Fundamentals',
    difficulty: 'Intermediate',
    description: 'Master the 4 rules of "this" binding (default, implicit, explicit, new) and build polyfills.',
    files: {
      core: `/**
 * Day 04 - Part 1: The 'this' Keyword Rules & Explicit Binding
 * 
 * Rules of 'this':
 * 1. Default Binding: window / global (or undefined in strict mode)
 * 2. Implicit Binding: The object before the dot (obj.method())
 * 3. Explicit Binding: call, apply, bind
 * 4. 'new' Binding: Points to the freshly instantiated object
 */

const developer = {
  name: 'Divya',
  level: 'Full Stack Engineer',
  describe(greeting = 'Hello') {
    return \`\${greeting}, I am \${this.name}, a \${this.level}\`;
  }
};

const guest = {
  name: 'Alex',
  level: 'Frontend Developer'
};

module.exports = { developer, guest };
`,
      practical: `/**
 * Day 04 - Part 2: Custom Function.prototype.myBind Polyfill
 * How bind creates a permanent closure around context and pre-set arguments.
 */

function customBind(fn, context, ...boundArgs) {
  if (typeof fn !== 'function') {
    throw new TypeError('Must be called on a function');
  }

  return function boundFunction(...callArgs) {
    const isNew = this instanceof boundFunction;
    const effectiveContext = isNew ? this : context;
    return fn.apply(effectiveContext, [...boundArgs, ...callArgs]);
  };
}

module.exports = { customBind };
`,
      tests: `/**
 * Day 04 - Part 3: Verification & Bind Polyfill Tests
 */

const assert = require('assert');
const { developer, guest } = require('./01-core.js');
const { customBind } = require('./02-practical.js');

console.log('Running Day 4 Verification Tests...');

// Test 1: Implicit binding
assert.strictEqual(developer.describe('Hi'), 'Hi, I am Divya, a Full Stack Engineer');

// Test 2: Custom bind with explicit context
const boundDescribe = customBind(developer.describe, guest, 'Hey');
assert.strictEqual(boundDescribe(), 'Hey, I am Alex, a Frontend Developer');

console.log('✅ Day 4 Tests Passed Successfully! (2/2)');
`
    }
  },
  {
    day: 5,
    stage: 'Month 1: JavaScript Fundamentals & Execution Context',
    stageFolder: '01-fundamentals',
    topic: 'Array Methods Under the Hood: Map, Filter, Reduce Polyfills',
    slug: '05-array-methods-polyfills',
    category: 'Fundamentals',
    difficulty: 'Intermediate',
    description: 'Implement Array.prototype.map, filter, and reduce from scratch with full edge cases.',
    files: {
      core: `/**
 * Day 05 - Part 1: Functional Array Polyfills
 */

function myMap(array, callback, thisArg) {
  if (!Array.isArray(array)) throw new TypeError('Expected an array');
  const result = new Array(array.length);
  for (let i = 0; i < array.length; i++) {
    if (i in array) {
      result[i] = callback.call(thisArg, array[i], i, array);
    }
  }
  return result;
}

function myFilter(array, callback, thisArg) {
  if (!Array.isArray(array)) throw new TypeError('Expected an array');
  const result = [];
  for (let i = 0; i < array.length; i++) {
    if (i in array && callback.call(thisArg, array[i], i, array)) {
      result.push(array[i]);
    }
  }
  return result;
}

function myReduce(array, callback, initialValue) {
  if (!Array.isArray(array)) throw new TypeError('Expected an array');
  let accumulator = initialValue;
  let startIndex = 0;

  if (initialValue === undefined) {
    if (array.length === 0) throw new TypeError('Reduce of empty array with no initial value');
    accumulator = array[0];
    startIndex = 1;
  }

  for (let i = startIndex; i < array.length; i++) {
    if (i in array) {
      accumulator = callback(accumulator, array[i], i, array);
    }
  }

  return accumulator;
}

module.exports = { myMap, myFilter, myReduce };
`,
      practical: `/**
 * Day 05 - Part 2: Real-World Data Pipeline using Reduce
 * Grouping, summing, and indexing arrays like an SQL GROUP BY operation.
 */

function groupBy(array, keySelector) {
  return array.reduce((acc, item) => {
    const key = typeof keySelector === 'function' ? keySelector(item) : item[keySelector];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}

module.exports = { groupBy };
`,
      tests: `/**
 * Day 05 - Part 3: Verification & Array Polyfill Tests
 */

const assert = require('assert');
const { myMap, myFilter, myReduce } = require('./01-core.js');
const { groupBy } = require('./02-practical.js');

console.log('Running Day 5 Verification Tests...');

const nums = [1, 2, 3, 4, 5];

assert.deepStrictEqual(myMap(nums, n => n * 2), [2, 4, 6, 8, 10]);
assert.deepStrictEqual(myFilter(nums, n => n % 2 === 0), [2, 4]);
assert.strictEqual(myReduce(nums, (acc, n) => acc + n, 0), 15);

// Test groupBy
const users = [
  { name: 'Alice', dept: 'Engineering' },
  { name: 'Bob', dept: 'Design' },
  { name: 'Charlie', dept: 'Engineering' }
];

const grouped = groupBy(users, 'dept');
assert.strictEqual(grouped['Engineering'].length, 2);
assert.strictEqual(grouped['Design'].length, 1);

console.log('✅ Day 5 Tests Passed Successfully! (4/4)');
`
    }
  }
];

/**
 * Returns the day item for a given 1-based day index or calculates based on start date.
 */
export function getRoadmapDay(dayIndex: number): RoadmapDay {
  const normalizedIndex = (dayIndex - 1) % JS_ROADMAP.length;
  return JS_ROADMAP[normalizedIndex];
}
