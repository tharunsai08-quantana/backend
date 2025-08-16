const UserForm = require("../Models/UserForm");
const crypto = require("crypto");
const queueManager = require("./queueManager");

const userTimers = new Map();
const FIVE_MINUTES = 5 * 60 * 1000;

const getUserQueuePosition = async (userId) => {
  const queue = await queueManager.client.lRange(queueManager.WAITING_KEY, 0, -1);
  const position = queue.indexOf(userId);
  return position >= 0 ? position + 1 : null;
};

async function admitUser(userId, io) {
  await queueManager.activateUser(userId);
  io.emit("queueUpdated", {
    queueLength: await queueManager.getQueueLength(),
    activeCount: await queueManager.getActiveCount(),
    waitingList: await queueManager.client.lRange(queueManager.WAITING_KEY, 0, -1),
  });

  if (userTimers.has(userId)) clearTimeout(userTimers.get(userId));
  const timer = setTimeout(async () => {
    if (await queueManager.isActiveUser(userId)) {
      await queueManager.deactivateUser(userId);
      userTimers.delete(userId);

      const nextUserId = await queueManager.dequeueUser();
      if (nextUserId) await admitUser(nextUserId, io);

      io.emit("queueUpdated", {
        queueLength: await queueManager.getQueueLength(),
        activeCount: await queueManager.getActiveCount(),
        waitingList: await queueManager.client.lRange(queueManager.WAITING_KEY, 0, -1),
      });
      io.to(userId).emit("timeUp", { message: "Your 5-minute slot expired" });
    }
  }, FIVE_MINUTES);
  userTimers.set(userId, timer);
}

exports.enterForm = async (req, res) => {
  try {
    const io = req.app.get("socketio");
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    // Check if user already active
    if (await queueManager.isActiveUser(userId)) {
      return res.json({ status: "active", message: "You are already active." });
    }

    // Check if user already in waiting queue
    const waitingList = await queueManager.client.lRange(queueManager.WAITING_KEY, 0, -1);
    if (waitingList.includes(userId)) {
      const queuePos = waitingList.indexOf(userId) + 1;
      return res.json({
        status: "waiting",
        message: `You are already in the queue at position ${queuePos}`,
        position: queuePos,
      });
    }

    // If not active or waiting, proceed to admit or enqueue
    const activeCount = await queueManager.getActiveCount();
    if (activeCount < queueManager.ACTIVE_LIMIT) {
      await admitUser(userId, io);
      return res.json({ status: "active", message: "You can fill the form now" });
    } else {
      await queueManager.enqueueUser(userId);
      const updatedWaiting = await queueManager.client.lRange(queueManager.WAITING_KEY, 0, -1);
      const queuePos = updatedWaiting.indexOf(userId) + 1;

      io.emit("queueUpdated", {
        queueLength: await queueManager.getQueueLength(),
        activeCount: await queueManager.getActiveCount(),
        waitingList: updatedWaiting,
      });

      return res.json({
        status: "waiting",
        message: `Please wait. Queue position: ${queuePos}`,
        position: queuePos,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to join the queue." });
  }
};

exports.submitForm = async (req, res) => {
  try {
    const { memberCount, members, userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!members || !Array.isArray(members) || !memberCount) {
      return res.status(400).json({ error: "Missing member info" });
    }
    const code = crypto.randomBytes(3).toString("hex");
    const userForm = new UserForm({ code, memberCount, members });
    await userForm.save();

    if (userTimers.has(userId)) {
      clearTimeout(userTimers.get(userId));
      userTimers.delete(userId);
    }
    await queueManager.deactivateUser(userId);

    const io = req.app.get("socketio");
    const nextUserId = await queueManager.dequeueUser();
    if (nextUserId) {
      await admitUser(nextUserId, io);
    }
    io.emit("queueUpdated", {
      queueLength: await queueManager.getQueueLength(),
      activeCount: await queueManager.getActiveCount(),
      waitingList: await queueManager.client.lRange(queueManager.WAITING_KEY, 0, -1),
    });

    return res.json({ success: true, code, message: "Form submitted!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Form submission failed" });
  }
};

exports.leaveForm = async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (userTimers.has(userId)) {
      clearTimeout(userTimers.get(userId));
      userTimers.delete(userId);
    }
    await queueManager.deactivateUser(userId);

    const io = req.app.get("socketio");
    const nextUserId = await queueManager.dequeueUser();
    if (nextUserId) {
      await admitUser(nextUserId, io);
    }
    io.emit("queueUpdated", {
      queueLength: await queueManager.getQueueLength(),
      activeCount: await queueManager.getActiveCount(),
      waitingList: await queueManager.client.lRange(queueManager.WAITING_KEY, 0, -1),
    });

    return res.json({ message: "You have left the form" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to leave the form" });
  }
};
