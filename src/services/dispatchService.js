import { supabase } from "../lib/supabase";

const DISPATCH_FIELDS = `
  id,
  dispatch_code,
  event_id,
  warehouse_id,
  driver_id,
  destination,
  area,
  dispatch_date,
  dispatch_time,
  status,
  notes,
  created_at,
  updated_at,
  event:events (
    id,
    event_code,
    event_type,
    client
  ),
  warehouse:warehouses (
    id,
    warehouse_code,
    name
  ),
  driver:staff (
    id,
    staff_code,
    full_name
  ),
  dispatch_items (
    id,
    item_id,
    quantity,
    item:items (
      id,
      item_code,
      name,
      item_type
    )
  )
`;

const mapDispatchFromDatabase = (dispatch) => ({
  id: dispatch.id,
  dispatchCode:
    dispatch.dispatch_code ||
    `DSP-${String(dispatch.id).padStart(5, "0")}`,
  eventId: dispatch.event_id,
  eventReference:
    dispatch.event?.event_code || "",
  eventName:
    dispatch.event?.event_type || "",
  warehouseId: dispatch.warehouse_id,
  fromWarehouse:
    dispatch.warehouse?.name || "",
  driverId: dispatch.driver_id || "",
  driver: dispatch.driver?.full_name || "",
  toLocation: dispatch.destination || "",
  area: dispatch.area || "",
  date: dispatch.dispatch_date || "",
  time: dispatch.dispatch_time || "",
  status: dispatch.status || "Prepared",
  notes: dispatch.notes || "",
  items: (dispatch.dispatch_items || []).map(
    (dispatchItem) => ({
      id: dispatchItem.id,
      itemId: dispatchItem.item_id,
      name: dispatchItem.item?.name || "",
      itemCode:
        dispatchItem.item?.item_code || "",
      itemType:
        dispatchItem.item?.item_type || "Reusable",
      quantity: Number(
        dispatchItem.quantity || 0
      ),
    })
  ),
  createdAt: dispatch.created_at,
  updatedAt: dispatch.updated_at,
});

const createDispatchPayload = (formData) => ({
  event_id: Number(formData.eventId),
  warehouse_id: Number(formData.warehouseId),
  driver_id: formData.driverId
    ? Number(formData.driverId)
    : null,
  destination: formData.toLocation.trim(),
  area: formData.area.trim(),
  dispatch_date: formData.date,
  dispatch_time: formData.time,
  status: "Prepared",
});

const createDispatchItemsPayload = (
  dispatchId,
  items
) =>
  items.map((item) => ({
    dispatch_id: dispatchId,
    item_id: Number(item.itemId),
    quantity: Number(item.quantity),
  }));

export async function getDispatchPageData() {
  const [
    dispatchesResult,
    eventsResult,
    warehousesResult,
    driversResult,
  ] = await Promise.all([
    supabase
      .from("dispatches")
      .select(DISPATCH_FIELDS)
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("events")
      .select(`
        id,
        event_code,
        event_type,
        client,
        location,
        area,
        driver_id,
        status
      `)
      .neq("status", "Cancelled")
      .order("event_date", {
        ascending: true,
      }),

    supabase
      .from("warehouses")
      .select(`
        id,
        warehouse_code,
        name,
        branch
      `)
      .order("name", {
        ascending: true,
      }),

    supabase
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
      }),
  ]);

  const firstError =
    dispatchesResult.error ||
    eventsResult.error ||
    warehousesResult.error ||
    driversResult.error;

  if (firstError) {
    throw firstError;
  }

  return {
    dispatches: (
      dispatchesResult.data || []
    ).map(mapDispatchFromDatabase),
    events: eventsResult.data || [],
    warehouses:
      warehousesResult.data || [],
    drivers: driversResult.data || [],
  };
}

