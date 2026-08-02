import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import { supabase } from "../lib/supabase";

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
  categoryId: "",
  unit: "Piece",
  purchaseCost: "",
  supplierId: "",
  warehouseId: "",
  minimumStock: "",
  quantity: "",
  images: [],
};

export default function Items() {
  const { hasPermission } = useAuth();

  const canAdd = hasPermission("Items", "add");
  const canEdit = hasPermission("Items", "edit");
  const canDelete = hasPermission("Items", "delete");

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  const [searchValue, setSearchValue] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [showAddItem, setShowAddItem] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingInventoryId, setEditingInventoryId] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [removedImages, setRemovedImages] = useState([]);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    setLoading(true);
    setPageError("");

    try {
      const [
        itemsResult,
        categoriesResult,
        suppliersResult,
        warehousesResult,
        inventoryResult,
        imagesResult,
      ] = await Promise.all([
        supabase
          .from("items")
          .select(
            "id, item_code, name, category_id, unit, purchase_cost, primary_supplier_id, is_active"
          )
          .eq("is_active", true)
          .order("created_at", { ascending: false }),

        supabase
          .from("item_categories")
          .select("id, name")
          .order("name"),

        supabase
          .from("suppliers")
          .select("id, name, status")
          .eq("status", "Active")
          .order("name"),

        supabase
          .from("warehouses")
          .select("id, name, branch")
          .order("name"),

        supabase
          .from("warehouse_inventory")
          .select(
            "id, warehouse_id, item_id, available_quantity, reserved_quantity, damaged_quantity, missing_quantity, minimum_stock"
          ),

        supabase
          .from("item_images")
          .select("id, item_id, file_path, is_primary")
          .order("is_primary", { ascending: false }),
      ]);

      const firstError = [
        itemsResult.error,
        categoriesResult.error,
        suppliersResult.error,
        warehousesResult.error,
        inventoryResult.error,
        imagesResult.error,
      ].find(Boolean);

      if (firstError) {
        throw firstError;
      }

      const categoryMap = new Map(
        (categoriesResult.data ?? []).map((category) => [
          category.id,
          category.name,
        ])
      );

      const supplierMap = new Map(
        (suppliersResult.data ?? []).map((supplier) => [
          supplier.id,
          supplier.name,
        ])
      );

      const warehouseMap = new Map(
        (warehousesResult.data ?? []).map((warehouse) => [
          warehouse.id,
          warehouse,
        ])
      );

      const inventoryByItem = new Map();
      (inventoryResult.data ?? []).forEach((inventory) => {
        if (!inventoryByItem.has(inventory.item_id)) {
          inventoryByItem.set(inventory.item_id, inventory);
        }
      });

      const imagesByItem = new Map();
      (imagesResult.data ?? []).forEach((image) => {
        const currentImages = imagesByItem.get(image.item_id) ?? [];
        currentImages.push(image);
        imagesByItem.set(image.item_id, currentImages);
      });

      const signedImageMap = new Map();

      await Promise.all(
        (imagesResult.data ?? []).map(async (image) => {
          const { data, error } = await supabase.storage
            .from("item-images")
            .createSignedUrl(image.file_path, 60 * 60);

          if (!error && data?.signedUrl) {
            signedImageMap.set(image.id, data.signedUrl);
          }
        })
      );

      const normalizedItems = (itemsResult.data ?? []).map((item) => {
        const inventory = inventoryByItem.get(item.id);
        const warehouse = inventory
          ? warehouseMap.get(inventory.warehouse_id)
          : null;

        const itemImages = (imagesByItem.get(item.id) ?? []).map((image) => ({
          id: image.id,
          filePath: image.file_path,
          isPrimary: image.is_primary,
          preview: signedImageMap.get(image.id) ?? "",
          isExisting: true,
        }));

        return {
          id: item.id,
          itemCode: item.item_code,
          name: item.name,
          categoryId: item.category_id,
          category: categoryMap.get(item.category_id) ?? "—",
          unit: item.unit,
          purchaseCost: Number(item.purchase_cost ?? 0),
          supplierId: item.primary_supplier_id,
          supplier: supplierMap.get(item.primary_supplier_id) ?? "—",
          inventoryId: inventory?.id ?? null,
          warehouseId: inventory?.warehouse_id ?? null,
          warehouse: warehouse?.name ?? "—",
          available: Number(inventory?.available_quantity ?? 0),
          reservedQuantity: Number(inventory?.reserved_quantity ?? 0),
          damaged: Number(inventory?.damaged_quantity ?? 0),
          missing: Number(inventory?.missing_quantity ?? 0),
          minimumStock: Number(inventory?.minimum_stock ?? 0),
          images: itemImages,
        };
      });

      setCategories(categoriesResult.data ?? []);
      setSuppliers(suppliersResult.data ?? []);
      setWarehouses(warehousesResult.data ?? []);
      setItems(normalizedItems);
    } catch (error) {
      console.error("Items loading error:", error);
      setPageError(error.message || "Unable to load items.");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        search === "" ||
        [
          item.itemCode,
          item.name,
          item.category,
          item.warehouse,
          item.supplier,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(search)
        );

      const matchesWarehouse =
        selectedWarehouse === "all" ||
        String(item.warehouseId) === selectedWarehouse;

      return matchesSearch && matchesWarehouse;
    });
  }, [items, searchValue, selectedWarehouse]);

  const totalAvailableItems = useMemo(
    () =>
      items.reduce(
        (total, item) => total + Number(item.available || 0),
        0
      ),
    [items]
  );

  const totalReservedItems = useMemo(
    () =>
      items.reduce(
        (total, item) => total + Number(item.reservedQuantity || 0),
        0
      ),
    [items]
  );

  const lowStockItems = useMemo(
    () =>
      items.filter(
        (item) =>
          Number(item.available || 0) <= Number(item.minimumStock || 0)
      ).length,
    [items]
  );

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const openCategoryModal = () => {
    setCategoryName("");
    setShowAddCategory(true);
  };

  const closeCategoryModal = () => {
    if (savingCategory) return;

    setShowAddCategory(false);
    setCategoryName("");
  };

  const handleCreateCategory = async (event) => {
    event.preventDefault();

    const normalizedName = categoryName.trim();

    if (!normalizedName) {
      alert("Please enter a category name.");
      return;
    }

    const duplicateCategory = categories.some(
      (category) =>
        category.name.trim().toLowerCase() ===
        normalizedName.toLowerCase()
    );

    if (duplicateCategory) {
      alert("This category already exists.");
      return;
    }

    try {
      setSavingCategory(true);

      const { data, error } = await supabase
        .from("item_categories")
        .insert({
          name: normalizedName,
        })
        .select("id, name")
        .single();

      if (error) {
        throw error;
      }

      setCategories((currentCategories) =>
        [...currentCategories, data].sort((first, second) =>
          first.name.localeCompare(second.name)
        )
      );

      setFormData((current) => ({
        ...current,
        categoryId: String(data.id),
      }));

      setShowAddCategory(false);
      setCategoryName("");
    } catch (error) {
      console.error("Create category error:", error);

      alert(
        error.message ||
          "Unable to create the category."
      );
    } finally {
      setSavingCategory(false);
    }
  };

  const handleImagesChange = (event) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    const newImages = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isExisting: false,
    }));

    setFormData((current) => ({
      ...current,
      images: [...current.images, ...newImages].slice(0, 4),
    }));

    event.target.value = "";
  };

  const removeImage = (imageIndex) => {
    setFormData((current) => {
      const imageToRemove = current.images[imageIndex];

      if (imageToRemove?.isExisting) {
        setRemovedImages((existing) => [...existing, imageToRemove]);
      } else if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      return {
        ...current,
        images: current.images.filter((_, index) => index !== imageIndex),
      };
    });
  };

  const clearNewImagePreviews = (images = formData.images) => {
    images.forEach((image) => {
      if (!image.isExisting && image.preview) {
        URL.revokeObjectURL(image.preview);
      }
    });
  };

  const resetForm = () => {
    clearNewImagePreviews();
    setFormData(emptyForm);
    setRemovedImages([]);
  };

  const closeModal = () => {
    if (saving) return;

    setShowAddItem(false);
    setEditingItemId(null);
    setEditingInventoryId(null);
    setOpenActionMenuId(null);
    resetForm();
  };

  const openAddModal = () => {
    if (!canAdd) {
      alert("You do not have permission to add items.");
      return;
    }

    setEditingItemId(null);
    setEditingInventoryId(null);
    setOpenActionMenuId(null);
    setRemovedImages([]);

    setFormData({
      ...emptyForm,
      warehouseId: warehouses[0]?.id ? String(warehouses[0].id) : "",
    });

    setShowAddItem(true);
  };

  const openEditModal = (item) => {
    if (!canEdit) {
      alert("You do not have permission to edit items.");
      return;
    }

    setEditingItemId(item.id);
    setEditingInventoryId(item.inventoryId);
    setOpenActionMenuId(null);
    setRemovedImages([]);

    setFormData({
      itemCode: item.itemCode ?? "",
      name: item.name ?? "",
      categoryId: item.categoryId ? String(item.categoryId) : "",
      unit: item.unit ?? "Piece",
      purchaseCost: item.purchaseCost ?? "",
      supplierId: item.supplierId ? String(item.supplierId) : "",
      warehouseId: item.warehouseId ? String(item.warehouseId) : "",
      minimumStock: item.minimumStock ?? "",
      quantity: item.available ?? "",
      images: item.images ?? [],
    });

    setShowAddItem(true);
  };

  const uploadNewImages = async (itemId, images) => {
    const newImages = images.filter((image) => !image.isExisting && image.file);
    const uploadedPaths = [];

    for (let index = 0; index < newImages.length; index += 1) {
      const image = newImages[index];
      const extension = image.file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeName = `${crypto.randomUUID()}.${extension}`;
      const filePath = `${itemId}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("item-images")
        .upload(filePath, image.file, {
          cacheControl: "3600",
          upsert: false,
          contentType: image.file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      uploadedPaths.push(filePath);

      const { error: imageRowError } = await supabase
        .from("item_images")
        .insert({
          item_id: itemId,
          file_path: filePath,
          is_primary:
            images.filter((current) => current.isExisting).length === 0 &&
            index === 0,
        });

      if (imageRowError) {
        throw imageRowError;
      }
    }

    return uploadedPaths;
  };

  const deleteRemovedImages = async () => {
    if (removedImages.length === 0) return;

    const imageIds = removedImages.map((image) => image.id).filter(Boolean);
    const filePaths = removedImages
      .map((image) => image.filePath)
      .filter(Boolean);

    if (filePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("item-images")
        .remove(filePaths);

      if (storageError) {
        throw storageError;
      }
    }

    if (imageIds.length > 0) {
      const { error: rowsError } = await supabase
        .from("item_images")
        .delete()
        .in("id", imageIds);

      if (rowsError) {
        throw rowsError;
      }
    }
  };

  const handleSaveItem = async (event) => {
    event.preventDefault();

    const requiredFields = [
      "itemCode",
      "name",
      "categoryId",
      "unit",
      "purchaseCost",
      "supplierId",
      "warehouseId",
      "minimumStock",
      "quantity",
    ];

    const hasEmptyField = requiredFields.some(
      (field) => String(formData[field] ?? "").trim() === ""
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
      alert("Cost, stock and quantity values cannot be negative.");
      return;
    }

    const normalizedCode = formData.itemCode.trim().toUpperCase();

    const duplicateCode = items.some(
      (item) =>
        item.id !== editingItemId &&
        item.itemCode.toLowerCase() === normalizedCode.toLowerCase()
    );

    if (duplicateCode) {
      alert("This item code already exists.");
      return;
    }

    setSaving(true);

    let createdItemId = null;
    let uploadedPaths = [];

    try {
      if (editingItemId) {
        const { error: itemError } = await supabase
          .from("items")
          .update({
            item_code: normalizedCode,
            name: formData.name.trim(),
            category_id: Number(formData.categoryId),
            unit: formData.unit,
            purchase_cost: Number(formData.purchaseCost),
            primary_supplier_id: Number(formData.supplierId),
          })
          .eq("id", editingItemId);

        if (itemError) throw itemError;

        if (editingInventoryId) {
          const { error: inventoryError } = await supabase
            .from("warehouse_inventory")
            .update({
              warehouse_id: Number(formData.warehouseId),
              available_quantity: Number(formData.quantity),
              minimum_stock: Number(formData.minimumStock),
            })
            .eq("id", editingInventoryId);

          if (inventoryError) throw inventoryError;
        } else {
          const { error: inventoryError } = await supabase
            .from("warehouse_inventory")
            .insert({
              warehouse_id: Number(formData.warehouseId),
              item_id: editingItemId,
              available_quantity: Number(formData.quantity),
              minimum_stock: Number(formData.minimumStock),
            });

          if (inventoryError) throw inventoryError;
        }

        await deleteRemovedImages();
        uploadedPaths = await uploadNewImages(editingItemId, formData.images);
      } else {
        const { data: createdItem, error: itemError } = await supabase
          .from("items")
          .insert({
            item_code: normalizedCode,
            name: formData.name.trim(),
            category_id: Number(formData.categoryId),
            unit: formData.unit,
            purchase_cost: Number(formData.purchaseCost),
            primary_supplier_id: Number(formData.supplierId),
            is_active: true,
          })
          .select("id")
          .single();

        if (itemError) throw itemError;

        createdItemId = createdItem.id;

        const { error: inventoryError } = await supabase
          .from("warehouse_inventory")
          .insert({
            warehouse_id: Number(formData.warehouseId),
            item_id: createdItemId,
            available_quantity: Number(formData.quantity),
            reserved_quantity: 0,
            damaged_quantity: 0,
            missing_quantity: 0,
            minimum_stock: Number(formData.minimumStock),
          });

        if (inventoryError) throw inventoryError;

        uploadedPaths = await uploadNewImages(createdItemId, formData.images);
      }

      clearNewImagePreviews();
      setShowAddItem(false);
      setEditingItemId(null);
      setEditingInventoryId(null);
      setFormData(emptyForm);
      setRemovedImages([]);

      await loadPageData();
    } catch (error) {
      console.error("Save item error:", error);

      if (uploadedPaths.length > 0) {
        await supabase.storage.from("item-images").remove(uploadedPaths);
      }

      if (createdItemId) {
        await supabase.from("items").delete().eq("id", createdItemId);
      }

      alert(error.message || "Unable to save the item.");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (item) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${item.name}?`
    );

    if (!confirmed) return;

    try {
      const filePaths = (item.images ?? [])
        .map((image) => image.filePath)
        .filter(Boolean);

      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("item-images")
          .remove(filePaths);

        if (storageError) throw storageError;
      }

      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      setOpenActionMenuId(null);
      await loadPageData();
    } catch (error) {
      console.error("Delete item error:", error);
      alert(
        error.message ||
          "Unable to delete this item. It may be used in another record."
      );
    }
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
            disabled={loading}
          >
            <FiPlus />
            Add New Item
          </button>
        </section>

        <section className="items-stats">
          <ItemStatCard
            icon={<FiBox />}
            title="Total Items"
            value={items.length}
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
            value={totalReservedItems}
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
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </div>

            <select
              className="items-warehouse-filter"
              value={selectedWarehouse}
              onChange={(event) => setSelectedWarehouse(event.target.value)}
            >
              <option value="all">All Warehouses</option>

              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={String(warehouse.id)}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          {pageError && <p className="items-empty-state">{pageError}</p>}

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
                {loading ? (
                  <tr>
                    <td colSpan="8" className="items-empty-state">
                      Loading items...
                    </td>
                  </tr>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input type="checkbox" />
                      </td>

                      <td>
                        <div className="item-name-cell">
                          <div className="item-image-placeholder">
                            {item.images?.[0]?.preview ? (
                              <img src={item.images[0].preview} alt={item.name} />
                            ) : (
                              <FiBox />
                            )}
                          </div>

                          <div>
                            <strong>{item.name}</strong>
                            <span>{item.itemCode}</span>
                          </div>
                        </div>
                      </td>

                      <td>{item.category}</td>
                      <td>{item.unit}</td>
                      <td>{item.warehouse}</td>

                      <td
                        className={
                          Number(item.available) <= Number(item.minimumStock)
                            ? "low-stock-available"
                            : "available-value"
                        }
                      >
                        {Number(item.available).toLocaleString()}
                      </td>

                      <td
                        className={
                          Number(item.available) <= Number(item.minimumStock)
                            ? "low-stock-value"
                            : ""
                        }
                      >
                        {Number(item.minimumStock).toLocaleString()}
                      </td>

                      <td>
                        <div className="item-actions">
                          <button
                            type="button"
                            aria-label={`Edit ${item.name}`}
                            onClick={() => openEditModal(item)}
                          >
                            <FiEdit2 />
                          </button>

                          <div className="item-more-wrapper">
                            <button
                              type="button"
                              className="item-more-button"
                              aria-label={`More actions for ${item.name}`}
                              onClick={() =>
                                setOpenActionMenuId((currentId) =>
                                  currentId === item.id ? null : item.id
                                )
                              }
                            >
                              <FiMoreVertical />
                            </button>

                            {openActionMenuId === item.id && (
                              <div className="item-action-menu">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(item)}
                                >
                                  <FiEdit2 />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="delete-action"
                                  onClick={() => deleteItem(item)}
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
                    <td colSpan="8" className="items-empty-state">
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
        <div className="item-modal-overlay" onMouseDown={closeModal}>
          <form
            className="item-modal item-master-modal"
            onSubmit={handleSaveItem}
            onMouseDown={(event) => event.stopPropagation()}
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

              <button type="button" onClick={closeModal} disabled={saving}>
                <FiX />
              </button>
            </div>

            <div className="item-form-section">
              <div className="item-section-heading">
                <span>1</span>
                <div>
                  <h3>Item Master</h3>
                  <p>Add the basic item information.</p>
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
                    disabled={saving}
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
                    disabled={saving}
                  />
                </label>

                <label>
                  Category

                  <div className="item-category-field">
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleFormChange}
                      disabled={saving}
                    >
                      <option value="">Select category</option>

                      {categories.map((category) => (
                        <option
                          key={category.id}
                          value={String(category.id)}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="item-add-category-button"
                      onClick={openCategoryModal}
                      disabled={saving}
                    >
                      <FiPlus />
                      Add Category
                    </button>
                  </div>
                </label>

                <label>
                  Unit
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleFormChange}
                    disabled={saving}
                  >
                    <option value="Piece">Piece</option>
                    <option value="Set">Set</option>
                    <option value="Box">Box</option>
                    <option value="Pack">Pack</option>
                    <option value="Dozen">Dozen</option>
                    <option value="Kilogram">Kilogram</option>
                    <option value="Liter">Liter</option>
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
                    disabled={saving}
                  />
                </label>

                <label>
                  Supplier
                  <select
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleFormChange}
                    disabled={saving}
                  >
                    <option value="">Select supplier</option>

                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={String(supplier.id)}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Location / Warehouse
                  <select
                    name="warehouseId"
                    value={formData.warehouseId}
                    onChange={handleFormChange}
                    disabled={saving}
                  >
                    <option value="">Select warehouse</option>

                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={String(warehouse.id)}>
                        {warehouse.name}
                      </option>
                    ))}
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
                    disabled={saving}
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
                    disabled={saving}
                  />
                </label>
              </div>
            </div>

            <div className="item-form-section">
              <div className="item-section-heading">
                <span>2</span>
                <div>
                  <h3>Pictures for Item</h3>
                  <p>Upload item pictures.</p>
                </div>
              </div>

              <div className="item-images-area">
                <label className="item-upload-box">
                  <FiImage />
                  <strong>Upload Pictures</strong>
                  <small>PNG, JPG or WEBP</small>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={handleImagesChange}
                    disabled={saving || formData.images.length >= 4}
                  />
                </label>

                {formData.images.length > 0 && (
                  <div className="item-image-previews">
                    {formData.images.map((image, index) => (
                      <div
                        className="item-image-preview"
                        key={
                          image.id ??
                          `${image.file?.name ?? "image"}-${index}`
                        }
                      >
                        <img
                          src={image.preview}
                          alt={`Item preview ${index + 1}`}
                        />

                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          disabled={saving}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="item-modal-actions">
              <button
                type="button"
                className="item-cancel-button"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="item-save-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingItemId
                  ? "Update Item"
                  : "Save Item"}
              </button>
            </div>
          </form>
        </div>
      )}
      {showAddCategory && (
        <div
          className="item-category-modal-overlay"
          onMouseDown={closeCategoryModal}
        >
          <form
            className="item-category-modal"
            onSubmit={handleCreateCategory}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal-header">
              <div>
                <h2>Add New Category</h2>
                <p>
                  Create a category and select it automatically.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCategoryModal}
                disabled={savingCategory}
                aria-label="Close category form"
              >
                <FiX />
              </button>
            </div>

            <label className="item-category-name-field">
              Category Name

              <input
                type="text"
                value={categoryName}
                onChange={(event) =>
                  setCategoryName(event.target.value)
                }
                placeholder="Example: Plates"
                autoFocus
                disabled={savingCategory}
              />
            </label>

            <div className="item-category-modal-actions">
              <button
                type="button"
                className="item-category-cancel-button"
                onClick={closeCategoryModal}
                disabled={savingCategory}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="item-category-save-button"
                disabled={savingCategory}
              >
                {savingCategory
                  ? "Saving..."
                  : "Save Category"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ItemStatCard({ icon, title, value, subtitle }) {
  return (
    <article className="item-stat-card">
      <div className="item-stat-content">
        <div className="item-stat-icon">{icon}</div>

        <div>
          <h4>{title}</h4>
          <h2>{Number(value).toLocaleString()}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
    </article>
  );
}