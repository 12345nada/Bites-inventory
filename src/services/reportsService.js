import { supabase } from "../lib/supabase";

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-US");

const safeNumber = (value) => Number(value || 0);

const getPaymentStatus = (amount, paidAmount) => {
  const total = safeNumber(amount);
  const paid = Math.min(total, safeNumber(paidAmount));

  if (total <= 0 || paid >= total) {
    return "Paid";
  }

  if (paid > 0) {
    return "Partial";
  }

  return "Pending";
};

export async function getReportsData() {
  const [
    inventoryResult,
    purchasesResult,
    dispatchesResult,
    returnsResult,
    warehousesResult,
    eventsResult,
    eventWaitersResult,
    staffResult,
    staffPaymentsResult,
  ] = await Promise.all([
    supabase
      .from("inventory_report")
      .select(`
        item_id,
        item_code,
        item_name,
        category,
        warehouse_id,
        warehouse_name,
        available_quantity,
        damaged_quantity,
        missing_quantity,
        minimum_stock,
        available_stock_value
      `)
      .order("item_name", { ascending: true }),

    supabase
      .from("purchase_orders")
      .select(`
        id,
        po_number,
        order_date,
        expected_date,
        status,
        supplier:suppliers (
          id,
          name
        ),
        warehouse:warehouses (
          id,
          name,
          branch
        ),
        purchase_order_items (
          id,
          quantity,
          unit_cost,
          item:items (
            id,
            item_code,
            name
          )
        )
      `)
      .order("order_date", { ascending: false }),

    supabase
      .from("dispatches")
      .select(`
        id,
        dispatch_code,
        destination,
        area,
        dispatch_date,
        dispatch_time,
        status,
        event:events (
          id,
          event_code,
          event_type
        ),
        warehouse:warehouses (
          id,
          name
        ),
        driver:staff (
          id,
          full_name
        ),
        dispatch_items (
          id,
          quantity,
          item:items (
            id,
            item_code,
            name
          )
        )
      `)
      .order("dispatch_date", { ascending: false }),

    supabase
      .from("returns")
      .select(`
        id,
        return_code,
        return_date,
        received_by,
        notes,
        dispatch:dispatches (
          id,
          dispatch_code,
          event:events (
            id,
            event_code,
            event_type
          ),
          warehouse:warehouses (
            id,
            name
          )
        ),
        return_items (
          id,
          returned_quantity,
          damaged_quantity,
          missing_quantity,
          dispatch_item:dispatch_items (
            id,
            quantity,
            item:items (
              id,
              item_code,
              name
            )
          )
        )
      `)
      .order("return_date", { ascending: false }),

    supabase
      .from("warehouses")
      .select(`
        id,
        warehouse_code,
        name,
        branch,
        total_capacity
      `)
      .order("name", { ascending: true }),

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
        driver_id,
        driver_rate_at_event,
        head_driver_id
      `)
      .order("event_date", { ascending: false }),

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
        staff_code,
        staff_type,
        full_name,
        staff_role,
        reports_to_id,
        branch,
        status
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
    inventoryResult.error ||
    purchasesResult.error ||
    dispatchesResult.error ||
    returnsResult.error ||
    warehousesResult.error ||
    eventsResult.error ||
    eventWaitersResult.error ||
    staffResult.error ||
    staffPaymentsResult.error;

  if (firstError) {
    throw firstError;
  }

  const inventory = (inventoryResult.data || []).map((row) => {
    const available = safeNumber(row.available_quantity);
    const minimumStock = safeNumber(row.minimum_stock);

    let stockLevel = "Healthy";
    if (available <= 0) {
      stockLevel = "Out of Stock";
    } else if (available <= minimumStock) {
      stockLevel = "Low Stock";
    }

    return {
      id: `${row.item_id}-${row.warehouse_id}`,
      itemId: row.item_id,
      itemCode: row.item_code || "",
      itemName: row.item_name || "",
      category: row.category || "-",
      warehouseId: row.warehouse_id,
      warehouse: row.warehouse_name || "",
      available,
      damaged: safeNumber(row.damaged_quantity),
      missing: safeNumber(row.missing_quantity),
      minimumStock,
      stockLevel,
      stockValue: safeNumber(row.available_stock_value),
    };
  });

  const inventoryByItemMap = new Map();

  inventory.forEach((row) => {
    const key = Number(row.itemId);

    if (!inventoryByItemMap.has(key)) {
      inventoryByItemMap.set(key, {
        itemId: row.itemId,
        itemCode: row.itemCode,
        itemName: row.itemName,
        category: row.category,
        warehouseIds: [],
        warehouses: [],
        available: 0,
        damaged: 0,
        missing: 0,
        minimumStock: 0,
        stockValue: 0,
        warehouseDetails: [],
      });
    }

    const item = inventoryByItemMap.get(key);

    item.warehouseIds.push(row.warehouseId);
    item.warehouses.push(row.warehouse);
    item.available += row.available;
    item.damaged += row.damaged;
    item.missing += row.missing;
    item.minimumStock += row.minimumStock;
    item.stockValue += row.stockValue;
    item.warehouseDetails.push(row);
  });

  const inventorySummary = Array.from(
    inventoryByItemMap.values()
  ).map((item) => {
    let stockLevel = "Healthy";

    if (item.available <= 0) {
      stockLevel = "Out of Stock";
    } else if (item.available <= item.minimumStock) {
      stockLevel = "Low Stock";
    }

    return {
      ...item,
      warehouses: [...new Set(item.warehouses.filter(Boolean))],
      stockLevel,
    };
  });

  const purchases = (purchasesResult.data || []).map((purchase) => {
    const items = (purchase.purchase_order_items || []).map((row) => {
      const quantity = safeNumber(row.quantity);
      const unitCost = safeNumber(row.unit_cost);

      return {
        id: row.id,
        itemId: row.item?.id,
        itemCode: row.item?.item_code || "",
        itemName: row.item?.name || "-",
        quantity,
        unitCost,
        totalAmount: quantity * unitCost,
      };
    });

    const totalQuantity = items.reduce(
      (total, item) => total + item.quantity,
      0
    );

    const totalAmount = items.reduce(
      (total, item) => total + item.totalAmount,
      0
    );

    return {
      id: purchase.id,
      poNumber:
        purchase.po_number ||
        `PO-${String(purchase.id).padStart(3, "0")}`,
      supplier: purchase.supplier?.name || "-",
      warehouseId: purchase.warehouse?.id || "",
      warehouse: purchase.warehouse?.name || "",
      branch: purchase.warehouse?.branch || "",
      itemTypes: items.length,
      totalQuantity,
      totalAmount,
      orderDate: purchase.order_date || "",
      expectedDate: purchase.expected_date || "",
      status: purchase.status || "Pending",
      items,
    };
  });

  const dispatches = (dispatchesResult.data || []).map((dispatch) => {
    const items = (dispatch.dispatch_items || []).map((item) => ({
      name: item.item?.name || "",
      itemCode: item.item?.item_code || "",
      quantity: safeNumber(item.quantity),
    }));

    return {
      id: dispatch.id,
      dispatchCode:
        dispatch.dispatch_code ||
        `DSP-${String(dispatch.id).padStart(5, "0")}`,
      eventReference: dispatch.event?.event_code || "",
      eventType: dispatch.event?.event_type || "",
      eventId: dispatch.event?.id || null,
      warehouseId: dispatch.warehouse?.id || "",
      fromWarehouse: dispatch.warehouse?.name || "",
      toLocation: dispatch.destination || "",
      area: dispatch.area || "",
      driver: dispatch.driver?.full_name || "-",
      date: dispatch.dispatch_date || "",
      time: dispatch.dispatch_time || "",
      status: dispatch.status || "Prepared",
      items,
      itemTypes: items.length,
      totalQuantity: items.reduce(
        (total, item) => total + item.quantity,
        0
      ),
    };
  });

  const returns = (returnsResult.data || []).map((returnRecord) => {
    const items = (returnRecord.return_items || []).map((item) => ({
      name: item.dispatch_item?.item?.name || "",
      itemCode: item.dispatch_item?.item?.item_code || "",
      dispatchedQuantity: safeNumber(item.dispatch_item?.quantity),
      goodReturned: safeNumber(item.returned_quantity),
      damaged: safeNumber(item.damaged_quantity),
      missing: safeNumber(item.missing_quantity),
    }));

    const totals = items.reduce(
      (result, item) => {
        result.sent += item.dispatchedQuantity;
        result.returned += item.goodReturned;
        result.damaged += item.damaged;
        result.missing += item.missing;
        return result;
      },
      {
        sent: 0,
        returned: 0,
        damaged: 0,
        missing: 0,
      }
    );

    const recovered = totals.returned;
    const loss = totals.damaged + totals.missing;
    const recoveryRate =
      totals.sent > 0 ? (recovered / totals.sent) * 100 : 0;
    const lossRate =
      totals.sent > 0 ? (loss / totals.sent) * 100 : 0;

    let riskLevel = "Clear";
    if (lossRate >= 10) {
      riskLevel = "High Loss";
    } else if (loss > 0) {
      riskLevel = "Partial Loss";
    }

    return {
      id: returnRecord.id,
      returnCode:
        returnRecord.return_code ||
        `RET-${String(returnRecord.id).padStart(5, "0")}`,
      dispatchCode: returnRecord.dispatch?.dispatch_code || "",
      eventReference:
        returnRecord.dispatch?.event?.event_code || "",
      eventId: returnRecord.dispatch?.event?.id || null,
      warehouseId: returnRecord.dispatch?.warehouse?.id || "",
      warehouse: returnRecord.dispatch?.warehouse?.name || "",
      returnDate: returnRecord.return_date || "",
      returnedBy: returnRecord.received_by || "",
      notes: returnRecord.notes || "",
      items,
      ...totals,
      recoveryRate,
      lossRate,
      riskLevel,
    };
  });

  const staff = staffResult.data || [];

  const staffMap = new Map(
    staff.map((record) => [Number(record.id), record])
  );

  const eventWaiters = eventWaitersResult.data || [];
  const savedPayments = staffPaymentsResult.data || [];

  const paymentMap = new Map(
    savedPayments.map((payment) => [
      `${Number(payment.staff_id)}-${Number(payment.event_id)}`,
      payment,
    ])
  );

  const events = (eventsResult.data || []).map((event) => {
    const waiterRows = eventWaiters.filter(
      (row) =>
        Number(row.event_id) === Number(event.id) &&
        row.attendance_status !== "Absent"
    );

    const waiterCost = waiterRows.reduce(
      (total, row) => total + safeNumber(row.rate_at_event),
      0
    );

    const driverCost = safeNumber(event.driver_rate_at_event);

    const dispatch = dispatches.find(
      (record) => Number(record.eventId) === Number(event.id)
    );

    const returnRecord = returns.find(
      (record) => Number(record.eventId) === Number(event.id)
    );

    const driver = event.driver_id
      ? staffMap.get(Number(event.driver_id))
      : null;

    return {
      id: event.id,
      eventCode:
        event.event_code ||
        `EVT-${String(event.id).padStart(3, "0")}`,
      eventName: event.event_type || "Event",
      client: event.client || "-",
      date: event.event_date || "",
      departureTime: event.departure_time || "",
      startTime: event.start_time || "",
      endTime: event.end_time || "",
      location: event.location || "",
      area: event.area || "",
      branch: event.branch || "",
      status: event.status || "Upcoming",
      driver: driver?.full_name || "-",
      waiterCount: waiterRows.length,
      waiterCost,
      driverCost,
      staffCost: waiterCost + driverCost,
      dispatchStatus: dispatch?.status || "Not Created",
      returnStatus: returnRecord
        ? returnRecord.riskLevel
        : dispatch?.status === "Delivered"
          ? "Pending Return"
          : "Not Applicable",
    };
  });

  const staffPayments = [];

  events.forEach((event) => {
    const eventRecord = (eventsResult.data || []).find(
      (record) => Number(record.id) === Number(event.id)
    );

    const waiterRows = eventWaiters.filter(
      (row) =>
        Number(row.event_id) === Number(event.id) &&
        row.attendance_status !== "Absent"
    );

    const waiterGroups = new Map();

    waiterRows.forEach((row) => {
      const recipientId = Number(
        row.head_waiter_id || row.waiter_id
      );

      if (!recipientId) {
        return;
      }

      waiterGroups.set(
        recipientId,
        safeNumber(waiterGroups.get(recipientId)) +
          safeNumber(row.rate_at_event)
      );
    });

    waiterGroups.forEach((amount, recipientId) => {
      const recipient = staffMap.get(recipientId);

      if (!recipient) {
        return;
      }

      const saved = paymentMap.get(
        `${recipientId}-${Number(event.id)}`
      );

      const paidAmount =
        saved?.paid_amount != null
          ? safeNumber(saved.paid_amount)
          : saved?.status === "Paid"
            ? safeNumber(saved.amount ?? amount)
            : 0;

      staffPayments.push({
        staffId: recipientId,
        staffName: recipient.full_name || "",
        staffType: "Waiter",
        staffRole: recipient.staff_role || "Head Waiter",
        eventId: event.id,
        eventCode: event.eventCode,
        eventName: event.eventName,
        eventDate: event.date,
        amount: safeNumber(saved?.amount ?? amount),
        paidAmount,
      });
    });

    if (eventRecord?.driver_id) {
      const driver = staffMap.get(Number(eventRecord.driver_id));
      const recipientId = Number(
        eventRecord.head_driver_id ||
          driver?.reports_to_id ||
          eventRecord.driver_id
      );

      const recipient = staffMap.get(recipientId);

      if (recipient) {
        const amount = safeNumber(
          eventRecord.driver_rate_at_event
        );

        const saved = paymentMap.get(
          `${recipientId}-${Number(event.id)}`
        );

        const paidAmount =
          saved?.paid_amount != null
            ? safeNumber(saved.paid_amount)
            : saved?.status === "Paid"
              ? safeNumber(saved.amount ?? amount)
              : 0;

        staffPayments.push({
          staffId: recipientId,
          staffName: recipient.full_name || "",
          staffType: "Driver",
          staffRole: recipient.staff_role || "Head Driver",
          eventId: event.id,
          eventCode: event.eventCode,
          eventName: event.eventName,
          eventDate: event.date,
          amount: safeNumber(saved?.amount ?? amount),
          paidAmount,
        });
      }
    }
  });

  const staffPaymentSummaryMap = new Map();

  staffPayments.forEach((payment) => {
    const key = Number(payment.staffId);

    if (!staffPaymentSummaryMap.has(key)) {
      staffPaymentSummaryMap.set(key, {
        staffId: key,
        staffName: payment.staffName,
        staffType: payment.staffType,
        staffRole: payment.staffRole,
        eventsWorked: 0,
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        events: [],
      });
    }

    const summary = staffPaymentSummaryMap.get(key);
    const totalAmount = safeNumber(payment.amount);
    const paidAmount = Math.min(
      totalAmount,
      safeNumber(payment.paidAmount)
    );

    summary.eventsWorked += 1;
    summary.totalAmount += totalAmount;
    summary.paidAmount += paidAmount;
    summary.remainingAmount += Math.max(
      totalAmount - paidAmount,
      0
    );
    summary.events.push({
      ...payment,
      status: getPaymentStatus(totalAmount, paidAmount),
    });
  });

  const staffPaymentSummary = Array.from(
    staffPaymentSummaryMap.values()
  ).map((summary) => ({
    ...summary,
    status: getPaymentStatus(
      summary.totalAmount,
      summary.paidAmount
    ),
  }));

  const warehouses = (warehousesResult.data || []).map(
    (warehouse) => {
      const warehouseInventory = inventory.filter(
        (row) =>
          Number(row.warehouseId) === Number(warehouse.id)
      );

      const warehousePurchases = purchases.filter(
        (purchase) =>
          Number(purchase.warehouseId) === Number(warehouse.id)
      );

      const warehouseDispatches = dispatches.filter(
        (dispatch) =>
          Number(dispatch.warehouseId) === Number(warehouse.id)
      );

      const available = warehouseInventory.reduce(
        (total, row) => total + row.available,
        0
      );

      const damaged = warehouseInventory.reduce(
        (total, row) => total + row.damaged,
        0
      );

      const missing = warehouseInventory.reduce(
        (total, row) => total + row.missing,
        0
      );

      const inventoryValue = warehouseInventory.reduce(
        (total, row) => total + row.stockValue,
        0
      );

      const lowStockItems = warehouseInventory.filter(
        (row) =>
          row.stockLevel === "Low Stock" ||
          row.stockLevel === "Out of Stock"
      ).length;

      const receivedPurchases = warehousePurchases
        .filter((purchase) => purchase.status === "Received")
        .reduce(
          (total, purchase) =>
            total + purchase.totalQuantity,
          0
        );

      const dispatchedQuantity = warehouseDispatches.reduce(
        (total, dispatch) =>
          total + dispatch.totalQuantity,
        0
      );

      const capacity = safeNumber(warehouse.total_capacity);
      const usedCapacity = available + damaged;
      const availableCapacity = Math.max(
        capacity - usedCapacity,
        0
      );

      return {
        id: warehouse.id,
        warehouseCode: warehouse.warehouse_code || "",
        name: warehouse.name || "",
        branch: warehouse.branch || "",
        capacity,
        usedCapacity,
        availableCapacity,
        inventoryValue,
        available,
        damaged,
        missing,
        lowStockItems,
        receivedPurchases,
        dispatchedQuantity,
      };
    }
  );

  return {
    inventory,
    inventorySummary,
    purchases,
    dispatches,
    returns,
    warehouses,
    events,
    staffPaymentSummary,
  };
}

export function getOverviewReportRows(data) {
  const now = new Date();

  const getLiveEventStatus = (event) => {
    if (event.status === "Cancelled") {
      return "Cancelled";
    }

    if (!event.date) {
      return event.status || "Upcoming";
    }

    const startDateTime = new Date(
      `${event.date}T${event.startTime || "00:00:00"}`
    );

    const endDateTime = new Date(
      `${event.date}T${event.endTime || "23:59:59"}`
    );

    if (!Number.isNaN(endDateTime.getTime()) && now > endDateTime) {
      return "Completed";
    }

    if (
      !Number.isNaN(startDateTime.getTime()) &&
      !Number.isNaN(endDateTime.getTime()) &&
      now >= startDateTime &&
      now <= endDateTime
    ) {
      return "In Progress";
    }

    if (!Number.isNaN(startDateTime.getTime()) && now < startDateTime) {
      return "Upcoming";
    }

    return event.status || "Upcoming";
  };

  const eventCounts = data.events.reduce(
    (counts, event) => {
      const liveStatus = getLiveEventStatus(event);

      if (liveStatus === "Completed") counts.completed += 1;
      else if (liveStatus === "In Progress") counts.inProgress += 1;
      else if (liveStatus === "Upcoming") counts.upcoming += 1;
      else if (liveStatus === "Cancelled") counts.cancelled += 1;

      return counts;
    },
    {
      completed: 0,
      inProgress: 0,
      upcoming: 0,
      cancelled: 0,
    }
  );

  const activeEvents =
    eventCounts.completed +
    eventCounts.inProgress +
    eventCounts.upcoming;

  const totalInventoryValue = data.inventorySummary.reduce(
    (total, item) => total + safeNumber(item.stockValue),
    0
  );

  const totalPurchaseSpend = data.purchases.reduce(
    (total, purchase) => total + safeNumber(purchase.totalAmount),
    0
  );

  const pendingStaffPayments = data.staffPaymentSummary.reduce(
    (total, payment) =>
      total + safeNumber(payment.remainingAmount),
    0
  );

  const rows = [
    ["Inventory Value", `${formatNumber(totalInventoryValue)} EGP`],
    ["Purchase Spend", `${formatNumber(totalPurchaseSpend)} EGP`],
    ["Active Events", formatNumber(activeEvents)],
    ["Completed Events", formatNumber(eventCounts.completed)],
    ["Upcoming Events", formatNumber(eventCounts.upcoming)],
    ["In Progress Events", formatNumber(eventCounts.inProgress)],
    ["Cancelled Events", formatNumber(eventCounts.cancelled)],
    ["Pending Staff Payments", `${formatNumber(pendingStaffPayments)} EGP`],
  ];

  return rows.map(([metric, value]) => ({
    searchValues: [metric, value],
    warehouseId: "",
    status: "",
    date: "",
    cells: [metric, value],
    raw: { metric, value },
  }));
}

export function getInventoryReportRows(inventorySummary) {
  return inventorySummary.map((item) => ({
    searchValues: [
      item.itemCode,
      item.itemName,
      item.category,
      item.warehouses.join(", "),
      item.stockLevel,
    ],
    warehouseIds: item.warehouseIds,
    warehouseId: "",
    status: item.stockLevel,
    date: "",
    cells: [
      item.itemCode,
      item.itemName,
      item.category,
      item.warehouses.join(", "),
      formatNumber(item.available),
      formatNumber(item.damaged),
      formatNumber(item.missing),
      formatNumber(item.minimumStock),
      `${formatNumber(item.stockValue)} EGP`,
      item.stockLevel,
    ],
    raw: item,
  }));
}

export function getPurchaseReportRows(purchases) {
  return purchases.map((purchase) => ({
    searchValues: [
      purchase.poNumber,
      purchase.supplier,
      purchase.warehouse,
      purchase.branch,
      purchase.status,
      ...purchase.items.flatMap((item) => [
        item.itemCode,
        item.itemName,
      ]),
    ],
    warehouseId: purchase.warehouseId,
    status: purchase.status,
    date: purchase.orderDate,
    cells: [
      purchase.poNumber,
      purchase.supplier,
      purchase.warehouse,
      formatNumber(purchase.itemTypes),
      formatNumber(purchase.totalQuantity),
      `${formatNumber(purchase.totalAmount)} EGP`,
      purchase.orderDate,
      purchase.expectedDate,
      purchase.status,
    ],
    raw: purchase,
  }));
}

export function getEventsReportRows(events) {
  return events.map((event) => ({
    searchValues: [
      event.eventCode,
      event.eventName,
      event.client,
      event.branch,
      event.driver,
      event.status,
      event.dispatchStatus,
      event.returnStatus,
    ],
    warehouseId: "",
    status: event.status,
    date: event.date,
    cells: [
      event.eventCode,
      event.eventName,
      event.client,
      event.date,
      event.branch,
      event.driver,
      formatNumber(event.waiterCount),
      event.dispatchStatus,
      event.returnStatus,
      `${formatNumber(event.staffCost)} EGP`,
      event.status,
    ],
    raw: event,
  }));
}

export function getDispatchReportRows(dispatches) {
  return dispatches.map((dispatch) => ({
    searchValues: [
      dispatch.dispatchCode,
      dispatch.eventReference,
      dispatch.fromWarehouse,
      dispatch.toLocation,
      dispatch.area,
      dispatch.driver,
      dispatch.status,
      ...dispatch.items.flatMap((item) => [
        item.itemCode,
        item.name,
      ]),
    ],
    warehouseId: dispatch.warehouseId,
    status: dispatch.status,
    date: dispatch.date,
    cells: [
      dispatch.dispatchCode,
      dispatch.eventReference,
      dispatch.fromWarehouse,
      dispatch.driver,
      formatNumber(dispatch.itemTypes),
      formatNumber(dispatch.totalQuantity),
      dispatch.date,
      dispatch.time || "-",
      dispatch.status,
    ],
    raw: dispatch,
  }));
}

export function getReturnsReportRows(returns) {
  return returns.map((record) => ({
    searchValues: [
      record.returnCode,
      record.dispatchCode,
      record.eventReference,
      record.warehouse,
      record.returnedBy,
      record.riskLevel,
    ],
    warehouseId: record.warehouseId,
    status: record.riskLevel,
    date: record.returnDate,
    cells: [
      record.returnCode,
      record.eventReference,
      record.warehouse,
      record.returnDate,
      formatNumber(record.sent),
      formatNumber(record.returned),
      formatNumber(record.damaged),
      formatNumber(record.missing),
      `${record.recoveryRate.toFixed(1)}%`,
      `${record.lossRate.toFixed(1)}%`,
      record.riskLevel,
    ],
    raw: record,
  }));
}

export function getStaffPaymentReportRows(staffPaymentSummary) {
  return staffPaymentSummary.map((record) => ({
    searchValues: [
      record.staffName,
      record.staffType,
      record.staffRole,
      record.status,
      ...record.events.flatMap((event) => [
        event.eventCode,
        event.eventName,
      ]),
    ],
    warehouseId: "",
    status: record.status,
    date: "",
    cells: [
      record.staffName,
      record.staffRole,
      record.staffType,
      formatNumber(record.eventsWorked),
      `${formatNumber(record.totalAmount)} EGP`,
      `${formatNumber(record.paidAmount)} EGP`,
      `${formatNumber(record.remainingAmount)} EGP`,
      record.status,
    ],
    raw: record,
  }));
}

export function getWarehouseReportRows(warehouses) {
  return warehouses.map((warehouse) => ({
    searchValues: [
      warehouse.warehouseCode,
      warehouse.name,
      warehouse.branch,
    ],
    warehouseId: warehouse.id,
    status: "",
    date: "",
    cells: [
      warehouse.name,
      warehouse.branch,
      formatNumber(warehouse.capacity),
      formatNumber(warehouse.usedCapacity),
      formatNumber(warehouse.availableCapacity),
      `${formatNumber(warehouse.inventoryValue)} EGP`,
      formatNumber(warehouse.damaged),
      formatNumber(warehouse.missing),
      formatNumber(warehouse.lowStockItems),
      formatNumber(warehouse.receivedPurchases),
      formatNumber(warehouse.dispatchedQuantity),
    ],
    raw: warehouse,
  }));
}

export function getLossReportRows(returns) {
  return returns
    .filter(
      (record) =>
        safeNumber(record.damaged) > 0 ||
        safeNumber(record.missing) > 0
    )
    .map((record) => ({
      searchValues: [
        record.returnCode,
        record.eventReference,
        record.warehouse,
        record.riskLevel,
        ...record.items.flatMap((item) => [
          item.itemCode,
          item.name,
        ]),
      ],
      warehouseId: record.warehouseId,
      status: record.riskLevel,
      date: record.returnDate,
      cells: [
        record.eventReference,
        record.returnCode,
        record.warehouse,
        record.returnDate,
        formatNumber(record.sent),
        formatNumber(record.damaged),
        formatNumber(record.missing),
        `${record.lossRate.toFixed(1)}%`,
        record.riskLevel,
      ],
      raw: record,
    }));
}
