import {
  useMemo,
  useState,
} from "react";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import {
  useStaff,
} from "../context/StaffContext";

import "../styles/dashboard.css";
import "../styles/Staff.css";

import {
  FiUsers,
  FiTruck,
  FiPlus,
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
  const {
    drivers,
    waiters,
    addDriver,
    updateDriver,
    deleteDriver,
    addWaiter,
    updateWaiter,
    deleteWaiter,
  } = useStaff();

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

  const [driverForm, setDriverForm] =
    useState(driverEmptyForm);

  const [waiterForm, setWaiterForm] =
    useState(waiterEmptyForm);

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

  const openAddDriver = () => {
    setEditingDriverId(null);
    setDriverForm(driverEmptyForm);
    setShowDriverModal(true);
  };

  const openEditDriver = (driver) => {
    setEditingDriverId(driver.id);
    setDriverForm({
      ...driver,
      documents: {
        ...driver.documents,
      },
    });
    setShowDriverModal(true);
  };

  const openAddWaiter = () => {
    setEditingWaiterId(null);
    setWaiterForm(waiterEmptyForm);
    setShowWaiterModal(true);
  };

  const openEditWaiter = (waiter) => {
    setEditingWaiterId(waiter.id);
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

  const saveDriver = (event) => {
    event.preventDefault();

    if (
      !driverForm.fullName.trim() ||
      !driverForm.phone.trim() ||
      !driverForm.nationalId.trim() ||
      !driverForm.licenseNumber.trim() ||
      !driverForm.carNumber.trim()
    ) {
      alert(
        "Please complete the driver information."
      );
      return;
    }

    if (editingDriverId) {
      updateDriver(
        editingDriverId,
        driverForm
      );
    } else {
      addDriver(driverForm);
    }

    setShowDriverModal(false);
  };

  const saveWaiter = (event) => {
    event.preventDefault();

    if (
      !waiterForm.fullName.trim() ||
      !waiterForm.phone.trim() ||
      !waiterForm.nationalId.trim()
    ) {
      alert(
        "Please complete the waiter information."
      );
      return;
    }

    if (editingWaiterId) {
      updateWaiter(
        editingWaiterId,
        waiterForm
      );
    } else {
      addWaiter(waiterForm);
    }

    setShowWaiterModal(false);
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
          ? { name: file.name }
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
                ? { name: file.name }
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
                ? { name: file.name }
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

          <button
            type="button"
            className="add-staff-button"
            onClick={
              activeTab === "drivers"
                ? openAddDriver
                : openAddWaiter
            }
          >
            <FiPlus />
            {activeTab === "drivers"
              ? "Add New Driver"
              : "Add New Waiter"}
          </button>
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
                  {filteredDrivers.map(
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
                                onClick={() =>
                                  setOpenActionId(
                                    (
                                      currentId
                                    ) =>
                                      currentId ===
                                      driver.id
                                        ? null
                                        : driver.id
                                  )
                                }
                              >
                                <FiMoreVertical />
                              </button>

                              {openActionId ===
                                driver.id && (
                                <div className="staff-action-menu">
                                  <button
                                    type="button"
                                    className="staff-delete-action"
                                    onClick={() => {
                                      deleteDriver(
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
                  {filteredWaiters.map(
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
                                  onClick={() =>
                                    setOpenActionId(
                                      (
                                        currentId
                                      ) =>
                                        currentId ===
                                        waiter.id
                                          ? null
                                          : waiter.id
                                    )
                                  }
                                >
                                  <FiMoreVertical />
                                </button>

                                {openActionId ===
                                  waiter.id && (
                                  <div className="staff-action-menu">
                                    <button
                                      type="button"
                                      className="staff-delete-action"
                                      onClick={() => {
                                        deleteWaiter(
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

          <div className="staff-footer">
            {activeTab === "drivers"
              ? `${filteredDrivers.length} drivers`
              : `${filteredWaiters.length} waiters`}
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
                  {editingDriverId
                    ? "Edit Driver"
                    : "Add New Driver"}
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
              >
                Cancel
              </button>
              <button
                type="submit"
                className="staff-save-button"
              >
                {editingDriverId
                  ? "Save Changes"
                  : "Save Driver"}
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
                  {editingWaiterId
                    ? "Edit Waiter"
                    : "Add New Waiter"}
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
              >
                Cancel
              </button>
              <button
                type="submit"
                className="staff-save-button"
              >
                {editingWaiterId
                  ? "Save Changes"
                  : "Save Waiter"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}