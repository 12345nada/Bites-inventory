import {
  useMemo,
  useState,
} from "react";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import {
  useSuppliers,
} from "../context/SuppliersContext";

import "../styles/dashboard.css";
import "../styles/Suppliers.css";

import {
  FiUsers,
  FiCalendar,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiMoreVertical,
  FiList,
  FiX,
} from "react-icons/fi";

const tabs = [
  "All Suppliers",
  "Active",
  "Inactive",
  "Blacklisted",
];

const emptyForm = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  branch: "Cairo",
  status: "Active",
};

export default function Suppliers() {
  const {
    suppliers,
    addSupplier,
    deleteSupplier,
    updateSupplier,
  } = useSuppliers();

  const [searchValue, setSearchValue] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("All Suppliers");

  const [
    selectedBranch,
    setSelectedBranch,
  ] = useState("All Branches");

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
          supplier.branch,
          supplier.status,
        ].some((value) =>
          String(value)
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesTab =
        activeTab === "All Suppliers" ||
        supplier.status === activeTab;

      const matchesBranch =
        selectedBranch === "All Branches" ||
        supplier.branch === selectedBranch;

      return (
        matchesSearch &&
        matchesTab &&
        matchesBranch
      );
    });
  }, [
    suppliers,
    searchValue,
    activeTab,
    selectedBranch,
  ]);

  const activeSuppliers =
    suppliers.filter(
      (supplier) =>
        supplier.status === "Active"
    ).length;

  const inactiveSuppliers =
    suppliers.filter(
      (supplier) =>
        supplier.status === "Inactive"
    ).length;

  const blacklistedSuppliers =
    suppliers.filter(
      (supplier) =>
        supplier.status === "Blacklisted"
    ).length;

  const newSuppliers = Math.min(
    suppliers.length,
    12
  );

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
    setEditingSupplierId(null);
    setFormData(emptyForm);
    setShowSupplierModal(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplierId(supplier.id);

    setFormData({
      name: supplier.name,
      contactPerson:
        supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      branch: supplier.branch,
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

    if (editingSupplierId) {
      updateSupplier(
        editingSupplierId,
        formData
      );
    } else {
      addSupplier(formData);
    }

    closeModal();
  };

  const handleDeleteSupplier = (
    supplierId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this supplier?"
    );

    if (!confirmed) {
      return;
    }

    deleteSupplier(supplierId);
    setOpenActionId(null);
  };

  const getStatusClass = (status) => {
    return status
      .toLowerCase()
      .replace(/\s+/g, "-");
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
              Manage all your suppliers
            </p>
          </div>

          <button
            type="button"
            className="add-supplier-button"
            onClick={openAddModal}
          >
            <FiPlus />

            <span>Add New Supplier</span>
          </button>
        </section>

        <section className="suppliers-stats">
          <SupplierStatCard
            icon={<FiUsers />}
            title="Total Suppliers"
            value={suppliers.length}
            subtitle="All suppliers"
          />

          <SupplierStatCard
            icon={<FiUsers />}
            title="Active Suppliers"
            value={activeSuppliers}
            subtitle="Active now"
          />

          <SupplierStatCard
            icon={<FiUsers />}
            title="Inactive Suppliers"
            value={inactiveSuppliers}
            subtitle="Inactive now"
          />

          <SupplierStatCard
            icon={<FiUsers />}
            title="New Suppliers"
            value={newSuppliers}
            subtitle="This month"
          />

          <SupplierStatCard
            icon={<FiCalendar />}
            title="Blacklisted Suppliers"
            value={blacklistedSuppliers}
            subtitle="Blacklisted"
          />
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

            <div className="suppliers-filters">
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

              <select
                value={selectedBranch}
                onChange={(event) =>
                  setSelectedBranch(
                    event.target.value
                  )
                }
              >
                <option>
                  All Branches
                </option>

                <option value="Cairo">
                  Cairo
                </option>

                <option value="Alex">
                  Alex
                </option>
              </select>

              <button
                type="button"
                className="suppliers-view-button"
              >
                <FiList />
              </button>
            </div>
          </div>

          <div className="suppliers-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Select all suppliers"
                    />
                  </th>

                  <th>Supplier Name</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.length >
                0 ? (
                  filteredSuppliers.map(
                    (supplier) => (
                      <tr
                        key={supplier.id}
                      >
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Select ${supplier.name}`}
                          />
                        </td>

                        <td>
                          <div className="supplier-name-cell">
                            <div className="supplier-icon">
                              <FiUsers />
                            </div>

                            <div>
                              <strong>
                                {
                                  supplier.name
                                }
                              </strong>

                              <span>
                                {
                                  supplier.id
                                }
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
                            className={`supplier-status ${getStatusClass(
                              supplier.status
                            )}`}
                          >
                            {
                              supplier.status
                            }
                          </span>
                        </td>

                        <td className="supplier-action-cell">
                          <div className="supplier-actions">
                            <button
                              type="button"
                              className="supplier-edit-button"
                              onClick={() =>
                                openEditModal(
                                  supplier
                                )
                              }
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
                              >
                                <FiMoreVertical />
                              </button>

                              {openActionId ===
                                supplier.id && (
                                <div className="supplier-action-menu">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditModal(
                                        supplier
                                      )
                                    }
                                  >
                                    Edit
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
                      colSpan="8"
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

          <div className="suppliers-pagination">
            <p>
              Showing{" "}
              {filteredSuppliers.length} of{" "}
              {suppliers.length} suppliers
            </p>

            <div>
              <button type="button">
                ‹
              </button>

              <button
                type="button"
                className="active"
              >
                1
              </button>

              <button type="button">
                2
              </button>

              <button type="button">
                3
              </button>

              <button type="button">
                ...
              </button>

              <button type="button">
                22
              </button>

              <button type="button">
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
                    ? "Edit Supplier"
                    : "Add New Supplier"}
                </h2>

                <p>
                  Enter the supplier
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
                  value={formData.name}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Contact Person

                <input
                  type="text"
                  name="contactPerson"
                  value={
                    formData.contactPerson
                  }
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Phone

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Email

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                />
              </label>

              <label className="supplier-full-field">
                Address

                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Branch

                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleFormChange}
                >
                  <option value="Cairo">
                    Cairo
                  </option>

                  <option value="Alex">
                    Alex
                  </option>
                </select>
              </label>

              <label>
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

                  <option value="Blacklisted">
                    Blacklisted
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

function SupplierStatCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <article className="supplier-stat-card">
      <div className="supplier-stat-content">
        <div className="supplier-stat-icon">
          {icon}
        </div>

        <div>
          <h4>{title}</h4>
          <h2>{value}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
    </article>
  );
}
