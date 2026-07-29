import {
  useMemo,
  useState,
} from "react";

import "../styles/mobile-sidebar-offcanvas-clean-highlight.css";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import {
  usePurchases,
} from "../context/PurchasesContext";

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

const emptyForm = {
  supplier: "",
  orderDate: "",
  expectedDate: "",
  warehouse: "Cairo",
  itemName: "",
  quantity: "",
  unitCost: "",
};

const getTodayDate = () =>
  new Date().toISOString().split("T")[0];

export default function Purchase() {
  const {
    purchases,
    addPurchase,
    updatePurchase,
    approvePurchase,
    receivePurchase,
    cancelPurchase,
    deletePurchase,
  } = usePurchases();

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
    useState(emptyForm);

  const [editingPurchaseId, setEditingPurchaseId] =
    useState(null);

  const [receivingPurchase, setReceivingPurchase] =
    useState(null);

  const [receivedDate, setReceivedDate] =
    useState(getTodayDate());

  const [
    openActionId,
    setOpenActionId,
  ] = useState(null);

  const filteredPurchases = useMemo(() => {
    const normalizedSearch =
      searchValue.trim().toLowerCase();

    return purchases.filter((purchase) => {
      const matchesSearch =
        normalizedSearch === "" ||
        [
          purchase.id,
          purchase.supplier,
          purchase.itemName,
          purchase.orderDate,
          purchase.expectedDate,
          purchase.warehouse,
          purchase.status,
        ].some((value) =>
          String(value)
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesWarehouse =
        selectedWarehouse ===
          "All Warehouses" ||
        purchase.warehouse ===
          selectedWarehouse;

      const matchesStatus =
        selectedStatus === "All Statuses" ||
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

  const totalSpent = useMemo(() => {
    return purchases
      .filter(
        (purchase) =>
          purchase.status === "Received"
      )
      .reduce(
        (total, purchase) =>
          total +
          Number(purchase.totalAmount),
        0
      );
  }, [purchases]);

  const pendingOrders = purchases.filter(
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
        total + Number(purchase.quantity),
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

  const openNewPurchaseModal = () => {
    setEditingPurchaseId(null);
    setFormData({
      ...emptyForm,
      orderDate: getTodayDate(),
    });
    setOpenActionId(null);
    setShowPurchaseModal(true);
  };

  const openEditPurchaseModal = (
    purchase
  ) => {
    setEditingPurchaseId(purchase.id);
    setFormData({
      supplier: purchase.supplier,
      orderDate: purchase.orderDate,
      expectedDate: purchase.expectedDate,
      warehouse: purchase.warehouse,
      itemName: purchase.itemName,
      quantity: purchase.quantity,
      unitCost: purchase.unitCost,
    });
    setOpenActionId(null);
    setShowPurchaseModal(true);
  };

  const closePurchaseModal = () => {
    setShowPurchaseModal(false);
    setEditingPurchaseId(null);
    setFormData(emptyForm);
  };

  const handleSavePurchase = (event) => {
    event.preventDefault();

    const requiredFields = [
      "supplier",
      "orderDate",
      "expectedDate",
      "warehouse",
      "itemName",
      "quantity",
      "unitCost",
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
        "Please complete all purchase fields."
      );
      return;
    }

    if (
      Number(formData.quantity) <= 0 ||
      Number(formData.unitCost) < 0
    ) {
      alert(
        "Quantity must be greater than zero and unit cost cannot be negative."
      );
      return;
    }

    if (
      formData.expectedDate <
      formData.orderDate
    ) {
      alert(
        "Expected date cannot be before the order date."
      );
      return;
    }

    if (editingPurchaseId) {
      updatePurchase(
        editingPurchaseId,
        formData
      );
    } else {
      addPurchase(formData);
    }

    closePurchaseModal();
  };

  const handleApprovePurchase = (
    purchaseId
  ) => {
    approvePurchase(purchaseId);
    setOpenActionId(null);
  };

  const openReceiveModal = (purchase) => {
    setReceivingPurchase(purchase);
    setReceivedDate(getTodayDate());
    setOpenActionId(null);
    setShowReceiveModal(true);
  };

  const closeReceiveModal = () => {
    setShowReceiveModal(false);
    setReceivingPurchase(null);
    setReceivedDate(getTodayDate());
  };

  const handleReceivePurchase = (
    event
  ) => {
    event.preventDefault();

    if (!receivedDate) {
      alert("Please select the receive date.");
      return;
    }

    receivePurchase(
      receivingPurchase.id,
      receivedDate
    );

    closeReceiveModal();
  };

  const handleCancelPurchase = (
    purchaseId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this purchase order?"
    );

    if (!confirmed) {
      return;
    }

    cancelPurchase(purchaseId);
    setOpenActionId(null);
  };

  const handleDeletePurchase = (
    purchaseId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this purchase order?"
    );

    if (!confirmed) {
      return;
    }

    deletePurchase(purchaseId);
    setOpenActionId(null);
  };

  const toggleActionMenu = (
    purchaseId
  ) => {
    setOpenActionId((currentId) =>
      currentId === purchaseId
        ? null
        : purchaseId
    );
  };

  const getStatusClass = (status) => {
    return status
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

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
            <span>New Purchase Request</span>
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
            <option>
              All Warehouses
            </option>
            <option value="Cairo">
              Cairo
            </option>
            <option value="Alex">
              Alex
            </option>
          </select>

          <select
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(
                event.target.value
              )
            }
          >
            <option>
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
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Select all purchases"
                    />
                  </th>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Order Date</th>
                  <th>Expected Date</th>
                  <th>Warehouse</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPurchases.length >
                0 ? (
                  filteredPurchases.map(
                    (purchase) => (
                      <tr key={purchase.id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Select ${purchase.id}`}
                          />
                        </td>

                        <td>{purchase.id}</td>
                        <td>{purchase.supplier}</td>

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
                          {purchase.itemName}
                        </td>

                        <td>
                          {Number(
                            purchase.quantity
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
                              aria-label={`Edit ${purchase.id}`}
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
                                aria-label={`More actions for ${purchase.id}`}
                                onClick={() =>
                                  toggleActionMenu(
                                    purchase.id
                                  )
                                }
                              >
                                <FiMoreVertical />
                              </button>

                              {openActionId ===
                                purchase.id && (
                                <div className="purchase-action-menu">
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
                      colSpan="11"
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
              {filteredPurchases.length} of{" "}
              {purchases.length} purchase orders
            </p>
          </div>
        </section>
      </main>

      {showPurchaseModal && (
        <div
          className="purchase-modal-overlay"
          onMouseDown={closePurchaseModal}
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
                  Enter the requested item and
                  supplier information.
                </p>
              </div>

              <button
                type="button"
                onClick={closePurchaseModal}
                aria-label="Close form"
              >
                <FiX />
              </button>
            </div>

            <div className="purchase-modal-grid">
              <label>
                Supplier
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleFormChange}
                  placeholder="Supplier name"
                />
              </label>

              <label>
                Item
                <input
                  type="text"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleFormChange}
                  placeholder="Dinner Plate"
                />
              </label>

              <label>
                Order Date
                <input
                  type="date"
                  name="orderDate"
                  value={formData.orderDate}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Expected Date
                <input
                  type="date"
                  name="expectedDate"
                  value={formData.expectedDate}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Warehouse
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
                Quantity
                <input
                  type="number"
                  min="1"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleFormChange}
                  placeholder="500"
                />
              </label>

              <label className="purchase-full-field">
                Unit Cost
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="unitCost"
                  value={formData.unitCost}
                  onChange={handleFormChange}
                  placeholder="0.00"
                />
              </label>
            </div>

            <div className="purchase-total-preview">
              Estimated Total:
              <strong>
                {(
                  Number(formData.quantity || 0) *
                  Number(formData.unitCost || 0)
                ).toLocaleString()}{" "}
                EGP
              </strong>
            </div>

            <div className="purchase-modal-actions">
              <button
                type="button"
                className="purchase-cancel-button"
                onClick={closePurchaseModal}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="purchase-save-button"
              >
                {editingPurchaseId
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
          onMouseDown={closeReceiveModal}
        >
          <form
            className="purchase-modal receive-modal"
            onSubmit={handleReceivePurchase}
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
                onClick={closeReceiveModal}
              >
                <FiX />
              </button>
            </div>

            <div className="receive-summary">
              <div>
                <span>PO Number</span>
                <strong>
                  {receivingPurchase.id}
                </strong>
              </div>

              <div>
                <span>Item</span>
                <strong>
                  {receivingPurchase.itemName}
                </strong>
              </div>

              <div>
                <span>Quantity</span>
                <strong>
                  {Number(
                    receivingPurchase.quantity
                  ).toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Warehouse</span>
                <strong>
                  {receivingPurchase.warehouse}
                </strong>
              </div>
            </div>

            <label className="receive-date-field">
              Receive Date
              <input
                type="date"
                value={receivedDate}
                onChange={(event) =>
                  setReceivedDate(
                    event.target.value
                  )
                }
              />
            </label>

            <div className="inventory-update-note">
              <FiCheckCircle />
              Inventory will be updated after
              confirming receipt.
            </div>

            <div className="purchase-modal-actions">
              <button
                type="button"
                className="purchase-cancel-button"
                onClick={closeReceiveModal}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="purchase-save-button"
              >
                Receive Items
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