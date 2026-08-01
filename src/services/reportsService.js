import { supabase } from "../lib/supabase";

const formatNumber = (value) =>
  Number(value || 0).toLocaleString();

export async function getReportsData() {
  const [
    inventoryResult,
    purchasesResult,
    dispatchesResult,
    returnsResult,
    warehousesResult,
  ] = await Promise.all([
    supabase
      .from("inventory_report")
      .select(`
        item_id,
        item_code,
        item_name,
        category_name,
        warehouse_id,
        warehouse_name,
        available_quantity,
        damaged_quantity,
        missing_quantity,
        minimum_stock,
        available_stock_value
      `)
      .order("item_name", {
        ascending: true,
      }),

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
      .order("order_date", {
        ascending: false,
      }),

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
      .order("dispatch_date", {
        ascending: false,
      }),

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
      .order("return_date", {
        ascending: false,
      }),

    supabase
      .from("warehouses")
      .select(`
        id,
        name,
        branch
      `)
      .order("name", {
        ascending: true,
      }),
  ]);

  const firstError =
    inventoryResult.error ||
    purchasesResult.error ||
    dispatchesResult.error ||
    returnsResult.error ||
    warehousesResult.error;

  if (firstError) {
    throw firstError;
  }

  const inventory = (
    inventoryResult.data || []
  ).map((row) => {
    const available = Number(
      row.available_quantity || 0
    );

    const minimumStock = Number(
      row.minimum_stock || 0
    );

    const stockLevel =
      available <= minimumStock
        ? "Low Stock"
        : "In Stock";

    return {
      id: `${row.item_id}-${row.warehouse_id}`,
      itemCode: row.item_code || "",
      itemName: row.item_name || "",
      category:
        row.category_name || "-",
      warehouseId: row.warehouse_id,
      warehouse:
        row.warehouse_name || "",
      available,
      damaged: Number(
        row.damaged_quantity || 0
      ),
      missing: Number(
        row.missing_quantity || 0
      ),
      minimumStock,
      stockLevel,
      stockValue: Number(
        row.available_stock_value || 0
      ),
    };
  });

  const purchases = (
    purchasesResult.data || []
  ).map((purchase) => {
    const item =
      purchase.purchase_order_items?.[0] ||
      null;

    const quantity = Number(
      item?.quantity || 0
    );

    const unitCost = Number(
      item?.unit_cost || 0
    );

    return {
      id: purchase.id,
      poNumber:
        purchase.po_number ||
        `PO-${purchase.id}`,
      supplier:
        purchase.supplier?.name || "-",
      itemName:
        item?.item?.name || "-",
      warehouseId:
        purchase.warehouse?.id || "",
      warehouse:
        purchase.warehouse?.name || "",
      branch:
        purchase.warehouse?.branch || "",
      quantity,
      unitCost,
      totalAmount:
        quantity * unitCost,
      orderDate:
        purchase.order_date || "",
      expectedDate:
        purchase.expected_date || "",
      status:
        purchase.status || "Pending",
    };
  });

  const dispatches = (
    dispatchesResult.data || []
  ).map((dispatch) => ({
    id: dispatch.id,
    dispatchCode:
      dispatch.dispatch_code ||
      `DSP-${dispatch.id}`,
    eventReference:
      dispatch.event?.event_code || "",
    eventType:
      dispatch.event?.event_type || "",
    warehouseId:
      dispatch.warehouse?.id || "",
    fromWarehouse:
      dispatch.warehouse?.name || "",
    toLocation:
      dispatch.destination || "",
    area: dispatch.area || "",
    driver:
      dispatch.driver?.full_name || "-",
    date: dispatch.dispatch_date || "",
    time: dispatch.dispatch_time || "",
    status:
      dispatch.status || "Prepared",
    items: (
      dispatch.dispatch_items || []
    ).map((item) => ({
      name:
        item.item?.name || "",
      itemCode:
        item.item?.item_code || "",
      quantity: Number(
        item.quantity || 0
      ),
    })),
  }));

  const returns = (
    returnsResult.data || []
  ).map((returnRecord) => ({
    id: returnRecord.id,
    returnCode:
      returnRecord.return_code ||
      `RET-${returnRecord.id}`,
    dispatchCode:
      returnRecord.dispatch
        ?.dispatch_code || "",
    eventReference:
      returnRecord.dispatch?.event
        ?.event_code || "",
    warehouseId:
      returnRecord.dispatch?.warehouse
        ?.id || "",
    warehouse:
      returnRecord.dispatch?.warehouse
        ?.name || "",
    returnDate:
      returnRecord.return_date || "",
    returnedBy:
      returnRecord.received_by || "",
    notes:
      returnRecord.notes || "",
    items: (
      returnRecord.return_items || []
    ).map((item) => ({
      name:
        item.dispatch_item?.item
          ?.name || "",
      itemCode:
        item.dispatch_item?.item
          ?.item_code || "",
      dispatchedQuantity: Number(
        item.dispatch_item?.quantity || 0
      ),
      goodReturned: Number(
        item.returned_quantity || 0
      ),
      damaged: Number(
        item.damaged_quantity || 0
      ),
      missing: Number(
        item.missing_quantity || 0
      ),
    })),
  }));

  return {
    inventory,
    purchases,
    dispatches,
    returns,
    warehouses:
      warehousesResult.data || [],
  };
}

