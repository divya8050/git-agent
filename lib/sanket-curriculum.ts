/**
 * Sanket's 200-Day Engineering Curriculum
 * Covers: System Design · Full-Stack Engineering · Testing · DevOps
 * Level: Intermediate → Advanced → Expert
 */

export interface SanketTopic {
  id: string;
  title: string;
  category:
    | 'System Design'
    | 'Full-Stack'
    | 'TypeScript'
    | 'Testing'
    | 'DevOps'
    | 'Databases'
    | 'Security'
    | 'Performance';
  difficulty: 'Intermediate' | 'Advanced' | 'Expert';
  folder: string; // top-level directory in the repo
  slug: string;
  files: {
    /** Primary implementation/notes file (TypeScript or Markdown) */
    main: string;
    /** Secondary file: tests, schemas, docker compose, diagrams etc. */
    secondary: string;
  };
  commitMessages: [string, string]; // [main commit, secondary commit]
}

export const SANKET_CURRICULUM: SanketTopic[] = [
  // ─────────────────────────────────────────────────────────────
  // SYSTEM DESIGN
  // ─────────────────────────────────────────────────────────────
  {
    id: 'cap-theorem',
    title: 'CAP Theorem Deep Dive',
    category: 'System Design',
    difficulty: 'Intermediate',
    folder: 'system-design',
    slug: 'cap-theorem',
    files: {
      main: `# CAP Theorem

The CAP theorem states that a distributed system can only guarantee two of three properties simultaneously:

- **Consistency (C)** – Every read returns the most recent write or an error.
- **Availability (A)** – Every request receives a non-error response (not necessarily the most recent data).
- **Partition Tolerance (P)** – The system continues operating despite arbitrary message drops between nodes.

## Why Partition Tolerance Is Non-Negotiable

In any real-world distributed system, network partitions *will* happen. A dropped packet, a flaky switch, or a data-center failover can split nodes. Choosing to sacrifice P means choosing a single-node system, which is not "distributed" at all.

The real trade-off is **CP vs. AP**:

| System | Choice | Example |
|--------|--------|---------|
| HBase, Zookeeper | CP | Returns error during partition |
| Cassandra, DynamoDB | AP | Returns stale data during partition |
| PostgreSQL (single) | CA | Not partition-tolerant by design |

## Practical Implications

\`\`\`
Scenario: Two nodes A and B get partitioned.
- CP system: A refuses writes → strong consistency preserved
- AP system: A accepts writes → eventual consistency, possible conflicts
\`\`\`

## PACELC Extension

CAP only covers partition behaviour. PACELC extends this:

> If partitioned (P): choose A or C.
> Else (E): choose Latency (L) or Consistency (C).

DynamoDB is PA/EL — prefers availability and low latency over strong consistency everywhere.

## When to Choose What

- **Banking, ledgers, inventory** → CP (strong consistency is worth the latency)
- **Social feeds, caches, shopping carts** → AP (availability wins, eventual consistency is fine)
- **Collaborative editors** → AP with conflict resolution (CRDT/OT)
`,
      secondary: `import { strict as assert } from 'assert';

// Simulates CP vs AP behavior under a network partition
interface Node {
  id: string;
  data: Map<string, string>;
  isOnline: boolean;
}

class CPCluster {
  private nodes: Node[];
  private partitioned = false;

  constructor(nodeCount: number) {
    this.nodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: \`node-\${i}\`,
      data: new Map(),
      isOnline: true,
    }));
  }

  partition() {
    this.partitioned = true;
  }

  write(key: string, value: string): boolean {
    // CP: refuse writes during partition (quorum not reachable)
    if (this.partitioned) {
      console.log('[CP] Partition detected — write rejected to preserve consistency');
      return false;
    }
    this.nodes.forEach(n => n.data.set(key, value));
    return true;
  }

  read(key: string): string | undefined {
    if (this.partitioned) {
      throw new Error('[CP] Partition detected — read rejected');
    }
    return this.nodes[0].data.get(key);
  }
}

class APCluster {
  private nodes: Node[];
  private partitioned = false;

  constructor(nodeCount: number) {
    this.nodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: \`node-\${i}\`,
      data: new Map(),
      isOnline: true,
    }));
  }

  partition() {
    this.partitioned = true;
    // AP: disconnect node 1+ from node 0 (simulate split-brain)
    this.nodes.slice(1).forEach(n => (n.isOnline = false));
  }

  write(key: string, value: string): boolean {
    // AP: write to whichever nodes are reachable
    const reachable = this.nodes.filter(n => n.isOnline);
    reachable.forEach(n => n.data.set(key, value));
    console.log(\`[AP] Wrote to \${reachable.length}/\${this.nodes.length} nodes (partition-tolerant)\`);
    return true; // always succeeds
  }

  read(key: string): string | undefined {
    // Return stale data from first available node
    return this.nodes[0].data.get(key);
  }
}

// Tests
const cp = new CPCluster(3);
cp.write('user:1', 'Alice');
assert.equal(cp.read('user:1'), 'Alice');

cp.partition();
assert.equal(cp.write('user:2', 'Bob'), false, 'CP must reject writes during partition');

const ap = new APCluster(3);
ap.write('user:1', 'Alice');
ap.partition();
assert.equal(ap.write('user:2', 'Bob'), true, 'AP must accept writes during partition');

console.log('CAP theorem simulation tests passed');
`,
    },
    commitMessages: ['add cap theorem notes and trade-off analysis', 'add cp vs ap cluster simulation with tests'],
  },
  {
    id: 'consistent-hashing',
    title: 'Consistent Hashing for Distributed Systems',
    category: 'System Design',
    difficulty: 'Advanced',
    folder: 'system-design',
    slug: 'consistent-hashing',
    files: {
      main: `import * as crypto from 'crypto';

// Consistent hashing ring with virtual nodes
// Used in: Cassandra, DynamoDB, Memcached, CDN routing

interface RingNode {
  id: string;
  virtualKey: number; // position on ring [0, 2^32)
}

export class ConsistentHashRing {
  private ring: RingNode[] = [];
  private nodeMap = new Map<string, string[]>(); // nodeName -> virtualKeys
  private readonly virtualNodeCount: number;

  constructor(virtualNodes = 150) {
    this.virtualNodeCount = virtualNodes;
  }

  private hash(key: string): number {
    const buf = crypto.createHash('md5').update(key).digest();
    return buf.readUInt32BE(0);
  }

  addNode(name: string): void {
    const virtualKeys: string[] = [];
    for (let i = 0; i < this.virtualNodeCount; i++) {
      const virtualKey = \`\${name}:vn\${i}\`;
      virtualKeys.push(virtualKey);
      this.ring.push({ id: name, virtualKey: this.hash(virtualKey) });
    }
    this.nodeMap.set(name, virtualKeys);
    this.ring.sort((a, b) => a.virtualKey - b.virtualKey);
  }

  removeNode(name: string): void {
    const keys = this.nodeMap.get(name) || [];
    const keySet = new Set(keys.map(k => this.hash(k)));
    this.ring = this.ring.filter(n => !keySet.has(n.virtualKey));
    this.nodeMap.delete(name);
  }

  getNode(key: string): string | null {
    if (this.ring.length === 0) return null;
    const h = this.hash(key);
    // Binary search for first node with virtualKey >= h
    let lo = 0, hi = this.ring.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.ring[mid].virtualKey < h) lo = mid + 1;
      else hi = mid;
    }
    // Wrap around if h is past the last node
    if (this.ring[lo].virtualKey < h) lo = 0;
    return this.ring[lo].id;
  }

  // Returns the distribution of keys across nodes
  distribution(sampleKeys: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const key of sampleKeys) {
      const node = this.getNode(key) ?? 'none';
      counts.set(node, (counts.get(node) ?? 0) + 1);
    }
    return counts;
  }
}
`,
      secondary: `import { strict as assert } from 'assert';
import { ConsistentHashRing } from './consistent-hashing';

const ring = new ConsistentHashRing(150);

ring.addNode('server-a');
ring.addNode('server-b');
ring.addNode('server-c');

// All keys must route to one of the three nodes
const testKeys = Array.from({ length: 1000 }, (_, i) => \`key:\${i}\`);
const dist = ring.distribution(testKeys);
console.log('Initial distribution:', Object.fromEntries(dist));

// No key should route to a non-existent node
for (const [, node] of [...dist]) {
  assert(['server-a', 'server-b', 'server-c'].includes(node as unknown as string));
}

// After removing a node, previously assigned keys only move to adjacent nodes
const snapshot = new Map(testKeys.map(k => [k, ring.getNode(k)]));
ring.removeNode('server-b');

let remapped = 0;
for (const [key, oldNode] of snapshot) {
  const newNode = ring.getNode(key);
  if (newNode !== oldNode) remapped++;
}
// Expect roughly 1/3 of keys to be remapped (only those that were on server-b)
const remapRatio = remapped / testKeys.length;
assert(remapRatio < 0.45, \`Too many keys remapped: \${(remapRatio * 100).toFixed(1)}%\`);
console.log(\`Keys remapped after removing server-b: \${(remapRatio * 100).toFixed(1)}%\`);
console.log('Consistent hashing tests passed');
`,
    },
    commitMessages: [
      'implement consistent hash ring with virtual nodes',
      'add distribution and remapping tests for consistent hashing',
    ],
  },
  {
    id: 'rate-limiter-sliding-window',
    title: 'Sliding Window Rate Limiter',
    category: 'System Design',
    difficulty: 'Advanced',
    folder: 'system-design',
    slug: 'rate-limiter-sliding-window',
    files: {
      main: `/**
 * Sliding Window Counter Rate Limiter
 *
 * More accurate than fixed-window: prevents burst at window boundaries.
 * Redis ZSET-based design (simulated in-memory here).
 */
export class SlidingWindowRateLimiter {
  // userId -> sorted list of request timestamps (ms)
  private readonly store = new Map<string, number[]>();
  private readonly limitPerWindow: number;
  private readonly windowMs: number;

  constructor(limitPerWindow: number, windowMs: number) {
    this.limitPerWindow = limitPerWindow;
    this.windowMs = windowMs;
  }

  isAllowed(userId: string, nowMs = Date.now()): boolean {
    const windowStart = nowMs - this.windowMs;
    const timestamps = (this.store.get(userId) ?? []).filter(t => t > windowStart);

    if (timestamps.length >= this.limitPerWindow) {
      this.store.set(userId, timestamps);
      return false;
    }

    timestamps.push(nowMs);
    this.store.set(userId, timestamps);
    return true;
  }

  remaining(userId: string, nowMs = Date.now()): number {
    const windowStart = nowMs - this.windowMs;
    const active = (this.store.get(userId) ?? []).filter(t => t > windowStart);
    return Math.max(0, this.limitPerWindow - active.length);
  }

  retryAfterMs(userId: string, nowMs = Date.now()): number {
    const windowStart = nowMs - this.windowMs;
    const active = (this.store.get(userId) ?? []).filter(t => t > windowStart).sort((a, b) => a - b);
    if (active.length < this.limitPerWindow) return 0;
    // When oldest request expires, a slot opens up
    return active[0] + this.windowMs - nowMs;
  }
}
`,
      secondary: `import { strict as assert } from 'assert';
import { SlidingWindowRateLimiter } from './rate-limiter-sliding-window';

const WINDOW_MS = 60_000; // 1 minute
const LIMIT = 5;
const limiter = new SlidingWindowRateLimiter(LIMIT, WINDOW_MS);

let t = Date.now();

// First 5 requests should pass
for (let i = 0; i < LIMIT; i++) {
  assert(limiter.isAllowed('user:1', t + i * 100), \`Request \${i + 1} should be allowed\`);
}

// 6th should be denied
assert(!limiter.isAllowed('user:1', t + 600), '6th request must be rate limited');
assert.equal(limiter.remaining('user:1', t + 600), 0);

const retryMs = limiter.retryAfterMs('user:1', t + 600);
assert(retryMs > 0, 'retryAfter must be positive when rate limited');
console.log(\`Retry after: \${retryMs}ms\`);

// After the window passes, requests should be allowed again
t += WINDOW_MS + 1000;
assert(limiter.isAllowed('user:1', t), 'Should allow after window expires');

// Different user is independent
assert(limiter.isAllowed('user:2', Date.now()), 'Different user should not be rate limited');

console.log('Sliding window rate limiter tests passed');
`,
    },
    commitMessages: [
      'implement sliding window counter rate limiter',
      'add rate limiter tests including retry-after and isolation',
    ],
  },
  {
    id: 'database-sharding-strategies',
    title: 'Database Sharding Strategies',
    category: 'System Design',
    difficulty: 'Advanced',
    folder: 'system-design',
    slug: 'database-sharding',
    files: {
      main: `# Database Sharding Strategies

Sharding partitions a large dataset across multiple database instances (shards), each holding a subset of data. This enables horizontal scaling beyond what a single node can handle.

## Sharding Strategies

### 1. Range-Based Sharding

Assign rows to shards based on key ranges.

\`\`\`
Shard A: user_id 1 – 1,000,000
Shard B: user_id 1,000,001 – 2,000,000
Shard C: user_id 2,000,001 – ...
\`\`\`

**Pros:** Simple routing, efficient range queries.
**Cons:** Hot spots if keys are sequential (all new users go to the last shard).

### 2. Hash-Based Sharding

\`shard_id = hash(user_id) % num_shards\`

**Pros:** Even distribution, no hot spots.
**Cons:** Range queries require scatter-gather across all shards. Resharding is expensive.

### 3. Directory-Based Sharding

A lookup table (directory service) maps keys to shard IDs.

**Pros:** Flexible, easy to move individual keys between shards.
**Cons:** Directory is a single point of failure unless replicated. Adds a lookup hop.

### 4. Geo-Based Sharding

Route data by geography (EU users → EU shard, US users → US shard).

**Pros:** Latency reduction, compliance with data-residency laws (GDPR).
**Cons:** Uneven load if user populations are imbalanced.

## Cross-Shard Challenges

| Problem | Solution |
|---------|----------|
| Cross-shard joins | Denormalize, or use application-level joins |
| Cross-shard transactions | 2PC, Saga pattern, or avoid entirely |
| Global unique IDs | Snowflake IDs, ULIDs, or a central ID service |
| Re-sharding | Consistent hashing (only ~1/N keys move) |

## Resharding Without Downtime

1. Add new shard.
2. Double-write to old + new shards.
3. Backfill old data to new shard.
4. Switch reads to new shard.
5. Stop writes to old shard.

## Snowflake ID Structure (64-bit)

\`\`\`
| sign (1b) | timestamp (41b) | datacenter (5b) | worker (5b) | sequence (12b) |
\`\`\`

Generates ~4096 unique IDs/ms per worker without coordination.
`,
      secondary: `// Snowflake ID generator — shard-safe unique ID without a central coordinator
// Used by Twitter, Discord, Instagram

export class SnowflakeIdGenerator {
  private readonly epoch: bigint;
  private readonly datacenterId: bigint;
  private readonly workerId: bigint;
  private sequence = 0n;
  private lastTimestamp = -1n;

  constructor(datacenterId: number, workerId: number, epoch = 1_700_000_000_000) {
    if (datacenterId > 31 || datacenterId < 0) throw new Error('datacenterId must be 0-31');
    if (workerId > 31 || workerId < 0) throw new Error('workerId must be 0-31');
    this.epoch = BigInt(epoch);
    this.datacenterId = BigInt(datacenterId);
    this.workerId = BigInt(workerId);
  }

  private currentMs(): bigint {
    return BigInt(Date.now());
  }

  nextId(): bigint {
    let ts = this.currentMs() - this.epoch;
    if (ts < this.lastTimestamp) {
      throw new Error('Clock moved backwards — cannot generate ID');
    }
    if (ts === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & 0xFFFn; // 12 bits
      if (this.sequence === 0n) {
        // Sequence overflow — wait for next ms
        while (ts <= this.lastTimestamp) {
          ts = this.currentMs() - this.epoch;
        }
      }
    } else {
      this.sequence = 0n;
    }
    this.lastTimestamp = ts;
    return (ts << 22n) | (this.datacenterId << 17n) | (this.workerId << 12n) | this.sequence;
  }
}

// Quick test
const gen = new SnowflakeIdGenerator(1, 1);
const ids = Array.from({ length: 10 }, () => gen.nextId());
const unique = new Set(ids.map(String));
console.assert(unique.size === ids.length, 'All generated IDs must be unique');
console.log('Generated IDs (sample):', ids.slice(0, 3).map(String));
console.log('Snowflake ID generator tests passed');
`,
    },
    commitMessages: [
      'add sharding strategies notes with trade-off analysis',
      'implement snowflake id generator for shard-safe unique ids',
    ],
  },
  {
    id: 'event-driven-architecture',
    title: 'Event-Driven Architecture with Message Queues',
    category: 'System Design',
    difficulty: 'Advanced',
    folder: 'system-design',
    slug: 'event-driven-architecture',
    files: {
      main: `# Event-Driven Architecture

In event-driven systems, services communicate via events published to a broker (Kafka, RabbitMQ, SQS) rather than direct API calls.

## Core Concepts

### Events vs Commands vs Queries

| Type | Direction | Example |
|------|-----------|---------|
| Command | Sender → Receiver (one target) | \`PlaceOrder\` |
| Event | Publisher → Any interested party | \`OrderPlaced\` |
| Query | Requester → Responder | \`GetOrderStatus\` |

### Broker Patterns

**Point-to-Point (Queue):** Single consumer processes each message. Good for task distribution.
**Pub/Sub (Topic):** Multiple consumers receive each message independently. Good for fan-out.

## Kafka Architecture

\`\`\`
Producer → Topic (Partitioned) → Consumer Group
                ↓
         Partition 0 → Consumer A
         Partition 1 → Consumer B
         Partition 2 → Consumer A
\`\`\`

- **Partition key** determines which partition a message goes to (ensures ordering per key)
- **Consumer groups** enable parallel consumption with each partition assigned to one consumer
- Messages are retained for a configurable duration (replayed if needed)

## Outbox Pattern (Guaranteed Delivery)

Problem: Writing to DB and publishing to Kafka in the same operation is not atomic.

Solution:
1. Write event to an \`outbox\` table in the same DB transaction as the business data.
2. A poller/CDC reads the outbox table and publishes to Kafka.
3. Mark events as published.

This guarantees at-least-once delivery without distributed transactions.

## Dead Letter Queue (DLQ)

If a consumer fails to process a message N times, the message is moved to a DLQ for inspection and manual replay.

## Idempotent Consumers

Since message queues guarantee at-least-once delivery (not exactly-once), consumers must be idempotent:

\`\`\`typescript
async function handleOrderPlaced(event: OrderPlacedEvent) {
  const alreadyProcessed = await db.events.findOne({ eventId: event.id });
  if (alreadyProcessed) return; // deduplicate

  await db.orders.update({ id: event.orderId, status: 'confirmed' });
  await db.events.insert({ eventId: event.id, processedAt: new Date() });
}
\`\`\`
`,
      secondary: `// In-memory event bus simulating a message queue with consumer groups

type Handler<T> = (message: T) => Promise<void>;

interface QueuedMessage<T> {
  id: string;
  payload: T;
  attempts: number;
  publishedAt: Date;
}

export class InMemoryMessageQueue<T> {
  private queue: QueuedMessage<T>[] = [];
  private dlq: QueuedMessage<T>[] = [];
  private processedIds = new Set<string>();
  private readonly maxAttempts: number;

  constructor(maxAttempts = 3) {
    this.maxAttempts = maxAttempts;
  }

  publish(id: string, payload: T): void {
    this.queue.push({ id, payload, attempts: 0, publishedAt: new Date() });
  }

  async consume(handler: Handler<T>): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    while (this.queue.length > 0) {
      const msg = this.queue.shift()!;

      // Idempotency check
      if (this.processedIds.has(msg.id)) {
        console.log(\`[Queue] Skipping duplicate message \${msg.id}\`);
        continue;
      }

      try {
        await handler(msg.payload);
        this.processedIds.add(msg.id);
        processed++;
      } catch (err) {
        msg.attempts++;
        if (msg.attempts < this.maxAttempts) {
          this.queue.push(msg); // re-queue
        } else {
          this.dlq.push(msg);
          failed++;
          console.warn(\`[Queue] Message \${msg.id} moved to DLQ after \${msg.attempts} attempts\`);
        }
      }
    }
    return { processed, failed };
  }

  getDlq(): QueuedMessage<T>[] {
    return [...this.dlq];
  }
}

// Test
async function runTest() {
  const queue = new InMemoryMessageQueue<{ orderId: string }>(3);

  queue.publish('evt-1', { orderId: 'order-100' });
  queue.publish('evt-2', { orderId: 'order-101' });
  queue.publish('evt-1', { orderId: 'order-100' }); // duplicate

  let callCount = 0;
  const result = await queue.consume(async (msg) => {
    callCount++;
    if (msg.orderId === 'order-101' && callCount === 2) {
      throw new Error('Simulated transient failure');
    }
  });

  console.log('Processed:', result.processed, '| Failed:', result.failed);
  console.log('DLQ length:', queue.getDlq().length);
  console.log('Event-driven queue tests passed');
}

runTest().catch(console.error);
`,
    },
    commitMessages: [
      'add event-driven architecture notes with outbox and dlq patterns',
      'implement in-memory message queue with idempotency and dlq',
    ],
  },
  {
    id: 'load-balancing-algorithms',
    title: 'Load Balancing Algorithms',
    category: 'System Design',
    difficulty: 'Intermediate',
    folder: 'system-design',
    slug: 'load-balancing',
    files: {
      main: `// Load balancing algorithm implementations
// Used by: Nginx, HAProxy, AWS ALB, Envoy

export interface BackendServer {
  id: string;
  weight: number;
  activeConnections: number;
  isHealthy: boolean;
}

// Round Robin — simple cyclic distribution
export class RoundRobinBalancer {
  private index = 0;

  select(servers: BackendServer[]): BackendServer | null {
    const healthy = servers.filter(s => s.isHealthy);
    if (healthy.length === 0) return null;
    const server = healthy[this.index % healthy.length];
    this.index = (this.index + 1) % healthy.length;
    return server;
  }
}

// Weighted Round Robin — favours higher-capacity servers
export class WeightedRoundRobinBalancer {
  private currentWeights: Map<string, number> = new Map();

  select(servers: BackendServer[]): BackendServer | null {
    const healthy = servers.filter(s => s.isHealthy);
    if (healthy.length === 0) return null;

    for (const s of healthy) {
      this.currentWeights.set(s.id, (this.currentWeights.get(s.id) ?? 0) + s.weight);
    }

    let best: BackendServer | null = null;
    let bestWeight = -Infinity;
    for (const s of healthy) {
      const w = this.currentWeights.get(s.id) ?? 0;
      if (w > bestWeight) { bestWeight = w; best = s; }
    }

    if (best) {
      const totalWeight = healthy.reduce((sum, s) => sum + s.weight, 0);
      this.currentWeights.set(best.id, (this.currentWeights.get(best.id) ?? 0) - totalWeight);
    }
    return best;
  }
}

// Least Connections — routes to server with fewest active connections
export class LeastConnectionsBalancer {
  select(servers: BackendServer[]): BackendServer | null {
    const healthy = servers.filter(s => s.isHealthy);
    if (healthy.length === 0) return null;
    return healthy.reduce((min, s) => s.activeConnections < min.activeConnections ? s : min);
  }
}

// IP Hash — ensures same client always hits the same server (sticky sessions)
export class IpHashBalancer {
  private simpleHash(ip: string): number {
    return ip.split('.').reduce((acc, octet) => acc * 31 + parseInt(octet, 10), 0);
  }

  select(servers: BackendServer[], clientIp: string): BackendServer | null {
    const healthy = servers.filter(s => s.isHealthy);
    if (healthy.length === 0) return null;
    const index = Math.abs(this.simpleHash(clientIp)) % healthy.length;
    return healthy[index];
  }
}
`,
      secondary: `import { strict as assert } from 'assert';
import {
  RoundRobinBalancer,
  WeightedRoundRobinBalancer,
  LeastConnectionsBalancer,
  IpHashBalancer,
  BackendServer,
} from './load-balancing';

const servers: BackendServer[] = [
  { id: 'a', weight: 1, activeConnections: 5, isHealthy: true },
  { id: 'b', weight: 3, activeConnections: 2, isHealthy: true },
  { id: 'c', weight: 1, activeConnections: 8, isHealthy: false },
];

// Round Robin only picks healthy servers
const rr = new RoundRobinBalancer();
const rrResults = Array.from({ length: 4 }, () => rr.select(servers)!.id);
assert(rrResults.every(id => id !== 'c'), 'Round robin must skip unhealthy servers');

// Weighted Round Robin — server B (weight 3) should be picked more often
const wrr = new WeightedRoundRobinBalancer();
const wrrResults = Array.from({ length: 10 }, () => wrr.select(servers)!.id);
const bCount = wrrResults.filter(id => id === 'b').length;
assert(bCount > 3, \`Weighted RR should favour server B, got \${bCount}/10\`);

// Least Connections picks B (fewest connections = 2)
const lc = new LeastConnectionsBalancer();
assert.equal(lc.select(servers)!.id, 'b');

// IP Hash — same IP always routes to the same server
const ipHash = new IpHashBalancer();
const ip = '192.168.1.42';
const firstPick = ipHash.select(servers, ip)!.id;
for (let i = 0; i < 5; i++) {
  assert.equal(ipHash.select(servers, ip)!.id, firstPick, 'IP hash must be sticky');
}

console.log('All load balancing algorithm tests passed');
`,
    },
    commitMessages: [
      'implement round-robin, weighted, least-connections and ip-hash balancers',
      'add load balancer selection tests with health check verification',
    ],
  },
  {
    id: 'caching-strategies',
    title: 'Caching Strategies: Cache-Aside, Write-Through, Write-Behind',
    category: 'System Design',
    difficulty: 'Advanced',
    folder: 'system-design',
    slug: 'caching-strategies',
    files: {
      main: `# Caching Strategies

## Cache-Aside (Lazy Loading)

Application checks cache first. On a miss, loads from DB and populates cache.

\`\`\`
read(key):
  if cache.has(key): return cache.get(key)
  value = db.get(key)
  cache.set(key, value, ttl)
  return value

write(key, value):
  db.set(key, value)
  cache.delete(key)  // invalidate — don't write directly
\`\`\`

**Pros:** Cache only stores what's actually read. DB is always source of truth.
**Cons:** Cache miss penalty (read from DB + write to cache). Stale data window possible.

## Write-Through

Every write goes to cache AND DB synchronously.

\`\`\`
write(key, value):
  cache.set(key, value)
  db.set(key, value)
\`\`\`

**Pros:** Cache is always fresh. Reads are fast.
**Cons:** Write latency is higher. Cache may hold rarely-read data (wasted space).

## Write-Behind (Write-Back)

Write to cache immediately; asynchronously flush to DB.

\`\`\`
write(key, value):
  cache.set(key, value, dirty=true)
  // Background worker flushes dirty keys to DB periodically
\`\`\`

**Pros:** Extremely fast writes. DB load reduced.
**Cons:** Data loss risk if cache fails before flush. Complexity of dirty-key tracking.

## Read-Through

Cache itself is responsible for loading from DB on a miss (not the application).
Useful with managed caches (e.g. Redis with read-through plugins).

## Cache Eviction Policies

| Policy | Evicts | Best For |
|--------|--------|----------|
| LRU | Least recently used | General purpose |
| LFU | Least frequently used | Popularity-skewed workloads |
| FIFO | Oldest inserted | Simple, predictable |
| TTL | Expired entries | Time-sensitive data |

## Cache Stampede / Thundering Herd

When a hot key expires, hundreds of requests simultaneously miss the cache and hit the DB.

**Fix:** Probabilistic early expiration (PER) or locking (only one request refreshes, others wait).
`,
      secondary: `// Cache-Aside implementation with TTL and stampede protection

type DbFetcher<T> = (key: string) => Promise<T | null>;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheAsideStore<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private inflightRefreshes = new Map<string, Promise<T | null>>();
  private readonly defaultTtlMs: number;

  constructor(defaultTtlMs = 60_000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  async get(key: string, fetcher: DbFetcher<T>, ttlMs?: number): Promise<T | null> {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value; // cache hit
    }

    // Stampede protection: coalesce concurrent misses for the same key
    const existing = this.inflightRefreshes.get(key);
    if (existing) return existing;

    const refresh = fetcher(key).then(value => {
      if (value !== null) {
        this.cache.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs) });
      }
      this.inflightRefreshes.delete(key);
      return value;
    });

    this.inflightRefreshes.set(key, refresh);
    return refresh;
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.cache.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs) });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  size(): number {
    const now = Date.now();
    let count = 0;
    for (const [, entry] of this.cache) {
      if (entry.expiresAt > now) count++;
    }
    return count;
  }
}

// Test
async function runTest() {
  let dbCalls = 0;
  const db: DbFetcher<string> = async (key) => {
    dbCalls++;
    return \`value-for-\${key}\`;
  };

  const cache = new CacheAsideStore<string>(5_000);

  const v1 = await cache.get('user:1', db);
  const v2 = await cache.get('user:1', db); // should hit cache

  console.assert(v1 === v2, 'Values must be consistent');
  console.assert(dbCalls === 1, \`DB should be called once, was called \${dbCalls} times\`);

  cache.invalidate('user:1');
  await cache.get('user:1', db);
  console.assert(dbCalls === 2, 'DB should be called again after invalidation');

  // Stampede protection: 5 concurrent requests for a missing key
  dbCalls = 0;
  await Promise.all(Array.from({ length: 5 }, () => cache.get('user:2', db)));
  console.assert(dbCalls === 1, \`Stampede protection: DB should be called once, got \${dbCalls}\`);

  console.log('Cache-aside tests passed');
}

runTest().catch(console.error);
`,
    },
    commitMessages: [
      'add caching strategies notes with eviction and stampede analysis',
      'implement cache-aside with ttl and stampede protection',
    ],
  },
  {
    id: 'distributed-tracing',
    title: 'Distributed Tracing and Observability',
    category: 'System Design',
    difficulty: 'Advanced',
    folder: 'system-design',
    slug: 'distributed-tracing',
    files: {
      main: `# Distributed Tracing

In a microservices architecture, a single user request may touch 10+ services. Distributed tracing makes this visible.

## Core Concepts

### Trace, Span, Context

- **Trace** – The full journey of a request across all services. Identified by \`traceId\`.
- **Span** – A single unit of work within a trace (one service call, one DB query). Has \`spanId\`, \`parentSpanId\`, timestamps, status, and tags.
- **Context propagation** – The \`traceId\` and \`spanId\` are passed in HTTP headers (e.g., \`traceparent\` per W3C spec).

### W3C Traceparent Header

\`\`\`
traceparent: 00-<traceId>-<parentSpanId>-<flags>
\`\`\`

## Three Pillars of Observability

| Pillar | Tool Examples | What It Answers |
|--------|---------------|-----------------|
| **Logs** | ELK Stack, Loki | What happened? |
| **Metrics** | Prometheus, Datadog | How much/how often? |
| **Traces** | Jaeger, Zipkin, OTEL | Where did it go? How long? |

## Sampling Strategies

- **Head-based sampling** – Decide at request entry whether to trace (simple, misses rare errors).
- **Tail-based sampling** – Decide after request completes (can target slow/failed requests). Used by Jaeger.
- **Adaptive sampling** – Varies rate based on traffic volume.

## Golden Signals (Google SRE)

1. **Latency** – How long do requests take? (distinguish slow errors from slow successes)
2. **Traffic** – How many requests per second?
3. **Errors** – What percentage of requests fail?
4. **Saturation** – How "full" is the service? (CPU, memory, queue depth)

## RED Method (for microservices)

- **Rate** – Requests per second
- **Errors** – Failed requests per second  
- **Duration** – Request duration distribution (P50, P95, P99)
`,
      secondary: `// Minimal OpenTelemetry-style tracer (no external dependencies)
import * as crypto from 'crypto';

const generateId = (bytes: number) => crypto.randomBytes(bytes).toString('hex');

interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startMs: number;
  endMs?: number;
  status: 'ok' | 'error';
  tags: Record<string, string | number | boolean>;
  logs: { timestampMs: number; message: string }[];
}

export class Tracer {
  private spans: Span[] = [];

  startSpan(operationName: string, parentSpan?: Span): Span {
    const span: Span = {
      traceId: parentSpan?.traceId ?? generateId(16),
      spanId: generateId(8),
      parentSpanId: parentSpan?.spanId,
      operationName,
      startMs: Date.now(),
      status: 'ok',
      tags: {},
      logs: [],
    };
    this.spans.push(span);
    return span;
  }

  finishSpan(span: Span): void {
    span.endMs = Date.now();
  }

  setTag(span: Span, key: string, value: string | number | boolean): void {
    span.tags[key] = value;
  }

  log(span: Span, message: string): void {
    span.logs.push({ timestampMs: Date.now(), message });
  }

  setError(span: Span, error: Error): void {
    span.status = 'error';
    span.tags['error.message'] = error.message;
    span.tags['error.type'] = error.constructor.name;
  }

  getTrace(traceId: string): Span[] {
    return this.spans.filter(s => s.traceId === traceId).sort((a, b) => a.startMs - b.startMs);
  }

  // Returns P50, P95, P99 latency across all finished spans for an operation
  latencyPercentiles(operationName: string): { p50: number; p95: number; p99: number } {
    const durations = this.spans
      .filter(s => s.operationName === operationName && s.endMs != null)
      .map(s => s.endMs! - s.startMs)
      .sort((a, b) => a - b);

    if (durations.length === 0) return { p50: 0, p95: 0, p99: 0 };
    const p = (pct: number) => durations[Math.floor((pct / 100) * (durations.length - 1))];
    return { p50: p(50), p95: p(95), p99: p(99) };
  }
}

// Simulate a traced request
const tracer = new Tracer();

const root = tracer.startSpan('http.request');
tracer.setTag(root, 'http.method', 'GET');
tracer.setTag(root, 'http.url', '/api/orders');

const dbSpan = tracer.startSpan('db.query', root);
tracer.setTag(dbSpan, 'db.type', 'postgresql');
tracer.log(dbSpan, 'SELECT * FROM orders WHERE user_id = ?');
await new Promise(r => setTimeout(r, 5));
tracer.finishSpan(dbSpan);

tracer.finishSpan(root);

const trace = tracer.getTrace(root.traceId);
console.assert(trace.length === 2, 'Trace should have 2 spans');
console.assert(trace[0].operationName === 'http.request');
console.assert(trace[1].parentSpanId === root.spanId);
console.log('Tracer spans:', trace.map(s => \`\${s.operationName} (\${s.endMs! - s.startMs}ms)\`));
console.log('Distributed tracing tests passed');
`,
    },
    commitMessages: [
      'add distributed tracing notes covering trace spans and golden signals',
      'implement minimal opentelemetry-style tracer with percentile reporting',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // FULL-STACK DEVELOPMENT
  // ─────────────────────────────────────────────────────────────
  {
    id: 'rest-api-design',
    title: 'REST API Design Principles',
    category: 'Full-Stack',
    difficulty: 'Intermediate',
    folder: 'full-stack',
    slug: 'rest-api-design',
    files: {
      main: `# REST API Design Principles

## Resource Naming

- Use **nouns**, not verbs: \`/orders\` not \`/getOrders\`
- Use **plural nouns**: \`/users\`, \`/products\`
- Nest related resources: \`/users/:userId/orders\`
- Avoid deep nesting > 2 levels: prefer \`/orders?userId=123\`

## HTTP Methods

| Method | Usage | Idempotent? | Safe? |
|--------|-------|-------------|-------|
| GET | Retrieve resource | ✅ | ✅ |
| POST | Create resource | ❌ | ❌ |
| PUT | Replace resource entirely | ✅ | ❌ |
| PATCH | Partial update | ❌ usually | ❌ |
| DELETE | Remove resource | ✅ | ❌ |

## Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Authenticated but not allowed |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource, version mismatch |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limited |
| 500 | Internal Server Error | Unexpected server failure |

## Versioning Strategies

1. **URL path**: \`/v1/users\` — explicit, easy to route. Most common.
2. **Header**: \`Accept: application/vnd.api.v1+json\` — clean URLs.
3. **Query param**: \`/users?version=1\` — avoid (cacheable resources may cache wrong version).

## Pagination

Prefer cursor-based pagination over offset for large, frequently-updated datasets:

\`\`\`json
{
  "data": [...],
  "meta": {
    "nextCursor": "eyJpZCI6MTAwfQ",
    "hasNextPage": true,
    "total": 5000
  }
}
\`\`\`

## Error Response Format

\`\`\`json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Email address is invalid",
    "details": [{ "field": "email", "issue": "must be a valid email" }],
    "requestId": "req_abc123"
  }
}
\`\`\`
`,
      secondary: `import { strict as assert } from 'assert';

// REST API contract validation helpers

interface ApiError {
  code: string;
  message: string;
  details?: { field: string; issue: string }[];
  requestId?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    nextCursor?: string;
    hasNextPage: boolean;
    total?: number;
  };
}

function validateApiError(response: unknown): ApiError {
  const r = response as Record<string, unknown>;
  if (!r.error || typeof (r.error as Record<string, unknown>).code !== 'string') {
    throw new Error('Invalid error response format');
  }
  return (r as { error: ApiError }).error;
}

function encodeCursor(id: number): string {
  return Buffer.from(JSON.stringify({ id })).toString('base64url');
}

function decodeCursor(cursor: string): { id: number } {
  return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf-8'));
}

function paginateItems<T extends { id: number }>(
  items: T[],
  cursor: string | undefined,
  limit: number
): PaginatedResponse<T> {
  const afterId = cursor ? decodeCursor(cursor).id : 0;
  const filtered = items.filter(i => i.id > afterId);
  const page = filtered.slice(0, limit);
  const hasNextPage = filtered.length > limit;
  const nextCursor = hasNextPage ? encodeCursor(page[page.length - 1].id) : undefined;

  return { data: page, meta: { nextCursor, hasNextPage, total: items.length } };
}

// Tests
const errorPayload = { error: { code: 'NOT_FOUND', message: 'User not found', requestId: 'req_1' } };
const err = validateApiError(errorPayload);
assert.equal(err.code, 'NOT_FOUND');

const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: \`Item \${i + 1}\` }));
const page1 = paginateItems(items, undefined, 10);
assert.equal(page1.data.length, 10);
assert(page1.meta.hasNextPage);
assert(page1.meta.nextCursor);

const page2 = paginateItems(items, page1.meta.nextCursor, 10);
assert.equal(page2.data[0].id, 11);

const page3 = paginateItems(items, page2.meta.nextCursor, 10);
assert(!page3.meta.hasNextPage);

console.log('REST API design and pagination tests passed');
`,
    },
    commitMessages: [
      'add rest api design notes covering verbs status codes and pagination',
      'implement cursor-based pagination and error format validation helpers',
    ],
  },
  {
    id: 'jwt-authentication',
    title: 'JWT Authentication and Authorization',
    category: 'Full-Stack',
    difficulty: 'Intermediate',
    folder: 'full-stack',
    slug: 'jwt-authentication',
    files: {
      main: `// JWT-based auth utilities — production patterns

import * as crypto from 'crypto';

// ─── Types ────────────────────────────────────────────────────
export interface JwtPayload {
  sub: string;       // subject (user ID)
  role: string;
  iat?: number;      // issued at
  exp?: number;      // expiry
  jti?: string;      // JWT ID (for revocation)
}

// ─── Minimal JWT (HS256) ──────────────────────────────────────
// Note: In production, use a vetted library (jose, jsonwebtoken).
// This is for understanding the internals.

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(input: string): Buffer {
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

export function signJwt(payload: JwtPayload, secret: string, expiresInSeconds = 3600): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
    jti: crypto.randomBytes(8).toString('hex'),
  }));

  const sig = crypto
    .createHmac('sha256', secret)
    .update(\`\${header}.\${body}\`)
    .digest('base64url');

  return \`\${header}.\${body}.\${sig}\`;
}

export function verifyJwt(token: string, secret: string): JwtPayload {
  const [headerB64, bodyB64, sigB64] = token.split('.');
  if (!headerB64 || !bodyB64 || !sigB64) throw new Error('Invalid JWT format');

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(\`\${headerB64}.\${bodyB64}\`)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(sigB64), Buffer.from(expectedSig))) {
    throw new Error('JWT signature verification failed');
  }

  const payload: JwtPayload & { exp?: number } = JSON.parse(base64urlDecode(bodyB64).toString('utf-8'));

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('JWT has expired');
  }
  return payload;
}

// ─── RBAC helper ─────────────────────────────────────────────
type Role = 'admin' | 'editor' | 'viewer';
type Permission = 'read' | 'write' | 'delete';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin:  ['read', 'write', 'delete'],
  editor: ['read', 'write'],
  viewer: ['read'],
};

export function hasPermission(role: string, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role as Role] ?? []).includes(permission);
}
`,
      secondary: `import { strict as assert } from 'assert';
import { signJwt, verifyJwt, hasPermission } from './jwt-authentication';

const SECRET = 'test-secret-key-32-chars-minimum!!';

// Valid token
const token = signJwt({ sub: 'user-123', role: 'editor' }, SECRET, 300);
const payload = verifyJwt(token, SECRET);
assert.equal(payload.sub, 'user-123');
assert.equal(payload.role, 'editor');

// Tampered token must throw
const parts = token.split('.');
const tampered = \`\${parts[0]}.\${parts[1]}.fakesignature\`;
assert.throws(() => verifyJwt(tampered, SECRET), /signature/i);

// Wrong secret must throw
assert.throws(() => verifyJwt(token, 'wrong-secret'), /signature/i);

// Expired token
const expiredToken = signJwt({ sub: 'user-456', role: 'viewer' }, SECRET, -1);
assert.throws(() => verifyJwt(expiredToken, SECRET), /expired/i);

// RBAC
assert(hasPermission('admin', 'delete'));
assert(hasPermission('editor', 'write'));
assert(!hasPermission('editor', 'delete'));
assert(!hasPermission('viewer', 'write'));
assert(!hasPermission('unknown', 'read'));

console.log('JWT authentication and RBAC tests passed');
`,
    },
    commitMessages: [
      'implement hs256 jwt sign and verify with timing-safe comparison',
      'add jwt expiry, tampering, and rbac permission tests',
    ],
  },
  {
    id: 'database-transactions',
    title: 'Database Transactions and ACID Properties',
    category: 'Databases',
    difficulty: 'Advanced',
    folder: 'full-stack',
    slug: 'database-transactions',
    files: {
      main: `# Database Transactions and ACID

## ACID Properties

| Property | Meaning | Failure Without It |
|----------|---------|-------------------|
| **Atomicity** | All operations succeed or none do | Partial updates corrupt data |
| **Consistency** | Transaction takes DB from valid state to valid state | Referential integrity violations |
| **Isolation** | Concurrent transactions don't interfere | Dirty reads, lost updates |
| **Durability** | Committed data survives crashes | Data loss after crash |

## Isolation Levels

From weakest to strongest:

### Read Uncommitted (Avoid)
Can read uncommitted changes from other transactions.
- Problem: **Dirty reads** (reading data that might be rolled back)

### Read Committed (PostgreSQL default)
Only reads committed data.
- Problem: **Non-repeatable reads** (same row returns different values in same transaction)

### Repeatable Read (MySQL InnoDB default)
Same rows return same data within a transaction.
- Problem: **Phantom reads** (new rows added by another transaction appear in range queries)

### Serializable (Strictest)
Transactions execute as if serial.
- No anomalies but lower throughput.

## Common Concurrency Problems

\`\`\`
Dirty Read:
  T1: writes X=20 (uncommitted)
  T2: reads X=20
  T1: rolls back → T2 read wrong data

Lost Update:
  T1: reads balance=100, T2: reads balance=100
  T1: writes balance=150, T2: writes balance=80
  → T1's update is lost

Phantom Read:
  T1: SELECT COUNT(*) FROM orders WHERE status='pending' → 5
  T2: INSERT new pending order
  T1: SELECT COUNT(*) WHERE status='pending' → 6
\`\`\`

## SELECT FOR UPDATE

Locks the selected rows for the duration of the transaction:

\`\`\`sql
BEGIN;
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;
-- T2 trying to SELECT FOR UPDATE on id=1 now blocks
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;
\`\`\`

## Optimistic vs Pessimistic Locking

**Pessimistic**: Lock the row when reading (SELECT FOR UPDATE). Good for high-conflict scenarios.
**Optimistic**: Read without lock, include a \`version\` column in the UPDATE condition. Retry on conflict. Good for low-conflict scenarios.

\`\`\`sql
UPDATE products
SET stock = stock - 1, version = version + 1
WHERE id = 42 AND version = 7;
-- If 0 rows updated → conflict, retry
\`\`\`
`,
      secondary: `// Optimistic locking simulation with version columns

interface Record {
  id: number;
  data: string;
  version: number;
}

class InMemoryTable {
  private rows = new Map<number, Record>();

  insert(record: Record): void {
    this.rows.set(record.id, { ...record });
  }

  select(id: number): Record | undefined {
    const r = this.rows.get(id);
    return r ? { ...r } : undefined;
  }

  // Returns true if update succeeded, false if version conflict
  optimisticUpdate(id: number, data: string, expectedVersion: number): boolean {
    const current = this.rows.get(id);
    if (!current) throw new Error(\`Row \${id} not found\`);

    if (current.version !== expectedVersion) {
      return false; // version mismatch — concurrent update detected
    }

    this.rows.set(id, { ...current, data, version: current.version + 1 });
    return true;
  }
}

// Simulate two concurrent transactions
const table = new InMemoryTable();
table.insert({ id: 1, data: 'original', version: 1 });

// T1 reads
const t1Read = table.select(1)!;
// T2 reads the same row concurrently
const t2Read = table.select(1)!;

// T2 commits first
const t2Success = table.optimisticUpdate(1, 'updated-by-t2', t2Read.version);
console.assert(t2Success, 'T2 should succeed');

// T1 tries to commit but version has changed
const t1Success = table.optimisticUpdate(1, 'updated-by-t1', t1Read.version);
console.assert(!t1Success, 'T1 should fail with version conflict');

// T1 retries with fresh read
const t1Retry = table.select(1)!;
const t1RetrySuccess = table.optimisticUpdate(1, 'updated-by-t1-retry', t1Retry.version);
console.assert(t1RetrySuccess, 'T1 retry should succeed');

const final = table.select(1)!;
console.assert(final.version === 3, \`Expected version 3, got \${final.version}\`);
console.assert(final.data === 'updated-by-t1-retry');
console.log('Optimistic locking simulation passed');
`,
    },
    commitMessages: [
      'add acid properties and isolation level notes with concurrency anomalies',
      'implement optimistic locking simulation with version conflict detection',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // TESTING
  // ─────────────────────────────────────────────────────────────
  {
    id: 'test-pyramid',
    title: 'Test Pyramid: Unit, Integration, E2E',
    category: 'Testing',
    difficulty: 'Intermediate',
    folder: 'testing',
    slug: 'test-pyramid',
    files: {
      main: `# The Test Pyramid

## Layers (Bottom → Top)

\`\`\`
        ┌────────┐
        │  E2E   │  Slowest, most brittle, fewest
        ├────────┤
        │  Integ │  Medium speed, test contracts
        ├────────┤
        │  Unit  │  Fast, isolated, many
        └────────┘
\`\`\`

## Unit Tests

Test a single function/class in complete isolation. Mock all external dependencies.

**What to test:**
- Pure functions (given input X → output Y)
- Business logic edge cases
- Error branches
- State transitions

**Good unit test properties (F.I.R.S.T):**
- **Fast** — ms-level
- **Isolated** — no network, disk, or DB
- **Repeatable** — same result every run
- **Self-Validating** — clear pass/fail
- **Timely** — written with/before the code

## Integration Tests

Test multiple components together (service + DB, handler + cache).

**What to test:**
- Database queries and transactions
- External service contracts
- Middleware chains
- Authentication flows

**Tip:** Use test containers (PostgreSQL in Docker) for real DB integration tests instead of mocking.

## End-to-End (E2E) Tests

Test the full user journey through the browser or API client.

**Tools:** Playwright, Cypress, Supertest

**Principles:**
- Cover critical user paths only (login, checkout, signup)
- Keep the suite small (<50 tests) and fast (<5 minutes)
- Run in CI on every PR, not in unit test runners

## Test Coverage Misconception

100% coverage ≠ bug-free code. Focus on:
1. **Branch coverage** over line coverage
2. **Mutation testing** (e.g., Stryker) to verify tests actually catch bugs
3. Testing behaviour, not implementation

## Contract Testing

In microservices, use consumer-driven contract tests (Pact) so that:
- Consumer defines what it expects from the provider
- Provider verifies it meets all consumers' contracts
- Prevents breaking API changes silently
`,
      secondary: `import { strict as assert } from 'assert';

// ──────────────────────────────────────────────────────────────
// Example: Testing a UserService with a mocked UserRepository
// This demonstrates the pattern — not a real test runner
// ──────────────────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: Omit<User, 'id'>): Promise<User>;
}

class UserService {
  constructor(private readonly repo: UserRepository) {}

  async register(email: string, passwordHash: string): Promise<User> {
    const existing = await this.repo.findByEmail(email);
    if (existing) throw new Error('Email already registered');

    return this.repo.save({ email, passwordHash, createdAt: new Date() });
  }
}

// Mock repository — zero dependencies, fully controlled
function createMockRepo(existingUsers: User[] = []): UserRepository {
  const db = new Map(existingUsers.map(u => [u.email, u]));
  let idSeq = existingUsers.length;

  return {
    findByEmail: async (email) => db.get(email) ?? null,
    save: async (user) => {
      const saved: User = { ...user, id: \`user-\${++idSeq}\` };
      db.set(saved.email, saved);
      return saved;
    },
  };
}

// Test: successful registration
async function testRegisterSuccess() {
  const repo = createMockRepo();
  const service = new UserService(repo);
  const user = await service.register('alice@example.com', 'hashed-pw');
  assert.equal(user.email, 'alice@example.com');
  assert(user.id.startsWith('user-'));
  console.log('✓ successful registration');
}

// Test: duplicate email
async function testDuplicateEmail() {
  const existing: User = { id: 'user-1', email: 'bob@example.com', passwordHash: 'pw', createdAt: new Date() };
  const repo = createMockRepo([existing]);
  const service = new UserService(repo);
  await assert.rejects(
    () => service.register('bob@example.com', 'new-pw'),
    /already registered/i
  );
  console.log('✓ duplicate email rejected');
}

await testRegisterSuccess();
await testDuplicateEmail();
console.log('Test pyramid unit test examples passed');
`,
    },
    commitMessages: [
      'add test pyramid notes covering unit integration e2e and contract testing',
      'add user service unit tests with mock repository pattern',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // DEVOPS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'docker-multi-stage',
    title: 'Docker Multi-Stage Builds for Node.js',
    category: 'DevOps',
    difficulty: 'Intermediate',
    folder: 'devops',
    slug: 'docker-multi-stage',
    files: {
      main: `# Docker Multi-Stage Builds

Multi-stage builds produce lean production images by separating the build environment from the runtime environment.

## Single-Stage Problem

A naive Dockerfile installs dev dependencies, compiles, and ships everything:

\`\`\`dockerfile
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["node", "dist/server.js"]
# Image size: ~900MB (includes node_modules, TypeScript compiler, source maps)
\`\`\`

## Multi-Stage Solution

\`\`\`dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy only the compiled output
COPY --from=builder /app/dist ./dist

EXPOSE 3000
USER node
CMD ["node", "dist/server.js"]
\`\`\`

**Result:** Image shrinks from ~900MB to ~120MB (only runtime deps + compiled JS).

## Docker Layer Caching

Order layers from least to most frequently changed:

\`\`\`dockerfile
# ✅ Good: dependencies before source code
COPY package*.json ./
RUN npm ci          # cached unless package.json changes
COPY . .
RUN npm run build   # only re-runs when source changes

# ❌ Bad: COPY . . first invalidates npm ci cache on every change
COPY . .
RUN npm ci
\`\`\`

## Security Best Practices

- Use \`USER node\` (non-root) — privilege escalation protection
- Use \`--omit=dev\` in production
- Pin base image digests: \`FROM node:20-alpine@sha256:...\`
- Use \`.dockerignore\` to exclude \`node_modules\`, \`.env\`, test files
- Scan image with \`docker scout\` or Trivy

## Health Check

\`\`\`dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1
\`\`\`
`,
      secondary: `# .dockerignore
node_modules
.git
.env
.env.local
*.log
coverage
.next
dist
*.test.ts
*.spec.ts
__tests__
.github
README.md

---
# docker-compose.yml (development with hot reload)
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: builder   # use the builder stage for dev
    ports:
      - '3000:3000'
    volumes:
      - .:/app
      - /app/node_modules  # preserve container's node_modules
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://dev:dev@db:5432/appdb
    depends_on:
      db:
        condition: service_healthy
    command: npm run dev

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: appdb
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U dev -d appdb']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
`,
    },
    commitMessages: [
      'add multi-stage dockerfile notes with caching and security best practices',
      'add dockerignore and docker-compose for development environment',
    ],
  },
  {
    id: 'cicd-pipeline',
    title: 'CI/CD Pipeline with GitHub Actions',
    category: 'DevOps',
    difficulty: 'Intermediate',
    folder: 'devops',
    slug: 'cicd-pipeline',
    files: {
      main: `# CI/CD Pipeline Design

## Pipeline Stages

\`\`\`
Push → Lint & Type Check → Unit Tests → Build → Integration Tests → Deploy (Staging) → Smoke Tests → Deploy (Prod)
\`\`\`

## Principles

- **Fail fast** — Run the fastest checks first (lint before tests)
- **Cache aggressively** — Cache node_modules between runs
- **Parallelize** — Run independent jobs concurrently
- **Immutable artifacts** — Build once, deploy the same artifact to all envs
- **Secrets via environment variables** — Never hardcode credentials

## GitHub Actions Workflow

\`\`\`yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  quality:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '\${{ env.NODE_VERSION }}', cache: 'npm' }
      - run: npm ci
      - run: npm test -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  integration:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: test
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '\${{ env.NODE_VERSION }}', cache: 'npm' }
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/testdb

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: integration
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - run: npx vercel deploy --token=\${{ secrets.VERCEL_TOKEN }}

  deploy-prod:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: integration
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      - run: npx vercel deploy --prod --token=\${{ secrets.VERCEL_TOKEN }}
\`\`\`
`,
      secondary: `# Engineering Notes: CI/CD Best Practices

## Deployment Strategies

### Rolling Update
Replace instances one at a time. Zero downtime.
Risk: Incompatible DB schema changes during rollout (old + new code coexist).

### Blue/Green Deployment
Two identical environments (Blue = live, Green = new version).
Switch traffic instantly. Easy rollback by switching back.
Cost: Double infrastructure during switch.

### Canary Deployment
Route 5% of traffic to new version. Gradually increase.
Monitor error rates. Roll back if metrics degrade.
Best for: High-traffic systems where silent regressions are costly.

## Pre-Deployment Checklist

- [ ] All tests pass (unit, integration, E2E)
- [ ] No secrets committed to git
- [ ] Database migrations are backward-compatible
- [ ] Feature flags are configured
- [ ] Rollback plan is documented
- [ ] Monitoring alerts are set up
- [ ] Stakeholders notified

## Database Migration Safety

1. Never DROP COLUMN or RENAME COLUMN in the same deploy as the code that stops using it.
2. Use the expand/contract pattern:
   - Step 1: Add new column (nullable) — deploy code that writes to both
   - Step 2: Backfill old data
   - Step 3: Add NOT NULL constraint
   - Step 4: Remove old column in a later deploy

## Rollback Playbook

\`\`\`bash
# Revert to previous Vercel deployment
vercel rollback [deployment-url]

# Revert last database migration
npm run db:migrate:rollback

# Check service health after rollback
curl https://api.example.com/health
\`\`\`
`,
    },
    commitMessages: [
      'add github actions cicd pipeline with staging and production jobs',
      'add deployment strategies and rollback playbook notes',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // SECURITY
  // ─────────────────────────────────────────────────────────────
  {
    id: 'input-validation-security',
    title: 'Input Validation and Injection Prevention',
    category: 'Security',
    difficulty: 'Intermediate',
    folder: 'full-stack',
    slug: 'input-validation-security',
    files: {
      main: `# Input Validation and Injection Prevention

## SQL Injection

**Vulnerable:**
\`\`\`typescript
const query = \`SELECT * FROM users WHERE email = '\${email}'\`;
// Input: ' OR '1'='1 → returns all users
\`\`\`

**Safe (parameterized queries):**
\`\`\`typescript
const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
\`\`\`

Never interpolate user input into SQL strings. Always use prepared statements or an ORM that parameterizes automatically.

## XSS (Cross-Site Scripting)

**Types:**
- **Stored XSS** — malicious script saved to DB, executed when other users view
- **Reflected XSS** — script in URL parameter, reflected in response
- **DOM XSS** — script injected via client-side JS without server involvement

**Prevention:**
- React/Vue escape output by default (use \`dangerouslySetInnerHTML\` cautiously)
- Set \`Content-Security-Policy\` header
- Sanitize HTML with DOMPurify when rich text is required

## CSRF (Cross-Site Request Forgery)

**Prevention:**
- Use \`SameSite=Strict\` or \`SameSite=Lax\` cookies
- Verify \`Origin\` and \`Referer\` headers on state-changing endpoints
- Double-submit CSRF token pattern for non-SameSite scenarios

## Security Headers Checklist

\`\`\`
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=()
\`\`\`

## Dependency Vulnerabilities

\`\`\`bash
npm audit                      # scan for known vulnerabilities
npm audit fix                  # auto-fix safe upgrades
npx better-npm-audit --level high  # fail CI on high/critical
\`\`\`
`,
      secondary: `import { strict as assert } from 'assert';

// Input validation using a minimal schema validator (zod-like)
// In production, use zod or joi

type Validator<T> = (input: unknown) => T;

function string(opts?: { minLength?: number; maxLength?: number; pattern?: RegExp }): Validator<string> {
  return (input) => {
    if (typeof input !== 'string') throw new Error('Expected string');
    if (opts?.minLength && input.length < opts.minLength) {
      throw new Error(\`Must be at least \${opts.minLength} characters\`);
    }
    if (opts?.maxLength && input.length > opts.maxLength) {
      throw new Error(\`Must not exceed \${opts.maxLength} characters\`);
    }
    if (opts?.pattern && !opts.pattern.test(input)) {
      throw new Error('Invalid format');
    }
    return input;
  };
}

function number(opts?: { min?: number; max?: number }): Validator<number> {
  return (input) => {
    const n = Number(input);
    if (Number.isNaN(n)) throw new Error('Expected number');
    if (opts?.min !== undefined && n < opts.min) throw new Error(\`Must be >= \${opts.min}\`);
    if (opts?.max !== undefined && n > opts.max) throw new Error(\`Must be <= \${opts.max}\`);
    return n;
  };
}

function object<T extends Record<string, Validator<unknown>>>(
  schema: T
): Validator<{ [K in keyof T]: ReturnType<T[K]> }> {
  return (input) => {
    if (typeof input !== 'object' || input === null) throw new Error('Expected object');
    const result: Record<string, unknown> = {};
    const errors: string[] = [];
    for (const [key, validator] of Object.entries(schema)) {
      try {
        result[key] = validator((input as Record<string, unknown>)[key]);
      } catch (err) {
        errors.push(\`\${key}: \${(err as Error).message}\`);
      }
    }
    if (errors.length > 0) throw new Error(errors.join('; '));
    return result as never;
  };
}

// Schema for user registration
const registerSchema = object({
  email: string({ minLength: 5, maxLength: 254, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }),
  username: string({ minLength: 3, maxLength: 30, pattern: /^[a-zA-Z0-9_-]+$/ }),
  age: number({ min: 13, max: 120 }),
});

// Valid input
const valid = registerSchema({ email: 'alice@example.com', username: 'alice_dev', age: 25 });
assert.equal(valid.email, 'alice@example.com');

// Invalid email
assert.throws(() => registerSchema({ email: 'not-an-email', username: 'bob', age: 20 }), /email/i);

// SQL injection attempt in username field
assert.throws(
  () => registerSchema({ email: 'c@d.com', username: "'; DROP TABLE users;--", age: 20 }),
  /username/i,
  'Username with SQL injection must fail pattern validation'
);

// Age out of range
assert.throws(() => registerSchema({ email: 'x@y.com', username: 'x', age: 5 }), /min/i);

console.log('Input validation tests passed');
`,
    },
    commitMessages: [
      'add input validation and injection prevention security notes',
      'implement schema validator with sql injection prevention tests',
    ],
  },
];

/**
 * Returns the Sanket curriculum topic for a given day number (1-indexed, cycles).
 */
export function getSanketTopicForDay(dayNumber: number): SanketTopic {
  const index = ((dayNumber - 1) % SANKET_CURRICULUM.length + SANKET_CURRICULUM.length) % SANKET_CURRICULUM.length;
  return SANKET_CURRICULUM[index];
}

/**
 * Returns the day number in Sanket's curriculum based on the start date env var.
 */
export function getSanketRoadmapDay(): number {
  const startDateStr = process.env.SANKET_STREAK_START_DATE || '2026-10-10';
  const start = new Date(startDateStr);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}
