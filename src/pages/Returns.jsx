import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";


import { useDialog } from "../context/DialogContext";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import "../styles/mobile-sidebar-offcanvas.css";

import {
  createReturn,
  getReturnsPageData,
  removeReturn,
  updateReturn,
} from "../services/returnsService";

import "../styles/dashboard.css";
import "../styles/Returns.css";

import {
  FiCornerUpLeft,
  FiPlus,
  FiSearch,
  FiMoreVertical,
  FiX,
  FiTrash2,
  FiEdit2,
} from "react-icons/fi";

const tabs = [
  "All Returns",
  "Has Damage",
  "Has Missing",
];

const getTodayDate = () =>
  new Date().toISOString().split("T")[0];

const createEmptyForm = () => ({
  dispatchId: "",
  dispatchCode: "",
  eventReference: "",
  warehouseId: "",
  warehouse: "",
  returnDate: getTodayDate(),
  returnedBy: "",
  notes: "",
  items: [],
});

function getTotals(items = []) {
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
}

export default function Returns() {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useDialog();


  const {
    hasPermission,
  } = useAuth();

  const canAdd =
    hasPermission(
      "Returns",
      "add"
    );

  const canEdit =
    hasPermission(
      "Returns",
      "edit"
    );

  const canDelete =
    hasPermission(
      "Returns",
      "delete"
    );

  const [returns, setReturns] =
    useState([]);

  const [
    availableDispatches,
    setAvailableDispatches,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

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

  const [
    actionMenuPosition,
    setActionMenuPosition,
  ] = useState({
    top: 0,
    left: 0,
  });

  const [currentPage, setCurrentPage] =
    useState(1);

  const returnsPerPage = 5;

  const [formData, setFormData] =
    useState(createEmptyForm());

  const [
    editingReturnId,
    setEditingReturnId,
  ] = useState(null);

  useEffect(() => {
    loadReturnsData();
  }, []);

  useEffect(() => {
    if (openActionId === null) {
      return undefined;
    }

    const closeActionMenu = (event) => {
      if (
        event?.target instanceof Element &&
        event.target.closest(".return-more-wrapper")
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

  const loadReturnsData = async () => {
    try {
      setLoading(true);

      const data =
        await getReturnsPageData();

      setReturns(data.returns);
      setAvailableDispatches(
        data.availableDispatches
      );
    } catch (error) {
      console.error(
        "Error loading returns:",
        error
      );

      showAlert({
        message: error.message ||
          t("returnsPage.errors.couldNotLoad"),
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredReturns = useMemo(() => {
    const search =
      searchValue.trim().toLowerCase();

    return returns.filter(
      (returnRecord) => {
        const totals = getTotals(
          returnRecord.items
        );

        const matchesSearch =
          search === "" ||
          [
            returnRecord.returnCode,
            returnRecord.dispatchCode,
            returnRecord.eventReference,
            returnRecord.warehouse,
            returnRecord.returnDate,
            returnRecord.returnedBy,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(search)
          );

        const matchesTab =
          activeTab === "All Returns" ||
          (activeTab === "Has Damage" &&
            totals.damaged > 0) ||
          (activeTab === "Has Missing" &&
            totals.missing > 0);

        return matchesSearch && matchesTab;
      }
    );
  }, [
    returns,
    searchValue,
    activeTab,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredReturns.length /
        returnsPerPage
    )
  );

  const paginatedReturns = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      returnsPerPage;

    return filteredReturns.slice(
      startIndex,
      startIndex + returnsPerPage
    );
  }, [
    filteredReturns,
    currentPage,
  ]);

  useEffect(() => {
    setCurrentPage(1);
    setOpenActionId(null);
  }, [
    searchValue,
    activeTab,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const toggleActionMenu = (
    event,
    returnId
  ) => {
    event.stopPropagation();

    if (openActionId === returnId) {
      setOpenActionId(null);
      return;
    }

    const buttonRect =
      event.currentTarget.getBoundingClientRect();

    const menuWidth = 120;
    const menuHeight = 48;
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

    setOpenActionId(returnId);
  };

  const openAddModal = () => {
    const requiredPermission =
      editingReturnId
        ? canEdit
        : canAdd;

    if (!requiredPermission) {
      showAlert({
        title: t("returnsPage.errors.permissionDenied"),
        message: editingReturnId
          ? t("returnsPage.errors.noEditPermission")
          : t("returnsPage.errors.noAddPermission"),
        type: "warning",
      });

      return;
    }

    setEditingReturnId(null);
    setFormData(createEmptyForm());
    setOpenActionId(null);
    setShowReturnModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowReturnModal(false);
    setEditingReturnId(null);
    setFormData(createEmptyForm());
  };

  const handleDispatchChange = (
    event
  ) => {
    const dispatchId =
      event.target.value;

    const selectedDispatch =
      availableDispatches.find(
        (dispatch) =>
          String(dispatch.id) ===
          String(dispatchId)
      );

    if (!selectedDispatch) {
      setFormData(createEmptyForm());
      return;
    }

    setFormData({
      dispatchId:
        selectedDispatch.id,
      dispatchCode:
        selectedDispatch.dispatchCode,
      eventReference:
        selectedDispatch.eventReference,
      warehouseId:
        selectedDispatch.warehouseId,
      warehouse:
        selectedDispatch.warehouse,
      returnDate: getTodayDate(),
      returnedBy: "",
      notes: "",
      items:
        selectedDispatch.items.map(
          (item) => ({
            ...item,
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

  const validateReturnForm = () => {
    if (
      !formData.dispatchId ||
      !formData.returnDate ||
      !formData.returnedBy.trim()
    ) {
      showAlert({
        message: t("returnsPage.errors.completeInfo"),
      });

      return false;
    }

    if (formData.items.length === 0) {
      showAlert({
        message: t("returnsPage.errors.noItems"),
      });

      return false;
    }

    const hasInvalidItem =
      formData.items.some((item) => {
        const goodReturned = Number(
          item.goodReturned || 0
        );
        const damaged = Number(
          item.damaged || 0
        );
        const missing = Number(
          item.missing || 0
        );
        const sent = Number(
          item.dispatchedQuantity || 0
        );

        const valuesAreInvalid =
          !Number.isFinite(goodReturned) ||
          !Number.isFinite(damaged) ||
          !Number.isFinite(missing) ||
          goodReturned < 0 ||
          damaged < 0 ||
          missing < 0;

        return (
          valuesAreInvalid ||
          goodReturned +
            damaged +
            missing !==
            sent
        );
      });

    if (hasInvalidItem) {
      showAlert({
        message: t("returnsPage.errors.quantitiesMustMatch"),
      });

      return false;
    }

    return true;
  };

  const handleSaveReturn = async (
    event
  ) => {
    event.preventDefault();

    if (!canAdd) {
      showAlert({
        title: t("returnsPage.errors.permissionDenied"),
        message:
          t("returnsPage.errors.noAddPermission"),
        type: "warning",
      });

      return;
    }

    if (!validateReturnForm()) {
      return;
    }

    try {
      setSaving(true);

      if (editingReturnId) {
        const updatedReturn =
          await updateReturn(
            editingReturnId,
            formData
          );

        setReturns(
          (currentReturns) =>
            currentReturns.map(
              (returnRecord) =>
                String(returnRecord.id) ===
                String(editingReturnId)
                  ? updatedReturn
                  : returnRecord
            )
        );
      } else {
        const newReturn =
          await createReturn(formData);

        setReturns(
          (currentReturns) => [
            newReturn,
            ...currentReturns,
          ]
        );

        setAvailableDispatches(
          (currentDispatches) =>
            currentDispatches.filter(
              (dispatch) =>
                String(dispatch.id) !==
                String(formData.dispatchId)
            )
        );
      }

      setShowReturnModal(false);
      setEditingReturnId(null);
      setFormData(createEmptyForm());
    } catch (error) {
      console.error(
        "Error creating return:",
        error
      );

      if (error.code === "23505") {
        showAlert({
        message: t("returnsPage.errors.alreadyExists"),
      });
      } else {
        showAlert({
        message: error.message ||
            t("returnsPage.errors.couldNotComplete"),
      });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditReturn = async (
    returnRecord
  ) => {
    if (!canEdit) {
      await showAlert({
        title: t("returnsPage.errors.permissionDenied"),
        message:
          t("returnsPage.errors.noEditPermission"),
        type: "warning",
      });

      return;
    }

    setEditingReturnId(
      returnRecord.id
    );

    setFormData({
      dispatchId:
        returnRecord.dispatchId,
      dispatchCode:
        returnRecord.dispatchCode,
      eventReference:
        returnRecord.eventReference,
      warehouseId:
        returnRecord.warehouseId,
      warehouse:
        returnRecord.warehouse,
      returnDate:
        returnRecord.returnDate,
      returnedBy:
        returnRecord.returnedBy,
      notes:
        returnRecord.notes || "",
      items:
        returnRecord.items.map(
          (item) => ({
            ...item,
            goodReturned:
              String(item.goodReturned),
            damaged:
              String(item.damaged),
            missing:
              String(item.missing),
          })
        ),
    });

    setOpenActionId(null);
    setShowReturnModal(true);
  };

  const handleDeleteReturn = async (
    returnId
  ) => {
    if (!canDelete) {
      showAlert({
        title: t("returnsPage.errors.permissionDenied"),
        message:
          t("returnsPage.errors.noDeletePermission"),
        type: "warning",
      });

      return;
    }

    const confirmed = await showConfirm({
      message: t("returnsPage.confirm.deleteReturn"),
    });

    if (!confirmed) {
      return;
    }

    try {
      await removeReturn(returnId);

      setReturns(
        (currentReturns) =>
          currentReturns.filter(
            (returnRecord) =>
              returnRecord.id !== returnId
          )
      );

      setOpenActionId(null);

      const data =
        await getReturnsPageData();

      setAvailableDispatches(
        data.availableDispatches
      );
    } catch (error) {
      console.error(
        "Error deleting return:",
        error
      );

      showAlert({
        message: error.message ||
          t("returnsPage.errors.couldNotDelete"),
      });
    }
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
            <h1>{t("returnsPage.title")}</h1>

            <p>
              {t("returnsPage.subtitle")}
            </p>
          </div>

          <button
            type="button"
            className="add-return-button"
            onClick={openAddModal}
          >
            <FiPlus />
            {t("returnsPage.receiveReturn")}
          </button>
        </section>

        <section className="returns-table-card">
          <div className="returns-table-toolbar">
            <div className="returns-tabs">
              {tabs.map((tab) => (
                <button
                  key={t(`returnsPage.tabs.${tab}`)}
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
                  {t(`returnsPage.tabs.${tab}`)}
                </button>
              ))}
            </div>

            <div className="returns-search-box">
              <FiSearch />

              <input
                type="text"
                placeholder={t("returnsPage.searchPlaceholder")}
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

                  <th>{t("returnsPage.table.returnId")}</th>
                  <th>{t("returnsPage.table.eventReference")}</th>
                  <th>{t("returnsPage.table.warehouse")}</th>
                  <th>{t("returnsPage.table.returnDate")}</th>
                  <th>{t("returnsPage.table.receivedBy")}</th>
                  <th>{t("returnsPage.table.totalSent")}</th>
                  <th>{t("returnsPage.table.returned")}</th>
                  <th>{t("returnsPage.table.damaged")}</th>
                  <th>{t("returnsPage.table.missing")}</th>
                  <th>{t("returnsPage.table.actions")}</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="returns-empty-state"
                    >
                      {t("returnsPage.loading")}
                    </td>
                  </tr>
                ) : filteredReturns.length >
                  0 ? (
                  paginatedReturns.map(
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
                            <div className="return-name-cell">
                              <div className="return-row-icon">
                                <FiCornerUpLeft />
                              </div>

                              <div>
                                <strong>
                                  {
                                    returnRecord.returnCode
                                  }
                                </strong>

                                <span>
                                  {
                                    returnRecord.dispatchCode
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
                                onClick={() =>
                                  handleEditReturn(
                                    returnRecord
                                  )
                                }
                                aria-label={t("returnsPage.aria.edit", { code: returnRecord.returnCode })}
                              >
                                <FiEdit2 />
                              </button>

                              <div className="return-more-wrapper">
                                <button
                                  type="button"
                                  className="return-more-button"
                                  onClick={(event) =>
                                    toggleActionMenu(
                                      event,
                                      returnRecord.id
                                    )
                                  }
                                  aria-label={t("returnsPage.aria.moreActions", { code: returnRecord.returnCode })}
                                >
                                  <FiMoreVertical />
                                </button>

                                {openActionId ===
                                  returnRecord.id && (
                                  <div
                                    className="return-action-menu"
                                    style={{
                                      top: `${actionMenuPosition.top}px`,
                                      left: `${actionMenuPosition.left}px`,
                                    }}
                                  >
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
                                      {t("returnsPage.actions.delete")}
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
                      colSpan="10"
                      className="returns-empty-state"
                    >
                      {t("returnsPage.noResults")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="returns-pagination">
            <p>
              {t("returnsPage.pagination.showing")}{" "}
              {filteredReturns.length === 0
                ? 0
                : (currentPage - 1) *
                    returnsPerPage +
                  1}
              {" - "}
              {Math.min(
                currentPage *
                  returnsPerPage,
                filteredReturns.length
              )}{" "}
              {t("returnsPage.pagination.of")}{" "}
              {filteredReturns.length} {t("returnsPage.pagination.returns")}
            </p>

            <div>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage(
                    (current) =>
                      Math.max(
                        1,
                        current - 1
                      )
                  )
                }
              >
               ‹
              </button>

              {Array.from(
                {
                  length: totalPages,
                },
                (_, index) =>
                  index + 1
              ).map((pageNumber) => (
                <button
                  key={pageNumber}
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
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                disabled={
                  currentPage === totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (current) =>
                      Math.min(
                        totalPages,
                        current + 1
                      )
                  )
                }
              >
               ›
              </button>
            </div>
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
                <h2>
                  {editingReturnId
                    ? t("returnsPage.modal.editReturn")
                    : t("returnsPage.modal.receiveReturn")}
                </h2>

                <p>
                  {editingReturnId
                    ? t("returnsPage.modal.updateDescription")
                    : t("returnsPage.modal.description")}
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

            <div className="returns-modal-grid">
              <label>
                {t("returnsPage.modal.dispatchReference")}

                <select
                  value={formData.dispatchId}
                  onChange={handleDispatchChange}
                  disabled={
                    saving ||
                    Boolean(editingReturnId)
                  }
                >
                  <option value="">
                    {t("returnsPage.modal.selectDeliveredDispatch")}
                  </option>

                  {editingReturnId &&
                    formData.dispatchId && (
                    <option
                      value={
                        formData.dispatchId
                      }
                    >
                      {formData.dispatchCode}{" "}
                      —{" "}
                      {formData.eventReference}
                    </option>
                  )}

                  {availableDispatches.map(
                    (dispatch) => (
                      <option
                        key={dispatch.id}
                        value={dispatch.id}
                      >
                        {
                          dispatch.dispatchCode
                        }{" "}
                        —{" "}
                        {
                          dispatch.eventReference
                        }
                      </option>
                    )
                  )}
                </select>

                {!editingReturnId &&
                  availableDispatches.length ===
                    0 && (
                  <span className="returns-field-help">
                    {t("returnsPage.modal.noDeliveredDispatch")}
                  </span>
                )}
              </label>

              <label>
                {t("returnsPage.modal.returnDate")}

                <input
                  type="date"
                  name="returnDate"
                  value={formData.returnDate}
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </label>
            </div>

            {formData.dispatchId && (
              <div className="return-dispatch-info">
                <div>
                  <span>{t("returnsPage.modal.eventReference")}</span>
                  <strong>
                    {formData.eventReference}
                  </strong>
                </div>

                <div>
                  <span>{t("returnsPage.modal.returnWarehouse")}</span>
                  <strong>
                    {formData.warehouse}
                  </strong>
                </div>

                <div>
                  <span>
                    {t("returnsPage.modal.dispatchReference")}
                  </span>
                  <strong>
                    {formData.dispatchCode}
                  </strong>
                </div>
              </div>
            )}

            <div className="returns-modal-grid returns-receiver-grid">
              <label>
                {t("returnsPage.modal.receivedBy")}

                <input
                  type="text"
                  name="returnedBy"
                  placeholder={t("returnsPage.modal.employeeName")}
                  value={formData.returnedBy}
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </label>

              <label>
                {t("returnsPage.modal.notes")}

                <textarea
                  name="notes"
                  placeholder={t("returnsPage.modal.optionalNotes")}
                  value={formData.notes}
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </label>
            </div>

            {formData.items.length > 0 && (
              <div className="returned-items-section">
                <div className="returned-items-heading">
                  <h3>{t("returnsPage.modal.returnedItems")}</h3>

                  <p>
                    {t("returnsPage.modal.itemsHelp")}
                  </p>
                </div>

                <div className="returned-items-table">
                  <div className="returned-items-row returned-items-header">
                    <span>{t("returnsPage.modal.item")}</span>
                    <span>{t("returnsPage.modal.sent")}</span>
                    <span>{t("returnsPage.modal.returned")}</span>
                    <span>{t("returnsPage.modal.damaged")}</span>
                    <span>{t("returnsPage.modal.missing")}</span>
                  </div>

                  {formData.items.map(
                    (item, itemIndex) => (
                      <div
                        className="returned-items-row"
                        key={
                          item.dispatchItemId
                        }
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
                          disabled={saving}
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
                          disabled={saving}
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
                          disabled={saving}
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
                            {t("returnsPage.modal.totalSent")}
                          </span>
                          <strong>
                            {
                              totals.dispatched
                            }
                          </strong>
                        </div>

                        <div>
                          <span>{t("returnsPage.modal.returned")}</span>
                          <strong>
                            {
                              totals.goodReturned
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            {t("returnsPage.modal.damaged")}
                          </span>
                          <strong>
                            {
                              totals.damaged
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            {t("returnsPage.modal.missing")}
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
                disabled={saving}
              >
                {t("returnsPage.actions.cancel")}
              </button>

              <button
                type="submit"
                className="returns-save-button"
                disabled={
                  saving ||
                  !formData.dispatchId ||
                  (editingReturnId
                    ? !canEdit
                    : !canAdd)
                }
              >
                {saving
                  ? t("returnsPage.actions.saving")
                  : editingReturnId
                    ? t("returnsPage.actions.updateReturn")
                    : t("returnsPage.actions.completeReturn")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}