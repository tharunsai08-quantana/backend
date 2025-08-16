// queueManager.js
const redis = require("redis");

const client = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

client.connect();

const ACTIVE_KEY = "queue:active";
const WAITING_KEY = "queue:waiting";
const ACTIVE_LIMIT = 2; 

const enqueueUser = async (userId) => {
  await client.rPush(WAITING_KEY, userId);
};

const dequeueUser = async () => {
  return await client.lPop(WAITING_KEY);
};

const activateUser = async (userId) => {
  await client.sAdd(ACTIVE_KEY, userId);
  await client.set(`userActiveSince:${userId}`, Date.now(), { EX: 300 }); 
};

const deactivateUser = async (userId) => {
  await client.sRem(ACTIVE_KEY, userId);
  await client.del(`userActiveSince:${userId}`);
};

const getActiveCount = async () => {
  return await client.sCard(ACTIVE_KEY);
};

const getActiveUsers = async () => {
  return await client.sMembers(ACTIVE_KEY);
};

const getQueueLength = async () => {
  return await client.lLen(WAITING_KEY);
};

const isActiveUser = async (userId) => {
  const members = await getActiveUsers();
  return members.includes(userId);
};

module.exports = {
  enqueueUser,
  dequeueUser,
  activateUser,
  deactivateUser,
  getActiveCount,
  getActiveUsers,
  getQueueLength,
  isActiveUser,
  ACTIVE_LIMIT,
  WAITING_KEY,
  client,
};
