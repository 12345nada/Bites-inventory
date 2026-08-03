import {
  useEffect,
  useMemo,
  useState,
} from "react";


import { useDialog } from "../context/DialogContext";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import "../styles/mobile-sidebar-offcanvas.css";
import "../styles/dashboard.css";
import "../styles/Settings.css";

import {
  assignEmployeeRole,
  createRole,
  createSystemUser,
  deleteRole,
  getSettingsData,
  saveGeneralSettings,
  saveRolePermissions,
} from "../services/settingsService";

import {
  FiSearch,
  FiPlus,
  FiTrash2,
  FiSave,
  FiShield,
  FiUser,
  FiX,
  FiLogOut,
} from "react-icons/fi";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

const emptyUserForm = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  roleId: "",
  branch: "Cairo",
};

export default function Settings() {
  const { showAlert, showConfirm } = useDialog();


  const navigate =
    useNavigate();

  const {
    signOut,
    hasPermission,
  } = useAuth();

  const canEditSettings =
    hasPermission(
      "Settings",
      "edit"
    );

  const canAddUsersRoles =
    hasPermission(
      "Users / Role",
      "add"
    );

  const canEditUsersRoles =
    hasPermission(
      "Users / Role",
      "edit"
    );

  const canDeleteUsersRoles =
    hasPermission(
      "Users / Role",
      "delete"
    );

  const [modules, setModules] =
    useState([]);

  const [actions, setActions] =
    useState([]);

  const [roles, setRoles] =
    useState([]);

  const [employees, setEmployees] =
    useState([]);

  const [warehouses, setWarehouses] =
    useState([]);

  const [
    generalSettings,
    setGeneralSettings,
  ] = useState({
    id: null,
    companyName: "",
    companyEmail: "",
    phone: "",
    defaultWarehouseId: "",
    currency: "EGP",
    dateFormat: "DD/MM/YYYY",
  });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState("permissions");

  const [searchValue, setSearchValue] =
    useState("");

  const [
    selectedRoleId,
    setSelectedRoleId,
  ] = useState("");

  const [
    selectedEmployeeId,
    setSelectedEmployeeId,
  ] = useState("");

  const [
    permissionDraft,
    setPermissionDraft,
  ] = useState({});

  const [
    showRoleModal,
    setShowRoleModal,
  ] = useState(false);

  const [
    showUserModal,
    setShowUserModal,
  ] = useState(false);

  const [roleForm, setRoleForm] =
    useState({
      name: "",
      description: "",
    });

  const [userForm, setUserForm] =
    useState(emptyUserForm);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      const data =
        await getSettingsData();

      setModules(data.modules);
      setActions(data.actions);
      setRoles(data.roles);
      setEmployees(data.employees);
      setWarehouses(data.warehouses);

      setGeneralSettings(
        data.generalSettings
      );

      const firstEmployee =
        data.employees[0];

      const firstRole =
        data.roles.find(
          (role) =>
            String(role.id) ===
            String(firstEmployee?.roleId)
        ) || data.roles[0];

      setSelectedEmployeeId(
        firstEmployee?.id || ""
      );

      setSelectedRoleId(
        firstRole?.id || ""
      );
    } catch (error) {
      console.error(
        "Error loading settings:",
        error
      );

      showAlert({
        message: error.message ||
          "Could not load settings.",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = useMemo(
    () =>
      roles.find(
        (role) =>
          String(role.id) ===
          String(selectedRoleId)
      ),
    [roles, selectedRoleId]
  );

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (employee) =>
          String(employee.id) ===
          String(selectedEmployeeId)
      ),
    [
      employees,
      selectedEmployeeId,
    ]
  );

  useEffect(() => {
    setPermissionDraft(
      selectedRole
        ? structuredClone(
            selectedRole.permissions
          )
        : {}
    );
  }, [selectedRole]);

  const filteredEmployees = useMemo(() => {
    const search =
      searchValue.trim().toLowerCase();

    return employees.filter(
      (employee) =>
        search === "" ||
        employee.name
          .toLowerCase()
          .includes(search) ||
        employee.username
          .toLowerCase()
          .includes(search)
    );
  }, [employees, searchValue]);

  const filteredRoles = useMemo(() => {
    const search =
      searchValue.trim().toLowerCase();

    return roles.filter(
      (role) =>
        search === "" ||
        role.name
          .toLowerCase()
          .includes(search) ||
        role.description
          .toLowerCase()
          .includes(search)
    );
  }, [roles, searchValue]);

  const handlePermissionToggle = (
    moduleName,
    action
  ) => {
    if (!canEditUsersRoles) {
      showAlert({
        message: "You do not have permission to edit permissions.",
      });
      return;
    }

    setPermissionDraft(
      (currentPermissions) => ({
        ...currentPermissions,

        [moduleName]: {
          ...currentPermissions[
            moduleName
          ],

          [action]:
            !currentPermissions[
              moduleName
            ]?.[action],
        },
      })
    );
  };

  const savePermissions = async () => {
    if (!canEditUsersRoles) {
      showAlert({
        message: "You do not have permission to edit permissions.",
      });
      return;
    }

    if (!selectedRoleId) {
      showAlert({
        message: "Please select a role.",
      });
      return;
    }

    try {
      setSaving(true);

      await saveRolePermissions(
        selectedRoleId,
        permissionDraft
      );

      setRoles((currentRoles) =>
        currentRoles.map((role) =>
          String(role.id) ===
          String(selectedRoleId)
            ? {
                ...role,

                permissions:
                  structuredClone(
                    permissionDraft
                  ),
              }
            : role
        )
      );

      showAlert({
        message: "Permissions saved successfully.",
      });
    } catch (error) {
      console.error(
        "Error saving permissions:",
        error
      );

      showAlert({
        message: error.message ||
          "Could not save permissions.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async (
    event
  ) => {
    if (!canAddUsersRoles) {
      showAlert({
        message: "You do not have permission to add roles.",
      });
      return;
    }

    event.preventDefault();

    if (!roleForm.name.trim()) {
      showAlert({
        message: "Please enter the role name.",
      });

      return;
    }

    try {
      setSaving(true);

      const newRole =
        await createRole(roleForm);

      setRoles((currentRoles) => [
        ...currentRoles,
        newRole,
      ]);

      setSelectedRoleId(newRole.id);

      setRoleForm({
        name: "",
        description: "",
      });

      setShowRoleModal(false);
    } catch (error) {
      showAlert({
        message: error.code === "23505"
          ? "This role name already exists."
          : error.message ||
              "Could not create role.",
      });
    } finally {
      setSaving(false);
    }
  };

  const openUserModal = () => {
    if (!canAddUsersRoles) {
      showAlert({
        message: "You do not have permission to add users.",
      });
      return;
    }

    const defaultRole =
      roles.find(
        (role) =>
          role.name ===
          "Warehouse Employee"
      ) || roles[0];

    setUserForm({
      ...emptyUserForm,

      roleId:
        defaultRole?.id
          ? String(defaultRole.id)
          : "",
    });

    setShowUserModal(true);
  };

  const closeUserModal = () => {
    if (saving) {
      return;
    }

    setShowUserModal(false);
    setUserForm(emptyUserForm);
  };

  const handleUserFormChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setUserForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleCreateUser = async (
    event
  ) => {
    if (!canAddUsersRoles) {
      showAlert({
        message: "You do not have permission to add users.",
      });
      return;
    }

    event.preventDefault();

    const fullName =
      userForm.fullName.trim();

    const username =
      userForm.username
        .trim()
        .toLowerCase();

    const email =
      userForm.email
        .trim()
        .toLowerCase();

    if (
      !fullName ||
      !username ||
      !email ||
      !userForm.password ||
      !userForm.confirmPassword ||
      !userForm.roleId ||
      !userForm.branch
    ) {
      showAlert({
        message: "Please complete all user fields.",
      });

      return;
    }

    if (
      !/^[a-z0-9._-]{3,30}$/.test(
        username
      )
    ) {
      showAlert({
        message: "Username must be 3-30 characters and contain only lowercase letters, numbers, dots, underscores or hyphens.",
      });

      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      showAlert({
        message: "Please enter a valid real email address.",
      });

      return;
    }

    if (
      userForm.password.length < 6
    ) {
      showAlert({
        message: "Password must contain at least 6 characters.",
      });

      return;
    }

    if (
      userForm.password !==
      userForm.confirmPassword
    ) {
      showAlert({
        message: "Passwords do not match.",
      });

      return;
    }

    const selectedUserRole =
      roles.find(
        (role) =>
          String(role.id) ===
          String(userForm.roleId)
      );

    if (!selectedUserRole) {
      showAlert({
        message: "The selected role is no longer available. Please close the form and select the role again.",
      });

      return;
    }

    try {
      setSaving(true);

      const currentRoleId =
        Number(selectedUserRole.id);

      if (!Number.isInteger(currentRoleId)) {
        showAlert({
        message: "The selected role has an invalid ID.",
      });
        return;
      }

      console.log(
        "Creating user with role:",
        {
          roleId: currentRoleId,
          roleName:
            selectedUserRole.name,
        }
      );

      const newUser =
        await createSystemUser({
          fullName,
          username,
          email,
          password:
            userForm.password,
          roleId:
            currentRoleId,
          roleName:
            selectedUserRole.name,
          branch:
            userForm.branch,
        });

      setEmployees(
        (currentEmployees) => [
          ...currentEmployees,
          newUser,
        ]
      );

      setSelectedEmployeeId(
        newUser.id
      );

      setSelectedRoleId(
        newUser.roleId
      );

      setUserForm(emptyUserForm);
      setShowUserModal(false);

      showAlert({
        message: "User created successfully.",
      });
    } catch (error) {
      console.error(
        "Create user error:",
        error
      );

      showAlert({
        message: error.message ||
          "Could not create user.",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeRole = async (
    roleId
  ) => {
    if (!canDeleteUsersRoles) {
      showAlert({
        message: "You do not have permission to delete roles.",
      });
      return;
    }

    const role = roles.find(
      (currentRole) =>
        String(currentRole.id) ===
        String(roleId)
    );

    if (
      role?.name === "Administrator"
    ) {
      showAlert({
        message: "The Administrator role cannot be deleted.",
      });

      return;
    }

    const confirmed = await showConfirm({
      message: "Are you sure you want to delete this role?",
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteRole(roleId);

      const remainingRoles =
        roles.filter(
          (currentRole) =>
            String(currentRole.id) !==
            String(roleId)
        );

      setRoles(remainingRoles);

      if (
        String(selectedRoleId) ===
        String(roleId)
      ) {
        setSelectedRoleId(
          remainingRoles[0]?.id || ""
        );
      }
    } catch (error) {
      showAlert({
        message: error.code === "ROLE_IN_USE"
          ? error.message
          : error.message ||
              "Could not delete role.",
      });
    }
  };

  const handleEmployeeRoleChange =
    async (
      employeeId,
      roleId
    ) => {
    if (!canEditUsersRoles) {
      showAlert({
        message: "You do not have permission to assign roles.",
      });
      return;
    }

      try {
        const updatedEmployee =
          await assignEmployeeRole(
            employeeId,
            roleId
          );

        setEmployees(
          (currentEmployees) =>
            currentEmployees.map(
              (employee) =>
                String(employee.id) ===
                String(employeeId)
                  ? updatedEmployee
                  : employee
            )
        );

        setSelectedRoleId(roleId);
      } catch (error) {
        showAlert({
        message: error.message ||
            "Could not assign the role.",
      });
      }
    };

  const handleGeneralChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setGeneralSettings(
      (currentSettings) => ({
        ...currentSettings,
        [name]: value,
      })
    );
  };

  const handleSaveGeneralSettings =
    async () => {
    if (!canEditSettings) {
      showAlert({
        message: "You do not have permission to edit settings.",
      });
      return;
    }

      if (
        !generalSettings.companyName.trim() ||
        !generalSettings.companyEmail.trim()
      ) {
        showAlert({
        message: "Please enter the company name and email.",
      });

        return;
      }

      try {
        setSaving(true);

        const updatedSettings =
          await saveGeneralSettings(
            generalSettings
          );

        setGeneralSettings(
          updatedSettings
        );

        showAlert({
        message: "General settings saved.",
      });
      } catch (error) {
        showAlert({
        message: error.message ||
            "Could not save general settings.",
      });
      } finally {
        setSaving(false);
      }
    };

  const handleLogout = async () => {
    const confirmed =
      await showConfirm({
      message: "Are you sure you want to logout?",
    });

    if (!confirmed) {
      return;
    }

    try {
      const result =
        await signOut();

      if (!result.success) {
        throw (
          result.error ||
          new Error(
            "Could not logout."
          )
        );
      }

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      showAlert({
        message: error.message ||
          "Could not logout.",
      });
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar activePage="settings" />

      <main className="settings-main">
        <Topbar
          searchValue={searchValue}
          onSearchChange={
            setSearchValue
          }
        />

        <section className="settings-title-section">
          <div>
            <h1>Settings</h1>

            <p>
              Manage general settings
              and user permissions
            </p>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-tabs">
            <button
              type="button"
              className={
                activeTab === "general"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab("general")
              }
            >
              General Settings
            </button>

            <button
              type="button"
              className={
                activeTab ===
                "permissions"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  "permissions"
                )
              }
            >
              Permissions & User Rights
            </button>
          </div>

          {loading ? (
            <div className="settings-loading-state">
              Loading settings...
            </div>
          ) : activeTab === "general" ? (
            <div className="general-settings-panel">
              <div className="general-settings-grid">
                <label>
                  Company Name

                  <input
                    name="companyName"
                    value={
                      generalSettings.companyName
                    }
                    onChange={
                      handleGeneralChange
                    }
                    disabled={saving || !canEditSettings}
                  />
                </label>

                <label>
                  Company Email

                  <input
                    type="email"
                    name="companyEmail"
                    value={
                      generalSettings.companyEmail
                    }
                    onChange={
                      handleGeneralChange
                    }
                    disabled={saving || !canEditSettings}
                  />
                </label>

                <label>
                  Phone

                  <input
                    name="phone"
                    value={
                      generalSettings.phone
                    }
                    onChange={
                      handleGeneralChange
                    }
                    disabled={saving || !canEditSettings}
                  />
                </label>

                <label>
                  Default Warehouse

                  <select
                    name="defaultWarehouseId"
                    value={
                      generalSettings.defaultWarehouseId
                    }
                    onChange={
                      handleGeneralChange
                    }
                    disabled={saving || !canEditSettings}
                  >
                    <option value="">
                      Select warehouse
                    </option>

                    {warehouses.map(
                      (warehouse) => (
                        <option
                          key={
                            warehouse.id
                          }
                          value={
                            warehouse.id
                          }
                        >
                          {
                            warehouse.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Currency

                  <select
                    name="currency"
                    value={
                      generalSettings.currency
                    }
                    onChange={
                      handleGeneralChange
                    }
                    disabled={saving || !canEditSettings}
                  >
                    <option value="EGP">
                      EGP
                    </option>

                    <option value="USD">
                      USD
                    </option>
                  </select>
                </label>

                <label>
                  Date Format

                  <select
                    name="dateFormat"
                    value={
                      generalSettings.dateFormat
                    }
                    onChange={
                      handleGeneralChange
                    }
                    disabled={saving || !canEditSettings}
                  >
                    <option value="DD/MM/YYYY">
                      DD/MM/YYYY
                    </option>

                    <option value="MM/DD/YYYY">
                      MM/DD/YYYY
                    </option>
                  </select>
                </label>
              </div>

              <div className="settings-actions">
                <button
                  type="button"
                  className="settings-save-button"
                  onClick={
                    handleSaveGeneralSettings
                  }
                  disabled={saving || !canEditSettings}
                >
                  <FiSave />

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="settings-logout-button"
                  onClick={handleLogout}
                  disabled={saving || !canEditSettings}
                >
                  <FiLogOut />

                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="permissions-layout">
              <aside className="permission-column employee-column">
                <div className="permission-column-header">
                  <div>
                    <h3>Employees</h3>

                    <p>
                      Select an employee
                    </p>
                  </div>

                  <FiUser />
                </div>

                <button
                  type="button"
                  className="add-user-inline"
                  onClick={openUserModal}
                  disabled={
                    !canAddUsersRoles
                  }
                >
                  <FiPlus />
                  Add New User
                </button>

                <div className="permission-search-box">
                  <FiSearch />

                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchValue}
                    onChange={(event) =>
                      setSearchValue(
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="permission-list">
                  {filteredEmployees.map(
                    (employee) => (
                      <button
                        type="button"
                        key={employee.id}
                        className={
                          String(
                            selectedEmployeeId
                          ) ===
                          String(employee.id)
                            ? "selected"
                            : ""
                        }
                        onClick={() => {
                          setSelectedEmployeeId(
                            employee.id
                          );

                          setSelectedRoleId(
                            employee.roleId
                          );
                        }}
                      >
                        <strong>
                          {employee.name}
                        </strong>

                        <span>
                          @{employee.username}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </aside>

              <aside className="permission-column roles-column">
                <div className="permission-column-header">
                  <div>
                    <h3>Roles</h3>

                    <p>
                      Choose a role
                    </p>
                  </div>

                  <FiShield />
                </div>

                <div className="permission-search-box">
                  <FiSearch />

                  <input
                    type="text"
                    placeholder="Search roles..."
                    value={searchValue}
                    onChange={(event) =>
                      setSearchValue(
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="permission-list">
                  {filteredRoles.map(
                    (role) => (
                      <div
                        className={`role-list-row ${
                          String(
                            selectedRoleId
                          ) ===
                          String(role.id)
                            ? "selected"
                            : ""
                        }`}
                        key={role.id}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedRoleId(
                              role.id
                            )
                          }
                        >
                          <strong>
                            {role.name}
                          </strong>

                          <span>
                            {
                              role.description
                            }
                          </span>
                        </button>

                        {canDeleteUsersRoles &&
                          role.name !==
                            "Administrator" && (
                          <button
                            type="button"
                            className="delete-role-button"
                            onClick={() =>
                              removeRole(
                                role.id
                              )
                            }
                            aria-label={`Delete ${role.name}`}
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>

                <button
                  type="button"
                  className="add-role-inline"
                  onClick={() => {
                    if (
                      !canAddUsersRoles
                    ) {
                      showAlert({
        message: "You do not have permission to add roles.",
      });
                      return;
                    }

                    setShowRoleModal(
                      true
                    );
                  }}
                  disabled={
                    !canAddUsersRoles
                  }
                >
                  <FiPlus />
                  Add New Role
                </button>
              </aside>

              <section className="permissions-panel">
                <div className="permissions-panel-header">
                  <div>
                    <h2>
                      Choose a role to
                      configure permissions
                    </h2>

                    <p>
                      {selectedEmployee
                        ? `${selectedEmployee.name} is assigned to ${
                            selectedRole?.name ||
                            "No Role"
                          }`
                        : "Select an employee or role"}
                    </p>
                  </div>

                  {selectedEmployee && (
                    <select
                      value={
                        selectedEmployee.roleId ||
                        ""
                      }
                      onChange={(event) =>
                        handleEmployeeRoleChange(
                          selectedEmployee.id,
                          event.target.value
                        )
                      }
                      disabled={
                        saving ||
                        !canEditUsersRoles
                      }
                    >
                      <option value="">
                        Select role
                      </option>

                      {roles.map(
                        (role) => (
                          <option
                            key={role.id}
                            value={role.id}
                          >
                            {role.name}
                          </option>
                        )
                      )}
                    </select>
                  )}
                </div>

                <div className="permission-table">
                  <div className="permission-table-header">
                    <span>Module</span>
                    <span>View</span>
                    <span>Add</span>
                    <span>Edit</span>
                    <span>Delete</span>
                  </div>

                  {modules.map(
                    (moduleName) => (
                      <div
                        className="permission-table-row"
                        key={moduleName}
                      >
                        <strong>
                          {moduleName}
                        </strong>

                        {actions.map(
                          (action) => (
                            <label
                              className="permission-switch"
                              key={action}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  permissionDraft[
                                    moduleName
                                  ]?.[
                                    action
                                  ] ||
                                  false
                                }
                                onChange={() =>
                                  handlePermissionToggle(
                                    moduleName,
                                    action
                                  )
                                }
                                disabled={
                                  saving ||
                                  !canEditUsersRoles
                                }
                              />

                              <span />
                            </label>
                          )
                        )}
                      </div>
                    )
                  )}
                </div>

                <div className="permissions-footer">
                  <span>
                    Selected role:{" "}

                    <strong>
                      {selectedRole?.name ||
                        "None"}
                    </strong>
                  </span>

                  <button
                    type="button"
                    className="settings-save-button"
                    onClick={
                      savePermissions
                    }
                    disabled={
                      saving ||
                      !selectedRoleId ||
                      !canEditUsersRoles
                    }
                  >
                    <FiSave />

                    {saving
                      ? "Saving..."
                      : "Save Permissions"}
                  </button>
                </div>
              </section>
            </div>
          )}
        </section>
      </main>

      {showRoleModal && (
        <div
          className="settings-modal-overlay"
          onMouseDown={() =>
            !saving &&
            setShowRoleModal(false)
          }
        >
          <form
            className="settings-role-modal"
            onSubmit={handleCreateRole}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="settings-role-modal-header">
              <div>
                <h2>Add New Role</h2>

                <p>
                  Create a new job title.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowRoleModal(false)
                }
                disabled={saving}
              >
                <FiX />
              </button>
            </div>

            <label>
              Role Name

              <input
                name="name"
                value={roleForm.name}
                placeholder="Inventory Supervisor"
                onChange={(event) =>
                  setRoleForm(
                    (currentData) => ({
                      ...currentData,

                      name:
                        event.target.value,
                    })
                  )
                }
                disabled={saving}
              />
            </label>

            <label>
              Description

              <textarea
                name="description"
                value={
                  roleForm.description
                }
                placeholder="Describe the role"
                onChange={(event) =>
                  setRoleForm(
                    (currentData) => ({
                      ...currentData,

                      description:
                        event.target.value,
                    })
                  )
                }
                disabled={saving}
              />
            </label>

            <div className="settings-role-modal-actions">
              <button
                type="button"
                onClick={() =>
                  setShowRoleModal(false)
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="create-role-button"
                disabled={saving}
              >
                {saving
                  ? "Creating..."
                  : "Create Role"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showUserModal && (
        <div
          className="settings-modal-overlay"
          onMouseDown={closeUserModal}
        >
          <form
            className="settings-user-modal"
            onSubmit={handleCreateUser}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="settings-role-modal-header">
              <div>
                <h2>Add New User</h2>

                <p>
                  Create login details
                  and assign a role.
                </p>
              </div>

              <button
                type="button"
                onClick={closeUserModal}
                disabled={saving}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <div className="settings-user-section">
              <div className="settings-user-section-header">
                <span>1</span>

                <div>
                  <h3>
                    Account Information
                  </h3>

                  <p>
                    Enter employee login
                    details.
                  </p>
                </div>
              </div>

              <div className="settings-user-grid">
                <label>
                  Full Name

                  <input
                    name="fullName"
                    value={
                      userForm.fullName
                    }
                    placeholder="Ahmed Samy"
                    onChange={
                      handleUserFormChange
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  Username

                  <input
                    type="text"
                    name="username"
                    value={
                      userForm.username
                    }
                    placeholder="ahmed.samy"
                    onChange={
                      handleUserFormChange
                    }
                    autoComplete="off"
                    disabled={saving}
                  />
                </label>

                <label>
                  Real Email

                  <input
                    type="email"
                    name="email"
                    value={
                      userForm.email
                    }
                    placeholder="ahmed@gmail.com"
                    onChange={
                      handleUserFormChange
                    }
                    autoComplete="email"
                    disabled={saving}
                  />
                </label>

                <label>
                  Temporary Password

                  <input
                    type="password"
                    name="password"
                    value={
                      userForm.password
                    }
                    placeholder="Minimum 6 characters"
                    onChange={
                      handleUserFormChange
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  Confirm Password

                  <input
                    type="password"
                    name="confirmPassword"
                    value={
                      userForm.confirmPassword
                    }
                    placeholder="Repeat password"
                    onChange={
                      handleUserFormChange
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  Role

                  <select
                    name="roleId"
                    value={
                      userForm.roleId
                    }
                    onChange={
                      handleUserFormChange
                    }
                    disabled={saving}
                  >
                    <option value="">
                      Select role
                    </option>

                    {roles.map(
                      (role) => (
                        <option
                          key={role.id}
                          value={role.id}
                        >
                          {role.name}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Branch

                  <select
                    name="branch"
                    value={
                      userForm.branch
                    }
                    onChange={
                      handleUserFormChange
                    }
                    disabled={saving}
                  >
                    <option value="Cairo">
                      Cairo
                    </option>

                    <option value="Alex">
                      Alex
                    </option>
                  </select>
                </label>
              </div>

              <div className="settings-user-note">
                New users start as
                Active and must change
                the temporary password
                on first login.
              </div>
            </div>

            <div className="settings-role-modal-actions">
              <button
                type="button"
                onClick={closeUserModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="create-role-button"
                disabled={saving}
              >
                {saving
                  ? "Creating..."
                  : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}