import { connectDB } from "@/lib/config/db";
import UserPositionHistoryModel from "@/lib/models/userPositionHistory";
import UserConnectionSessionModel from "@/lib/models/userConnectionSession";

type Range = { from?: Date; to?: Date; limit?: number };

const dateFilter = (field: string, range: Range) => {
  const value: Record<string, Date> = {};
  if (range.from) value.$gte = range.from;
  if (range.to) value.$lte = range.to;
  return Object.keys(value).length ? { [field]: value } : {};
};

export const trackingAdminService = {
  async history(userId: string, range: Range = {}) {
    await connectDB();
    const limit = Math.min(Math.max(range.limit ?? 2000, 1), 5000);
    const [positions, connections] = await Promise.all([
      UserPositionHistoryModel.find({ userId, ...dateFilter("collectedAt", range) })
        .sort({ collectedAt: 1 }).limit(limit).lean(),
      UserConnectionSessionModel.find({ userId, ...dateFilter("connectedAt", range) })
        .sort({ connectedAt: -1 }).limit(500).lean(),
    ]);

    return {
      positions: positions.map((position) => ({
        id: String(position._id),
        latitude: position.location?.coordinates?.[1] ?? null,
        longitude: position.location?.coordinates?.[0] ?? null,
        accuracyMeters: position.accuracyMeters ?? null,
        speedMetersPerSecond: position.speedMetersPerSecond ?? null,
        headingDegrees: position.headingDegrees ?? null,
        collectedAt: position.collectedAt?.toISOString(),
        commandeId: position.commandeId ?? null,
      })),
      connections: connections.map((session) => ({
        id: String(session._id),
        connectedAt: session.connectedAt?.toISOString(),
        lastHeartbeatAt: session.lastHeartbeatAt?.toISOString(),
        disconnectedAt: session.disconnectedAt?.toISOString() ?? null,
        endReason: session.endReason ?? null,
        appType: session.appType ?? null,
        durationSeconds: Math.max(0, Math.round(
          ((session.disconnectedAt ?? session.lastHeartbeatAt).getTime() - session.connectedAt.getTime()) / 1000,
        )),
      })),
    };
  },
};
