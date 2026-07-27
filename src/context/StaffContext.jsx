import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const StaffContext = createContext(null);

const initialDrivers = [
  {
    id: "DRV-001",
    fullName: "Ahmed Samy",
    phone: "01012345678",
    nationalId: "29801011234567",
    licenseNumber: "DL-45872",
    licenseExpiryDate: "2027-06-20",
    carNumber: "س ب ج 1234",
    carType: "Van",
    status: "Active",
    documents: {
      nationalIdImage: null,
      licenseImage: null,
    },
  },
];

const initialWaiters = [
  {
    id: "WTR-001",
    fullName: "Mohamed Ali",
    phone: "01234567890",
    nationalId: "30001011234567",
    status: "Active",
    documents: {
      personalPhoto: null,
      nationalIdImage: null,
      healthCertificate: {
        file: null,
        expiryDate: "2027-07-27",
      },
      contract: {
        file: null,
        startDate: "2026-07-01",
        endDate: "2027-07-01",
      },
    },
  },
];

const getNextId = (records, prefix) => {
  const nextNumber =
    records.reduce((largest, record) => {
      const number = Number(
        record.id.replace(prefix, "")
      );

      return Number.isNaN(number)
        ? largest
        : Math.max(largest, number);
    }, 0) + 1;

  return `${prefix}${String(
    nextNumber
  ).padStart(3, "0")}`;
};

export function StaffProvider({ children }) {
  const [drivers, setDrivers] =
    useState(initialDrivers);

  const [waiters, setWaiters] =
    useState(initialWaiters);

  const addDriver = (driverData) => {
    setDrivers((currentDrivers) => [
      {
        id: getNextId(
          currentDrivers,
          "DRV-"
        ),
        ...driverData,
      },
      ...currentDrivers,
    ]);
  };

  const updateDriver = (
    driverId,
    updatedData
  ) => {
    setDrivers((currentDrivers) =>
      currentDrivers.map((driver) =>
        driver.id === driverId
          ? {
              ...driver,
              ...updatedData,
            }
          : driver
      )
    );
  };

  const deleteDriver = (driverId) => {
    setDrivers((currentDrivers) =>
      currentDrivers.filter(
        (driver) =>
          driver.id !== driverId
      )
    );
  };

  const addWaiter = (waiterData) => {
    setWaiters((currentWaiters) => [
      {
        id: getNextId(
          currentWaiters,
          "WTR-"
        ),
        ...waiterData,
      },
      ...currentWaiters,
    ]);
  };

  const updateWaiter = (
    waiterId,
    updatedData
  ) => {
    setWaiters((currentWaiters) =>
      currentWaiters.map((waiter) =>
        waiter.id === waiterId
          ? {
              ...waiter,
              ...updatedData,
            }
          : waiter
      )
    );
  };

  const deleteWaiter = (waiterId) => {
    setWaiters((currentWaiters) =>
      currentWaiters.filter(
        (waiter) =>
          waiter.id !== waiterId
      )
    );
  };

  const value = useMemo(
    () => ({
      drivers,
      waiters,
      addDriver,
      updateDriver,
      deleteDriver,
      addWaiter,
      updateWaiter,
      deleteWaiter,
    }),
    [drivers, waiters]
  );

  return (
    <StaffContext.Provider value={value}>
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const context = useContext(
    StaffContext
  );

  if (!context) {
    throw new Error(
      "useStaff must be used inside StaffProvider"
    );
  }

  return context;
}