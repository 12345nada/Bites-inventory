import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../styles/mobile-sidebar-offcanvas.css";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import { supabase } from "../lib/supabase";

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

const mapSupplierFromDatabase = (supplier) => ({
  id: supplier.id,
  supplierCode:
    supplier.supplier_code ||
    `SUP-${String(supplier.id).padStart(3, "0")}`,
  name: supplier.name || "",
  contactPerson: supplier.contact_person || "",
  phone: supplier.phone || "",
  email: supplier.email || "",
  address: supplier.address || "",
  status: supplier.status || "Active",
  createdAt: supplier.created_at,
  updatedAt: supplier.updated_at,
});

export default function Suppliers() {
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

  const [formData, setFormData] =
    useState(emptyForm);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from("suppliers")
        .select(`
          id,
          supplier_code,
          name,
          contact_person,
          phone,
          email,
          address,
          status,
          created_at,
          updated_at
        `)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      const formattedSuppliers = (
        data || []
      ).map(mapSupplierFromDatabase);

      setSuppliers(formattedSuppliers);
    } catch (error) {
      console.error(
        "Error loading suppliers:",
        error
      );

      alert(
        error.message ||
          "Could not load suppliers."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch =
      searchValue.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const matchesSearch =
        normalizedSearch === "" ||
        [
          supplier.supplierCode,
          supplier.name,
          supplier.contactPerson,
          supplier.phone,
          supplier.email,
          supplier.address,
          supplier.status,
        ].some((value) =>
          String(value || "")
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
    setEditingSupplierId(null);
    setFormData(emptyForm);
    setOpenActionId(null);
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

  const validateSupplierForm = () => {
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
            formData[field] || ""
          ).trim() === ""
      );

    if (hasEmptyField) {
      alert(
        "Please complete all supplier fields."
      );

      return false;
    }

    const normalizedEmail =
      formData.email.trim();

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(normalizedEmail)
    ) {
      alert(
        "Please enter a valid email address."
      );

      return false;
    }

    return true;
  };

  const handleSaveSupplier = async (
    event
  ) => {
    event.preventDefault();

    if (!validateSupplierForm()) {
      return;
    }

    const supplierPayload = {
      name: formData.name.trim(),
      contact_person:
        formData.contactPerson.trim(),
      phone: formData.phone.trim(),
      email:
        formData.email.trim().toLowerCase(),
      address: formData.address.trim(),
      status: formData.status,
    };

    try {
      setSaving(true);

      if (editingSupplierId) {
        const {
          data,
          error,
        } = await supabase
          .from("suppliers")
          .update(supplierPayload)
          .eq("id", editingSupplierId)
          .select(`
            id,
            supplier_code,
            name,
            contact_person,
            phone,
            email,
            address,
            status,
            created_at,
            updated_at
          `)
          .single();

        if (error) {
          throw error;
        }

        const updatedSupplier =
          mapSupplierFromDatabase(data);

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
        const {
          data,
          error,
        } = await supabase
          .from("suppliers")
          .insert(supplierPayload)
          .select(`
            id,
            supplier_code,
            name,
            contact_person,
            phone,
            email,
            address,
            status,
            created_at,
            updated_at
          `)
          .single();

        if (error) {
          throw error;
        }

        const newSupplier =
          mapSupplierFromDatabase(data);

        setSuppliers(
          (currentSuppliers) => [
            newSupplier,
            ...currentSuppliers,
          ]
        );
      }

      setShowSupplierModal(false);
      setEditingSupplierId(null);
      setFormData(emptyForm);
    } catch (error) {
      console.error(
        "Error saving supplier:",
        error
      );

      if (error.code === "23505") {
        alert(
          "A supplier with this name or email already exists."
        );
      } else {
        alert(
          error.message ||
            "Could not save supplier."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSupplierStatus =
    async (supplier) => {
      const newStatus =
        supplier.status === "Active"
          ? "Inactive"
          : "Active";

      try {
        const {
          data,
          error,
        } = await supabase
          .from("suppliers")
          .update({
            status: newStatus,
          })
          .eq("id", supplier.id)
          .select(`
            id,
            supplier_code,
            name,
            contact_person,
            phone,
            email,
            address,
            status,
            created_at,
            updated_at
          `)
          .single();

        if (error) {
          throw error;
        }

        const updatedSupplier =
          mapSupplierFromDatabase(data);

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

        alert(
          error.message ||
            "Could not update supplier status."
        );
      }
    };

  const handleDeleteSupplier = async (
    supplierId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this supplier?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const {
        error,
      } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", supplierId);

      if (error) {
        throw error;
      }

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

      if (error.code === "23503") {
        alert(
          "This supplier cannot be deleted because it is connected to items or purchase orders. You can deactivate it instead."
        );
      } else {
        alert(
          error.message ||
            "Could not delete supplier."
        );
      }
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
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="suppliers-empty-state"
                    >
                      Loading suppliers...
                    </td>
                  </tr>
                ) : filteredSuppliers.length >
                  0 ? (
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
                                {
                                  supplier.supplierCode
                                }
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {supplier.contactPerson ||
                            "-"}
                        </td>

                        <td>
                          {supplier.phone || "-"}
                        </td>

                        <td>
                          {supplier.email || "-"}
                        </td>

                        <td>
                          {supplier.address || "-"}
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
                disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
                />
              </label>

              <label className="supplier-full-field">
                Status
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  disabled={saving}
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
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="supplier-save-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingSupplierId
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