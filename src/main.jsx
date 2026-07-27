import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";

import {
  EventsProvider,
} from "./context/EventsContext.jsx";

import {
  ItemsProvider,
} from "./context/ItemsContext.jsx";

import {
  PurchasesProvider,
} from "./context/PurchasesContext.jsx";

import {
  SuppliersProvider,
} from "./context/SuppliersContext.jsx";

import {
  WarehousesProvider,
} from "./context/WarehousesContext.jsx";

import {
  DispatchesProvider,
} from "./context/DispatchesContext.jsx";

import {
  ReturnsProvider,
} from "./context/ReturnsContext.jsx";

import {
  SettingsProvider,
} from "./context/SettingsContext.jsx";

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <EventsProvider>
      <ItemsProvider>
        <PurchasesProvider>
          <SuppliersProvider>
            <WarehousesProvider>
              <DispatchesProvider>
                <ReturnsProvider>
                  <SettingsProvider>
                    <App />
                  </SettingsProvider>
                </ReturnsProvider>
              </DispatchesProvider>
            </WarehousesProvider>
          </SuppliersProvider>
        </PurchasesProvider>
      </ItemsProvider>
    </EventsProvider>
  </StrictMode>
);