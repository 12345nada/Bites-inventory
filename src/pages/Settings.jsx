import {
  useEffect,
  useMemo,
  useState,
} from "react";


import { useDialog } from "../context/DialogContext";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import "../styles/mobile-sidebar-offcanvas.css";
import "../styles/dashboard.css";
import "../styles/Settings.css";
import "../styles/Staff.css";

import {
  assignEmployeeRole,
  createRole,
  createSystemUser,
  deleteRole,
  deleteSystemUser,
  getSettingsData,
  resetUserPassword,
  saveGeneralSettings,
  saveRolePermissions,
} from "../services/settingsService";

import {
  createDriver,
  createWaiter,
  getStaff,
} from "../services/staffService";

import {
  FiSearch,
  FiPlus,
  FiTrash2,
  FiSave,
  FiShield,
  FiUser,
  FiX,
  FiUpload,
  FiFileText,
  FiImage,
  FiKey,
} from "react-icons/fi";


import {
  useAuth,
} from "../context/AuthContext";

const emptyUserForm = {
  fullName: "",
  username: "",
  password: "",
  confirmPassword: "",
  roleId: "",
  branch: "Cairo",
};

const driverEmptyForm = {
  phone: "",
  nationalId: "",
  licenseNumber: "",
  licenseExpiryDate: "",
  carNumber: "",
  carType: "Van",
  status: "Active",
  eventRate: "",
  staffRole: "Driver",
  reportsToId: "",
  documents: {
    nationalIdImage: null,
    licenseImage: null,
  },
};

const waiterEmptyForm = {
  phone: "",
  nationalId: "",
  status: "Active",
  eventRate: "",
  staffRole: "Waiter",
  reportsToId: "",
  documents: {
    personalPhoto: null,
    nationalIdImage: null,
    healthCertificate: {
      file: null,
      expiryDate: "",
    },
    contract: {
      file: null,
      startDate: "",
      endDate: "",
    },
  },
};


