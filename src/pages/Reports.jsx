import {
  useMemo,
  useState,
} from "react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import {
  useItems,
} from "../context/ItemsContext";

import {
  usePurchases,
} from "../context/PurchasesContext";

import {
  useDispatches,
} from "../context/DispatchesContext";

import {
  useReturns,
} from "../context/ReturnsContext";

import "../styles/dashboard.css";
import "../styles/Reports.css";

import {
  FiFileText,
  FiSearch,
  FiDownload,
  FiFilter,
} from "react-icons/fi";

const reportTypes = {
  inventory: {
    title: "Inventory Report",
    dateField: null,
  },
  purchases: {
    title: "Purchase Report",
    dateField: "orderDate",
  },
  dispatches: {
    title: "Dispatch Report",
    dateField: "date",
  },
  returns: {
    title: "Returns Report",
    dateField: "returnDate",
  },
};

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

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getReturnTotals = (items = []) => {
  return items.reduce(
    (totals, item) => {
      totals.sent += Number(
        item.dispatchedQuantity || 0
      );

      totals.returned += Number(
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
      sent: 0,
      returned: 0,
      damaged: 0,
      missing: 0,
    }
  );
};

const getDispatchTotalQuantity = (
  items = []
) => {
  return items.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );
};

export default function Reports() {
  const { items } = useItems();
  const { purchases } = usePurchases();
  const { dispatches } = useDispatches();
  const { returns } = useReturns();

  const [searchValue, setSearchValue] =
    useState("");

  const [reportType, setReportType] =
    useState("inventory");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [warehouse, setWarehouse] =
    useState("All Warehouses");

  const [status, setStatus] =
    useState("All Statuses");

  const reportConfig = useMemo(() => {
    if (reportType === "inventory") {
      return {
        title: "Inventory Report",

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

        rows: items.map((item) => {
          const isLowStock =
            Number(item.available) <=
            Number(item.minimumStock || 0);

          return {
            searchValues: [
              item.id,
              item.name,
              item.category,
              item.warehouse,
              isLowStock
                ? "Low Stock"
                : "In Stock",
            ],

            warehouse: item.warehouse,

            status: isLowStock
              ? "Low Stock"
              : "In Stock",

            date: "",

            cells: [
              item.id,
              item.name,
              item.category,
              item.warehouse,
              Number(
                item.available || 0
              ).toLocaleString(),
             
              Number(
                item.damaged || 0
              ).toLocaleString(),
              Number(
                item.missing || 0
              ).toLocaleString(),
              Number(
                item.minimumStock || 0
              ).toLocaleString(),
              isLowStock
                ? "Low Stock"
                : "In Stock",
            ],
          };
        }),
      };
    }

    if (reportType === "purchases") {
      return {
        title: "Purchase Report",

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

        rows: purchases.map((purchase) => ({
          searchValues: [
            purchase.id,
            purchase.supplier,
            purchase.itemName,
            purchase.warehouse,
            purchase.status,
          ],

          warehouse:
            purchase.warehouse ||
            purchase.branch,

          status: purchase.status,

          date:
            purchase.orderDate ||
            purchase.date,

          cells: [
            purchase.id,
            purchase.supplier,
            purchase.itemName || "-",
            purchase.warehouse ||
              purchase.branch ||
              "-",
            Number(
              purchase.quantity ||
                purchase.items ||
                0
            ).toLocaleString(),
            `${Number(
              purchase.totalAmount || 0
            ).toLocaleString()} EGP`,
            formatDate(
              purchase.orderDate ||
                purchase.date
            ),
            purchase.status,
          ],
        })),
      };
    }

    if (reportType === "dispatches") {
      return {
        title: "Dispatch Report",

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

        rows: dispatches.map((dispatch) => ({
          searchValues: [
            dispatch.id,
            dispatch.eventReference,
            dispatch.fromWarehouse,
            dispatch.toLocation,
            dispatch.area,
            dispatch.driver,
            dispatch.status,
          ],

          warehouse:
            dispatch.fromWarehouse,

          status: dispatch.status,

          date: dispatch.date,

          cells: [
            dispatch.id,
            dispatch.eventReference,
            dispatch.fromWarehouse,
            `${dispatch.toLocation}${
              dispatch.area
                ? `, ${dispatch.area}`
                : ""
            }`,
            dispatch.driver,
            formatDate(dispatch.date),
            getDispatchTotalQuantity(
              dispatch.items
            ).toLocaleString(),
            dispatch.status,
          ],
        })),
      };
    }

    return {
      title: "Returns Report",

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

      rows: returns.map((returnRecord) => {
        const totals = getReturnTotals(
          returnRecord.items
        );

        const returnStatus =
          totals.missing > 0
            ? "Has Missing"
            : totals.damaged > 0
              ? "Has Damage"
              : "Clear";

        return {
          searchValues: [
            returnRecord.id,
            returnRecord.dispatchId,
            returnRecord.eventReference,
            returnRecord.warehouse,
            returnRecord.returnedBy,
            returnStatus,
          ],

          warehouse:
            returnRecord.warehouse,

          status: returnStatus,

          date: returnRecord.returnDate,

          cells: [
            returnRecord.id,
            returnRecord.eventReference,
            returnRecord.warehouse,
            formatDate(
              returnRecord.returnDate
            ),
            returnRecord.returnedBy,
            totals.sent.toLocaleString(),
            totals.returned.toLocaleString(),
            totals.damaged.toLocaleString(),
            totals.missing.toLocaleString(),
          ],
        };
      }),
    };
  }, [
    reportType,
    items,
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
        "Returned",
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
          row.searchValues.some((value) =>
            String(value)
              .toLowerCase()
              .includes(normalizedSearch)
          );

        const matchesWarehouse =
          warehouse === "All Warehouses" ||
          row.warehouse === warehouse;

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
    warehouse,
    status,
    fromDate,
    toDate,
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
    setWarehouse("All Warehouses");
    setStatus("All Statuses");
  };

  const exportPdf = () => {
    if (filteredRows.length === 0) {
      alert(
        "There is no data to export."
      );
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

    const filterText = [
      fromDate
        ? `From: ${formatDate(fromDate)}`
        : "",
      toDate
        ? `To: ${formatDate(toDate)}`
        : "",
      warehouse !== "All Warehouses"
        ? `Warehouse: ${warehouse}`
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
        (row) => row.cells
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
                  reportType === "inventory"
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
                  reportType === "inventory"
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
                value={warehouse}
                onChange={(event) =>
                  setWarehouse(
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
                Showing {filteredRows.length}{" "}
                records
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
                {filteredRows.length > 0 ? (
                  filteredRows.map(
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
                              {cell}
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
            <span>
              {reportConfig.title}
            </span>

            <span>
              {filteredRows.length} records
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}