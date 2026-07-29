import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const EventsContext = createContext(null);

export const initialEvents = [
  { id: "EVT-001", name: "Family Wedding", client: "Reda Family", date: "17 July 2024", departureTime: "09:00 PM", startTime: "11:00 PM", endTime: "03:00 AM", location: "Villa 45", area: "New Cairo", branch: "Cairo", driver: "Ahmed Samy", status: "Confirmed" },
  { id: "EVT-002", name: "Corporate Dinner", client: "ABC Corp", date: "18 July 2024", departureTime: "05:00 PM", startTime: "07:00 PM", endTime: "11:00 PM", location: "Marriott Hotel", area: "Giza", branch: "Cairo", driver: "Omar Khaled", status: "In Progress" },
  { id: "EVT-003", name: "Birthday Party", client: "Omar Samy", date: "19 July 2024", departureTime: "03:00 PM", startTime: "05:00 PM", endTime: "09:00 PM", location: "Villa 12", area: "Sheikh Zayed", branch: "Alex", driver: "Mohamed Ali", status: "Upcoming" },
  { id: "EVT-004", name: "Engagement Party", client: "Heba & Karim", date: "20 July 2024", departureTime: "02:00 PM", startTime: "04:00 PM", endTime: "10:00 PM", location: "Garden City", area: "Cairo", branch: "Cairo", driver: "Youseef Magdy", status: "Confirmed" },
  { id: "EVT-005", name: "Team Building", client: "Tech Solutions", date: "21 July 2024", departureTime: "07:00 AM", startTime: "10:00 AM", endTime: "05:00 PM", location: "Stella Di Mare", area: "Ain Sokhna", branch: "Cairo", driver: "Tamer Hassan", status: "Upcoming" },
  { id: "EVT-006", name: "Private Event", client: "Private Client", date: "22 July 2024", departureTime: "04:00 PM", startTime: "06:00 PM", endTime: "11:00 PM", location: "Private Villa", area: "New Cairo", branch: "Cairo", driver: "Ahmed Samy", status: "Cancelled" },
];

export function EventsProvider({ children }) {
  const [events, setEvents] = useState(initialEvents);

  const addEvent = (eventData) => {
    setEvents((currentEvents) => {
      const nextNumber = currentEvents.reduce((largest, event) => {
        const number = Number(event.id.replace("EVT-", ""));
        return Number.isNaN(number) ? largest : Math.max(largest, number);
      }, 0) + 1;

      return [{ id: `EVT-${String(nextNumber).padStart(3, "0")}`, ...eventData }, ...currentEvents];
    });
  };

  const updateEvent = (eventId, updatedData) => {
    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === eventId ? { ...event, ...updatedData } : event
      )
    );
  };

  const deleteEvent = (eventId) => {
    setEvents((currentEvents) =>
      currentEvents.filter((event) => event.id !== eventId)
    );
  };

  const value = useMemo(() => ({
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    setEvents,
  }), [events]);

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);

  if (!context) {
    throw new Error("useEvents must be used inside EventsProvider.");
  }

  return context;
}