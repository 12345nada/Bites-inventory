import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";


import { useDialog } from "../context/DialogContext";
import Sidebar from "../components/dashboard/Sidebar";
import "../styles/mobile-sidebar-offcanvas.css";
import Topbar from "../components/dashboard/Topbar";

import {
  getDispatchReportRows,
  getInventoryReportRows,
  getPurchaseReportRows,
  getReportsData,
  getReturnsReportRows,
} from "../services/reportsService";

import "../styles/dashboard.css";
import "../styles/Reports.css";

import {
  FiFileText,
  FiSearch,
  FiDownload,
  FiFilter,
  FiChevronDown,
} from "react-icons/fi";

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(
    `${dateValue}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const reportTitles = {
  inventory: "Inventory Report",
  purchases: "Purchase Report",
  dispatches: "Dispatch Report",
  returns: "Returns Report",
};

export default function Reports() {
  const { t } = useTranslation();
  const { showAlert } = useDialog();


  const { hasPermission } = useAuth();

  const canAdd = hasPermission("Reports", "add");
  const canEdit = hasPermission("Reports", "edit");
  const canDelete = hasPermission("Reports", "delete");

  const [inventory, setInventory] =
    useState([]);

  const [purchases, setPurchases] =
    useState([]);

  const [dispatches, setDispatches] =
    useState([]);

  const [returns, setReturns] =
    useState([]);

  const [warehouses, setWarehouses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [searchValue, setSearchValue] =
    useState("");

  const [reportType, setReportType] =
    useState("inventory");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [
    selectedWarehouse,
    setSelectedWarehouse,
  ] = useState("All Warehouses");

  const [status, setStatus] =
    useState("All Statuses");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [
    isExportMenuOpen,
    setIsExportMenuOpen,
  ] = useState(false);

  const exportMenuRef =
    useRef(null);

  const rowsPerPage = 5;

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (
      event
    ) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(
          event.target
        )
      ) {
        setIsExportMenuOpen(
          false
        );
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);

      const data =
        await getReportsData();

      setInventory(data.inventory);
      setPurchases(data.purchases);
      setDispatches(data.dispatches);
      setReturns(data.returns);
      setWarehouses(data.warehouses);
    } catch (error) {
      console.error(
        "Error loading reports:",
        error
      );

      showAlert({
        message: error.message ||
          t("reportsPage.errors.couldNotLoad"),
      });
    } finally {
      setLoading(false);
    }
  };

  const reportConfig = useMemo(() => {
    if (reportType === "inventory") {
      return {
        title: t("reportsPage.types.inventory"),
        columns: [
          t("reportsPage.columns.itemCode"),
          t("reportsPage.columns.item"),
          t("reportsPage.columns.category"),
          t("reportsPage.columns.warehouse"),
          t("reportsPage.columns.available"),
          t("reportsPage.columns.damaged"),
          t("reportsPage.columns.missing"),
          t("reportsPage.columns.minimumStock"),
          t("reportsPage.columns.stockLevel"),
        ],
        rows:
          getInventoryReportRows(
            inventory
          ),
      };
    }

    if (reportType === "purchases") {
      return {
        title: t("reportsPage.types.purchases"),
        columns: [
          t("reportsPage.columns.poNumber"),
          t("reportsPage.columns.supplier"),
          t("reportsPage.columns.item"),
          t("reportsPage.columns.warehouse"),
          t("reportsPage.columns.quantity"),
          t("reportsPage.columns.totalAmount"),
          t("reportsPage.columns.orderDate"),
          t("reportsPage.columns.status"),
        ],
        rows:
          getPurchaseReportRows(
            purchases
          ),
      };
    }

    if (reportType === "dispatches") {
      return {
        title: t("reportsPage.types.dispatches"),
        columns: [
          t("reportsPage.columns.dispatchId"),
          t("reportsPage.columns.eventReference"),
          t("reportsPage.columns.warehouse"),
          t("reportsPage.columns.destination"),
          t("reportsPage.columns.driver"),
          t("reportsPage.columns.date"),
          t("reportsPage.columns.totalQuantity"),
          t("reportsPage.columns.status"),
        ],
        rows:
          getDispatchReportRows(
            dispatches
          ),
      };
    }

    return {
      title: t("reportsPage.types.returns"),
      columns: [
        t("reportsPage.columns.returnId"),
        t("reportsPage.columns.eventReference"),
        t("reportsPage.columns.warehouse"),
        t("reportsPage.columns.returnDate"),
        t("reportsPage.columns.receivedBy"),
        t("reportsPage.columns.totalSent"),
        t("reportsPage.columns.returned"),
        t("reportsPage.columns.damaged"),
        t("reportsPage.columns.missing"),
      ],
      rows:
        getReturnsReportRows(returns),
    };
  }, [
    reportType,
    inventory,
    purchases,
    dispatches,
    returns,
    t,
  ]);

  const statusOptions = useMemo(() => {
    if (reportType === "inventory") {
      return [
        "All Statuses",
        "In Stock",
        "Low Stock",
      ];
    }

    if (reportType === "purchases") {
      return [
        "All Statuses",
        "Pending",
        "Approved",
        "Received",
        "Cancelled",
      ];
    }

    if (reportType === "dispatches") {
      return [
        "All Statuses",
        "Prepared",
        "In Transit",
        "Delivered",
        "Cancelled",
      ];
    }

    return [
      "All Statuses",
      "Clear",
      "Has Damage",
      "Has Missing",
    ];
  }, [reportType]);

  const filteredRows = useMemo(() => {
    const normalizedSearch =
      searchValue.trim().toLowerCase();

    return reportConfig.rows.filter(
      (row) => {
        const matchesSearch =
          normalizedSearch === "" ||
          row.searchValues.some(
            (value) =>
              String(value || "")
                .toLowerCase()
                .includes(
                  normalizedSearch
                )
          );

        const matchesWarehouse =
          selectedWarehouse ===
            "All Warehouses" ||
          String(row.warehouseId) ===
            String(selectedWarehouse);

        const matchesStatus =
          status === "All Statuses" ||
          row.status === status;

        const matchesFromDate =
          !fromDate ||
          !row.date ||
          row.date >= fromDate;

        const matchesToDate =
          !toDate ||
          !row.date ||
          row.date <= toDate;

        return (
          matchesSearch &&
          matchesWarehouse &&
          matchesStatus &&
          matchesFromDate &&
          matchesToDate
        );
      }
    );
  }, [
    reportConfig,
    searchValue,
    selectedWarehouse,
    status,
    fromDate,
    toDate,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRows.length / rowsPerPage
    )
  );

  const paginatedRows = useMemo(() => {
    const startIndex =
      (currentPage - 1) * rowsPerPage;

    return filteredRows.slice(
      startIndex,
      startIndex + rowsPerPage
    );
  }, [
    filteredRows,
    currentPage,
  ]);

  const firstVisibleRecord =
    filteredRows.length === 0
      ? 0
      : (currentPage - 1) *
          rowsPerPage +
        1;

  const lastVisibleRecord = Math.min(
    currentPage * rowsPerPage,
    filteredRows.length
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    reportType,
    searchValue,
    selectedWarehouse,
    status,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const handleReportTypeChange = (
    event
  ) => {
    setReportType(event.target.value);
    setStatus("All Statuses");
    setFromDate("");
    setToDate("");
  };

  const resetFilters = () => {
    setSearchValue("");
    setFromDate("");
    setToDate("");
    setSelectedWarehouse(
      "All Warehouses"
    );
    setStatus("All Statuses");
  };

  const getExportCells = (row) => {
    if (reportType === "inventory") {
      return row.cells;
    }

    return row.cells.map(
      (cell, index) => {
        const isDateColumn =
          (reportType ===
            "purchases" &&
            index === 6) ||
          (reportType ===
            "dispatches" &&
            index === 5) ||
          (reportType ===
            "returns" &&
            index === 3);

        return isDateColumn
          ? formatDate(cell)
          : cell;
      }
    );
  };

  const exportPdf = async () => {
    if (!canAdd) {
      await showAlert({
        title: t("reportsPage.errors.permissionDenied"),
        message:
          t("reportsPage.errors.noExportPermission"),
        type: "warning",
      });

      return;
    }

    if (filteredRows.length === 0) {
      showAlert({
        message: t("reportsPage.errors.noDataExport"),
      });
      return;
    }

    const document = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    document.setFontSize(18);
    document.text(
      reportConfig.title,
      14,
      16
    );

    document.setFontSize(9);

    const selectedWarehouseName =
      warehouses.find(
        (warehouse) =>
          String(warehouse.id) ===
          String(selectedWarehouse)
      )?.name;

    const filterText = [
      fromDate
        ? `From: ${formatDate(fromDate)}`
        : "",
      toDate
        ? `To: ${formatDate(toDate)}`
        : "",
      selectedWarehouse !==
      "All Warehouses"
        ? `Warehouse: ${
            selectedWarehouseName ||
            selectedWarehouse
          }`
        : "",
      status !== "All Statuses"
        ? `Status: ${status}`
        : "",
    ]
      .filter(Boolean)
      .join(" | ");

    document.text(
      filterText ||
        "All available records",
      14,
      23
    );

    autoTable(document, {
      startY: 28,
      head: [reportConfig.columns],
      body: filteredRows.map(
        getExportCells
      ),
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [113, 48, 6],
        textColor: [255, 255, 255],
      },
      alternateRowStyles: {
        fillColor: [255, 248, 242],
      },
      margin: {
        left: 10,
        right: 10,
      },
    });

    document.save(
      `${reportConfig.title
        .toLowerCase()
        .replace(/\s+/g, "-")}.pdf`
    );
  };

  const exportExcel = async () => {
    if (!canAdd) {
      await showAlert({
        title: t("reportsPage.errors.permissionDenied"),
        message:
          t("reportsPage.errors.noExportPermission"),
        type: "warning",
      });

      return;
    }

    if (filteredRows.length === 0) {
      await showAlert({
        message:
          t("reportsPage.errors.noDataExport"),
      });

      return;
    }

    const worksheetRows =
      filteredRows.map((row) => {
        const cells =
          getExportCells(row);

        return Object.fromEntries(
          reportConfig.columns.map(
            (column, index) => [
              column,
              cells[index] ?? "",
            ]
          )
        );
      });

    const worksheet =
      XLSX.utils.json_to_sheet(
        worksheetRows,
        {
          header:
            reportConfig.columns,
        }
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      reportConfig.title
        .replace(
          /[\\/?*\[\]:]/g,
          ""
        )
        .slice(0, 31)
    );

    const fileName =
      `${reportConfig.title
        .toLowerCase()
        .replace(
          /\s+/g,
          "-"
        )}.xlsx`;

    XLSX.writeFile(
      workbook,
      fileName
    );
  };

  const handleExport = async (
    type
  ) => {
    setIsExportMenuOpen(false);

    if (type === "pdf") {
      await exportPdf();
      return;
    }

    await exportExcel();
  };

  const renderCell = (
    cell,
    cellIndex
  ) => {
    const isDateColumn =
      (reportType === "purchases" &&
        cellIndex === 6) ||
      (reportType === "dispatches" &&
        cellIndex === 5) ||
      (reportType === "returns" &&
        cellIndex === 3);

    return isDateColumn
      ? formatDate(cell)
      : cell;
  };

  return (
    <div className="dashboard-page">
      <Sidebar activePage="reports" />

      <main className="reports-main">
        <Topbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        <section className="reports-title-section">
          <div>
            <h1>{t("reportsPage.title")}</h1>

            <p>
              {t("reportsPage.subtitle")}
            </p>
          </div>

          <div
            className="reports-export-wrapper"
            ref={exportMenuRef}
          >
            <button
              type="button"
              className="export-pdf-button reports-export-button"
              onClick={() =>
                setIsExportMenuOpen(
                  (current) =>
                    !current
                )
              }
              disabled={loading}
              aria-haspopup="menu"
              aria-expanded={
                isExportMenuOpen
              }
            >
              <FiDownload />
              {t("reportsPage.export")}
              <FiChevronDown
                className={
                  isExportMenuOpen
                    ? "open"
                    : ""
                }
              />
            </button>

            {isExportMenuOpen && (
              <div
                className="reports-export-menu"
                role="menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() =>
                    handleExport(
                      "pdf"
                    )
                  }
                >
                  {t("reportsPage.exportPdf")}
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() =>
                    handleExport(
                      "excel"
                    )
                  }
                >
                  {t("reportsPage.exportExcel")}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="reports-filter-card">
          <div className="reports-filter-title">
            <FiFilter />

            <div>
              <h3>{t("reportsPage.filters.title")}</h3>

              <p>
                {t("reportsPage.filters.subtitle")}
              </p>
            </div>
          </div>

          <div className="reports-filter-grid">
            <label>
              {t("reportsPage.filters.reportType")}

              <select
                value={reportType}
                onChange={
                  handleReportTypeChange
                }
                disabled={loading}
              >
                <option value="inventory">
                  {t("reportsPage.types.inventory")}
                </option>

                <option value="purchases">
                  {t("reportsPage.types.purchases")}
                </option>

                <option value="dispatches">
                  {t("reportsPage.types.dispatches")}
                </option>

                <option value="returns">
                  {t("reportsPage.types.returns")}
                </option>
              </select>
            </label>

            <label>
              {t("reportsPage.filters.fromDate")}

              <input
                type="date"
                value={fromDate}
                disabled={
                  loading ||
                  reportType ===
                    "inventory"
                }
                onChange={(event) =>
                  setFromDate(
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              {t("reportsPage.filters.toDate")}

              <input
                type="date"
                value={toDate}
                disabled={
                  loading ||
                  reportType ===
                    "inventory"
                }
                onChange={(event) =>
                  setToDate(
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              {t("reportsPage.filters.warehouse")}

              <select
                value={selectedWarehouse}
                onChange={(event) =>
                  setSelectedWarehouse(
                    event.target.value
                  )
                }
                disabled={loading}
              >
                <option value="All Warehouses">
                  {t("reportsPage.filters.allWarehouses")}
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
              {t("reportsPage.filters.status")}

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                disabled={loading}
              >
                {statusOptions.map(
                  (statusOption) => (
                    <option
                      key={statusOption}
                      value={statusOption}
                    >
                      {t(`reportsPage.statuses.${statusOption}`)}
                    </option>
                  )
                )}
              </select>
            </label>

            <button
              type="button"
              className="reset-report-button"
              onClick={resetFilters}
              disabled={loading}
            >
              {t("reportsPage.filters.reset")}
            </button>
          </div>
        </section>

        <section className="report-result-card">
          <div className="report-result-toolbar">
            <div>
              <div className="report-result-heading">
                <FiFileText />

                <h2>
                  {reportConfig.title}
                </h2>
              </div>

              <p>
                {t("reportsPage.showingRange", {
                  from: firstVisibleRecord,
                  to: lastVisibleRecord,
                  total: filteredRows.length,
                })}
              </p>
            </div>

            <div className="report-search-box">
              <FiSearch />

              <input
                type="text"
                placeholder={t("reportsPage.search")}
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(
                    event.target.value
                  )
                }
                disabled={loading}
              />
            </div>
          </div>

          <div className="report-table-wrapper">
            <table>
              <thead>
                <tr>
                  {reportConfig.columns.map(
                    (column) => (
                      <th key={column}>
                        {column}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={
                        reportConfig.columns
                          .length
                      }
                      className="report-empty-state"
                    >
                      {t("reportsPage.loading")}
                    </td>
                  </tr>
                ) : filteredRows.length > 0 ? (
                  paginatedRows.map(
                    (row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.cells.map(
                          (
                            cell,
                            cellIndex
                          ) => (
                            <td
                              key={`${rowIndex}-${cellIndex}`}
                            >
                              {renderCell(
                                cell,
                                cellIndex
                              )}
                            </td>
                          )
                        )}
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={
                        reportConfig.columns
                          .length
                      }
                      className="report-empty-state"
                    >
                      {t("reportsPage.noRecords")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="report-result-footer">
            <p>
              {t("reportsPage.showingRange", {
                from: firstVisibleRecord,
                to: lastVisibleRecord,
                total: filteredRows.length,
              })}
            </p>

            <div>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage(
                    (current) =>
                      Math.max(1, current - 1)
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
                  setCurrentPage(
                    (current) =>
                      Math.min(
                        totalPages,
                        current + 1
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
    </div>
  );
}