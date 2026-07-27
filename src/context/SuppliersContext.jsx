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
    name: "Fresh Foods Co.",
    contactPerson: "Ahmed Hassan",
    phone: "01012345678",
    email: "info@freshfoods.com",
    address: "45 Food Street, Cairo",
    branch: "Cairo",
    status: "Active",
  },
  {
    id: "SUP-002",
    name: "Daily Supplies Ltd.",
    contactPerson: "Omar Khaled",
    phone: "01087654321",
    email: "contact@dailysup.com",
    address: "12 Supply Rd, Giza",
    branch: "Cairo",
    status: "Active",
  },
  {
    id: "SUP-003",
    name: "Best Catering",
    contactPerson: "Mahmoud Ali",
    phone: "01123456789",
    email: "sales@bestcatering.com",
    address: "88 Catering Ave, Cairo",
    branch: "Cairo",
    status: "Inactive",
  },
  {
    id: "SUP-004",
    name: "Quality Ingredients",
    contactPerson: "Sara Mohamed",
    phone: "01056789123",
    email: "hello@qualitying.com",
    address: "33 Market St, Alexandria",
    branch: "Alex",
    status: "Active",
  },
  {
    id: "SUP-005",
    name: "Kitchen World",
    contactPerson: "Youseef Magdy",
    phone: "01524687890",
    email: "info@kitchenworld.com",
    address: "19 Cook St, Cairo",
    branch: "Cairo",
    status: "Active",
  },
  {
    id: "SUP-006",
    name: "Global Trade Co.",
    contactPerson: "Tamer Hassan",
    phone: "01567890103",
    email: "support@globaltrade.com",
    address: "9 Trade Center, Giza",
    branch: "Cairo",
    status: "Blacklisted",
  },
];

export function SuppliersProvider({ children }) {
  const [suppliers, setSuppliers] =
    useState(initialSuppliers);

  const addSupplier = (supplierData) => {
    setSuppliers((currentSuppliers) => {
      const nextNumber =
        currentSuppliers.reduce(
          (largestNumber, supplier) => {
            const currentNumber = Number(
              supplier.id.replace("SUP-", "")
            );

            if (Number.isNaN(currentNumber)) {
              return largestNumber;
            }

            return Math.max(
              largestNumber,
              currentNumber
            );
          },
          0
        ) + 1;

      const newSupplier = {
        id: `SUP-${String(
          nextNumber
        ).padStart(3, "0")}`,

        ...supplierData,
      };

      return [
        newSupplier,
        ...currentSuppliers,
      ];
    });
  };

  const deleteSupplier = (supplierId) => {
    setSuppliers((currentSuppliers) =>
      currentSuppliers.filter(
        (supplier) =>
          supplier.id !== supplierId
      )
    );
  };

  const updateSupplier = (
    supplierId,
    updatedData
  ) => {
    setSuppliers((currentSuppliers) =>
      currentSuppliers.map((supplier) =>
        supplier.id === supplierId
          ? {
              ...supplier,
              ...updatedData,
            }
          : supplier
      )
    );
  };

  const value = useMemo(
    () => ({
      suppliers,
      addSupplier,
      deleteSupplier,
      updateSupplier,
      setSuppliers,
    }),
    [suppliers]
  );

  return (
    <SuppliersContext.Provider value={value}>
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