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
  useTranslation, 
} from "react-i18next"; 
 
import { 
  getDashboardData, 
} from "../services/dashboardService"; 
 
export default function Dashboard() { 
  const { 
    t, 
    i18n, 
  } = useTranslation(); 
 
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
          t( 
            "dashboard.couldNotLoadDashboard" 
          ) 
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
      title: t( 
        "dashboard.totalEvents" 
      ), 
      value: loading 
        ? "..." 
        : String(totalActiveEvents), 
      subtitle: t( 
        "dashboard.allEvents" 
      ), 
    }, 
    { 
      icon: <FiCalendar />, 
      title: t( 
        "dashboard.upcomingEvents" 
      ), 
      value: loading 
        ? "..." 
        : String(upcomingEvents), 
      subtitle: t( 
        "dashboard.eventsUpcoming" 
      ), 
    }, 
    { 
      icon: <FiUsers />, 
      title: t( 
        "dashboard.totalWaiters" 
      ), 
      value: loading 
        ? "..." 
        : totalWaiters.toLocaleString( 
            i18n.language === "ar" 
              ? "ar-EG" 
              : "en-US" 
          ), 
      subtitle: t( 
        "dashboard.assignedWaiters" 
      ), 
    }, 
    { 
      icon: <FiCoffee />, 
      title: t( 
        "dashboard.eventsWithDrinks" 
      ), 
      value: loading 
        ? "..." 
        : String(eventsWithDrinks), 
      subtitle: t( 
        "dashboard.eventsServingDrinks" 
      ), 
    }, 
    { 
      icon: <FiCreditCard />, 
      title: t( 
        "dashboard.totalInventoryCost" 
      ), 
      value: loading 
        ? "..." 
        : totalInventoryCost.toLocaleString( 
            i18n.language === "ar" 
              ? "ar-EG" 
              : "en-US", 
            { 
              maximumFractionDigits: 2, 
            } 
          ), 
      subtitle: t( 
        "dashboard.egp" 
      ), 
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
          {t( 
            "dashboard.welcomeBack", 
            { 
              name: fullName, 
            } 
          )}{" "} 
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