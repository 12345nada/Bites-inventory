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
  getEventsReportRows,
  getInventoryReportRows,
  getOverviewReportRows,
  getPurchaseReportRows,
  getReportsData,
  getReturnsReportRows,
  getStaffPaymentReportRows,
  getWarehouseReportRows,
} from "../services/reportsService";

import "../styles/dashboard.css";
import "../styles/Reports.css";

import {
  FiAlertTriangle,
  FiBox,
  FiChevronDown,
  FiDownload,
  FiDollarSign,
  FiFileText,
  FiFilter,
  FiSearch,
  FiTruck,
  FiUsers,
} from "react-icons/fi";

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const reportTitles = {
  overview: "Business Overview",
  inventory: "Inventory Report",
  purchases: "Purchase Report",
  events: "Events Report",
  dispatches: "Dispatch Report",
  returns: "Returns & Recovery Report",
  staff: "Staff Payments Report",
  warehouses: "Warehouse Performance Report",
};

const money = (value) =>
  `${Number(value || 0).toLocaleString("en-US")} EGP`;

export default function Reports() {
  const { t } = useTranslation();
  const { showAlert } = useDialog();
  const { hasPermission } = useAuth();

  const canAdd = hasPermission("Reports", "add");

  const [data, setData] = useState({
    inventory: [],
    inventorySummary: [],
    purchases: [],
    dispatches: [],
    returns: [],
    warehouses: [],
    events: [],
    staffPaymentSummary: [],
  });

  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [reportType, setReportType] = useState("overview");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] =
    useState("All Warehouses");
  const [status, setStatus] =
    useState("All Statuses");
  const [currentPage, setCurrentPage] =
    useState(1);
  const [isExportMenuOpen, setIsExportMenuOpen] =
    useState(false);

  const exportMenuRef = useRef(null);
  const rowsPerPage = 5;

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setIsExportMenuOpen(false);
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

      const loadedData = await getReportsData();

      setData(loadedData);
    } catch (error) {
      console.error("Error loading reports:", error);

      showAlert({
        message:
          error.message ||
          t("reportsPage.errors.couldNotLoad"),
      });
    } finally {
      setLoading(false);
    }
  };

  const overviewStats = useMemo(() => {
    const now = new Date();

    const getLiveEventStatus = (event) => {
      if (event.status === "Cancelled") {
        return "Cancelled";
      }

      if (!event.date) {
        return event.status || "Upcoming";
      }

      const startDateTime = new Date(
        `${event.date}T${event.startTime || "00:00:00"}`
      );

      const endDateTime = new Date(
        `${event.date}T${event.endTime || "23:59:59"}`
      );

      if (
        !Number.isNaN(endDateTime.getTime()) &&
        now > endDateTime
      ) {
        return "Completed";
      }

      if (
        !Number.isNaN(startDateTime.getTime()) &&
        !Number.isNaN(endDateTime.getTime()) &&
        now >= startDateTime &&
        now <= endDateTime
      ) {
        return "In Progress";
      }

      if (
        !Number.isNaN(startDateTime.getTime()) &&
        now < startDateTime
      ) {
        return "Upcoming";
      }

      return event.status || "Upcoming";
    };

    const eventCounts = data.events.reduce(
      (counts, event) => {
        const liveStatus = getLiveEventStatus(event);

        if (liveStatus === "Completed") {
          counts.completed += 1;
        } else if (liveStatus === "Upcoming") {
          counts.upcoming += 1;
        } else if (liveStatus === "In Progress") {
          counts.inProgress += 1;
        } else if (liveStatus === "Cancelled") {
          counts.cancelled += 1;
        }

        return counts;
      },
      {
        completed: 0,
        upcoming: 0,
        inProgress: 0,
        cancelled: 0,
      }
    );

    const inventoryValue =
      data.inventorySummary.reduce(
        (total, item) =>
          total + Number(item.stockValue || 0),
        0
      );

    const purchaseSpend = data.purchases.reduce(
      (total, purchase) =>
        total + Number(purchase.totalAmount || 0),
      0
    );

    const staffCost = data.events
      .filter(
        (event) =>
          getLiveEventStatus(event) === "Completed"
      )
      .reduce(
        (total, event) =>
          total + Number(event.staffCost || 0),
        0
      );

    const pendingStaff = data.staffPaymentSummary.reduce(
      (total, payment) =>
        total +
        Number(payment.remainingAmount || 0),
      0
    );

    const lowStockCount =
      data.inventorySummary.filter(
        (item) =>
          item.stockLevel === "Low Stock" ||
          item.stockLevel === "Out of Stock"
      ).length;

    const activeEvents =
      eventCounts.completed +
      eventCounts.upcoming +
      eventCounts.inProgress;

    return {
      inventoryValue,
      purchaseSpend,
      activeEvents,
      completedEvents: eventCounts.completed,
      upcomingEvents: eventCounts.upcoming,
      inProgressEvents: eventCounts.inProgress,
      cancelledEvents: eventCounts.cancelled,
      staffCost,
      pendingStaff,
      lowStockCount,
    };
  }, [data]);

  const reportConfig = useMemo(() => {
    if (reportType === "overview") {
      return {
        title: "Business Overview",
        columns: ["Metric", "Value"],
        rows: getOverviewReportRows(data),
        supportsWarehouse: false,
        supportsDate: false,
        statusOptions: ["All Statuses"],
        summaryCards: [
          {
            label: "Inventory Value",
            value: money(overviewStats.inventoryValue),
            icon: FiBox,
          },
          {
            label: "Purchase Spend",
            value: money(overviewStats.purchaseSpend),
            icon: FiDollarSign,
          },
          {
            label: "Active Events",
            value: overviewStats.activeEvents.toLocaleString(),
            icon: FiFileText,
          },
          {
            label: "Completed Events",
            value: overviewStats.completedEvents.toLocaleString(),
            icon: FiFileText,
          },
          {
            label: "Upcoming Events",
            value: overviewStats.upcomingEvents.toLocaleString(),
            icon: FiFileText,
          },
          {
            label: "In Progress",
            value: overviewStats.inProgressEvents.toLocaleString(),
            icon: FiFileText,
          },
          {
            label: "Cancelled",
            value: overviewStats.cancelledEvents.toLocaleString(),
            icon: FiFileText,
          },
          {
            label: "Stock Alerts",
            value: overviewStats.lowStockCount.toLocaleString(),
            icon: FiAlertTriangle,
          },
          {
            label: "Pending Staff",
            value: money(overviewStats.pendingStaff),
            icon: FiUsers,
          },
        ],
      };
    }

    if (reportType === "inventory") {
      const rows = getInventoryReportRows(
        data.inventorySummary
      );

      const filteredValue = data.inventorySummary.reduce(
        (total, item) =>
          total + Number(item.stockValue || 0),
        0
      );

      return {
        title: "Inventory Report",
        columns: [
          "Item Code",
          "Item",
          "Category",
          "Warehouses",
          "Available",
          "Damaged",
          "Missing",
          "Minimum Stock",
          "Inventory Value",
          "Stock Health",
        ],
        rows,
        supportsWarehouse: true,
        supportsDate: false,
        statusOptions: [
          "All Statuses",
          "Healthy",
          "Low Stock",
          "Out of Stock",
        ],
        summaryCards: [
          {
            label: "Inventory Value",
            value: money(filteredValue),
            icon: FiDollarSign,
          },
          {
            label: "Available Qty",
            value: data.inventorySummary
              .reduce(
                (total, item) =>
                  total + Number(item.available || 0),
                0
              )
              .toLocaleString(),
            icon: FiBox,
          },
          {
            label: "Damaged",
            value: data.inventorySummary
              .reduce(
                (total, item) =>
                  total + Number(item.damaged || 0),
                0
              )
              .toLocaleString(),
            icon: FiAlertTriangle,
          },
          {
            label: "Missing",
            value: data.inventorySummary
              .reduce(
                (total, item) =>
                  total + Number(item.missing || 0),
                0
              )
              .toLocaleString(),
            icon: FiAlertTriangle,
          },
        ],
      };
    }

    if (reportType === "purchases") {
      return {
        title: "Purchase Report",
        columns: [
          "PO Number",
          "Supplier",
          "Warehouse",
          "Item Types",
          "Total Qty",
          "Total Amount",
          "Order Date",
          "Expected Date",
          "Status",
        ],
        rows: getPurchaseReportRows(data.purchases),
        supportsWarehouse: true,
        supportsDate: true,
        statusOptions: [
          "All Statuses",
          "Pending",
          "Approved",
          "Received",
          "Cancelled",
        ],
        summaryCards: [
          {
            label: "Purchase Orders",
            value: data.purchases.length.toLocaleString(),
            icon: FiFileText,
          },
          {
            label: "Total Spend",
            value: money(
              data.purchases.reduce(
                (total, row) =>
                  total + Number(row.totalAmount || 0),
                0
              )
            ),
            icon: FiDollarSign,
          },
          {
            label: "Total Quantity",
            value: data.purchases
              .reduce(
                (total, row) =>
                  total + Number(row.totalQuantity || 0),
                0
              )
              .toLocaleString(),
            icon: FiBox,
          },
        ],
      };
    }

    if (reportType === "events") {
      return {
        title: "Events Report",
        columns: [
          "Event",
          "Event Type",
          "Client",
          "Date",
          "Branch",
          "Driver",
          "Waiters",
          "Dispatch",
          "Return",
          "Staff Cost",
          "Status",
        ],
        rows: getEventsReportRows(data.events),
        supportsWarehouse: false,
        supportsDate: true,
        statusOptions: [
          "All Statuses",
          "Upcoming",
          "In Progress",
          "Completed",
          "Cancelled",
        ],
        summaryCards: [
          {
            label: "Total Events",
            value: data.events.length.toLocaleString(),
            icon: FiFileText,
          },
          {
            label: "Completed",
            value: data.events
              .filter((event) => event.status === "Completed")
              .length.toLocaleString(),
            icon: FiFileText,
          },
          {
            label: "Total Staff Cost",
            value: money(
              data.events.reduce(
                (total, event) =>
                  total + Number(event.staffCost || 0),
                0
              )
            ),
            icon: FiUsers,
          },
        ],
      };
    }

    if (reportType === "dispatches") {
      return {
        title: "Dispatch Report",
        columns: [
          "Dispatch ID",
          "Event",
          "Warehouse",
          "Driver",
          "Item Types",
          "Total Qty",
          "Date",
          "Time",
          "Status",
        ],
        rows: getDispatchReportRows(data.dispatches),
        supportsWarehouse: true,
        supportsDate: true,
        statusOptions: [
          "All Statuses",
          "Prepared",
          "In Transit",
          "Delivered",
          "Cancelled",
        ],
        summaryCards: [
          {
            label: "Dispatches",
            value: data.dispatches.length.toLocaleString(),
            icon: FiTruck,
          },
          {
            label: "Total Quantity",
            value: data.dispatches
              .reduce(
                (total, row) =>
                  total + Number(row.totalQuantity || 0),
                0
              )
              .toLocaleString(),
            icon: FiBox,
          },
          {
            label: "Delivered",
            value: data.dispatches
              .filter(
                (dispatch) =>
                  dispatch.status === "Delivered"
              )
              .length.toLocaleString(),
            icon: FiTruck,
          },
        ],
      };
    }

    if (reportType === "returns") {
      return {
        title: "Returns & Recovery Report",
        columns: [
          "Return ID",
          "Event",
          "Warehouse",
          "Return Date",
          "Sent",
          "Good Returned",
          "Damaged",
          "Missing",
          "Recovery %",
          "Loss %",
          "Risk",
        ],
        rows: getReturnsReportRows(data.returns),
        supportsWarehouse: true,
        supportsDate: true,
        statusOptions: [
          "All Statuses",
          "Clear",
          "Partial Loss",
          "High Loss",
        ],
        summaryCards: [
          {
            label: "Good Returned",
            value: data.returns
              .reduce(
                (total, row) =>
                  total + Number(row.returned || 0),
                0
              )
              .toLocaleString(),
            icon: FiBox,
          },
          {
            label: "Damaged",
            value: data.returns
              .reduce(
                (total, row) =>
                  total + Number(row.damaged || 0),
                0
              )
              .toLocaleString(),
            icon: FiAlertTriangle,
          },
          {
            label: "Missing",
            value: data.returns
              .reduce(
                (total, row) =>
                  total + Number(row.missing || 0),
                0
              )
              .toLocaleString(),
            icon: FiAlertTriangle,
          },
        ],
      };
    }

    if (reportType === "staff") {
      return {
        title: "Staff Payments Report",
        columns: [
          "Staff",
          "Role",
          "Type",
          "Events Worked",
          "Total Earned",
          "Paid",
          "Remaining",
          "Status",
        ],
        rows: getStaffPaymentReportRows(
          data.staffPaymentSummary
        ),
        supportsWarehouse: false,
        supportsDate: false,
        statusOptions: [
          "All Statuses",
          "Pending",
          "Partial",
          "Paid",
        ],
        summaryCards: [
          {
            label: "Staff Cost",
            value: money(
              data.staffPaymentSummary.reduce(
                (total, row) =>
                  total + Number(row.totalAmount || 0),
                0
              )
            ),
            icon: FiUsers,
          },
          {
            label: "Paid",
            value: money(
              data.staffPaymentSummary.reduce(
                (total, row) =>
                  total + Number(row.paidAmount || 0),
                0
              )
            ),
            icon: FiDollarSign,
          },
          {
            label: "Remaining",
            value: money(
              data.staffPaymentSummary.reduce(
                (total, row) =>
                  total +
                  Number(row.remainingAmount || 0),
                0
              )
            ),
            icon: FiAlertTriangle,
          },
        ],
      };
    }

    if (reportType === "warehouses") {
      return {
        title: "Warehouse Performance Report",
        columns: [
          "Warehouse",
          "Branch",
          "Capacity",
          "Used",
          "Available Capacity",
          "Inventory Value",
          "Damaged",
          "Missing",
          "Stock Alerts",
          "Received Qty",
          "Dispatched Qty",
        ],
        rows: getWarehouseReportRows(data.warehouses),
        supportsWarehouse: true,
        supportsDate: false,
        statusOptions: ["All Statuses"],
        summaryCards: [
          {
            label: "Warehouses",
            value: data.warehouses.length.toLocaleString(),
            icon: FiBox,
          },
          {
            label: "Inventory Value",
            value: money(
              data.warehouses.reduce(
                (total, row) =>
                  total + Number(row.inventoryValue || 0),
                0
              )
            ),
            icon: FiDollarSign,
          },
          {
            label: "Stock Alerts",
            value: data.warehouses
              .reduce(
                (total, row) =>
                  total + Number(row.lowStockItems || 0),
                0
              )
              .toLocaleString(),
            icon: FiAlertTriangle,
          },
        ],
      };
    }

    return {
      title: "Business Overview",
      columns: ["Metric", "Value"],
      rows: getOverviewReportRows(data),
      supportsWarehouse: false,
      supportsDate: false,
      statusOptions: ["All Statuses"],
      summaryCards: [],
    };
  }, [reportType, data, overviewStats]);

  const filteredRows = useMemo(() => {
    const normalizedSearch =
      searchValue.trim().toLowerCase();

    return reportConfig.rows.filter((row) => {
      const matchesSearch =
        normalizedSearch === "" ||
        row.searchValues.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesWarehouse =
        !reportConfig.supportsWarehouse ||
        selectedWarehouse ===
          "All Warehouses" ||
        (Array.isArray(row.warehouseIds)
          ? row.warehouseIds.some(
              (warehouseId) =>
                String(warehouseId) ===
                String(selectedWarehouse)
            )
          : String(row.warehouseId) ===
            String(selectedWarehouse));

      const matchesStatus =
        status === "All Statuses" ||
        row.status === status;

      const matchesFromDate =
        !reportConfig.supportsDate ||
        !fromDate ||
        !row.date ||
        row.date >= fromDate;

      const matchesToDate =
        !reportConfig.supportsDate ||
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
    });
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
    Math.ceil(filteredRows.length / rowsPerPage)
  );

  const paginatedRows = useMemo(() => {
    const startIndex =
      (currentPage - 1) * rowsPerPage;

    return filteredRows.slice(
      startIndex,
      startIndex + rowsPerPage
    );
  }, [filteredRows, currentPage]);

  const firstVisibleRecord =
    filteredRows.length === 0
      ? 0
      : (currentPage - 1) * rowsPerPage + 1;

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
  }, [currentPage, totalPages]);

  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
    setStatus("All Statuses");
    setFromDate("");
    setToDate("");
    setSelectedWarehouse("All Warehouses");
  };

  const resetFilters = () => {
    setSearchValue("");
    setFromDate("");
    setToDate("");
    setSelectedWarehouse("All Warehouses");
    setStatus("All Statuses");
  };

  const getExportCells = (row) =>
    row.cells.map((cell, index) => {
      const column =
        reportConfig.columns[index] || "";

      return column.toLowerCase().includes("date")
        ? formatDate(cell)
        : cell;
    });

  const exportPdf = async () => {
    if (!canAdd) {
      await showAlert({
        title:
          t("reportsPage.errors.permissionDenied"),
        message:
          t("reportsPage.errors.noExportPermission"),
        type: "warning",
      });
      return;
    }

    if (filteredRows.length === 0) {
      showAlert({
        message:
          t("reportsPage.errors.noDataExport"),
      });
      return;
    }

    const document = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    document.setFontSize(18);
    document.text(reportConfig.title, 14, 16);

    document.setFontSize(9);

    const selectedWarehouseName =
      data.warehouses.find(
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
      reportConfig.supportsWarehouse &&
      selectedWarehouse !== "All Warehouses"
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
      filterText || "All available records",
      14,
      23
    );

    const summaryY = 28;
    const summaryCards =
      reportConfig.summaryCards || [];
    const summaryWidth =
      summaryCards.length > 0
        ? 268 / summaryCards.length
        : 0;

    summaryCards.forEach((card, index) => {
      const x = 14 + index * summaryWidth;

      document.setDrawColor(240, 221, 207);
      document.setFillColor(255, 250, 246);
      document.roundedRect(
        x,
        summaryY,
        summaryWidth - 3,
        16,
        2,
        2,
        "FD"
      );

      document.setFontSize(6.5);
      document.setTextColor(108, 97, 89);
      document.text(
        card.label,
        x + 3,
        summaryY + 5
      );

      document.setFontSize(10);
      document.setTextColor(113, 48, 6);
      document.text(
        String(card.value),
        x + 3,
        summaryY + 11
      );
    });

    autoTable(document, {
      startY:
        summaryCards.length > 0 ? 49 : 28,
      head: [reportConfig.columns],
      body: filteredRows.map(getExportCells),
      styles: {
        fontSize: 6.5,
        cellPadding: 1.7,
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
        title:
          t("reportsPage.errors.permissionDenied"),
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

    const summaryRows = (
      reportConfig.summaryCards || []
    ).map((card) => ({
      Metric: card.label,
      Value: card.value,
    }));

    const detailRows = filteredRows.map((row) => {
      const cells = getExportCells(row);

      return Object.fromEntries(
        reportConfig.columns.map(
          (column, index) => [
            column,
            cells[index] ?? "",
          ]
        )
      );
    });

    const workbook = XLSX.utils.book_new();

    if (summaryRows.length > 0) {
      const summarySheet =
        XLSX.utils.json_to_sheet(summaryRows);

      XLSX.utils.book_append_sheet(
        workbook,
        summarySheet,
        "Summary"
      );
    }

    const detailSheet =
      XLSX.utils.json_to_sheet(detailRows, {
        header: reportConfig.columns,
      });

    XLSX.utils.book_append_sheet(
      workbook,
      detailSheet,
      "Details"
    );

    XLSX.writeFile(
      workbook,
      `${reportConfig.title
        .toLowerCase()
        .replace(/\s+/g, "-")}.xlsx`
    );
  };

  const handleExport = async (type) => {
    setIsExportMenuOpen(false);

    if (type === "pdf") {
      await exportPdf();
      return;
    }

    await exportExcel();
  };

  const renderCell = (cell, cellIndex) => {
    const column =
      reportConfig.columns[cellIndex] || "";

    return column.toLowerCase().includes("date")
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
              Business intelligence across inventory,
              purchases, events, operations and staff.
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
                  (current) => !current
                )
              }
              disabled={loading}
            >
              <FiDownload />
              {t("reportsPage.export")}
              <FiChevronDown />
            </button>

            {isExportMenuOpen && (
              <div className="reports-export-menu">
                <button
                  type="button"
                  onClick={() => handleExport("pdf")}
                >
                  {t("reportsPage.exportPdf")}
                </button>

                <button
                  type="button"
                  onClick={() => handleExport("excel")}
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
              <h3>Report Center</h3>
              <p>
                Choose the business view you need and
                narrow the results.
              </p>
            </div>
          </div>

          <div className="reports-filter-grid">
            <label>
              Report Type
              <select
                value={reportType}
                onChange={handleReportTypeChange}
                disabled={loading}
              >
                <option value="overview">
                  Business Overview
                </option>
                <option value="inventory">
                  Inventory
                </option>
                <option value="purchases">
                  Purchases
                </option>
                <option value="events">
                  Events
                </option>
                <option value="dispatches">
                  Dispatches
                </option>
                <option value="returns">
                  Returns & Recovery
                </option>
                <option value="staff">
                  Staff Payments
                </option>
                <option value="warehouses">
                  Warehouse Performance
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
                  !reportConfig.supportsDate
                }
                onChange={(event) =>
                  setFromDate(event.target.value)
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
                  !reportConfig.supportsDate
                }
                onChange={(event) =>
                  setToDate(event.target.value)
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
                disabled={
                  loading ||
                  !reportConfig.supportsWarehouse
                }
              >
                <option value="All Warehouses">
                  All Warehouses
                </option>
                {data.warehouses.map(
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
                  setStatus(event.target.value)
                }
                disabled={
                  loading ||
                  reportConfig.statusOptions.length <= 1
                }
              >
                {reportConfig.statusOptions.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
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

        <section className="reports-summary-grid">
          {(reportConfig.summaryCards || []).map(
            (card) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.label}
                  className="reports-summary-card"
                >
                  <div className="reports-summary-icon">
                    <Icon />
                  </div>
                  <div>
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                  </div>
                </article>
              );
            }
          )}
        </section>

        {reportType === "overview" && (
          <section className="reports-insight-grid">
            <article className="reports-insight-card">
              <h3>Event Activity</h3>
              <p>
                <strong>{overviewStats.upcomingEvents}</strong>{" "}
                upcoming event(s),{" "}
                <strong>{overviewStats.inProgressEvents}</strong>{" "}
                currently in progress.
              </p>
              <p>
                <strong>{overviewStats.completedEvents}</strong>{" "}
                event(s) completed and{" "}
                <strong>{overviewStats.cancelledEvents}</strong>{" "}
                cancelled.
              </p>
            </article>

            <article className="reports-insight-card">
              <h3>Financial & Stock Attention</h3>
              <p>
                Pending staff payments:{" "}
                <strong>
                  {money(overviewStats.pendingStaff)}
                </strong>
              </p>
              <p>
                <strong>{overviewStats.lowStockCount}</strong>{" "}
                inventory item(s) need stock attention.
              </p>
            </article>
          </section>
        )}

        <section className="report-result-card">
          <div className="report-result-toolbar">
            <div>
              <div className="report-result-heading">
                <FiFileText />
                <h2>{reportConfig.title}</h2>
              </div>

              <p>
                Showing {firstVisibleRecord} -{" "}
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
                        reportConfig.columns.length
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
                          (cell, cellIndex) => (
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
                        reportConfig.columns.length
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
              Showing {firstVisibleRecord} -{" "}
              {lastVisibleRecord} of{" "}
              {filteredRows.length} records
            </p>

            <div>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((current) =>
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
                  setCurrentPage((current) =>
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
