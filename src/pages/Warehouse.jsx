import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../styles/mobile-sidebar-offcanvas.css";

import { useAuth } from "../context/AuthContext";


import { useDialog } from "../context/DialogContext";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import {
  createWarehouse,
  getWarehouses,
  removeWarehouse,
  updateWarehouse,
} from "../services/warehouseService";

import "../styles/dashboard.css";
import "../styles/Warehouse.css";

import {
  FiHome,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiMoreVertical,
  FiX,
  FiTrash2,
} from "react-icons/fi";

const emptyForm = {
  name: "",
  branch: "Cairo",
  location: "",
  capacity: "",
};

export default function Warehouse() {
  const { showAlert, showConfirm } = useDialog();


  const { hasPermission } = useAuth();

  const canAdd = hasPermission("Warehouse", "add");
  const canEdit = hasPermission("Warehouse", "edit");
  const canDelete = hasPermission("Warehouse", "delete");

  const [warehouses, setWarehouses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [searchValue, setSearchValue] =
    useState("");

  const [
    selectedBranch,
    setSelectedBranch,
  ] = useState("All Branches");

  const [
    showWarehouseModal,
    setShowWarehouseModal,
  ] = useState(false);

  const [
    editingWarehouseId,
    setEditingWarehouseId,
  ] = useState(null);

  const [
    openActionId,
    setOpenActionId,
  ] = useState(null);

  const [actionMenuPosition, setActionMenuPosition] =
    useState({
      top: 0,
      left: 0,
    });

  const [currentPage, setCurrentPage] =
    useState(1);

  const warehousesPerPage = 5;

  const [formData, setFormData] =
    useState(emptyForm);

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (openActionId === null) {
      return undefined;
    }

    const closeActionMenu = (event) => {
      if (
        event?.target instanceof Element &&
        event.target.closest(".warehouse-more-wrapper")
      ) {
        return;
      }

      setOpenActionId(null);
    };

    const closeOnPageMove = () => {
      setOpenActionId(null);
    };

    document.addEventListener("mousedown", closeActionMenu);
    window.addEventListener("scroll", closeOnPageMove, true);
    window.addEventListener("resize", closeOnPageMove);

    return () => {
      document.removeEventListener("mousedown", closeActionMenu);
      window.removeEventListener("scroll", closeOnPageMove, true);
      window.removeEventListener("resize", closeOnPageMove);
    };
  }, [openActionId]);

  const loadWarehouses = async () => {
    try {
      setLoading(true);

      const warehouseData =
        await getWarehouses();

      setWarehouses(warehouseData);
    } catch (error) {
      console.error(
        "Error loading warehouses:",
        error
      );

      showAlert({
        message: error.message ||
          "Could not load warehouses.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredWarehouses = useMemo(() => {
    const normalizedSearch =
      searchValue.trim().toLowerCase();

    return warehouses.filter((warehouse) => {
      const matchesSearch =
        normalizedSearch === "" ||
        [
          warehouse.warehouseCode,
          warehouse.name,
          warehouse.branch,
          warehouse.location,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesBranch =
        selectedBranch === "All Branches" ||
        warehouse.branch === selectedBranch;

      return matchesSearch && matchesBranch;
    });
  }, [
    warehouses,
    searchValue,
    selectedBranch,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredWarehouses.length /
        warehousesPerPage
    )
  );

  const paginatedWarehouses = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      warehousesPerPage;

    return filteredWarehouses.slice(
      startIndex,
      startIndex + warehousesPerPage
    );
  }, [
    filteredWarehouses,
    currentPage,
  ]);

  useEffect(() => {
    setCurrentPage(1);
    setOpenActionId(null);
  }, [searchValue, selectedBranch]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleFormChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    if (!canAdd) {
      showAlert({
        message: "You do not have permission to add warehouses.",
      });
      return;
    }

    setEditingWarehouseId(null);
    setOpenActionId(null);
    setFormData(emptyForm);
    setShowWarehouseModal(true);
  };

  const openEditModal = (warehouse) => {
    if (!canEdit) {
      showAlert({
        message: "You do not have permission to edit warehouses.",
      });
      return;
    }

    setEditingWarehouseId(warehouse.id);

    setFormData({
      name: warehouse.name,
      branch: warehouse.branch,
      location: warehouse.location,
      capacity: warehouse.capacity,
    });

    setOpenActionId(null);
    setShowWarehouseModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowWarehouseModal(false);
    setEditingWarehouseId(null);
    setFormData(emptyForm);
  };

  const validateWarehouseForm = () => {
    const requiredFields = [
      "name",
      "branch",
      "location",
      "capacity",
    ];

    const hasEmptyField =
      requiredFields.some(
        (field) =>
          String(
            formData[field] || ""
          ).trim() === ""
      );

    if (hasEmptyField) {
      showAlert({
        message: "Please complete all warehouse fields.",
      });

      return false;
    }

    const capacity = Number(
      formData.capacity
    );

    if (
      !Number.isFinite(capacity) ||
      capacity <= 0
    ) {
      showAlert({
        message: "Total capacity must be greater than zero.",
      });

      return false;
    }

    if (editingWarehouseId) {
      const currentWarehouse =
        warehouses.find(
          (warehouse) =>
            warehouse.id ===
            editingWarehouseId
        );

      if (
        currentWarehouse &&
        capacity <
          Number(
            currentWarehouse.usedCapacity
          )
      ) {
        showAlert({
        message: "Total capacity cannot be less than the current used capacity.",
      });

        return false;
      }
    }

    return true;
  };

  const handleSaveWarehouse = async (
    event
  ) => {
    event.preventDefault();

    const requiredPermission =
      editingWarehouseId
        ? canEdit
        : canAdd;

    if (!requiredPermission) {
      await showAlert({
        title: "Permission Denied",
        message: editingWarehouseId
          ? "You do not have permission to edit warehouses."
          : "You do not have permission to add warehouses.",
        type: "warning",
      });

      return;
    }

    if (!validateWarehouseForm()) {
      return;
    }

    try {
      setSaving(true);

      if (editingWarehouseId) {
        const updatedWarehouse =
          await updateWarehouse(
            editingWarehouseId,
            formData
          );

        setWarehouses(
          (currentWarehouses) =>
            currentWarehouses.map(
              (warehouse) =>
                warehouse.id ===
                editingWarehouseId
                  ? updatedWarehouse
                  : warehouse
            )
        );
      } else {
        const newWarehouse =
          await createWarehouse(formData);

        setWarehouses(
          (currentWarehouses) => [
            newWarehouse,
            ...currentWarehouses,
          ]
        );
      }

      setShowWarehouseModal(false);
      setEditingWarehouseId(null);
      setFormData(emptyForm);
    } catch (error) {
      console.error(
        "Error saving warehouse:",
        error
      );

      if (error.code === "23505") {
        showAlert({
        message: "A warehouse with this name already exists.",
      });
      } else {
        showAlert({
        message: error.message ||
            "Could not save warehouse.",
      });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWarehouse = async (
    warehouseId
  ) => {
    if (!canDelete) {
      showAlert({
        message: "You do not have permission to delete warehouses.",
      });
      return;
    }

    const warehouse = warehouses.find(
      (currentWarehouse) =>
        currentWarehouse.id === warehouseId
    );

    if (
      warehouse &&
      Number(warehouse.usedCapacity) > 0
    ) {
      showAlert({
        message: "You cannot delete a warehouse that contains inventory.",
      });

      setOpenActionId(null);
      return;
    }

    const confirmed = await showConfirm({
      message: "Are you sure you want to delete this warehouse?",
    });

    if (!confirmed) {
      return;
    }

    try {
      await removeWarehouse(warehouseId);

      setWarehouses(
        (currentWarehouses) =>
          currentWarehouses.filter(
            (currentWarehouse) =>
              currentWarehouse.id !==
              warehouseId
          )
      );

      setOpenActionId(null);
    } catch (error) {
      console.error(
        "Error deleting warehouse:",
        error
      );

      if (error.code === "23503") {
        showAlert({
        message: "This warehouse cannot be deleted because it is connected to events, purchases, dispatches, or company settings.",
      });
      } else {
        showAlert({
        message: error.message ||
            "Could not delete warehouse.",
      });
      }
    }
  };

  const getCapacityData = (warehouse) => {
    const capacity = Number(
      warehouse.capacity || 0
    );

    const usedCapacity = Number(
      warehouse.usedCapacity || 0
    );

    const availableCapacity = Math.max(
      capacity - usedCapacity,
      0
    );

    const usagePercentage =
      capacity === 0
        ? 0
        : Math.min(
            100,
            Math.round(
              (usedCapacity / capacity) *
                100
            )
          );

    return {
      availableCapacity,
      usagePercentage,
    };
  };

  const toggleActionMenu = (
    event,
    warehouseId
  ) => {
    event.stopPropagation();

    if (openActionId === warehouseId) {
      setOpenActionId(null);
      return;
    }

    const buttonRect =
      event.currentTarget.getBoundingClientRect();

    const menuWidth = 120;
    const menuHeight = 92;
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
      buttonRect.right - menuWidth;

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

    setOpenActionId(warehouseId);
  };

  return (
    <div className="dashboard-page">
      <Sidebar activePage="warehouse" />

      <main className="warehouse-main">
        <Topbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        <section className="warehouse-title-section">
          <div>
            <h1>Warehouse</h1>

            <p>
              Manage all your warehouses
            </p>
          </div>

          <button
            type="button"
            className="add-warehouse-button"
            onClick={openAddModal}
          >
            <FiPlus />
            <span>Add New Warehouse</span>
          </button>
        </section>

        <section className="warehouse-table-card">
          <div className="warehouse-table-toolbar">
            <div>
              <h3>All Warehouses</h3>
              <p>
                View warehouse capacity and usage
              </p>
            </div>

            <div className="warehouse-filters">
              <div className="warehouse-search-box">
                <FiSearch />

                <input
                  type="text"
                  placeholder="Search warehouses..."
                  value={searchValue}
                  onChange={(event) =>
                    setSearchValue(
                      event.target.value
                    )
                  }
                />
              </div>

              <select
                value={selectedBranch}
                onChange={(event) =>
                  setSelectedBranch(
                    event.target.value
                  )
                }
              >
                <option value="All Branches">
                  All Branches
                </option>

                <option value="Cairo">
                  Cairo
                </option>

                <option value="Alex">
                  Alex
                </option>
              </select>
            </div>
          </div>

          <div className="warehouse-table-wrapper">
            <table>
              <thead>
                <tr>

                  <th>Warehouse Name</th>
                  <th>Branch</th>
                  <th>Location</th>
                  <th>Total Capacity</th>
                  <th>Available Capacity</th>
                  <th>Usage</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="warehouse-empty-state"
                    >
                      Loading warehouses...
                    </td>
                  </tr>
                ) : filteredWarehouses.length >
                  0 ? (
                  paginatedWarehouses.map(
                    (warehouse) => {
                      const {
                        availableCapacity,
                        usagePercentage,
                      } =
                        getCapacityData(
                          warehouse
                        );

                      return (
                        <tr
                          key={warehouse.id}
                        >

                          <td>
                            <div className="warehouse-name-cell">
                              <div className="warehouse-row-icon">
                                <FiHome />
                              </div>

                              <div>
                                <strong>
                                  {
                                    warehouse.name
                                  }
                                </strong>

                                <span>
                                  {
                                    warehouse.warehouseCode
                                  }
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            {warehouse.branch}
                          </td>

                          <td>
                            {warehouse.location}
                          </td>

                          <td>
                            {Number(
                              warehouse.capacity
                            ).toLocaleString()}{" "}
                            Items
                          </td>

                          <td className="warehouse-available-value">
                            {availableCapacity.toLocaleString()}{" "}
                            Items
                          </td>

                          <td>
                            <div className="warehouse-capacity-cell">
                              <span>
                                {Number(
                                  warehouse.usedCapacity
                                ).toLocaleString()}{" "}
                                used (
                                {usagePercentage}%)
                              </span>

                              <div className="warehouse-progress">
                                <div
                                  style={{
                                    width: `${usagePercentage}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="warehouse-action-cell">
                            <div className="warehouse-actions">
                              <button
                                type="button"
                                className="warehouse-edit-button"
                                aria-label={`Edit ${warehouse.name}`}
                                onClick={() =>
                                  openEditModal(
                                    warehouse
                                  )
                                }
                              >
                                <FiEdit2 />
                              </button>

                              <div className="warehouse-more-wrapper">
                                <button
                                  type="button"
                                  className="warehouse-more-button"
                                  aria-label={`More actions for ${warehouse.name}`}
                                  onClick={(event) =>
                                    toggleActionMenu(
                                      event,
                                      warehouse.id
                                    )
                                  }
                                >
                                  <FiMoreVertical />
                                </button>

                                {openActionId ===
                                  warehouse.id && (
                                  <div
                                    className="warehouse-action-menu"
                                    style={{
                                      top: actionMenuPosition.top,
                                      left: actionMenuPosition.left,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openEditModal(
                                          warehouse
                                        )
                                      }
                                    >
                                      <FiEdit2 />
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      className="warehouse-delete-action"
                                      onClick={() =>
                                        handleDeleteWarehouse(
                                          warehouse.id
                                        )
                                      }
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
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="warehouse-empty-state"
                    >
                      No warehouses match your
                      search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="warehouse-pagination">
            <p>
              Showing{" "}
              {filteredWarehouses.length === 0
                ? 0
                : (currentPage - 1) *
                    warehousesPerPage +
                  1}
              {" - "}
              {Math.min(
                currentPage *
                  warehousesPerPage,
                filteredWarehouses.length
              )}{" "}
              of{" "}
              {filteredWarehouses.length} warehouses
            </p>

            <div>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage(
                    (current) =>
                      Math.max(
                        1,
                        current - 1
                      )
                  )
                }
              >
                 ‹
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={
                    currentPage === pageNumber
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setCurrentPage(pageNumber)
                  }
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                disabled={
                  currentPage === totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (current) =>
                      Math.min(
                        totalPages,
                        current + 1
                      )
                  )
                }
              >
                  ›
              </button>
            </div>
          </div>
        </section>
      </main>

      {showWarehouseModal && (
        <div
          className="warehouse-modal-overlay"
          onMouseDown={closeModal}
        >
          <form
            className="warehouse-modal"
            onSubmit={handleSaveWarehouse}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="warehouse-modal-header">
              <div>
                <h2>
                  {editingWarehouseId
                    ? "Edit Warehouse"
                    : "Add New Warehouse"}
                </h2>

                <p>
                  Enter the warehouse
                  information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close form"
                disabled={saving}
              >
                <FiX />
              </button>
            </div>

            <div className="warehouse-modal-grid">
              <label>
                Warehouse Name

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Cairo Warehouse"
                  disabled={saving}
                />
              </label>

              <label>
                Branch

                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleFormChange}
                  disabled={saving}
                >
                  <option value="Cairo">
                    Cairo
                  </option>

                  <option value="Alex">
                    Alex
                  </option>
                </select>
              </label>

              <label className="warehouse-full-field">
                Location

                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  placeholder="New Cairo, Cairo"
                  disabled={saving}
                />
              </label>

              <label className="warehouse-full-field">
                Total Capacity

                <input
                  type="number"
                  min="1"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleFormChange}
                  placeholder="5000"
                  disabled={saving}
                />
              </label>
            </div>

            <div className="warehouse-modal-note">
              Used and available capacity are
              calculated automatically from
              inventory.
            </div>

            <div className="warehouse-modal-actions">
              <button
                type="button"
                className="warehouse-cancel-button"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="warehouse-save-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingWarehouseId
                    ? "Save Changes"
                    : "Save Warehouse"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}