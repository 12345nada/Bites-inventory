import { supabase } from "../lib/supabase";

const EVENT_FIELDS = `
  id,
  event_code,
  event_type,
  client,
  event_date,
  start_time,
  end_time,
  location,
  area,
  branch,
  status,
  waiters,
  has_drinks,
  driver_id,
  driver:staff!events_driver_fk (
    id,
    full_name
  )
`;

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "-";
  }

  return new Date(
    `${dateValue}T00:00:00`
  ).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (timeValue) => {
  if (!timeValue) {
    return "";
  }

  const [hours, minutes] =
    timeValue.split(":");

  return new Date(
    2000,
    0,
    1,
    Number(hours),
    Number(minutes)
  ).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const mapDashboardEvent = (event) => ({
  id: event.id,
  eventCode:
    event.event_code ||
    `EVT-${String(event.id).padStart(3, "0")}`,
  eventType:
    event.event_type || "Event",
  name: event.event_type || "Event",
  client: event.client || "",
  rawDate: event.event_date || "",
  date: formatDate(event.event_date),
  time: formatTime(event.start_time),
  startTime: formatTime(
    event.start_time
  ),
  endTime: formatTime(event.end_time),
  location: event.location || "",
  area: event.area || "",
  branch: event.branch || "",
  driver:
    event.driver?.full_name ||
    "Not Assigned",
  status: event.status || "Upcoming",
  waiters: Number(event.waiters || 0),
  hasDrinks: Boolean(event.has_drinks),
});

export async function getDashboardData() {
  const {
    data: authData,
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  const userId = authData.user?.id;

  const [
    profileResult,
    eventsResult,
    inventoryResult,
    returnItemsResult,
  ] = await Promise.all([
    userId
      ? supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),

    supabase
      .from("events")
      .select(EVENT_FIELDS)
      .order("event_date", {
        ascending: true,
      })
      .order("start_time", {
        ascending: true,
      }),

    supabase
      .from("inventory_report")
      .select("available_stock_value"),

    supabase
      .from("return_items")
      .select(`
        returned_quantity,
        damaged_quantity,
        missing_quantity
      `),
  ]);

  const firstError =
    profileResult.error ||
    eventsResult.error ||
    inventoryResult.error ||
    returnItemsResult.error;

  if (firstError) {
    throw firstError;
  }

  const events = (
    eventsResult.data || []
  ).map(mapDashboardEvent);

  const totalInventoryCost = (
    inventoryResult.data || []
  ).reduce(
    (total, row) =>
      total +
      Number(
        row.available_stock_value || 0
      ),
    0
  );

  const returnTotals = (
    returnItemsResult.data || []
  ).reduce(
    (totals, item) => {
      totals.returned += Number(
        item.returned_quantity || 0
      );

      totals.damaged += Number(
        item.damaged_quantity || 0
      );

      totals.missing += Number(
        item.missing_quantity || 0
      );

      return totals;
    },
    {
      returned: 0,
      damaged: 0,
      missing: 0,
    }
  );

  return {
    fullName:
      profileResult.data?.full_name ||
      "Admin",
    events,
    totalInventoryCost,
    returnTotals,
  };
}
