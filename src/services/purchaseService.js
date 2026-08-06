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

export const mapPurchaseFromDatabase = (
  purchase
) => {
  const purchaseItems = (
    purchase.purchase_order_items || []
  ).map((purchaseItem) => ({
    id: purchaseItem.id,
    itemId: purchaseItem.item_id,
    name: purchaseItem.item?.name || "",
    itemCode:
      purchaseItem.item?.item_code || "",
    quantity: Number(
      purchaseItem.quantity || 0
    ),
    unitCost: Number(
      purchaseItem.unit_cost || 0
    ),
    totalAmount:
      Number(purchaseItem.quantity || 0) *
      Number(purchaseItem.unit_cost || 0),
  }));

  const totalQuantity =
    purchaseItems.reduce(
      (total, purchaseItem) =>
        total + purchaseItem.quantity,
      0
    );

  const totalAmount =
    purchaseItems.reduce(
      (total, purchaseItem) =>
        total + purchaseItem.totalAmount,
      0
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
    items: purchaseItems,
    itemNames: purchaseItems.map(
      (purchaseItem) =>
        purchaseItem.name
    ),
    totalQuantity,
    totalAmount,
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
    suppliers:
      suppliersResult.data || [],
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

const createPurchaseItemsPayload = (
  purchaseOrderId,
  items
) =>
  items.map((purchaseItem) => ({
    purchase_order_id:
      purchaseOrderId,
    item_id: Number(
      purchaseItem.itemId
    ),
    quantity: Number(
      purchaseItem.quantity
    ),
    unit_cost: Number(
      purchaseItem.unitCost
    ),
  }));

async function getPurchaseById(
  purchaseId
) {
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
      .insert(
        createPurchaseItemsPayload(
          purchaseOrder.id,
          formData.items
        )
      );

  if (itemError) {
    await supabase
      .from("purchase_orders")
      .delete()
      .eq("id", purchaseOrder.id);

    throw itemError;
  }

  return getPurchaseById(
    purchaseOrder.id
  );
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
          formData.expectedDate ||
          null,
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
    data: previousItems,
    error: previousItemsError,
  } = await supabase
    .from("purchase_order_items")
    .select(`
      item_id,
      quantity,
      unit_cost
    `)
    .eq(
      "purchase_order_id",
      purchaseId
    );

  if (previousItemsError) {
    throw previousItemsError;
  }

  const { error: deleteItemsError } =
    await supabase
      .from("purchase_order_items")
      .delete()
      .eq(
        "purchase_order_id",
        purchaseId
      );

  if (deleteItemsError) {
    throw deleteItemsError;
  }

  const { error: insertItemsError } =
    await supabase
      .from("purchase_order_items")
      .insert(
        createPurchaseItemsPayload(
          purchaseId,
          formData.items
        )
      );

  if (insertItemsError) {
    if (
      previousItems &&
      previousItems.length > 0
    ) {
      await supabase
        .from("purchase_order_items")
        .insert(
          previousItems.map(
            (purchaseItem) => ({
              purchase_order_id:
                purchaseId,
              item_id:
                purchaseItem.item_id,
              quantity:
                purchaseItem.quantity,
              unit_cost:
                purchaseItem.unit_cost,
            })
          )
        );
    }

    throw insertItemsError;
  }

  return getPurchaseById(purchaseId);
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
  const inventoryChanges = [];

  try {
    for (
      const purchaseItem of
      purchase.items
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
        .eq(
          "item_id",
          purchaseItem.itemId
        )
        .maybeSingle();

      if (inventoryError) {
        throw inventoryError;
      }

      if (inventoryRow?.id) {
        const previousQuantity =
          Number(
            inventoryRow.available_quantity ||
              0
          );

        const { error:
          updateInventoryError } =
          await supabase
            .from(
              "warehouse_inventory"
            )
            .update({
              available_quantity:
                previousQuantity +
                Number(
                  purchaseItem.quantity
                ),
            })
            .eq(
              "id",
              inventoryRow.id
            );

        if (updateInventoryError) {
          throw updateInventoryError;
        }

        inventoryChanges.push({
          type: "update",
          id: inventoryRow.id,
          previousQuantity,
        });
      } else {
        const {
          data: insertedRow,
          error:
            insertInventoryError,
        } = await supabase
          .from("warehouse_inventory")
          .insert({
            warehouse_id:
              purchase.warehouseId,
            item_id:
              purchaseItem.itemId,
            available_quantity:
              Number(
                purchaseItem.quantity
              ),
            reserved_quantity: 0,
            damaged_quantity: 0,
            missing_quantity: 0,
            minimum_stock: 0,
          })
          .select("id")
          .single();

        if (insertInventoryError) {
          throw insertInventoryError;
        }

        inventoryChanges.push({
          type: "insert",
          id: insertedRow.id,
        });
      }
    }

    return await updatePurchaseStatus(
      purchase.id,
      "Received"
    );
  } catch (error) {
    for (
      const inventoryChange of
      inventoryChanges.reverse()
    ) {
      if (
        inventoryChange.type ===
        "update"
      ) {
        await supabase
          .from("warehouse_inventory")
          .update({
            available_quantity:
              inventoryChange
                .previousQuantity,
          })
          .eq(
            "id",
            inventoryChange.id
          );
      } else {
        await supabase
          .from("warehouse_inventory")
          .delete()
          .eq(
            "id",
            inventoryChange.id
          );
      }
    }

    throw error;
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