export default function Settings() {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useDialog();



  const {
    user,
    profile,
    isAdmin,
    hasPermission,
    refreshProfile,
  } = useAuth();

  const canViewSettings =
    hasPermission(
      "Settings",
      "view"
    );

  const canViewUsersRoles =
    hasPermission(
      "Users / Role",
      "view"
    );

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

  const allPermissionsEnabled =
    useMemo(() => {
      if (
        modules.length === 0 ||
        actions.length === 0
      ) {
        return false;
      }

      return modules.every(
        (moduleName) =>
          actions.every(
            (action) =>
              Boolean(
                permissionDraft[
                  moduleName
                ]?.[action]
              )
          )
      );
    }, [
      modules,
      actions,
      permissionDraft,
    ]);

  const [
    showRoleModal,
    setShowRoleModal,
  ] = useState(false);

  const [
    showUserModal,
    setShowUserModal,
  ] = useState(false);

  const [
    showResetPasswordModal,
    setShowResetPasswordModal,
  ] = useState(false);

  const [
    resetPasswordUser,
    setResetPasswordUser,
  ] = useState(null);

  const [
    resetPasswordForm,
    setResetPasswordForm,
  ] = useState({
    password: "",
    confirmPassword: "",
  });

  const [roleForm, setRoleForm] =
    useState({
      name: "",
      description: "",
    });

  const [userForm, setUserForm] =
    useState(emptyUserForm);

  const [
    driverForm,
    setDriverForm,
  ] = useState(
    driverEmptyForm
  );

  const [
    waiterForm,
    setWaiterForm,
  ] = useState(
    waiterEmptyForm
  );

  const [
    staffDirectory,
    setStaffDirectory,
  ] = useState({
    drivers: [],
    waiters: [],
  });

  const headDrivers = useMemo(
    () =>
      staffDirectory.drivers.filter(
        (driver) =>
          driver.staffRole ===
          "Head Driver"
      ),
    [staffDirectory.drivers]
  );

  const headWaiters = useMemo(
    () =>
      staffDirectory.waiters.filter(
        (waiter) =>
          waiter.staffRole ===
          "Head Waiter"
      ),
    [staffDirectory.waiters]
  );

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (
      !isAdmin &&
      activeTab === "permissions"
    ) {
      setActiveTab("general");
      return;
    }

    if (
      activeTab === "general" &&
      !canViewSettings &&
      canViewUsersRoles
    ) {
      setActiveTab("permissions");
      return;
    }

    if (
      activeTab === "permissions" &&
      !canViewUsersRoles &&
      canViewSettings
    ) {
      setActiveTab("general");
    }
  }, [
    activeTab,
    isAdmin,
    canViewSettings,
    canViewUsersRoles,
  ]);

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
          t("settingsPage.errors.couldNotLoad"),
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

  const selectedUserRole =
    useMemo(
      () =>
        roles.find(
          (role) =>
            String(role.id) ===
            String(userForm.roleId)
        ),
      [
        roles,
        userForm.roleId,
      ]
    );

  const selectedUserRoleName =
    String(
      selectedUserRole?.name || ""
    )
      .trim()
      .toLowerCase();

  const isDriverRole =
    selectedUserRoleName ===
    "driver";

  const isWaiterRole =
    selectedUserRoleName ===
    "waiter";


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
        message: t("settingsPage.errors.noEditPermissions"),
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

  const handleToggleAllPermissions =
    () => {
      if (!canEditUsersRoles) {
        showAlert({
          message:
            t("settingsPage.errors.noEditPermissions"),
        });
        return;
      }

      const nextValue =
        !allPermissionsEnabled;

      const updatedPermissions =
        Object.fromEntries(
          modules.map(
            (moduleName) => [
              moduleName,
              Object.fromEntries(
                actions.map(
                  (action) => [
                    action,
                    nextValue,
                  ]
                )
              ),
            ]
          )
        );

      setPermissionDraft(
        updatedPermissions
      );
    };

  const savePermissions = async () => {
    if (!canEditUsersRoles) {
      showAlert({
        message: t("settingsPage.errors.noEditPermissions"),
      });
      return;
    }

    if (!selectedRoleId) {
      showAlert({
        message: t("settingsPage.errors.selectRole"),
      });
      return;
    }

    try {
      setSaving(true);

      await saveRolePermissions(
        selectedRoleId,
        permissionDraft
      );

      if (
        String(profile?.role_id) ===
        String(selectedRoleId)
      ) {
        await refreshProfile();
      }

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
        message: t("settingsPage.success.permissionsSaved"),
      });
    } catch (error) {
      console.error(
        "Error saving permissions:",
        error
      );

      showAlert({
        message: error.message ||
          t("settingsPage.errors.couldNotSavePermissions"),
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
        message: t("settingsPage.errors.noAddRoles"),
      });
      return;
    }

    event.preventDefault();

    if (!roleForm.name.trim()) {
      showAlert({
        message: t("settingsPage.errors.enterRoleName"),
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
          ? t("settingsPage.errors.roleExists")
          : error.message ||
              t("settingsPage.errors.couldNotCreateRole"),
      });
    } finally {
      setSaving(false);
    }
  };

  const openUserModal = async () => {
    if (!canAddUsersRoles) {
      showAlert({
        message: t("settingsPage.errors.noAddUsers"),
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

    setDriverForm(
      driverEmptyForm
    );

    setWaiterForm(
      waiterEmptyForm
    );

    setShowUserModal(true);

    try {
      const staffData =
        await getStaff();

      setStaffDirectory({
        drivers:
          staffData.drivers || [],
        waiters:
          staffData.waiters || [],
      });
    } catch (error) {
      console.error(
        "Could not load staff hierarchy:",
        error
      );
    }
  };

  const closeUserModal = () => {
    if (saving) {
      return;
    }

    setShowUserModal(false);
    setUserForm(emptyUserForm);
    setDriverForm(
      driverEmptyForm
    );
    setWaiterForm(
      waiterEmptyForm
    );
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

  const handleDriverChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setDriverForm(
      (currentForm) => ({
        ...currentForm,
        [name]: value,
      })
    );
  };

  const handleWaiterChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setWaiterForm(
      (currentForm) => ({
        ...currentForm,
        [name]: value,
      })
    );
  };

  const setDriverDocument = (
    field,
    file
  ) => {
    setDriverForm(
      (currentForm) => ({
        ...currentForm,
        documents: {
          ...currentForm.documents,
          [field]: file
            ? {
                name: file.name,
                file,
              }
            : null,
        },
      })
    );
  };

  const setWaiterDocument = (
    field,
    file
  ) => {
    setWaiterForm(
      (currentForm) => {
        if (
          field ===
          "healthCertificate"
        ) {
          return {
            ...currentForm,
            documents: {
              ...currentForm.documents,
              healthCertificate: {
                ...currentForm
                  .documents
                  .healthCertificate,
                file: file
                  ? {
                      name:
                        file.name,
                      file,
                    }
                  : null,
              },
            },
          };
        }

        if (
          field ===
          "contract"
        ) {
          return {
            ...currentForm,
            documents: {
              ...currentForm.documents,
              contract: {
                ...currentForm
                  .documents
                  .contract,
                file: file
                  ? {
                      name:
                        file.name,
                      file,
                    }
                  : null,
              },
            },
          };
        }

        return {
          ...currentForm,
          documents: {
            ...currentForm.documents,
            [field]: file
              ? {
                  name:
                    file.name,
                  file,
                }
              : null,
          },
        };
      }
    );
  };

  const setWaiterDate = (
    section,
    field,
    value
  ) => {
    setWaiterForm(
      (currentForm) => ({
        ...currentForm,
        documents: {
          ...currentForm.documents,
          [section]: {
            ...currentForm
              .documents[
                section
              ],
            [field]: value,
          },
        },
      })
    );
  };


  const handleCreateUser = async (
    event
  ) => {
    if (!canAddUsersRoles) {
      showAlert({
        message: t("settingsPage.errors.noAddUsers"),
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


    if (
      !fullName ||
      !username ||
      !userForm.password ||
      !userForm.confirmPassword ||
      !userForm.roleId ||
      !userForm.branch
    ) {
      showAlert({
        message: t("settingsPage.errors.completeUserFields"),
      });

      return;
    }

    if (
      !/^[a-z0-9._-]{3,30}$/.test(
        username
      )
    ) {
      showAlert({
        message: t("settingsPage.errors.usernameRules"),
      });

      return;
    }


    if (
      userForm.password.length < 6
    ) {
      showAlert({
        message: t("settingsPage.errors.passwordLength"),
      });

      return;
    }

    if (
      userForm.password !==
      userForm.confirmPassword
    ) {
      showAlert({
        message: t("settingsPage.errors.passwordMismatch"),
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
        message: t("settingsPage.errors.roleUnavailable"),
      });

      return;
    }

    if (
      isDriverRole &&
      (
        !driverForm.phone.trim() ||
        !driverForm.nationalId.trim() ||
        !driverForm.licenseNumber.trim() ||
        !driverForm.licenseExpiryDate ||
        !driverForm.carNumber.trim() ||
        Number(driverForm.eventRate) < 0
      )
    ) {
      showAlert({
        message:
          t("settingsPage.errors.completeDriver"),
      });

      return;
    }

    if (
      isWaiterRole &&
      (
        !waiterForm.phone.trim() ||
        !waiterForm.nationalId.trim() ||
        Number(waiterForm.eventRate) < 0
      )
    ) {
      showAlert({
        message:
          t("settingsPage.errors.completeWaiter"),
      });

      return;
    }


    try {
      setSaving(true);

      const currentRoleId =
        Number(selectedUserRole.id);

      if (!Number.isInteger(currentRoleId)) {
        showAlert({
        message: t("settingsPage.errors.invalidRoleId"),
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
          password:
            userForm.password,
          roleId:
            currentRoleId,
          roleName:
            selectedUserRole.name,
          branch:
            userForm.branch,
        });

      if (isDriverRole) {
        await createDriver({
          ...driverForm,
          fullName,
          branch: userForm.branch,
        });
      }

      if (isWaiterRole) {
        await createWaiter({
          ...waiterForm,
          fullName,
          branch: userForm.branch,
        });
      }

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
      setDriverForm(
        driverEmptyForm
      );
      setWaiterForm(
        waiterEmptyForm
      );
      setShowUserModal(false);

      showAlert({
        message: t("settingsPage.success.userCreated"),
      });
    } catch (error) {
      console.error(
        "Create user error:",
        error
      );

      showAlert({
        message: error.message ||
          t("settingsPage.errors.couldNotCreateUser"),
      });
    } finally {
      setSaving(false);
    }
  };

  const removeEmployee = async (
    employeeId
  ) => {
    if (!canDeleteUsersRoles) {
      showAlert({
        message:
          "You do not have permission to delete users.",
      });
      return;
    }

    const employee = employees.find(
      (currentEmployee) =>
        String(currentEmployee.id) ===
        String(employeeId)
    );

    if (!employee) {
      showAlert({
        message: "User not found.",
      });
      return;
    }

    if (
      String(user?.id || "") ===
      String(employeeId)
    ) {
      showAlert({
        message:
          "You cannot delete your own account.",
      });
      return;
    }

    const confirmed = await showConfirm({
      message: `Are you sure you want to delete ${employee.name}? This action cannot be undone.`,
    });

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      await deleteSystemUser(
        employeeId
      );

      const remainingEmployees =
        employees.filter(
          (currentEmployee) =>
            String(currentEmployee.id) !==
            String(employeeId)
        );

      setEmployees(
        remainingEmployees
      );

      if (
        String(selectedEmployeeId) ===
        String(employeeId)
      ) {
        const nextEmployee =
          remainingEmployees[0] || null;

        setSelectedEmployeeId(
          nextEmployee?.id || ""
        );

        setSelectedRoleId(
          nextEmployee?.roleId ||
            roles[0]?.id ||
            ""
        );
      }

      showAlert({
        message:
          "User deleted successfully.",
      });
    } catch (error) {
      showAlert({
        message:
          error.message ||
          "Could not delete user.",
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
        message: t("settingsPage.errors.noDeleteRoles"),
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
        message: t("settingsPage.errors.adminCannotDelete"),
      });

      return;
    }

    const confirmed = await showConfirm({
      message: t("settingsPage.confirm.deleteRole"),
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
              t("settingsPage.errors.couldNotDeleteRole"),
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
        message: t("settingsPage.errors.noAssignRoles"),
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
            t("settingsPage.errors.couldNotAssignRole"),
      });
      }
    };


  const openResetPasswordModal = (
    employee
  ) => {
    if (!canEditUsersRoles) {
      showAlert({
        message:
          t("settingsPage.errors.noResetPassword"),
      });
      return;
    }

    setResetPasswordUser(employee);
    setResetPasswordForm({
      password: "",
      confirmPassword: "",
    });
    setShowResetPasswordModal(true);
  };

  const closeResetPasswordModal =
    () => {
      if (saving) {
        return;
      }

      setShowResetPasswordModal(false);
      setResetPasswordUser(null);
      setResetPasswordForm({
        password: "",
        confirmPassword: "",
      });
    };

  const handleResetPassword =
    async (event) => {
      event.preventDefault();

      if (!resetPasswordUser?.id) {
        showAlert({
          message:
            t("settingsPage.errors.selectUser"),
        });
        return;
      }

      if (
        resetPasswordForm.password.length <
        6
      ) {
        showAlert({
          message:
            t("settingsPage.errors.passwordLength"),
        });
        return;
      }

      if (
        resetPasswordForm.password !==
        resetPasswordForm.confirmPassword
      ) {
        showAlert({
          message:
            t("settingsPage.errors.passwordMismatch"),
        });
        return;
      }

      try {
        setSaving(true);

        await resetUserPassword(
          resetPasswordUser.id,
          resetPasswordForm.password
        );

        setEmployees(
          (currentEmployees) =>
            currentEmployees.map(
              (employee) =>
                String(employee.id) ===
                String(
                  resetPasswordUser.id
                )
                  ? {
                      ...employee,
                      mustChangePassword:
                        true,
                    }
                  : employee
            )
        );

        setShowResetPasswordModal(false);
        setResetPasswordUser(null);
        setResetPasswordForm({
          password: "",
          confirmPassword: "",
        });

        showAlert({
          message:
            t("settingsPage.success.passwordReset"),
        });
      } catch (error) {
        showAlert({
          message:
            error.message ||
            t("settingsPage.errors.couldNotResetPassword"),
        });
      } finally {
        setSaving(false);
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
        message: t("settingsPage.errors.companyRequired"),
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
        message: t("settingsPage.success.generalSaved"),
      });
      } catch (error) {
        showAlert({
        message: error.message ||
            t("settingsPage.errors.couldNotSaveGeneral"),
      });
      } finally {
        setSaving(false);
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
            <h1>{t("settingsPage.title")}</h1>

            <p>{t("settingsPage.subtitle")}</p>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-tabs">
            {canViewSettings && (
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
                {t("settingsPage.tabs.general")}
              </button>
            )}

            {isAdmin &&
              canViewUsersRoles && (
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
                {t("settingsPage.tabs.permissions")}
              </button>
            )}
          </div>

          {loading ? (
            <div className="settings-loading-state">
              {t("settingsPage.loading")}
            </div>
          ) : activeTab === "general" ||
            !isAdmin ? (
            <div className="general-settings-panel">
              <div className="general-settings-grid">
                <label>
                  {t("settingsPage.general.companyName")}

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
                  {t("settingsPage.general.phone")}

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
                  {t("settingsPage.general.defaultWarehouse")}

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
                      {t("settingsPage.general.selectWarehouse")}
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
                  {t("settingsPage.general.currency")}

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
                  {t("settingsPage.general.dateFormat")}

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
                    ? t("settingsPage.common.saving")
                    : t("settingsPage.common.saveChanges")}
                </button>
              </div>
            </div>
          ) : (
            <div className="permissions-layout">
              <aside className="permission-column employee-column">
                <div className="permission-column-header">
                  <div>
                    <h3>{t("settingsPage.permissions.employees")}</h3>

                    <p>{t("settingsPage.permissions.selectEmployee")}</p>
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
                  {t("settingsPage.userModal.title")}
                </button>

                <div className="permission-search-box">
                  <FiSearch />

                  <input
                    type="text"
                    placeholder={t("settingsPage.permissions.searchEmployees")}
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
                      <div
                        className={`employee-list-row ${
                          String(
                            selectedEmployeeId
                          ) ===
                          String(employee.id)
                            ? "selected"
                            : ""
                        }`}
                        key={employee.id}
                      >
                        <button
                          type="button"
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

                        {canDeleteUsersRoles &&
                          String(user?.id || "") !==
                            String(employee.id) && (
                            <button
                              type="button"
                              className="delete-user-button"
                              onClick={(event) => {
                                event.stopPropagation();
                                removeEmployee(
                                  employee.id
                                );
                              }}
                              disabled={saving}
                              aria-label={`Delete ${employee.name}`}
                              title={`Delete ${employee.name}`}
                            >
                              <FiTrash2 />
                            </button>
                          )}
                      </div>
                    )
                  )}
                </div>
              </aside>

              <aside className="permission-column roles-column">
                <div className="permission-column-header">
                  <div>
                    <h3>{t("settingsPage.permissions.roles")}</h3>

                    <p>{t("settingsPage.permissions.chooseRole")}</p>
                  </div>

                  <FiShield />
                </div>

                <div className="permission-search-box">
                  <FiSearch />

                  <input
                    type="text"
                    placeholder={t("settingsPage.permissions.searchRoles")}
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
        message: t("settingsPage.errors.noAddRoles"),
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
                  {t("settingsPage.roleModal.title")}
                </button>
              </aside>

              <section className="permissions-panel">
                <div className="permissions-panel-header">
                  <div>
                    <h2>
                      {t("settingsPage.permissions.manageAccess")}
                    </h2>

                    <p>
                      {selectedEmployee
                        ? `${selectedEmployee.name} is assigned to ${
                            selectedRole?.name ||
                            t("settingsPage.permissions.noRole")
                          }`
                        : t("settingsPage.permissions.selectEmployeeOrRole")}
                    </p>
                  </div>

                  {selectedEmployee && (
                    <div className="selected-user-actions">
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
                          {t("settingsPage.permissions.selectRole")}
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

                      <button
                        type="button"
                        className="reset-user-password-button"
                        onClick={() =>
                          openResetPasswordModal(
                            selectedEmployee
                          )
                        }
                        disabled={
                          saving ||
                          !canEditUsersRoles
                        }
                      >
                        <FiKey />
                        {t("settingsPage.resetPassword.title")}
                      </button>
                    </div>
                  )}
                </div>

                <div className="permissions-master-toggle">
                  <div>
                    <strong>
                      {t("settingsPage.permissions.allPermissions")}
                    </strong>
                  </div>

                  <label className="permission-switch">
                    <input
                      type="checkbox"
                      checked={
                        allPermissionsEnabled
                      }
                      onChange={
                        handleToggleAllPermissions
                      }
                      disabled={
                        saving ||
                        !canEditUsersRoles
                      }
                      aria-label={t("settingsPage.permissions.toggleAll")}
                    />

                    <span />
                  </label>
                </div>

                <div className="permission-table">
                  <div className="permission-table-header">
                    <span>{t("settingsPage.permissions.module")}</span>
                    <span>{t("settingsPage.permissions.view")}</span>
                    <span>{t("settingsPage.permissions.add")}</span>
                    <span>{t("settingsPage.permissions.edit")}</span>
                    <span>{t("settingsPage.permissions.delete")}</span>
                  </div>

                  {modules.map(
                    (moduleName) => (
                      <div
                        className="permission-table-row"
                        key={moduleName}
                      >
                        <strong>
                          {t(`settingsPage.modules.${moduleName}`, { defaultValue: moduleName })}
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
                    {t("settingsPage.permissions.selectedRole")}:{" "}

                    <strong>
                      {selectedRole?.name ||
                        t("settingsPage.permissions.none")}
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
                      : t("settingsPage.permissions.savePermissions")}
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
                <h2>{t("settingsPage.roleModal.title")}</h2>

                <p>{t("settingsPage.roleModal.subtitle")}</p>
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
              {t("settingsPage.roleModal.roleName")}

              <input
                name="name"
                value={roleForm.name}
                placeholder={t("settingsPage.roleModal.rolePlaceholder")}
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
              {t("settingsPage.roleModal.description")}

              <textarea
                name="description"
                value={
                  roleForm.description
                }
                placeholder={t("settingsPage.roleModal.descriptionPlaceholder")}
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
                {t("settingsPage.common.cancel")}
              </button>

              <button
                type="submit"
                className="create-role-button"
                disabled={saving}
              >
                {saving
                  ? t("settingsPage.common.creating")
                  : t("settingsPage.roleModal.create")}
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
                <h2>{t("settingsPage.userModal.title")}</h2>

                <p>{t("settingsPage.userModal.subtitle")}</p>
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
                    {t("settingsPage.userModal.accountInfo")}
                  </h3>

                  <p>
                    Enter employee login
                    details.
                  </p>
                </div>
              </div>

              <div className="settings-user-grid">
                <label>
                  {t("settingsPage.userModal.fullName")}

                  <input
                    name="fullName"
                    value={
                      userForm.fullName
                    }
                    placeholder={t("settingsPage.userModal.fullNamePlaceholder")}
                    onChange={
                      handleUserFormChange
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  {t("settingsPage.userModal.username")}

                  <input
                    type="text"
                    name="username"
                    value={
                      userForm.username
                    }
                    placeholder={t("settingsPage.userModal.usernamePlaceholder")}
                    onChange={
                      handleUserFormChange
                    }
                    autoComplete="off"
                    disabled={saving}
                  />
                </label>

                <label>
                   {t("settingsPage.userModal.password")}

                  <input
                    type="password"
                    name="password"
                    value={
                      userForm.password
                    }
                    placeholder={t("settingsPage.userModal.passwordPlaceholder")}
                    onChange={
                      handleUserFormChange
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  {t("settingsPage.userModal.confirmPassword")}

                  <input
                    type="password"
                    name="confirmPassword"
                    value={
                      userForm.confirmPassword
                    }
                    placeholder={t("settingsPage.userModal.repeatPassword")}
                    onChange={
                      handleUserFormChange
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  {t("settingsPage.userModal.role")}

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
                  {t("settingsPage.userModal.branch")}

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
                Employees sign in using
                their username and
                temporary password.
                They do not have password
                recovery by email.
              </div>
            </div>

            {isDriverRole && (
              <div className="settings-user-section">
                <div className="settings-user-section-header">
                  <span>2</span>

                  <div>
                    <h3>
                      {t("settingsPage.staff.driverInfo")}
                    </h3>

                    <p>
                      Enter driver,
                      vehicle and document
                      information.
                    </p>
                  </div>
                </div>

                <div className="staff-form-grid">
                  <label>
                    {t("settingsPage.general.phone")} Number

                    <input
                      name="phone"
                      value={
                        driverForm.phone
                      }
                      onChange={
                        handleDriverChange
                      }
                      disabled={saving}
                    />
                  </label>

                  <label>
                    National ID

                    <input
                      name="nationalId"
                      value={
                        driverForm.nationalId
                      }
                      onChange={
                        handleDriverChange
                      }
                      disabled={saving}
                    />
                  </label>

                  <label>
                    License Number

                    <input
                      name="licenseNumber"
                      value={
                        driverForm.licenseNumber
                      }
                      onChange={
                        handleDriverChange
                      }
                      disabled={saving}
                    />
                  </label>

                  <label>
                    License Expiry Date

                    <input
                      type="date"
                      name="licenseExpiryDate"
                      value={
                        driverForm.licenseExpiryDate
                      }
                      onChange={
                        handleDriverChange
                      }
                      disabled={saving}
                    />
                  </label>

                  <label>
                    Car Number

                    <input
                      name="carNumber"
                      value={
                        driverForm.carNumber
                      }
                      onChange={
                        handleDriverChange
                      }
                      disabled={saving}
                    />
                  </label>

                  <label>
                    Car Type

                    <select
                      name="carType"
                      value={
                        driverForm.carType
                      }
                      onChange={
                        handleDriverChange
                      }
                      disabled={saving}
                    >
                      <option value="Van">
                        Van
                      </option>
                      <option value="Truck">
                        Truck
                      </option>
                      <option value="Pickup">
                        Pickup
                      </option>
                      <option value="Refrigerated Truck">
                        Refrigerated Truck
                      </option>
                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </label>

                  <label>
                    Status

                    <select
                      name="status"
                      value={
                        driverForm.status
                      }
                      onChange={
                        handleDriverChange
                      }
                      disabled={saving}
                    >
                      <option value="Active">
                        Active
                      </option>
                      <option value="Inactive">
                        Inactive
                      </option>
                      <option value="Suspended">
                        Suspended
                      </option>
                    </select>
                  </label>

                  <label>
                    Event Rate (EGP)

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="eventRate"
                      value={
                        driverForm.eventRate
                      }
                      onChange={
                        handleDriverChange
                      }
                      disabled={saving}
                    />
                  </label>

                  <label>
                    Driver Role

                    <select
                      name="staffRole"
                      value={
                        driverForm.staffRole
                      }
                      onChange={(event) => {
                        handleDriverChange(
                          event
                        );

                        if (
                          event.target.value ===
                          "Head Driver"
                        ) {
                          setDriverForm(
                            (current) => ({
                              ...current,
                              staffRole:
                                "Head Driver",
                              reportsToId: "",
                            })
                          );
                        }
                      }}
                      disabled={saving}
                    >
                      <option value="Driver">
                        Driver
                      </option>
                      <option value="Head Driver">
                        Head Driver
                      </option>
                    </select>
                  </label>

                  {driverForm.staffRole ===
                    "Driver" && (
                    <label>
                      Reports To

                      <select
                        name="reportsToId"
                        value={
                          driverForm.reportsToId
                        }
                        onChange={
                          handleDriverChange
                        }
                        disabled={saving}
                      >
                        <option value="">
                          No Head Driver
                        </option>

                        {headDrivers.map(
                          (driver) => (
                            <option
                              key={driver.id}
                              value={driver.id}
                            >
                              {
                                driver.fullName
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  )}
                </div>

                <div className="staff-documents-section">
                  <h3>Documents</h3>

                  <div className="staff-upload-grid">
                    <label className="staff-upload-box">
                      <FiImage />

                      <span>
                        National ID Image
                      </span>

                      <small>
                        {driverForm
                          .documents
                          .nationalIdImage
                          ?.name ||
                          "Upload image"}
                      </small>

                      <input
                        type="file"
                        accept="image/*"
                        disabled={saving}
                        onChange={(event) =>
                          setDriverDocument(
                            "nationalIdImage",
                            event.target
                              .files[0]
                          )
                        }
                      />
                    </label>

                    <label className="staff-upload-box">
                      <FiUpload />

                      <span>
                        License Image
                      </span>

                      <small>
                        {driverForm
                          .documents
                          .licenseImage
                          ?.name ||
                          "Upload image"}
                      </small>

                      <input
                        type="file"
                        accept="image/*"
                        disabled={saving}
                        onChange={(event) =>
                          setDriverDocument(
                            "licenseImage",
                            event.target
                              .files[0]
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {isWaiterRole && (
              <div className="settings-user-section">
                <div className="settings-user-section-header">
                  <span>2</span>

                  <div>
                    <h3>
                      {t("settingsPage.staff.waiterInfo")}
                    </h3>

                    <p>
                      Enter waiter and
                      document information.
                    </p>
                  </div>
                </div>

                <div className="staff-form-grid">
                  <label>
                    {t("settingsPage.general.phone")} Number

                    <input
                      name="phone"
                      value={
                        waiterForm.phone
                      }
                      onChange={
                        handleWaiterChange
                      }
                      disabled={saving}
                    />
                  </label>

                  <label>
                    National ID

                    <input
                      name="nationalId"
                      value={
                        waiterForm.nationalId
                      }
                      onChange={
                        handleWaiterChange
                      }
                      disabled={saving}
                    />
                  </label>

                  <label>
                    Status

                    <select
                      name="status"
                      value={
                        waiterForm.status
                      }
                      onChange={
                        handleWaiterChange
                      }
                      disabled={saving}
                    >
                      <option value="Active">
                        Active
                      </option>
                      <option value="Inactive">
                        Inactive
                      </option>
                      <option value="Suspended">
                        Suspended
                      </option>
                    </select>
                  </label>

                  <label>
                    Event Rate (EGP)

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="eventRate"
                      value={
                        waiterForm.eventRate
                      }
                      onChange={
                        handleWaiterChange
                      }
                      disabled={saving}
                    />
                  </label>

                  <label>
                    Waiter Role

                    <select
                      name="staffRole"
                      value={
                        waiterForm.staffRole
                      }
                      onChange={(event) => {
                        handleWaiterChange(
                          event
                        );

                        if (
                          event.target.value ===
                          "Head Waiter"
                        ) {
                          setWaiterForm(
                            (current) => ({
                              ...current,
                              staffRole:
                                "Head Waiter",
                              reportsToId: "",
                            })
                          );
                        }
                      }}
                      disabled={saving}
                    >
                      <option value="Waiter">
                        Waiter
                      </option>
                      <option value="Head Waiter">
                        Head Waiter
                      </option>
                    </select>
                  </label>

                  {waiterForm.staffRole ===
                    "Waiter" && (
                    <label>
                      Reports To

                      <select
                        name="reportsToId"
                        value={
                          waiterForm.reportsToId
                        }
                        onChange={
                          handleWaiterChange
                        }
                        disabled={saving}
                      >
                        <option value="">
                          No Head Waiter
                        </option>

                        {headWaiters.map(
                          (waiter) => (
                            <option
                              key={waiter.id}
                              value={waiter.id}
                            >
                              {
                                waiter.fullName
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  )}
                </div>

                <div className="staff-documents-section">
                  <h3>Documents</h3>

                  <div className="staff-upload-grid">
                    <label className="staff-upload-box">
                      <FiImage />

                      <span>
                        Personal Photo
                      </span>

                      <small>
                        {waiterForm
                          .documents
                          .personalPhoto
                          ?.name ||
                          "Upload file"}
                      </small>

                      <input
                        type="file"
                        accept="image/*"
                        disabled={saving}
                        onChange={(event) =>
                          setWaiterDocument(
                            "personalPhoto",
                            event.target
                              .files[0]
                          )
                        }
                      />
                    </label>

                    <label className="staff-upload-box">
                      <FiImage />

                      <span>
                        National ID Image
                      </span>

                      <small>
                        {waiterForm
                          .documents
                          .nationalIdImage
                          ?.name ||
                          "Upload file"}
                      </small>

                      <input
                        type="file"
                        accept="image/*"
                        disabled={saving}
                        onChange={(event) =>
                          setWaiterDocument(
                            "nationalIdImage",
                            event.target
                              .files[0]
                          )
                        }
                      />
                    </label>

                    <label className="staff-upload-box">
                      <FiFileText />

                      <span>
                        Health Certificate
                      </span>

                      <small>
                        {waiterForm
                          .documents
                          .healthCertificate
                          .file?.name ||
                          "Upload file"}
                      </small>

                      <input
                        type="file"
                        disabled={saving}
                        onChange={(event) =>
                          setWaiterDocument(
                            "healthCertificate",
                            event.target
                              .files[0]
                          )
                        }
                      />
                    </label>

                    <label className="staff-upload-box">
                      <FiFileText />

                      <span>
                        Contract
                      </span>

                      <small>
                        {waiterForm
                          .documents
                          .contract.file
                          ?.name ||
                          "Upload file"}
                      </small>

                      <input
                        type="file"
                        disabled={saving}
                        onChange={(event) =>
                          setWaiterDocument(
                            "contract",
                            event.target
                              .files[0]
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="staff-document-dates">
                    <label>
                      Health Certificate
                      Expiry

                      <input
                        type="date"
                        value={
                          waiterForm
                            .documents
                            .healthCertificate
                            .expiryDate
                        }
                        disabled={saving}
                        onChange={(event) =>
                          setWaiterDate(
                            "healthCertificate",
                            "expiryDate",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>

                    <label>
                      Contract Start Date

                      <input
                        type="date"
                        value={
                          waiterForm
                            .documents
                            .contract
                            .startDate
                        }
                        disabled={saving}
                        onChange={(event) =>
                          setWaiterDate(
                            "contract",
                            "startDate",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>

                    <label>
                      Contract End Date

                      <input
                        type="date"
                        value={
                          waiterForm
                            .documents
                            .contract
                            .endDate
                        }
                        disabled={saving}
                        onChange={(event) =>
                          setWaiterDate(
                            "contract",
                            "endDate",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}



            <div className="settings-role-modal-actions">
              <button
                type="button"
                onClick={closeUserModal}
                disabled={saving}
              >
                {t("settingsPage.common.cancel")}
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


      {showResetPasswordModal && (
        <div
          className="settings-modal-overlay"
          onMouseDown={
            closeResetPasswordModal
          }
        >
          <form
            className="settings-role-modal reset-password-modal"
            onSubmit={
              handleResetPassword
            }
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="settings-role-modal-header">
              <div>
                <h2>{t("settingsPage.resetPassword.title")}</h2>
                <p>
                  Create a new password
                  for{" "}
                  {resetPasswordUser?.name ||
                    "this user"}.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeResetPasswordModal
                }
                disabled={saving}
              >
                <FiX />
              </button>
            </div>

            <div className="reset-password-user">
              <strong>
                {resetPasswordUser?.name ||
                  "User"}
              </strong>
              <span>
                @{resetPasswordUser?.username ||
                  "username"}
              </span>
            </div>

            <label>
              New Password
              <input
                type="password"
                value={
                  resetPasswordForm.password
                }
                placeholder="Minimum 6 characters"
                disabled={saving}
                onChange={(event) =>
                  setResetPasswordForm(
                    (current) => ({
                      ...current,
                      password:
                        event.target.value,
                    })
                  )
                }
              />
            </label>

            <label>
              Confirm Password
              <input
                type="password"
                value={
                  resetPasswordForm.confirmPassword
                }
                placeholder="Repeat password"
                disabled={saving}
                onChange={(event) =>
                  setResetPasswordForm(
                    (current) => ({
                      ...current,
                      confirmPassword:
                        event.target.value,
                    })
                  )
                }
              />
            </label>

            <div className="settings-role-modal-actions">
              <button
                type="button"
                onClick={
                  closeResetPasswordModal
                }
                disabled={saving}
              >
                {t("settingsPage.common.cancel")}
              </button>

              <button
                type="submit"
                className="create-role-button"
                disabled={saving}
              >
                {saving
                  ? "Resetting..."
                  : "Reset Password"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}