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
  driver_rate_at_event,
  head_driver_id,
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
    head_waiter_id,
    rate_at_event,
    attendance_status,
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

async function getDriverSnapshot(
  driverId
) {
  if (!driverId) {
    return {
      driver_rate_at_event: 0,
      head_driver_id: null,
    };
  }

  const {
    data: driver,
    error: driverError,
  } = await supabase
    .from("staff")
    .select(`
      id,
      event_rate,
      staff_role,
      reports_to_id
    `)
    .eq("id", Number(driverId))
    .single();

  if (driverError) {
    throw driverError;
  }

  if (
    driver.staff_role === "Head Driver" ||
    !driver.reports_to_id
  ) {
    return {
      driver_rate_at_event:
        Number(driver.event_rate || 0),
      head_driver_id:
        Number(driver.id),
    };
  }

  const {
    data: headDriver,
    error: headDriverError,
  } = await supabase
    .from("staff")
    .select(`
      id,
      event_rate
    `)
    .eq(
      "id",
      Number(driver.reports_to_id)
    )
    .single();

  if (headDriverError) {
    throw headDriverError;
  }

  return {
    driver_rate_at_event:
      Number(driver.event_rate || 0) +
      Number(headDriver.event_rate || 0),
    head_driver_id:
      Number(headDriver.id),
  };
}

async function createEventWaitersPayload(
  eventId,
  waiterIds = []
) {
  const normalizedIds = [
    ...new Set(
      (waiterIds || [])
        .map(Number)
        .filter(Boolean)
    ),
  ];

  if (normalizedIds.length === 0) {
    return [];
  }

  const {
    data: selectedWaiters,
    error,
  } = await supabase
    .from("staff")
    .select(`
      id,
      event_rate,
      staff_role,
      reports_to_id
    `)
    .in("id", normalizedIds)
    .eq("staff_type", "Waiter");

  if (error) {
    throw error;
  }

  const requiredHeadIds = [
    ...new Set(
      (selectedWaiters || [])
        .filter(
          (waiter) =>
            waiter.staff_role !==
              "Head Waiter" &&
            waiter.reports_to_id
        )
        .map((waiter) =>
          Number(waiter.reports_to_id)
        )
    ),
  ];

  const selectedIdSet = new Set(
    (selectedWaiters || []).map(
      (waiter) => Number(waiter.id)
    )
  );

  const missingHeadIds =
    requiredHeadIds.filter(
      (id) => !selectedIdSet.has(id)
    );

  let missingHeads = [];

  if (missingHeadIds.length > 0) {
    const {
      data: headData,
      error: headError,
    } = await supabase
      .from("staff")
      .select(`
        id,
        event_rate,
        staff_role,
        reports_to_id
      `)
      .in("id", missingHeadIds)
      .eq("staff_type", "Waiter");

    if (headError) {
      throw headError;
    }

    missingHeads = headData || [];
  }

  return [
    ...(selectedWaiters || []),
    ...missingHeads,
  ].map((waiter) => ({
    event_id: Number(eventId),
    waiter_id: Number(waiter.id),
    head_waiter_id:
      waiter.staff_role ===
        "Head Waiter"
        ? Number(waiter.id)
        : waiter.reports_to_id
          ? Number(
              waiter.reports_to_id
            )
          : Number(waiter.id),
    rate_at_event:
      Number(waiter.event_rate || 0),
    attendance_status:
      "Assigned",
  }));
}

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

const attachHeadNames = (rows = []) => {
  const nameMap = new Map(
    rows.map((row) => [
      Number(row.id),
      row.full_name || "",
    ])
  );

  return rows.map((row) => ({
    ...row,
    reports_to_name:
      row.reports_to_id
        ? nameMap.get(
            Number(row.reports_to_id)
          ) || ""
        : "",
  }));
};

