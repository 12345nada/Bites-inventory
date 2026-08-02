import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  AuthProvider,
} from "./context/AuthContext";

import ProtectedRoute from "./components/auth/ProtectedRoute";

import GetStarted from "./pages/GetStarted";
import Login from "./pages/Login";

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
import Staff from "./pages/Staff";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={<GetStarted />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            element={
              <ProtectedRoute
                moduleName="Dashboard"
              />
            }
          >
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                moduleName="Events"
              />
            }
          >
            <Route
              path="/events"
              element={<Events />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                moduleName="Items"
              />
            }
          >
            <Route
              path="/items"
              element={<Items />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                moduleName="Purchase"
              />
            }
          >
            <Route
              path="/purchase"
              element={<Purchase />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                moduleName="Suppliers"
              />
            }
          >
            <Route
              path="/suppliers"
              element={<Suppliers />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                moduleName="Warehouse"
              />
            }
          >
            <Route
              path="/warehouse"
              element={<Warehouse />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                moduleName="Staff"
              />
            }
          >
            <Route
              path="/staff"
              element={<Staff />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                moduleName="Dispatch"
              />
            }
          >
            <Route
              path="/dispatch"
              element={<Dispatch />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                moduleName="Returns"
              />
            }
          >
            <Route
              path="/returns"
              element={<Returns />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                moduleName="Reports"
              />
            }
          >
            <Route
              path="/reports"
              element={<Reports />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                anyOfModules={[
                  "Settings",
                  "Users / Role",
                ]}
              />
            }
          >
            <Route
              path="/settings"
              element={<Settings />}
            />
          </Route>

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;