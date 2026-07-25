import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { prisma } from "@smartisp/database";
import { getNotificationProvider, renderTemplate } from "@smartisp/notifications";

const redisUrl = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || "redis://localhost:6379";
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

export function startReminderWorker() {
  const worker = new Worker(
    "notification-send",
    async (job: Job) => {
      const { notificationId } = job.data;
      if (!notificationId) return;

      const record = await prisma.notificationQueue.findUnique({
        where: { id: notificationId },
        include: { customer: true },
      });

      if (!record || record.status === "DELIVERED" || record.status === "SENT") {
        return;
      }

      const phone = record.customer.whatsapp || record.customer.phone;
      const message = renderTemplate(record.templateKey, record.payload as Record<string, string>);

      const provider = getNotificationProvider();
      const result = await provider.send(phone, message);

      if (result.success) {
        await prisma.notificationQueue.update({
          where: { id: notificationId },
          data: {
            status: "SENT",
            sentAt: new Date(),
            attempts: record.attempts + 1,
          },
        });
        console.log(`[Worker] Reminder sent to customer ${record.customer.name} (${phone})`);
      } else {
        await prisma.notificationQueue.update({
          where: { id: notificationId },
          data: {
            status: "FAILED",
            attempts: record.attempts + 1,
          },
        });
        console.error(`[Worker] Reminder failed to send to ${phone}: ${result.error}`);
        throw new Error(result.error || "Sending failed");
      }
    },
    { connection, concurrency: 5 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[BullMQ] Job ${job?.id} failed with error ${err.message}`);
  });

  console.log("[Worker] Reminder worker initialized successfully");
  return worker;
}
