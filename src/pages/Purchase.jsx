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
  createPurchase,
  getPurchasePageData,
  receivePurchase,
  removePurchase,
  updatePurchase,
  updatePurchaseStatus,
} from "../services/purchaseService";

import "../styles/dashboard.css";
import "../styles/Purchase.css";

import {
  FiBox,
  FiClock,
  FiDollarSign,
  FiCheckCircle,
  FiPlus,
  FiSearch,
  FiCalendar,
  FiEdit2,
  FiMoreVertical,
  FiX,
  FiCheck,
  FiDownload,
  FiTrash2,
} from "react-icons/fi";

const getTodayDate = () =>
  new Date().toISOString().split("T")[0];

const createEmptyPurchaseItem = () => ({
  itemId: "",
  quantity: "",
  unitCost: "",
});

const createEmptyForm = () => ({
  supplierId: "",
  orderDate: getTodayDate(),
  expectedDate: "",
  warehouseId: "",
  items: [createEmptyPurchaseItem()],
});

export default function Purchase() {
  const { showAlert, showConfirm } = useDialog();


  const { hasPermission } = useAuth();

  const canAdd = hasPermission("Purchase", "add");
  const canEdit = hasPermission("Purchase", "edit");
  const canDelete = hasPermission("Purchase", "delete");

  const [purchases, setPurchases] =
    useState([]);

  const [suppliers, setSuppliers] =
    useState([]);

  const [warehouses, setWarehouses] =
    useState([]);

  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [searchValue, setSearchValue] =
    useState("");

  const [
    selectedWarehouse,
    setSelectedWarehouse,
  ] = useState("All Warehouses");

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("All Statuses");

  const [
    showPurchaseModal,
    setShowPurchaseModal,
  ] = useState(false);

  const [
    showReceiveModal,
    setShowReceiveModal,
  ] = useState(false);

  const [formData, setFormData] =
    useState(createEmptyForm());

  const [
    editingPurchaseId,
    setEditingPurchaseId,
  ] = useState(null);

  const [
    receivingPurchase,
    setReceivingPurchase,
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

  const purchasesPerPage = 5;

  useEffect(() => {
    loadPurchaseData();
  }, []);

  useEffect(() => {
    if (openActionId === null) {
      return undefined;
    }

    const closeActionMenu = (event) => {
      if (
        event?.target instanceof Element &&
        event.target.closest(".purchase-more-wrapper")
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

  const loadPurchaseData = async () => {
    try {
      setLoading(true);

      const data =
        await getPurchasePageData();

      setPurchases(data.purchases);
      setSuppliers(data.suppliers);
      setWarehouses(data.warehouses);
      setItems(data.items);
    } catch (error) {
      console.error(
        "Error loading purchases:",
        error
      );

      showAlert({
        message: error.message ||
          "Could not load purchase orders.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = useMemo(() => {
    const normalizedSearch =
      searchValue.trim().toLowerCase();

    return purchases.filter((purchase) => {
      const matchesSearch =
        normalizedSearch === "" ||
        [
          purchase.poNumber,
          purchase.supplier,
          purchase.itemNames?.join(" "),
          purchase.orderDate,
          purchase.expectedDate,
          purchase.warehouse,
          purchase.warehouseBranch,
          purchase.status,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesWarehouse =
        selectedWarehouse ===
          "All Warehouses" ||
        String(purchase.warehouseId) ===
          String(selectedWarehouse);

      const matchesStatus =
        selectedStatus ===
          "All Statuses" ||
        purchase.status === selectedStatus;

      return (
        matchesSearch &&
        matchesWarehouse &&
        matchesStatus
      );
    });
  }, [
    purchases,
    searchValue,
    selectedWarehouse,
    selectedStatus,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredPurchases.length /
        purchasesPerPage
    )
  );

  const paginatedPurchases = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      purchasesPerPage;

    return filteredPurchases.slice(
      startIndex,
      startIndex + purchasesPerPage
    );
  }, [
    filteredPurchases,
    currentPage,
  ]);

  useEffect(() => {
    setCurrentPage(1);
    setOpenActionId(null);
  }, [
    searchValue,
    selectedWarehouse,
    selectedStatus,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totalSpent = useMemo(
    () =>
      purchases
        .filter(
          (purchase) =>
            purchase.status ===
            "Received"
        )
        .reduce(
          (total, purchase) =>
            total +
            Number(
              purchase.totalAmount
            ),
          0
        ),
    [purchases]
  );

  const pendingOrders =
    purchases.filter(
      (purchase) =>
        purchase.status === "Pending"
    ).length;

  const receivedItems = purchases
    .filter(
      (purchase) =>
        purchase.status === "Received"
    )
    .reduce(
      (total, purchase) =>
        total +
        Number(purchase.totalQuantity || 0),
      0
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

  const handlePurchaseItemChange = (
    itemIndex,
    field,
    value
  ) => {
    setFormData((currentData) => ({
      ...currentData,
      items: currentData.items.map(
        (purchaseItem, index) => {
          if (index !== itemIndex) {
            return purchaseItem;
          }

          if (field === "itemId") {
            const selectedItem = items.find(
              (item) =>
                String(item.id) ===
                String(value)
            );

            return {
              ...purchaseItem,
              itemId: value,
              unitCost:
                selectedItem?.purchase_cost ??
                purchaseItem.unitCost,
            };
          }

          return {
            ...purchaseItem,
            [field]: value,
          };
        }
      ),
    }));
  };

  const addPurchaseItem = () => {
    setFormData((currentData) => ({
      ...currentData,
      items: [
        ...currentData.items,
        createEmptyPurchaseItem(),
      ],
    }));
  };

  const removePurchaseItem = (
    itemIndex
  ) => {
    setFormData((currentData) => {
      if (currentData.items.length === 1) {
        return currentData;
      }

      return {
        ...currentData,
        items: currentData.items.filter(
          (_, index) => index !== itemIndex
        ),
      };
    });
  };

  const openNewPurchaseModal = async () => {
    if (!canAdd) {
      await showAlert({
        title: "Permission Denied",
        message:
          "You do not have permission to add purchases.",
        type: "warning",
      });

      return;
    }

    setEditingPurchaseId(null);
    setFormData(createEmptyForm());
    setOpenActionId(null);
    setShowPurchaseModal(true);
  };

  const openEditPurchaseModal = (
    purchase
  ) => {
    if (!canEdit) {
      showAlert({
        message: "You do not have permission to edit purchases.",
      });
      return;
    }

    setEditingPurchaseId(purchase.id);

    setFormData({
      supplierId: String(
        purchase.supplierId
      ),
      orderDate: purchase.orderDate,
      expectedDate:
        purchase.expectedDate,
      warehouseId: String(
        purchase.warehouseId
      ),
      items:
        purchase.items?.length > 0
          ? purchase.items.map(
              (purchaseItem) => ({
                itemId: String(
                  purchaseItem.itemId
                ),
                quantity:
                  purchaseItem.quantity,
                unitCost:
                  purchaseItem.unitCost,
              })
            )
          : [createEmptyPurchaseItem()],
    });

    setOpenActionId(null);
    setShowPurchaseModal(true);
  };

  const closePurchaseModal = () => {
    if (saving) {
      return;
    }

    setShowPurchaseModal(false);
    setEditingPurchaseId(null);
    setFormData(createEmptyForm());
  };

  const validatePurchaseForm = () => {
    const requiredFields = [
      "supplierId",
      "orderDate",
      "expectedDate",
      "warehouseId",
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
        message:
          "Please complete all purchase fields.",
      });

      return false;
    }

    if (
      !Array.isArray(formData.items) ||
      formData.items.length === 0
    ) {
      showAlert({
        message:
          "Please add at least one item.",
      });

      return false;
    }

    const hasInvalidItem =
      formData.items.some(
        (purchaseItem) =>
          String(
            purchaseItem.itemId || ""
          ).trim() === "" ||
          String(
            purchaseItem.quantity || ""
          ).trim() === "" ||
          String(
            purchaseItem.unitCost ?? ""
          ).trim() === "" ||
          Number(
            purchaseItem.quantity
          ) <= 0 ||
          Number(
            purchaseItem.unitCost
          ) < 0
      );

    if (hasInvalidItem) {
      showAlert({
        message:
          "Complete every item. Quantity must be greater than zero and unit cost cannot be negative.",
      });

      return false;
    }

    const uniqueItemIds = new Set(
      formData.items.map(
        (purchaseItem) =>
          String(purchaseItem.itemId)
      )
    );

    if (
      uniqueItemIds.size !==
      formData.items.length
    ) {
      showAlert({
        message:
          "The same item cannot be added more than once.",
      });

      return false;
    }

    if (
      formData.expectedDate <
      formData.orderDate
    ) {
      showAlert({
        message:
          "Expected date cannot be before the order date.",
      });

      return false;
    }

    return true;
  };

  const handleSavePurchase = async (
    event
  ) => {
    event.preventDefault();

    const requiredPermission =
      editingPurchaseId
        ? canEdit
        : canAdd;

    if (!requiredPermission) {
      await showAlert({
        title: "Permission Denied",
        message: editingPurchaseId
          ? "You do not have permission to edit purchases."
          : "You do not have permission to add purchases.",
        type: "warning",
      });

      return;
    }

    if (!validatePurchaseForm()) {
      return;
    }

    try {
      setSaving(true);

      if (editingPurchaseId) {
        const updatedPurchase =
          await updatePurchase(
            editingPurchaseId,
            formData
          );

        setPurchases(
          (currentPurchases) =>
            currentPurchases.map(
              (purchase) =>
                purchase.id ===
                editingPurchaseId
                  ? updatedPurchase
                  : purchase
            )
        );
      } else {
        const newPurchase =
          await createPurchase(formData);

        setPurchases(
          (currentPurchases) => [
            newPurchase,
            ...currentPurchases,
          ]
        );
      }

      setShowPurchaseModal(false);
      setEditingPurchaseId(null);
      setFormData(createEmptyForm());
    } catch (error) {
      console.error(
        "Error saving purchase:",
        error
      );

      showAlert({
        message: error.message ||
          "Could not save purchase order.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApprovePurchase = async (
    purchaseId
  ) => {
    if (!canEdit) {
      await showAlert({
        title: "Permission Denied",
        message:
          "You do not have permission to approve purchases.",
        type: "warning",
      });

      return;
    }

    try {
      const updatedPurchase =
        await updatePurchaseStatus(
          purchaseId,
          "Approved"
        );

      setPurchases(
        (currentPurchases) =>
          currentPurchases.map(
            (purchase) =>
              purchase.id === purchaseId
                ? updatedPurchase
                : purchase
          )
      );

      setOpenActionId(null);
    } catch (error) {
      showAlert({
        message: error.message ||
          "Could not approve purchase order.",
      });
    }
  };

  const openReceiveModal = async (purchase) => {
    if (!canEdit) {
      await showAlert({
        title: "Permission Denied",
        message:
          "You do not have permission to receive purchases.",
        type: "warning",
      });

      return;
    }

    setReceivingPurchase(purchase);
    setOpenActionId(null);
    setShowReceiveModal(true);
  };

  const closeReceiveModal = () => {
    if (saving) {
      return;
    }

    setShowReceiveModal(false);
    setReceivingPurchase(null);
  };

  const handleReceivePurchase = async (
    event
  ) => {
    if (!canEdit) {
      showAlert({
        message: "You do not have permission to receive purchases.",
      });
      return;
    }

    event.preventDefault();

    if (!receivingPurchase) {
      return;
    }

    try {
      setSaving(true);

      const updatedPurchase =
        await receivePurchase(
          receivingPurchase
        );

      setPurchases(
        (currentPurchases) =>
          currentPurchases.map(
            (purchase) =>
              purchase.id ===
              receivingPurchase.id
                ? updatedPurchase
                : purchase
          )
      );

      setShowReceiveModal(false);
      setReceivingPurchase(null);
    } catch (error) {
      console.error(
        "Error receiving purchase:",
        error
      );

      showAlert({
        message: error.message ||
          "Could not receive purchase items.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPurchase = async (
    purchaseId
  ) => {
    if (!canEdit) {
      await showAlert({
        title: "Permission Denied",
        message:
          "You do not have permission to cancel purchases.",
        type: "warning",
      });

      return;
    }

    const confirmed = await showConfirm({
      message: "Are you sure you want to cancel this purchase order?",
    });

    if (!confirmed) {
      return;
    }

    updatePurchaseStatus(
      purchaseId,
      "Cancelled"
    )
      .then((updatedPurchase) => {
        setPurchases(
          (currentPurchases) =>
            currentPurchases.map(
              (purchase) =>
                purchase.id ===
                purchaseId
                  ? updatedPurchase
                  : purchase
            )
        );

        setOpenActionId(null);
      })
      .catch((error) => {
        showAlert({
        message: error.message ||
            "Could not cancel purchase order.",
      });
      });
  };

  const handleDeletePurchase = async (
    purchaseId
  ) => {
    if (!canDelete) {
      showAlert({
        message: "You do not have permission to delete purchases.",
      });
      return;
    }

    const confirmed = await showConfirm({
      message: "Are you sure you want to delete this purchase order?",
    });

    if (!confirmed) {
      return;
    }

    try {
      await removePurchase(purchaseId);

      setPurchases(
        (currentPurchases) =>
          currentPurchases.filter(
            (purchase) =>
              purchase.id !== purchaseId
          )
      );

      setOpenActionId(null);
    } catch (error) {
      showAlert({
        message: error.message ||
          "Could not delete purchase order.",
      });
    }
  };

  const toggleActionMenu = (
    event,
    purchaseId
  ) => {
    event.stopPropagation();

    if (openActionId === purchaseId) {
      setOpenActionId(null);
      return;
    }

    const buttonRect =
      event.currentTarget.getBoundingClientRect();

    const menuWidth = 145;
    const menuHeight = 176;
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
      buttonRect.right -
      menuWidth;

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

    setOpenActionId(purchaseId);
  };

  const getStatusClass = (status) =>
    status
      .toLowerCase()
      .replace(/\s+/g, "-");

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    return new Date(
      `${dateValue}T00:00:00`
    ).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="dashboard-page">
      <Sidebar activePage="purchase" />

      <main className="purchase-main">
        <Topbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        <section className="purchase-title-section">
          <div>
            <h1>Purchase</h1>

            <p>
              Manage purchase requests, approvals
              and received inventory
            </p>
          </div>

          <button
            type="button"
            className="new-purchase-button"
            onClick={openNewPurchaseModal}
          >
            <FiPlus />
            <span>
              New Purchase Request
            </span>
          </button>
        </section>

        <section className="purchase-stats">
          <PurchaseStatCard
            icon={<FiBox />}
            title="Total Purchase Orders"
            value={purchases.length}
            subtitle="All orders"
          />

          <PurchaseStatCard
            icon={<FiClock />}
            title="Pending Approval"
            value={pendingOrders}
            subtitle="Purchase requests"
          />

          <PurchaseStatCard
            icon={<FiCheckCircle />}
            title="Items Received"
            value={receivedItems.toLocaleString()}
            subtitle="Inventory updated"
          />

          <PurchaseStatCard
            icon={<FiDollarSign />}
            title="Total Spent"
            value={totalSpent.toLocaleString()}
            subtitle="EGP received orders"
          />
        </section>

        <section className="purchase-filters">
          <div className="purchase-search-box">
            <FiSearch />

            <input
              type="text"
              placeholder="Search purchase orders..."
              value={searchValue}
              onChange={(event) =>
                setSearchValue(
                  event.target.value
                )
              }
            />
          </div>

          <select
            value={selectedWarehouse}
            onChange={(event) =>
              setSelectedWarehouse(
                event.target.value
              )
            }
          >
            <option value="All Warehouses">
              All Warehouses
            </option>

            {warehouses.map(
              (warehouse) => (
                <option
                  key={warehouse.id}
                  value={warehouse.id}
                >
                  {warehouse.name}
                </option>
              )
            )}
          </select>

          <select
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(
                event.target.value
              )
            }
          >
            <option value="All Statuses">
              All Statuses
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Approved">
              Approved
            </option>

            <option value="Received">
              Received
            </option>

            <option value="Cancelled">
              Cancelled
            </option>
          </select>
        </section>

        <section className="purchase-table-card">
          <div className="purchase-table-wrapper">
            <table>
              <thead>
                <tr>

                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Order Date</th>
                  <th>Expected Date</th>
                  <th>Warehouse</th>
                  <th>Items</th>
                  <th>Total Quantity</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="purchase-empty-state"
                    >
                      Loading purchase orders...
                    </td>
                  </tr>
                ) : filteredPurchases.length >
                  0 ? (
                  paginatedPurchases.map(
                    (purchase) => (
                      <tr key={purchase.id}>

                        <td>
                          {purchase.poNumber}
                        </td>

                        <td>
                          {purchase.supplier}
                        </td>

                        <td>
                          <div className="purchase-date-cell">
                            <FiCalendar />

                            <span>
                              {formatDate(
                                purchase.orderDate
                              )}
                            </span>
                          </div>
                        </td>

                        <td>
                          {formatDate(
                            purchase.expectedDate
                          )}
                        </td>

                        <td>
                          {purchase.warehouse}
                        </td>

                        <td>
                          <div className="purchase-items-cell">
                            {purchase.itemNames?.length
                              ? purchase.itemNames.join(", ")
                              : "-"}
                          </div>
                        </td>

                        <td>
                          {Number(
                            purchase.totalQuantity
                          ).toLocaleString()}
                        </td>

                        <td>
                          {Number(
                            purchase.totalAmount
                          ).toLocaleString()}{" "}
                          EGP
                        </td>

                        <td>
                          <span
                            className={`purchase-status ${getStatusClass(
                              purchase.status
                            )}`}
                          >
                            {purchase.status}
                          </span>
                        </td>

                        <td>
                          <div className="purchase-actions">
                            <button
                              type="button"
                              aria-label={`Edit ${purchase.poNumber}`}
                              disabled={
                                purchase.status ===
                                  "Received" ||
                                purchase.status ===
                                  "Cancelled"
                              }
                              onClick={() =>
                                openEditPurchaseModal(
                                  purchase
                                )
                              }
                            >
                              <FiEdit2 />
                            </button>

                            <div className="purchase-more-wrapper">
                              <button
                                type="button"
                                className="purchase-more-button"
                                aria-label={`More actions for ${purchase.poNumber}`}
                                onClick={(event) =>
                                  toggleActionMenu(
                                    event,
                                    purchase.id
                                  )
                                }
                              >
                                <FiMoreVertical />
                              </button>

                              {openActionId ===
                                purchase.id && (
                                <div
                                  className="purchase-action-menu"
                                  style={{
                                    top: `${actionMenuPosition.top}px`,
                                    left: `${actionMenuPosition.left}px`,
                                  }}
                                >
                                  {purchase.status ===
                                    "Pending" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleApprovePurchase(
                                          purchase.id
                                        )
                                      }
                                    >
                                      <FiCheck />
                                      Approve
                                    </button>
                                  )}

                                  {purchase.status ===
                                    "Approved" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openReceiveModal(
                                          purchase
                                        )
                                      }
                                    >
                                      <FiDownload />
                                      Receive Items
                                    </button>
                                  )}

                                  {(purchase.status ===
                                    "Pending" ||
                                    purchase.status ===
                                      "Approved") && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openEditPurchaseModal(
                                          purchase
                                        )
                                      }
                                    >
                                      <FiEdit2 />
                                      Edit
                                    </button>
                                  )}

                                  {purchase.status !==
                                    "Received" &&
                                    purchase.status !==
                                      "Cancelled" && (
                                      <button
                                        type="button"
                                        className="cancel-action"
                                        onClick={() =>
                                          handleCancelPurchase(
                                            purchase.id
                                          )
                                        }
                                      >
                                        <FiX />
                                        Cancel
                                      </button>
                                    )}

                                  <button
                                    type="button"
                                    className="delete-action"
                                    onClick={() =>
                                      handleDeletePurchase(
                                        purchase.id
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
                      colSpan="10"
                      className="purchase-empty-state"
                    >
                      No purchase orders match
                      your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="purchase-pagination">
            <p>
              Showing{" "}
              {filteredPurchases.length === 0
                ? 0
                : (currentPage - 1) *
                    purchasesPerPage +
                  1}
              -
              {Math.min(
                currentPage *
                  purchasesPerPage,
                filteredPurchases.length
              )}{" "}
              of{" "}
              {filteredPurchases.length} purchase
              orders
            </p>

            <div>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(1, page - 1)
                  )
                }
                disabled={currentPage === 1}
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
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(
                      totalPages,
                      page + 1
                    )
                  )
                }
                disabled={
                  currentPage === totalPages
                }
              >
                 ›
              </button>
            </div>
          </div>
        </section>
      </main>

      {showPurchaseModal && (
        <div
          className="purchase-modal-overlay"
          onMouseDown={
            closePurchaseModal
          }
        >
          <form
            className="purchase-modal"
            onSubmit={handleSavePurchase}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="purchase-modal-header">
              <div>
                <h2>
                  {editingPurchaseId
                    ? "Edit Purchase Order"
                    : "New Purchase Request"}
                </h2>

                <p>
                  Enter the requested items and
                  supplier information.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closePurchaseModal
                }
                aria-label="Close form"
                disabled={saving}
              >
                <FiX />
              </button>
            </div>

            <div className="purchase-modal-grid">
              <label>
                Supplier

                <select
                  name="supplierId"
                  value={
                    formData.supplierId
                  }
                  onChange={handleFormChange}
                  disabled={saving}
                >
                  <option value="">
                    Select supplier
                  </option>

                  {suppliers.map(
                    (supplier) => (
                      <option
                        key={supplier.id}
                        value={supplier.id}
                      >
                        {supplier.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                Warehouse

                <select
                  name="warehouseId"
                  value={
                    formData.warehouseId
                  }
                  onChange={handleFormChange}
                  disabled={saving}
                >
                  <option value="">
                    Select warehouse
                  </option>

                  {warehouses.map(
                    (warehouse) => (
                      <option
                        key={warehouse.id}
                        value={warehouse.id}
                      >
                        {warehouse.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                Order Date

                <input
                  type="date"
                  name="orderDate"
                  value={formData.orderDate}
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </label>

              <label>
                Expected Date

                <input
                  type="date"
                  name="expectedDate"
                  value={
                    formData.expectedDate
                  }
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </label>
            </div>

            <section className="purchase-items-section">
              <div className="purchase-items-header">
                <div>
                  <h3>Items & Quantities</h3>
                  <p>
                    Add one or more items to this
                    purchase order.
                  </p>
                </div>

                <button
                  type="button"
                  className="purchase-add-item-button"
                  onClick={addPurchaseItem}
                  disabled={saving}
                >
                  <FiPlus />
                  Add Item
                </button>
              </div>

              <div className="purchase-items-list">
                {formData.items.map(
                  (purchaseItem, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="purchase-item-row"
                    >
                      <label>
                        Item

                        <select
                          value={
                            purchaseItem.itemId
                          }
                          onChange={(event) =>
                            handlePurchaseItemChange(
                              itemIndex,
                              "itemId",
                              event.target.value
                            )
                          }
                          disabled={saving}
                        >
                          <option value="">
                            Select item
                          </option>

                          {items.map((item) => (
                            <option
                              key={item.id}
                              value={item.id}
                            >
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Quantity

                        <input
                          type="number"
                          min="1"
                          value={
                            purchaseItem.quantity
                          }
                          onChange={(event) =>
                            handlePurchaseItemChange(
                              itemIndex,
                              "quantity",
                              event.target.value
                            )
                          }
                          placeholder="500"
                          disabled={saving}
                        />
                      </label>

                      <label>
                        Unit Cost

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            purchaseItem.unitCost
                          }
                          onChange={(event) =>
                            handlePurchaseItemChange(
                              itemIndex,
                              "unitCost",
                              event.target.value
                            )
                          }
                          placeholder="0.00"
                          disabled={saving}
                        />
                      </label>

                      <button
                        type="button"
                        className="purchase-remove-item-button"
                        onClick={() =>
                          removePurchaseItem(
                            itemIndex
                          )
                        }
                        disabled={
                          saving ||
                          formData.items.length ===
                            1
                        }
                        aria-label="Remove item"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  )
                )}
              </div>
            </section>

            <div className="purchase-total-preview">
              Estimated Total:

              <strong>
                {formData.items
                  .reduce(
                    (total, purchaseItem) =>
                      total +
                      Number(
                        purchaseItem.quantity ||
                          0
                      ) *
                        Number(
                          purchaseItem.unitCost ||
                            0
                        ),
                    0
                  )
                  .toLocaleString()}{" "}
                EGP
              </strong>
            </div>

            <div className="purchase-modal-actions">
              <button
                type="button"
                className="purchase-cancel-button"
                onClick={
                  closePurchaseModal
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="purchase-save-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingPurchaseId
                    ? "Update Order"
                    : "Create Request"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showReceiveModal &&
        receivingPurchase && (
        <div
          className="purchase-modal-overlay"
          onMouseDown={
            closeReceiveModal
          }
        >
          <form
            className="purchase-modal receive-modal"
            onSubmit={
              handleReceivePurchase
            }
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="purchase-modal-header">
              <div>
                <h2>Receive Items</h2>

                <p>
                  Confirm received items to update
                  inventory.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeReceiveModal
                }
                disabled={saving}
              >
                <FiX />
              </button>
            </div>

            <div className="receive-summary">
              <div>
                <span>PO Number</span>

                <strong>
                  {
                    receivingPurchase.poNumber
                  }
                </strong>
              </div>

              <div className="receive-summary-items">
                <span>Items</span>

                <strong>
                  {receivingPurchase.items
                    .map(
                      (purchaseItem) =>
                        `${purchaseItem.name} (${Number(
                          purchaseItem.quantity
                        ).toLocaleString()})`
                    )
                    .join(", ")}
                </strong>
              </div>

              <div>
                <span>Total Quantity</span>

                <strong>
                  {Number(
                    receivingPurchase.totalQuantity
                  ).toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Warehouse</span>

                <strong>
                  {
                    receivingPurchase.warehouse
                  }
                </strong>
              </div>
            </div>

            <div className="inventory-update-note">
              <FiCheckCircle />

              Inventory will be updated after
              confirming receipt.
            </div>

            <div className="purchase-modal-actions">
              <button
                type="button"
                className="purchase-cancel-button"
                onClick={
                  closeReceiveModal
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="purchase-save-button"
                disabled={saving}
              >
                {saving
                  ? "Receiving..."
                  : "Receive Items"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function PurchaseStatCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <article className="purchase-stat-card">
      <div className="purchase-stat-content">
        <div className="purchase-stat-icon">
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