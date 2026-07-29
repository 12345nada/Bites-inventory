import {
  useMemo,
  useState,
} from "react";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import "../styles/mobile-sidebar-offcanvas.css";

import {
  useDispatches,
} from "../context/DispatchesContext";

import "../styles/dashboard.css";
import "../styles/Dispatch.css";

import {
  FiTruck,
  FiCheckCircle,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiMoreVertical,
  FiX,
  FiTrash2,
  FiPlay,
} from "react-icons/fi";

const tabs = [
  "All Dispatches",
  "Prepared",
  "In Transit",
  "Delivered",
  "Cancelled",
];

const itemOptions = [
  "Dinner Plate",
  "Water Glass",
  "Chair",
  "Chafing Dish",
  "Cutlery Set",
  "Table Napkin",
];

const getTodayDate = () =>
  new Date().toISOString().split("T")[0];

const createEmptyItem = () => ({
  name: "",
  quantity: "",
});

const emptyForm = {
  eventReference: "",
  fromWarehouse: "Cairo Warehouse",
  toLocation: "",
  area: "",
  driver: "",
  date: getTodayDate(),
  time: "",
  items: [createEmptyItem()],
};

export default function Dispatch() {
  const {
    dispatches,
    addDispatch,
    updateDispatch,
    startDispatch,
    markDelivered,
    cancelDispatch,
    deleteDispatch,
  } = useDispatches();

  const [searchValue, setSearchValue] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("All Dispatches");

  const [
    showDispatchModal,
    setShowDispatchModal,
  ] = useState(false);

  const [
    editingDispatchId,
    setEditingDispatchId,
  ] = useState(null);

  const [
    openActionId,
    setOpenActionId,
  ] = useState(null);

  const [formData, setFormData] =
    useState(emptyForm);

  const filteredDispatches = useMemo(() => {
    const search =
      searchValue.trim().toLowerCase();

    return dispatches.filter((dispatch) => {
      const itemSearchValues =
        dispatch.items.flatMap((item) => [
          item.name,
          item.quantity,
        ]);

      const matchesSearch =
        search === "" ||
        [
          dispatch.id,
          dispatch.eventReference,
          dispatch.fromWarehouse,
          dispatch.toLocation,
          dispatch.area,
          dispatch.driver,
          dispatch.date,
          dispatch.status,
          ...itemSearchValues,
        ].some((value) =>
          String(value)
            .toLowerCase()
            .includes(search)
        );

      const matchesTab =
        activeTab === "All Dispatches" ||
        dispatch.status === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [
    dispatches,
    searchValue,
    activeTab,
  ]);


  const handleFormChange = (event) => {
    const { name, value } = event.target;

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

  const addItemRow = () => {
    setFormData((currentData) => ({
      ...currentData,
      items: [
        ...currentData.items,
        createEmptyItem(),
      ],
    }));
  };

  const removeItemRow = (itemIndex) => {
    setFormData((currentData) => ({
      ...currentData,
      items:
        currentData.items.length === 1
          ? [createEmptyItem()]
          : currentData.items.filter(
              (_, index) =>
                index !== itemIndex
            ),
    }));
  };

  const openAddModal = () => {
    setEditingDispatchId(null);
    setFormData({
      ...emptyForm,
      date: getTodayDate(),
      items: [createEmptyItem()],
    });
    setShowDispatchModal(true);
  };

  const openEditModal = (dispatch) => {
    setEditingDispatchId(dispatch.id);

    setFormData({
      eventReference:
        dispatch.eventReference,
      fromWarehouse:
        dispatch.fromWarehouse,
      toLocation: dispatch.toLocation,
      area: dispatch.area,
      driver: dispatch.driver,
      date: dispatch.date,
      time: dispatch.time,
      items: dispatch.items.map((item) => ({
        ...item,
      })),
    });

    setOpenActionId(null);
    setShowDispatchModal(true);
  };

  const closeModal = () => {
    setShowDispatchModal(false);
    setEditingDispatchId(null);
    setFormData({
      ...emptyForm,
      date: getTodayDate(),
      items: [createEmptyItem()],
    });
  };

  const handleSaveDispatch = (event) => {
    event.preventDefault();

    const requiredFields = [
      "eventReference",
      "toLocation",
      "area",
      "driver",
      "date",
      "time",
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
        "Please complete all dispatch fields."
      );

      return;
    }

    const validItems =
      formData.items.filter(
        (item) =>
          item.name.trim() !== "" &&
          Number(item.quantity) > 0
      );

    if (validItems.length === 0) {
      alert(
        "Please add at least one item with a valid quantity."
      );
      return;
    }

    const itemNames = validItems.map(
      (item) =>
        item.name.trim().toLowerCase()
    );

    const hasDuplicateItems =
      itemNames.some(
        (itemName, index) =>
          itemNames.indexOf(itemName) !==
          index
      );

    if (hasDuplicateItems) {
      alert(
        "The same item cannot be added more than once."
      );
      return;
    }

    const normalizedData = {
      ...formData,
      items: validItems,
    };

    if (editingDispatchId) {
      updateDispatch(
        editingDispatchId,
        normalizedData
      );
    } else {
      addDispatch(normalizedData);
    }

    closeModal();
  };

  const handleStartDispatch = (
    dispatchId
  ) => {
    startDispatch(dispatchId);
    setOpenActionId(null);
  };

  const handleDeliveredDispatch = (
    dispatchId
  ) => {
    markDelivered(dispatchId);
    setOpenActionId(null);
  };

  const handleCancelDispatch = (
    dispatchId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this dispatch?"
    );

    if (!confirmed) {
      return;
    }

    cancelDispatch(dispatchId);
    setOpenActionId(null);
  };

  const handleDeleteDispatch = (
    dispatchId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this dispatch?"
    );

    if (!confirmed) {
      return;
    }

    deleteDispatch(dispatchId);
    setOpenActionId(null);
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

  const formatTime = (timeValue) => {
    if (!timeValue) {
      return "-";
    }

    const [hours, minutes] =
      timeValue.split(":");

    return new Date(
      2000,
      0,
      1,
      Number(hours),
      Number(minutes)
    ).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalQuantity = (dispatch) => {
    return dispatch.items.reduce(
      (total, item) =>
        total + Number(item.quantity),
      0
    );
  };

  return (
    <div className="dashboard-page">
      <Sidebar activePage="dispatch" />

      <main className="dispatch-main">
        <Topbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        <section className="dispatch-title-section">
          <div>
            <h1>Dispatch</h1>

            <p>
              Manage event dispatch operations
            </p>
          </div>

          <button
            type="button"
            className="add-dispatch-button"
            onClick={openAddModal}
          >
            <FiPlus />
            Add New Dispatch
          </button>
        </section>

        <section className="dispatch-table-card">
          <div className="dispatch-table-toolbar">
            <div className="dispatch-tabs">
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

            <div className="dispatch-filters">
              <div className="dispatch-search-box">
                <FiSearch />

                <input
                  type="text"
                  placeholder="Search dispatches..."
                  value={searchValue}
                  onChange={(event) =>
                    setSearchValue(
                      event.target.value
                    )
                  }
                />
              </div>
            </div>
          </div>

          <div className="dispatch-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" />
                  </th>

                  <th>Dispatch ID</th>
                  <th>Event Reference</th>
                  <th>From Warehouse</th>
                  <th>Destination</th>
                  <th>Driver</th>
                  <th>Date & Time</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDispatches.length >
                0 ? (
                  filteredDispatches.map(
                    (dispatch) => (
                      <tr key={dispatch.id}>
                        <td>
                          <input
                            type="checkbox"
                          />
                        </td>

                        <td>
                          <div className="dispatch-name-cell">
                            <div className="dispatch-row-icon">
                              <FiTruck />
                            </div>

                            <strong>
                              {dispatch.id}
                            </strong>
                          </div>
                        </td>

                        <td>
                          {dispatch.eventReference}
                        </td>

                        <td>
                          {
                            dispatch.fromWarehouse
                          }
                        </td>

                        <td>
                          <div className="dispatch-two-lines">
                            <span>
                              {
                                dispatch.toLocation
                              }
                            </span>

                            <span>
                              {dispatch.area}
                            </span>
                          </div>
                        </td>

                        <td>
                          {dispatch.driver}
                        </td>

                        <td>
                          <div className="dispatch-two-lines">
                            <span>
                              {formatDate(
                                dispatch.date
                              )}
                            </span>

                            <span>
                              {formatTime(
                                dispatch.time
                              )}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="dispatch-items-summary">
                            <strong>
                              {dispatch.items.length}{" "}
                              item types
                            </strong>

                            <span>
                              {getTotalQuantity(
                                dispatch
                              ).toLocaleString()}{" "}
                              total qty
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`dispatch-status ${getStatusClass(
                              dispatch.status
                            )}`}
                          >
                            {
                              dispatch.status
                            }
                          </span>
                        </td>

                        <td className="dispatch-action-cell">
                          <div className="dispatch-actions">
                            <button
                              type="button"
                              disabled={
                                dispatch.status ===
                                  "Delivered" ||
                                dispatch.status ===
                                  "Cancelled"
                              }
                              onClick={() =>
                                openEditModal(
                                  dispatch
                                )
                              }
                            >
                              <FiEdit2 />
                            </button>

                            <div className="dispatch-more-wrapper">
                              <button
                                type="button"
                                className="dispatch-more-button"
                                onClick={() =>
                                  setOpenActionId(
                                    (
                                      currentId
                                    ) =>
                                      currentId ===
                                      dispatch.id
                                        ? null
                                        : dispatch.id
                                  )
                                }
                              >
                                <FiMoreVertical />
                              </button>

                              {openActionId ===
                                dispatch.id && (
                                <div className="dispatch-action-menu">
                                  {dispatch.status ===
                                    "Prepared" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleStartDispatch(
                                          dispatch.id
                                        )
                                      }
                                    >
                                      <FiPlay />
                                      Start Dispatch
                                    </button>
                                  )}

                                  {dispatch.status ===
                                    "In Transit" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeliveredDispatch(
                                          dispatch.id
                                        )
                                      }
                                    >
                                      <FiCheckCircle />
                                      Mark Delivered
                                    </button>
                                  )}

                                  {(dispatch.status ===
                                    "Prepared" ||
                                    dispatch.status ===
                                      "In Transit") && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openEditModal(
                                          dispatch
                                        )
                                      }
                                    >
                                      <FiEdit2 />
                                      Edit
                                    </button>
                                  )}

                                  {dispatch.status !==
                                    "Delivered" &&
                                    dispatch.status !==
                                      "Cancelled" && (
                                      <button
                                        type="button"
                                        className="dispatch-cancel-action"
                                        onClick={() =>
                                          handleCancelDispatch(
                                            dispatch.id
                                          )
                                        }
                                      >
                                        <FiX />
                                        Cancel
                                      </button>
                                    )}

                                  <button
                                    type="button"
                                    className="dispatch-delete-action"
                                    onClick={() =>
                                      handleDeleteDispatch(
                                        dispatch.id
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
                      className="dispatch-empty-state"
                    >
                      No dispatches match your
                      search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="dispatch-pagination">
            <p>
              Showing{" "}
              {filteredDispatches.length} of{" "}
              {dispatches.length} dispatches
            </p>

            <div>
              <button type="button">‹</button>
              <button
                type="button"
                className="active"
              >
                1
              </button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button">...</button>
              <button type="button">26</button>
              <button type="button">›</button>
            </div>
          </div>
        </section>
      </main>

      {showDispatchModal && (
        <div
          className="dispatch-modal-overlay"
          onMouseDown={closeModal}
        >
          <form
            className="dispatch-modal"
            onSubmit={handleSaveDispatch}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="dispatch-modal-header">
              <div>
                <h2>
                  {editingDispatchId
                    ? "Edit Dispatch"
                    : "Add New Dispatch"}
                </h2>

                <p>
                  Enter event, destination and item information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
              >
                <FiX />
              </button>
            </div>

            <div className="dispatch-modal-grid">
              <label>
                Event Reference

                <input
                  type="text"
                  name="eventReference"
                  value={formData.eventReference}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                From Warehouse

                <select
                  name="fromWarehouse"
                  value={
                    formData.fromWarehouse
                  }
                  onChange={handleFormChange}
                >
                  <option>
                    Cairo Warehouse
                  </option>

                  <option>
                    Alexandria Warehouse
                  </option>
                </select>
              </label>

              <label>
                Destination / Venue

                <input
                  type="text"
                  name="toLocation"
                  value={
                    formData.toLocation
                  }
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Area

                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Driver

                <input
                  type="text"
                  name="driver"
                  value={formData.driver}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Dispatch Date

                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                />
              </label>

              <label className="dispatch-full-field">
                Dispatch Time

                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleFormChange}
                />
              </label>
            </div>

            <div className="dispatch-items-section">
              <div className="dispatch-items-heading">
                <div>
                  <h3>Items & Quantities</h3>
                  <p>
                    Add the items leaving the selected warehouse.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addItemRow}
                >
                  <FiPlus />
                  Add Item
                </button>
              </div>

              <div className="dispatch-item-rows">
                {formData.items.map(
                  (item, itemIndex) => (
                    <div
                      className="dispatch-item-row"
                      key={itemIndex}
                    >
                      <label>
                        Item

                        <select
                          value={item.name}
                          onChange={(event) =>
                            handleItemChange(
                              itemIndex,
                              "name",
                              event.target.value
                            )
                          }
                        >
                          <option value="">
                            Select item
                          </option>

                          {itemOptions.map(
                            (itemOption) => (
                              <option
                                key={itemOption}
                                value={itemOption}
                              >
                                {itemOption}
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      <label>
                        Quantity

                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) =>
                            handleItemChange(
                              itemIndex,
                              "quantity",
                              event.target.value
                            )
                          }
                          placeholder="100"
                        />
                      </label>

                      <button
                        type="button"
                        className="dispatch-remove-item"
                        onClick={() =>
                          removeItemRow(itemIndex)
                        }
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="dispatch-status-note">
              New dispatches start automatically with the Prepared status.
            </div>

            <div className="dispatch-modal-actions">
              <button
                type="button"
                className="dispatch-cancel-button"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="dispatch-save-button"
              >
                {editingDispatchId
                  ? "Save Changes"
                  : "Save Dispatch"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
