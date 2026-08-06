import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../styles/dashboard.css";
import "../styles/mobile-sidebar-offcanvas.css";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import StatCard from "../components/dashboard/StatCard";
import EventTable from "../components/dashboard/EventTable";
import DashboardCharts from "../components/dashboard/DashboardCharts";

import {
  FiCalendar,
  FiUsers,
  FiCoffee,
  FiCreditCard,
} from "react-icons/fi";

import {
  getDashboardData,
} from "../services/dashboardService";

export default function Dashboard() {
  const [events, setEvents] =
    useState([]);

  const [
    totalInventoryCost,
    setTotalInventoryCost,
  ] = useState(0);

  const [
    returnTotals,
    setReturnTotals,
  ] = useState({
    returned: 0,
    damaged: 0,
    missing: 0,
  });

  const [fullName, setFullName] =
    useState("Admin");

  const [loading, setLoading] =
    useState(true);

  const [searchValue, setSearchValue] =
    useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const data =
        await getDashboardData();

      setEvents(data.events);
      setTotalInventoryCost(
        data.totalInventoryCost
      );
      setReturnTotals(
        data.returnTotals
      );
      setFullName(data.fullName);
    } catch (error) {
      console.error(
        "Error loading dashboard:",
        error
      );

      alert(
        error.message ||
          "Could not load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  const upcomingEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          event.status === "Upcoming"
      ).length,
    [events]
  );

  const totalActiveEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          String(event.status)
            .trim()
            .toLowerCase() !==
          "cancelled"
      ).length,
    [events]
  );

  const eventsWithDrinks = useMemo(
    () =>
      events.filter(
        (event) => event.hasDrinks
      ).length,
    [events]
  );

  const totalWaiters = useMemo(
    () =>
      events.reduce(
        (total, event) =>
          total +
          Number(event.waiters || 0),
        0
      ),
    [events]
  );

  const stats = [
    {
      icon: <FiCalendar />,
      title: "Total Events",
      value: loading
        ? "..."
        : String(totalActiveEvents),
      subtitle: "All events",
    },
    {
      icon: <FiCalendar />,
      title: "Upcoming Events",
      value: loading
        ? "..."
        : String(upcomingEvents),
      subtitle: "Events upcoming",
    },
    {
      icon: <FiUsers />,
      title: "Total Waiters",
      value: loading
        ? "..."
        : totalWaiters.toLocaleString(
            "en-US"
          ),
      subtitle: "Assigned waiters",
    },
    {
      icon: <FiCoffee />,
      title: "Events With Drinks",
      value: loading
        ? "..."
        : String(eventsWithDrinks),
      subtitle:
        "Events serving drinks",
    },
    {
      icon: <FiCreditCard />,
      title: "Total Inventory Cost",
      value: loading
        ? "..."
        : totalInventoryCost.toLocaleString(
            "en-US",
            {
              maximumFractionDigits: 2,
            }
          ),
      subtitle: "EGP",
    },
  ];

  return (
    <div className="dashboard-page">
      <Sidebar activePage="dashboard" />

      <main className="dashboard-main">
        <Topbar
          searchValue={searchValue}
          onSearchChange={
            setSearchValue
          }
        />

        <h1 className="dashboard-welcome">
          Welcome back, {fullName}{" "}
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
          events={events}
          loading={loading}
          searchValue={searchValue}
          onSearchChange={
            setSearchValue
          }
        />

        <DashboardCharts
          events={events}
          returnTotals={returnTotals}
        />
      </main>
    </div>
  );
}