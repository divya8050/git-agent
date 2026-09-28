export interface PracticeTopic {
  id: string;
  title: string;
  category: 'Algorithms' | 'Data Structures' | 'System Design' | 'Design Patterns' | 'Utilities';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  complexity: {
    time: string;
    space: string;
  };
  files: {
    typescript: string;
    python: string;
    markdown: string;
  };
}

export const CURRICULUM: PracticeTopic[] = [
  {
    id: 'two-sum-hashmap',
    title: 'Two Sum with Optimal Hash Map',
    category: 'Algorithms',
    difficulty: 'Easy',
    description: 'Find two numbers in an array that add up to a specific target in linear time.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    files: {
      typescript: `/**
 * Problem: Two Sum
 * Approach: One-pass Hash Map
 * Time Complexity: O(n)
 * Space Complexity: O(n)
 */

export function twoSum(nums: number[], target: number): [number, number] | null {
  const seen = new Map<number, number>();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement)!, i];
    }
    seen.set(nums[i], i);
  }

  return null;
}

// Verification Tests
if (import.meta.main || require.main === module) {
  const result = twoSum([2, 7, 11, 15], 9);
  console.log('Result for [2, 7, 11, 15], target 9 ->', result);
  console.assert(result && result[0] === 0 && result[1] === 1, 'Test passed!');
}
`,
      python: `"""
Problem: Two Sum
Approach: One-pass Hash Map
Time Complexity: O(n)
Space Complexity: O(n)
"""

from typing import List, Optional, Tuple

def two_sum(nums: List[int], target: int) -> Optional[Tuple[int, int]]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return (seen[complement], i)
        seen[num] = i
    return None

if __name__ == "__main__":
    result = two_sum([2, 7, 11, 15], 9)
    print(f"Result for [2, 7, 11, 15], target 9 -> {result}")
    assert result == (0, 1), "Test failed"
    print("All tests passed successfully!")
`,
      markdown: `# Two Sum with Optimal Hash Map

## Problem Description
Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

## Intuition
Instead of testing all pairs in \\(O(n^2)\\), store previously seen elements in a hash map mapping \`value -> index\`. For each item, look up if \`target - value\` exists in constant time.

## Complexity
- **Time Complexity**: \\(O(n)\\)
- **Space Complexity**: \\(O(n)\\)
`,
    },
  },
  {
    id: 'lru-cache-doubly-linked-list',
    title: 'LRU Cache (Least Recently Used) Implementation',
    category: 'Data Structures',
    difficulty: 'Medium',
    description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with O(1) get and put.',
    complexity: { time: 'O(1) amortized', space: 'O(capacity)' },
    files: {
      typescript: `/**
 * Problem: LRU Cache
 * Approach: Hash Map + Doubly Linked List
 * Time: O(1) for get and put
 * Space: O(capacity)
 */

class DNode<K, V> {
  key: K;
  value: V;
  prev: DNode<K, V> | null = null;
  next: DNode<K, V> | null = null;

  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
  }
}

export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, DNode<K, V>> = new Map();
  private head: DNode<K, V>;
  private tail: DNode<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.head = new DNode<K, V>(null as any, null as any);
    this.tail = new DNode<K, V>(null as any, null as any);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  private addNode(node: DNode<K, V>): void {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  private removeNode(node: DNode<K, V>): void {
    const prev = node.prev!;
    const next = node.next!;
    prev.next = next;
    next.prev = prev;
  }

  private moveToHead(node: DNode<K, V>): void {
    this.removeNode(node);
    this.addNode(node);
  }

  get(key: K): V | -1 {
    const node = this.cache.get(key);
    if (!node) return -1;
    this.moveToHead(node);
    return node.value;
  }

  put(key: K, value: V): void {
    const existing = this.cache.get(key);
    if (existing) {
      existing.value = value;
      this.moveToHead(existing);
      return;
    }

    const newNode = new DNode(key, value);
    this.cache.set(key, newNode);
    this.addNode(newNode);

    if (this.cache.size > this.capacity) {
      const lru = this.tail.prev!;
      this.removeNode(lru);
      this.cache.delete(lru.key);
    }
  }
}
`,
      python: `"""
Problem: LRU Cache Implementation
Approach: Dictionary + Doubly Linked List
Time: O(1) for get and put
Space: O(capacity)
"""

class DNode:
    def __init__(self, key: int = 0, val: int = 0):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        self.head = DNode()
        self.tail = DNode()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: DNode) -> None:
        p, n = node.prev, node.next
        p.next = n
        n.prev = p

    def _add_to_front(self, node: DNode) -> None:
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._remove(node)
        self._add_to_front(node)
        return node.val

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            node = self.cache[key]
            node.val = value
            self._remove(node)
            self._add_to_front(node)
            return

        new_node = DNode(key, value)
        self.cache[key] = new_node
        self._add_to_front(new_node)

        if len(self.cache) > self.capacity:
            lru = self.tail.prev
            self._remove(lru)
            del self.cache[lru.key]

if __name__ == "__main__":
    lru = LRUCache(2)
    lru.put(1, 10)
    lru.put(2, 20)
    assert lru.get(1) == 10
    lru.put(3, 30) # Evicts key 2
    assert lru.get(2) == -1
    print("LRU Cache tests passed successfully!")
`,
      markdown: `# LRU Cache Implementation

## Overview
A Least Recently Used (LRU) Cache discards the least recently accessed items first when the cache reaches its memory limit.

## Architecture
- **Hash Table**: Provides \\(O(1)\\) lookup time.
- **Doubly Linked List**: Keeps items ordered by access recency with \\(O(1)\\) node additions and removals.
`,
    },
  },
  {
    id: 'rate-limiter-token-bucket',
    title: 'Token Bucket Rate Limiter',
    category: 'System Design',
    difficulty: 'Medium',
    description: 'Implement a token bucket algorithm to rate limit API requests based on refill rates and burst capacities.',
    complexity: { time: 'O(1)', space: 'O(1)' },
    files: {
      typescript: `/**
 * Pattern: Token Bucket Rate Limiter
 * Suitable for distributed systems and API gateways.
 */

export class TokenBucketRateLimiter {
  private capacity: number;
  private refillRatePerSecond: number;
  private tokens: number;
  private lastRefillTimestamp: number;

  constructor(capacity: number, refillRatePerSecond: number) {
    this.capacity = capacity;
    this.refillRatePerSecond = refillRatePerSecond;
    this.tokens = capacity;
    this.lastRefillTimestamp = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;
    const tokensToAdd = elapsedSeconds * this.refillRatePerSecond;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTimestamp = now;
  }

  public allowRequest(tokensRequested: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokensRequested) {
      this.tokens -= tokensRequested;
      return true;
    }
    return false;
  }
}
`,
      python: `"""
Token Bucket Rate Limiter
Widely used in distributed services (Redis, AWS, NGINX)
"""

import time

class TokenBucketRateLimiter:
    def __init__(self, capacity: int, refill_rate_per_sec: float):
        self.capacity = capacity
        self.refill_rate = refill_rate_per_sec
        self.tokens = float(capacity)
        self.last_refill = time.time()

    def _refill(self) -> None:
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(float(self.capacity), self.tokens + (elapsed * self.refill_rate))
        self.last_refill = now

    def allow_request(self, tokens: int = 1) -> bool:
        self._refill()
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False

if __name__ == "__main__":
    limiter = TokenBucketRateLimiter(capacity=3, refill_rate_per_sec=1.0)
    assert limiter.allow_request(1) is True
    assert limiter.allow_request(1) is True
    assert limiter.allow_request(1) is True
    assert limiter.allow_request(1) is False # Burst exhausted
    print("Token Bucket Rate Limiter tests passed!")
`,
      markdown: `# Token Bucket Rate Limiter

## Concept
The token bucket algorithm regulates traffic flow by filling a bucket with tokens at a constant rate. Every request consumes one or more tokens. If no tokens are left, the request is dropped or queued.

## Benefits
- Allows bursts of requests up to the bucket capacity.
- Smooths out traffic spikes.
- Extremely low CPU and memory overhead \\(O(1)\\).
`,
    },
  },
  {
    id: 'sliding-window-max-subarray',
    title: 'Sliding Window Maximum Sum Subarray',
    category: 'Algorithms',
    difficulty: 'Easy',
    description: 'Find the maximum sum of any contiguous subarray of size k.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    files: {
      typescript: `export function maxSubArraySum(nums: number[], k: number): number {
  if (nums.length < k || k <= 0) return 0;

  let currentSum = 0;
  for (let i = 0; i < k; i++) {
    currentSum += nums[i];
  }

  let maxSum = currentSum;
  for (let i = k; i < nums.length; i++) {
    currentSum += nums[i] - nums[i - k];
    maxSum = Math.max(maxSum, currentSum);
  }

  return maxSum;
}
`,
      python: `def max_subarray_sum(nums: list[int], k: int) -> int:
    if len(nums) < k or k <= 0:
        return 0

    current_sum = sum(nums[:k])
    max_sum = current_sum

    for i in range(k, len(nums)):
        current_sum += nums[i] - nums[i - k]
        max_sum = max(max_sum, current_sum)

    return max_sum

if __name__ == "__main__":
    assert max_subarray_sum([2, 1, 5, 1, 3, 2], 3) == 9
    print("Sliding window tests passed!")
`,
      markdown: `# Sliding Window: Maximum Sum Subarray of Size K

## Technique
Instead of recalculating the entire sum of \\(k\\) elements every step (\\(O(n \\times k)\\)), slide the window forward by subtracting the element falling out of the window and adding the newly entered element in \\(O(1)\\).
`,
    },
  },
  {
    id: 'debounce-and-throttle',
    title: 'Debounce & Throttle Implementation',
    category: 'Utilities',
    difficulty: 'Medium',
    description: 'Modern TypeScript implementations of debounce and throttle for high-frequency events.',
    complexity: { time: 'O(1)', space: 'O(1)' },
    files: {
      typescript: `export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delayMs);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}
`,
      python: `import time
from functools import wraps
from typing import Callable, Any

def throttle(limit_sec: float) -> Callable:
    def decorator(fn: Callable) -> Callable:
        last_called = 0.0

        @wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            nonlocal last_called
            now = time.time()
            if now - last_called >= limit_sec:
                last_called = now
                return fn(*args, **kwargs)
            return None
        return wrapper
    return decorator
`,
      markdown: `# Debounce & Throttle

Essential utility patterns for optimizing event-driven frontend and backend systems:
- **Debounce**: Delays invoking a function until after \\(N\\) milliseconds of silence.
- **Throttle**: Ensures a function is called at most once in every \\(N\\) milliseconds window.
`,
    },
  },
  {
    id: 'binary-search-rotated-array',
    title: 'Search in Rotated Sorted Array',
    category: 'Algorithms',
    difficulty: 'Medium',
    description: 'Find a target value in a sorted array that has been rotated at an unknown pivot index.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    files: {
      typescript: `export function searchRotated(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) return mid;

    // Check if left half is sorted
    if (nums[left] <= nums[mid]) {
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    } else {
      // Right half is sorted
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }

  return -1;
}
`,
      python: `def search_rotated(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1

    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid

        # Left half is sorted
        if nums[left] <= nums[mid]:
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        # Right half is sorted
        else:
            if nums[mid] < target <= nums[right]:
                left = mid + 1
            else:
                right = mid - 1

    return -1

if __name__ == "__main__":
    assert search_rotated([4, 5, 6, 7, 0, 1, 2], 0) == 4
    assert search_rotated([4, 5, 6, 7, 0, 1, 2], 3) == -1
    print("Rotated binary search tests passed!")
`,
      markdown: `# Search in Rotated Sorted Array

## Approach
A modified binary search where in every step, at least one half (left or right) of the array is guaranteed to be normally sorted. We test whether the target falls inside the normally sorted half to decide where to recurse.
`,
    },
  },
  {
    id: 'observer-pubsub-pattern',
    title: 'Publish-Subscribe (Pub/Sub) Event Bus',
    category: 'Design Patterns',
    difficulty: 'Medium',
    description: 'Type-safe event emitter implementation with unsubscribers, wildcard support, and error isolation.',
    complexity: { time: 'O(1) publish, O(1) subscribe', space: 'O(listeners)' },
    files: {
      typescript: `type EventCallback<T = any> = (data: T) => void;

export class EventEmitter {
  private events: Map<string, Set<EventCallback>> = new Map();

  on<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);

    // Return unsubscribe cleanup function
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.events.delete(event);
      }
    }
  }

  emit<T>(event: string, data: T): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (err) {
          console.error(\`Error in event listener for \${event}:\`, err);
        }
      });
    }
  }
}
`,
      python: `from typing import Callable, Dict, List, Any

class EventBus:
    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[Any], None]]] = {}

    def subscribe(self, event_name: str, callback: Callable[[Any], None]) -> Callable[[], None]:
        if event_name not in self._subscribers:
            self._subscribers[event_name] = []
        self._subscribers[event_name].append(callback)

        def unsubscribe():
            if event_name in self._subscribers and callback in self._subscribers[event_name]:
                self._subscribers[event_name].remove(callback)
        return unsubscribe

    def publish(self, event_name: str, data: Any = None) -> None:
        if event_name in self._subscribers:
            for callback in list(self._subscribers[event_name]):
                try:
                    callback(data)
                except Exception as e:
                    print(f"Error handling event {event_name}: {e}")
`,
      markdown: `# Event Bus / Pub-Sub Pattern

Decouples event publishers from event subscribers, enabling extensible and modular software architecture.
`,
    },
  },
  {
    id: 'trie-prefix-tree',
    title: 'Trie (Prefix Tree) Implementation',
    category: 'Data Structures',
    difficulty: 'Medium',
    description: 'Implement a trie with insert, search, and startsWith methods for rapid string prefix lookups.',
    complexity: { time: 'O(m) where m is word length', space: 'O(ALPHABET_SIZE * m * n)' },
    files: {
      typescript: `class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord: boolean = false;
}

export class Trie {
  private root: TrieNode = new TrieNode();

  insert(word: string): void {
    let current = this.root;
    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }
    current.isEndOfWord = true;
  }

  search(word: string): boolean {
    let current = this.root;
    for (const char of word) {
      if (!current.children.has(char)) return false;
      current = current.children.get(char)!;
    }
    return current.isEndOfWord;
  }

  startsWith(prefix: string): boolean {
    let current = this.root;
    for (const char of prefix) {
      if (!current.children.has(char)) return false;
      current = current.children.get(char)!;
    }
    return true;
  }
}
`,
      python: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end_of_word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        curr = self.root
        for char in word:
            if char not in curr.children:
                curr.children[char] = TrieNode()
            curr = curr.children[char]
        curr.is_end_of_word = True

    def search(self, word: str) -> bool:
        curr = self.root
        for char in word:
            if char not in curr.children:
                return False
            curr = curr.children[char]
        return curr.is_end_of_word

    def starts_with(self, prefix: str) -> bool:
        curr = self.root
        for char in prefix:
            if char not in curr.children:
                return False
            curr = curr.children[char]
        return True

if __name__ == "__main__":
    t = Trie()
    t.insert("apple")
    assert t.search("apple") is True
    assert t.search("app") is False
    assert t.starts_with("app") is True
    print("Trie tests passed successfully!")
`,
      markdown: `# Trie (Prefix Tree)

An efficient tree data structure used for retrieval of keys in a dataset of strings (e.g. autocomplete, spell checker, IP routing).
`,
    },
  },
];

/**
 * Returns a topic based on date offset or cycle.
 */
export function getCurriculumForDate(date: Date = new Date()): PracticeTopic {
  // Compute day of year
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const index = Math.abs(dayOfYear) % CURRICULUM.length;
  return CURRICULUM[index];
}
