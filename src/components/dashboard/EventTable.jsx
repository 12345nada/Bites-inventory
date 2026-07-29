import {
  useMemo,
  useState,
} from "react";

import {
  FiCalendar,
  FiChevronDown,
  FiList,
  FiSearch,
} from "react-icons/fi";

export default function EventTable({
  events = [],
  searchValue = "",
  onSearchChange,
}) {
  const [
    selectedBranch,
    setSelectedBranch,
  ] = useState("All Branches");

  const normalizedSearch =
    searchValue.trim().toLowerCase();

  const filteredRows = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        normalizedSearch === "" ||
        [
          event.id,
          event.eventType,
          event.name,
          event.client,
          event.date,
          event.time,
          event.location,
          event.area,
          event.branch,
          event.driver,
          event.status,
          event.waiters,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesBranch =
        selectedBranch ===
          "All Branches" ||
        event.branch === selectedBranch;

      return (
        matchesSearch &&
        matchesBranch
      );
    });
  }, [
    events,
    normalizedSearch,
    selectedBranch,
  ]);

  const branches = useMemo(() => {
    return [
      ...new Set(
        events
          .map((event) => event.branch)
          .filter(Boolean)
      ),
    ];
  }, [events]);

  const getStatusClass = (status) => {
    return String(status)
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  return (
    <div className="table-card">
      <div className="table-header">
        <h2>Event List</h2>

        <div className="dashboard-event-filters">
          <div className="dashboard-event-search">
            <FiSearch />

            <input
              type="text"
              placeholder="Search events..."
              value={searchValue}
              onChange={(event) =>
                onSearchChange?.(
                  event.target.value
                )
              }
            />
          </div>

          <div className="dashboard-branch-filter">
            <select
              value={selectedBranch}
              onChange={(event) =>
                setSelectedBranch(
                  event.target.value
                )
              }
            >
              <option>
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

            <FiChevronDown />
          </div>

          <button
            type="button"
            className="dashboard-list-button"
            aria-label="Change table view"
          >
            <FiList />
          </button>
        </div>
      </div>

      <div className="dashboard-table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="checkbox-column">
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
              <th># of Waiters</th>
              <th>Driver</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map(
                (event) => (
                  <tr key={event.id}>
                    <td className="checkbox-column">
                      <input
                        type="checkbox"
                        aria-label={`Select ${event.eventType}`}
                      />
                    </td>

                    <td>
                      <div className="dashboard-event-type">
                        <div className="dashboard-event-icon">
                          <FiCalendar />
                        </div>

                        <div>
                          <strong>
                            {event.eventType}
                          </strong>

                          <span>
                            {event.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {event.client}
                    </td>

                    <td>
                      <div className="dashboard-two-lines">
                        <span>
                          {event.date}
                        </span>

                        <span>
                          {event.time || ""}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="dashboard-two-lines">
                        <span>
                          {event.location}
                        </span>

                        <span>
                          {event.area || ""}
                        </span>
                      </div>
                    </td>

                    <td>
                      {event.branch}
                    </td>

                    <td>
                      {event.waiters}
                    </td>

                    <td>
                      {event.driver}
                    </td>

                    <td>
                      <span
                        className={`dashboard-event-status ${getStatusClass(
                          event.status
                        )}`}
                      >
                        {event.status}
                      </span>
                    </td>
                  </tr>
                )
              )
            ) : (
              <tr>
                <td
                  colSpan="9"
                  className="dashboard-empty-table"
                >
                  No events match your
                  search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="dashboard-table-pagination">
        <p>
          Showing {filteredRows.length} of{" "}
          {events.length} events
        </p>

        <div>
          <button type="button">
            ‹
          </button>

          <button
            type="button"
            className="active"
          >
            1
          </button>

          <button type="button">
            2
          </button>

          <button type="button">
            3
          </button>

          <button type="button">
            ...
          </button>

          <button type="button">
            22
          </button>

          <button type="button">
            ›
          </button>
        </div>
      </div>
    </div>
  );
}