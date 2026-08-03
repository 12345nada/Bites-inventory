import {
  useEffect,
  useMemo,
  useState,
} from "react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { useAuth } from "../context/AuthContext";


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

  const rowsPerPage = 5;

  useEffect(() => {
    loadReports();
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
          "Could not load report data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const reportConfig = useMemo(() => {
    if (reportType === "inventory") {
      return {
        title: reportTitles.inventory,
        columns: [
          "Item Code",
          "Item",
          "Category",
          "Warehouse",
          "Available",
          "Damaged",
          "Missing",
          "Minimum Stock",
          "Stock Level",
        ],
        rows:
          getInventoryReportRows(
            inventory
          ),
      };
    }

    if (reportType === "purchases") {
      return {
        title: reportTitles.purchases,
        columns: [
          "PO Number",
          "Supplier",
          "Item",
          "Warehouse",
          "Quantity",
          "Total Amount",
          "Order Date",
          "Status",
        ],
        rows:
          getPurchaseReportRows(
            purchases
          ),
      };
    }

    if (reportType === "dispatches") {
      return {
        title: reportTitles.dispatches,
        columns: [
          "Dispatch ID",
          "Event Reference",
          "Warehouse",
          "Destination",
          "Driver",
          "Date",
          "Total Quantity",
          "Status",
        ],
        rows:
          getDispatchReportRows(
            dispatches
          ),
      };
    }

    return {
      title: reportTitles.returns,
      columns: [
        "Return ID",
        "Event Reference",
        "Warehouse",
        "Return Date",
        "Received By",
        "Total Sent",
        "Returned",
        "Damaged",
        "Missing",
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

  const exportPdf = () => {
    if (filteredRows.length === 0) {
      showAlert({
        message: "There is no data to export.",
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
            <h1>Reports</h1>

            <p>
              Generate and export system reports
            </p>
          </div>

          <button
            type="button"
            className="export-pdf-button"
            onClick={exportPdf}
            disabled={loading}
          >
            <FiDownload />
            Export PDF
          </button>
        </section>

        <section className="reports-filter-card">
          <div className="reports-filter-title">
            <FiFilter />

            <div>
              <h3>Report Filters</h3>

              <p>
                Select a report type and narrow
                the results.
              </p>
            </div>
          </div>

          <div className="reports-filter-grid">
            <label>
              Report Type

              <select
                value={reportType}
                onChange={
                  handleReportTypeChange
                }
                disabled={loading}
              >
                <option value="inventory">
                  Inventory Report
                </option>

                <option value="purchases">
                  Purchase Report
                </option>

                <option value="dispatches">
                  Dispatch Report
                </option>

                <option value="returns">
                  Returns Report
                </option>
              </select>
            </label>

            <label>
              From Date

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
              To Date

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
              Warehouse

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
            </label>

            <label>
              Status

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
                      {statusOption}
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
              Reset Filters
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
                Showing{" "}
                {firstVisibleRecord}–
                {lastVisibleRecord} of{" "}
                {filteredRows.length} records
              </p>
            </div>

            <div className="report-search-box">
              <FiSearch />

              <input
                type="text"
                placeholder="Search report..."
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
                      Loading report data...
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
                      No records match the selected
                      filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="report-result-footer">
            <p>
              Showing {firstVisibleRecord} to{" "}
              {lastVisibleRecord} of{" "}
              {filteredRows.length} records
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