import { supabase } from "../lib/supabase";

const RETURN_FIELDS = `
  id,
  return_code,
  dispatch_id,
  return_date,
  received_by,
  notes,
  is_completed,
  completed_at,
  created_at,
  updated_at,
  dispatch:dispatches (
    id,
    dispatch_code,
    warehouse_id,
    event:events (
      id,
      event_code,
      event_type
    ),
    warehouse:warehouses (
      id,
      warehouse_code,
      name
    )
  ),
  return_items (
    id,
    dispatch_item_id,
    returned_quantity,
    damaged_quantity,
    missing_quantity,
    notes,
    dispatch_item:dispatch_items (
      id,
      item_id,
      quantity,
      item:items (
        id,
        item_code,
        name
      )
    )
  )
`;

export const mapReturnFromDatabase = (returnRecord) => ({
  id: returnRecord.id,
  returnCode:
    returnRecord.return_code ||
    `RET-${String(returnRecord.id).padStart(5, "0")}`,
  dispatchId: returnRecord.dispatch_id,
  dispatchCode:
    returnRecord.dispatch?.dispatch_code || "",
  eventReference:
    returnRecord.dispatch?.event?.event_code || "",
  eventName:
    returnRecord.dispatch?.event?.event_type || "",
  warehouseId:
    returnRecord.dispatch?.warehouse_id || "",
  warehouse:
    returnRecord.dispatch?.warehouse?.name || "",
  returnDate: returnRecord.return_date || "",
  returnedBy: returnRecord.received_by || "",
  notes: returnRecord.notes || "",
  status: returnRecord.is_completed
    ? "Completed"
    : "Pending",
  isCompleted: Boolean(
    returnRecord.is_completed
  ),
  items: (
    returnRecord.return_items || []
  ).map((returnItem) => ({
    id: returnItem.id,
    dispatchItemId:
      returnItem.dispatch_item_id,
    itemId:
      returnItem.dispatch_item?.item_id,
    name:
      returnItem.dispatch_item?.item?.name ||
      "",
    itemCode:
      returnItem.dispatch_item?.item
        ?.item_code || "",
    dispatchedQuantity: Number(
      returnItem.dispatch_item?.quantity || 0
    ),
    goodReturned: Number(
      returnItem.returned_quantity || 0
    ),
    damaged: Number(
      returnItem.damaged_quantity || 0
    ),
    missing: Number(
      returnItem.missing_quantity || 0
    ),
    notes: returnItem.notes || "",
  })),
  createdAt: returnRecord.created_at,
  updatedAt: returnRecord.updated_at,
});