export async function getActiveDrivers() {
  const { data, error } = await supabase
    .from("staff")
    .select(`
      id,
      staff_code,
      full_name,
      branch,
      event_rate,
      staff_role,
      reports_to_id
    `)
    .eq("staff_type", "Driver")
    .eq("status", "Active")
    .order("full_name", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return attachHeadNames(data || []);
}

export async function getActiveWaiters() {
  const { data, error } = await supabase
    .from("staff")
    .select(`
      id,
      staff_code,
      full_name,
      branch,
      event_rate,
      staff_role,
      reports_to_id
    `)
    .eq("staff_type", "Waiter")
    .eq("status", "Active")
    .order("full_name", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return attachHeadNames(data || []);
}

export async function createEvent(
  eventData
) {
  const driverSnapshot =
    await getDriverSnapshot(
      eventData.driverId
    );

  const payload = {
    ...createEventPayload(eventData),
    ...driverSnapshot,
  };

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
    await createEventWaitersPayload(
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

    await supabase
      .from("events")
      .update({
        waiters:
          waitersPayload.length,
      })
      .eq("id", createdEvent.id);
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
    .select(`
      waiter_id,
      head_waiter_id,
      rate_at_event,
      attendance_status
    `)
    .eq("event_id", eventId);

  if (oldWaitersError) {
    throw oldWaitersError;
  }

  const driverSnapshot =
    await getDriverSnapshot(
      eventData.driverId
    );

  const payload = {
    ...createEventPayload(eventData),
    ...driverSnapshot,
  };

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
    await createEventWaitersPayload(
      eventId,
      eventData.waiterIds
    );

  if (waitersPayload.length > 0) {
    const { error: insertError } =
      await supabase
        .from("event_waiters")
        .insert(waitersPayload);

    if (insertError) {
      if (
        (oldWaiterRows || []).length > 0
      ) {
        await supabase
          .from("event_waiters")
          .insert(
            (oldWaiterRows || []).map(
              (row) => ({
                event_id:
                  Number(eventId),
                waiter_id:
                  row.waiter_id,
                head_waiter_id:
                  row.head_waiter_id,
                rate_at_event:
                  row.rate_at_event,
                attendance_status:
                  row.attendance_status ||
                  "Assigned",
              })
            )
          );
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

  await supabase
    .from("events")
    .update({
      waiters:
        waitersPayload.length,
    })
    .eq("id", eventId);

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


export async function getEventDetailsSheet(
  eventId
) {
  const [
    eventResult,
    waiterRowsResult,
  ] = await Promise.all([
    supabase
      .from("events")
      .select(`
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
        status,
        has_drinks,
        driver_id,
        driver_rate_at_event,
        head_driver_id
      `)
      .eq("id", Number(eventId))
      .single(),

    supabase
      .from("event_waiters")
      .select(`
        waiter_id,
        head_waiter_id,
        rate_at_event,
        attendance_status
      `)
      .eq("event_id", Number(eventId)),
  ]);

  const firstError =
    eventResult.error ||
    waiterRowsResult.error;

  if (firstError) {
    throw firstError;
  }

  const event = eventResult.data;
  const waiterRows =
    waiterRowsResult.data || [];

  const staffIds = [
    event.driver_id,
    event.head_driver_id,
    ...waiterRows.map(
      (row) => row.waiter_id
    ),
    ...waiterRows.map(
      (row) => row.head_waiter_id
    ),
  ]
    .map(Number)
    .filter(Boolean);

  const uniqueStaffIds = [
    ...new Set(staffIds),
  ];

  let staffRows = [];

  if (uniqueStaffIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from("staff")
      .select(`
        id,
        staff_code,
        staff_type,
        full_name,
        staff_role,
        reports_to_id,
        event_rate
      `)
      .in("id", uniqueStaffIds);

    if (error) {
      throw error;
    }

    staffRows = data || [];
  }

  const staffMap = new Map(
    staffRows.map((staff) => [
      Number(staff.id),
      staff,
    ])
  );

  const waiters = waiterRows.map(
    (row) => {
      const waiter = staffMap.get(
        Number(row.waiter_id)
      );

      const headWaiterId = Number(
        row.head_waiter_id ||
          row.waiter_id
      );

      const headWaiter =
        staffMap.get(headWaiterId);

      const attendance =
        row.attendance_status ||
        "Assigned";

      const eventRate = Number(
        row.rate_at_event || 0
      );

      return {
        id: Number(row.waiter_id),
        staffCode:
          waiter?.staff_code || "",
        name:
          waiter?.full_name || "",
        role:
          waiter?.staff_role ||
          (Number(row.waiter_id) ===
          headWaiterId
            ? "Head Waiter"
            : "Waiter"),
        reportsTo:
          Number(row.waiter_id) ===
          headWaiterId
            ? ""
            : headWaiter?.full_name ||
              "",
        attendance,
        eventRate,
        payableAmount:
          attendance === "Absent"
            ? 0
            : eventRate,
      };
    }
  );

  const waiterTotal = waiters.reduce(
    (total, waiter) =>
      total +
      Number(
        waiter.payableAmount || 0
      ),
    0
  );

  const driver = event.driver_id
    ? staffMap.get(
        Number(event.driver_id)
      )
    : null;

  const headDriverId = Number(
    event.head_driver_id ||
      driver?.reports_to_id ||
      event.driver_id ||
      0
  );

  const headDriver = headDriverId
    ? staffMap.get(headDriverId)
    : null;

  const driverDetails = driver
    ? {
        id: Number(driver.id),
        staffCode:
          driver.staff_code || "",
        name:
          driver.full_name || "",
        role:
          driver.staff_role ||
          "Driver",
        reportsTo:
          headDriver &&
          Number(headDriver.id) !==
            Number(driver.id)
            ? headDriver.full_name ||
              ""
            : "",
        paymentTo:
          headDriver?.full_name ||
          driver.full_name ||
          "",
        eventAmount: Number(
          event.driver_rate_at_event ||
            0
        ),
      }
    : null;

  const driverTotal = Number(
    event.driver_rate_at_event || 0
  );

  return {
    eventId: event.id,
    eventCode:
      event.event_code ||
      `EVT-${String(
        event.id
      ).padStart(3, "0")}`,
    eventName:
      event.event_type || "Event",
    client: event.client || "",
    date: event.event_date || "",
    departureTime:
      event.departure_time || "",
    startTime:
      event.start_time || "",
    endTime:
      event.end_time || "",
    location:
      event.location || "",
    area: event.area || "",
    branch: event.branch || "",
    status: event.status || "",
    hasDrinks: Boolean(
      event.has_drinks
    ),
    waiters,
    waiterTotal,
    driver: driverDetails,
    driverTotal,
    totalStaffCost:
      waiterTotal + driverTotal,
  };
}
