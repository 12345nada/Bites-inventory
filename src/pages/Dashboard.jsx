import { useMemo, useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import StatCard from "../components/dashboard/StatCard";
import EventTable from "../components/dashboard/EventTable";
import DashboardCharts from "../components/dashboard/DashboardCharts";

import "../styles/dashboard.css";

import {
  FiCalendar,
  FiUsers,
  FiCoffee,
  FiCreditCard,
} from "react-icons/fi";

import { useEvents } from "../context/EventsContext";

const dashboardEventDetails = {
  "EVT-001": {
    eventType: "Wedding",
    waiters: 12,
    driver: "Ahmed Samy",
    hasDrinks: true,
    cost: 12000,
  },

  "EVT-002": {
    eventType: "Corporate Dinner",
    waiters: 18,
    driver: "Omar Khaled",
    hasDrinks: true,
    cost: 10500,
  },

  "EVT-003": {
    eventType: "Birthday Party",
    waiters: 6,
    driver: "Mohamed Ali",
    hasDrinks: true,
    cost: 6500,
  },

  "EVT-004": {
    eventType: "Engagement Party",
    waiters: 8,
    driver: "Youseef Magdy",
    hasDrinks: true,
    cost: 8000,
  },

  "EVT-005": {
    eventType: "Team Building",
    waiters: 10,
    driver: "Tamer Hassan",
    hasDrinks: false,
    cost: 6500,
  },

  "EVT-006": {
    eventType: "Private Event",
    waiters: 5,
    driver: "Ahmed Samy",
    hasDrinks: false,
    cost: 5000,
  },
};

export default function Dashboard() {
  const { events } = useEvents();

  const [searchValue, setSearchValue] =
    useState("");

  const dashboardEvents = useMemo(() => {
    return events.map((event) => {
      const details =
        dashboardEventDetails[event.id] || {};

      return {
        ...event,

        eventType:
          event.eventType ||
          details.eventType ||
          event.name ||
          "Event",

        waiters:
          event.waiters ??
          details.waiters ??
          0,

        driver:
          event.driver ||
          details.driver ||
          "Not Assigned",

        hasDrinks:
          event.hasDrinks ??
          details.hasDrinks ??
          false,

        cost:
          event.cost ??
          details.cost ??
          0,
      };
    });
  }, [events]);

  const upcomingEvents =
    dashboardEvents.filter(
      (event) =>
        event.status === "Upcoming"
    ).length;

  const eventsWithDrinks =
    dashboardEvents.filter(
      (event) => event.hasDrinks
    ).length;

  const totalCost =
    dashboardEvents.reduce(
      (total, event) =>
        total + Number(event.cost || 0),
      0
    );

  const stats = [
    {
      icon: <FiCalendar />,
      title: "Total Events",
      value: String(
        dashboardEvents.length
      ),
      subtitle: "All events",
    },

    {
      icon: <FiCalendar />,
      title: "Upcoming Events",
      value: String(upcomingEvents),
      subtitle: "Events upcoming",
    },

    {
      icon: <FiUsers />,
      title: "Total Waiters",
      value: "86",
      subtitle: "Assigned waiters",
    },

    {
      icon: <FiCoffee />,
      title: "Events With Drinks",
      value: String(eventsWithDrinks),
      subtitle: "Events serving drinks",
    },

    {
      icon: <FiCreditCard />,
      title: "Total Cost",
      value:
        totalCost > 0
          ? totalCost.toLocaleString()
          : "48,500",
      subtitle: "Overall event cost",
    },
  ];

  return (
    <div className="dashboard-page">
      <Sidebar activePage="dashboard" />

      <main className="dashboard-main">
        <Topbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        <h1 className="dashboard-welcome">
          Welcome back, Admin{" "}
          <span>👋</span>
        </h1>

        <section className="dashboard-stats">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              icon={stat.icon}
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
            />
          ))}
        </section>

        <EventTable
          events={dashboardEvents}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        <DashboardCharts
          events={dashboardEvents}
        />
      </main>
    </div>
  );
}