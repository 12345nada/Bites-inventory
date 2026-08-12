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
  waiters,
  has_drinks,
  created_at,
  updated_at,
  driver:staff!events_driver_fk (
    id,
    full_name
  ),
  event_waiters (
    waiter_id,
    waiter:staff!event_waiters_waiter_id_fkey (
      id,
      staff_code,
      full_name
    )
  )
`;

const getAutomaticEventStatus = ({
  date,
  startTime,
  endTime,
  status,
}) => {
  if (status === "Cancelled") {
    return "Cancelled";
  }

  if (!date || !startTime || !endTime) {
    return "Upcoming";
  }

  const now = new Date();
  const startDateTime = new Date(
    `${date}T${startTime}`
  );
  const endDateTime = new Date(
    `${date}T${endTime}`
  );

  if (now < startDateTime) {
    return "Upcoming";
  }

  if (now <= endDateTime) {
    return "In Progress";
  }

  return "Completed";
};

export const mapEventFromDatabase = (event) => {
  const assignedWaiters =
    event.event_waiters || [];

  return {
    id: event.id,
    eventCode:
      event.event_code ||
      `EVT-${String(event.id).padStart(3, "0")}`,
    name: event.event_type || "",
    client: event.client || "",
    date: event.event_date || "",
    departureTime:
      event.departure_time || "",
    startTime: event.start_time || "",
    endTime: event.end_time || "",
    location: event.location || "",
    area: event.area || "",
    branch: event.branch || "",
    driverId: event.driver_id || "",
    driver:
      event.driver?.full_name || "",
    waiterIds: assignedWaiters.map(
      (record) => record.waiter_id
    ),
    waiterNames: assignedWaiters
      .map(
        (record) =>
          record.waiter?.full_name || ""
      )
      .filter(Boolean),
    waiters: assignedWaiters.length,
    hasDrinks: Boolean(
      event.has_drinks
    ),
    status: getAutomaticEventStatus({
      date: event.event_date,
      startTime: event.start_time,
      endTime: event.end_time,
      status: event.status,
    }),
    createdAt: event.created_at,
    updatedAt: event.updated_at,
  };
};

const createEventPayload = (
  eventData
) => ({
  event_type: eventData.name.trim(),
  client: eventData.client.trim(),
  event_date: eventData.date,
  departure_time:
    eventData.departureTime,
  start_time: eventData.startTime,
  end_time: eventData.endTime,
  location: eventData.location.trim(),
  area: eventData.area.trim(),
  branch: eventData.branch,
  driver_id: eventData.driverId
    ? Number(eventData.driverId)
    : null,
  waiters: Array.isArray(
    eventData.waiterIds
  )
    ? eventData.waiterIds.length
    : 0,
  has_drinks: Boolean(
    eventData.hasDrinks
  ),
  status: getAutomaticEventStatus({
    date: eventData.date,
    startTime: eventData.startTime,
    endTime: eventData.endTime,
    status: eventData.status,
  }),
});

const createEventWaitersPayload = (
  eventId,
  waiterIds = []
) =>
  waiterIds.map((waiterId) => ({
    event_id: Number(eventId),
    waiter_id: Number(waiterId),
  }));

async function getEventById(eventId) {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_FIELDS)
    .eq("id", eventId)
    .single();

  if (error) {
    throw error;
  }

  return mapEventFromDatabase(data);
}

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

  return (data || []).map(
    mapEventFromDatabase
  );
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

export async function getActiveWaiters() {
  const { data, error } = await supabase
    .from("staff")
    .select(`
      id,
      staff_code,
      full_name
    `)
    .eq("staff_type", "Waiter")
    .eq("status", "Active")
    .order("full_name", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createEvent(
  eventData
) {
  const payload =
    createEventPayload(eventData);

  const {
    data: createdEvent,
    error: eventError,
  } = await supabase
    .from("events")
    .insert(payload)
    .select("id")
    .single();

  if (eventError) {
    throw eventError;
  }

  const waitersPayload =
    createEventWaitersPayload(
      createdEvent.id,
      eventData.waiterIds
    );

  if (waitersPayload.length > 0) {
    const { error: waitersError } =
      await supabase
        .from("event_waiters")
        .insert(waitersPayload);

    if (waitersError) {
      await supabase
        .from("events")
        .delete()
        .eq("id", createdEvent.id);

      throw waitersError;
    }
  }

  return getEventById(
    createdEvent.id
  );
}

export async function updateEvent(
  eventId,
  eventData
) {
  const {
    data: oldWaiterRows,
    error: oldWaitersError,
  } = await supabase
    .from("event_waiters")
    .select("waiter_id")
    .eq("event_id", eventId);

  if (oldWaitersError) {
    throw oldWaitersError;
  }

  const payload =
    createEventPayload(eventData);

  const { error: eventError } =
    await supabase
      .from("events")
      .update(payload)
      .eq("id", eventId);

  if (eventError) {
    throw eventError;
  }

  const { error: deleteError } =
    await supabase
      .from("event_waiters")
      .delete()
      .eq("event_id", eventId);

  if (deleteError) {
    throw deleteError;
  }

  const waitersPayload =
    createEventWaitersPayload(
      eventId,
      eventData.waiterIds
    );

  if (waitersPayload.length > 0) {
    const { error: insertError } =
      await supabase
        .from("event_waiters")
        .insert(waitersPayload);

    if (insertError) {
      const oldPayload =
        createEventWaitersPayload(
          eventId,
          (oldWaiterRows || []).map(
            (row) => row.waiter_id
          )
        );

      if (oldPayload.length > 0) {
        await supabase
          .from("event_waiters")
          .insert(oldPayload);
      }

      await supabase
        .from("events")
        .update({
          waiters:
            oldWaiterRows?.length || 0,
        })
        .eq("id", eventId);

      throw insertError;
    }
  }

  return getEventById(eventId);
}

export async function removeEvent(
  eventId
) {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (error) {
    throw error;
  }

  return true;
}
