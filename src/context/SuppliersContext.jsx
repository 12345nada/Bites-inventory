import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const SuppliersContext = createContext(null);

const initialSuppliers = [
  {
    id: "SUP-001",
    name: "Royal Glass",
    contactPerson: "Ahmed Hassan",
    phone: "01012345678",
    email: "info@royalglass.com",
    address: "45 Industrial Zone, Cairo",
    status: "Active",
  },
  {
    id: "SUP-002",
    name: "Elite Linen",
    contactPerson: "Mona Adel",
    phone: "01123456789",
    email: "sales@elitelinen.com",
    address: "12 Smouha Road, Alexandria",
    status: "Active",
  },
  {
    id: "SUP-003",
    name: "Kitchen Pro",
    contactPerson: "Omar Khaled",
    phone: "01234567890",
    email: "contact@kitchenpro.com",
    address: "88 Equipment Street, Cairo",
    status: "Inactive",
  },
  {
    id: "SUP-004",
    name: "Furniture Hub",
    contactPerson: "Sara Mohamed",
    phone: "01512345678",
    email: "hello@furniturehub.com",
    address: "33 Market Street, Alexandria",
    status: "Active",
  },
];

export function SuppliersProvider({
  children,
}) {
  const [suppliers, setSuppliers] =
    useState(initialSuppliers);

  const getNextSupplierId = (
    currentSuppliers
  ) => {
    const nextNumber =
      currentSuppliers.reduce(
        (largestNumber, supplier) => {
          const currentNumber = Number(
            supplier.id.replace("SUP-", "")
          );

          return Number.isNaN(currentNumber)
            ? largestNumber
            : Math.max(
                largestNumber,
                currentNumber
              );
        },
        0
      ) + 1;

    return `SUP-${String(
      nextNumber
    ).padStart(3, "0")}`;
  };

  const addSupplier = (supplierData) => {
    const normalizedName =
      supplierData.name.trim();

    const supplierExists = suppliers.some(
      (supplier) =>
        supplier.name.toLowerCase() ===
        normalizedName.toLowerCase()
    );

    if (supplierExists) {
      return {
        success: false,
        message:
          "This supplier already exists.",
      };
    }

    setSuppliers((currentSuppliers) => [
      {
        id: getNextSupplierId(
          currentSuppliers
        ),
        name: normalizedName,
        contactPerson:
          supplierData.contactPerson.trim(),
        phone: supplierData.phone.trim(),
        email: supplierData.email
          .trim()
          .toLowerCase(),
        address:
          supplierData.address.trim(),
        status: supplierData.status,
      },
      ...currentSuppliers,
    ]);

    return {
      success: true,
    };
  };

  const updateSupplier = (
    supplierId,
    updatedData
  ) => {
    const normalizedName =
      updatedData.name.trim();

    const supplierExists = suppliers.some(
      (supplier) =>
        supplier.id !== supplierId &&
        supplier.name.toLowerCase() ===
          normalizedName.toLowerCase()
    );

    if (supplierExists) {
      return {
        success: false,
        message:
          "This supplier already exists.",
      };
    }

    setSuppliers((currentSuppliers) =>
      currentSuppliers.map((supplier) =>
        supplier.id === supplierId
          ? {
              ...supplier,
              name: normalizedName,
              contactPerson:
                updatedData.contactPerson.trim(),
              phone:
                updatedData.phone.trim(),
              email: updatedData.email
                .trim()
                .toLowerCase(),
              address:
                updatedData.address.trim(),
              status:
                updatedData.status,
            }
          : supplier
      )
    );

    return {
      success: true,
    };
  };

  const toggleSupplierStatus = (
    supplierId
  ) => {
    setSuppliers((currentSuppliers) =>
      currentSuppliers.map((supplier) =>
        supplier.id === supplierId
          ? {
              ...supplier,
              status:
                supplier.status === "Active"
                  ? "Inactive"
                  : "Active",
            }
          : supplier
      )
    );
  };

  const deleteSupplier = (
    supplierId
  ) => {
    setSuppliers((currentSuppliers) =>
      currentSuppliers.filter(
        (supplier) =>
          supplier.id !== supplierId
      )
    );
  };

  const value = useMemo(
    () => ({
      suppliers,
      addSupplier,
      updateSupplier,
      toggleSupplierStatus,
      deleteSupplier,
      setSuppliers,
    }),
    [suppliers]
  );

  return (
    <SuppliersContext.Provider
      value={value}
    >
      {children}
    </SuppliersContext.Provider>
  );
}

export function useSuppliers() {
  const context = useContext(
    SuppliersContext
  );

  if (!context) {
    throw new Error(
      "useSuppliers must be used inside SuppliersProvider"
    );
  }

  return context;
}