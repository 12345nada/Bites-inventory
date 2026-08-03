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

export const mapSupplierFromDatabase = (
  supplier
) => ({
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
  status: supplier.status || "Active",
  createdAt: supplier.created_at,
  updatedAt: supplier.updated_at,
});

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

export async function getSuppliers() {
  const { data, error } = await supabase
    .from("suppliers")
    .select(SUPPLIER_FIELDS)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data || []).map(
    mapSupplierFromDatabase
  );
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
    .select(SUPPLIER_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return mapSupplierFromDatabase(data);
}

export async function updateSupplier(
  supplierId,
  supplierData
) {
  const { data, error } = await supabase
    .from("suppliers")
    .update(
      createSupplierPayload(
        supplierData
      )
    )
    .eq("id", supplierId)
    .select(SUPPLIER_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return mapSupplierFromDatabase(data);
}

export async function toggleSupplierStatus(
  supplierId,
  currentStatus
) {
  const nextStatus =
    currentStatus === "Active"
      ? "Inactive"
      : "Active";

  const { data, error } = await supabase
    .from("suppliers")
    .update({
      status: nextStatus,
    })
    .eq("id", supplierId)
    .select(SUPPLIER_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return mapSupplierFromDatabase(data);
}

export async function removeSupplier(
  supplierId
) {
  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", supplierId);

  if (error) {
    throw error;
  }

  return true;
}
