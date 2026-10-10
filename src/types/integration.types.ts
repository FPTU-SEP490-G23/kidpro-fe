export type PaymentProvider = 'VIETQR' | 'PAYOS' | 'SEPAY';
export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
export type SmsProvider = 'VIETGUYS' | 'ESMS' | 'ZALO_ZNS';

export interface PaymentIntegrationConfig {
  merchantId: string;
  secretKey: string;
  checksumKey: string;
  webhookUrl: string;
  provider: PaymentProvider;
  status: ConnectionStatus;
  lastTestedAt?: string;
}

export interface FirebaseCertificateData {
  type?: string;
  project_id: string;
  private_key_id?: string;
  private_key: string;
  client_email: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
}

export interface FirebaseIntegrationConfig {
  projectId: string;
  clientEmail: string;
  fcmServerKey?: string;
  enabled: boolean;
  uploadedFileName?: string;
  uploadedAt?: string;
  status: ConnectionStatus;
  lastTestedAt?: string;
}

export interface AiServiceIntegrationConfig {
  baseUrl: string;
  apiKey: string;
  threshold: number; // 0.5 - 1.0 (mặc định 0.75 - 75%)
  status: ConnectionStatus;
  latencyMs?: number;
  lastTestedAt?: string;
}

export interface SmsIntegrationConfig {
  providerApiKey: string;
  brandName: string;
  rateLimitPerHour: number; // BR-003: Giới hạn số SMS gửi mỗi giờ
  provider: SmsProvider;
  status: ConnectionStatus;
  sentTodayCount?: number;
  lastTestedAt?: string;
}

export interface PlatformIntegrations {
  payment: PaymentIntegrationConfig;
  firebase: FirebaseIntegrationConfig;
  aiService: AiServiceIntegrationConfig;
  sms: SmsIntegrationConfig;
}

export interface AiPingResult {
  status: 'CONNECTED' | 'DISCONNECTED';
  latencyMs: number;
  message?: string;
}

export interface WebhookTestResult {
  success: boolean;
  statusCode: number;
  message: string;
  signatureVerified: boolean;
}

export interface TestSmsResult {
  success: boolean;
  messageId?: string;
  message: string;
  remainingQuota?: number;
}
