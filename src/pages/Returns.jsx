import {
  useMemo,
  useState,
} from "react";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import "../styles/mobile-sidebar-offcanvas.css";


import {
  useReturns,
} from "../context/ReturnsContext";

import {
  useDispatches,
} from "../context/DispatchesContext";

import {
  useItems,
} from "../context/ItemsContext";

import "../styles/dashboard.css";
import "../styles/Returns.css";

import {
  FiCornerUpLeft,
  FiPlus,
  FiSearch,
  FiMoreVertical,
  FiX,
  FiTrash2,
  FiCheckCircle,
} from "react-icons/fi";

const tabs = [
  "All Returns",
  "Has Damage",
  "Has Missing",
];

const getTodayDate = () =>
  new Date().toISOString().split("T")[0];

const emptyForm = {
  dispatchId: "",
  eventReference: "",
  warehouse: "",
  returnDate: getTodayDate(),
  returnedBy: "",
  notes: "",
  items: [],
};

export default function Returns() {
  const {
    returns,
    addReturn,
    deleteReturn,
  } = useReturns();

  const {
    dispatches,
    setDispatches,
  } = useDispatches();

  const {
    setItems,
  } = useItems();

  const [searchValue, setSearchValue] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("All Returns");

  const [
    showReturnModal,
    setShowReturnModal,
  ] = useState(false);

  const [
    openActionId,
    setOpenActionId,
  ] = useState(null);

  const [formData, setFormData] =
    useState(emptyForm);

  const availableDispatches = useMemo(
    () =>
      dispatches.filter(
        (dispatch) =>
          dispatch.status === "Delivered" &&
          !returns.some(
            (returnRecord) =>
              returnRecord.dispatchId ===
              dispatch.id
          )
      ),
    [dispatches, returns]
  );

  const filteredReturns = useMemo(() => {
    const search =
      searchValue.trim().toLowerCase();

    return returns.filter(
      (returnRecord) => {
        const totalDamaged =
          returnRecord.items.reduce(
            (total, item) =>
              total +
              Number(item.damaged),
            0
          );

        const totalMissing =
          returnRecord.items.reduce(
            (total, item) =>
              total +
              Number(item.missing),
            0
          );

        const matchesSearch =
          search === "" ||
          [
            returnRecord.id,
            returnRecord.dispatchId,
            returnRecord.eventReference,
            returnRecord.warehouse,
            returnRecord.returnDate,
            returnRecord.returnedBy,
          ].some((value) =>
            String(value)
              .toLowerCase()
              .includes(search)
          );

        const matchesTab =
          activeTab === "All Returns" ||
          (activeTab === "Has Damage" &&
            totalDamaged > 0) ||
          (activeTab === "Has Missing" &&
            totalMissing > 0);

        return matchesSearch && matchesTab;
      }
    );
  }, [
    returns,
    searchValue,
    activeTab,
  ]);

  const openAddModal = () => {
    setFormData({
      ...emptyForm,
      returnDate: getTodayDate(),
    });

    setOpenActionId(null);
    setShowReturnModal(true);
  };

  const closeModal = () => {
    setShowReturnModal(false);

    setFormData({
      ...emptyForm,
      returnDate: getTodayDate(),
    });
  };

  const handleDispatchChange = (
    event
  ) => {
    const dispatchId =
      event.target.value;

    const selectedDispatch =
      dispatches.find(
        (dispatch) =>
          dispatch.id === dispatchId
      );

    if (!selectedDispatch) {
      setFormData({
        ...emptyForm,
        returnDate: getTodayDate(),
      });

      return;
    }

    setFormData({
      dispatchId:
        selectedDispatch.id,
      eventReference:
        selectedDispatch.eventReference,
      warehouse:
        selectedDispatch.fromWarehouse,
      returnDate: getTodayDate(),
      returnedBy: "",
      notes: "",
      items: selectedDispatch.items.map(
        (item) => ({
          name: item.name,
          dispatchedQuantity: Number(
            item.quantity
          ),
          goodReturned: "",
          damaged: "",
          missing: "",
        })
      ),
    });
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

  const handleItemChange = (
    itemIndex,
    field,
    value
  ) => {
    setFormData((currentData) => ({
      ...currentData,
      items: currentData.items.map(
        (item, index) =>
          index === itemIndex
            ? {
                ...item,
                [field]: value,
              }
            : item
      ),
    }));
  };

  const getTotals = (items) => {
    return items.reduce(
      (totals, item) => {
        totals.dispatched += Number(
          item.dispatchedQuantity || 0
        );

        totals.goodReturned += Number(
          item.goodReturned || 0
        );

        totals.damaged += Number(
          item.damaged || 0
        );

        totals.missing += Number(
          item.missing || 0
        );

        return totals;
      },
      {
        dispatched: 0,
        goodReturned: 0,
        damaged: 0,
        missing: 0,
      }
    );
  };

  const updateInventory = (
    returnedItems
  ) => {
    setItems((currentItems) =>
      currentItems.map((inventoryItem) => {
        const returnedItem =
          returnedItems.find(
            (item) =>
              item.name.toLowerCase() ===
              inventoryItem.name.toLowerCase()
          );

        if (!returnedItem) {
          return inventoryItem;
        }

        return {
          ...inventoryItem,

          available:
            Number(
              inventoryItem.available || 0
            ) +
            Number(
              returnedItem.goodReturned
            ),

          outOfEvent: Math.max(
            0,
            Number(
              inventoryItem.outOfEvent || 0
            ) -
              Number(
                returnedItem
                  .dispatchedQuantity
              )
          ),

          damaged:
            Number(
              inventoryItem.damaged || 0
            ) +
            Number(returnedItem.damaged),

          missing:
            Number(
              inventoryItem.missing || 0
            ) +
            Number(returnedItem.missing),
        };
      })
    );
  };

  const handleSaveReturn = (event) => {
    event.preventDefault();

    if (
      !formData.dispatchId ||
      !formData.returnDate ||
      !formData.returnedBy.trim()
    ) {
      alert(
        "Please complete the return information."
      );
      return;
    }

    const hasInvalidItem =
      formData.items.some((item) => {
        const distributedQuantity =
          Number(
            item.goodReturned || 0
          ) +
          Number(item.damaged || 0) +
          Number(item.missing || 0);

        return (
          distributedQuantity !==
          Number(
            item.dispatchedQuantity
          )
        );
      });

    if (hasInvalidItem) {
      alert(
        "For every item: Returned + Damaged + Missing must equal Sent Quantity."
      );
      return;
    }

    addReturn(formData);

    updateInventory(formData.items);

    setDispatches(
      (currentDispatches) =>
        currentDispatches.map(
          (dispatch) =>
            dispatch.id ===
            formData.dispatchId
              ? {
                  ...dispatch,
                  status: "Returned",
                }
              : dispatch
        )
    );

    closeModal();
  };

  const handleDeleteReturn = (
    returnId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this return record?"
    );

    if (!confirmed) {
      return;
    }

    deleteReturn(returnId);
    setOpenActionId(null);
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
      <Sidebar activePage="returns" />

      <main className="returns-main">
        <Topbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        <section className="returns-title-section">
          <div>
            <h1>Returns</h1>

            <p>
              Record returned, damaged and
              missing quantities
            </p>
          </div>

          <button
            type="button"
            className="add-return-button"
            onClick={openAddModal}
          >
            <FiPlus />
            Receive Return
          </button>
        </section>

        <section className="returns-table-card">
          <div className="returns-table-toolbar">
            <div className="returns-tabs">
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

            <div className="returns-search-box">
              <FiSearch />

              <input
                type="text"
                placeholder="Search returns..."
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(
                    event.target.value
                  )
                }
              />
            </div>
          </div>

          <div className="returns-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                    />
                  </th>

                  <th>Return ID</th>
                  <th>Event Reference</th>
                  <th>Warehouse</th>
                  <th>Return Date</th>
                  <th>Received By</th>
                  <th>Total Sent</th>
                  <th>Returned</th>
                  <th>Damaged</th>
                  <th>Missing</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredReturns.length >
                0 ? (
                  filteredReturns.map(
                    (returnRecord) => {
                      const totals =
                        getTotals(
                          returnRecord.items
                        );

                      return (
                        <tr
                          key={
                            returnRecord.id
                          }
                        >
                          <td>
                            <input
                              type="checkbox"
                            />
                          </td>

                          <td>
                            <div className="return-name-cell">
                              <div className="return-row-icon">
                                <FiCornerUpLeft />
                              </div>

                              <div>
                                <strong>
                                  {
                                    returnRecord.id
                                  }
                                </strong>

                                <span>
                                  {
                                    returnRecord.dispatchId
                                  }
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            {
                              returnRecord.eventReference
                            }
                          </td>

                          <td>
                            {
                              returnRecord.warehouse
                            }
                          </td>

                          <td>
                            {formatDate(
                              returnRecord.returnDate
                            )}
                          </td>

                          <td>
                            {
                              returnRecord.returnedBy
                            }
                          </td>

                          <td>
                            {totals.dispatched.toLocaleString()}
                          </td>

                          <td className="return-good-value">
                            {totals.goodReturned.toLocaleString()}
                          </td>

                          <td className="return-damaged-value">
                            {totals.damaged.toLocaleString()}
                          </td>

                          <td className="return-missing-value">
                            {totals.missing.toLocaleString()}
                          </td>

                          <td className="return-action-cell">
                            <div className="return-actions">
                              <button
                                type="button"
                                aria-label={`View ${returnRecord.id}`}
                              >
                                <FiCheckCircle />
                              </button>

                              <div className="return-more-wrapper">
                                <button
                                  type="button"
                                  className="return-more-button"
                                  onClick={() =>
                                    setOpenActionId(
                                      (
                                        currentId
                                      ) =>
                                        currentId ===
                                        returnRecord.id
                                          ? null
                                          : returnRecord.id
                                    )
                                  }
                                >
                                  <FiMoreVertical />
                                </button>

                                {openActionId ===
                                  returnRecord.id && (
                                  <div className="return-action-menu">
                                    <button
                                      type="button"
                                      className="return-delete-action"
                                      onClick={() =>
                                        handleDeleteReturn(
                                          returnRecord.id
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
                      );
                    }
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="11"
                      className="returns-empty-state"
                    >
                      No returns match your
                      search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="returns-pagination">
            <p>
              Showing{" "}
              {filteredReturns.length} of{" "}
              {returns.length} returns
            </p>
          </div>
        </section>
      </main>

      {showReturnModal && (
        <div
          className="returns-modal-overlay"
          onMouseDown={closeModal}
        >
          <form
            className="returns-modal"
            onSubmit={handleSaveReturn}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="returns-modal-header">
              <div>
                <h2>Receive Return</h2>

                <p>
                  Record returned, damaged and
                  missing quantities.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
              >
                <FiX />
              </button>
            </div>

            <div className="returns-modal-grid">
              <label>
                Dispatch Reference

                <select
                  value={formData.dispatchId}
                  onChange={handleDispatchChange}
                >
                  <option value="">
                    Select delivered dispatch
                  </option>

                  {availableDispatches.map(
                    (dispatch) => (
                      <option
                        key={dispatch.id}
                        value={dispatch.id}
                      >
                        {dispatch.id} —{" "}
                        {dispatch.eventReference}
                      </option>
                    )
                  )}
                </select>

                {availableDispatches.length ===
                  0 && (
                  <span className="returns-field-help">
                    No delivered dispatch is
                    currently waiting for return.
                  </span>
                )}
              </label>

              <label>
                Return Date

                <input
                  type="date"
                  name="returnDate"
                  value={formData.returnDate}
                  onChange={handleFormChange}
                />
              </label>
            </div>

            {formData.dispatchId && (
              <div className="return-dispatch-info">
                <div>
                  <span>Event Reference</span>
                  <strong>
                    {formData.eventReference}
                  </strong>
                </div>

                <div>
                  <span>Return Warehouse</span>
                  <strong>
                    {formData.warehouse}
                  </strong>
                </div>

                <div>
                  <span>Dispatch Reference</span>
                  <strong>
                    {formData.dispatchId}
                  </strong>
                </div>
              </div>
            )}

            <div className="returns-modal-grid returns-receiver-grid">
              <label>
                Received By

                <input
                  type="text"
                  name="returnedBy"
                  placeholder="Employee name"
                  value={formData.returnedBy}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Notes

                <textarea
                  name="notes"
                  placeholder="Optional notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                />
              </label>
            </div>

            {formData.items.length > 0 && (
              <div className="returned-items-section">
                <div className="returned-items-heading">
                  <h3>Returned Items</h3>

                  <p>
                    Returned + Damaged +
                    Missing must equal the sent
                    quantity for every item.
                  </p>
                </div>

                <div className="returned-items-table">
                  <div className="returned-items-row returned-items-header">
                    <span>Item</span>
                    <span>Sent</span>
                    <span>Returned</span>
                    <span>Damaged</span>
                    <span>Missing</span>
                  </div>

                  {formData.items.map(
                    (item, itemIndex) => (
                      <div
                        className="returned-items-row"
                        key={item.name}
                      >
                        <strong>
                          {item.name}
                        </strong>

                        <span>
                          {
                            item.dispatchedQuantity
                          }
                        </span>

                        <input
                          type="number"
                          min="0"
                          value={
                            item.goodReturned
                          }
                          onChange={(event) =>
                            handleItemChange(
                              itemIndex,
                              "goodReturned",
                              event.target.value
                            )
                          }
                        />

                        <input
                          type="number"
                          min="0"
                          value={item.damaged}
                          onChange={(event) =>
                            handleItemChange(
                              itemIndex,
                              "damaged",
                              event.target.value
                            )
                          }
                        />

                        <input
                          type="number"
                          min="0"
                          value={item.missing}
                          onChange={(event) =>
                            handleItemChange(
                              itemIndex,
                              "missing",
                              event.target.value
                            )
                          }
                        />
                      </div>
                    )
                  )}
                </div>

                <div className="returns-summary">
                  {(() => {
                    const totals =
                      getTotals(
                        formData.items
                      );

                    return (
                      <>
                        <div>
                          <span>
                            Total Sent
                          </span>
                          <strong>
                            {
                              totals.dispatched
                            }
                          </strong>
                        </div>

                        <div>
                          <span>Returned</span>
                          <strong>
                            {
                              totals.goodReturned
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Damaged
                          </span>
                          <strong>
                            {
                              totals.damaged
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Missing
                          </span>
                          <strong>
                            {
                              totals.missing
                            }
                          </strong>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="returns-modal-actions">
              <button
                type="button"
                className="returns-cancel-button"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="returns-save-button"
              >
                Complete Return
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}