export async function getWarehouseItems(
  warehouseId
) {
  if (!warehouseId) {
    return [];
  }

  const { data, error } = await supabase
    .from("warehouse_inventory")
    .select(`
      item_id,
      available_quantity,
      item:items (
        id,
        item_code,
        name,
        unit,
        item_type,
        is_active
      )
    `)
    .eq("warehouse_id", Number(warehouseId))
    .gt("available_quantity", 0);

  if (error) {
    throw error;
  }

  return (data || [])
    .filter(
      (row) => row.item?.is_active !== false
    )
    .map((row) => ({
      id: row.item_id,
      itemCode: row.item?.item_code || "",
      name: row.item?.name || "",
      unit: row.item?.unit || "",
      itemType: row.item?.item_type || "Reusable",
      availableQuantity: Number(
        row.available_quantity || 0
      ),
    }))
    .sort((firstItem, secondItem) =>
      firstItem.name.localeCompare(
        secondItem.name
      )
    );
}

export async function createDispatch(
  formData
) {
  const dispatchPayload =
    createDispatchPayload(formData);

  const {
    data: dispatch,
    error: dispatchError,
  } = await supabase
    .from("dispatches")
    .insert(dispatchPayload)
    .select("id")
    .single();

  if (dispatchError) {
    throw dispatchError;
  }

  const itemPayload =
    createDispatchItemsPayload(
      dispatch.id,
      formData.items
    );

  const { error: itemsError } =
    await supabase
      .from("dispatch_items")
      .insert(itemPayload);

  if (itemsError) {
    await supabase
      .from("dispatches")
      .delete()
      .eq("id", dispatch.id);

    throw itemsError;
  }

  const { data, error } = await supabase
    .from("dispatches")
    .select(DISPATCH_FIELDS)
    .eq("id", dispatch.id)
    .single();

  if (error) {
    throw error;
  }

  return mapDispatchFromDatabase(data);
}

export async function updateDispatch(
  dispatchId,
  formData
) {
  const dispatchPayload = {
    event_id: Number(formData.eventId),
    warehouse_id: Number(
      formData.warehouseId
    ),
    driver_id: formData.driverId
      ? Number(formData.driverId)
      : null,
    destination:
      formData.toLocation.trim(),
    area: formData.area.trim(),
    dispatch_date: formData.date,
    dispatch_time: formData.time,
  };

  const { error: updateError } =
    await supabase
      .from("dispatches")
      .update(dispatchPayload)
      .eq("id", dispatchId)
      .in("status", [
        "Prepared",
        "In Transit",
      ]);

  if (updateError) {
    throw updateError;
  }

  const { error: deleteItemsError } =
    await supabase
      .from("dispatch_items")
      .delete()
      .eq("dispatch_id", dispatchId);

  if (deleteItemsError) {
    throw deleteItemsError;
  }

  const itemPayload =
    createDispatchItemsPayload(
      dispatchId,
      formData.items
    );

  const { error: insertItemsError } =
    await supabase
      .from("dispatch_items")
      .insert(itemPayload);

  if (insertItemsError) {
    throw insertItemsError;
  }

  const { data, error } = await supabase
    .from("dispatches")
    .select(DISPATCH_FIELDS)
    .eq("id", dispatchId)
    .single();

  if (error) {
    throw error;
  }

  return mapDispatchFromDatabase(data);
}

