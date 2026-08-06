import { supabase } from "../lib/supabase";

const SUPPLIER_FIELDS = `
  id,
  supplier_code,
  name,
  contact_person,
  phone,
  email,
  address,
  status,
  created_at,
  updated_at
`;

const ITEM_FIELDS = `
  id,
  item_code,
  name,
  primary_supplier_id,
  is_active
`;

export const mapSupplierFromDatabase = (
  supplier,
  allItems = []
) => {
  const supplierItems = allItems.filter(
    (item) =>
      Number(item.primary_supplier_id) ===
      Number(supplier.id)
  );

  return {
    id: supplier.id,
    supplierCode:
      supplier.supplier_code ||
      `SUP-${String(
        supplier.id
      ).padStart(3, "0")}`,
    name: supplier.name || "",
    contactPerson:
      supplier.contact_person || "",
    phone: supplier.phone || "",
    email: supplier.email || "",
    address: supplier.address || "",
    itemIds: supplierItems.map(
      (item) => item.id
    ),
    itemNames: supplierItems.map(
      (item) => item.name
    ),
    status: supplier.status || "Active",
    createdAt: supplier.created_at,
    updatedAt: supplier.updated_at,
  };
};

const createSupplierPayload = (
  supplierData
) => ({
  name: supplierData.name.trim(),
  contact_person:
    supplierData.contactPerson.trim(),
  phone: supplierData.phone.trim(),
  email: supplierData.email
    .trim()
    .toLowerCase(),
  address: supplierData.address.trim(),
  status: supplierData.status,
});

async function getAllActiveItems() {
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_FIELDS)
    .eq("is_active", true)
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

async function syncSupplierItems(
  supplierId,
  itemIds = []
) {
  const normalizedItemIds = itemIds.map(
    (id) => Number(id)
  );

  const { error: clearError } =
    await supabase
      .from("items")
      .update({
        primary_supplier_id: null,
      })
      .eq(
        "primary_supplier_id",
        supplierId
      );

  if (clearError) {
    throw clearError;
  }

  if (normalizedItemIds.length === 0) {
    return;
  }

  const { error: assignError } =
    await supabase
      .from("items")
      .update({
        primary_supplier_id:
          Number(supplierId),
      })
      .in("id", normalizedItemIds);

  if (assignError) {
    throw assignError;
  }
}

async function getSupplierById(
  supplierId
) {
  const [
    supplierResult,
    items,
  ] = await Promise.all([
    supabase
      .from("suppliers")
      .select(SUPPLIER_FIELDS)
      .eq("id", supplierId)
      .single(),
    getAllActiveItems(),
  ]);

  if (supplierResult.error) {
    throw supplierResult.error;
  }

  return mapSupplierFromDatabase(
    supplierResult.data,
    items
  );
}

export async function getSupplierPageData() {
  const [
    suppliersResult,
    items,
  ] = await Promise.all([
    supabase
      .from("suppliers")
      .select(SUPPLIER_FIELDS)
      .order("created_at", {
        ascending: false,
      }),
    getAllActiveItems(),
  ]);

  if (suppliersResult.error) {
    throw suppliersResult.error;
  }

  return {
    suppliers: (
      suppliersResult.data || []
    ).map((supplier) =>
      mapSupplierFromDatabase(
        supplier,
        items
      )
    ),
    items,
  };
}

export async function createSupplier(
  supplierData
) {
  const { data, error } = await supabase
    .from("suppliers")
    .insert(
      createSupplierPayload(
        supplierData
      )
    )
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  try {
    await syncSupplierItems(
      data.id,
      supplierData.itemIds
    );
  } catch (syncError) {
    await supabase
      .from("suppliers")
      .delete()
      .eq("id", data.id);

    throw syncError;
  }

  return getSupplierById(data.id);
}

export async function updateSupplier(
  supplierId,
  supplierData
) {
  const { error } = await supabase
    .from("suppliers")
    .update(
      createSupplierPayload(
        supplierData
      )
    )
    .eq("id", supplierId);

  if (error) {
    throw error;
  }

  await syncSupplierItems(
    supplierId,
    supplierData.itemIds
  );

  return getSupplierById(supplierId);
}

export async function toggleSupplierStatus(
  supplierId,
  currentStatus
) {
  const nextStatus =
    currentStatus === "Active"
      ? "Inactive"
      : "Active";

  const { error } = await supabase
    .from("suppliers")
    .update({
      status: nextStatus,
    })
    .eq("id", supplierId);

  if (error) {
    throw error;
  }

  return getSupplierById(supplierId);
}

export async function removeSupplier(
  supplierId
) {
  const { error: clearItemsError } =
    await supabase
      .from("items")
      .update({
        primary_supplier_id: null,
      })
      .eq(
        "primary_supplier_id",
        supplierId
      );

  if (clearItemsError) {
    throw clearItemsError;
  }

  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", supplierId);

  if (error) {
    throw error;
  }

  return true;
}
