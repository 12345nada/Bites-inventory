import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const PurchasesContext = createContext(null);

const initialPurchases = [
  {
    id: "PO-2026-001",
    supplier: "Cairo Catering Co.",
    orderDate: "2026-07-17",
    expectedDate: "2026-07-20",
    warehouse: "Cairo",
    itemName: "Dinner Plate",
    quantity: 500,
    unitCost: 55,
    totalAmount: 27500,
    status: "Received",
    receivedDate: "2026-07-20",
  },
  {
    id: "PO-2026-002",
    supplier: "Fresh & More",
    orderDate: "2026-07-18",
    expectedDate: "2026-07-23",
    warehouse: "Cairo",
    itemName: "Water Glass",
    quantity: 300,
    unitCost: 42,
    totalAmount: 12600,
    status: "Approved",
    receivedDate: "",
  },
  {
    id: "PO-2026-003",
    supplier: "Al Nour Supplies",
    orderDate: "2026-07-20",
    expectedDate: "2026-07-26",
    warehouse: "Alex",
    itemName: "Chair",
    quantity: 40,
    unitCost: 850,
    totalAmount: 34000,
    status: "Pending",
    receivedDate: "",
  },
  {
    id: "PO-2026-004",
    supplier: "Kitchen Pro",
    orderDate: "2026-07-21",
    expectedDate: "2026-07-28",
    warehouse: "Alex",
    itemName: "Chafing Dish",
    quantity: 25,
    unitCost: 1200,
    totalAmount: 30000,
    status: "Pending",
    receivedDate: "",
  },
];

export function PurchasesProvider({ children }) {
  const [purchases, setPurchases] =
    useState(initialPurchases);

  const generatePurchaseId = (
    currentPurchases
  ) => {
    const nextNumber =
      currentPurchases.reduce(
        (largestNumber, purchase) => {
          const currentNumber = Number(
            purchase.id.split("-").pop()
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

    return `PO-2026-${String(
      nextNumber
    ).padStart(3, "0")}`;
  };

  const addPurchase = (purchaseData) => {
    setPurchases((currentPurchases) => {
      const quantity = Number(
        purchaseData.quantity
      );

      const unitCost = Number(
        purchaseData.unitCost
      );

      const newPurchase = {
        id: generatePurchaseId(
          currentPurchases
        ),
        supplier: purchaseData.supplier.trim(),
        orderDate: purchaseData.orderDate,
        expectedDate:
          purchaseData.expectedDate,
        warehouse: purchaseData.warehouse,
        itemName:
          purchaseData.itemName.trim(),
        quantity,
        unitCost,
        totalAmount: quantity * unitCost,
        status: "Pending",
        receivedDate: "",
      };

      return [
        newPurchase,
        ...currentPurchases,
      ];
    });
  };

  const updatePurchase = (
    purchaseId,
    purchaseData
  ) => {
    setPurchases((currentPurchases) =>
      currentPurchases.map((purchase) => {
        if (purchase.id !== purchaseId) {
          return purchase;
        }

        const quantity = Number(
          purchaseData.quantity
        );

        const unitCost = Number(
          purchaseData.unitCost
        );

        return {
          ...purchase,
          supplier:
            purchaseData.supplier.trim(),
          orderDate:
            purchaseData.orderDate,
          expectedDate:
            purchaseData.expectedDate,
          warehouse:
            purchaseData.warehouse,
          itemName:
            purchaseData.itemName.trim(),
          quantity,
          unitCost,
          totalAmount:
            quantity * unitCost,
        };
      })
    );
  };

  const approvePurchase = (purchaseId) => {
    setPurchases((currentPurchases) =>
      currentPurchases.map((purchase) =>
        purchase.id === purchaseId &&
        purchase.status === "Pending"
          ? {
              ...purchase,
              status: "Approved",
            }
          : purchase
      )
    );
  };

  const receivePurchase = (
    purchaseId,
    receivedDate
  ) => {
    setPurchases((currentPurchases) =>
      currentPurchases.map((purchase) =>
        purchase.id === purchaseId &&
        purchase.status === "Approved"
          ? {
              ...purchase,
              status: "Received",
              receivedDate,
            }
          : purchase
      )
    );

    /*
      عند ربط المشروع بالـBackend:
      بعد الاستلام يتم إرسال quantity وitemName
      إلى المخزون لزيادة الكمية المتاحة.
    */
  };

  const cancelPurchase = (purchaseId) => {
    setPurchases((currentPurchases) =>
      currentPurchases.map((purchase) =>
        purchase.id === purchaseId &&
        purchase.status !== "Received"
          ? {
              ...purchase,
              status: "Cancelled",
            }
          : purchase
      )
    );
  };

  const deletePurchase = (purchaseId) => {
    setPurchases((currentPurchases) =>
      currentPurchases.filter(
        (purchase) =>
          purchase.id !== purchaseId
      )
    );
  };

  const value = useMemo(
    () => ({
      purchases,
      addPurchase,
      updatePurchase,
      approvePurchase,
      receivePurchase,
      cancelPurchase,
      deletePurchase,
      setPurchases,
    }),
    [purchases]
  );

  return (
    <PurchasesContext.Provider value={value}>
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases() {
  const context = useContext(
    PurchasesContext
  );

  if (!context) {
    throw new Error(
      "usePurchases must be used inside PurchasesProvider"
    );
  }

  return context;
}