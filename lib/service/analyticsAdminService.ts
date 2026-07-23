import { connectDB } from "@/lib/config/db";
import AnalyticsEventModel from "@/lib/models/analyticsEvent";

type CountItem = { _id: string; count: number };

export type AnalyticsOverview = {
  from: string;
  to: string;
  totalEvents: number;
  uniqueVisitors: number;
  sessions: number;
  orders: number;
  conversionRate: number;
  checkoutAbandonmentRate: number;
  eventsByName: Record<string, number>;
  eventsByPlatform: Record<string, number>;
};

export const analyticsAdminService = {
  async overview(from: Date, to: Date): Promise<AnalyticsOverview> {
    await connectDB();
    const [result] = await AnalyticsEventModel.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      {
        $facet: {
          summary: [{
            $group: {
              _id: null,
              totalEvents: { $sum: 1 },
              visitors: { $addToSet: { $ifNull: ["$visitorId", { $ifNull: ["$installationId", "$userId"] }] } },
              sessions: { $addToSet: "$sessionId" },
            },
          }],
          byEvent: [{ $group: { _id: "$eventName", count: { $sum: 1 } } }, { $sort: { count: -1 } }],
          byPlatform: [{ $group: { _id: "$platform", count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        },
      },
    ]);

    const summary = result?.summary?.[0] ?? { totalEvents: 0, visitors: [], sessions: [] };
    const asRecord = (items: CountItem[] = []) => Object.fromEntries(
      items.filter((item) => item._id).map((item) => [item._id, item.count]),
    );
    const eventsByName = asRecord(result?.byEvent);
    const eventsByPlatform = asRecord(result?.byPlatform);
    const visitors = (summary.visitors as unknown[]).filter(Boolean).length;
    const sessions = (summary.sessions as unknown[]).filter(Boolean).length;
    const orders = eventsByName.place_order ?? 0;
    const checkouts = eventsByName.start_checkout ?? 0;

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      totalEvents: summary.totalEvents,
      uniqueVisitors: visitors,
      sessions,
      orders,
      conversionRate: visitors ? (orders / visitors) * 100 : 0,
      checkoutAbandonmentRate: checkouts ? Math.max(0, ((checkouts - orders) / checkouts) * 100) : 0,
      eventsByName,
      eventsByPlatform,
    };
  },
};
