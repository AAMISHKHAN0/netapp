import { startReminderWorker } from "./queues/reminder.worker";

console.log("Starting SmartISP Background Worker Process...");

try {
  startReminderWorker();
  console.log("SmartISP Worker process is actively running and listening to queues.");
} catch (err) {
  console.error("Worker startup error:", err);
}
