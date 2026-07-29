import { useMemo, useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import { useItems } from "../context/ItemsContext";

import "../styles/mobile-sidebar-offcanvas.css";

import "../styles/dashboard.css";
import "../styles/Items.css";


import {
  FiBox,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiSearch,
  FiPlus,
  FiEdit2,
  FiMoreVertical,
  FiX,
  FiImage,
  FiTrash2,
} from "react-icons/fi";

const emptyForm = {
  itemCode: "",
  name: "",
  category: "",
  unit: "Piece",
  purchaseCost: "",
  supplier: "",
  warehouse: "Cairo",
  minimumStock: "",
  quantity: "",
  images: [],
};

export default function Items() {
  const { items, addItem, setItems } = useItems();

  const [searchValue, setSearchValue] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] =
    useState("All Warehouses");
  const [showAddItem, setShowAddItem] =
    useState(false);
  const [formData, setFormData] =
    useState(emptyForm);
  const [editingItemId, setEditingItemId] =
    useState(null);
  const [openActionMenuId, setOpenActionMenuId] =
    useState(null);

  const filteredItems = useMemo(() => {
    const search = searchValue
      .trim()
      .toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        search === "" ||
        [
          item.id,
          item.name,
          item.category,
          item.warehouse,
        ].some((value) =>
          String(value)
            .toLowerCase()
            .includes(search)
        );

      const matchesWarehouse =
        selectedWarehouse === "All Warehouses" ||
        item.warehouse === selectedWarehouse;

      return matchesSearch && matchesWarehouse;
    });
  }, [
    items,
    searchValue,
    selectedWarehouse,
  ]);

  const totalAvailableItems = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + Number(item.available || 0),
      0
    );
  }, [items]);

  const lowStockItems = useMemo(() => {
    return items.filter(
      (item) =>
        Number(item.available || 0) <=
        Number(item.minimumStock || 0)
    ).length;
  }, [items]);

  const totalItems = items.length;
  const reservedItems = 1124;

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImagesChange = (event) => {
    const selectedFiles = Array.from(
      event.target.files
    );

    const newImages = selectedFiles.map(
      (file) => ({
        file,
        preview: URL.createObjectURL(file),
      })
    );

    setFormData((current) => ({
      ...current,
      images: [...current.images, ...newImages].slice(
        0,
        4
      ),
    }));

    event.target.value = "";
  };

  const removeImage = (imageIndex) => {
    setFormData((current) => {
      const imageToRemove =
        current.images[imageIndex];

      if (imageToRemove?.preview) {
        URL.revokeObjectURL(
          imageToRemove.preview
        );
      }

      return {
        ...current,
        images: current.images.filter(
          (_, index) => index !== imageIndex
        ),
      };
    });
  };

  const resetForm = () => {
    formData.images.forEach((image) => {
      if (image.preview) {
        URL.revokeObjectURL(image.preview);
      }
    });

    setFormData(emptyForm);
  };

  const closeModal = () => {
    setShowAddItem(false);
    setEditingItemId(null);
    setOpenActionMenuId(null);
    resetForm();
  };

  const openAddModal = () => {
    setEditingItemId(null);
    setOpenActionMenuId(null);
    setFormData(emptyForm);
    setShowAddItem(true);
  };

  const openEditModal = (item) => {
    setEditingItemId(item.id);
    setOpenActionMenuId(null);

    setFormData({
      itemCode: item.id,
      name: item.name ?? "",
      category: item.category ?? "",
      unit: item.unit ?? "Piece",
      purchaseCost: item.purchaseCost ?? "",
      supplier: item.supplier ?? "",
      warehouse: item.warehouse ?? "Cairo",
      minimumStock: item.minimumStock ?? "",
      quantity: item.available ?? "",
      images: item.images ?? [],
    });

    setShowAddItem(true);
  };

  const deleteItem = (itemId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this item?"
    );

    if (!confirmed) {
      return;
    }

    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId)
    );

    setOpenActionMenuId(null);
  };

  const handleAddItem = (event) => {
    event.preventDefault();

    const requiredFields = [
      "itemCode",
      "name",
      "category",
      "unit",
      "purchaseCost",
      "supplier",
      "warehouse",
      "minimumStock",
      "quantity",
    ];

    const hasEmptyField = requiredFields.some(
      (field) =>
        String(formData[field]).trim() === ""
    );

    if (hasEmptyField) {
      alert("Please complete all item fields.");
      return;
    }

    if (
      Number(formData.purchaseCost) < 0 ||
      Number(formData.minimumStock) < 0 ||
      Number(formData.quantity) < 0
    ) {
      alert(
        "Cost, stock and quantity values cannot be negative."
      );
      return;
    }

    if (editingItemId) {
      const normalizedCode = formData.itemCode
        .trim()
        .toUpperCase();

      const duplicateCode = items.some(
        (item) =>
          item.id !== editingItemId &&
          item.id.toLowerCase() ===
            normalizedCode.toLowerCase()
      );

      if (duplicateCode) {
        alert("This item code already exists.");
        return;
      }

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                id: normalizedCode,
                name: formData.name.trim(),
                category: formData.category,
                unit: formData.unit,
                purchaseCost: Number(
                  formData.purchaseCost
                ),
                supplier: formData.supplier.trim(),
                warehouse: formData.warehouse,
                minimumStock: Number(
                  formData.minimumStock
                ),
                available: Number(
                  formData.quantity
                ),
                images: formData.images ?? [],
              }
            : item
        )
      );
    } else {
      const result = addItem(formData);

      if (!result.success) {
        alert(result.message);
        return;
      }
    }

    closeModal();
  };

  return (
    <div className="dashboard-page">
      <Sidebar activePage="items" />

      <main className="items-main">
        <Topbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        <section className="items-title-section">
          <div className="items-title">
            <div className="items-title-icon">
              <FiBox />
            </div>

            <div>
              <h1>Item List</h1>
              <p>Manage all inventory items</p>
            </div>
          </div>

          <button
            type="button"
            className="add-item-button"
            onClick={openAddModal}
          >
            <FiPlus />
            Add New Item
          </button>
        </section>

        <section className="items-stats">
          <ItemStatCard
            icon={<FiBox />}
            title="Total Items"
            value={totalItems}
            subtitle="All inventory items"
          />

          <ItemStatCard
            icon={<FiCheckCircle />}
            title="Available Items"
            value={totalAvailableItems}
            subtitle="Available quantity"
          />

          <ItemStatCard
            icon={<FiClock />}
            title="Reserved Items"
            value={reservedItems}
            subtitle="Reserved quantity"
          />

          <ItemStatCard
            icon={<FiAlertTriangle />}
            title="Low Stock Items"
            value={lowStockItems}
            subtitle="Need restock"
          />
        </section>

        <section className="items-table-card">
          <div className="items-table-toolbar">
            <div className="items-table-search">
              <FiSearch />

              <input
                type="text"
                value={searchValue}
                placeholder="Search items..."
                onChange={(event) =>
                  setSearchValue(event.target.value)
                }
              />
            </div>

            <select
              className="items-warehouse-filter"
              value={selectedWarehouse}
              onChange={(event) =>
                setSelectedWarehouse(
                  event.target.value
                )
              }
            >
              <option>All Warehouses</option>
              <option value="Cairo">Cairo</option>
              <option value="Alex">Alex</option>
            </select>
          </div>

          <div className="items-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" />
                  </th>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Warehouse</th>
                  <th>Available</th>
                  <th>Minimum Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input type="checkbox" />
                      </td>

                      <td>
                        <div className="item-name-cell">
                          <div className="item-image-placeholder">
                            {item.images?.[0]?.preview ? (
                              <img
                                src={
                                  item.images[0]
                                    .preview
                                }
                                alt={item.name}
                              />
                            ) : (
                              <FiBox />
                            )}
                          </div>

                          <div>
                            <strong>{item.name}</strong>
                            <span>{item.id}</span>
                          </div>
                        </div>
                      </td>

                      <td>{item.category}</td>
                      <td>{item.unit}</td>
                      <td>{item.warehouse}</td>

                      <td
                        className={
                          Number(item.available) <=
                          Number(item.minimumStock)
                            ? "low-stock-available"
                            : "available-value"
                        }
                      >
                        {Number(
                          item.available
                        ).toLocaleString()}
                      </td>

                      <td
                        className={
                          Number(item.available) <=
                          Number(item.minimumStock)
                            ? "low-stock-value"
                            : ""
                        }
                      >
                        {Number(
                          item.minimumStock
                        ).toLocaleString()}
                      </td>

                      <td>
                        <div className="item-actions">
                          <button
                            type="button"
                            aria-label={`Edit ${item.name}`}
                            onClick={() =>
                              openEditModal(item)
                            }
                          >
                            <FiEdit2 />
                          </button>

                          <div className="item-more-wrapper">
                            <button
                              type="button"
                              className="item-more-button"
                              aria-label={`More actions for ${item.name}`}
                              onClick={() =>
                                setOpenActionMenuId(
                                  (currentId) =>
                                    currentId === item.id
                                      ? null
                                      : item.id
                                )
                              }
                            >
                              <FiMoreVertical />
                            </button>

                            {openActionMenuId ===
                              item.id && (
                              <div className="item-action-menu">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(item)
                                  }
                                >
                                  <FiEdit2 />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="delete-action"
                                  onClick={() =>
                                    deleteItem(item.id)
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
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="items-empty-state"
                    >
                      No items match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {showAddItem && (
        <div
          className="item-modal-overlay"
          onMouseDown={closeModal}
        >
          <form
            className="item-modal item-master-modal"
            onSubmit={handleAddItem}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="item-modal-header">
              <div>
                <h2>{editingItemId ? "Edit Item" : "Add New Item"}</h2>
                <p>
                  {editingItemId
                    ? "Update the item information."
                    : "Enter the item information."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
              >
                <FiX />
              </button>
            </div>

            <div className="item-form-section">
              <div className="item-section-heading">
                <span>1</span>
                <div>
                  <h3>Item Master</h3>
                  <p>
                    Add the basic item information.
                  </p>
                </div>
              </div>

              <div className="item-modal-grid">
                <label>
                  Item Code
                  <input
                    type="text"
                    name="itemCode"
                    placeholder="PL001"
                    value={formData.itemCode}
                    onChange={handleFormChange}
                  />
                </label>

                <label>
                  Item Name
                  <input
                    type="text"
                    name="name"
                    placeholder="Dinner Plate 28 cm"
                    value={formData.name}
                    onChange={handleFormChange}
                  />
                </label>

                <label>
                  Category
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                  >
                    <option value="">
                      Select category
                    </option>
                    <option value="Dinnerware">
                      Dinnerware
                    </option>
                    <option value="Glassware">
                      Glassware
                    </option>
                    <option value="Furniture">
                      Furniture
                    </option>
                    <option value="Equipment">
                      Equipment
                    </option>
                    <option value="Cutlery">
                      Cutlery
                    </option>
                    <option value="Linen">
                      Linen
                    </option>
                    <option value="Other">
                      Other
                    </option>
                  </select>
                </label>

                <label>
                  Unit
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleFormChange}
                  >
                    <option value="Piece">
                      Piece
                    </option>
                    <option value="Set">Set</option>
                    <option value="Box">Box</option>
                    <option value="Pack">Pack</option>
                    <option value="Dozen">
                      Dozen
                    </option>
                  </select>
                </label>

                <label>
                  Purchase Cost
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="purchaseCost"
                    placeholder="0.00"
                    value={formData.purchaseCost}
                    onChange={handleFormChange}
                  />
                </label>


                <label>
                  Supplier
                  <input
                    type="text"
                    name="supplier"
                    placeholder="Supplier name"
                    value={formData.supplier}
                    onChange={handleFormChange}
                  />
                </label>

                <label>
                  Location / Warehouse
                  <select
                    name="warehouse"
                    value={formData.warehouse}
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
                  Minimum Stock
                  <input
                    type="number"
                    min="0"
                    name="minimumStock"
                    placeholder="100"
                    value={formData.minimumStock}
                    onChange={handleFormChange}
                  />
                </label>

                

                <label>
                  Quantity
                  <input
                    type="number"
                    min="0"
                    name="quantity"
                    placeholder="Enter item quantity"
                    value={formData.quantity}
                    onChange={handleFormChange}
                  />
                </label>
              </div>
            </div>

            

            <div className="item-form-section">
              <div className="item-section-heading">
                <span>2</span>
                <div>
                  <h3>Pictures for Item</h3>
                  <p>
                    Upload item pictures.
                  </p>
                </div>
              </div>

              <div className="item-images-area">
                <label className="item-upload-box">
                  <FiImage />
                  <strong>Upload Pictures</strong>
                  <small>
                    PNG, JPG or WEBP
                  </small>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={handleImagesChange}
                  />
                </label>

                {formData.images.length > 0 && (
                  <div className="item-image-previews">
                    {formData.images.map(
                      (image, index) => (
                        <div
                          className="item-image-preview"
                          key={`${image.file.name}-${index}`}
                        >
                          <img
                            src={image.preview}
                            alt={`Item preview ${
                              index + 1
                            }`}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeImage(index)
                            }
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="item-modal-actions">
              <button
                type="button"
                className="item-cancel-button"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="item-save-button"
              >
                {editingItemId
                  ? "Update Item"
                  : "Save Item"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ItemStatCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <article className="item-stat-card">
      <div className="item-stat-content">
        <div className="item-stat-icon">
          {icon}
        </div>

        <div>
          <h4>{title}</h4>
          <h2>{Number(value).toLocaleString()}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
    </article>
  );
}