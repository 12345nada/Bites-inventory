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

export const mapSupplierFromDatabase = (supplier) => ({
  id: supplier.id,
  supplierCode:
    supplier.supplier_code ||
    `SUP-${String(supplier.id).padStart(3, "0")}`,
  name: supplier.name || "",
  contactPerson: supplier.contact_person || "",
  phone: supplier.phone || "",
  email: supplier.email || "",
  address: supplier.address || "",
  status: supplier.status || "Active",
  createdAt: supplier.created_at,
  updatedAt: supplier.updated_at,
});

const createSupplierPayload = (supplierData) => ({
  name: supplierData.name.trim(),
  contact_person: supplierData.contactPerson.trim(),
  phone: supplierData.phone.trim(),
  email: supplierData.email.trim().toLowerCase(),
  address: supplierData.address.trim(),
  status: supplierData.status,
});

async function getSupplierById(supplierId) {
  const { data, error } = await supabase
    .from("suppliers")
    .select(SUPPLIER_FIELDS)
    .eq("id", supplierId)
    .single();

  if (error) throw error;
  return mapSupplierFromDatabase(data);
}

export async function getSupplierPageData() {
  const { data, error } = await supabase
    .from("suppliers")
    .select(SUPPLIER_FIELDS)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return {
    suppliers: (data || []).map(mapSupplierFromDatabase),
  };
}

export async function createSupplier(supplierData) {
  const { data, error } = await supabase
    .from("suppliers")
    .insert(createSupplierPayload(supplierData))
    .select("id")
    .single();

  if (error) throw error;
  return getSupplierById(data.id);
}

export async function updateSupplier(supplierId, supplierData) {
  const { error } = await supabase
    .from("suppliers")
    .update(createSupplierPayload(supplierData))
    .eq("id", supplierId);

  if (error) throw error;
  return getSupplierById(supplierId);
}

export async function toggleSupplierStatus(supplierId, currentStatus) {
  const nextStatus = currentStatus === "Active" ? "Inactive" : "Active";

  const { error } = await supabase
    .from("suppliers")
    .update({ status: nextStatus })
    .eq("id", supplierId);

  if (error) throw error;
  return getSupplierById(supplierId);
}

export async function removeSupplier(supplierId) {
  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", supplierId);

  if (error) throw error;
  return true;
}
