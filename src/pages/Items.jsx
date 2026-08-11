import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";


import { useDialog } from "../context/DialogContext";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import { supabase } from "../lib/supabase";
import {
  compressImage,
} from "../utils/imageCompression";

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
  itemType: "Reusable",
  purchaseCost: "",
  supplierId: "",
  warehouseId: "",
  minimumStock: "",
  quantity: "",
  images: [],
};

export default function Items() {
  const { showAlert, showConfirm } = useDialog();


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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [showAddItem, setShowAddItem] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingInventoryId, setEditingInventoryId] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const [removedImages, setRemovedImages] = useState([]);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    if (openActionMenuId === null) {
      return undefined;
    }

    const closeActionMenu = (event) => {
      if (
        event?.target instanceof Element &&
        event.target.closest(".item-more-wrapper")
      ) {
        return;
      }

      setOpenActionMenuId(null);
    };

    const closeOnPageMove = () => {
      setOpenActionMenuId(null);
    };

    document.addEventListener("mousedown", closeActionMenu);
    window.addEventListener("scroll", closeOnPageMove, true);
    window.addEventListener("resize", closeOnPageMove);

    return () => {
      document.removeEventListener("mousedown", closeActionMenu);
      window.removeEventListener("scroll", closeOnPageMove, true);
      window.removeEventListener("resize", closeOnPageMove);
    };
  }, [openActionMenuId]);

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
            "id, item_code, name, category_id, unit, item_type, purchase_cost, primary_supplier_id, is_active"
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
          .select("id, name, branch, total_capacity")
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

      const inventoriesByItem = new Map();
      (inventoryResult.data ?? []).forEach((inventory) => {
        const currentInventories =
          inventoriesByItem.get(inventory.item_id) ?? [];

        currentInventories.push(inventory);
        inventoriesByItem.set(
          inventory.item_id,
          currentInventories
        );
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

      const normalizedItems = (itemsResult.data ?? []).flatMap((item) => {
        const itemInventories =
          inventoriesByItem.get(item.id) ?? [];

        const itemImages = (imagesByItem.get(item.id) ?? []).map((image) => ({
          id: image.id,
          filePath: image.file_path,
          isPrimary: image.is_primary,
          preview: signedImageMap.get(image.id) ?? "",
          isExisting: true,
        }));

        const inventoriesToDisplay =
          itemInventories.length > 0
            ? itemInventories
            : [null];

        return inventoriesToDisplay.map((inventory) => {
          const warehouse = inventory
            ? warehouseMap.get(inventory.warehouse_id)
            : null;

          return {
            id: item.id,
            rowKey: `${item.id}-${inventory?.id ?? "no-inventory"}`,
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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / itemsPerPage)
  );

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;

    return filteredItems.slice(
      startIndex,
      startIndex + itemsPerPage
    );
  }, [filteredItems, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    setOpenActionMenuId(null);
  }, [searchValue, selectedWarehouse]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totalItems = useMemo(
    () => new Set(items.map((item) => item.id)).size,
    [items]
  );

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

  const toggleActionMenu = (event, itemId) => {
    event.stopPropagation();

    if (openActionMenuId === itemId) {
      setOpenActionMenuId(null);
      return;
    }

    const buttonRect =
      event.currentTarget.getBoundingClientRect();

    const menuWidth = 132;
    const menuHeight = 92;
    const gap = 10;

    const availableSpaceBelow =
      window.innerHeight - buttonRect.bottom;

    const top =
      availableSpaceBelow >= menuHeight + gap
        ? buttonRect.bottom + gap
        : buttonRect.top - menuHeight - gap;

    const preferredLeft =
      buttonRect.right - menuWidth;

    const left = Math.max(
      12,
      Math.min(
        preferredLeft,
        window.innerWidth - menuWidth - 12
      )
    );

    setActionMenuPosition({
      top: Math.max(12, top),
      left,
    });

    setOpenActionMenuId(itemId);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const openCategoryModal = async () => {
    if (
      !canAdd &&
      !canEdit &&
      !canDelete
    ) {
      await showAlert({
        title: "Permission Denied",
        message:
          "You do not have permission to manage item categories.",
        type: "warning",
      });

      return;
    }

    setEditingCategoryId(null);
    setCategoryName("");
    setShowAddCategory(true);
  };

  const closeCategoryModal = () => {
    if (savingCategory) return;

    setShowAddCategory(false);
    setEditingCategoryId(null);
    setCategoryName("");
  };

  const startEditCategory = async (category) => {
    if (!canEdit) {
      await showAlert({
        title: "Permission Denied",
        message:
          "You do not have permission to edit item categories.",
        type: "warning",
      });

      return;
    }

    setEditingCategoryId(category.id);
    setCategoryName(category.name);
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setCategoryName("");
  };

  const handleSaveCategory = async (event) => {
    event.preventDefault();

    const requiredPermission =
      editingCategoryId
        ? canEdit
        : canAdd;

    if (!requiredPermission) {
      await showAlert({
        title: "Permission Denied",
        message: editingCategoryId
          ? "You do not have permission to edit item categories."
          : "You do not have permission to add item categories.",
        type: "warning",
      });

      return;
    }

    const normalizedName = categoryName.trim();

    if (!normalizedName) {
      showAlert({
        message: "Please enter a category name.",
      });
      return;
    }

    const duplicateCategory = categories.some(
      (category) =>
        category.id !== editingCategoryId &&
        category.name.trim().toLowerCase() ===
          normalizedName.toLowerCase()
    );

    if (duplicateCategory) {
      showAlert({
        message: "This category already exists.",
      });
      return;
    }

    try {
      setSavingCategory(true);

      if (editingCategoryId) {
        const { data, error } = await supabase
          .from("item_categories")
          .update({
            name: normalizedName,
          })
          .eq("id", editingCategoryId)
          .select("id, name")
          .single();

        if (error) {
          throw error;
        }

        setCategories((currentCategories) =>
          currentCategories
            .map((category) =>
              category.id === editingCategoryId
                ? data
                : category
            )
            .sort((first, second) =>
              first.name.localeCompare(second.name)
            )
        );

        setEditingCategoryId(null);
        setCategoryName("");
      } else {
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

        setCategoryName("");
      }
    } catch (error) {
      console.error("Save category error:", error);

      showAlert({
        message:
          error.message ||
          "Unable to save the category.",
      });
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!canDelete) {
      await showAlert({
        title: "Permission Denied",
        message:
          "You do not have permission to delete item categories.",
        type: "warning",
      });

      return;
    }

    const confirmed = await showConfirm({
      message: `Are you sure you want to delete ${category.name}?`,
    });

    if (!confirmed) {
      return;
    }

    try {
      setSavingCategory(true);

      const { data, error: usageError } = await supabase
        .from("items")
        .select("id")
        .eq("category_id", category.id)
        .limit(1);

      if (usageError) {
        throw usageError;
      }

      if ((data || []).length > 0) {
        await showAlert({
          message:
            "This category is used by one or more items and cannot be deleted.",
        });
        return;
      }

      const { error: deleteError } = await supabase
        .from("item_categories")
        .delete()
        .eq("id", category.id);

      if (deleteError) {
        throw deleteError;
      }

      setCategories((currentCategories) =>
        currentCategories.filter(
          (currentCategory) =>
            currentCategory.id !== category.id
        )
      );

      setFormData((current) => ({
        ...current,
        categoryId:
          String(current.categoryId) ===
          String(category.id)
            ? ""
            : current.categoryId,
      }));

      if (editingCategoryId === category.id) {
        setEditingCategoryId(null);
        setCategoryName("");
      }
    } catch (error) {
      console.error("Delete category error:", error);

      showAlert({
        message:
          error.message ||
          "Unable to delete the category.",
      });
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
      showAlert({
        message: "You do not have permission to add items.",
      });
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
      showAlert({
        message: "You do not have permission to edit items.",
      });
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
      itemType: item.itemType ?? "Reusable",
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
      const compressedFile =
        await compressImage(image.file);
        console.log(
  "Original:",
  (image.file.size / 1024).toFixed(2),
  "KB"
);

console.log(
  "Compressed:",
  (compressedFile.size / 1024).toFixed(2),
  "KB"
);
      const safeName =
        `${crypto.randomUUID()}.webp`;
      const filePath = `${itemId}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("item-images")
        .upload(filePath, compressedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: compressedFile.type,
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

  const validateWarehouseCapacity = async () => {
    const warehouseId = Number(formData.warehouseId);
    const newAvailableQuantity = Number(formData.quantity || 0);

    const { data: warehouse, error: warehouseError } = await supabase
      .from("warehouses")
      .select("id, name, total_capacity")
      .eq("id", warehouseId)
      .single();

    if (warehouseError) {
      throw warehouseError;
    }

    const { data: inventoryRows, error: inventoryError } = await supabase
      .from("warehouse_inventory")
      .select(
        "id, available_quantity, reserved_quantity, damaged_quantity"
      )
      .eq("warehouse_id", warehouseId);

    if (inventoryError) {
      throw inventoryError;
    }

    const currentUsedCapacity = (inventoryRows || []).reduce(
      (total, row) =>
        total +
        Number(row.available_quantity || 0) +
        Number(row.reserved_quantity || 0) +
        Number(row.damaged_quantity || 0),
      0
    );

    let quantityToAdd = newAvailableQuantity;

    if (editingItemId && editingInventoryId) {
      const { data: currentInventory, error: currentInventoryError } =
        await supabase
          .from("warehouse_inventory")
          .select(
            "id, warehouse_id, available_quantity, reserved_quantity, damaged_quantity"
          )
          .eq("id", editingInventoryId)
          .single();

      if (currentInventoryError) {
        throw currentInventoryError;
      }

      if (
        Number(currentInventory.warehouse_id) === warehouseId
      ) {
        quantityToAdd =
          newAvailableQuantity -
          Number(currentInventory.available_quantity || 0);
      } else {
        quantityToAdd =
          newAvailableQuantity +
          Number(currentInventory.reserved_quantity || 0) +
          Number(currentInventory.damaged_quantity || 0);
      }
    }

    const totalCapacity = Number(warehouse.total_capacity || 0);
    const availableCapacity = Math.max(
      0,
      totalCapacity - currentUsedCapacity
    );

    if (quantityToAdd > availableCapacity) {
      await showAlert({
        title: "Warehouse Capacity Exceeded",
        message: `${warehouse.name} does not have enough available capacity. Only ${availableCapacity.toLocaleString()} items can be added.`,
        type: "warning",
      });

      return false;
    }

    return true;
  };

  const handleSaveItem = async (event) => {
    event.preventDefault();

    const requiredPermission =
      editingItemId
        ? canEdit
        : canAdd;

    if (!requiredPermission) {
      await showAlert({
        title: "Permission Denied",
        message: editingItemId
          ? "You do not have permission to edit items."
          : "You do not have permission to add items.",
        type: "warning",
      });

      return;
    }

    const requiredFields = [
      "itemCode",
      "name",
      "categoryId",
      "unit",
      "itemType",
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
      showAlert({
        message: "Please complete all item fields.",
      });
      return;
    }

    if (
      Number(formData.purchaseCost) < 0 ||
      Number(formData.minimumStock) < 0 ||
      Number(formData.quantity) < 0
    ) {
      showAlert({
        message: "Cost, stock and quantity values cannot be negative.",
      });
      return;
    }

    const normalizedCode = formData.itemCode.trim().toUpperCase();

    const duplicateCode = items.some(
      (item) =>
        item.id !== editingItemId &&
        item.itemCode.toLowerCase() === normalizedCode.toLowerCase()
    );

    if (duplicateCode) {
      showAlert({
        message: "This item code already exists.",
      });
      return;
    }

    try {
      const hasWarehouseCapacity =
        await validateWarehouseCapacity();

      if (!hasWarehouseCapacity) {
        return;
      }
    } catch (error) {
      console.error("Warehouse capacity validation error:", error);

      showAlert({
        message:
          error.message ||
          "Unable to validate warehouse capacity.",
      });
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
            item_type: formData.itemType,
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
            item_type: formData.itemType,
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

      showAlert({
        message: error.message || "Unable to save the item.",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (item) => {
    if (!canDelete) {
      await showAlert({
        title: "Permission Denied",
        message:
          "You do not have permission to delete items.",
        type: "warning",
      });

      return;
    }

    const confirmed = await showConfirm({
      message: `Are you sure you want to delete ${item.name}?`,
    });

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
      showAlert({
        message: error.message ||
          "Unable to delete this item. It may be used in another record.",
      });
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
                    <td colSpan="7" className="items-empty-state">
                      Loading items...
                    </td>
                  </tr>
                ) : filteredItems.length > 0 ? (
                  paginatedItems.map((item) => (
                    <tr key={item.rowKey}>

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
                              onClick={(event) =>
                                toggleActionMenu(event, item.rowKey)
                              }
                            >
                              <FiMoreVertical />
                            </button>

                            {openActionMenuId === item.rowKey && (
                              <div
                                className="item-action-menu"
                                style={{
                                  top: `${actionMenuPosition.top}px`,
                                  left: `${actionMenuPosition.left}px`,
                                }}
                                onMouseDown={(event) =>
                                  event.stopPropagation()
                                }
                              >
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
                    <td colSpan="7" className="items-empty-state">
                      No items match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="items-pagination">
            <p>
              Showing {paginatedItems.length} of{" "}
              {filteredItems.length} items
            </p>

            {filteredItems.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((current) =>
                      Math.max(current - 1, 1)
                    )
                  }
                  disabled={currentPage === 1}
                  aria-label="Previous page"
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
                    aria-current={
                      currentPage === pageNumber
                        ? "page"
                        : undefined
                    }
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((current) =>
                      Math.min(current + 1, totalPages)
                    )
                  }
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            )}
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
                      <FiEdit2 />
                      Manage Categories
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
                  Item Type
                  <select
                    name="itemType"
                    value={formData.itemType}
                    onChange={handleFormChange}
                    disabled={saving}
                  >
                    <option value="Reusable">Reusable</option>
                    <option value="Consumable">Consumable</option>
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
          <div
            className="item-category-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal-header">
              <div>
                <h2>Manage Categories</h2>
                <p>
                  Add, edit or delete item categories.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCategoryModal}
                disabled={savingCategory}
                aria-label="Close category manager"
              >
                <FiX />
              </button>
            </div>

            <form
              className="item-category-form"
              onSubmit={handleSaveCategory}
            >
              <label className="item-category-name-field">
                {editingCategoryId
                  ? "Edit Category"
                  : "New Category"}

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

              <div className="item-category-form-actions">
                {editingCategoryId && (
                  <button
                    type="button"
                    className="item-category-cancel-edit-button"
                    onClick={cancelEditCategory}
                    disabled={savingCategory}
                  >
                    Cancel Edit
                  </button>
                )}

                <button
                  type="submit"
                  className="item-category-save-button"
                  disabled={savingCategory}
                >
                  {savingCategory
                    ? "Saving..."
                    : editingCategoryId
                    ? "Save Changes"
                    : "Add Category"}
                </button>
              </div>
            </form>

            <div className="item-category-list">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <div
                    className="item-category-row"
                    key={category.id}
                  >
                    <span>{category.name}</span>

                    <div>
                      <button
                        type="button"
                        className="item-category-edit-button"
                        onClick={() =>
                          startEditCategory(category)
                        }
                        disabled={savingCategory}
                        aria-label={`Edit ${category.name}`}
                      >
                        <FiEdit2 />
                      </button>

                      <button
                        type="button"
                        className="item-category-delete-button"
                        onClick={() =>
                          handleDeleteCategory(category)
                        }
                        disabled={savingCategory}
                        aria-label={`Delete ${category.name}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="item-category-empty">
                  No categories found.
                </p>
              )}
            </div>

            <div className="item-category-modal-actions">
              <button
                type="button"
                className="item-category-cancel-button"
                onClick={closeCategoryModal}
                disabled={savingCategory}
              >
                Close
              </button>
            </div>
          </div>
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