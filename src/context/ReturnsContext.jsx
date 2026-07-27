import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const ReturnsContext = createContext(null);

const initialReturns = [
  {
    id: "RET-00006",
    dispatchId: "DSP-00161",
    eventReference: "EVT-2026-011",
    warehouse: "Cairo Warehouse",
    returnDate: "2026-07-29",
    returnedBy: "Mona Adel",
    notes: "All items returned in good condition.",
    status: "Completed",
    items: [
      {
        name: "Dinner Plate",
        dispatchedQuantity: 180,
        goodReturned: 180,
        damaged: 0,
        missing: 0,
      },
      {
        name: "Chair",
        dispatchedQuantity: 60,
        goodReturned: 60,
        damaged: 0,
        missing: 0,
      },
    ],
  },
  {
    id: "RET-00005",
    dispatchId: "DSP-00160",
    eventReference: "EVT-2026-010",
    warehouse: "Alexandria Warehouse",
    returnDate: "2026-07-28",
    returnedBy: "Omar Khaled",
    notes: "Some glasses were damaged and a few items were missing.",
    status: "Completed",
    items: [
      {
        name: "Water Glass",
        dispatchedQuantity: 300,
        goodReturned: 286,
        damaged: 9,
        missing: 5,
      },
      {
        name: "Cutlery Set",
        dispatchedQuantity: 80,
        goodReturned: 77,
        damaged: 1,
        missing: 2,
      },
    ],
  },
  {
    id: "RET-00004",
    dispatchId: "DSP-00159",
    eventReference: "EVT-2026-009",
    warehouse: "Cairo Warehouse",
    returnDate: "2026-07-27",
    returnedBy: "Tamer Hassan",
    notes: "Missing items only.",
    status: "Completed",
    items: [
      {
        name: "Chair",
        dispatchedQuantity: 100,
        goodReturned: 96,
        damaged: 0,
        missing: 4,
      },
      {
        name: "Table Napkin",
        dispatchedQuantity: 500,
        goodReturned: 495,
        damaged: 0,
        missing: 5,
      },
    ],
  },
  {
    id: "RET-00003",
    dispatchId: "DSP-00158",
    eventReference: "EVT-2026-008",
    warehouse: "Alexandria Warehouse",
    returnDate: "2026-07-26",
    returnedBy: "Ahmed Samy",
    notes: "Damaged items only.",
    status: "Completed",
    items: [
      {
        name: "Chafing Dish",
        dispatchedQuantity: 40,
        goodReturned: 37,
        damaged: 3,
        missing: 0,
      },
      {
        name: "Dinner Plate",
        dispatchedQuantity: 200,
        goodReturned: 195,
        damaged: 5,
        missing: 0,
      },
    ],
  },
  {
    id: "RET-00002",
    dispatchId: "DSP-00157",
    eventReference: "EVT-2026-007",
    warehouse: "Cairo Warehouse",
    returnDate: "2026-07-25",
    returnedBy: "Mohamed Ali",
    notes: "Return completed without damage or missing quantities.",
    status: "Completed",
    items: [
      {
        name: "Cutlery Set",
        dispatchedQuantity: 120,
        goodReturned: 120,
        damaged: 0,
        missing: 0,
      },
      {
        name: "Water Glass",
        dispatchedQuantity: 150,
        goodReturned: 150,
        damaged: 0,
        missing: 0,
      },
    ],
  },
  {
    id: "RET-00001",
    dispatchId: "DSP-00156",
    eventReference: "EVT-2026-001",
    warehouse: "Cairo Warehouse",
    returnDate: "2026-07-24",
    returnedBy: "Ahmed Samy",
    notes: "Some returned items were damaged and missing.",
    status: "Completed",
    items: [
      {
        name: "Dinner Plate",
        dispatchedQuantity: 200,
        goodReturned: 195,
        damaged: 3,
        missing: 2,
      },
      {
        name: "Water Glass",
        dispatchedQuantity: 250,
        goodReturned: 245,
        damaged: 3,
        missing: 2,
      },
    ],
  },
];

export function ReturnsProvider({ children }) {
  const [returns, setReturns] =
    useState(initialReturns);

  const generateReturnId = (
    currentReturns
  ) => {
    const nextNumber =
      currentReturns.reduce(
        (largestNumber, returnRecord) => {
          const currentNumber = Number(
            returnRecord.id.replace(
              "RET-",
              ""
            )
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

    return `RET-${String(nextNumber).padStart(
      5,
      "0"
    )}`;
  };

  const addReturn = (returnData) => {
    let createdReturn = null;

    setReturns((currentReturns) => {
      createdReturn = {
        id: generateReturnId(
          currentReturns
        ),
        ...returnData,
        status: "Completed",
        items: returnData.items.map(
          (item) => ({
            name: item.name,
            dispatchedQuantity: Number(
              item.dispatchedQuantity
            ),
            goodReturned: Number(
              item.goodReturned
            ),
            damaged: Number(
              item.damaged
            ),
            missing: Number(
              item.missing
            ),
          })
        ),
      };

      return [
        createdReturn,
        ...currentReturns,
      ];
    });

    return createdReturn;
  };

  const updateReturn = (
    returnId,
    updatedData
  ) => {
    setReturns((currentReturns) =>
      currentReturns.map((returnRecord) =>
        returnRecord.id === returnId
          ? {
              ...returnRecord,
              ...updatedData,
              items: updatedData.items.map(
                (item) => ({
                  name: item.name,
                  dispatchedQuantity: Number(
                    item.dispatchedQuantity
                  ),
                  goodReturned: Number(
                    item.goodReturned
                  ),
                  damaged: Number(
                    item.damaged
                  ),
                  missing: Number(
                    item.missing
                  ),
                })
              ),
            }
          : returnRecord
      )
    );
  };

  const deleteReturn = (returnId) => {
    setReturns((currentReturns) =>
      currentReturns.filter(
        (returnRecord) =>
          returnRecord.id !== returnId
      )
    );
  };

  const value = useMemo(
    () => ({
      returns,
      addReturn,
      updateReturn,
      deleteReturn,
      setReturns,
    }),
    [returns]
  );

  return (
    <ReturnsContext.Provider value={value}>
      {children}
    </ReturnsContext.Provider>
  );
}

export function useReturns() {
  const context = useContext(
    ReturnsContext
  );

  if (!context) {
    throw new Error(
      "useReturns must be used inside ReturnsProvider"
    );
  }

  return context;
}