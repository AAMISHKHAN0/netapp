export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface NotificationProvider {
  send(to: string, message: string): Promise<DeliveryResult>;
}

export class EvolutionApiProvider implements NotificationProvider {
  private baseUrl: string;
  private apiKey: string;
  private instanceName: string;

  constructor(options?: { baseUrl?: string; apiKey?: string; instanceName?: string }) {
    this.baseUrl = options?.baseUrl || process.env.EVOLUTION_API_URL || "http://localhost:8080";
    this.apiKey = options?.apiKey || process.env.EVOLUTION_API_KEY || "smartisp_evolution_secret_key";
    this.instanceName = options?.instanceName || process.env.EVOLUTION_INSTANCE_NAME || "smartisp_main";
  }

  async send(to: string, message: string): Promise<DeliveryResult> {
    // Sanitize phone number (e.g. 03001234567 -> 923001234567)
    let formattedPhone = to.replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "92" + formattedPhone.substring(1);
    }

    try {
      const endpoint = `${this.baseUrl}/message/sendText/${this.instanceName}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this.apiKey,
        },
        body: JSON.stringify({
          number: formattedPhone,
          options: {
            delay: 1200,
            presence: "composing",
            linkPreview: false,
          },
          textMessage: {
            text: message,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: `Evolution API HTTP ${response.status}: ${errText}` };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.key?.id || `evo_${Date.now()}`,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to reach Evolution API instance",
      };
    }
  }
}
