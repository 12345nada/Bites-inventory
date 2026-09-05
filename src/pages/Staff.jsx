import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../context/AuthContext";


import { useDialog } from "../context/DialogContext";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import {
  deleteStaff,
  getStaff,
  updateDriver,
  updateWaiter,
} from "../services/staffService";

import {
  getStaffPayments,
  recordStaffPayment,
} from "../services/staffPaymentService";

import "../styles/dashboard.css";
import "../styles/Staff.css";

import {
  FiUsers,
  FiTruck,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiMoreVertical,
  FiX,
  FiUpload,
  FiFileText,
  FiImage,
} from "react-icons/fi";

const driverEmptyForm = {
  fullName: "",
  phone: "",
  nationalId: "",
  licenseNumber: "",
  licenseExpiryDate: "",
  carNumber: "",
  carType: "Van",
  status: "Active",
  eventRate: "",
  branch: "",
  staffRole: "Driver",
  reportsToId: "",
  documents: {
    nationalIdImage: null,
    licenseImage: null,
  },
};

const waiterEmptyForm = {
  fullName: "",
  phone: "",
  nationalId: "",
  status: "Active",
  eventRate: "",
  branch: "",
  staffRole: "Waiter",
  reportsToId: "",
  documents: {
    personalPhoto: null,
    nationalIdImage: null,
    healthCertificate: {
      file: null,
      expiryDate: "",
    },
    contract: {
      file: null,
      startDate: "",
      endDate: "",
    },
  },
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Staff() {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useDialog();


  const { hasPermission } = useAuth();

  const canEdit = hasPermission("Staff", "edit");
  const canDelete = hasPermission("Staff", "delete");

  const [drivers, setDrivers] =
    useState([]);

  const [waiters, setWaiters] =
    useState([]);

  const [payments, setPayments] =
    useState([]);

  const [
    paymentsLoading,
    setPaymentsLoading,
  ] = useState(true);

  const [
    selectedEventDetails,
    setSelectedEventDetails,
  ] = useState(null);

  const [
    selectedStaffPayment,
    setSelectedStaffPayment,
  ] = useState(null);

  const [paymentDrafts, setPaymentDrafts] =
    useState({});

  const [paymentSavingKey, setPaymentSavingKey] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState("drivers");

  const [searchValue, setSearchValue] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All Statuses");

  const [
    showDriverModal,
    setShowDriverModal,
  ] = useState(false);

  const [
    showWaiterModal,
    setShowWaiterModal,
  ] = useState(false);

  const [
    editingDriverId,
    setEditingDriverId,
  ] = useState(null);

  const [
    editingWaiterId,
    setEditingWaiterId,
  ] = useState(null);

  const [
    openActionId,
    setOpenActionId,
  ] = useState(null);

  const [
    actionMenuPosition,
    setActionMenuPosition,
  ] = useState({
    top: 0,
    left: 0,
  });

  const [currentPage, setCurrentPage] =
    useState(1);

  const staffPerPage = 5;

  const [driverForm, setDriverForm] =
    useState(driverEmptyForm);

  const [waiterForm, setWaiterForm] =
    useState(waiterEmptyForm);

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    if (openActionId === null) {
      return undefined;
    }

    const closeActionMenu = (event) => {
      if (
        event?.target instanceof Element &&
        event.target.closest(
          ".staff-more-wrapper"
        )
      ) {
        return;
      }

      setOpenActionId(null);
    };

    const closeOnPageMove = () => {
      setOpenActionId(null);
    };

    document.addEventListener(
      "mousedown",
      closeActionMenu
    );

    window.addEventListener(
      "scroll",
      closeOnPageMove,
      true
    );

    window.addEventListener(
      "resize",
      closeOnPageMove
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeActionMenu
      );

      window.removeEventListener(
        "scroll",
        closeOnPageMove,
        true
      );

      window.removeEventListener(
        "resize",
        closeOnPageMove
      );
    };
  }, [openActionId]);

  const loadStaff = async () => {
    try {
      setLoading(true);

      const [
        data,
        paymentData,
      ] = await Promise.all([
        getStaff(),
        getStaffPayments(),
      ]);

      setDrivers(data.drivers || []);
      setWaiters(data.waiters || []);
      setPayments(paymentData || []);
      setPaymentsLoading(false);
    } catch (error) {
      console.error(
        "Error loading staff:",
        error
      );

      showAlert({
        message: error.message ||
          t("staffPage.errors.couldNotLoad"),
      });
    } finally {
      setLoading(false);
      setPaymentsLoading(false);
    }
  };

  const filteredDrivers = useMemo(() => {
    const search =
      searchValue.trim().toLowerCase();

    return drivers.filter((driver) => {
      const matchesSearch =
        search === "" ||
        [
          driver.id,
          driver.fullName,
          driver.phone,
          driver.nationalId,
          driver.licenseNumber,
          driver.carNumber,
          driver.carType,
          driver.staffRole,
          driver.reportsToName,
          driver.eventRate,
          driver.status,
        ].some((value) =>
          String(value)
            .toLowerCase()
            .includes(search)
        );

      return (
        matchesSearch &&
        (
          statusFilter ===
            "All Statuses" ||
          driver.status ===
            statusFilter
        )
      );
    });
  }, [
    drivers,
    searchValue,
    statusFilter,
  ]);

  const filteredWaiters = useMemo(() => {
    const search =
      searchValue.trim().toLowerCase();

    return waiters.filter((waiter) => {
      const matchesSearch =
        search === "" ||
        [
          waiter.id,
          waiter.fullName,
          waiter.phone,
          waiter.nationalId,
          waiter.staffRole,
          waiter.reportsToName,
          waiter.eventRate,
          waiter.status,
        ].some((value) =>
          String(value)
            .toLowerCase()
            .includes(search)
        );

      return (
        matchesSearch &&
        (
          statusFilter ===
            "All Statuses" ||
          waiter.status ===
            statusFilter
        )
      );
    });
  }, [
    waiters,
    searchValue,
    statusFilter,
  ]);

  const activeStaff =
    activeTab === "drivers"
      ? filteredDrivers
      : activeTab === "waiters"
        ? filteredWaiters
        : [];

  const headDrivers = useMemo(
    () =>
      drivers.filter(
        (driver) =>
          driver.staffRole ===
            "Head Driver" &&
          Number(driver.id) !==
            Number(editingDriverId)
      ),
    [drivers, editingDriverId]
  );

  const headWaiters = useMemo(
    () =>
      waiters.filter(
        (waiter) =>
          waiter.staffRole ===
            "Head Waiter" &&
          Number(waiter.id) !==
            Number(editingWaiterId)
      ),
    [waiters, editingWaiterId]
  );

  const paymentSummaries = useMemo(() => {
    const grouped = new Map();

    payments.forEach((payment) => {
      const key = Number(payment.staffId);

      if (!grouped.has(key)) {
        grouped.set(key, {
          staffId: key,
          staffName: payment.staffName,
          staffType: payment.staffType,
          staffRole: payment.staffRole,
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
          events: [],
        });
      }

      const summary = grouped.get(key);
      const totalAmount = Number(payment.amount || 0);
      const paidAmount = Math.min(
        totalAmount,
        Number(payment.paidAmount || 0)
      );
      const remainingAmount = Math.max(
        totalAmount - paidAmount,
        0
      );

      summary.totalAmount += totalAmount;
      summary.paidAmount += paidAmount;
      summary.remainingAmount += remainingAmount;
      summary.events.push({
        ...payment,
        paidAmount,
        remainingAmount,
      });
    });

    return Array.from(grouped.values()).map(
      (summary) => ({
        ...summary,
        status:
          summary.remainingAmount <= 0
            ? "Paid"
            : summary.paidAmount > 0
              ? "Partial"
              : "Pending",
      })
    );
  }, [payments]);

  const filteredPaymentSummaries = useMemo(() => {
    const search =
      searchValue.trim().toLowerCase();

    return paymentSummaries.filter((summary) => {
      const matchesSearch =
        search === "" ||
        [
          summary.staffName,
          summary.staffType,
          summary.staffRole,
          summary.totalAmount,
          summary.paidAmount,
          summary.remainingAmount,
          summary.status,
          ...summary.events.flatMap((payment) => [
            payment.eventCode,
            payment.eventName,
            payment.eventDate,
          ]),
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(search)
        );

      const matchesStatus =
        statusFilter === "All Statuses" ||
        summary.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    paymentSummaries,
    searchValue,
    statusFilter,
  ]);

  const pendingPaymentTotal = useMemo(
    () =>
      paymentSummaries.reduce(
        (total, summary) =>
          total + Number(summary.remainingAmount || 0),
        0
      ),
    [paymentSummaries]
  );

  const handleRecordPayment = async (
    payment
  ) => {
    const key = `${payment.staffId}-${payment.eventId}`;
    const enteredAmount = Number(
      paymentDrafts[key] || 0
    );
    const remainingAmount = Number(
      payment.remainingAmount ??
        Math.max(
          Number(payment.amount || 0) -
            Number(payment.paidAmount || 0),
          0
        )
    );

    if (!enteredAmount || enteredAmount <= 0) {
      await showAlert({
        message: t("staffPage.errors.paymentAmountGreaterThanZero"),
      });
      return;
    }

    if (enteredAmount > remainingAmount) {
      await showAlert({
        message: t("staffPage.errors.paymentExceedsRemaining", {
          amount: remainingAmount.toLocaleString("en-US"),
          currency: t("staffPage.egp"),
        }),
      });
      return;
    }

    try {
      setPaymentSavingKey(key);

      const updated = await recordStaffPayment(
        payment,
        enteredAmount
      );

      setPayments((current) =>
        current.map((item) =>
          Number(item.staffId) ===
              Number(updated.staffId) &&
            Number(item.eventId) ===
              Number(updated.eventId)
            ? updated
            : item
        )
      );

      setPaymentDrafts((current) => ({
        ...current,
        [key]: "",
      }));

      setSelectedStaffPayment((current) => {
        if (!current) {
          return current;
        }

        const refreshedEvents = current.events.map(
          (item) =>
            Number(item.staffId) ===
                Number(updated.staffId) &&
              Number(item.eventId) ===
                Number(updated.eventId)
              ? {
                  ...updated,
                  remainingAmount: Math.max(
                    Number(updated.amount || 0) -
                      Number(updated.paidAmount || 0),
                    0
                  ),
                }
              : item
        );

        const totalAmount = refreshedEvents.reduce(
          (sum, item) =>
            sum + Number(item.amount || 0),
          0
        );
        const paidAmount = refreshedEvents.reduce(
          (sum, item) =>
            sum + Number(item.paidAmount || 0),
          0
        );
        const remainingAmount = Math.max(
          totalAmount - paidAmount,
          0
        );

        return {
          ...current,
          events: refreshedEvents,
          totalAmount,
          paidAmount,
          remainingAmount,
          status:
            remainingAmount <= 0
              ? "Paid"
              : paidAmount > 0
                ? "Partial"
                : "Pending",
        };
      });
    } catch (error) {
      showAlert({
        message:
          error.message ||
          t("staffPage.errors.couldNotRecordPayment"),
      });
    } finally {
      setPaymentSavingKey(null);
    }
  };

  const totalPages = Math.max(
    1,
    Math.ceil(
      activeStaff.length /
        staffPerPage
    )
  );

  const paginatedDrivers = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      staffPerPage;

    return filteredDrivers.slice(
      startIndex,
      startIndex + staffPerPage
    );
  }, [
    filteredDrivers,
    currentPage,
  ]);

  const paginatedWaiters = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      staffPerPage;

    return filteredWaiters.slice(
      startIndex,
      startIndex + staffPerPage
    );
  }, [
    filteredWaiters,
    currentPage,
  ]);

  useEffect(() => {
    setCurrentPage(1);
    setOpenActionId(null);
  }, [
    activeTab,
    searchValue,
    statusFilter,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const toggleActionMenu = (
    event,
    staffId
  ) => {
    event.stopPropagation();

    if (openActionId === staffId) {
      setOpenActionId(null);
      return;
    }

    const buttonRect =
      event.currentTarget.getBoundingClientRect();

    const menuWidth = 125;
    const menuHeight = 54;
    const gap = 10;

    const availableSpaceBelow =
      window.innerHeight -
      buttonRect.bottom;

    const top =
      availableSpaceBelow >=
      menuHeight + gap
        ? buttonRect.bottom + gap
        : buttonRect.top -
          menuHeight -
          gap;

    const preferredLeft =
      buttonRect.right -
      menuWidth;

    const left = Math.max(
      12,
      Math.min(
        preferredLeft,
        window.innerWidth -
          menuWidth -
          12
      )
    );

    setActionMenuPosition({
      top: Math.max(12, top),
      left,
    });

    setOpenActionId(staffId);
  };

  const openEditDriver = (driver) => {
    if (!canEdit) {
      showAlert({
        title: t("staffPage.errors.permissionDenied"),
        message:
          t("staffPage.errors.noEditPermission"),
        type: "warning",
      });

      return;
    }

    setEditingDriverId(driver.id);
    setOpenActionId(null);
    setDriverForm({
      ...driver,
      documents: {
        ...driver.documents,
      },
    });
    setShowDriverModal(true);
  };

  const openEditWaiter = (waiter) => {
    if (!canEdit) {
      showAlert({
        title: t("staffPage.errors.permissionDenied"),
        message:
          t("staffPage.errors.noEditPermission"),
        type: "warning",
      });

      return;
    }

    setEditingWaiterId(waiter.id);
    setOpenActionId(null);
    setWaiterForm({
      ...waiter,
      documents: {
        ...waiter.documents,
        healthCertificate: {
          ...waiter.documents
            .healthCertificate,
        },
        contract: {
          ...waiter.documents.contract,
        },
      },
    });
    setShowWaiterModal(true);
  };

  const handleDriverChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setDriverForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleWaiterChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setWaiterForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const saveDriver = async (event) => {
    event.preventDefault();

    if (
      !editingDriverId ||
      !canEdit
    ) {
      return;
    }

    if (
      !driverForm.fullName.trim() ||
      !driverForm.phone.trim() ||
      !driverForm.nationalId.trim() ||
      !driverForm.licenseNumber.trim() ||
      !driverForm.licenseExpiryDate ||
      !driverForm.carNumber.trim()
    ) {
      showAlert({
        message: t("staffPage.errors.completeDriver"),
      });
      return;
    }

    try {
      setSaving(true);

      const updated =
        await updateDriver(
          editingDriverId,
          driverForm
        );

      setDrivers((current) =>
        current.map((driver) =>
          driver.id === editingDriverId
            ? updated
            : driver
        )
      );

      setShowDriverModal(false);
      setEditingDriverId(null);
      setDriverForm(driverEmptyForm);
    } catch (error) {
      console.error(
        "Error saving driver:",
        error
      );

      showAlert({
        message: error.code === "23505"
          ? t("staffPage.errors.driverDuplicate")
          : error.message ||
              t("staffPage.errors.couldNotSaveDriver"),
      });
    } finally {
      setSaving(false);
    }
  };

  const saveWaiter = async (event) => {
    event.preventDefault();

    if (
      !editingWaiterId ||
      !canEdit
    ) {
      return;
    }

    if (
      !waiterForm.fullName.trim() ||
      !waiterForm.phone.trim() ||
      !waiterForm.nationalId.trim()
    ) {
      showAlert({
        message: t("staffPage.errors.completeWaiter"),
      });
      return;
    }

    try {
      setSaving(true);

      const updated =
        await updateWaiter(
          editingWaiterId,
          waiterForm
        );

      setWaiters((current) =>
        current.map((waiter) =>
          waiter.id === editingWaiterId
            ? updated
            : waiter
        )
      );

      setShowWaiterModal(false);
      setEditingWaiterId(null);
      setWaiterForm(waiterEmptyForm);
    } catch (error) {
      console.error(
        "Error saving waiter:",
        error
      );

      showAlert({
        message: error.code === "23505"
          ? t("staffPage.errors.waiterDuplicate")
          : error.message ||
              t("staffPage.errors.couldNotSaveWaiter"),
      });
    } finally {
      setSaving(false);
    }
  };

  const setDriverDocument = (
    field,
    file
  ) => {
    setDriverForm((current) => ({
      ...current,
      documents: {
        ...current.documents,
        [field]: file
          ? {
              name: file.name,
              file,
            }
          : null,
      },
    }));
  };

  const setWaiterDocument = (
    field,
    file
  ) => {
    setWaiterForm((current) => {
      if (
        field ===
        "healthCertificate"
      ) {
        return {
          ...current,
          documents: {
            ...current.documents,
            healthCertificate: {
              ...current.documents
                .healthCertificate,
              file: file
                ? {
                    name: file.name,
                    file,
                  }
                : null,
            },
          },
        };
      }

      if (field === "contract") {
        return {
          ...current,
          documents: {
            ...current.documents,
            contract: {
              ...current.documents
                .contract,
              file: file
                ? {
                    name: file.name,
                    file,
                  }
                : null,
            },
          },
        };
      }

      return {
        ...current,
        documents: {
          ...current.documents,
          [field]: file
            ? { name: file.name }
            : null,
        },
      };
    });
  };

  const setWaiterDate = (
    section,
    field,
    value
  ) => {
    setWaiterForm((current) => ({
      ...current,
      documents: {
        ...current.documents,
        [section]: {
          ...current.documents[
            section
          ],
          [field]: value,
        },
      },
    }));
  };

  const handleDeleteDriver = async (
    driverId
  ) => {
    if (!canDelete) {
      await showAlert({
        title: t("staffPage.errors.permissionDenied"),
        message:
          t("staffPage.errors.noDeletePermission"),
        type: "warning",
      });

      return;
    }

    const confirmed = await showConfirm({
      message: t("staffPage.confirm.deleteDriver"),
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteStaff(driverId);

      setDrivers((current) =>
        current.filter(
          (driver) =>
            driver.id !== driverId
        )
      );

      setOpenActionId(null);
    } catch (error) {
      showAlert({
        message: error.code === "23503"
          ? t("staffPage.errors.driverConnected")
          : error.message ||
              t("staffPage.errors.couldNotDeleteDriver"),
      });
    }
  };

  const handleDeleteWaiter = async (
    waiterId
  ) => {
    if (!canDelete) {
      await showAlert({
        title: t("staffPage.errors.permissionDenied"),
        message:
          t("staffPage.errors.noDeletePermission"),
        type: "warning",
      });

      return;
    }

    const confirmed = await showConfirm({
      message: t("staffPage.confirm.deleteWaiter"),
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteStaff(waiterId);

      setWaiters((current) =>
        current.filter(
          (waiter) =>
            waiter.id !== waiterId
        )
      );

      setOpenActionId(null);
    } catch (error) {
      showAlert({
        message: error.code === "23503"
          ? t("staffPage.errors.waiterConnected")
          : error.message ||
              t("staffPage.errors.couldNotDeleteWaiter"),
      });
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar activePage="staff" />

      <main className="staff-main">
        <Topbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        <section className="staff-title-section">
          <div>
            <h1>{t("staffPage.title")}</h1>
            <p>
              {t("staffPage.subtitle")}
            </p>
          </div>
        </section>

        <section className="staff-table-card">
          <div className="staff-toolbar">
            <div className="staff-tabs">
              <button
                type="button"
                className={
                  activeTab === "drivers"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab("drivers")
                }
              >
                {t("staffPage.tabs.drivers")}
              </button>

              <button
                type="button"
                className={
                  activeTab === "waiters"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab("waiters")
                }
              >
                {t("staffPage.tabs.waiters")}
              </button>

              <button
                type="button"
                className={
                  activeTab === "payments"
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setActiveTab("payments");
                  setStatusFilter(
                    "All Statuses"
                  );
                }}
              >
                {t("staffPage.tabs.payments")}
              </button>
            </div>

            <div className="staff-filters">
              <div className="staff-search-box">
                <FiSearch />
                <input
                  type="text"
                  placeholder={
                    activeTab === "drivers"
                      ? t("staffPage.search.drivers")
                      : activeTab === "waiters"
                        ? t("staffPage.search.waiters")
                        : t("staffPage.search.payments")
                  }
                  value={searchValue}
                  onChange={(event) =>
                    setSearchValue(
                      event.target.value
                    )
                  }
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
              >
                <option value="All Statuses">{t("staffPage.status.all")}</option>

                {activeTab === "payments" ? (
                  <>
                    <option value="Pending">
                      {t("staffPage.status.pending")}
                    </option>
                    <option value="Partial">
                      {t("staffPage.status.partial")}
                    </option>
                    <option value="Paid">
                      {t("staffPage.status.paid")}
                    </option>
                  </>
                ) : (
                  <>
                    <option value="Active">
                      {t("staffPage.status.active")}
                    </option>
                    <option value="Inactive">
                      {t("staffPage.status.inactive")}
                    </option>
                    <option value="Suspended">
                      {t("staffPage.status.suspended")}
                    </option>
                  </>
                )}
              </select>
            </div>
          </div>

          {activeTab === "drivers" ? (
            <div className="staff-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{t("staffPage.table.driver")}</th>
                    <th>{t("staffPage.table.phone")}</th>
                    <th>{t("staffPage.table.nationalId")}</th>
                    <th>{t("staffPage.table.license")}</th>
                    <th>{t("staffPage.table.licenseExpiry")}</th>
                    <th>{t("staffPage.table.carNumber")}</th>
                    <th>{t("staffPage.table.carType")}</th>
                    <th>{t("staffPage.table.role")}</th>
                    <th>{t("staffPage.table.reportsTo")}</th>
                    <th>{t("staffPage.table.eventRate")}</th>
                    <th>{t("staffPage.table.status")}</th>
                    <th>{t("staffPage.table.actions")}</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="12"
                        className="staff-empty-state"
                      >
                        {t("staffPage.loadingDrivers")}
                      </td>
                    </tr>
                  ) : paginatedDrivers.map(
                    (driver) => (
                      <tr key={driver.id}>
                        <td>
                          <div className="staff-name-cell">
                            <div className="staff-row-icon">
                              <FiTruck />
                            </div>
                            <div>
                              <strong>
                                {
                                  driver.fullName
                                }
                              </strong>
                              <span>
                                {driver.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>{driver.phone}</td>
                        <td>
                          {driver.nationalId}
                        </td>
                        <td>
                          {
                            driver.licenseNumber
                          }
                        </td>
                        <td>
                          {formatDate(
                            driver.licenseExpiryDate
                          )}
                        </td>
                        <td>
                          {driver.carNumber}
                        </td>
                        <td>
                          {driver.carType === "Van"
                            ? t("staffPage.values.van")
                            : driver.carType === "Truck"
                              ? t("staffPage.values.truck")
                              : driver.carType === "Pickup"
                                ? t("staffPage.values.pickup")
                                : driver.carType === "Refrigerated Truck"
                                  ? t("staffPage.values.refrigeratedTruck")
                                  : t("staffPage.values.other")}
                        </td>
                        <td>
                          {driver.staffRole === "Head Driver" ? t("staffPage.values.headDriver") : t("staffPage.values.driver")}
                        </td>
                        <td>
                          {driver.reportsToName ||
                            "-"}
                        </td>
                        <td>
                          {Number(
                            driver.eventRate || 0
                          ).toLocaleString(
                            "en-US"
                          )}{" "}
                          {t("staffPage.egp")}
                        </td>
                        <td>
                          <span
                            className={`staff-status ${driver.status.toLowerCase()}`}
                          >
                            {driver.status === "Active" ? t("staffPage.status.active") : driver.status === "Inactive" ? t("staffPage.status.inactive") : driver.status === "Suspended" ? t("staffPage.status.suspended") : driver.status}
                          </span>
                        </td>
                        <td className="staff-action-cell">
                          <div className="staff-actions">
                            <button
                              type="button"
                              onClick={() =>
                                openEditDriver(
                                  driver
                                )
                              }
                            >
                              <FiEdit2 />
                            </button>

                            <div className="staff-more-wrapper">
                              <button
                                type="button"
                                className="staff-more-button"
                                onClick={(event) =>
                                  toggleActionMenu(
                                    event,
                                    driver.id
                                  )
                                }
                              >
                                <FiMoreVertical />
                              </button>

                              {openActionId ===
                                driver.id && (
                                <div
                                  className="staff-action-menu"
                                  style={{
                                    top:
                                      actionMenuPosition.top,
                                    left:
                                      actionMenuPosition.left,
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="staff-delete-action"
                                    onClick={() => {
                                      handleDeleteDriver(
                                        driver.id
                                      );
                                      setOpenActionId(
                                        null
                                      );
                                    }}
                                  >
                                    <FiTrash2 />
                                    {t("staffPage.actions.delete")}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : activeTab === "waiters" ? (
            <div className="staff-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{t("staffPage.table.waiter")}</th>
                    <th>{t("staffPage.table.phone")}</th>
                    <th>{t("staffPage.table.nationalId")}</th>
                    <th>{t("staffPage.table.healthExpiry")}</th>
                    <th>{t("staffPage.table.contractEnd")}</th>
                    <th>{t("staffPage.table.documents")}</th>
                    <th>{t("staffPage.table.role")}</th>
                    <th>{t("staffPage.table.reportsTo")}</th>
                    <th>{t("staffPage.table.eventRate")}</th>
                    <th>{t("staffPage.table.status")}</th>
                    <th>{t("staffPage.table.actions")}</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="11"
                        className="staff-empty-state"
                      >
                        {t("staffPage.loadingWaiters")}
                      </td>
                    </tr>
                  ) : paginatedWaiters.map(
                    (waiter) => {
                      const count = [
                        waiter.documents
                          .personalPhoto,
                        waiter.documents
                          .nationalIdImage,
                        waiter.documents
                          .healthCertificate
                          .file,
                        waiter.documents
                          .contract.file,
                      ].filter(Boolean).length;

                      return (
                        <tr key={waiter.id}>
                          <td>
                            <div className="staff-name-cell">
                              <div className="staff-row-icon">
                                <FiUsers />
                              </div>
                              <div>
                                <strong>
                                  {
                                    waiter.fullName
                                  }
                                </strong>
                                <span>
                                  {waiter.id}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>{waiter.phone}</td>
                          <td>
                            {waiter.nationalId}
                          </td>
                          <td>
                            {formatDate(
                              waiter.documents
                                .healthCertificate
                                .expiryDate
                            )}
                          </td>
                          <td>
                            {formatDate(
                              waiter.documents
                                .contract.endDate
                            )}
                          </td>
                          <td>{count}/4</td>
                          <td>
                            {waiter.staffRole === "Head Waiter" ? t("staffPage.values.headWaiter") : t("staffPage.values.waiter")}
                          </td>
                          <td>
                            {waiter.reportsToName ||
                              "-"}
                          </td>
                          <td>
                            {Number(
                              waiter.eventRate ||
                                0
                            ).toLocaleString(
                              "en-US"
                            )}{" "}
                            {t("staffPage.egp")}
                          </td>
                          <td>
                            <span
                              className={`staff-status ${waiter.status.toLowerCase()}`}
                            >
                              {waiter.status === "Active" ? t("staffPage.status.active") : waiter.status === "Inactive" ? t("staffPage.status.inactive") : waiter.status === "Suspended" ? t("staffPage.status.suspended") : waiter.status}
                            </span>
                          </td>
                          <td className="staff-action-cell">
                            <div className="staff-actions">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditWaiter(
                                    waiter
                                  )
                                }
                              >
                                <FiEdit2 />
                              </button>

                              <div className="staff-more-wrapper">
                                <button
                                  type="button"
                                  className="staff-more-button"
                                  onClick={(event) =>
                                    toggleActionMenu(
                                      event,
                                      waiter.id
                                    )
                                  }
                                >
                                  <FiMoreVertical />
                                </button>

                                {openActionId ===
                                  waiter.id && (
                                  <div
                                    className="staff-action-menu"
                                    style={{
                                      top:
                                        actionMenuPosition.top,
                                      left:
                                        actionMenuPosition.left,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className="staff-delete-action"
                                      onClick={() => {
                                        handleDeleteWaiter(
                                          waiter.id
                                        );
                                        setOpenActionId(
                                          null
                                        );
                                      }}
                                    >
                                      <FiTrash2 />
                                      {t("staffPage.actions.delete")}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              <div className="staff-payment-summary">
                <div>
                  <span>
                    {t("staffPage.payments.pendingPayments")}
                  </span>
                  <strong>
                    {pendingPaymentTotal.toLocaleString(
                      "en-US",
                      {
                        maximumFractionDigits: 2,
                      }
                    )}{" "}
                    {t("staffPage.egp")}
                  </strong>
                </div>

                <small>
                  {t("staffPage.payments.calculatedPerEvent")}
                </small>
              </div>

              <div className="staff-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>{t("staffPage.table.staff")}</th>
                      <th>{t("staffPage.table.type")}</th>
                      <th>{t("staffPage.table.totalAmount")}</th>
                      <th>{t("staffPage.table.paid")}</th>
                      <th>{t("staffPage.table.remaining")}</th>
                      <th>{t("staffPage.table.status")}</th>
                      <th>{t("staffPage.table.action")}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paymentsLoading ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="staff-empty-state"
                        >
                          {t("staffPage.loadingPayments")}
                        </td>
                      </tr>
                    ) : filteredPaymentSummaries.length >
                      0 ? (
                      filteredPaymentSummaries.map(
                        (summary) => (
                          <tr key={summary.staffId}>
                            <td>
                              <div className="staff-name-cell">
                                <div className="staff-row-icon">
                                  {summary.staffType ===
                                  "Driver" ? (
                                    <FiTruck />
                                  ) : (
                                    <FiUsers />
                                  )}
                                </div>
                                <div>
                                  <strong>
                                    {summary.staffName}
                                  </strong>
                                  <span>
                                    {summary.staffRole === "Head Driver"
                                      ? t("staffPage.values.headDriver")
                                      : summary.staffRole === "Driver"
                                        ? t("staffPage.values.driver")
                                        : summary.staffRole === "Head Waiter"
                                          ? t("staffPage.values.headWaiter")
                                          : t("staffPage.values.waiter")}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              {summary.staffType === "Driver"
                                ? t("staffPage.values.driver")
                                : t("staffPage.values.waiter")}
                            </td>
                            <td>
                              <strong>
                                {Number(
                                  summary.totalAmount || 0
                                ).toLocaleString("en-US")} {t("staffPage.egp")}
                              </strong>
                            </td>
                            <td>
                              {Number(
                                summary.paidAmount || 0
                              ).toLocaleString("en-US")} {t("staffPage.egp")}
                            </td>
                            <td>
                              <strong>
                                {Number(
                                  summary.remainingAmount || 0
                                ).toLocaleString("en-US")} {t("staffPage.egp")}
                              </strong>
                            </td>
                            <td>
                              <span
                                className={`staff-payment-status ${String(
                                  summary.status
                                ).toLowerCase()}`}
                              >
                                {summary.status === "Paid"
                                  ? t("staffPage.status.paid")
                                  : summary.status === "Partial"
                                    ? t("staffPage.status.partial")
                                    : t("staffPage.status.pending")}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="staff-payment-button"
                                onClick={() =>
                                  setSelectedStaffPayment(
                                    summary
                                  )
                                }
                              >
                                View / Pay
                              </button>
                            </td>
                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="staff-empty-state"
                        >
                          {t("staffPage.payments.noResults")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab !== "payments" && (
          <div className="staff-pagination">
            <p>
              Showing{" "}
              {activeStaff.length === 0
                ? 0
                : (currentPage - 1) *
                    staffPerPage +
                  1}
              {" - "}
              {Math.min(
                currentPage *
                  staffPerPage,
                activeStaff.length
              )}{" "}
              of {activeStaff.length}{" "}
              {activeTab === "drivers"
                ? t("staffPage.pagination.drivers")
                : t("staffPage.pagination.waiters")}
            </p>

            <div>
              <button
                type="button"
                disabled={
                  currentPage === 1
                }
                onClick={() =>
                  setCurrentPage(
                    (page) => page - 1
                  )
                }
              >
                 ‹
              </button>

              {Array.from(
                {
                  length: totalPages,
                },
                (_, index) =>
                  index + 1
              ).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={
                    currentPage ===
                    pageNumber
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setCurrentPage(
                      pageNumber
                    )
                  }
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                disabled={
                  currentPage ===
                  totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (page) => page + 1
                  )
                }
              >
                ›
              </button>
            </div>
          </div>
          )}
        </section>
      </main>

      {showDriverModal && (
        <div
          className="staff-modal-overlay"
          onMouseDown={() =>
            setShowDriverModal(false)
          }
        >
          <form
            className="staff-modal"
            onSubmit={saveDriver}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="staff-modal-header">
              <div>
                <h2>
{t("staffPage.driverModal.title")}
                </h2>
                <p>
                  {t("staffPage.driverModal.subtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setShowDriverModal(false)
                }
                disabled={saving}
              >
                <FiX />
              </button>
            </div>

            <div className="staff-form-grid">
              {[
                ["fullName", t("staffPage.fields.fullName")],
                ["phone", t("staffPage.fields.phoneNumber")],
                ["nationalId", t("staffPage.fields.nationalId")],
                [
                  "licenseNumber",
                  t("staffPage.fields.licenseNumber"),
                ],
                ["carNumber", t("staffPage.fields.carNumber")],
              ].map(([name, label]) => (
                <label key={name}>
                  {label}
                  <input
                    name={name}
                    value={
                      driverForm[name]
                    }
                    onChange={
                      handleDriverChange
                    }
                  />
                </label>
              ))}

              <label>
                {t("staffPage.fields.licenseExpiryDate")}
                <input
                  type="date"
                  name="licenseExpiryDate"
                  value={
                    driverForm.licenseExpiryDate
                  }
                  onChange={
                    handleDriverChange
                  }
                />
              </label>

              <label>
                {t("staffPage.fields.carType")}
                <select
                  name="carType"
                  value={
                    driverForm.carType
                  }
                  onChange={
                    handleDriverChange
                  }
                >
                  <option value="Van">
                    {t("staffPage.values.van")}
                  </option>
                  <option value="Truck">
                    {t("staffPage.values.truck")}
                  </option>
                  <option value="Pickup">
                    {t("staffPage.values.pickup")}
                  </option>
                  <option value="Refrigerated Truck">
                    {t("staffPage.values.refrigeratedTruck")}
                  </option>
                  <option value="Other">
                    {t("staffPage.values.other")}
                  </option>
                </select>
              </label>

              <label>
                {t("staffPage.fields.status")}
                <select
                  name="status"
                  value={driverForm.status}
                  onChange={
                    handleDriverChange
                  }
                >
                  <option value="Active">
                    {t("staffPage.status.active")}
                  </option>
                  <option value="Inactive">
                    {t("staffPage.status.inactive")}
                  </option>
                  <option value="Suspended">
                    {t("staffPage.status.suspended")}
                  </option>
                </select>
              </label>

              <label>
  {t("staffPage.fields.branch")}
  <select
    name="branch"
    value={driverForm.branch || ""}
    onChange={handleDriverChange}
  >
    <option value="">{t("staffPage.fields.selectBranch")}</option>
    <option value="Cairo">{t("branches.cairo")}</option>
    <option value="Alex">{t("branches.alex")}</option>
  </select>
</label>

              <label>
                {t("staffPage.fields.eventRate")}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="eventRate"
                  value={driverForm.eventRate}
                  onChange={
                    handleDriverChange
                  }
                />
              </label>

              <label>
                {t("staffPage.fields.driverRole")}
                <select
                  name="staffRole"
                  value={driverForm.staffRole}
                  onChange={(event) => {
                    handleDriverChange(event);

                    if (
                      event.target.value ===
                      "Head Driver"
                    ) {
                      setDriverForm(
                        (current) => ({
                          ...current,
                          staffRole:
                            "Head Driver",
                          reportsToId: "",
                        })
                      );
                    }
                  }}
                >
                  <option value="Driver">
                    {t("staffPage.values.driver")}
                  </option>
                  <option value="Head Driver">
                    {t("staffPage.values.headDriver")}
                  </option>
                </select>
              </label>

              {driverForm.staffRole ===
                "Driver" && (
                <label>
                  {t("staffPage.fields.reportsTo")}
                  <select
                    name="reportsToId"
                    value={
                      driverForm.reportsToId
                    }
                    onChange={
                      handleDriverChange
                    }
                  >
                    <option value="">
                      {t("staffPage.values.noHeadDriver")}
                    </option>
                    {headDrivers.map(
                      (driver) => (
                        <option
                          key={driver.id}
                          value={driver.id}
                        >
                          {driver.fullName}
                        </option>
                      )
                    )}
                  </select>
                </label>
              )}
            </div>

            <div className="staff-documents-section">
              <h3>{t("staffPage.fields.documents")}</h3>
              <div className="staff-upload-grid">
                <label className="staff-upload-box">
                  <FiImage />
                  <span>
                    {t("staffPage.documents.nationalIdImage")}
                  </span>
                  <small>
                    {driverForm.documents
                      .nationalIdImage
                      ?.name ||
                      t("staffPage.documents.uploadImage")}
                  </small>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setDriverDocument(
                        "nationalIdImage",
                        event.target.files[0]
                      )
                    }
                  />
                </label>

                <label className="staff-upload-box">
                  <FiUpload />
                  <span>
                    {t("staffPage.documents.licenseImage")}
                  </span>
                  <small>
                    {driverForm.documents
                      .licenseImage?.name ||
                      t("staffPage.documents.uploadImage")}
                  </small>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setDriverDocument(
                        "licenseImage",
                        event.target.files[0]
                      )
                    }
                  />
                </label>
              </div>
            </div>

            <div className="staff-modal-actions">
              <button
                type="button"
                className="staff-cancel-button"
                onClick={() =>
                  setShowDriverModal(false)
                }
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="staff-save-button"
                disabled={
                  saving ||
                  !canEdit
                }
              >
                {saving
                  ? t("staffPage.actions.saving")
                  : t("staffPage.actions.saveChanges")}
              </button>
            </div>
          </form>
        </div>
      )}

      {showWaiterModal && (
        <div
          className="staff-modal-overlay"
          onMouseDown={() =>
            setShowWaiterModal(false)
          }
        >
          <form
            className="staff-modal"
            onSubmit={saveWaiter}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="staff-modal-header">
              <div>
                <h2>
{t("staffPage.waiterModal.title")}
                </h2>
                <p>
                  {t("staffPage.waiterModal.subtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setShowWaiterModal(false)
                }
                disabled={saving}
              >
                <FiX />
              </button>
            </div>

            <div className="staff-form-grid">
              {[
                ["fullName", t("staffPage.fields.fullName")],
                ["phone", t("staffPage.fields.phoneNumber")],
                ["nationalId", t("staffPage.fields.nationalId")],
              ].map(([name, label]) => (
                <label key={name}>
                  {label}
                  <input
                    name={name}
                    value={
                      waiterForm[name]
                    }
                    onChange={
                      handleWaiterChange
                    }
                  />
                </label>
              ))}

              <label>
                {t("staffPage.fields.status")}
                <select
                  name="status"
                  value={waiterForm.status}
                  onChange={
                    handleWaiterChange
                  }
                >
                  <option value="Active">
                    {t("staffPage.status.active")}
                  </option>
                  <option value="Inactive">
                    {t("staffPage.status.inactive")}
                  </option>
                  <option value="Suspended">
                    {t("staffPage.status.suspended")}
                  </option>
                </select>
              </label>

              <label>
  {t("staffPage.fields.branch")}
  <select
    name="branch"
    value={waiterForm.branch || ""}
    onChange={handleWaiterChange}
  >
    <option value="">{t("staffPage.fields.selectBranch")}</option>
    <option value="Cairo">{t("branches.cairo")}</option>
    <option value="Alex">{t("branches.alex")}</option>
  </select>
</label>

              <label>
                {t("staffPage.fields.eventRate")}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="eventRate"
                  value={waiterForm.eventRate}
                  onChange={
                    handleWaiterChange
                  }
                />
              </label>

              <label>
                {t("staffPage.fields.waiterRole")}
                <select
                  name="staffRole"
                  value={waiterForm.staffRole}
                  onChange={(event) => {
                    handleWaiterChange(event);

                    if (
                      event.target.value ===
                      "Head Waiter"
                    ) {
                      setWaiterForm(
                        (current) => ({
                          ...current,
                          staffRole:
                            "Head Waiter",
                          reportsToId: "",
                        })
                      );
                    }
                  }}
                >
                  <option value="Waiter">
                    {t("staffPage.values.waiter")}
                  </option>
                  <option value="Head Waiter">
                    {t("staffPage.values.headWaiter")}
                  </option>
                </select>
              </label>

              {waiterForm.staffRole ===
                "Waiter" && (
                <label>
                  {t("staffPage.fields.reportsTo")}
                  <select
                    name="reportsToId"
                    value={
                      waiterForm.reportsToId
                    }
                    onChange={
                      handleWaiterChange
                    }
                  >
                    <option value="">
                      {t("staffPage.values.noHeadWaiter")}
                    </option>
                    {headWaiters.map(
                      (waiter) => (
                        <option
                          key={waiter.id}
                          value={waiter.id}
                        >
                          {waiter.fullName}
                        </option>
                      )
                    )}
                  </select>
                </label>
              )}
            </div>

            <div className="staff-documents-section">
              <h3>{t("staffPage.fields.documents")}</h3>

              <div className="staff-upload-grid">
                {[
                  [
                    "personalPhoto",
                    t("staffPage.documents.personalPhoto"),
                    <FiImage />,
                  ],
                  [
                    "nationalIdImage",
                    t("staffPage.documents.nationalIdImage"),
                    <FiImage />,
                  ],
                  [
                    "healthCertificate",
                    t("staffPage.documents.healthCertificate"),
                    <FiFileText />,
                  ],
                  [
                    "contract",
                    t("staffPage.documents.contract"),
                    <FiFileText />,
                  ],
                ].map(
                  ([
                    field,
                    label,
                    icon,
                  ]) => {
                    const fileName =
                      field ===
                      "healthCertificate"
                        ? waiterForm
                            .documents
                            .healthCertificate
                            .file?.name
                        : field ===
                            "contract"
                          ? waiterForm
                              .documents
                              .contract.file
                              ?.name
                          : waiterForm
                              .documents[
                              field
                            ]?.name;

                    return (
                      <label
                        className="staff-upload-box"
                        key={field}
                      >
                        {icon}
                        <span>{label}</span>
                        <small>
                          {fileName ||
                            t("staffPage.documents.uploadFile")}
                        </small>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(event) =>
                            setWaiterDocument(
                              field,
                              event.target
                                .files[0]
                            )
                          }
                        />
                      </label>
                    );
                  }
                )}
              </div>

              <div className="staff-document-dates">
                <label>
                  {t("staffPage.fields.healthCertificateExpiry")}
                  <input
                    type="date"
                    value={
                      waiterForm.documents
                        .healthCertificate
                        .expiryDate
                    }
                    onChange={(event) =>
                      setWaiterDate(
                        "healthCertificate",
                        "expiryDate",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  {t("staffPage.fields.contractStartDate")}
                  <input
                    type="date"
                    value={
                      waiterForm.documents
                        .contract.startDate
                    }
                    onChange={(event) =>
                      setWaiterDate(
                        "contract",
                        "startDate",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  {t("staffPage.fields.contractEndDate")}
                  <input
                    type="date"
                    value={
                      waiterForm.documents
                        .contract.endDate
                    }
                    onChange={(event) =>
                      setWaiterDate(
                        "contract",
                        "endDate",
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>
            </div>

            <div className="staff-modal-actions">
              <button
                type="button"
                className="staff-cancel-button"
                onClick={() =>
                  setShowWaiterModal(false)
                }
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="staff-save-button"
                disabled={
                  saving ||
                  !canEdit
                }
              >
                {saving
                  ? t("staffPage.actions.saving")
                  : t("staffPage.actions.saveChanges")}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedStaffPayment && (
        <div
          className="staff-modal-overlay"
          onMouseDown={() =>
            setSelectedStaffPayment(null)
          }
        >
          <div
            className="staff-modal staff-payment-details-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="staff-modal-header">
              <div>
                <h2>{selectedStaffPayment.staffName}</h2>
                <p>{t("staffPage.payments.summaryAllCompleted")}</p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedStaffPayment(null)
                }
              >
                <FiX />
              </button>
            </div>

            <div className="staff-payment-total-grid">
              <div>
                <span>{t("staffPage.table.totalAmount")}</span>
                <strong>
                  {Number(
                    selectedStaffPayment.totalAmount || 0
                  ).toLocaleString("en-US")} {t("staffPage.egp")}
                </strong>
              </div>
              <div>
                <span>{t("staffPage.table.paid")}</span>
                <strong>
                  {Number(
                    selectedStaffPayment.paidAmount || 0
                  ).toLocaleString("en-US")} {t("staffPage.egp")}
                </strong>
              </div>
              <div>
                <span>{t("staffPage.table.remaining")}</span>
                <strong>
                  {Number(
                    selectedStaffPayment.remainingAmount || 0
                  ).toLocaleString("en-US")} {t("staffPage.egp")}
                </strong>
              </div>
              <div>
                <span>{t("staffPage.table.status")}</span>
                <strong>
                  {selectedStaffPayment.status === "Paid"
                    ? t("staffPage.status.paid")
                    : selectedStaffPayment.status === "Partial"
                      ? t("staffPage.status.partial")
                      : t("staffPage.status.pending")}
                </strong>
              </div>
            </div>

            <div className="staff-payment-events-wrapper">
              <table className="staff-payment-events-table">
                <thead>
                  <tr>
                    <th>{t("staffPage.table.event")}</th>
                    <th>{t("staffPage.table.date")}</th>
                    <th>{t("staffPage.table.amount")}</th>
                    <th>{t("staffPage.table.paid")}</th>
                    <th>{t("staffPage.table.remaining")}</th>
                    <th>{t("staffPage.table.status")}</th>
                    <th>{t("staffPage.table.payment")}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStaffPayment.events.map(
                    (payment) => {
                      const key = `${payment.staffId}-${payment.eventId}`;
                      const remaining = Math.max(
                        Number(payment.amount || 0) -
                          Number(payment.paidAmount || 0),
                        0
                      );

                      return (
                        <tr key={key}>
                          <td>
                            <button
                              type="button"
                              className="staff-payment-event-button"
                              onClick={() =>
                                setSelectedEventDetails({
                                  ...payment.eventDetails,
                                  selectedPaymentStatus:
                                    payment.status,
                                  selectedPaymentPaidAt:
                                    payment.paidAt,
                                })
                              }
                            >
                              <strong>{payment.eventCode}</strong>
                              <span>{payment.eventName}</span>
                            </button>
                          </td>
                          <td>{formatDate(payment.eventDate)}</td>
                          <td>
                            {Number(payment.amount || 0).toLocaleString("en-US")} {t("staffPage.egp")}
                          </td>
                          <td>
                            {Number(payment.paidAmount || 0).toLocaleString("en-US")} {t("staffPage.egp")}
                          </td>
                          <td>
                            <strong>
                              {remaining.toLocaleString("en-US")} {t("staffPage.egp")}
                            </strong>
                          </td>
                          <td>
                            <span
                              className={`staff-payment-status ${String(
                                payment.status
                              ).toLowerCase()}`}
                            >
                              {payment.status === "Paid"
                                ? t("staffPage.status.paid")
                                : payment.status === "Partial"
                                  ? t("staffPage.status.partial")
                                  : t("staffPage.status.pending")}
                            </span>
                          </td>
                          <td>
                            {remaining > 0 ? (
                              <div className="staff-payment-entry">
                                <input
                                  type="number"
                                  min="0.01"
                                  max={remaining}
                                  step="0.01"
                                  placeholder={t("staffPage.payments.amountPlaceholder")}
                                  value={paymentDrafts[key] || ""}
                                  onChange={(event) =>
                                    setPaymentDrafts((current) => ({
                                      ...current,
                                      [key]: event.target.value,
                                    }))
                                  }
                                />
                                <button
                                  type="button"
                                  className="staff-payment-button"
                                  disabled={
                                    paymentSavingKey === key
                                  }
                                  onClick={() =>
                                    handleRecordPayment({
                                      ...payment,
                                      remainingAmount: remaining,
                                    })
                                  }
                                >
                                  {paymentSavingKey === key
                                    ? t("staffPage.actions.saving")
                                    : t("staffPage.payments.pay")}
                                </button>
                              </div>
                            ) : (
                              <span className="staff-payment-paid-label">
                                {t("staffPage.status.paid")}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedEventDetails && (
        <div
          className="staff-modal-overlay"
          onMouseDown={() =>
            setSelectedEventDetails(null)
          }
        >
          <div
            className="staff-modal staff-event-details-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="staff-modal-header">
              <div>
                <h2>
                  {t("staffPage.eventDetails.title")}
                </h2>
                <p>
                  {t("staffPage.eventDetails.subtitle")} {" "}
                  {
                    selectedEventDetails.eventCode
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedEventDetails(
                    null
                  )
                }
              >
                <FiX />
              </button>
            </div>

            <div className="staff-event-info-grid">
              <div>
                <span>{t("staffPage.eventDetails.eventCode")}</span>
                <strong>
                  {
                    selectedEventDetails.eventCode
                  }
                </strong>
              </div>

              <div>
                <span>{t("staffPage.eventDetails.eventName")}</span>
                <strong>
                  {
                    selectedEventDetails.eventName
                  }
                </strong>
              </div>

              <div>
                <span>{t("staffPage.eventDetails.client")}</span>
                <strong>
                  {
                    selectedEventDetails.client ||
                    "-"
                  }
                </strong>
              </div>

              <div>
                <span>{t("staffPage.eventDetails.date")}</span>
                <strong>
                  {formatDate(
                    selectedEventDetails.eventDate
                  )}
                </strong>
              </div>

              <div>
                <span>{t("staffPage.eventDetails.branch")}</span>
                <strong>
                  {
                    selectedEventDetails.branch ||
                    "-"
                  }
                </strong>
              </div>

              <div>
                <span>{t("staffPage.eventDetails.location")}</span>
                <strong>
                  {
                    selectedEventDetails.location ||
                    "-"
                  }
                  {selectedEventDetails.area
                    ? ` - ${selectedEventDetails.area}`
                    : ""}
                </strong>
              </div>

              <div>
                <span>{t("staffPage.eventDetails.startTime")}</span>
                <strong>
                  {
                    selectedEventDetails.startTime ||
                    "-"
                  }
                </strong>
              </div>

              <div>
                <span>{t("staffPage.eventDetails.endTime")}</span>
                <strong>
                  {
                    selectedEventDetails.endTime ||
                    "-"
                  }
                </strong>
              </div>
            </div>

            <div className="staff-event-details-section">
              <div className="staff-event-details-heading">
                <div>
                  <h3>{t("staffPage.tabs.waiters")}</h3>
                  <p>
                    {t("staffPage.eventDetails.waitersDescription")}
                  </p>
                </div>

                <strong>
                  {Number(
                    selectedEventDetails.waiterTotal ||
                      0
                  ).toLocaleString(
                    "en-US",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}{" "}
                  {t("staffPage.egp")}
                </strong>
              </div>

              <div className="staff-event-details-table-wrapper">
                <table className="staff-event-details-table">
                  <thead>
                    <tr>
                      <th>{t("staffPage.table.name")}</th>
                      <th>{t("staffPage.table.role")}</th>
                      <th>{t("staffPage.table.reportsTo")}</th>
                      <th>{t("staffPage.table.attendance")}</th>
                      <th>{t("staffPage.table.eventRate")}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedEventDetails.waiters
                      ?.length > 0 ? (
                      selectedEventDetails.waiters.map(
                        (waiter) => (
                          <tr
                            key={`waiter-${waiter.id}`}
                          >
                            <td>
                              {waiter.name}
                            </td>
                            <td>
                              {waiter.role === "Head Waiter"
                                ? t("staffPage.values.headWaiter")
                                : t("staffPage.values.waiter")}
                            </td>
                            <td>
                              {waiter.reportsTo ||
                                "-"}
                            </td>
                            <td>
                              {waiter.attendance ||
                                t("staffPage.values.assigned")}
                            </td>
                            <td>
                              {Number(
                                waiter.rate || 0
                              ).toLocaleString(
                                "en-US",
                                {
                                  maximumFractionDigits: 2,
                                }
                              )}{" "}
                              {t("staffPage.egp")}
                            </td>
                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="staff-event-details-empty"
                        >
                          {t("staffPage.eventDetails.noWaiters")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="staff-event-details-section">
              <div className="staff-event-details-heading">
                <div>
                  <h3>{t("staffPage.values.driver")}</h3>
                  <p>
                    {t("staffPage.eventDetails.driverDescription")}
                  </p>
                </div>

                <strong>
                  {Number(
                    selectedEventDetails.driverTotal ||
                      0
                  ).toLocaleString(
                    "en-US",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}{" "}
                  {t("staffPage.egp")}
                </strong>
              </div>

              <div className="staff-event-details-table-wrapper">
                <table className="staff-event-details-table">
                  <thead>
                    <tr>
                      <th>{t("staffPage.table.name")}</th>
                      <th>{t("staffPage.table.role")}</th>
                      <th>{t("staffPage.table.reportsTo")}</th>
                      <th>{t("staffPage.table.paymentTo")}</th>
                      <th>{t("staffPage.table.eventAmount")}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedEventDetails.driver ? (
                      <tr>
                        <td>
                          {
                            selectedEventDetails
                              .driver.name
                          }
                        </td>
                        <td>
                          {selectedEventDetails.driver.role === "Head Driver"
                            ? t("staffPage.values.headDriver")
                            : t("staffPage.values.driver")}
                        </td>
                        <td>
                          {selectedEventDetails
                            .driver.reportsTo ||
                            "-"}
                        </td>
                        <td>
                          {selectedEventDetails
                            .driver.payTo ||
                            selectedEventDetails
                              .driver.name}
                        </td>
                        <td>
                          {Number(
                            selectedEventDetails
                              .driverTotal || 0
                          ).toLocaleString(
                            "en-US",
                            {
                              maximumFractionDigits: 2,
                            }
                          )}{" "}
                          {t("staffPage.egp")}
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="staff-event-details-empty"
                        >
                          {t("staffPage.eventDetails.noDriver")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="staff-event-payment-total">
              <div>
                <span>{t("staffPage.eventDetails.waitersTotal")}</span>
                <strong>
                  {Number(
                    selectedEventDetails.waiterTotal ||
                      0
                  ).toLocaleString(
                    "en-US",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}{" "}
                  {t("staffPage.egp")}
                </strong>
              </div>

              <div>
                <span>{t("staffPage.eventDetails.driverTotal")}</span>
                <strong>
                  {Number(
                    selectedEventDetails.driverTotal ||
                      0
                  ).toLocaleString(
                    "en-US",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}{" "}
                  {t("staffPage.egp")}
                </strong>
              </div>

              <div className="grand-total">
                <span>
                  {t("staffPage.eventDetails.totalStaffCost")}
                </span>
                <strong>
                  {Number(
                    selectedEventDetails.grandTotal ||
                      0
                  ).toLocaleString(
                    "en-US",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}{" "}
                  {t("staffPage.egp")}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
