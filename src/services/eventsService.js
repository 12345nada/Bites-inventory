import { supabase } from "../lib/supabase";

const EVENT_FIELDS = `
  id,
  event_code,
  event_type,
  client,
  event_date,
  departure_time,
  start_time,
  end_time,
  location,
  area,
  branch,
  driver_id,
  status,
  created_at,
  updated_at,
  driver:staff!events_driver_fk (
    id,
    full_name
  )
`;

export const mapEventFromDatabase = (event) => ({
  id: event.id,
  eventCode:
    event.event_code ||
    `EVT-${String(event.id).padStart(3, "0")}`,
  name: event.event_type || "",
  client: event.client || "",
  date: event.event_date || "",
  departureTime: event.departure_time || "",
  startTime: event.start_time || "",
  endTime: event.end_time || "",
  location: event.location || "",
  area: event.area || "",
  branch: event.branch || "",
  driverId: event.driver_id || "",
  driver: event.driver?.full_name || "",
  status: event.status || "Upcoming",
  createdAt: event.created_at,
  updatedAt: event.updated_at,
});

const createEventPayload = (eventData) => ({
  event_type: eventData.name.trim(),
  client: eventData.client.trim(),
  event_date: eventData.date,
  departure_time: eventData.departureTime,
  start_time: eventData.startTime,
  end_time: eventData.endTime,
  location: eventData.location.trim(),
  area: eventData.area.trim(),
  branch: eventData.branch,
  driver_id: eventData.driverId
    ? Number(eventData.driverId)
    : null,
  status: eventData.status,
});

export async function getEvents() {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_FIELDS)
    .order("event_date", {
      ascending: true,
    })
    .order("start_time", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data || []).map(mapEventFromDatabase);
}

export async function getActiveDrivers() {
  const { data, error } = await supabase
    .from("staff")
    .select(`
      id,
      staff_code,
      full_name
    `)
    .eq("staff_type", "Driver")
    .eq("status", "Active")
    .order("full_name", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createEvent(eventData) {
  const payload = createEventPayload(eventData);

  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select(EVENT_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return mapEventFromDatabase(data);
}

export async function updateEvent(
  eventId,
  eventData
) {
  const payload = createEventPayload(eventData);

  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", eventId)
    .select(EVENT_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return mapEventFromDatabase(data);
}

export async function removeEvent(eventId) {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (error) {
    throw error;
  }

  return true;
}
