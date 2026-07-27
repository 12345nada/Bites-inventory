import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const DispatchesContext = createContext(null);

const initialDispatches = [
  {
    id: "DSP-00156",
    eventReference: "EVT-2026-001",
    fromWarehouse: "Cairo Warehouse",
    toLocation: "Villa 45",
    area: "New Cairo",
    driver: "Ahmed Samy",
    date: "2026-07-17",
    time: "23:00",
    status: "Delivered",
    items: [
      {
        name: "Dinner Plate",
        quantity: 200,
      },
      {
        name: "Water Glass",
        quantity: 250,
      },
    ],
  },
  {
    id: "DSP-00155",
    eventReference: "EVT-2026-002",
    fromWarehouse: "Alexandria Warehouse",
    toLocation: "Marriott Hotel",
    area: "Giza",
    driver: "Omar Khaled",
    date: "2026-07-19",
    time: "19:00",
    status: "In Transit",
    items: [
      {
        name: "Chair",
        quantity: 80,
      },
      {
        name: "Table Napkin",
        quantity: 500,
      },
    ],
  },
  {
    id: "DSP-00154",
    eventReference: "EVT-2026-003",
    fromWarehouse: "Cairo Warehouse",
    toLocation: "Villa 12",
    area: "Sheikh Zayed",
    driver: "Mohamed Ali",
    date: "2026-07-19",
    time: "17:00",
    status: "Prepared",
    items: [
      {
        name: "Chafing Dish",
        quantity: 25,
      },
    ],
  },
  {
    id: "DSP-00153",
    eventReference: "EVT-2026-004",
    fromWarehouse: "Cairo Warehouse",
    toLocation: "Garden City",
    area: "Cairo",
    driver: "Youseef Magdy",
    date: "2026-07-20",
    time: "16:00",
    status: "Delivered",
    items: [
      {
        name: "Cutlery Set",
        quantity: 120,
      },
    ],
  },
  {
    id: "DSP-00152",
    eventReference: "EVT-2026-005",
    fromWarehouse: "Cairo Warehouse",
    toLocation: "Stella Di Mare",
    area: "Ain Sokhna",
    driver: "Tamer Hassan",
    date: "2026-07-21",
    time: "22:00",
    status: "In Transit",
    items: [
      {
        name: "Dinner Plate",
        quantity: 300,
      },
      {
        name: "Chair",
        quantity: 100,
      },
    ],
  },
  {
    id: "DSP-00151",
    eventReference: "EVT-2026-006",
    fromWarehouse: "Alexandria Warehouse",
    toLocation: "Private Villa",
    area: "New Cairo",
    driver: "Ahmed Samy",
    date: "2026-07-22",
    time: "18:00",
    status: "Cancelled",
    items: [
      {
        name: "Water Glass",
        quantity: 150,
      },
    ],
  },
];

export function DispatchesProvider({ children }) {
  const [dispatches, setDispatches] =
    useState(initialDispatches);

  const generateDispatchId = (
    currentDispatches
  ) => {
    const nextNumber =
      currentDispatches.reduce(
        (largestNumber, dispatch) => {
          const currentNumber = Number(
            dispatch.id.replace("DSP-", "")
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

    return `DSP-${String(nextNumber).padStart(
      5,
      "0"
    )}`;
  };

  const normalizeItems = (items = []) => {
    return items
      .filter(
        (item) =>
          String(item.name).trim() !== "" &&
          Number(item.quantity) > 0
      )
      .map((item) => ({
        name: String(item.name).trim(),
        quantity: Number(item.quantity),
      }));
  };

  const addDispatch = (dispatchData) => {
    setDispatches((currentDispatches) => {
      const newDispatch = {
        id: generateDispatchId(
          currentDispatches
        ),

        eventReference:
          dispatchData.eventReference
            .trim()
            .toUpperCase(),

        fromWarehouse:
          dispatchData.fromWarehouse,

        toLocation:
          dispatchData.toLocation.trim(),

        area: dispatchData.area.trim(),

        driver: dispatchData.driver.trim(),

        date: dispatchData.date,

        time: dispatchData.time,

       
        status: "Prepared",

        items: normalizeItems(
          dispatchData.items
        ),
      };

      return [
        newDispatch,
        ...currentDispatches,
      ];
    });
  };

  const updateDispatch = (
    dispatchId,
    updatedData
  ) => {
    setDispatches((currentDispatches) =>
      currentDispatches.map((dispatch) => {
        if (dispatch.id !== dispatchId) {
          return dispatch;
        }

      
        if (
          dispatch.status === "Delivered" ||
          dispatch.status === "Cancelled"
        ) {
          return dispatch;
        }

        return {
          ...dispatch,

          eventReference:
            updatedData.eventReference
              .trim()
              .toUpperCase(),

          fromWarehouse:
            updatedData.fromWarehouse,

          toLocation:
            updatedData.toLocation.trim(),

          area: updatedData.area.trim(),

          driver: updatedData.driver.trim(),

          date: updatedData.date,

          time: updatedData.time,

          items: normalizeItems(
            updatedData.items
          ),
        };
      })
    );
  };

  const startDispatch = (dispatchId) => {
    setDispatches((currentDispatches) =>
      currentDispatches.map((dispatch) =>
        dispatch.id === dispatchId &&
        dispatch.status === "Prepared"
          ? {
              ...dispatch,
              status: "In Transit",
            }
          : dispatch
      )
    );

  };

  const markDelivered = (dispatchId) => {
    setDispatches((currentDispatches) =>
      currentDispatches.map((dispatch) =>
        dispatch.id === dispatchId &&
        dispatch.status === "In Transit"
          ? {
              ...dispatch,
              status: "Delivered",
            }
          : dispatch
      )
    );
  };

  const cancelDispatch = (dispatchId) => {
    setDispatches((currentDispatches) =>
      currentDispatches.map((dispatch) =>
        dispatch.id === dispatchId &&
        dispatch.status !== "Delivered" &&
        dispatch.status !== "Cancelled"
          ? {
              ...dispatch,
              status: "Cancelled",
            }
          : dispatch
      )
    );
  };

  const deleteDispatch = (dispatchId) => {
    setDispatches((currentDispatches) =>
      currentDispatches.filter(
        (dispatch) =>
          dispatch.id !== dispatchId
      )
    );
  };

  const value = useMemo(
    () => ({
      dispatches,
      addDispatch,
      updateDispatch,
      startDispatch,
      markDelivered,
      cancelDispatch,
      deleteDispatch,
      setDispatches,
    }),
    [dispatches]
  );

  return (
    <DispatchesContext.Provider value={value}>
      {children}
    </DispatchesContext.Provider>
  );
}

export function useDispatches() {
  const context = useContext(
    DispatchesContext
  );

  if (!context) {
    throw new Error(
      "useDispatches must be used inside DispatchesProvider"
    );
  }

  return context;
}