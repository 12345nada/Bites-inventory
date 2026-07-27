import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const WarehousesContext = createContext(null);

const initialWarehouses = [
  {
    id: "WH-001",
    name: "Cairo Warehouse",
    branch: "Cairo",
    location: "New Cairo, Cairo",
    capacity: 5000,
    usedCapacity: 4200,
  },
  {
    id: "WH-002",
    name: "Alexandria Warehouse",
    branch: "Alex",
    location: "Alexandria, Alexandria",
    capacity: 3000,
    usedCapacity: 2100,
  },
];

export function WarehousesProvider({ children }) {
  const [warehouses, setWarehouses] =
    useState(initialWarehouses);

  const addWarehouse = (warehouseData) => {
    setWarehouses((currentWarehouses) => {
      const nextNumber =
        currentWarehouses.reduce(
          (largestNumber, warehouse) => {
            const currentNumber = Number(
              warehouse.id.replace("WH-", "")
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

      const newWarehouse = {
        id: `WH-${String(nextNumber).padStart(
          3,
          "0"
        )}`,
        name: warehouseData.name.trim(),
        branch: warehouseData.branch,
        location: warehouseData.location.trim(),
        capacity: Number(
          warehouseData.capacity
        ),

        /*
          Used capacity is not entered manually.
          A new warehouse starts empty and this value
          should later be updated from inventory movements.
        */
        usedCapacity: 0,
      };

      return [
        newWarehouse,
        ...currentWarehouses,
      ];
    });
  };

  const updateWarehouse = (
    warehouseId,
    updatedData
  ) => {
    setWarehouses((currentWarehouses) =>
      currentWarehouses.map((warehouse) =>
        warehouse.id === warehouseId
          ? {
              ...warehouse,
              name: updatedData.name.trim(),
              branch: updatedData.branch,
              location:
                updatedData.location.trim(),
              capacity: Number(
                updatedData.capacity
              ),

              /*
                Keep the calculated used capacity.
                The user only edits warehouse master data.
              */
              usedCapacity:
                warehouse.usedCapacity,
            }
          : warehouse
      )
    );
  };

  const updateUsedCapacity = (
    warehouseId,
    usedCapacity
  ) => {
    setWarehouses((currentWarehouses) =>
      currentWarehouses.map((warehouse) =>
        warehouse.id === warehouseId
          ? {
              ...warehouse,
              usedCapacity: Math.max(
                0,
                Number(usedCapacity)
              ),
            }
          : warehouse
      )
    );
  };

  const deleteWarehouse = (warehouseId) => {
    setWarehouses((currentWarehouses) =>
      currentWarehouses.filter(
        (warehouse) =>
          warehouse.id !== warehouseId
      )
    );
  };

  const value = useMemo(
    () => ({
      warehouses,
      addWarehouse,
      updateWarehouse,
      updateUsedCapacity,
      deleteWarehouse,
      setWarehouses,
    }),
    [warehouses]
  );

  return (
    <WarehousesContext.Provider value={value}>
      {children}
    </WarehousesContext.Provider>
  );
}

export function useWarehouses() {
  const context = useContext(
    WarehousesContext
  );

  if (!context) {
    throw new Error(
      "useWarehouses must be used inside WarehousesProvider"
    );
  }

  return context;
}