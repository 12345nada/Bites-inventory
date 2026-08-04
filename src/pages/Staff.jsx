import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  const { showAlert, showConfirm } = useDialog();


  const { hasPermission } = useAuth();

  const canEdit = hasPermission("Staff", "edit");
  const canDelete = hasPermission("Staff", "delete");

  const [drivers, setDrivers] =
    useState([]);

  const [waiters, setWaiters] =
    useState([]);

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

      const data = await getStaff();

      setDrivers(data.drivers || []);
      setWaiters(data.waiters || []);
    } catch (error) {
      console.error(
        "Error loading staff:",
        error
      );

      showAlert({
        message: error.message ||
          "Could not load staff.",
      });
    } finally {
      setLoading(false);
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
      : filteredWaiters;

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
        title: "Permission Denied",
        message:
          "You do not have permission to edit staff.",
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
        title: "Permission Denied",
        message:
          "You do not have permission to edit staff.",
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
        message: "Please complete the driver information.",
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
          ? "National ID or license number already exists."
          : error.message ||
              "Could not save driver.",
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
        message: "Please complete the waiter information.",
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
          ? "National ID already exists."
          : error.message ||
              "Could not save waiter.",
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
        title: "Permission Denied",
        message:
          "You do not have permission to delete staff.",
        type: "warning",
      });

      return;
    }

    const confirmed = await showConfirm({
      message: "Are you sure you want to delete this driver?",
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
          ? "This driver is connected to events or dispatches and cannot be deleted."
          : error.message ||
              "Could not delete driver.",
      });
    }
  };

  const handleDeleteWaiter = async (
    waiterId
  ) => {
    if (!canDelete) {
      await showAlert({
        title: "Permission Denied",
        message:
          "You do not have permission to delete staff.",
        type: "warning",
      });

      return;
    }

    const confirmed = await showConfirm({
      message: "Are you sure you want to delete this waiter?",
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
          ? "This waiter is connected to an event and cannot be deleted."
          : error.message ||
              "Could not delete waiter.",
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
            <h1>Staff Management</h1>
            <p>
              Manage drivers, waiters and
              their documents
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
                Drivers
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
                Waiters
              </button>
            </div>

            <div className="staff-filters">
              <div className="staff-search-box">
                <FiSearch />
                <input
                  type="text"
                  placeholder={
                    activeTab === "drivers"
                      ? "Search drivers..."
                      : "Search waiters..."
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
                <option>
                  All Statuses
                </option>
                <option value="Active">
                  Active
                </option>
                <option value="Inactive">
                  Inactive
                </option>
                <option value="Suspended">
                  Suspended
                </option>
              </select>
            </div>
          </div>

          {activeTab === "drivers" ? (
            <div className="staff-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Phone</th>
                    <th>National ID</th>
                    <th>License</th>
                    <th>License Expiry</th>
                    <th>Car Number</th>
                    <th>Car Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="staff-empty-state"
                      >
                        Loading drivers...
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
                          {driver.carType}
                        </td>
                        <td>
                          <span
                            className={`staff-status ${driver.status.toLowerCase()}`}
                          >
                            {driver.status}
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
                                    Delete
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
          ) : (
            <div className="staff-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Waiter</th>
                    <th>Phone</th>
                    <th>National ID</th>
                    <th>Health Expiry</th>
                    <th>Contract End</th>
                    <th>Documents</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="staff-empty-state"
                      >
                        Loading waiters...
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
                            <span
                              className={`staff-status ${waiter.status.toLowerCase()}`}
                            >
                              {waiter.status}
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
                                      Delete
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
          )}

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
                ? "drivers"
                : "waiters"}
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
"Edit Driver"
                </h2>
                <p>
                  Enter driver and vehicle
                  information.
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
                ["fullName", "Full Name"],
                ["phone", "Phone Number"],
                ["nationalId", "National ID"],
                [
                  "licenseNumber",
                  "License Number",
                ],
                ["carNumber", "Car Number"],
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
                License Expiry Date
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
                Car Type
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
                    Van
                  </option>
                  <option value="Truck">
                    Truck
                  </option>
                  <option value="Pickup">
                    Pickup
                  </option>
                  <option value="Refrigerated Truck">
                    Refrigerated Truck
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </label>

              <label>
                Status
                <select
                  name="status"
                  value={driverForm.status}
                  onChange={
                    handleDriverChange
                  }
                >
                  <option value="Active">
                    Active
                  </option>
                  <option value="Inactive">
                    Inactive
                  </option>
                  <option value="Suspended">
                    Suspended
                  </option>
                </select>
              </label>
            </div>

            <div className="staff-documents-section">
              <h3>Documents</h3>
              <div className="staff-upload-grid">
                <label className="staff-upload-box">
                  <FiImage />
                  <span>
                    National ID Image
                  </span>
                  <small>
                    {driverForm.documents
                      .nationalIdImage
                      ?.name ||
                      "Upload image"}
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
                    License Image
                  </span>
                  <small>
                    {driverForm.documents
                      .licenseImage?.name ||
                      "Upload image"}
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
                  ? "Saving..."
                  : "Save Changes"}
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
"Edit Waiter"
                </h2>
                <p>
                  Enter waiter information and
                  documents.
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
                ["fullName", "Full Name"],
                ["phone", "Phone Number"],
                ["nationalId", "National ID"],
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
                Status
                <select
                  name="status"
                  value={waiterForm.status}
                  onChange={
                    handleWaiterChange
                  }
                >
                  <option value="Active">
                    Active
                  </option>
                  <option value="Inactive">
                    Inactive
                  </option>
                  <option value="Suspended">
                    Suspended
                  </option>
                </select>
              </label>
            </div>

            <div className="staff-documents-section">
              <h3>Documents</h3>

              <div className="staff-upload-grid">
                {[
                  [
                    "personalPhoto",
                    "Personal Photo",
                    <FiImage />,
                  ],
                  [
                    "nationalIdImage",
                    "National ID Image",
                    <FiImage />,
                  ],
                  [
                    "healthCertificate",
                    "Health Certificate",
                    <FiFileText />,
                  ],
                  [
                    "contract",
                    "Contract",
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
                            "Upload file"}
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
                  Health Certificate Expiry
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
                  Contract Start Date
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
                  Contract End Date
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
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}