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
    event:events (id, event_code, event_type),
    warehouse:warehouses (id, warehouse_code, name)
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
        name,
        item_type
      )
    )
  )
`;

export const mapReturnFromDatabase = (record) => ({
  id: record.id,
  returnCode:
    record.return_code ||
    `RET-${String(record.id).padStart(5, "0")}`,
  dispatchId: record.dispatch_id,
  dispatchCode: record.dispatch?.dispatch_code || "",
  eventReference: record.dispatch?.event?.event_code || "",
  eventName: record.dispatch?.event?.event_type || "",
  warehouseId: record.dispatch?.warehouse_id || "",
  warehouse: record.dispatch?.warehouse?.name || "",
  returnDate: record.return_date || "",
  returnedBy: record.received_by || "",
  notes: record.notes || "",
  status: record.is_completed ? "Completed" : "Pending",
  isCompleted: Boolean(record.is_completed),
  items: (record.return_items || [])
    .filter(
      (row) =>
        (row.dispatch_item?.item?.item_type || "Reusable") !==
        "Consumable"
    )
    .map((row) => ({
      id: row.id,
      dispatchItemId: row.dispatch_item_id,
      itemId: row.dispatch_item?.item_id,
      name: row.dispatch_item?.item?.name || "",
      itemCode: row.dispatch_item?.item?.item_code || "",
      itemType:
        row.dispatch_item?.item?.item_type || "Reusable",
      dispatchedQuantity: Number(
        row.dispatch_item?.quantity || 0
      ),
      goodReturned: Number(row.returned_quantity || 0),
      damaged: Number(row.damaged_quantity || 0),
      missing: Number(row.missing_quantity || 0),
      notes: row.notes || "",
    })),
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export async function getReturnsPageData() {
  const [returnsResult, dispatchesResult] =
    await Promise.all([
      supabase
        .from("returns")
        .select(RETURN_FIELDS)
        .order("return_date", { ascending: false })
        .order("created_at", { ascending: false }),

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
              name,
              item_type
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

  const returns = (returnsResult.data || []).map(
    mapReturnFromDatabase
  );

  const usedDispatchIds = new Set(
    returns.map((row) =>
      String(row.dispatchId)
    )
  );

  const availableDispatches =
    (dispatchesResult.data || [])
      .filter(
        (dispatch) =>
          !usedDispatchIds.has(
            String(dispatch.id)
          )
      )
      .map((dispatch) => {
        const reusableItems =
          (dispatch.dispatch_items || [])
            .filter(
              (item) =>
                (item.item?.item_type || "Reusable") !==
                "Consumable"
            )
            .map((item) => ({
              dispatchItemId: item.id,
              itemId: item.item_id,
              name: item.item?.name || "",
              itemCode:
                item.item?.item_code || "",
              itemType:
                item.item?.item_type ||
                "Reusable",
              dispatchedQuantity: Number(
                item.quantity || 0
              ),
              goodReturned: "",
              damaged: "",
              missing: "",
            }));

        return {
          id: dispatch.id,
          dispatchCode:
            dispatch.dispatch_code || "",
          eventReference:
            dispatch.event?.event_code || "",
          eventName:
            dispatch.event?.event_type || "",
          warehouseId:
            dispatch.warehouse_id,
          warehouse:
            dispatch.warehouse?.name || "",
          destination:
            dispatch.destination || "",
          area: dispatch.area || "",
          items: reusableItems,
        };
      })
      // A dispatch containing only consumables
      // does not need a Return record.
      .filter(
        (dispatch) =>
          dispatch.items.length > 0
      );

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
  const reusableItems = (items || []).filter(
    (item) =>
      (item.itemType || "Reusable") !==
      "Consumable"
  );

  for (const item of reusableItems) {
    const { data, error } =
      await supabase
        .from("warehouse_inventory")
        .select(`
          id,
          available_quantity,
          damaged_quantity,
          missing_quantity
        `)
        .eq(
          "warehouse_id",
          warehouseId
        )
        .eq("item_id", item.itemId)
        .maybeSingle();

    if (error) {
      throw error;
    }

    const nextValues = {
      available_quantity:
        Number(
          data?.available_quantity || 0
        ) +
        direction *
          Number(
            item.goodReturned || 0
          ),

      damaged_quantity:
        Number(
          data?.damaged_quantity || 0
        ) +
        direction *
          Number(item.damaged || 0),

      missing_quantity:
        Number(
          data?.missing_quantity || 0
        ) +
        direction *
          Number(item.missing || 0),
    };

    if (
      Object.values(
        nextValues
      ).some(
        (value) => value < 0
      )
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
            warehouse_id:
              warehouseId,
            item_id: item.itemId,
            ...nextValues,
          });

      if (insertError) {
        throw insertError;
      }
    }
  }
}

const itemRows = (
  returnId,
  items
) =>
  (items || [])
    .filter(
      (item) =>
        (item.itemType || "Reusable") !==
        "Consumable"
    )
    .map((item) => ({
      return_id: returnId,
      dispatch_item_id: Number(
        item.dispatchItemId
      ),
      returned_quantity: Number(
        item.goodReturned || 0
      ),
      damaged_quantity: Number(
        item.damaged || 0
      ),
      missing_quantity: Number(
        item.missing || 0
      ),
      notes:
        item.notes?.trim() || null,
    }));

export async function createReturn(
  returnData
) {
  const reusableItems =
    (returnData.items || []).filter(
      (item) =>
        (item.itemType || "Reusable") !==
        "Consumable"
    );

  if (reusableItems.length === 0) {
    throw new Error(
      "This dispatch contains only consumable items and does not require a return."
    );
  }

  const {
    data: created,
    error,
  } = await supabase
    .from("returns")
    .insert({
      dispatch_id: Number(
        returnData.dispatchId
      ),
      return_date:
        returnData.returnDate,
      received_by:
        returnData.returnedBy.trim(),
      notes:
        returnData.notes.trim() ||
        null,
      is_completed: true,
      completed_at:
        new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  const {
    error: itemsError,
  } = await supabase
    .from("return_items")
    .insert(
      itemRows(
        created.id,
        reusableItems
      )
    );

  if (itemsError) {
    await supabase
      .from("returns")
      .delete()
      .eq("id", created.id);

    throw itemsError;
  }

  try {
    await updateInventoryForReturn({
      warehouseId: Number(
        returnData.warehouseId
      ),
      items: reusableItems,
      direction: 1,
    });
  } catch (inventoryError) {
    await supabase
      .from("returns")
      .delete()
      .eq("id", created.id);

    throw inventoryError;
  }

  const {
    data,
    error: selectError,
  } = await supabase
    .from("returns")
    .select(RETURN_FIELDS)
    .eq("id", created.id)
    .single();

  if (selectError) {
    throw selectError;
  }

  return mapReturnFromDatabase(
    data
  );
}

export async function updateReturn(
  returnId,
  returnData
) {
  const {
    data: oldData,
    error: oldError,
  } = await supabase
    .from("returns")
    .select(RETURN_FIELDS)
    .eq("id", returnId)
    .single();

  if (oldError) {
    throw oldError;
  }

  const oldReturn =
    mapReturnFromDatabase(
      oldData
    );

  const newItems =
    (returnData.items || []).filter(
      (item) =>
        (item.itemType || "Reusable") !==
        "Consumable"
    );

  await updateInventoryForReturn({
    warehouseId: Number(
      oldReturn.warehouseId
    ),
    items: oldReturn.items,
    direction: -1,
  });

  try {
    await updateInventoryForReturn({
      warehouseId: Number(
        returnData.warehouseId
      ),
      items: newItems,
      direction: 1,
    });

    const { error: updateError } =
      await supabase
        .from("returns")
        .update({
          return_date:
            returnData.returnDate,
          received_by:
            returnData.returnedBy.trim(),
          notes:
            returnData.notes.trim() ||
            null,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", returnId);

    if (updateError) {
      throw updateError;
    }

    const {
      error: deleteItemsError,
    } = await supabase
      .from("return_items")
      .delete()
      .eq("return_id", returnId);

    if (deleteItemsError) {
      throw deleteItemsError;
    }

    const rows = itemRows(
      returnId,
      newItems
    );

    if (rows.length > 0) {
      const {
        error: insertItemsError,
      } = await supabase
        .from("return_items")
        .insert(rows);

      if (insertItemsError) {
        throw insertItemsError;
      }
    }
  } catch (error) {
    try {
      await updateInventoryForReturn({
        warehouseId: Number(
          returnData.warehouseId
        ),
        items: newItems,
        direction: -1,
      });

      await updateInventoryForReturn({
        warehouseId: Number(
          oldReturn.warehouseId
        ),
        items: oldReturn.items,
        direction: 1,
      });
    } catch (rollbackError) {
      console.error(
        "Return rollback error:",
        rollbackError
      );
    }

    throw error;
  }

  const { data, error } =
    await supabase
      .from("returns")
      .select(RETURN_FIELDS)
      .eq("id", returnId)
      .single();

  if (error) {
    throw error;
  }

  return mapReturnFromDatabase(
    data
  );
}

export async function removeReturn(
  returnId
) {
  const { data, error } =
    await supabase
      .from("returns")
      .select(RETURN_FIELDS)
      .eq("id", returnId)
      .single();

  if (error) {
    throw error;
  }

  const mapped =
    mapReturnFromDatabase(data);

  await updateInventoryForReturn({
    warehouseId: Number(
      mapped.warehouseId
    ),
    items: mapped.items,
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
        mapped.warehouseId
      ),
      items: mapped.items,
      direction: 1,
    });

    throw deleteError;
  }

  return true;
}