export function getInventoryReportRows(
  inventory
) {
  return inventory.map((item) => ({
    searchValues: [
      item.itemCode,
      item.itemName,
      item.category,
      item.warehouse,
      item.stockLevel,
    ],
    warehouseId: item.warehouseId,
    status: item.stockLevel,
    date: "",
    cells: [
      item.itemCode,
      item.itemName,
      item.category,
      item.warehouse,
      formatNumber(item.available),
      formatNumber(item.damaged),
      formatNumber(item.missing),
      formatNumber(item.minimumStock),
      item.stockLevel,
    ],
  }));
}

export function getPurchaseReportRows(
  purchases
) {
  return purchases.map((purchase) => ({
    searchValues: [
      purchase.poNumber,
      purchase.supplier,
      purchase.itemName,
      purchase.warehouse,
      purchase.branch,
      purchase.status,
    ],
    warehouseId:
      purchase.warehouseId,
    status: purchase.status,
    date: purchase.orderDate,
    cells: [
      purchase.poNumber,
      purchase.supplier,
      purchase.itemName,
      purchase.warehouse,
      formatNumber(purchase.quantity),
      `${formatNumber(
        purchase.totalAmount
      )} EGP`,
      purchase.orderDate,
      purchase.status,
    ],
  }));
}

export function getDispatchReportRows(
  dispatches
) {
  return dispatches.map((dispatch) => {
    const totalQuantity =
      dispatch.items.reduce(
        (total, item) =>
          total +
          Number(item.quantity || 0),
        0
      );

    return {
      searchValues: [
        dispatch.dispatchCode,
        dispatch.eventReference,
        dispatch.fromWarehouse,
        dispatch.toLocation,
        dispatch.area,
        dispatch.driver,
        dispatch.status,
      ],
      warehouseId:
        dispatch.warehouseId,
      status: dispatch.status,
      date: dispatch.date,
      cells: [
        dispatch.dispatchCode,
        dispatch.eventReference,
        dispatch.fromWarehouse,
        `${dispatch.toLocation}${
          dispatch.area
            ? `, ${dispatch.area}`
            : ""
        }`,
        dispatch.driver,
        dispatch.date,
        formatNumber(totalQuantity),
        dispatch.status,
      ],
    };
  });
}

export function getReturnsReportRows(
  returns
) {
  return returns.map((record) => {
    const totals = record.items.reduce(
      (result, item) => {
        result.sent += Number(
          item.dispatchedQuantity || 0
        );
        result.returned += Number(
          item.goodReturned || 0
        );
        result.damaged += Number(
          item.damaged || 0
        );
        result.missing += Number(
          item.missing || 0
        );

        return result;
      },
      {
        sent: 0,
        returned: 0,
        damaged: 0,
        missing: 0,
      }
    );

    const returnStatus =
      totals.missing > 0
        ? "Has Missing"
        : totals.damaged > 0
          ? "Has Damage"
          : "Clear";

    return {
      searchValues: [
        record.returnCode,
        record.dispatchCode,
        record.eventReference,
        record.warehouse,
        record.returnedBy,
        returnStatus,
      ],
      warehouseId:
        record.warehouseId,
      status: returnStatus,
      date: record.returnDate,
      cells: [
        record.returnCode,
        record.eventReference,
        record.warehouse,
        record.returnDate,
        record.returnedBy,
        formatNumber(totals.sent),
        formatNumber(totals.returned),
        formatNumber(totals.damaged),
        formatNumber(totals.missing),
      ],
    };
  });
}
