const mongooose = require('mongoose');
const redis = require('redis');
const util = require('util');

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
// We reinitialize client.hget instead of client.get, in order to find by "this.hashKey" and "key".
client.hget = util.promisify(client.hget);
const exec = mongooose.Query.prototype.exec;

mongooose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || ''); // ensure each hashKey is a string

  return this;
};

mongooose.Query.prototype.exec = async function () {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify({
    ...this.getQuery(),
    collection: this.mongooseCollection.name,
  });

  // Check if caching is enabled.
  //console.log('key: ', key);

  // See if we have a value for "key" in redis.
  // We use client.hget instead of client.get, in order to find by "this.hashKey" and "key".
  const cacheValue = await client.hget(this.hashKey, key);

  // If we do, return that.
  // Read data from redis.
  // It's raw data JSON.parse.
  // So each doc needs the this.model prototype interface.
  // So this.model instances are created.
  if (cacheValue) {
    const doc = JSON.parse(cacheValue);

    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);
  }

  // Otherwise, issue the query and store the result in redis
  const result = await exec.apply(this, arguments);

  // Store result in redis
  // We use client.hset instead of client.set, in order to set new result as a cache, by "this.hashKey" and "key".
  // client.set(this.hashKey, key, JSON.stringify(result), 'EX', 10); - expire in 10 seconds.
  // Write data in redis.
  client.hset(this.hashKey, key, JSON.stringify(result));

  return result;
};

module.exports = {
  clearCache(hashKey) {
    client.del(JSON.stringify(hashKey));
  },
};
