import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";


import { useDialog } from "../context/DialogContext";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import {
  createSupplier,
  getSupplierPageData,
  removeSupplier,
  toggleSupplierStatus,
  updateSupplier,
} from "../services/suppliersService";


import "../styles/dashboard.css";
import "../styles/Suppliers.css";

import {
  FiUsers,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiMoreVertical,
  FiTrash2,
  FiX,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";

const tabs = [
  "All Suppliers",
  "Active",
  "Inactive",
];

const emptyForm = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  status: "Active",
};

export default function Suppliers() {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useDialog();


  const { hasPermission } = useAuth();

  const canAdd = hasPermission("Suppliers", "add");
  const canEdit = hasPermission("Suppliers", "edit");
  const canDelete = hasPermission("Suppliers", "delete");

  const [suppliers, setSuppliers] =
    useState([]);


  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [searchValue, setSearchValue] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("All Suppliers");

  const [
    showSupplierModal,
    setShowSupplierModal,
  ] = useState(false);

  const [
    editingSupplierId,
    setEditingSupplierId,
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

  const suppliersPerPage = 5;


  const [formData, setFormData] =
    useState(emptyForm);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);

      const data =
        await getSupplierPageData();

      setSuppliers(data.suppliers);
    } catch (error) {
      console.error(
        "Error loading suppliers:",
        error
      );

      showAlert({
        message:
          error.message ||
          t("suppliers.errors.couldNotLoad"),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (openActionId === null) {
      return undefined;
    }

    const closeActionMenu = (event) => {
      if (
        event?.target instanceof Element &&
        event.target.closest(".supplier-more-wrapper")
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

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch =
      searchValue.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const matchesSearch =
        normalizedSearch === "" ||
        [
          supplier.id,
          supplier.supplierCode,
          supplier.name,
          supplier.contactPerson,
          supplier.phone,
          supplier.email,
          supplier.address,
          supplier.status,
        ].some((value) =>
          String(value)
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesTab =
        activeTab === "All Suppliers" ||
        supplier.status === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [
    suppliers,
    searchValue,
    activeTab,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredSuppliers.length /
        suppliersPerPage
    )
  );

  const paginatedSuppliers = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      suppliersPerPage;

    return filteredSuppliers.slice(
      startIndex,
      startIndex + suppliersPerPage
    );
  }, [
    filteredSuppliers,
    currentPage,
  ]);

  useEffect(() => {
    setCurrentPage(1);
    setOpenActionId(null);
  }, [searchValue, activeTab]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const toggleActionMenu = (
    event,
    supplierId
  ) => {
    event.stopPropagation();

    if (openActionId === supplierId) {
      setOpenActionId(null);
      return;
    }

    const buttonRect =
      event.currentTarget.getBoundingClientRect();

    const menuWidth = 135;
    const menuHeight = 78;
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

    setOpenActionId(supplierId);
  };

  const openAddModal = () => {
    if (!canAdd) {
      showAlert({
        message: t("suppliers.errors.noAddPermission"),
      });
      return;
    }

    setEditingSupplierId(null);
    setFormData(emptyForm);
    setShowSupplierModal(true);
  };

  const openEditModal = (supplier) => {
    if (!canEdit) {
      showAlert({
        message: t("suppliers.errors.noEditPermission"),
      });
      return;
    }

    setEditingSupplierId(supplier.id);

    setFormData({
      name: supplier.name,
      contactPerson:
        supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      status: supplier.status,
    });

    setOpenActionId(null);
    setShowSupplierModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowSupplierModal(false);
    setEditingSupplierId(null);
    setFormData(emptyForm);
  };

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

  const handleSaveSupplier = async (
    event
  ) => {
    event.preventDefault();

    const requiredPermission =
      editingSupplierId
        ? canEdit
        : canAdd;

    if (!requiredPermission) {
      await showAlert({
        title: t("suppliers.errors.permissionDenied"),
        message: editingSupplierId
          ? t("suppliers.errors.noEditPermission")
          : t("suppliers.errors.noAddPermission"),
        type: "warning",
      });

      return;
    }

    const requiredFields = [
      "name",
      "contactPerson",
      "phone",
      "email",
      "address",
    ];

    const hasEmptyField =
      requiredFields.some(
        (field) =>
          String(
            formData[field]
          ).trim() === ""
      );

    if (hasEmptyField) {
      showAlert({
        message:
          t("suppliers.errors.completeAllFields"),
      });
      return;
    }


    try {
      setSaving(true);

      if (editingSupplierId) {
        const updatedSupplier =
          await updateSupplier(
            editingSupplierId,
            formData
          );

        setSuppliers(
          (currentSuppliers) =>
            currentSuppliers.map(
              (supplier) =>
                supplier.id ===
                editingSupplierId
                  ? updatedSupplier
                  : supplier
            )
        );
      } else {
        const createdSupplier =
          await createSupplier(
            formData
          );

        setSuppliers(
          (currentSuppliers) => [
            createdSupplier,
            ...currentSuppliers,
          ]
        );
      }

      closeModal();
    } catch (error) {
      console.error(
        "Error saving supplier:",
        error
      );

      showAlert({
        message:
          error.message ||
          t("suppliers.errors.couldNotSave"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSupplier = async (
    supplierId
  ) => {
    if (!canDelete) {
      showAlert({
        message: t("suppliers.errors.noDeletePermission"),
      });
      return;
    }

    const confirmed = await showConfirm({
      message: t("suppliers.confirm.deleteSupplier"),
    });

    if (!confirmed) {
      return;
    }

    try {
      await removeSupplier(
        supplierId
      );

      setSuppliers(
        (currentSuppliers) =>
          currentSuppliers.filter(
            (supplier) =>
              supplier.id !== supplierId
          )
      );

      setOpenActionId(null);
    } catch (error) {
      console.error(
        "Error deleting supplier:",
        error
      );

      showAlert({
        message:
          error.message ||
          t("suppliers.errors.couldNotDelete"),
      });
    }
  };

  const handleToggleSupplierStatus = async (
    supplier
  ) => {
    if (!canEdit) {
      await showAlert({
        title: t("suppliers.errors.permissionDenied"),
        message:
          t("suppliers.errors.noEditPermission"),
        type: "warning",
      });

      return;
    }
    try {
      const updatedSupplier =
        await toggleSupplierStatus(
          supplier.id,
          supplier.status
        );

      setSuppliers(
        (currentSuppliers) =>
          currentSuppliers.map(
            (currentSupplier) =>
              currentSupplier.id ===
              supplier.id
                ? updatedSupplier
                : currentSupplier
          )
      );

      setOpenActionId(null);
    } catch (error) {
      console.error(
        "Error updating supplier status:",
        error
      );

      showAlert({
        message:
          error.message ||
          t("suppliers.errors.couldNotUpdateStatus"),
      });
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar activePage="suppliers" />

      <main className="suppliers-main">
        <Topbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        <section className="suppliers-title-section">
          <div>
            <h1>{t("suppliers.title")}</h1>

            <p>
              {t("suppliers.subtitle")}
            </p>
          </div>

          <button
            type="button"
            className="add-supplier-button"
            onClick={openAddModal}
          >
            <FiPlus />
            {t("suppliers.addNewSupplier")}
          </button>
        </section>

        <section className="suppliers-table-card">
          <div className="suppliers-table-toolbar">
            <div className="suppliers-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={
                    activeTab === tab
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveTab(tab)
                  }
                >
                  {t(`suppliers.tabs.${tab === "All Suppliers" ? "all" : tab.toLowerCase()}`)}
                </button>
              ))}
            </div>

            <div className="suppliers-search-box">
              <FiSearch />

              <input
                type="text"
                placeholder={t("suppliers.searchPlaceholder")}
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(
                    event.target.value
                  )
                }
              />
            </div>
          </div>

          <div className="suppliers-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t("suppliers.table.supplier")}</th>
                  <th>{t("suppliers.table.contactPerson")}</th>
                  <th>{t("suppliers.table.phone")}</th>
                  <th>{t("suppliers.table.email")}</th>
                  <th>{t("suppliers.table.address")}</th>
                  <th>{t("suppliers.table.status")}</th>
                  <th>{t("suppliers.table.actions")}</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="suppliers-empty-state"
                    >
                      {t("suppliers.loading")}
                    </td>
                  </tr>
                ) : paginatedSuppliers.length > 0 ? (
                  paginatedSuppliers.map(
                    (supplier) => (
                      <tr key={supplier.id}>
                        <td>
                          <div className="supplier-name-cell">
                            <div className="supplier-icon">
                              <FiUsers />
                            </div>

                            <div>
                              <strong>
                                {supplier.name}
                              </strong>

                              <span>
                                {supplier.supplierCode ||
                                  supplier.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {
                            supplier.contactPerson
                          }
                        </td>

                        <td>
                          {supplier.phone}
                        </td>

                        <td>
                          {supplier.email}
                        </td>

                        <td>
                          {supplier.address}
                        </td>


                        <td>
                          <span
                            className={`supplier-status ${supplier.status.toLowerCase()}`}
                          >
                            {t(`suppliers.status.${supplier.status.toLowerCase()}`)}
                          </span>
                        </td>

                        <td className="supplier-action-cell">
                          <div className="supplier-actions">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  supplier
                                )
                              }
                              aria-label={t("suppliers.aria.editSupplier", { name: supplier.name })}
                            >
                              <FiEdit2 />
                            </button>

                            <div className="supplier-more-wrapper">
                              <button
                                type="button"
                                className="supplier-more-button"
                                onClick={(event) =>
                                  toggleActionMenu(
                                    event,
                                    supplier.id
                                  )
                                }
                                aria-label={t("suppliers.aria.moreActions", { name: supplier.name })}
                              >
                                <FiMoreVertical />
                              </button>

                              {openActionId ===
                                supplier.id && (
                                <div
                                  className="supplier-action-menu"
                                  style={{
                                    top: `${actionMenuPosition.top}px`,
                                    left: `${actionMenuPosition.left}px`,
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleSupplierStatus(
                                        supplier
                                      )
                                    }
                                  >
                                    {supplier.status ===
                                    "Active" ? (
                                      <FiUserX />
                                    ) : (
                                      <FiUserCheck />
                                    )}

                                    {supplier.status ===
                                    "Active"
                                      ? t("suppliers.actions.deactivate")
                                      : t("suppliers.actions.activate")}
                                  </button>

                                  <button
                                    type="button"
                                    className="supplier-delete-action"
                                    onClick={() =>
                                      handleDeleteSupplier(
                                        supplier.id
                                      )
                                    }
                                  >
                                    <FiTrash2 />
                                    {t("suppliers.actions.delete")}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="suppliers-empty-state"
                    >
                      {t("suppliers.noResults")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="suppliers-pagination">
            <p>
              {t("suppliers.pagination.showing")} {" "}
              {filteredSuppliers.length === 0
                ? 0
                : (currentPage - 1) *
                    suppliersPerPage +
                  1}
              {" - "}
              {Math.min(
                currentPage *
                  suppliersPerPage,
                filteredSuppliers.length
              )}{" "}
              {t("suppliers.pagination.of")} {" "}
              {filteredSuppliers.length}{" "}
              {t("suppliers.pagination.suppliers")}
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

      {showSupplierModal && (
        <div
          className="supplier-modal-overlay"
          onMouseDown={closeModal}
        >
          <form
            className="supplier-modal"
            onSubmit={handleSaveSupplier}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="supplier-modal-header">
              <div>
                <h2>
                  {editingSupplierId
                    ? t("suppliers.modal.editSupplier")
                    : t("suppliers.addNewSupplier")}
                </h2>

                <p>
                  {t("suppliers.modal.description")}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
              >
                <FiX />
              </button>
            </div>

            <div className="supplier-modal-grid">
              <label>
                {t("suppliers.modal.supplierName")}
                <input
                  type="text"
                  name="name"
                  placeholder="Royal Glass"
                  value={formData.name}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                {t("suppliers.modal.contactPerson")}
                <input
                  type="text"
                  name="contactPerson"
                  placeholder="Ahmed Hassan"
                  value={
                    formData.contactPerson
                  }
                  onChange={handleFormChange}
                />
              </label>

              <label>
                {t("suppliers.modal.phoneNumber")}
                <input
                  type="text"
                  name="phone"
                  placeholder="01012345678"
                  value={formData.phone}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                {t("suppliers.modal.email")}
                <input
                  type="email"
                  name="email"
                  placeholder="info@supplier.com"
                  value={formData.email}
                  onChange={handleFormChange}
                />
              </label>

              <label className="supplier-full-field">
                {t("suppliers.modal.address")}
                <input
                  type="text"
                  name="address"
                  placeholder={t("suppliers.modal.addressPlaceholder")}
                  value={formData.address}
                  onChange={handleFormChange}
                />
              </label>

              <label className="supplier-full-field">
                {t("suppliers.modal.status")}
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                >
                  <option value="Active">
                    {t("suppliers.status.active")}
                  </option>

                  <option value="Inactive">
                    {t("suppliers.status.inactive")}
                  </option>
                </select>
              </label>
            </div>

            <div className="supplier-modal-actions">
              <button
                type="button"
                className="supplier-cancel-button"
                onClick={closeModal}
                disabled={saving}
              >
                {t("suppliers.modal.cancel")}
              </button>

              <button
                type="submit"
                className="supplier-save-button"
                disabled={saving}
              >
                {saving
                  ? t("suppliers.modal.saving")
                  : editingSupplierId
                    ? t("suppliers.modal.saveChanges")
                    : t("suppliers.modal.saveSupplier")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}