import { supabase } from "../lib/supabase";

const WAREHOUSE_FIELDS = `
  id,
  warehouse_code,
  name,
  branch,
  location,
  total_capacity,
  created_at,
  updated_at,
  warehouse_inventory (
    available_quantity,
    reserved_quantity,
    damaged_quantity,
    missing_quantity
  )
`;

const calculateUsedCapacity = (inventoryRows = []) =>
  inventoryRows.reduce((total, row) => {
    return (
      total +
      Number(row.available_quantity || 0) +
      Number(row.reserved_quantity || 0) +
      Number(row.damaged_quantity || 0) +
      Number(row.missing_quantity || 0)
    );
  }, 0);

export const mapWarehouseFromDatabase = (warehouse) => {
  const usedCapacity = calculateUsedCapacity(
    warehouse.warehouse_inventory || []
  );

  return {
    id: warehouse.id,
    warehouseCode:
      warehouse.warehouse_code ||
      `WH-${String(warehouse.id).padStart(3, "0")}`,
    name: warehouse.name || "",
    branch: warehouse.branch || "",
    location: warehouse.location || "",
    capacity: Number(warehouse.total_capacity || 0),
    usedCapacity,
    createdAt: warehouse.created_at,
    updatedAt: warehouse.updated_at,
  };
};

const createWarehousePayload = (warehouseData) => ({
  name: warehouseData.name.trim(),
  branch: warehouseData.branch,
  location: warehouseData.location.trim(),
  total_capacity: Number(warehouseData.capacity),
});

export async function getWarehouses() {
  const { data, error } = await supabase
    .from("warehouses")
    .select(WAREHOUSE_FIELDS)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data || []).map(mapWarehouseFromDatabase);
}

export async function createWarehouse(warehouseData) {
  const payload = createWarehousePayload(warehouseData);

  const { data, error } = await supabase
    .from("warehouses")
    .insert(payload)
    .select(WAREHOUSE_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return mapWarehouseFromDatabase(data);
}

export async function updateWarehouse(
  warehouseId,
  warehouseData
) {
  const payload = createWarehousePayload(warehouseData);

  const { data, error } = await supabase
    .from("warehouses")
    .update(payload)
    .eq("id", warehouseId)
    .select(WAREHOUSE_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return mapWarehouseFromDatabase(data);
}

export async function removeWarehouse(warehouseId) {
  const { error } = await supabase
    .from("warehouses")
    .delete()
    .eq("id", warehouseId);

  if (error) {
    throw error;
  }

  return true;
}
