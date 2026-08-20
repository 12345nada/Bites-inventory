import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
          t("warehousePage.errors.couldNotLoad"),
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
        message: t("warehousePage.errors.noAddPermission"),
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
        message: t("warehousePage.errors.noEditPermission"),
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
        message: t("warehousePage.errors.completeAllFields"),
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
        message: t("warehousePage.errors.capacityGreaterThanZero"),
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
        message: t("warehousePage.errors.capacityBelowUsed"),
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
        title: t("warehousePage.errors.permissionDenied"),
        message: editingWarehouseId
          ? t("warehousePage.errors.noEditPermission")
          : t("warehousePage.errors.noAddPermission"),
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
        message: t("warehousePage.errors.nameExists"),
      });
      } else {
        showAlert({
        message: error.message ||
            t("warehousePage.errors.couldNotSave"),
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
        message: t("warehousePage.errors.noDeletePermission"),
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
        message: t("warehousePage.errors.containsInventory"),
      });

      setOpenActionId(null);
      return;
    }

    const confirmed = await showConfirm({
      message: t("warehousePage.confirm.deleteWarehouse"),
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
        message: t("warehousePage.errors.connectedRecords"),
      });
      } else {
        showAlert({
        message: error.message ||
            t("warehousePage.errors.couldNotDelete"),
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
            <h1>{t("warehousePage.title")}</h1>

            <p>
              {t("warehousePage.subtitle")}
            </p>
          </div>

          <button
            type="button"
            className="add-warehouse-button"
            onClick={openAddModal}
          >
            <FiPlus />
            <span>{t("warehousePage.addNewWarehouse")}</span>
          </button>
        </section>

        <section className="warehouse-table-card">
          <div className="warehouse-table-toolbar">
            <div>
              <h3>{t("warehousePage.allWarehouses")}</h3>
              <p>
                {t("warehousePage.tableSubtitle")}
              </p>
            </div>

            <div className="warehouse-filters">
              <div className="warehouse-search-box">
                <FiSearch />

                <input
                  type="text"
                  placeholder={t("warehousePage.searchPlaceholder")}
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
                  {t("warehousePage.allBranches")}
                </option>

                <option value="Cairo">
                  {t("branches.cairo")}
                </option>

                <option value="Alex">
                  {t("branches.alex")}
                </option>
              </select>
            </div>
          </div>

          <div className="warehouse-table-wrapper">
            <table>
              <thead>
                <tr>

                  <th>{t("warehousePage.table.warehouseName")}</th>
                  <th>{t("warehousePage.table.branch")}</th>
                  <th>{t("warehousePage.table.location")}</th>
                  <th>{t("warehousePage.table.totalCapacity")}</th>
                  <th>{t("warehousePage.table.availableCapacity")}</th>
                  <th>{t("warehousePage.table.usage")}</th>
                  <th>{t("warehousePage.table.actions")}</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="warehouse-empty-state"
                    >
                      {t("warehousePage.loading")}
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
                            {t("warehousePage.items")}
                          </td>

                          <td className="warehouse-available-value">
                            {availableCapacity.toLocaleString()}{" "}
                            {t("warehousePage.items")}
                          </td>

                          <td>
                            <div className="warehouse-capacity-cell">
                              <span>
                                {Number(
                                  warehouse.usedCapacity
                                ).toLocaleString()}{" "}
                                {t("warehousePage.used")} (
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
                                aria-label={t("warehousePage.aria.editWarehouse", { name: warehouse.name })}
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
                                  aria-label={t("warehousePage.aria.moreActions", { name: warehouse.name })}
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
                                      {t("warehousePage.actions.edit")}
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
                                      {t("warehousePage.actions.delete")}
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
                      {t("warehousePage.noResults")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="warehouse-pagination">
            <p>
              {t("warehousePage.pagination.showing")}{" "}
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
              {t("warehousePage.pagination.of")}{" "}
              {filteredWarehouses.length} {t("warehousePage.pagination.warehouses")}
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
                    ? t("warehousePage.modal.editWarehouse")
                    : t("warehousePage.modal.addWarehouse")}
                </h2>

                <p>
                  {t("warehousePage.modal.description")}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label={t("warehousePage.modal.closeForm")}
                disabled={saving}
              >
                <FiX />
              </button>
            </div>

            <div className="warehouse-modal-grid">
              <label>
                {t("warehousePage.modal.warehouseName")}

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder={t("warehousePage.modal.namePlaceholder")}
                  disabled={saving}
                />
              </label>

              <label>
                {t("warehousePage.modal.branch")}

                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleFormChange}
                  disabled={saving}
                >
                  <option value="Cairo">
                    {t("branches.cairo")}
                  </option>

                  <option value="Alex">
                    {t("branches.alex")}
                  </option>
                </select>
              </label>

              <label className="warehouse-full-field">
                {t("warehousePage.modal.location")}

                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  placeholder={t("warehousePage.modal.locationPlaceholder")}
                  disabled={saving}
                />
              </label>

              <label className="warehouse-full-field">
                {t("warehousePage.modal.totalCapacity")}

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
              {t("warehousePage.modal.capacityNote")}
            </div>

            <div className="warehouse-modal-actions">
              <button
                type="button"
                className="warehouse-cancel-button"
                onClick={closeModal}
                disabled={saving}
              >
                {t("warehousePage.modal.cancel")}
              </button>

              <button
                type="submit"
                className="warehouse-save-button"
                disabled={saving}
              >
                {saving
                  ? t("warehousePage.modal.saving")
                  : editingWarehouseId
                    ? t("warehousePage.modal.saveChanges")
                    : t("warehousePage.modal.saveWarehouse")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}