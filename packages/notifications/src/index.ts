import { EvolutionApiProvider, NotificationProvider, DeliveryResult } from "./providers/evolution";

export * from "./providers/evolution";

export const NOTIFICATION_TEMPLATES: Record<string, string> = {
  BEFORE_DUE: "Dear {{name}}, your internet bill of {{amount}} is due on {{date}}. Please pay before the due date to ensure uninterrupted service. Thank you!",
  DUE_TODAY: "Dear {{name}}, your internet bill of {{amount}} is due TODAY ({{date}}). Please pay to avoid service suspension. Thank you!",
  OVERDUE: "NOTICE: Dear {{name}}, your internet bill of {{amount}} was due on {{date}} and is now OVERDUE. Please clear your balance immediately to prevent disconnection.",
  PAYMENT_RECEIVED: "Payment Received! Dear {{name}}, we have received your payment of {{amount}} on {{date}}. Receipt Ref: {{ref}}. Thank you for choosing SmartISP!",
};

export function renderTemplate(templateKey: string, variables: Record<string, string>): string {
  let text = NOTIFICATION_TEMPLATES[templateKey] || templateKey;
  for (const [key, val] of Object.entries(variables)) {
    text = text.replace(new RegExp(`{{${key}}}`, "g"), val);
  }
  return text;
}

export function getNotificationProvider(): NotificationProvider {
  return new EvolutionApiProvider();
}
