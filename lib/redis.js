import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

let redis = null;

if (!global.redisClient) {
  if (REDIS_URL) {
    try {
      global.redisClient = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
      });
      global.redisClient.on('connect', () => console.log('Redis connected successfully'));
      global.redisClient.on('error', (err) => console.error('Redis client error:', err));
    } catch (e) {
      console.error('Failed to initialize Redis client:', e);
    }
  } else {
    console.warn('REDIS_URL is not defined. Caching will be disabled.');
  }
}
redis = global.redisClient;

export { redis };

/**
 * Cache or compute utility helper.
 * @param {string} key - Cache key
 * @param {function} computeFn - Async function to compute the value if cache miss
 * @param {number} ttlSeconds - Time to live in seconds
 */
export async function cacheOrCompute(key, computeFn, ttlSeconds = 300) {
  if (!redis) {
    return await computeFn();
  }

  try {
    const cachedVal = await redis.get(key);
    if (cachedVal) {
      console.log(`Cache hit for key: ${key}`);
      return JSON.parse(cachedVal);
    }
  } catch (error) {
    console.error(`Redis cache get error for key ${key}:`, error);
  }

  // Cache miss
  console.log(`Cache miss for key: ${key}. Computing value...`);
  const computedVal = await computeFn();

  try {
    await redis.set(key, JSON.stringify(computedVal), 'EX', ttlSeconds);
  } catch (error) {
    console.error(`Redis cache set error for key ${key}:`, error);
  }

  return computedVal;
}
