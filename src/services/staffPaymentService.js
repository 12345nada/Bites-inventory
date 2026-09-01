import { supabase } from "../lib/supabase";

const isCompletedEvent = (event) => {
  if (
    event.status === "Cancelled" ||
    !event.event_date ||
    !event.end_time
  ) {
    return false;
  }

  const endDateTime = new Date(
    `${event.event_date}T${event.end_time}`
  );

  return new Date() > endDateTime;
};

const getPaymentStatus = (amount, paidAmount) => {
  const total = Number(amount || 0);
  const paid = Math.min(
    Math.max(Number(paidAmount || 0), 0),
    total
  );

  if (total <= 0 || paid >= total) {
    return "Paid";
  }

  if (paid > 0) {
    return "Partial";
  }

  return "Pending";
};

export async function getStaffPayments() {
  const [
    eventsResult,
    eventWaitersResult,
    staffResult,
    savedPaymentsResult,
  ] = await Promise.all([
    supabase
      .from("events")
      .select(`
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
        driver_id,
        driver_rate_at_event,
        head_driver_id
      `)
      .neq("status", "Cancelled")
      .order("event_date", {
        ascending: false,
      }),

    supabase
      .from("event_waiters")
      .select(`
        event_id,
        waiter_id,
        head_waiter_id,
        rate_at_event,
        attendance_status
      `),

    supabase
      .from("staff")
      .select(`
        id,
        staff_type,
        full_name,
        event_rate,
        staff_role,
        reports_to_id
      `),

    supabase
      .from("staff_payments")
      .select(`
        id,
        staff_id,
        event_id,
        amount,
        paid_amount,
        status,
        paid_at,
        created_at
      `),
  ]);

  const firstError =
    eventsResult.error ||
    eventWaitersResult.error ||
    staffResult.error ||
    savedPaymentsResult.error;

  if (firstError) {
    throw firstError;
  }

  const events = (
    eventsResult.data || []
  ).filter(isCompletedEvent);

  const eventWaiters =
    eventWaitersResult.data || [];

  const staff = staffResult.data || [];
  const savedPayments =
    savedPaymentsResult.data || [];

  const staffMap = new Map(
    staff.map((record) => [
      Number(record.id),
      record,
    ])
  );

  const savedPaymentMap = new Map(
    savedPayments.map((payment) => [
      `${Number(payment.staff_id)}-${Number(
        payment.event_id
      )}`,
      payment,
    ])
  );

  const payments = [];

  events.forEach((event) => {
    const waiterRows = eventWaiters.filter(
      (row) =>
        Number(row.event_id) ===
          Number(event.id) &&
        row.attendance_status !== "Absent"
    );

    const eventWaiterDetails =
      waiterRows.map((row) => {
        const waiter = staffMap.get(
          Number(row.waiter_id)
        );

        const headWaiterId = Number(
          row.head_waiter_id ||
            row.waiter_id
        );

        const headWaiter = staffMap.get(
          headWaiterId
        );

        return {
          id: Number(row.waiter_id),
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
          attendance:
            row.attendance_status ||
            "Assigned",
          rate: Number(
            row.rate_at_event || 0
          ),
        };
      });

    const waiterTotal =
      eventWaiterDetails.reduce(
        (total, waiter) =>
          total +
          Number(waiter.rate || 0),
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

    const driverTotal = Number(
      event.driver_rate_at_event || 0
    );

    const eventDetails = {
      eventId: event.id,
      eventCode:
        event.event_code ||
        `EVT-${String(
          event.id
        ).padStart(3, "0")}`,
      eventName:
        event.event_type || "Event",
      client: event.client || "",
      eventDate:
        event.event_date || "",
      startTime:
        event.start_time || "",
      endTime:
        event.end_time || "",
      location:
        event.location || "",
      area: event.area || "",
      branch: event.branch || "",
      waiters: eventWaiterDetails,
      waiterTotal,
      driver: driver
        ? {
            id: Number(driver.id),
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
            payTo:
              headDriver?.full_name ||
              driver.full_name ||
              "",
          }
        : null,
      driverTotal,
      grandTotal:
        waiterTotal + driverTotal,
    };

    const waiterGroups = new Map();

    waiterRows.forEach((row) => {
      const recipientId = Number(
        row.head_waiter_id ||
          row.waiter_id
      );

      if (!recipientId) {
        return;
      }

      const current =
        waiterGroups.get(recipientId) || 0;

      waiterGroups.set(
        recipientId,
        current +
          Number(row.rate_at_event || 0)
      );
    });

    waiterGroups.forEach(
      (amount, recipientId) => {
        const recipient =
          staffMap.get(recipientId);

        if (!recipient) {
          return;
        }

        const saved =
          savedPaymentMap.get(
            `${recipientId}-${Number(
              event.id
            )}`
          );

        const totalAmount = Number(
          saved?.amount ?? amount
        );
        const paidAmount = Number(
          saved?.paid_amount ??
            (saved?.status === "Paid"
              ? totalAmount
              : 0)
        );

        payments.push({
          id:
            saved?.id ||
            `waiter-${event.id}-${recipientId}`,
          staffId: recipientId,
          staffName:
            recipient.full_name || "",
          staffType: "Waiter",
          staffRole:
            recipient.staff_role ||
            "Head Waiter",
          eventId: event.id,
          eventCode:
            event.event_code ||
            `EVT-${String(
              event.id
            ).padStart(3, "0")}`,
          eventName:
            event.event_type || "Event",
          eventDate:
            event.event_date || "",
          amount: totalAmount,
          paidAmount: Math.min(
            paidAmount,
            totalAmount
          ),
          remainingAmount: Math.max(
            totalAmount - paidAmount,
            0
          ),
          status: getPaymentStatus(
            totalAmount,
            paidAmount
          ),
          paidAt:
            saved?.paid_at || null,
          eventDetails,
        });
      }
    );

    if (event.driver_id) {
      const recipientId = Number(
        event.head_driver_id ||
          driver?.reports_to_id ||
          event.driver_id
      );

      const recipient =
        staffMap.get(recipientId);

      if (recipient) {
        const saved =
          savedPaymentMap.get(
            `${recipientId}-${Number(
              event.id
            )}`
          );

        const totalAmount = Number(
          saved?.amount ??
            event.driver_rate_at_event ??
            0
        );
        const paidAmount = Number(
          saved?.paid_amount ??
            (saved?.status === "Paid"
              ? totalAmount
              : 0)
        );

        payments.push({
          id:
            saved?.id ||
            `driver-${event.id}-${recipientId}`,
          staffId: recipientId,
          staffName:
            recipient.full_name || "",
          staffType: "Driver",
          staffRole:
            recipient.staff_role ||
            "Head Driver",
          eventId: event.id,
          eventCode:
            event.event_code ||
            `EVT-${String(
              event.id
            ).padStart(3, "0")}`,
          eventName:
            event.event_type || "Event",
          eventDate:
            event.event_date || "",
          amount: totalAmount,
          paidAmount: Math.min(
            paidAmount,
            totalAmount
          ),
          remainingAmount: Math.max(
            totalAmount - paidAmount,
            0
          ),
          status: getPaymentStatus(
            totalAmount,
            paidAmount
          ),
          paidAt:
            saved?.paid_at || null,
          eventDetails,
        });
      }
    }
  });

  return payments;
}

export async function recordStaffPayment(
  payment,
  paymentAmount
) {
  const totalAmount = Number(
    payment.amount || 0
  );
  const currentPaid = Number(
    payment.paidAmount || 0
  );
  const amountToPay = Number(
    paymentAmount || 0
  );

  if (amountToPay <= 0) {
    throw new Error(
      "Payment amount must be greater than 0."
    );
  }

  const nextPaid =
    currentPaid + amountToPay;

  if (nextPaid > totalAmount) {
    throw new Error(
      "Payment amount cannot exceed the remaining balance."
    );
  }

  const nextStatus = getPaymentStatus(
    totalAmount,
    nextPaid
  );

  const { data, error } = await supabase
    .from("staff_payments")
    .upsert(
      {
        staff_id:
          Number(payment.staffId),
        event_id:
          Number(payment.eventId),
        amount: totalAmount,
        paid_amount: nextPaid,
        status: nextStatus,
        paid_at:
          nextStatus === "Paid"
            ? new Date().toISOString()
            : null,
      },
      {
        onConflict:
          "staff_id,event_id",
      }
    )
    .select(`
      id,
      staff_id,
      event_id,
      amount,
      paid_amount,
      status,
      paid_at
    `)
    .single();

  if (error) {
    throw error;
  }

  return {
    ...payment,
    id: data.id,
    amount: Number(data.amount || 0),
    paidAmount: Number(
      data.paid_amount || 0
    ),
    remainingAmount: Math.max(
      Number(data.amount || 0) -
        Number(data.paid_amount || 0),
      0
    ),
    status:
      data.status || nextStatus,
    paidAt: data.paid_at,
  };
}
