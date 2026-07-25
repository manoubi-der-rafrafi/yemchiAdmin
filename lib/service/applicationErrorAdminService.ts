import { connectDB } from "@/lib/config/db";
import ApplicationErrorModel from "@/lib/models/applicationError";

export type ApplicationErrorItem = {
  id: string;
  message: string;
  type: string;
  source: string;
  severity: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  role?: string;
  page?: string;
  endpoint?: string;
  httpStatus?: number;
  stackTrace?: string;
  metadata?: Record<string, unknown>;
  appVersion?: string;
  deviceType?: string;
  userAgent?: string;
  createdAt: string;
};

export type ApplicationErrorList = {
  items: ApplicationErrorItem[];
  page: number;
  size: number;
  total: number;
  pages: number;
};

type ListOptions = {
  page: number;
  size: number;
  source?: string;
  severity?: string;
  search?: string;
};

type ErrorFilter = {
  source?: string;
  severity?: string;
  $or?: Array<Record<string, RegExp>>;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const applicationErrorAdminService = {
  async collectAdmin(input: {
    message: string;
    type?: string;
    page?: string;
    stackTrace?: string;
    userId?: string;
    userEmail?: string;
  }): Promise<void> {
    await connectDB();
    await ApplicationErrorModel.create({
      message: sanitizeText(input.message, 1200) || "Erreur administration",
      type: sanitizeText(input.type, 100) || "javascript_error",
      source: "web_admin",
      severity: "error",
      page: sanitizePath(input.page),
      stackTrace: sanitizeText(input.stackTrace, 5000),
      userId: sanitizeText(input.userId, 100),
      userEmail: sanitizeText(input.userEmail, 200),
      deviceType: "browser",
      createdAt: new Date(),
    });
  },

  async list(options: ListOptions): Promise<ApplicationErrorList> {
    await connectDB();
    const page = Math.max(0, options.page);
    const size = Math.max(1, Math.min(100, options.size));
    const filter: ErrorFilter = {};

    if (options.source) filter.source = options.source;
    if (options.severity) filter.severity = options.severity;
    if (options.search?.trim()) {
      const expression = new RegExp(escapeRegExp(options.search.trim().slice(0, 100)), "i");
      filter.$or = [
        { message: expression },
        { type: expression },
        { userEmail: expression },
        { userName: expression },
        { endpoint: expression },
      ];
    }

    const [documents, total] = await Promise.all([
      ApplicationErrorModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(page * size)
        .limit(size)
        .lean(),
      ApplicationErrorModel.countDocuments(filter),
    ]);

    const items = documents.map((document) => ({
      ...document,
      id: String(document._id),
      _id: undefined,
      createdAt: new Date(document.createdAt).toISOString(),
    })) as ApplicationErrorItem[];

    return {
      items,
      page,
      size,
      total,
      pages: Math.max(1, Math.ceil(total / size)),
    };
  },
};

const sanitizePath = (value?: string) => sanitizeText(value?.split("?")[0], 300);

const sanitizeText = (value: string | undefined, max: number) => {
  if (!value) return undefined;
  return value
    .replace(/bearer\s+[a-z0-9._~+\-/]+=*/gi, "Bearer [REDACTED]")
    .replace(/\beyJ[a-z0-9_-]+\.[a-z0-9_-]+\.[a-z0-9_-]+\b/gi, "[REDACTED_TOKEN]")
    .replace(
      /(password|motDePasse|token|accessToken|refreshToken|authorization|secret)\s*[:=]\s*[^\s,;]+/gi,
      "$1=[REDACTED]",
    )
    .slice(0, max);
};
