import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const SettingsContext = createContext(null);

const modules = [
  "Dashboard",
  "Events",
  "Items",
  "Purchase",
  "Suppliers",
  "Warehouse",
  "Dispatch",
  "Returns",
  "Reports",
  "Users / Role",
  "Settings",
];

const actions = [
  "view",
  "add",
  "edit",
  "delete",
];

const createEmptyPermissions = () =>
  Object.fromEntries(
    modules.map((moduleName) => [
      moduleName,
      {
        view: false,
        add: false,
        edit: false,
        delete: false,
      },
    ])
  );

const initialRoles = [
  {
    id: "ROLE-001",
    name: "Administrator",
    description: "Full system access",
    permissions: Object.fromEntries(
      modules.map((moduleName) => [
        moduleName,
        {
          view: true,
          add: true,
          edit: true,
          delete: true,
        },
      ])
    ),
  },
  {
    id: "ROLE-002",
    name: "Warehouse Employee",
    description:
      "Inventory and warehouse operations",
    permissions: {
      ...createEmptyPermissions(),
      Dashboard: {
        view: true,
        add: false,
        edit: false,
        delete: false,
      },
      Items: {
        view: true,
        add: true,
        edit: true,
        delete: false,
      },
      Warehouse: {
        view: true,
        add: true,
        edit: true,
        delete: false,
      },
      Dispatch: {
        view: true,
        add: true,
        edit: true,
        delete: false,
      },
      Returns: {
        view: true,
        add: true,
        edit: true,
        delete: false,
      },
      Reports: {
        view: true,
        add: false,
        edit: false,
        delete: false,
      },
    },
  },
  {
    id: "ROLE-003",
    name: "Viewer",
    description: "Read-only system access",
    permissions: Object.fromEntries(
      modules.map((moduleName) => [
        moduleName,
        {
          view: true,
          add: false,
          edit: false,
          delete: false,
        },
      ])
    ),
  },
];

const initialEmployees = [
  {
    id: "EMP-001",
    name: "Nada Lotfallah",
    email: "nada@bites.com",
    roleId: "ROLE-002",
  },
  {
    id: "EMP-002",
    name: "haidy Adel",
    email: "haidy@bites.com",
    roleId: "ROLE-001",
  },
  {
    id: "EMP-003",
    name: "shahd ayman",
    email: "shahd@bites.com",
    roleId: "ROLE-003",
  },
];

export function SettingsProvider({
  children,
}) {
  const [roles, setRoles] =
    useState(initialRoles);

  const [employees, setEmployees] =
    useState(initialEmployees);

  const [generalSettings, setGeneralSettings] =
    useState({
      companyName: "Bites Catering",
      companyEmail: "info@bites.com",
      phone: "+20 100 000 0000",
      defaultBranch: "Cairo",
      currency: "EGP",
      dateFormat: "DD/MM/YYYY",
    });

  const addRole = (roleData) => {
    const name = roleData.name.trim();

    const exists = roles.some(
      (role) =>
        role.name.toLowerCase() ===
        name.toLowerCase()
    );

    if (exists) {
      return {
        success: false,
        message:
          "This role name already exists.",
      };
    }

    const nextNumber =
      roles.reduce(
        (largest, role) => {
          const number = Number(
            role.id.replace("ROLE-", "")
          );

          return Number.isNaN(number)
            ? largest
            : Math.max(largest, number);
        },
        0
      ) + 1;

    const newRole = {
      id: `ROLE-${String(
        nextNumber
      ).padStart(3, "0")}`,
      name,
      description:
        roleData.description.trim(),
      permissions:
        createEmptyPermissions(),
    };

    setRoles((currentRoles) => [
      ...currentRoles,
      newRole,
    ]);

    return {
      success: true,
      role: newRole,
    };
  };

  const updateRolePermissions = (
    roleId,
    permissions
  ) => {
    setRoles((currentRoles) =>
      currentRoles.map((role) =>
        role.id === roleId
          ? {
              ...role,
              permissions,
            }
          : role
      )
    );
  };

  const deleteRole = (roleId) => {
    const roleIsUsed = employees.some(
      (employee) =>
        employee.roleId === roleId
    );

    if (roleIsUsed) {
      return {
        success: false,
        message:
          "This role is assigned to an employee.",
      };
    }

    setRoles((currentRoles) =>
      currentRoles.filter(
        (role) => role.id !== roleId
      )
    );

    return {
      success: true,
    };
  };

  const assignEmployeeRole = (
    employeeId,
    roleId
  ) => {
    setEmployees((currentEmployees) =>
      currentEmployees.map((employee) =>
        employee.id === employeeId
          ? {
              ...employee,
              roleId,
            }
          : employee
      )
    );
  };

  const value = useMemo(
    () => ({
      modules,
      actions,
      roles,
      employees,
      generalSettings,
      setGeneralSettings,
      addRole,
      updateRolePermissions,
      deleteRole,
      assignEmployeeRole,
    }),
    [
      roles,
      employees,
      generalSettings,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(
    SettingsContext
  );

  if (!context) {
    throw new Error(
      "useSettings must be used inside SettingsProvider"
    );
  }

  return context;
}