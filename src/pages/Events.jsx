import { useMemo, useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";
import { useEvents } from "../context/EventsContext";

import "../styles/dashboard.css";
import "../styles/Events.css";

import {
  FiBell,
  FiSearch,
  FiPlus,
  FiCalendar,
  FiCheckCircle,
  FiFlag,
  FiXCircle,
  FiEdit2,
  FiMoreVertical,
  FiChevronDown,
  FiList,
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
  driver: "",
  status: "Upcoming",
};

function Events() {
  const {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
  } = useEvents();

  const [searchValue, setSearchValue] = useState("");
  const [activeTab, setActiveTab] =
    useState("All Events");

  const [selectedBranch, setSelectedBranch] =
    useState("All Branches");

  const [showEventModal, setShowEventModal] =
    useState(false);

  const [editingEventId, setEditingEventId] =
    useState(null);

  const [openActionId, setOpenActionId] =
    useState(null);

  const [formData, setFormData] =
    useState(emptyForm);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchValue
      .trim()
      .toLowerCase();

    return events.filter((event) => {
      const searchableValues = [
        event.id,
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

      const handleDeleteEvent = (eventId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this event?"
    );

    if (!confirmed) {
      return;
    }

    deleteEvent(eventId);
    setOpenActionId(null);
  };

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

  const branches = useMemo(
    () => [
      ...new Set(
        events.map((event) => event.branch)
      ),
    ],
    [events]
  );

  const getStatusClass = (status) =>
    status.toLowerCase().replace(/\s+/g, "-");

  const handleFormChange = (event) => {
    const { name, value } = event.target;

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
      departureTime: event.departureTime,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      area: event.area,
      branch: event.branch,
      driver: event.driver,
      status: event.status,
    });
    setOpenActionId(null);
    setShowEventModal(true);
  };

  const closeModal = () => {
    setShowEventModal(false);
    setEditingEventId(null);
    setFormData(emptyForm);
  };

  const handleSaveEvent = (event) => {
    event.preventDefault();

    const requiredFields = [
      "name",
      "client",
      "date",
      "departureTime",
      "startTime",
      "endTime",
      "location",
      "area",
      "driver",
    ];

    const hasEmptyField = requiredFields.some(
      (field) =>
        !String(formData[field] || "").trim()
    );

    if (hasEmptyField) {
      alert("Please complete all event fields.");
      return;
    }

    if (editingEventId) {
      updateEvent(editingEventId, formData);
    } else {
      addEvent(formData);
    }

    closeModal();
  };

  return (
    <div className="dashboard-page">
      <Sidebar activePage="events" />

      <main className="events-main">
        <div className="events-topbar">
          <div className="events-search">
            <FiSearch />

            <input
              type="text"
              placeholder="search anything..."
              value={searchValue}
              onChange={(event) =>
                setSearchValue(event.target.value)
              }
            />
          </div>

          <div className="events-topbar-actions">
            <div className="events-notification">
              <FiBell />
              <span />
            </div>

            <div className="events-profile" />
          </div>
        </div>

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
            number="6"
            description="Events today"
          />

          <StatCard
            icon={<FiCalendar />}
            title="Upcoming Events"
            number={
              events.filter(
                (event) =>
                  event.status === "Upcoming"
              ).length
            }
            description="Next 7 days"
          />

          <StatCard
            icon={<FiCheckCircle />}
            title="Confirmed Events"
            number={
              events.filter(
                (event) =>
                  event.status === "Confirmed"
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
                  event.status === "Completed"
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
                  event.status === "Cancelled"
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
                    activeTab === tab ? "active" : ""
                  }
                  onClick={() => setActiveTab(tab)}
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
                  <option>All Branches</option>

                  {branches.map((branch) => (
                    <option
                      key={branch}
                      value={branch}
                    >
                      {branch}
                    </option>
                  ))}
                </select>

                <FiChevronDown className="branch-filter-icon" />
              </div>

              <button
                type="button"
                className="view-button"
                aria-label="Change table view"
              >
                <FiList />
              </button>
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
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
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

                            <span>{event.id}</span>
                          </div>
                        </div>
                      </td>

                      <td>{event.client}</td>

                      <td>
                        <div className="event-date-times">
                          <span className="event-date">
                            {event.date}
                          </span>
                          <span>
                            <strong>Start:</strong>{" "}
                            {event.startTime}
                          </span>

                          <span>
                            <strong>End:</strong>{" "}
                            {event.endTime}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="two-lines">
                          <span>
                            {event.location}
                          </span>

                          <span>{event.area}</span>
                        </div>
                      </td>

                      <td>{event.branch}</td>
                      <td>{event.driver}</td>

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
                              openEditModal(event)
                            }
                            aria-label={`Edit ${event.name}`}
                          >
                            <FiEdit2 />
                          </button>

                          <div className="event-more-wrapper">
                            <button
                              type="button"
                              className="more-action-button"
                              onClick={() =>
                                setOpenActionId((currentId) =>
                                  currentId === event.id
                                    ? null
                                    : event.id
                                )
                              }
                              aria-label={`More actions for ${event.name}`}
                            >
                              <FiMoreVertical />
                            </button>

                            {openActionId === event.id && (
                              <div className="event-action-menu">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(event)
                                  }
                                >
                                  <FiEdit2 />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="event-delete-action"
                                  onClick={() =>
                                    handleDeleteEvent(event.id)
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
                  ))
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
              Showing {filteredEvents.length} of{" "}
              {events.length} events
            </p>

            <div>
              <button
                type="button"
                aria-label="Previous page"
              >
                ‹
              </button>

              <button
                type="button"
                className="active"
              >
                1
              </button>

              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button">...</button>
              <button type="button">22</button>

              <button
                type="button"
                aria-label="Next page"
              >
                ›
              </button>
            </div>
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
                <h2>{editingEventId ? "Edit Event" : "Add New Event"}</h2>
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
                aria-label="Close add event form"
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
                />
              </label>

              <label className="event-modal-full-field">
                Date

                <input
                  type="text"
                  name="date"
                  placeholder="17 July 2024"
                  value={formData.date}
                  onChange={handleFormChange}
                />
              </label>

              <div className="event-modal-times">
                <label>
                  Departure Time

                  <input
                    type="text"
                    name="departureTime"
                    placeholder="09:00 PM"
                    value={
                      formData.departureTime
                    }
                    onChange={handleFormChange}
                  />
                </label>

                <label>
                  Event Start Time

                  <input
                    type="text"
                    name="startTime"
                    placeholder="11:00 PM"
                    value={formData.startTime}
                    onChange={handleFormChange}
                  />
                </label>

                <label>
                  Event End Time

                  <input
                    type="text"
                    name="endTime"
                    placeholder="03:00 AM"
                    value={formData.endTime}
                    onChange={handleFormChange}
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
                />
              </label>

              <label>
                Branch

                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleFormChange}
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

                <input
                  type="text"
                  name="driver"
                  value={formData.driver}
                  onChange={handleFormChange}
                  placeholder="Driver name"
                />
              </label>

              <label className="event-modal-full-field">
                Status

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
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
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-button"
              >
                {editingEventId
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