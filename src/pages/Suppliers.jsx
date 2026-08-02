import {
  useMemo,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import {
  useSuppliers,
} from "../context/SuppliersContext";

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
  const { hasPermission } = useAuth();

  const canAdd = hasPermission("Suppliers", "add");
  const canEdit = hasPermission("Suppliers", "edit");
  const canDelete = hasPermission("Suppliers", "delete");

  const {
    suppliers,
    addSupplier,
    updateSupplier,
    toggleSupplierStatus,
    deleteSupplier,
  } = useSuppliers();

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

  const [formData, setFormData] =
    useState(emptyForm);

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch =
      searchValue.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const matchesSearch =
        normalizedSearch === "" ||
        [
          supplier.id,
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

  const openAddModal = () => {
    if (!canAdd) {
      alert("You do not have permission to add suppliers.");
      return;
    }

    setEditingSupplierId(null);
    setFormData(emptyForm);
    setShowSupplierModal(true);
  };

  const openEditModal = (supplier) => {
    if (!canEdit) {
      alert("You do not have permission to edit suppliers.");
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

  const handleSaveSupplier = (event) => {
    event.preventDefault();

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
      alert(
        "Please complete all supplier fields."
      );
      return;
    }

    const result = editingSupplierId
      ? updateSupplier(
          editingSupplierId,
          formData
        )
      : addSupplier(formData);

    if (!result.success) {
      alert(result.message);
      return;
    }

    closeModal();
  };

  const handleDeleteSupplier = (
    supplierId
  ) => {
    if (!canDelete) {
      alert("You do not have permission to delete suppliers.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this supplier?"
    );

    if (!confirmed) {
      return;
    }

    deleteSupplier(supplierId);
    setOpenActionId(null);
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
            <h1>Suppliers</h1>

            <p>
              Manage supplier contact
              information
            </p>
          </div>

          <button
            type="button"
            className="add-supplier-button"
            onClick={openAddModal}
          >
            <FiPlus />
            Add New Supplier
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
                  {tab}
                </button>
              ))}
            </div>

            <div className="suppliers-search-box">
              <FiSearch />

              <input
                type="text"
                placeholder="Search suppliers..."
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
                  <th>Supplier</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map(
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
                                {supplier.id}
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
                            {supplier.status}
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
                              aria-label={`Edit ${supplier.name}`}
                            >
                              <FiEdit2 />
                            </button>

                            <div className="supplier-more-wrapper">
                              <button
                                type="button"
                                className="supplier-more-button"
                                onClick={() =>
                                  setOpenActionId(
                                    (
                                      currentId
                                    ) =>
                                      currentId ===
                                      supplier.id
                                        ? null
                                        : supplier.id
                                  )
                                }
                                aria-label={`More actions for ${supplier.name}`}
                              >
                                <FiMoreVertical />
                              </button>

                              {openActionId ===
                                supplier.id && (
                                <div className="supplier-action-menu">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      toggleSupplierStatus(
                                        supplier.id
                                      );
                                      setOpenActionId(
                                        null
                                      );
                                    }}
                                  >
                                    {supplier.status ===
                                    "Active" ? (
                                      <FiUserX />
                                    ) : (
                                      <FiUserCheck />
                                    )}

                                    {supplier.status ===
                                    "Active"
                                      ? "Deactivate"
                                      : "Activate"}
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
                                    Delete
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
                      No suppliers match your
                      search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="suppliers-footer">
            Showing{" "}
            {filteredSuppliers.length} of{" "}
            {suppliers.length} suppliers
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
                    ? "Edit Supplier"
                    : "Add New Supplier"}
                </h2>

                <p>
                  Enter supplier contact
                  information.
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
                Supplier Name
                <input
                  type="text"
                  name="name"
                  placeholder="Royal Glass"
                  value={formData.name}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Contact Person
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
                Phone Number
                <input
                  type="text"
                  name="phone"
                  placeholder="01012345678"
                  value={formData.phone}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  placeholder="info@supplier.com"
                  value={formData.email}
                  onChange={handleFormChange}
                />
              </label>

              <label className="supplier-full-field">
                Address
                <input
                  type="text"
                  name="address"
                  placeholder="Supplier address"
                  value={formData.address}
                  onChange={handleFormChange}
                />
              </label>

              <label className="supplier-full-field">
                Status
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </label>
            </div>

            <div className="supplier-modal-actions">
              <button
                type="button"
                className="supplier-cancel-button"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="supplier-save-button"
              >
                {editingSupplierId
                  ? "Save Changes"
                  : "Save Supplier"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