export async function getReturnsPageData() {
  const [
    returnsResult,
    dispatchesResult,
  ] = await Promise.all([
    supabase
      .from("returns")
      .select(RETURN_FIELDS)
      .order("return_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("dispatches")
      .select(`
        id,
        dispatch_code,
        warehouse_id,
        destination,
        area,
        dispatch_date,
        status,
        event:events (
          id,
          event_code,
          event_type
        ),
        warehouse:warehouses (
          id,
          warehouse_code,
          name
        ),
        dispatch_items (
          id,
          item_id,
          quantity,
          item:items (
            id,
            item_code,
            name
          )
        )
      `)
      .eq("status", "Delivered")
      .order("dispatch_date", {
        ascending: false,
      }),
  ]);

  const firstError =
    returnsResult.error ||
    dispatchesResult.error;

  if (firstError) {
    throw firstError;
  }

  const returns = (
    returnsResult.data || []
  ).map(mapReturnFromDatabase);

  const returnedDispatchIds = new Set(
    returns.map((record) =>
      String(record.dispatchId)
    )
  );

  const availableDispatches = (
    dispatchesResult.data || []
  )
    .filter(
      (dispatch) =>
        !returnedDispatchIds.has(
          String(dispatch.id)
        )
    )
    .map((dispatch) => ({
      id: dispatch.id,
      dispatchCode:
        dispatch.dispatch_code || "",
      eventReference:
        dispatch.event?.event_code || "",
      eventName:
        dispatch.event?.event_type || "",
      warehouseId: dispatch.warehouse_id,
      warehouse:
        dispatch.warehouse?.name || "",
      destination:
        dispatch.destination || "",
      area: dispatch.area || "",
      items: (
        dispatch.dispatch_items || []
      ).map((dispatchItem) => ({
        dispatchItemId:
          dispatchItem.id,
        itemId: dispatchItem.item_id,
        name:
          dispatchItem.item?.name || "",
        itemCode:
          dispatchItem.item?.item_code ||
          "",
        dispatchedQuantity: Number(
          dispatchItem.quantity || 0
        ),
        goodReturned: "",
        damaged: "",
        missing: "",
      })),
    }));

  return {
    returns,
    availableDispatches,
  };
}

async function updateInventoryForReturn({
  warehouseId,
  items,
  direction,
}) {
  for (const item of items) {
    const { data, error } = await supabase
      .from("warehouse_inventory")
      .select(`
        id,
        available_quantity,
        damaged_quantity,
        missing_quantity
      `)
      .eq("warehouse_id", warehouseId)
      .eq("item_id", item.itemId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const currentAvailable = Number(
      data?.available_quantity || 0
    );
    const currentDamaged = Number(
      data?.damaged_quantity || 0
    );
    const currentMissing = Number(
      data?.missing_quantity || 0
    );

    const nextValues = {
      available_quantity:
        currentAvailable +
        direction *
          Number(item.goodReturned || 0),
      damaged_quantity:
        currentDamaged +
        direction *
          Number(item.damaged || 0),
      missing_quantity:
        currentMissing +
        direction *
          Number(item.missing || 0),
    };

    if (
      nextValues.available_quantity < 0 ||
      nextValues.damaged_quantity < 0 ||
      nextValues.missing_quantity < 0
    ) {
      throw new Error(
        `Inventory quantities cannot become negative for ${item.name}.`
      );
    }

    if (data?.id) {
      const { error: updateError } =
        await supabase
          .from("warehouse_inventory")
          .update(nextValues)
          .eq("id", data.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } =
        await supabase
          .from("warehouse_inventory")
          .insert({
            warehouse_id: warehouseId,
            item_id: item.itemId,
            ...nextValues,
          });

      if (insertError) {
        throw insertError;
      }
    }
  }
}

export async function createReturn(
  returnData
) {
  const returnPayload = {
    dispatch_id: Number(
      returnData.dispatchId
    ),
    return_date: returnData.returnDate,
    received_by:
      returnData.returnedBy.trim(),
    notes:
      returnData.notes.trim() || null,
    is_completed: true,
    completed_at:
      new Date().toISOString(),
  };

  const {
    data: createdReturn,
    error: returnError,
  } = await supabase
    .from("returns")
    .insert(returnPayload)
    .select("id")
    .single();

  if (returnError) {
    throw returnError;
  }

  const returnItemsPayload =
    returnData.items.map((item) => ({
      return_id: createdReturn.id,
      dispatch_item_id:
        Number(item.dispatchItemId),
      returned_quantity: Number(
        item.goodReturned || 0
      ),
      damaged_quantity: Number(
        item.damaged || 0
      ),
      missing_quantity: Number(
        item.missing || 0
      ),
    }));

  const { error: itemsError } =
    await supabase
      .from("return_items")
      .insert(returnItemsPayload);

  if (itemsError) {
    await supabase
      .from("returns")
      .delete()
      .eq("id", createdReturn.id);

    throw itemsError;
  }

  try {
    await updateInventoryForReturn({
      warehouseId: Number(
        returnData.warehouseId
      ),
      items: returnData.items,
      direction: 1,
    });
  } catch (inventoryError) {
    await supabase
      .from("returns")
      .delete()
      .eq("id", createdReturn.id);

    throw inventoryError;
  }

  const { data, error } = await supabase
    .from("returns")
    .select(RETURN_FIELDS)
    .eq("id", createdReturn.id)
    .single();

  if (error) {
    throw error;
  }

  return mapReturnFromDatabase(data);
}

export async function removeReturn(
  returnId
) {
  const { data, error } = await supabase
    .from("returns")
    .select(RETURN_FIELDS)
    .eq("id", returnId)
    .single();

  if (error) {
    throw error;
  }

  const mappedReturn =
    mapReturnFromDatabase(data);

  await updateInventoryForReturn({
    warehouseId: Number(
      mappedReturn.warehouseId
    ),
    items: mappedReturn.items,
    direction: -1,
  });

  const { error: deleteError } =
    await supabase
      .from("returns")
      .delete()
      .eq("id", returnId);

  if (deleteError) {
    await updateInventoryForReturn({
      warehouseId: Number(
        mappedReturn.warehouseId
      ),
      items: mappedReturn.items,
      direction: 1,
    });

    throw deleteError;
  }

  return true;
}
