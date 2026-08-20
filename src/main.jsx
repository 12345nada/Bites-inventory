import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./i18n";

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

import {
  StaffProvider,
} from "./context/StaffContext.jsx";

import {
  DialogProvider,
} from "./context/DialogContext.jsx";

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <DialogProvider>
      <EventsProvider>
        <ItemsProvider>
          <PurchasesProvider>
            <SuppliersProvider>
              <WarehousesProvider>
                <DispatchesProvider>
                  <ReturnsProvider>
                    <SettingsProvider>
                      <StaffProvider>
                        <App />
                      </StaffProvider>
                    </SettingsProvider>
                  </ReturnsProvider>
                </DispatchesProvider>
              </WarehousesProvider>
            </SuppliersProvider>
          </PurchasesProvider>
        </ItemsProvider>
      </EventsProvider>
    </DialogProvider>
  </StrictMode>
);