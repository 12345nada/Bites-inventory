import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import {
  createEvent,
  getActiveDrivers,
  getEvents,
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
  status: "Upcoming",
};

function Events() {
  const [events, setEvents] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [searchValue, setSearchValue] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 10;

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

  const [formData, setFormData] =
    useState(emptyForm);

  useEffect(() => {
    loadPageData();
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

  const loadPageData = async () => {
    try {
      setLoading(true);

      const [
        eventsData,
        driversData,
      ] = await Promise.all([
        getEvents(),
        getActiveDrivers(),
      ]);

      setEvents(eventsData);
      setDrivers(driversData);
    } catch (error) {
      console.error(
        "Error loading events:",
        error
      );

      alert(
        error.message ||
          "Could not load events."
      );
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
      "en-GB",
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
      "en-US",
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
    const menuHeight = 76;
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

  const handleDeleteEvent = async (
    eventId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this event?"
    );

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
        alert(
          "This event cannot be deleted because it is connected to a dispatch or another record."
        );
      } else {
        alert(
          error.message ||
            "Could not delete event."
        );
      }
    }
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

  const openAddModal = () => {
    setEditingEventId(null);
    setFormData(emptyForm);
    setOpenActionId(null);
    setShowEventModal(true);
  };

  const openEditModal = (event) => {
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
      status: event.status,
    });

    setOpenActionId(null);
    setShowEventModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowEventModal(false);
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
      "status",
    ];

    const hasEmptyField =
      requiredFields.some(
        (field) =>
          !String(
            formData[field] || ""
          ).trim()
      );

    if (hasEmptyField) {
      alert(
        "Please complete all event fields."
      );

      return false;
    }

    return true;
  };

  const handleSaveEvent = async (
    event
  ) => {
    event.preventDefault();

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
      setEditingEventId(null);
      setFormData(emptyForm);
    } catch (error) {
      console.error(
        "Error saving event:",
        error
      );

      if (error.code === "23505") {
        alert(
          "An event with this code already exists."
        );
      } else {
        alert(
          error.message ||
            "Could not save event."
        );
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
            <h1>Events</h1>
            <p>Manage all your events</p>
          </div>

          <button
            type="button"
            className="add-event-button"
            onClick={openAddModal}
          >
            <FiPlus />
            <span>Add New Event</span>
          </button>
        </section>

        <section className="events-stats">
          <StatCard
            icon={<FiCalendar />}
            title="Total Events"
            number={events.length}
            description="All events"
          />

          <StatCard
            icon={<FiCheckCircle />}
            title="Today's Events"
            number={todayEvents}
            description="Events today"
          />

          <StatCard
            icon={<FiCalendar />}
            title="Upcoming Events"
            number={upcomingEvents}
            description="Next 7 days"
          />

          <StatCard
            icon={<FiCheckCircle />}
            title="Confirmed Events"
            number={
              events.filter(
                (event) =>
                  event.status ===
                  "Confirmed"
              ).length
            }
            description="Confirmed"
            descriptionClass="green"
          />

          <StatCard
            icon={<FiFlag />}
            title="Completed Events"
            number={
              events.filter(
                (event) =>
                  event.status ===
                  "Completed"
              ).length
            }
            description="Completed"
            descriptionClass="orange"
          />

          <StatCard
            icon={<FiXCircle />}
            title="Cancelled Events"
            number={
              events.filter(
                (event) =>
                  event.status ===
                  "Cancelled"
              ).length
            }
            description="Cancelled"
            descriptionClass="red"
          />
        </section>

        <section className="events-table-card">
          <div className="events-table-toolbar">
            <div className="events-tabs">
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

            <div className="events-filters">
              <div className="events-table-search">
                <FiSearch />

                <input
                  type="text"
                  placeholder="Search events..."
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
                  aria-label="Filter events by branch"
                >
                  <option value="All Branches">
                    All Branches
                  </option>

                  {branches.map((branch) => (
                    <option
                      key={branch}
                      value={branch}
                    >
                      {branch}
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
                      aria-label="Select all events"
                    />
                  </th>

                  <th>Event Type</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Branch</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="events-empty-state"
                    >
                      Loading events...
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
                                Start:
                              </strong>{" "}
                              {formatTime(
                                event.startTime
                              )}
                            </span>

                            <span>
                              <strong>
                                End:
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
                          {event.branch}
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
                            {event.status}
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
                                    Edit
                                  </button>

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
                      className="events-empty-state"
                    >
                      No events match your search or
                      selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="events-pagination">
            <p>
              Showing{" "}
              {paginatedEvents.length} of{" "}
              {filteredEvents.length} events
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
                    ? "Edit Event"
                    : "Add New Event"}
                </h2>

                <p>
                  {editingEventId
                    ? "Update the event details."
                    : "Enter the new event details."}
                </p>
              </div>

              <button
                type="button"
                className="event-modal-close"
                onClick={closeModal}
                aria-label="Close event form"
                disabled={saving}
              >
                <FiX />
              </button>
            </div>

            <div className="event-modal-grid">
              <label>
                Event Type

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Family Wedding"
                  disabled={saving}
                />
              </label>

              <label>
                Client

                <input
                  type="text"
                  name="client"
                  value={formData.client}
                  onChange={handleFormChange}
                  placeholder="Client name"
                  disabled={saving}
                />
              </label>

              <label className="event-modal-full-field">
                Date

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
                  Departure Time

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
                  Event Start Time

                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleFormChange}
                    disabled={saving}
                  />
                </label>

                <label>
                  Event End Time

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
                Location

                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  placeholder="Villa 45"
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
                  placeholder="New Cairo"
                  disabled={saving}
                />
              </label>

              <label>
                Branch

                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleFormChange}
                  disabled={saving}
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

              <label className="event-modal-full-field">
                Status

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  disabled={saving}
                >
                  <option value="Upcoming">
                    Upcoming
                  </option>

                  <option value="In Progress">
                    In Progress
                  </option>

                  <option value="Confirmed">
                    Confirmed
                  </option>

                  <option value="Completed">
                    Completed
                  </option>

                  <option value="Cancelled">
                    Cancelled
                  </option>
                </select>
              </label>
            </div>

            <div className="event-modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingEventId
                    ? "Save Changes"
                    : "Save Event"}
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