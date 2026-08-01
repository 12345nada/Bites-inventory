import { supabase } from "../lib/supabase";

const PURCHASE_FIELDS = `
  id,
  po_number,
  supplier_id,
  warehouse_id,
  order_date,
  expected_date,
  status,
  notes,
  created_at,
  updated_at,
  supplier:suppliers (
    id,
    supplier_code,
    name
  ),
  warehouse:warehouses (
    id,
    warehouse_code,
    name,
    branch
  ),
  purchase_order_items (
    id,
    item_id,
    quantity,
    unit_cost,
    item:items (
      id,
      item_code,
      name
    )
  )
`;

export const mapPurchaseFromDatabase = (purchase) => {
  const firstItem =
    purchase.purchase_order_items?.[0] || null;

  const quantity = Number(
    firstItem?.quantity || 0
  );

  const unitCost = Number(
    firstItem?.unit_cost || 0
  );

  return {
    id: purchase.id,
    poNumber:
      purchase.po_number ||
      `PO-${new Date(
        purchase.order_date
      ).getFullYear()}-${String(
        purchase.id
      ).padStart(3, "0")}`,
    supplierId: purchase.supplier_id,
    supplier:
      purchase.supplier?.name || "",
    warehouseId: purchase.warehouse_id,
    warehouse:
      purchase.warehouse?.name || "",
    warehouseBranch:
      purchase.warehouse?.branch || "",
    orderDate: purchase.order_date || "",
    expectedDate:
      purchase.expected_date || "",
    itemId: firstItem?.item_id || "",
    itemName:
      firstItem?.item?.name || "",
    quantity,
    unitCost,
    totalAmount: quantity * unitCost,
    status: purchase.status || "Pending",
    notes: purchase.notes || "",
    createdAt: purchase.created_at,
    updatedAt: purchase.updated_at,
  };
};

export async function getPurchasePageData() {
  const [
    purchasesResult,
    suppliersResult,
    warehousesResult,
    itemsResult,
  ] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select(PURCHASE_FIELDS)
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("suppliers")
      .select(`
        id,
        supplier_code,
        name
      `)
      .eq("status", "Active")
      .order("name", {
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
      .from("items")
      .select(`
        id,
        item_code,
        name,
        purchase_cost,
        is_active
      `)
      .eq("is_active", true)
      .order("name", {
        ascending: true,
      }),
  ]);

  const firstError =
    purchasesResult.error ||
    suppliersResult.error ||
    warehousesResult.error ||
    itemsResult.error;

  if (firstError) {
    throw firstError;
  }

  return {
    purchases: (
      purchasesResult.data || []
    ).map(mapPurchaseFromDatabase),
    suppliers: suppliersResult.data || [],
    warehouses:
      warehousesResult.data || [],
    items: itemsResult.data || [],
  };
}

const createPurchaseOrderPayload = (
  formData
) => ({
  supplier_id: Number(
    formData.supplierId
  ),
  warehouse_id: Number(
    formData.warehouseId
  ),
  order_date: formData.orderDate,
  expected_date:
    formData.expectedDate || null,
  status: "Pending",
});

export async function createPurchase(
  formData
) {
  const {
    data: purchaseOrder,
    error: orderError,
  } = await supabase
    .from("purchase_orders")
    .insert(
      createPurchaseOrderPayload(
        formData
      )
    )
    .select("id")
    .single();

  if (orderError) {
    throw orderError;
  }

  const { error: itemError } =
    await supabase
      .from("purchase_order_items")
      .insert({
        purchase_order_id:
          purchaseOrder.id,
        item_id: Number(
          formData.itemId
        ),
        quantity: Number(
          formData.quantity
        ),
        unit_cost: Number(
          formData.unitCost
        ),
      });

  if (itemError) {
    await supabase
      .from("purchase_orders")
      .delete()
      .eq("id", purchaseOrder.id);

    throw itemError;
  }

  const { data, error } = await supabase
    .from("purchase_orders")
    .select(PURCHASE_FIELDS)
    .eq("id", purchaseOrder.id)
    .single();

  if (error) {
    throw error;
  }

  return mapPurchaseFromDatabase(data);
}

