import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";


import { useDialog } from "../context/DialogContext";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import "../styles/mobile-sidebar-offcanvas.css";

import {
  createDispatch,
  getDispatchPageData,
  getWarehouseItems,
  removeDispatch,
  updateDispatch,
  updateDispatchStatus,
} from "../services/dispatchService";

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

const getTodayDate = () =>
  new Date().toISOString().split("T")[0];

const createEmptyItem = () => ({
  itemId: "",
  quantity: "",
});

const createEmptyForm = () => ({
  eventId: "",
  warehouseId: "",
  toLocation: "",
  area: "",
  driverId: "",
  date: getTodayDate(),
  time: "",
  items: [createEmptyItem()],
});

export default function Dispatch() {
  const { showAlert, showConfirm } = useDialog();


  const { hasPermission } = useAuth();

  const canAdd = hasPermission("Dispatch", "add");
  const canEdit = hasPermission("Dispatch", "edit");
  const canDelete = hasPermission("Dispatch", "delete");

  const [dispatches, setDispatches] =
    useState([]);

  const [events, setEvents] =
    useState([]);

  const [warehouses, setWarehouses] =
    useState([]);

  const [drivers, setDrivers] =
    useState([]);

  const [itemOptions, setItemOptions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    loadingItems,
    setLoadingItems,
  ] = useState(false);

  const [searchValue, setSearchValue] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 5;

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

  const [
    actionMenuPosition,
    setActionMenuPosition,
  ] = useState({
    top: 0,
    left: 0,
  });

  const [formData, setFormData] =
    useState(createEmptyForm());

  useEffect(() => {
    loadDispatchData();
  }, []);

  useEffect(() => {
    if (openActionId === null) {
      return undefined;
    }

    const closeActionMenu = (event) => {
      if (
        event?.target instanceof Element &&
        event.target.closest(
          ".dispatch-more-wrapper"
        )
      ) {
        return;
      }

      setOpenActionId(null);
    };

    const closeOnPageMove = () => {
      setOpenActionId(null);
    };

    document.addEventListener(
      "mousedown",
      closeActionMenu
    );

    window.addEventListener(
      "scroll",
      closeOnPageMove,
      true
    );

    window.addEventListener(
      "resize",
      closeOnPageMove
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeActionMenu
      );

      window.removeEventListener(
        "scroll",
        closeOnPageMove,
        true
      );

      window.removeEventListener(
        "resize",
        closeOnPageMove
      );
    };
  }, [openActionId]);

  const loadDispatchData = async () => {
    try {
      setLoading(true);

      const data =
        await getDispatchPageData();

      setDispatches(data.dispatches);
      setEvents(data.events);
      setWarehouses(data.warehouses);
      setDrivers(data.drivers);
    } catch (error) {
      console.error(
        "Error loading dispatches:",
        error
      );

      showAlert({
        message: error.message ||
          "Could not load dispatches.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouseItems = async (
    warehouseId
  ) => {
    if (!warehouseId) {
      setItemOptions([]);
      return;
    }

    try {
      setLoadingItems(true);

      const items =
        await getWarehouseItems(
          warehouseId
        );

      setItemOptions(items);
    } catch (error) {
      console.error(
        "Error loading warehouse items:",
        error
      );

      showAlert({
        message: error.message ||
          "Could not load warehouse items.",
      });
    } finally {
      setLoadingItems(false);
    }
  };

  const filteredDispatches = useMemo(() => {
    const search =
      searchValue.trim().toLowerCase();

    return dispatches.filter((dispatch) => {
      const itemSearchValues =
        dispatch.items.flatMap((item) => [
          item.name,
          item.itemCode,
          item.quantity,
        ]);

      const matchesSearch =
        search === "" ||
        [
          dispatch.dispatchCode,
          dispatch.eventReference,
          dispatch.fromWarehouse,
          dispatch.toLocation,
          dispatch.area,
          dispatch.driver,
          dispatch.date,
          dispatch.status,
          ...itemSearchValues,
        ].some((value) =>
          String(value || "")
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

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredDispatches.length /
        itemsPerPage
    )
  );

  const paginatedDispatches =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        itemsPerPage;

      return filteredDispatches.slice(
        startIndex,
        startIndex +
          itemsPerPage
      );
    }, [
      filteredDispatches,
      currentPage,
    ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchValue,
    activeTab,
  ]);

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const firstVisibleDispatch =
    filteredDispatches.length === 0
      ? 0
      : (currentPage - 1) *
          itemsPerPage +
        1;

  const lastVisibleDispatch = Math.min(
    currentPage * itemsPerPage,
    filteredDispatches.length
  );

  const toggleActionMenu = (
    clickEvent,
    dispatchId
  ) => {
    clickEvent.stopPropagation();

    if (openActionId === dispatchId) {
      setOpenActionId(null);
      return;
    }

    const buttonRect =
      clickEvent.currentTarget
        .getBoundingClientRect();

    const menuWidth = 150;
    const menuHeight = 180;
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
      buttonRect.right - menuWidth;

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

    setOpenActionId(dispatchId);
  };

  const handleFormChange = async (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    if (name === "eventId") {
      const selectedEvent = events.find(
        (currentEvent) =>
          String(currentEvent.id) ===
          String(value)
      );

      setFormData((currentData) => ({
        ...currentData,
        eventId: value,
        toLocation:
          selectedEvent?.location ||
          currentData.toLocation,
        area:
          selectedEvent?.area ||
          currentData.area,
        driverId:
          selectedEvent?.driver_id ||
          currentData.driverId,
        date:
          selectedEvent?.event_date ||
          currentData.date,
        time:
          selectedEvent?.departure_time ||
          currentData.time,
      }));

      return;
    }

    if (name === "warehouseId") {
      setFormData((currentData) => ({
        ...currentData,
        warehouseId: value,
        items: [createEmptyItem()],
      }));

      await loadWarehouseItems(value);
      return;
    }

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
    if (!canAdd) {
      showAlert({
        message: "You do not have permission to add dispatches.",
      });
      return;
    }

    setEditingDispatchId(null);
    setOpenActionId(null);
    setItemOptions([]);
    setFormData(createEmptyForm());
    setShowDispatchModal(true);
  };

  const openEditModal = async (
    dispatch
  ) => {
    if (!canEdit) {
      showAlert({
        message: "You do not have permission to edit dispatches.",
      });
      return;
    }

    setEditingDispatchId(dispatch.id);

    setFormData({
      eventId: String(
        dispatch.eventId || ""
      ),
      warehouseId: String(
        dispatch.warehouseId || ""
      ),
      toLocation: dispatch.toLocation,
      area: dispatch.area,
      driverId: String(
        dispatch.driverId || ""
      ),
      date: dispatch.date,
      time: dispatch.time,
      items: dispatch.items.map((item) => ({
        itemId: String(item.itemId),
        quantity: item.quantity,
      })),
    });

    setOpenActionId(null);
    await loadWarehouseItems(
      dispatch.warehouseId
    );
    setShowDispatchModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowDispatchModal(false);
    setEditingDispatchId(null);
    setItemOptions([]);
    setFormData(createEmptyForm());
  };

  const validateDispatchForm = () => {
    const requiredFields = [
      "eventId",
      "warehouseId",
      "toLocation",
      "area",
      "driverId",
      "date",
      "time",
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
        message: "Please complete all dispatch fields.",
      });
      return null;
    }

    const validItems =
      formData.items.filter(
        (item) =>
          String(item.itemId).trim() !==
            "" &&
          Number(item.quantity) > 0
      );

    if (validItems.length === 0) {
      showAlert({
        message: "Please add at least one item with a valid quantity.",
      });
      return null;
    }

    const itemIds = validItems.map(
      (item) => String(item.itemId)
    );

    const hasDuplicateItems =
      itemIds.some(
        (itemId, index) =>
          itemIds.indexOf(itemId) !== index
      );

    if (hasDuplicateItems) {
      showAlert({
        message: "The same item cannot be added more than once.",
      });
      return null;
    }

    const hasInvalidQuantity =
      validItems.some((item) => {
        const selectedItem =
          itemOptions.find(
            (option) =>
              String(option.id) ===
              String(item.itemId)
          );

        return (
          !selectedItem ||
          Number(item.quantity) >
            selectedItem.availableQuantity
        );
      });

    if (hasInvalidQuantity) {
      showAlert({
        message: "One or more quantities exceed the available stock.",
      });
      return null;
    }

    return {
      ...formData,
      items: validItems,
    };
  };

  const handleSaveDispatch = async (
    event
  ) => {
    event.preventDefault();

    const requiredPermission =
      editingDispatchId
        ? canEdit
        : canAdd;

    if (!requiredPermission) {
      await showAlert({
        title: "Permission Denied",
        message: editingDispatchId
          ? "You do not have permission to edit dispatches."
          : "You do not have permission to add dispatches.",
        type: "warning",
      });

      return;
    }

    const normalizedData =
      validateDispatchForm();

    if (!normalizedData) {
      return;
    }

    try {
      setSaving(true);

      if (editingDispatchId) {
        const updatedDispatch =
          await updateDispatch(
            editingDispatchId,
            normalizedData
          );

        setDispatches(
          (currentDispatches) =>
            currentDispatches.map(
              (dispatch) =>
                dispatch.id ===
                editingDispatchId
                  ? updatedDispatch
                  : dispatch
            )
        );
      } else {
        const newDispatch =
          await createDispatch(
            normalizedData
          );

        setDispatches(
          (currentDispatches) => [
            newDispatch,
            ...currentDispatches,
          ]
        );
      }

      setShowDispatchModal(false);
      setEditingDispatchId(null);
      setItemOptions([]);
      setFormData(createEmptyForm());
    } catch (error) {
      console.error(
        "Error saving dispatch:",
        error
      );

      showAlert({
        message: error.message ||
          "Could not save dispatch.",
      });
    } finally {
      setSaving(false);
    }
  };

  const changeDispatchStatus = async (
    dispatchId,
    status
  ) => {
    try {
      const updatedDispatch =
        await updateDispatchStatus(
          dispatchId,
          status
        );

      setDispatches(
        (currentDispatches) =>
          currentDispatches.map(
            (dispatch) =>
              dispatch.id === dispatchId
                ? updatedDispatch
                : dispatch
          )
      );

      setOpenActionId(null);
    } catch (error) {
      console.error(
        "Error changing dispatch status:",
        error
      );

      showAlert({
        message: error.message ||
          "Could not update dispatch status.",
      });
    }
  };

  const handleCancelDispatch = async (
    dispatchId
  ) => {
    if (!canEdit) {
      await showAlert({
        title: "Permission Denied",
        message:
          "You do not have permission to edit dispatches.",
        type: "warning",
      });

      return;
    }
    const confirmed = await showConfirm({
      message: "Are you sure you want to cancel this dispatch?",
    });

    if (!confirmed) {
      return;
    }

    changeDispatchStatus(
      dispatchId,
      "Cancelled"
    );
  };

  const handleDeleteDispatch = async (
    dispatchId
  ) => {
    if (!canDelete) {
      showAlert({
        message: "You do not have permission to delete dispatches.",
      });
      return;
    }

    const confirmed = await showConfirm({
      message: "Are you sure you want to delete this dispatch?",
    });

    if (!confirmed) {
      return;
    }

    try {
      await removeDispatch(dispatchId);

      setDispatches(
        (currentDispatches) =>
          currentDispatches.filter(
            (dispatch) =>
              dispatch.id !== dispatchId
          )
      );

      setOpenActionId(null);
    } catch (error) {
      console.error(
        "Error deleting dispatch:",
        error
      );

      if (error.code === "23503") {
        showAlert({
        message: "This dispatch cannot be deleted because it is connected to a return.",
      });
      } else {
        showAlert({
        message: error.message ||
            "Could not delete dispatch.",
      });
      }
    }
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

  const getTotalQuantity = (dispatch) =>
    dispatch.items.reduce(
      (total, item) =>
        total + Number(item.quantity),
      0
    );

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
                {loading ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="dispatch-empty-state"
                    >
                      Loading dispatches...
                    </td>
                  </tr>
                ) : filteredDispatches.length >
                  0 ? (
                  paginatedDispatches.map(
                    (dispatch) => (
                      <tr key={dispatch.id}>

                        <td>
                          <div className="dispatch-name-cell">
                            <div className="dispatch-row-icon">
                              <FiTruck />
                            </div>

                            <strong>
                              {
                                dispatch.dispatchCode
                              }
                            </strong>
                          </div>
                        </td>

                        <td>
                          {
                            dispatch.eventReference
                          }
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
                          {dispatch.driver ||
                            "-"}
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
                              {
                                dispatch.items
                                  .length
                              }{" "}
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
                                onClick={(
                                  clickEvent
                                ) =>
                                  toggleActionMenu(
                                    clickEvent,
                                    dispatch.id
                                  )
                                }
                              >
                                <FiMoreVertical />
                              </button>

                              {openActionId ===
                                dispatch.id && (
                                <div
                                  className="dispatch-action-menu"
                                  style={{
                                    top:
                                      actionMenuPosition.top,
                                    left:
                                      actionMenuPosition.left,
                                  }}
                                >
                                  {dispatch.status ===
                                    "Prepared" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        changeDispatchStatus(
                                          dispatch.id,
                                          "In Transit"
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
                                        changeDispatchStatus(
                                          dispatch.id,
                                          "Delivered"
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
                      colSpan="9"
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
              {firstVisibleDispatch} to{" "}
              {lastVisibleDispatch} of{" "}
              {filteredDispatches.length} dispatches
            </p>

            {filteredDispatches.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (current) =>
                        Math.max(
                          current - 1,
                          1
                        )
                    )
                  }
                  disabled={
                    currentPage === 1
                  }
                  aria-label="Previous page"
                >
                   ‹
                </button>

                {Array.from(
                  {
                    length:
                      totalPages,
                  },
                  (_, index) =>
                    index + 1
                ).map(
                  (pageNumber) => (
                    <button
                      key={
                        pageNumber
                      }
                      type="button"
                      className={
                        currentPage ===
                        pageNumber
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setCurrentPage(
                          pageNumber
                        )
                      }
                      aria-current={
                        currentPage ===
                        pageNumber
                          ? "page"
                          : undefined
                      }
                    >
                      {pageNumber}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (current) =>
                        Math.min(
                          current + 1,
                          totalPages
                        )
                    )
                  }
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  aria-label="Next page"
                >
                   ›
                </button>
              </div>
            )}
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
                disabled={saving}
              >
                <FiX />
              </button>
            </div>

            <div className="dispatch-modal-grid">
              <label>
                Event Reference

                <select
                  name="eventId"
                  value={formData.eventId}
                  onChange={handleFormChange}
                  disabled={saving}
                >
                  <option value="">
                    Select event
                  </option>

                  {events.map((event) => (
                    <option
                      key={event.id}
                      value={event.id}
                    >
                      {event.event_code} -{" "}
                      {event.event_type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                From Warehouse

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
                Destination / Venue

                <input
                  type="text"
                  name="toLocation"
                  value={
                    formData.toLocation
                  }
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </label>

              <label>
                Area

                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </label>

              <label>
                Driver

                <select
                  name="driverId"
                  value={formData.driverId}
                  onChange={handleFormChange}
                  disabled={saving}
                >
                  <option value="">
                    Select driver
                  </option>

                  {drivers.map((driver) => (
                    <option
                      key={driver.id}
                      value={driver.id}
                    >
                      {driver.full_name}
                      {driver.staff_code
                        ? ` (${driver.staff_code})`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Dispatch Date

                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </label>

              <label className="dispatch-full-field">
                Dispatch Time

                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </label>
            </div>

            <div className="dispatch-items-section">
              <div className="dispatch-items-heading">
                <div>
                  <h3>
                    Items & Quantities
                  </h3>

                  <p>
                    Add the items leaving the selected warehouse.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addItemRow}
                  disabled={
                    saving ||
                    !formData.warehouseId
                  }
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
                          value={item.itemId}
                          onChange={(event) =>
                            handleItemChange(
                              itemIndex,
                              "itemId",
                              event.target.value
                            )
                          }
                          disabled={
                            saving ||
                            loadingItems ||
                            !formData.warehouseId
                          }
                        >
                          <option value="">
                            {loadingItems
                              ? "Loading items..."
                              : "Select item"}
                          </option>

                          {itemOptions.map(
                            (itemOption) => (
                              <option
                                key={
                                  itemOption.id
                                }
                                value={
                                  itemOption.id
                                }
                              >
                                {
                                  itemOption.name
                                }{" "}
                                (
                                {
                                  itemOption.availableQuantity
                                }{" "}
                                available)
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
                          disabled={saving}
                        />
                      </label>

                      <button
                        type="button"
                        className="dispatch-remove-item"
                        onClick={() =>
                          removeItemRow(
                            itemIndex
                          )
                        }
                        disabled={saving}
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
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="dispatch-save-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingDispatchId
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