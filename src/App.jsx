import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Items from "./pages/Items";
import Purchase from "./pages/Purchase";
import Suppliers from "./pages/Suppliers";
import Warehouse from "./pages/Warehouse";
import Dispatch from "./pages/Dispatch";
import Returns from "./pages/Returns";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Dashboard />}
        />
        <Route
          path="/events"
          element={<Events />}
        />

        <Route
          path="/items"
          element={<Items />}
        />

        <Route
          path="/purchase"
          element={<Purchase />}
        />

        <Route
          path="/suppliers"
          element={<Suppliers />}
        />

        <Route
          path="/warehouse"
          element={<Warehouse />}
        />

        <Route
          path="/dispatch"
          element={<Dispatch />}
        />

        <Route
          path="/returns"
          element={<Returns />}
        />

        <Route
          path="/reports"
          element={<Reports />}
        />
        <Route
          path="/settings"
          element={<Settings />}
        />
      </Routes>
    </BrowserRouter>
  );
}
export default App;