export async function updateDispatchStatus(
  dispatchId,
  status
) {
  const {
    data: currentDispatch,
    error: dispatchLoadError,
  } = await supabase
    .from("dispatches")
    .select(`
      id,
      warehouse_id,
      status,
      dispatch_items (
        item_id,
        quantity
      )
    `)
    .eq("id", dispatchId)
    .single();

  if (dispatchLoadError) {
    throw dispatchLoadError;
  }

  const previousStatus =
    currentDispatch.status;

  const dispatchItems =
    currentDispatch.dispatch_items || [];

  const shouldDeductInventory =
    previousStatus === "Prepared" &&
    status === "In Transit";

  const shouldRestoreInventory =
    previousStatus === "In Transit" &&
    status === "Cancelled";

  const updatedInventoryRows = [];

  if (shouldDeductInventory) {
    for (const dispatchItem of dispatchItems) {
      const {
        data: inventoryRow,
        error: inventoryError,
      } = await supabase
        .from("warehouse_inventory")
        .select(`
          id,
          available_quantity
        `)
        .eq(
          "warehouse_id",
          currentDispatch.warehouse_id
        )
        .eq(
          "item_id",
          dispatchItem.item_id
        )
        .single();

      if (inventoryError) {
        throw inventoryError;
      }

      const currentAvailable =
        Number(
          inventoryRow.available_quantity ||
            0
        );

      const dispatchQuantity =
        Number(
          dispatchItem.quantity || 0
        );

      if (
        currentAvailable <
        dispatchQuantity
      ) {
        throw new Error(
          "One or more items do not have enough available stock."
        );
      }
    }

    try {
      for (const dispatchItem of dispatchItems) {
        const {
          data: inventoryRow,
          error: inventoryError,
        } = await supabase
          .from("warehouse_inventory")
          .select(`
            id,
            available_quantity
          `)
          .eq(
            "warehouse_id",
            currentDispatch.warehouse_id
          )
          .eq(
            "item_id",
            dispatchItem.item_id
          )
          .single();

        if (inventoryError) {
          throw inventoryError;
        }

        const oldAvailable =
          Number(
            inventoryRow.available_quantity ||
              0
          );

        const newAvailable =
          oldAvailable -
          Number(
            dispatchItem.quantity || 0
          );

        const {
          error: updateInventoryError,
        } = await supabase
          .from("warehouse_inventory")
          .update({
            available_quantity:
              newAvailable,
          })
          .eq("id", inventoryRow.id);

        if (updateInventoryError) {
          throw updateInventoryError;
        }

        updatedInventoryRows.push({
          id: inventoryRow.id,
          oldAvailable,
        });
      }
    } catch (inventoryUpdateError) {
      for (
        const updatedRow of
        updatedInventoryRows
      ) {
        await supabase
          .from("warehouse_inventory")
          .update({
            available_quantity:
              updatedRow.oldAvailable,
          })
          .eq("id", updatedRow.id);
      }

      throw inventoryUpdateError;
    }
  }

  if (shouldRestoreInventory) {
    try {
      for (const dispatchItem of dispatchItems) {
        const {
          data: inventoryRow,
          error: inventoryError,
        } = await supabase
          .from("warehouse_inventory")
          .select(`
            id,
            available_quantity
          `)
          .eq(
            "warehouse_id",
            currentDispatch.warehouse_id
          )
          .eq(
            "item_id",
            dispatchItem.item_id
          )
          .single();

        if (inventoryError) {
          throw inventoryError;
        }

        const oldAvailable =
          Number(
            inventoryRow.available_quantity ||
              0
          );

        const restoredQuantity =
          oldAvailable +
          Number(
            dispatchItem.quantity || 0
          );

        const {
          error: restoreError,
        } = await supabase
          .from("warehouse_inventory")
          .update({
            available_quantity:
              restoredQuantity,
          })
          .eq("id", inventoryRow.id);

        if (restoreError) {
          throw restoreError;
        }

        updatedInventoryRows.push({
          id: inventoryRow.id,
          oldAvailable,
        });
      }
    } catch (restoreInventoryError) {
      for (
        const updatedRow of
        updatedInventoryRows
      ) {
        await supabase
          .from("warehouse_inventory")
          .update({
            available_quantity:
              updatedRow.oldAvailable,
          })
          .eq("id", updatedRow.id);
      }

      throw restoreInventoryError;
    }
  }

  const { data, error } = await supabase
    .from("dispatches")
    .update({ status })
    .eq("id", dispatchId)
    .select(DISPATCH_FIELDS)
    .single();

  if (error) {
    for (
      const updatedRow of
      updatedInventoryRows
    ) {
      await supabase
        .from("warehouse_inventory")
        .update({
          available_quantity:
            updatedRow.oldAvailable,
        })
        .eq("id", updatedRow.id);
    }

    throw error;
  }

  return mapDispatchFromDatabase(data);
}

export async function removeDispatch(
  dispatchId
) {
  const { error } = await supabase
    .from("dispatches")
    .delete()
    .eq("id", dispatchId);

  if (error) {
    throw error;
  }

  return true;
}
