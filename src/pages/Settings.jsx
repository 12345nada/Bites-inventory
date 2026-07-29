import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "../components/dashboard/Sidebar";
import "../styles/mobile-sidebar-offcanvas.css";
import Topbar from "../components/dashboard/Topbar";

import {
  useSettings,
} from "../context/SettingsContext";

import "../styles/dashboard.css";
import "../styles/Settings.css";

import {
  FiSearch,
  FiPlus,
  FiTrash2,
  FiSave,
  FiShield,
  FiUser,
  FiX,
} from "react-icons/fi";

export default function Settings() {
  const {
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
  } = useSettings();

  const [activeTab, setActiveTab] =
    useState("permissions");

  const [searchValue, setSearchValue] =
    useState("");

  const [selectedRoleId, setSelectedRoleId] =
    useState(roles[0]?.id || "");

  const [
    selectedEmployeeId,
    setSelectedEmployeeId,
  ] = useState(
    employees[0]?.id || ""
  );

  const [
    permissionDraft,
    setPermissionDraft,
  ] = useState({});

  const [
    showRoleModal,
    setShowRoleModal,
  ] = useState(false);

  const [roleForm, setRoleForm] =
    useState({
      name: "",
      description: "",
    });

  const selectedRole = useMemo(
    () =>
      roles.find(
        (role) =>
          role.id === selectedRoleId
      ),
    [roles, selectedRoleId]
  );

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (employee) =>
          employee.id ===
          selectedEmployeeId
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
        employee.email
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
          .includes(search)
    );
  }, [roles, searchValue]);

  const handlePermissionToggle = (
    moduleName,
    action
  ) => {
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

  const savePermissions = () => {
    if (!selectedRoleId) {
      return;
    }

    updateRolePermissions(
      selectedRoleId,
      permissionDraft
    );

    alert(
      "Permissions saved successfully."
    );
  };

  const createRole = (event) => {
    event.preventDefault();

    if (!roleForm.name.trim()) {
      alert(
        "Please enter the role name."
      );
      return;
    }

    const result = addRole(roleForm);

    if (!result.success) {
      alert(result.message);
      return;
    }

    setSelectedRoleId(
      result.role.id
    );

    setRoleForm({
      name: "",
      description: "",
    });

    setShowRoleModal(false);
  };

  const removeRole = (roleId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this role?"
    );

    if (!confirmed) {
      return;
    }

    const result = deleteRole(roleId);

    if (!result.success) {
      alert(result.message);
      return;
    }

    const remainingRole =
      roles.find(
        (role) =>
          role.id !== roleId
      );

    setSelectedRoleId(
      remainingRole?.id || ""
    );
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

  return (
    <div className="dashboard-page">
      <Sidebar activePage="settings" />

      <main className="settings-main">
        <Topbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        <section className="settings-title-section">
          <div>
            <h1>Settings</h1>

            <p>
              Manage general settings and user
              permissions
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
                activeTab === "permissions"
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

          {activeTab === "general" ? (
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
                  />
                </label>

                <label>
                  Company Email
                  <input
                    name="companyEmail"
                    value={
                      generalSettings.companyEmail
                    }
                    onChange={
                      handleGeneralChange
                    }
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
                  />
                </label>

                <label>
                  Default Branch
                  <select
                    name="defaultBranch"
                    value={
                      generalSettings.defaultBranch
                    }
                    onChange={
                      handleGeneralChange
                    }
                  >
                    <option value="Cairo">
                      Cairo
                    </option>
                    <option value="Alex">
                      Alex
                    </option>
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

              <button
                type="button"
                className="settings-save-button"
                onClick={() =>
                  alert(
                    "General settings saved."
                  )
                }
              >
                <FiSave />
                Save Changes
              </button>
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
                          selectedEmployeeId ===
                          employee.id
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
                          {employee.email}
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
                          selectedRoleId ===
                          role.id
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

                        <button
                          type="button"
                          className="delete-role-button"
                          onClick={() =>
                            removeRole(
                              role.id
                            )
                          }
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    )
                  )}
                </div>

                <button
                  type="button"
                  className="add-role-inline"
                  onClick={() =>
                    setShowRoleModal(true)
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
                      Choose a role to configure
                      permissions
                    </h2>

                    <p>
                      {selectedEmployee
                        ? `${selectedEmployee.name} is assigned to ${selectedRole?.name || "No Role"}`
                        : "Select an employee or role"}
                    </p>
                  </div>

                  {selectedEmployee && (
                    <select
                      value={
                        selectedEmployee.roleId
                      }
                      onChange={(event) =>
                        assignEmployeeRole(
                          selectedEmployee.id,
                          event.target.value
                        )
                      }
                    >
                      {roles.map((role) => (
                        <option
                          key={role.id}
                          value={role.id}
                        >
                          {role.name}
                        </option>
                      ))}
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
                                  ] || false
                                }
                                onChange={() =>
                                  handlePermissionToggle(
                                    moduleName,
                                    action
                                  )
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
                    onClick={savePermissions}
                  >
                    <FiSave />
                    Save Permissions
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
            setShowRoleModal(false)
          }
        >
          <form
            className="settings-role-modal"
            onSubmit={createRole}
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
                      name: event.target.value,
                    })
                  )
                }
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
              />
            </label>

            <div className="settings-role-modal-actions">
              <button
                type="button"
                onClick={() =>
                  setShowRoleModal(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="create-role-button"
              >
                Create Role
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}