export async function updatePurchase(
  purchaseId,
  formData
) {
  const { error: orderError } =
    await supabase
      .from("purchase_orders")
      .update({
        supplier_id: Number(
          formData.supplierId
        ),
        warehouse_id: Number(
          formData.warehouseId
        ),
        order_date:
          formData.orderDate,
        expected_date:
          formData.expectedDate || null,
      })
      .eq("id", purchaseId)
      .in("status", [
        "Pending",
        "Approved",
      ]);

  if (orderError) {
    throw orderError;
  }

  const {
    data: currentItem,
    error: currentItemError,
  } = await supabase
    .from("purchase_order_items")
    .select("id")
    .eq(
      "purchase_order_id",
      purchaseId
    )
    .maybeSingle();

  if (currentItemError) {
    throw currentItemError;
  }

  if (currentItem?.id) {
    const { error: updateItemError } =
      await supabase
        .from("purchase_order_items")
        .update({
          item_id: Number(
            formData.itemId
          ),
          quantity: Number(
            formData.quantity
          ),
          unit_cost: Number(
            formData.unitCost
          ),
        })
        .eq("id", currentItem.id);

    if (updateItemError) {
      throw updateItemError;
    }
  } else {
    const { error: insertItemError } =
      await supabase
        .from("purchase_order_items")
        .insert({
          purchase_order_id:
            purchaseId,
          item_id: Number(
            formData.itemId
          ),
          quantity: Number(
            formData.quantity
          ),
          unit_cost: Number(
            formData.unitCost
          ),
        });

    if (insertItemError) {
      throw insertItemError;
    }
  }

  const { data, error } = await supabase
    .from("purchase_orders")
    .select(PURCHASE_FIELDS)
    .eq("id", purchaseId)
    .single();

  if (error) {
    throw error;
  }

  return mapPurchaseFromDatabase(data);
}

export async function updatePurchaseStatus(
  purchaseId,
  status
) {
  const { data, error } = await supabase
    .from("purchase_orders")
    .update({ status })
    .eq("id", purchaseId)
    .select(PURCHASE_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return mapPurchaseFromDatabase(data);
}

export async function receivePurchase(
  purchase
) {
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
      purchase.warehouseId
    )
    .eq("item_id", purchase.itemId)
    .maybeSingle();

  if (inventoryError) {
    throw inventoryError;
  }

  if (inventoryRow?.id) {
    const { error: updateInventoryError } =
      await supabase
        .from("warehouse_inventory")
        .update({
          available_quantity:
            Number(
              inventoryRow.available_quantity ||
                0
            ) +
            Number(purchase.quantity),
        })
        .eq("id", inventoryRow.id);

    if (updateInventoryError) {
      throw updateInventoryError;
    }
  } else {
    const { error: insertInventoryError } =
      await supabase
        .from("warehouse_inventory")
        .insert({
          warehouse_id:
            purchase.warehouseId,
          item_id: purchase.itemId,
          available_quantity:
            Number(purchase.quantity),
          reserved_quantity: 0,
          damaged_quantity: 0,
          missing_quantity: 0,
          minimum_stock: 0,
        });

    if (insertInventoryError) {
      throw insertInventoryError;
    }
  }

  try {
    return await updatePurchaseStatus(
      purchase.id,
      "Received"
    );
  } catch (statusError) {
    const rollbackQuantity = Math.max(
      0,
      Number(
        inventoryRow?.available_quantity ||
          0
      )
    );

    if (inventoryRow?.id) {
      await supabase
        .from("warehouse_inventory")
        .update({
          available_quantity:
            rollbackQuantity,
        })
        .eq("id", inventoryRow.id);
    } else {
      await supabase
        .from("warehouse_inventory")
        .delete()
        .eq(
          "warehouse_id",
          purchase.warehouseId
        )
        .eq(
          "item_id",
          purchase.itemId
        );
    }

    throw statusError;
  }
}

export async function removePurchase(
  purchaseId
) {
  const { error } = await supabase
    .from("purchase_orders")
    .delete()
    .eq("id", purchaseId);

  if (error) {
    throw error;
  }

  return true;
}
