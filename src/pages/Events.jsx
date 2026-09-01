import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { useDialog } from "../context/DialogContext";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import { supabase } from "../lib/supabase";

import {
  createEvent,
  getActiveDrivers,
  getActiveWaiters,
  getEvents,
  getEventDetailsSheet,
  removeEvent,
  updateEvent,
} from "../services/eventsService";

import "../styles/dashboard.css";
import "../styles/Events.css";
import "../styles/mobile-sidebar-offcanvas.css";

import {
  FiSearch,
  FiPlus,
  FiCalendar,
  FiCheckCircle,
  FiFlag,
  FiXCircle,
  FiEdit2,
  FiMoreVertical,
  FiFileText,
  FiDownload,
  FiChevronDown,
  FiX,
  FiTrash2,
} from "react-icons/fi";

const tabs = [
  "All Events",
  "Upcoming",
  "In Progress",
  "Completed",
  "Cancelled",
];

const emptyForm = {
  name: "",
  client: "",
  date: "",
  departureTime: "",
  startTime: "",
  endTime: "",
  location: "",
  area: "",
  branch: "Cairo",
  driverId: "",
  waiterIds: [],
  hasDrinks: false,
  status: "Upcoming",
};

function Events() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar");

  const ui = (english, arabic) =>
    isArabic ? arabic : english;

  const getStatusLabel = (status) => {
    const labels = {
      Confirmed: "مؤكد",
      "In Progress": "قيد التنفيذ",
      Upcoming: "قادمة",
      Completed: "مكتملة",
      Cancelled: "ملغاة",
    };

    return isArabic
      ? labels[status] || status
      : status;
  };

  const getBranchLabel = (branch) => {
    const labels = {
      Cairo: "القاهرة",
      Alex: "الإسكندرية",
    };

    return isArabic
      ? labels[branch] || branch
      : branch;
  };

  const getTabLabel = (tab) => {
    const labels = {
      "All Events": "كل الفعاليات",
      Upcoming: "القادمة",
      "In Progress": "قيد التنفيذ",
      Completed: "المكتملة",
      Cancelled: "الملغاة",
    };

    return isArabic
      ? labels[tab] || tab
      : tab;
  };

  const { showAlert, showConfirm } = useDialog();
  const { hasPermission } = useAuth();

  const canAdd = hasPermission("Events", "add");
  const canEdit = hasPermission("Events", "edit");
  const canDelete = hasPermission("Events", "delete");

  const [events, setEvents] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [waiters, setWaiters] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [searchValue, setSearchValue] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 5;

  const [activeTab, setActiveTab] =
    useState("All Events");

  const [
    selectedBranch,
    setSelectedBranch,
  ] = useState("All Branches");

  const [
    showEventModal,
    setShowEventModal,
  ] = useState(false);

  const [
    showWaitersDropdown,
    setShowWaitersDropdown,
  ] = useState(false);

  const waitersFieldRef = useRef(null);

  const [
    editingEventId,
    setEditingEventId,
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

  const [
    eventDetailsSheet,
    setEventDetailsSheet,
  ] = useState(null);

  const [
    loadingEventDetailsSheet,
    setLoadingEventDetailsSheet,
  ] = useState(false);

  const [
    isEventDetailsExportOpen,
    setIsEventDetailsExportOpen,
  ] = useState(false);

  const eventDetailsExportRef =
    useRef(null);

  const [formData, setFormData] =
    useState(emptyForm);

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    const handleOutsideExportClick = (
      event
    ) => {
      if (
        eventDetailsExportRef.current &&
        !eventDetailsExportRef.current.contains(
          event.target
        )
      ) {
        setIsEventDetailsExportOpen(
          false
        );
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideExportClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideExportClick
      );
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("events-realtime-status")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
        },
        async () => {
          try {
            const eventsData =
              await getEvents();

            setEvents(eventsData);
          } catch (error) {
            console.error(
              "Error refreshing events after realtime update:",
              error
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (openActionId === null) {
      return undefined;
    }

    const closeActionMenu = (event) => {
      if (
        event?.target instanceof Element &&
        event.target.closest(
          ".event-more-wrapper"
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

  useEffect(() => {
    if (!showWaitersDropdown) {
      return undefined;
    }

    const closeWaitersDropdown = (event) => {
      if (
        waitersFieldRef.current &&
        !waitersFieldRef.current.contains(
          event.target
        )
      ) {
        setShowWaitersDropdown(false);
      }
    };

    document.addEventListener(
      "mousedown",
      closeWaitersDropdown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeWaitersDropdown
      );
    };
  }, [showWaitersDropdown]);

  const loadPageData = async () => {
    try {
      setLoading(true);

      const [
        eventsData,
        driversData,
        waitersData,
      ] = await Promise.all([
        getEvents(),
        getActiveDrivers(),
        getActiveWaiters(),
      ]);

      setEvents(eventsData);
      setDrivers(driversData);
      setWaiters(waitersData);
    } catch (error) {
      console.error(
        "Error loading events:",
        error
      );

      showAlert({
        message: error.message ||
          "Could not load events.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    const normalizedSearch =
      searchValue.trim().toLowerCase();

    return events.filter((event) => {
      const searchableValues = [
        event.eventCode,
        event.name,
        event.client,
        event.date,
        event.departureTime,
        event.startTime,
        event.endTime,
        event.location,
        event.area,
        event.branch,
        event.driver,
        event.waiterNames?.join(" "),
        event.waiters,
        event.status,
      ];

      const matchesSearch =
        normalizedSearch === "" ||
        searchableValues.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesTab =
        activeTab === "All Events" ||
        event.status === activeTab;

      const matchesBranch =
        selectedBranch === "All Branches" ||
        event.branch === selectedBranch;

      return (
        matchesSearch &&
        matchesTab &&
        matchesBranch
      );
    });
  }, [
    events,
    searchValue,
    activeTab,
    selectedBranch,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredEvents.length /
        itemsPerPage
    )
  );

  const paginatedEvents =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        itemsPerPage;

      return filteredEvents.slice(
        startIndex,
        startIndex +
          itemsPerPage
      );
    }, [
      filteredEvents,
      currentPage,
    ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchValue,
    activeTab,
    selectedBranch,
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

  const branches = useMemo(
    () => [
      ...new Set(
        events
          .map((event) => event.branch)
          .filter(Boolean)
      ),
    ],
    [events]
  );

  const branchDrivers = useMemo(
    () =>
      drivers.filter(
        (driver) =>
          driver.branch === formData.branch
      ),
    [drivers, formData.branch]
  );

  const branchWaiters = useMemo(
    () =>
      waiters.filter(
        (waiter) =>
          waiter.branch === formData.branch
      ),
    [waiters, formData.branch]
  );

  const todayDate = new Date()
    .toISOString()
    .slice(0, 10);

  const nextSevenDaysDate = new Date();
  nextSevenDaysDate.setDate(
    nextSevenDaysDate.getDate() + 7
  );

  const nextSevenDays = nextSevenDaysDate
    .toISOString()
    .slice(0, 10);

  const todayEvents = events.filter(
    (event) => event.date === todayDate
  ).length;

  const upcomingEvents = events.filter(
    (event) =>
      event.status === "Upcoming" &&
      event.date >= todayDate &&
      event.date <= nextSevenDays
  ).length;

  const totalActiveEvents = events.filter(
    (event) =>
      String(event.status)
        .trim()
        .toLowerCase() !== "cancelled"
  ).length;

  const getStatusClass = (status) =>
    String(status || "")
      .toLowerCase()
      .replace(/\s+/g, "-");

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(
      `${dateValue}T00:00:00`
    );

    return date.toLocaleDateString(
      isArabic ? "ar-EG" : "en-GB",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  const formatTime = (timeValue) => {
    if (!timeValue) {
      return "-";
    }

    const [hours, minutes] =
      timeValue.split(":");

    const date = new Date();
    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString(
      isArabic ? "ar-EG" : "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const toggleActionMenu = (
    clickEvent,
    eventId
  ) => {
    clickEvent.stopPropagation();

    if (openActionId === eventId) {
      setOpenActionId(null);
      return;
    }

    const buttonRect =
      clickEvent.currentTarget
        .getBoundingClientRect();

    const menuWidth = 125;
    const menuHeight = 110;
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

    setOpenActionId(eventId);
  };

  const openEventDetailsSheet = async (
    event
  ) => {
    try {
      setOpenActionId(null);
      setLoadingEventDetailsSheet(true);

      const details =
        await getEventDetailsSheet(
          event.id
        );

      setEventDetailsSheet({
        ...details,
        departureTime:
          details.departureTime ||
          event.departureTime ||
          "",
      });
    } catch (error) {
      console.error(
        "Error loading event details sheet:",
        error
      );

      showAlert({
        message:
          error.message ||
          "Could not load event details sheet.",
      });
    } finally {
      setLoadingEventDetailsSheet(false);
    }
  };

  const closeEventDetailsSheet = () => {
    if (loadingEventDetailsSheet) {
      return;
    }

    setIsEventDetailsExportOpen(false);
    setEventDetailsSheet(null);
  };

  const exportEventDetailsPdf = async () => {
    if (!eventDetailsSheet) {
      return;
    }

    const details =
      eventDetailsSheet;

    const document = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth =
      document.internal.pageSize.getWidth();

    const left = 14;
    const right = 14;
    const contentWidth =
      pageWidth - left - right;

    const brown = [113, 48, 6];
    const dark = [33, 27, 23];
    const muted = [108, 97, 89];
    const border = [240, 221, 207];
    const soft = [255, 250, 246];
    const softHeader = [255, 245, 237];

    document.setTextColor(...dark);
    document.setFontSize(17);
    document.setFont(
      "helvetica",
      "bold"
    );
    document.text(
      "Event Details Sheet",
      left,
      16
    );

    document.setFont(
      "helvetica",
      "normal"
    );
    document.setFontSize(8);
    document.setTextColor(...muted);
    document.text(
      "Complete event, staff and payment details",
      left,
      22
    );

    const infoCards = [
      [
        "Event Code",
        details.eventCode || "-",
      ],
      [
        "Event Name",
        details.eventName || "-",
      ],
      [
        "Client",
        details.client || "-",
      ],
      [
        "Date",
        formatDate(details.date),
      ],
      [
        "Branch",
        details.branch || "-",
      ],
      [
        "Location",
        `${details.location || "-"}${
          details.area
            ? ` - ${details.area}`
            : ""
        }`,
      ],
      [
        "Departure Time",
        formatTime(
          details.departureTime
        ),
      ],
      [
        "Start Time",
        formatTime(
          details.startTime
        ),
      ],
      [
        "End Time",
        formatTime(details.endTime),
      ],
    ];

    const infoGap = 2;
    const infoCardWidth =
      (
        contentWidth -
        infoGap *
          (infoCards.length - 1)
      ) /
      infoCards.length;

    const infoY = 28;
    const infoHeight = 16;

    infoCards.forEach(
      ([label, value], index) => {
        const x =
          left +
          index *
            (infoCardWidth + infoGap);

        document.setDrawColor(...border);
        document.setFillColor(...soft);
        document.roundedRect(
          x,
          infoY,
          infoCardWidth,
          infoHeight,
          2,
          2,
          "FD"
        );

        document.setFont(
          "helvetica",
          "normal"
        );
        document.setTextColor(...muted);
        document.setFontSize(5.5);
        document.text(
          label,
          x + 2.5,
          infoY + 5
        );

        document.setFont(
          "helvetica",
          "bold"
        );
        document.setTextColor(...dark);
        document.setFontSize(7);

        const valueLines =
          document.splitTextToSize(
            String(value || "-"),
            infoCardWidth - 5
          );

        document.text(
          valueLines.slice(0, 2),
          x + 2.5,
          infoY + 10.5
        );
      }
    );

    const drawSectionHeader = ({
      y,
      title,
      subtitle,
      total,
    }) => {
      document.setDrawColor(...border);
      document.setFillColor(
        255,
        255,
        255
      );
      document.roundedRect(
        left,
        y,
        contentWidth,
        14,
        2.5,
        2.5,
        "FD"
      );

      document.setFont(
        "helvetica",
        "bold"
      );
      document.setTextColor(...dark);
      document.setFontSize(10);
      document.text(
        title,
        left + 4,
        y + 5.5
      );

      document.setFont(
        "helvetica",
        "normal"
      );
      document.setTextColor(...muted);
      document.setFontSize(6);
      document.text(
        subtitle,
        left + 4,
        y + 10
      );

      document.setFont(
        "helvetica",
        "bold"
      );
      document.setTextColor(...brown);
      document.setFontSize(9);
      document.text(
        `${Number(
          total || 0
        ).toLocaleString(
          "en-US"
        )} EGP`,
        pageWidth - right - 4,
        y + 7.5,
        {
          align: "right",
        }
      );
    };

    const waitersSectionY =
      infoY + infoHeight + 5;

    drawSectionHeader({
      y: waitersSectionY,
      title: "Waiters",
      subtitle:
        "Assigned waiters and saved event rates.",
      total: details.waiterTotal,
    });

    autoTable(document, {
      startY:
        waitersSectionY + 14,
      head: [[
        "Name",
        "Role",
        "Reports To",
        "Attendance",
        "Event Rate",
        "Payable",
      ]],
      body:
        details.waiters.length > 0
          ? details.waiters.map(
              (waiter) => [
                waiter.name || "-",
                waiter.role || "-",
                waiter.reportsTo ||
                  "-",
                waiter.attendance ||
                  "Assigned",
                `${Number(
                  waiter.eventRate ||
                    0
                ).toLocaleString(
                  "en-US"
                )} EGP`,
                `${Number(
                  waiter.payableAmount ||
                    0
                ).toLocaleString(
                  "en-US"
                )} EGP`,
              ]
            )
          : [[
              "No waiters assigned",
              "",
              "",
              "",
              "",
              "",
            ]],
      theme: "grid",
      styles: {
        fontSize: 6.5,
        cellPadding: 2,
        textColor: dark,
        lineColor: border,
        lineWidth: 0.15,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: softHeader,
        textColor: dark,
        fontStyle: "bold",
        lineColor: border,
        lineWidth: 0.15,
      },
      alternateRowStyles: {
        fillColor: [
          255,
          255,
          255,
        ],
      },
      margin: {
        left,
        right,
      },
      tableLineColor: border,
      tableLineWidth: 0.15,
    });

    const driverSectionY =
      (document.lastAutoTable
        ?.finalY ||
        waitersSectionY + 25) + 5;

    drawSectionHeader({
      y: driverSectionY,
      title: "Driver",
      subtitle:
        "Driver assignment and event payment.",
      total: details.driverTotal,
    });

    autoTable(document, {
      startY:
        driverSectionY + 14,
      head: [[
        "Name",
        "Role",
        "Reports To",
        "Payment To",
        "Event Amount",
      ]],
      body: details.driver
        ? [[
            details.driver.name ||
              "-",
            details.driver.role ||
              "-",
            details.driver
              .reportsTo || "-",
            details.driver
              .paymentTo || "-",
            `${Number(
              details.driver
                .eventAmount || 0
            ).toLocaleString(
              "en-US"
            )} EGP`,
          ]]
        : [[
            "No driver assigned to this event.",
            "",
            "",
            "",
            "",
          ]],
      theme: "grid",
      styles: {
        fontSize: 6.5,
        cellPadding: 2,
        textColor: dark,
        lineColor: border,
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: softHeader,
        textColor: dark,
        fontStyle: "bold",
        lineColor: border,
        lineWidth: 0.15,
      },
      margin: {
        left,
        right,
      },
      tableLineColor: border,
      tableLineWidth: 0.15,
    });

    const totalsY =
      (document.lastAutoTable
        ?.finalY ||
        driverSectionY + 25) + 5;

    const totalGap = 3;
    const totalCardWidth =
      (
        contentWidth -
        totalGap * 2
      ) / 3;

    const totalCards = [
      [
        "Waiters Total",
        details.waiterTotal || 0,
        false,
      ],
      [
        "Driver Total",
        details.driverTotal || 0,
        false,
      ],
      [
        "Total Event Staff Cost",
        details.totalStaffCost || 0,
        true,
      ],
    ];

    totalCards.forEach(
      ([label, value, highlight], index) => {
        const x =
          left +
          index *
            (
              totalCardWidth +
              totalGap
            );

        document.setDrawColor(...border);
        document.setFillColor(
          ...(highlight
            ? [255, 235, 218]
            : soft)
        );

        document.roundedRect(
          x,
          totalsY,
          totalCardWidth,
          17,
          2.5,
          2.5,
          "FD"
        );

        document.setFont(
          "helvetica",
          "normal"
        );
        document.setTextColor(...muted);
        document.setFontSize(6);
        document.text(
          label,
          x + 3,
          totalsY + 6
        );

        document.setFont(
          "helvetica",
          "bold"
        );
        document.setTextColor(...brown);
        document.setFontSize(10);
        document.text(
          `${Number(
            value
          ).toLocaleString(
            "en-US"
          )} EGP`,
          x + 3,
          totalsY + 12.5
        );
      }
    );

    document.save(
      `${details.eventCode}-event-details-sheet.pdf`
    );
  };

  const exportEventDetailsExcel = async () => {
    if (!eventDetailsSheet) {
      return;
    }

    const details =
      eventDetailsSheet;

    const rows = [
      [
        "Event Details Sheet",
      ],
      [],
      [
        "Event Code",
        details.eventCode,
        "Event Name",
        details.eventName,
      ],
      [
        "Client",
        details.client,
        "Date",
        formatDate(details.date),
      ],
      [
        "Branch",
        details.branch,
        "Location",
        `${details.location || ""}${
          details.area
            ? ` - ${details.area}`
            : ""
        }`,
      ],
      [
        "Departure Time",
        formatTime(
          details.departureTime
        ),
        "Start Time",
        formatTime(
          details.startTime
        ),
      ],
      [
        "End Time",
        formatTime(details.endTime),
        "",
        "",
      ],
      [
        "Status",
        details.status,
        "Drinks Included",
        details.hasDrinks
          ? "Yes"
          : "No",
      ],
      [],
      ["Waiters"],
      [
        "Name",
        "Role",
        "Reports To",
        "Attendance",
        "Event Rate",
        "Payable Amount",
      ],
      ...details.waiters.map(
        (waiter) => [
          waiter.name,
          waiter.role,
          waiter.reportsTo || "-",
          waiter.attendance,
          Number(
            waiter.eventRate || 0
          ),
          Number(
            waiter.payableAmount ||
              0
          ),
        ]
      ),
      [],
      [
        "Waiters Total",
        Number(
          details.waiterTotal || 0
        ),
      ],
      [],
      ["Driver"],
      [
        "Name",
        "Role",
        "Reports To",
        "Payment To",
        "Event Amount",
      ],
      details.driver
        ? [
            details.driver.name,
            details.driver.role,
            details.driver
              .reportsTo || "-",
            details.driver
              .paymentTo || "-",
            Number(
              details.driver
                .eventAmount || 0
            ),
          ]
        : [
            "No driver assigned",
            "",
            "",
            "",
            0,
          ],
      [],
      [
        "Driver Total",
        Number(
          details.driverTotal || 0
        ),
      ],
      [
        "Total Event Staff Cost",
        Number(
          details.totalStaffCost ||
            0
        ),
      ],
      
    ];

    const worksheet =
      XLSX.utils.aoa_to_sheet(
        rows
      );

    worksheet["!cols"] = [
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Event Details"
    );

    XLSX.writeFile(
      workbook,
      `${details.eventCode}-event-details-sheet.xlsx`
    );
  };

  const handleEventDetailsExport = async (
    type
  ) => {
    setIsEventDetailsExportOpen(
      false
    );

    if (type === "pdf") {
      await exportEventDetailsPdf();
      return;
    }

    await exportEventDetailsExcel();
  };

  const handleCancelEvent = async (
    event
  ) => {
    if (!canEdit) {
      await showAlert({
        title: "Permission Denied",
        message:
          "You do not have permission to cancel events.",
        type: "warning",
      });

      return;
    }

    if (event.status === "Cancelled") {
      return;
    }

    const confirmed = await showConfirm({
      message:
        "Are you sure you want to cancel this event?",
    });

    if (!confirmed) {
      return;
    }

    try {
      const updatedEvent =
        await updateEvent(
          event.id,
          {
            name: event.name,
            client: event.client,
            date: event.date,
            departureTime:
              event.departureTime,
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
            area: event.area,
            branch: event.branch,
            driverId:
              event.driverId || "",
            waiterIds:
              event.waiterIds || [],
            hasDrinks:
              Boolean(event.hasDrinks),
            status: "Cancelled",
          }
        );

      setEvents((currentEvents) =>
        currentEvents.map(
          (currentEvent) =>
            currentEvent.id ===
            event.id
              ? updatedEvent
              : currentEvent
        )
      );

      setOpenActionId(null);
    } catch (error) {
      console.error(
        "Error cancelling event:",
        error
      );

      showAlert({
        message:
          error.message ||
          "Could not cancel event.",
      });
    }
  };

  const handleDeleteEvent = async (
    eventId
  ) => {
    if (!canDelete) {
      await showAlert({
        title: "Permission Denied",
        message:
          "You do not have permission to delete events.",
        type: "warning",
      });

      return;
    }

    const confirmed = await showConfirm({
      message: "Are you sure you want to delete this event?",
    });

    if (!confirmed) {
      return;
    }

    try {
      await removeEvent(eventId);

      setEvents((currentEvents) =>
        currentEvents.filter(
          (event) => event.id !== eventId
        )
      );

      setOpenActionId(null);
    } catch (error) {
      console.error(
        "Error deleting event:",
        error
      );

      if (error.code === "23503") {
        showAlert({
        message: "This event cannot be deleted because it is connected to a dispatch or another record.",
      });
      } else {
        showAlert({
        message: error.message ||
            "Could not delete event.",
      });
      }
    }
  };

  const toggleWaiter = (waiterId) => {
    setFormData((currentData) => {
      const normalizedId =
        String(waiterId);

      const isSelected =
        currentData.waiterIds.some(
          (id) =>
            String(id) ===
            normalizedId
        );

      return {
        ...currentData,
        waiterIds: isSelected
          ? currentData.waiterIds.filter(
              (id) =>
                String(id) !==
                normalizedId
            )
          : [
              ...currentData.waiterIds,
              waiterId,
            ],
      };
    });
  };

  const removeWaiter = (
    event,
    waiterId
  ) => {
    event.stopPropagation();

    setFormData((currentData) => ({
      ...currentData,
      waiterIds:
        currentData.waiterIds.filter(
          (id) =>
            String(id) !==
            String(waiterId)
        ),
    }));
  };

  const handleFormChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((currentData) => {
      if (name === "branch") {
        return {
          ...currentData,
          branch: value,
          driverId: "",
          waiterIds: [],
        };
      }

      return {
        ...currentData,
        [name]: value,
      };
    });
  };

  const openAddModal = async () => {
    if (!canAdd) {
      await showAlert({
        title: "Permission Denied",
        message:
          "You do not have permission to add events.",
        type: "warning",
      });

      return;
    }

    setEditingEventId(null);
    setFormData(emptyForm);
    setOpenActionId(null);
    setShowWaitersDropdown(false);
    setShowEventModal(true);
  };

  const openEditModal = async (event) => {
    if (!canEdit) {
      await showAlert({
        title: "Permission Denied",
        message:
          "You do not have permission to edit events.",
        type: "warning",
      });

      return;
    }

    setEditingEventId(event.id);

    setFormData({
      name: event.name,
      client: event.client,
      date: event.date,
      departureTime:
        event.departureTime,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      area: event.area,
      branch: event.branch,
      driverId: event.driverId || "",
      waiterIds: event.waiterIds || [],
      hasDrinks: Boolean(
        event.hasDrinks
      ),
      status: event.status,
    });

    setOpenActionId(null);
    setShowWaitersDropdown(false);
    setShowEventModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowEventModal(false);
    setShowWaitersDropdown(false);
    setEditingEventId(null);
    setFormData(emptyForm);
  };

  const validateEventForm = () => {
    const requiredFields = [
      "name",
      "client",
      "date",
      "departureTime",
      "startTime",
      "endTime",
      "location",
      "area",
      "branch",
      "driverId",
    ];

    const hasEmptyField =
      requiredFields.some(
        (field) =>
          !String(
            formData[field] || ""
          ).trim()
      );

    if (hasEmptyField) {
      showAlert({
        message: "Please complete all event fields.",
      });

      return false;
    }

    if (
      !Array.isArray(
        formData.waiterIds
      ) ||
      formData.waiterIds.length === 0
    ) {
      showAlert({
        message:
          "Please select at least one waiter.",
      });

      return false;
    }

    return true;
  };

  const handleSaveEvent = async (
    event
  ) => {
    event.preventDefault();

    const requiredPermission =
      editingEventId ? canEdit : canAdd;

    if (!requiredPermission) {
      await showAlert({
        title: "Permission Denied",
        message: editingEventId
          ? "You do not have permission to edit events."
          : "You do not have permission to add events.",
        type: "warning",
      });

      return;
    }

    if (!validateEventForm()) {
      return;
    }

    try {
      setSaving(true);

      if (editingEventId) {
        const updatedEvent =
          await updateEvent(
            editingEventId,
            formData
          );

        setEvents(
          (currentEvents) =>
            currentEvents.map(
              (currentEvent) =>
                currentEvent.id ===
                editingEventId
                  ? updatedEvent
                  : currentEvent
            )
        );
      } else {
        const newEvent =
          await createEvent(formData);

        setEvents(
          (currentEvents) => [
            newEvent,
            ...currentEvents,
          ]
        );
      }

      setShowEventModal(false);
      setShowWaitersDropdown(false);
      setEditingEventId(null);
      setFormData(emptyForm);
    } catch (error) {
      console.error(
        "Error saving event:",
        error
      );

      if (error.code === "23505") {
        showAlert({
        message: "An event with this code already exists.",
      });
      } else {
        showAlert({
        message: error.message ||
            "Could not save event.",
      });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar activePage="events" />

      <main className="events-main">
        <Topbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        <section className="events-title-section">
          <div>
            <h1>{ui("Events", "الفعاليات")}</h1>
            <p>{ui("Manage all your events", "إدارة جميع الفعاليات")}</p>
          </div>

          <button
            type="button"
            className="add-event-button"
            onClick={openAddModal}
          >
            <FiPlus />
            <span>{ui("Add New Event", "إضافة فعالية جديدة")}</span>
          </button>
        </section>

        <section className="events-stats">
          <StatCard
            icon={<FiCalendar />}
            title={ui("Total Events", "إجمالي الفعاليات")}
            number={totalActiveEvents}
            description={ui("All events", "جميع الفعاليات")}
          />

          <StatCard
            icon={<FiCheckCircle />}
            title={ui("Today's Events", "فعاليات اليوم")}
            number={todayEvents}
            description={ui("Events today", "فعاليات اليوم")}
          />

          <StatCard
            icon={<FiCalendar />}
            title={ui("Upcoming Events", "الفعاليات القادمة")}
            number={upcomingEvents}
            description={ui("Next 7 days", "خلال 7 أيام القادمة")}
          />

          <StatCard
            icon={<FiFlag />}
            title={ui("Completed Events", "الفعاليات المكتملة")}
            number={
              events.filter(
                (event) =>
                  event.status ===
                  "Completed"
              ).length
            }
            description={ui("Completed", "مكتملة")}
            descriptionClass="orange"
          />

          <StatCard
            icon={<FiXCircle />}
            title={ui("Cancelled Events", "الفعاليات الملغاة")}
            number={
              events.filter(
                (event) =>
                  event.status ===
                  "Cancelled"
              ).length
            }
            description={ui("Cancelled", "ملغاة")}
            descriptionClass="red"
          />
        </section>

        <section className="events-table-card">
          <div className="events-table-toolbar">
            <div className="events-tabs">
              {tabs.map((tab) => (
                <button
                  key={getTabLabel(tab)}
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
                  {getTabLabel(tab)}
                </button>
              ))}
            </div>

            <div className="events-filters">
              <div className="events-table-search">
                <FiSearch />

                <input
                  type="text"
                  placeholder={ui("Search events...", "ابحث في الفعاليات...")}
                  value={searchValue}
                  onChange={(event) =>
                    setSearchValue(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="branch-filter-wrapper">
                <select
                  className="branch-filter"
                  value={selectedBranch}
                  onChange={(event) =>
                    setSelectedBranch(
                      event.target.value
                    )
                  }
                  aria-label={ui("Filter events by branch", "تصفية الفعاليات حسب الفرع")}
                >
                  <option value="All Branches">
                    {ui("All Branches", "جميع الفروع")}
                  </option>

                  {branches.map((branch) => (
                    <option
                      key={branch}
                      value={branch}
                    >
                      {getBranchLabel(branch)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="events-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label={ui("Select all events", "تحديد كل الفعاليات")}
                    />
                  </th>

                  <th>{ui("Event Type", "نوع الفعالية")}</th>
                  <th>{ui("Client", "العميل")}</th>
                  <th>{ui("Date", "التاريخ")}</th>
                  <th>{ui("Location", "الموقع")}</th>
                  <th>{ui("Branch", "الفرع")}</th>
                  <th>{ui("# of Waiters", "عدد النادلين")}</th>
                  <th>{ui("Driver", "السائق")}</th>
                  <th>{ui("Status", "الحالة")}</th>
                  <th>{ui("Actions", "الإجراءات")}</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="events-empty-state"
                    >
                      {ui("Loading events...", "جاري تحميل الفعاليات...")}
                    </td>
                  </tr>
                ) : filteredEvents.length >
                  0 ? (
                  paginatedEvents.map(
                    (event) => (
                      <tr key={event.id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Select ${event.name}`}
                          />
                        </td>

                        <td>
                          <div className="event-name-cell">
                            <div className="event-table-icon">
                              <FiCalendar />
                            </div>

                            <div>
                              <strong>
                                {event.name}
                              </strong>

                              <span>
                                {
                                  event.eventCode
                                }
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {event.client}
                        </td>

                        <td>
                          <div className="event-date-times">
                            <span className="event-date">
                              {formatDate(
                                event.date
                              )}
                            </span>

                            <span>
                              <strong>
                                {ui("Start:", "البداية:")}
                              </strong>{" "}
                              {formatTime(
                                event.startTime
                              )}
                            </span>

                            <span>
                              <strong>
                                {ui("End:", "النهاية:")}
                              </strong>{" "}
                              {formatTime(
                                event.endTime
                              )}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="two-lines">
                            <span>
                              {
                                event.location
                              }
                            </span>

                            <span>
                              {event.area}
                            </span>
                          </div>
                        </td>

                        <td>
                          {getBranchLabel(event.branch)}
                        </td>

                        <td>
                          {event.waiters}
                        </td>

                        <td>
                          {event.driver ||
                            "-"}
                        </td>

                        <td>
                          <span
                            className={`event-status ${getStatusClass(
                              event.status
                            )}`}
                          >
                            {getStatusLabel(event.status)}
                          </span>
                        </td>

                        <td className="event-action-cell">
                          <div className="event-actions">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  event
                                )
                              }
                              aria-label={`Edit ${event.name}`}
                            >
                              <FiEdit2 />
                            </button>

                            <div className="event-more-wrapper">
                              <button
                                type="button"
                                className="more-action-button"
                                onClick={(
                                  clickEvent
                                ) =>
                                  toggleActionMenu(
                                    clickEvent,
                                    event.id
                                  )
                                }
                                aria-label={`More actions for ${event.name}`}
                              >
                                <FiMoreVertical />
                              </button>

                              {openActionId ===
                                event.id && (
                                <div
                                  className="event-action-menu"
                                  style={{
                                    top:
                                      actionMenuPosition.top,
                                    left:
                                      actionMenuPosition.left,
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditModal(
                                        event
                                      )
                                    }
                                  >
                                    <FiEdit2 />
                                    {ui("Edit", "تعديل")}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEventDetailsSheet(
                                        event
                                      )
                                    }
                                  >
                                    <FiFileText />
                                    {ui("Event Details Sheet", "تفاصيل الفعالية")}
                                  </button>

                                  {event.status !==
                                    "Cancelled" && (
                                    <button
                                      type="button"
                                      className="event-cancel-action"
                                      onClick={() =>
                                        handleCancelEvent(
                                          event
                                        )
                                      }
                                    >
                                      <FiX />
                                      {ui("Cancel", "إلغاء")}
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className="event-delete-action"
                                    onClick={() =>
                                      handleDeleteEvent(
                                        event.id
                                      )
                                    }
                                  >
                                    <FiTrash2 />
                                    {ui("Delete", "حذف")}
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
                      className="events-empty-state"
                    >
                      {ui("No events match your search or selected filters.", "لا توجد فعاليات تطابق البحث أو عوامل التصفية المحددة.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="events-pagination">
            <p>
              {ui("Showing", "عرض")}{" "}
              {paginatedEvents.length} of{" "}
              {filteredEvents.length} {ui("events", "فعالية")}
            </p>

            {filteredEvents.length > 0 && (
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
                  aria-label={ui("Previous page", "الصفحة السابقة")}
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
                  aria-label={ui("Next page", "الصفحة التالية")}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {(eventDetailsSheet ||
        loadingEventDetailsSheet) && (
        <div
          className="event-modal-overlay"
          onMouseDown={
            closeEventDetailsSheet
          }
        >
          <div
            className="event-modal event-details-sheet-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            {loadingEventDetailsSheet ? (
              <div className="event-details-sheet-loading">
                {ui("Loading event details...", "جاري تحميل تفاصيل الفعالية...")}
              </div>
            ) : (
              <>
                <div className="event-modal-header event-details-sheet-header">
                  <div>
                    <h2>
                      {ui("Event Details Sheet", "تفاصيل الفعالية")}
                    </h2>
                    <p>
                      {ui("Complete event, staff and payment details", "تفاصيل الفعالية والموظفين والمدفوعات")}
                    </p>
                  </div>

                  <div className="event-details-sheet-header-actions">
                    <div
                      className="event-details-export-wrapper"
                      ref={
                        eventDetailsExportRef
                      }
                    >
                      <button
                        type="button"
                        className="event-details-export-main-button"
                        onClick={() =>
                          setIsEventDetailsExportOpen(
                            (current) =>
                              !current
                          )
                        }
                        aria-haspopup="menu"
                        aria-expanded={
                          isEventDetailsExportOpen
                        }
                      >
                        <FiDownload />
                        {ui("Export", "تصدير")}
                        <FiChevronDown
                          className={
                            isEventDetailsExportOpen
                              ? "open"
                              : ""
                          }
                        />
                      </button>

                      {isEventDetailsExportOpen && (
                        <div
                          className="event-details-export-menu"
                          role="menu"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() =>
                              handleEventDetailsExport(
                                "pdf"
                              )
                            }
                          >
                            {ui("Export as PDF", "تصدير PDF")}
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() =>
                              handleEventDetailsExport(
                                "excel"
                              )
                            }
                          >
                            {ui("Export as Excel", "تصدير Excel")}
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="event-modal-close"
                      onClick={
                        closeEventDetailsSheet
                      }
                    >
                      <FiX />
                    </button>
                  </div>
                </div>

                <div className="event-details-info-grid">
                  <div>
                    <span>{ui("Event Code", "كود الفعالية")}</span>
                    <strong>
                      {eventDetailsSheet.eventCode}
                    </strong>
                  </div>
                  <div>
                    <span>{ui("Event Name", "اسم الفعالية")}</span>
                    <strong>
                      {eventDetailsSheet.eventName}
                    </strong>
                  </div>
                  <div>
                    <span>{ui("Client", "العميل")}</span>
                    <strong>
                      {eventDetailsSheet.client ||
                        "-"}
                    </strong>
                  </div>
                  <div>
                    <span>{ui("Date", "التاريخ")}</span>
                    <strong>
                      {formatDate(
                        eventDetailsSheet.date
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>{ui("Branch", "الفرع")}</span>
                    <strong>
                      {getBranchLabel(eventDetailsSheet.branch) ||
                        "-"}
                    </strong>
                  </div>
                  <div>
                    <span>{ui("Location", "الموقع")}</span>
                    <strong>
                      {eventDetailsSheet.location}
                      {eventDetailsSheet.area
                        ? ` - ${eventDetailsSheet.area}`
                        : ""}
                    </strong>
                  </div>
                  <div>
                    <span>{ui("Departure Time", "وقت المغادرة")}</span>
                    <strong>
                      {formatTime(
                        eventDetailsSheet.departureTime
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>{ui("Start Time", "وقت البداية")}</span>
                    <strong>
                      {formatTime(
                        eventDetailsSheet.startTime
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>{ui("End Time", "وقت النهاية")}</span>
                    <strong>
                      {formatTime(
                        eventDetailsSheet.endTime
                      )}
                    </strong>
                  </div>
                </div>

                <section className="event-details-sheet-section">
                  <div className="event-details-sheet-section-header">
                    <div>
                      <h3>{ui("Waiters", "النادلون")}</h3>
                      <p>
                        {ui("Assigned waiters and saved event rates.", "النادلون المعيّنون وأسعار الفعالية المحفوظة.")}
                      </p>
                    </div>

                    <strong>
                      {Number(
                        eventDetailsSheet.waiterTotal ||
                          0
                      ).toLocaleString(
                        "en-US"
                      )}{" "}
                      EGP
                    </strong>
                  </div>

                  <div className="event-details-sheet-table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>{ui("Name", "الاسم")}</th>
                          <th>{ui("Role", "الدور")}</th>
                          <th>{ui("Reports To", "يتبع")}</th>
                          <th>{ui("Attendance", "الحضور")}</th>
                          <th>{ui("Event Rate", "سعر الفعالية")}</th>
                          <th>{ui("Payable", "المستحق")}</th>
                        </tr>
                      </thead>

                      <tbody>
                        {eventDetailsSheet.waiters
                          .length > 0 ? (
                          eventDetailsSheet.waiters.map(
                            (waiter) => (
                              <tr
                                key={`sheet-waiter-${waiter.id}`}
                              >
                                <td>
                                  {waiter.name}
                                </td>
                                <td>
                                  {waiter.role}
                                </td>
                                <td>
                                  {waiter.reportsTo ||
                                    "-"}
                                </td>
                                <td>
                                  {waiter.attendance}
                                </td>
                                <td>
                                  {Number(
                                    waiter.eventRate ||
                                      0
                                  ).toLocaleString(
                                    "en-US"
                                  )}{" "}
                                  EGP
                                </td>
                                <td>
                                  {Number(
                                    waiter.payableAmount ||
                                      0
                                  ).toLocaleString(
                                    "en-US"
                                  )}{" "}
                                  EGP
                                </td>
                              </tr>
                            )
                          )
                        ) : (
                          <tr>
                            <td
                              colSpan="6"
                              className="event-details-sheet-empty"
                            >
                              {ui("No waiters assigned to this event.", "لا يوجد نادلون معيّنون لهذه الفعالية.")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="event-details-sheet-section">
                  <div className="event-details-sheet-section-header">
                    <div>
                      <h3>{ui("Driver", "السائق")}</h3>
                      <p>
                        {ui("Driver assignment and event payment.", "تعيين السائق ومدفوعات الفعالية.")}
                      </p>
                    </div>

                    <strong>
                      {Number(
                        eventDetailsSheet.driverTotal ||
                          0
                      ).toLocaleString(
                        "en-US"
                      )}{" "}
                      EGP
                    </strong>
                  </div>

                  <div className="event-details-sheet-table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>{ui("Name", "الاسم")}</th>
                          <th>{ui("Role", "الدور")}</th>
                          <th>{ui("Reports To", "يتبع")}</th>
                          <th>{ui("Payment To", "الدفع إلى")}</th>
                          <th>{ui("Event Amount", "مبلغ الفعالية")}</th>
                        </tr>
                      </thead>

                      <tbody>
                        {eventDetailsSheet.driver ? (
                          <tr>
                            <td>
                              {
                                eventDetailsSheet
                                  .driver.name
                              }
                            </td>
                            <td>
                              {
                                eventDetailsSheet
                                  .driver.role
                              }
                            </td>
                            <td>
                              {eventDetailsSheet
                                .driver.reportsTo ||
                                "-"}
                            </td>
                            <td>
                              {eventDetailsSheet
                                .driver.paymentTo ||
                                "-"}
                            </td>
                            <td>
                              {Number(
                                eventDetailsSheet
                                  .driver.eventAmount ||
                                  0
                              ).toLocaleString(
                                "en-US"
                              )}{" "}
                              EGP
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              className="event-details-sheet-empty"
                            >
                              No driver assigned
                              to this event.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="event-details-sheet-totals">
                  <div>
                    <span>{ui("Waiters Total", "إجمالي النادلين")}</span>
                    <strong>
                      {Number(
                        eventDetailsSheet.waiterTotal ||
                          0
                      ).toLocaleString(
                        "en-US"
                      )}{" "}
                      EGP
                    </strong>
                  </div>

                  <div>
                    <span>{ui("Driver Total", "إجمالي السائق")}</span>
                    <strong>
                      {Number(
                        eventDetailsSheet.driverTotal ||
                          0
                      ).toLocaleString(
                        "en-US"
                      )}{" "}
                      EGP
                    </strong>
                  </div>

                  <div className="event-details-sheet-grand-total">
                    <span>
                      {ui("Total Event Staff Cost", "إجمالي تكلفة طاقم الفعالية")}
                    </span>
                    <strong>
                      {Number(
                        eventDetailsSheet.totalStaffCost ||
                          0
                      ).toLocaleString(
                        "en-US"
                      )}{" "}
                      EGP
                    </strong>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showEventModal && (
        <div
          className="event-modal-overlay"
          onMouseDown={closeModal}
          role="presentation"
        >
          <form
            className="event-modal"
            onSubmit={handleSaveEvent}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="event-modal-header">
              <div>
                <h2>
                  {editingEventId
                    ? ui("Edit Event", "تعديل الفعالية")
                    : ui("Add New Event", "إضافة فعالية جديدة")}
                </h2>

                <p>
                  {editingEventId
                    ? ui("Update the event details.", "حدّث تفاصيل الفعالية.")
                    : ui("Enter the new event details.", "أدخل تفاصيل الفعالية الجديدة.")}
                </p>
              </div>

              <button
                type="button"
                className="event-modal-close"
                onClick={closeModal}
                aria-label={ui("Close event form", "إغلاق نموذج الفعالية")}
                disabled={saving}
              >
                <FiX />
              </button>
            </div>

            <div className="event-modal-grid">
              <label>
                {ui("Event Type", "نوع الفعالية")}

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder={ui("Family Wedding", "حفل زفاف")}
                  disabled={saving}
                />
              </label>

              <label>
                {ui("Client", "العميل")}

                <input
                  type="text"
                  name="client"
                  value={formData.client}
                  onChange={handleFormChange}
                  placeholder={ui("Client name", "اسم العميل")}
                  disabled={saving}
                />
              </label>

              <label className="event-modal-full-field">
                {ui("Date", "التاريخ")}

                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </label>

              <div className="event-modal-times">
                <label>
                  {ui("Departure Time", "وقت التحرك")}

                  <input
                    type="time"
                    name="departureTime"
                    value={
                      formData.departureTime
                    }
                    onChange={handleFormChange}
                    disabled={saving}
                  />
                </label>

                <label>
                  {ui("Event Start Time", "وقت بداية الفعالية")}

                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleFormChange}
                    disabled={saving}
                  />
                </label>

                <label>
                  {ui("Event End Time", "وقت نهاية الفعالية")}

                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleFormChange}
                    disabled={saving}
                  />
                </label>
              </div>

              <label>
                {ui("Location", "الموقع")}

                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  placeholder={ui("Villa 45", "فيلا 45")}
                  disabled={saving}
                />
              </label>

              <label>
                {ui("Area", "المنطقة")}

                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleFormChange}
                  placeholder={ui("New Cairo", "القاهرة الجديدة")}
                  disabled={saving}
                />
              </label>

              <label>
                {ui("Branch", "الفرع")}

                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleFormChange}
                  disabled={saving}
                >
                  <option value="Cairo">
                    {getBranchLabel("Cairo")}
                  </option>

                  <option value="Alex">
                    {getBranchLabel("Alex")}
                  </option>
                </select>
              </label>

              <label>
                {ui("Driver", "السائق")}

                <select
                  name="driverId"
                  value={formData.driverId}
                  onChange={handleFormChange}
                  disabled={saving}
                >
                  <option value="">
                    {ui("Select driver", "اختر السائق")}
                  </option>

                  {branchDrivers.map((driver) => (
                    <option
                      key={driver.id}
                      value={driver.id}
                    >
                      {driver.full_name}
                      {driver.staff_role
                        ? ` - ${driver.staff_role}`
                        : ""}
                      {driver.reports_to_name
                        ? ` (under ${driver.reports_to_name})`
                        : ""}
                      {driver.staff_code
                        ? ` [${driver.staff_code}]`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>

              <div
                className="event-waiters-field event-modal-full-field"
                ref={waitersFieldRef}
              >
                <span className="event-field-label">
                  {ui("Waiters", "النادلون")}
                </span>

                <button
                  type="button"
                  className={`event-waiters-trigger ${
                    showWaitersDropdown
                      ? "open"
                      : ""
                  }`}
                  onClick={() =>
                    setShowWaitersDropdown(
                      (current) => !current
                    )
                  }
                  disabled={saving}
                >
                  <span className="event-waiters-selected">
                    {formData.waiterIds.length >
                    0 ? (
                      formData.waiterIds.map(
                        (waiterId) => {
                          const waiter =
                            waiters.find(
                              (currentWaiter) =>
                                String(
                                  currentWaiter.id
                                ) ===
                                String(
                                  waiterId
                                )
                            );

                          return (
                            <span
                              key={waiterId}
                              className="event-waiter-chip"
                            >
                              {waiter?.full_name ||
                                ui("Waiter", "نادل")}

                              <span
                                role="button"
                                tabIndex={0}
                                className="event-waiter-chip-remove"
                                onClick={(event) =>
                                  removeWaiter(
                                    event,
                                    waiterId
                                  )
                                }
                                onKeyDown={(event) => {
                                  if (
                                    event.key ===
                                      "Enter" ||
                                    event.key === " "
                                  ) {
                                    removeWaiter(
                                      event,
                                      waiterId
                                    );
                                  }
                                }}
                                aria-label={`Remove ${
                                  waiter?.full_name ||
                                  "waiter"
                                }`}
                              >
                                ×
                              </span>
                            </span>
                          );
                        }
                      )
                    ) : (
                      <span className="event-waiters-placeholder">
                        {ui("Select waiters", "اختر النادلين")}
                      </span>
                    )}
                  </span>

                  <span className="event-waiters-arrow">
                    ▾
                  </span>
                </button>

                {showWaitersDropdown && (
                  <div className="event-waiters-dropdown">
                    {branchWaiters.length > 0 ? (
                      branchWaiters.map((waiter) => {
                        const isSelected =
                          formData.waiterIds.some(
                            (id) =>
                              String(id) ===
                              String(waiter.id)
                          );

                        return (
                          <label
                            key={waiter.id}
                            className="event-waiter-option"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                toggleWaiter(
                                  waiter.id
                                )
                              }
                            />

                            <span>
                              <strong>
                                {waiter.full_name}
                              </strong>

                              <small>
                                {waiter.staff_role ||
                                  ui("Waiter", "نادل")}
                                {waiter.reports_to_name
                                  ? ` • under ${waiter.reports_to_name}`
                                  : ""}
                                {waiter.event_rate !==
                                undefined
                                  ? ` • ${Number(
                                      waiter.event_rate ||
                                        0
                                    ).toLocaleString(
                                      "en-US"
                                    )} EGP/event`
                                  : ""}
                                {waiter.staff_code
                                  ? ` • ${waiter.staff_code}`
                                  : ""}
                              </small>
                            </span>
                          </label>
                        );
                      })
                    ) : (
                      <p className="event-no-waiters">
                        {ui("No active waiters found.", "لا يوجد نادلون نشطون.")}
                      </p>
                    )}
                  </div>
                )}

                <small className="event-waiters-count">
                  {ui(
                    `${formData.waiterIds.length} waiter${
                      formData.waiterIds.length === 1 ? "" : "s"
                    } selected`,
                    `تم اختيار ${formData.waiterIds.length} نادل`
                  )}
                </small>

                <small className="event-waiters-count">
                  {ui("Head waiter payment is grouped automatically with the assigned team.", "يتم تجميع مستحقات رئيس النادلين تلقائيًا مع الفريق المعيّن.")}
                </small>
              </div>

              <label className="event-drinks-field event-modal-full-field">
                <span className="event-drinks-copy">
                  <strong>
                    {ui("Drinks Included", "تشمل مشروبات")}
                  </strong>

                  <small>
                    {ui("Enable this when the event includes drinks.", "فعّل هذا الخيار عندما تشمل الفعالية مشروبات.")}
                  </small>
                </span>

                <span className="event-drinks-switch">
                  <input
                    type="checkbox"
                    name="hasDrinks"
                    checked={
                      formData.hasDrinks
                    }
                    onChange={(event) =>
                      setFormData(
                        (currentData) => ({
                          ...currentData,
                          hasDrinks:
                            event.target
                              .checked,
                        })
                      )
                    }
                    disabled={saving}
                    aria-label={ui("Drinks included", "تشمل مشروبات")}
                  />

                  <span className="event-drinks-slider" />
                </span>
              </label>
            </div>

            <div className="event-modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={closeModal}
                disabled={saving}
              >
                {ui("Cancel", "إلغاء")}
              </button>

              <button
                type="submit"
                className="save-button"
                disabled={saving}
              >
                {saving
                  ? ui("Saving...", "جاري الحفظ...")
                  : editingEventId
                    ? ui("Save Changes", "حفظ التعديلات")
                    : ui("Save Event", "حفظ الفعالية")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  title,
  number,
  description,
  descriptionClass = "",
}) {
  return (
    <article className="events-stat-card">
      <div className="events-stat-content">
        <div className="events-stat-icon">
          {icon}
        </div>

        <div className="events-stat-details">
          <h4>{title}</h4>
          <h2>{number}</h2>

          <p className={descriptionClass}>
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}
export default Events;