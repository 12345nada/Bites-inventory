import { supabase } from "../lib/supabase";

export const SETTINGS_MODULES = [
  "Dashboard",
  "Events",
  "Items",
  "Purchase",
  "Suppliers",
  "Warehouse",
  "Staff",
  "Dispatch",
  "Returns",
  "Reports",
  "Users / Role",
  "Settings",
];

export const SETTINGS_ACTIONS = [
  "view",
  "add",
  "edit",
  "delete",
];

const createEmptyPermissions = () =>
  Object.fromEntries(
    SETTINGS_MODULES.map((moduleName) => [
      moduleName,
      {
        view: false,
        add: false,
        edit: false,
        delete: false,
      },
    ])
  );

const normalizePermissions = (
  permissionRows = []
) => {
  const permissions =
    createEmptyPermissions();

  permissionRows.forEach((row) => {
    const moduleName =
      row.module_name ||
      row.module ||
      row.resource_name;

    if (!moduleName) {
      return;
    }

    permissions[moduleName] = {
      view: Boolean(
        row.can_view ??
          row.view ??
          false
      ),
      add: Boolean(
        row.can_add ??
          row.add ??
          false
      ),
      edit: Boolean(
        row.can_edit ??
          row.edit ??
          false
      ),
      delete: Boolean(
        row.can_delete ??
          row.delete ??
          false
      ),
    };
  });

  return permissions;
};

const mapRole = (role) => ({
  id: role.id,
  name: role.name || "",
  description:
    role.description || "",
  isSystem: Boolean(
    role.is_system ||
      role.is_default ||
      false
  ),
  permissions:
    normalizePermissions(
      role.role_permissions || []
    ),
});

const mapEmployee = (profile) => ({
  id: profile.id,
  name:
    profile.full_name ||
    profile.name ||
    "",
  username: profile.username || "",
  email: profile.email || "",
  roleId: profile.role_id || "",
  branch: profile.branch || "",
  isActive:
    profile.is_active !== false,
  mustChangePassword: Boolean(
    profile.must_change_password
  ),
});

const mapGeneralSettings = (
  settings,
  warehouses
) => {
  const firstWarehouse =
    warehouses[0] || null;

  return {
    id: settings?.id || null,
    companyName:
      settings?.company_name ||
      settings?.name ||
      "Bites Catering",
    companyEmail:
      settings?.company_email ||
      settings?.email ||
      "info@bites.com",
    phone:
      settings?.phone || "",
    defaultWarehouseId:
      settings?.default_warehouse_id ||
      settings?.warehouse_id ||
      firstWarehouse?.id ||
      "",
    currency:
      settings?.currency || "EGP",
    dateFormat:
      settings?.date_format ||
      "DD/MM/YYYY",
  };
};

const getFunctionErrorMessage = async (
  error,
  fallbackMessage
) => {
  let message =
    error?.message ||
    fallbackMessage;

  try {
    if (
      error?.context &&
      typeof error.context.json ===
        "function"
    ) {
      const responseBody =
        await error.context.json();

      if (responseBody?.error) {
        message =
          responseBody.error;
      }
    }
  } catch {
    // Keep the original message.
  }

  return message;
};

export async function getSettingsData() {
  const [
    rolesResult,
    profilesResult,
    settingsResult,
    warehousesResult,
  ] = await Promise.all([
    supabase
      .from("roles")
      .select(`
        id,
        name,
        description,
        role_permissions (
          id,
          module_name,
          can_view,
          can_add,
          can_edit,
          can_delete
        )
      `)
      .order("name", {
        ascending: true,
      }),

    supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        username,
        email,
        role_id,
        branch,
        is_active,
        must_change_password
      `)
      .order("full_name", {
        ascending: true,
      }),

    supabase
      .from("company_settings")
      .select("*")
      .limit(1)
      .maybeSingle(),

    supabase
      .from("warehouses")
      .select(`
        id,
        warehouse_code,
        name,
        branch
      `)
      .order("name", {
        ascending: true,
      }),
  ]);

  const firstError =
    rolesResult.error ||
    profilesResult.error ||
    settingsResult.error ||
    warehousesResult.error;

  if (firstError) {
    throw firstError;
  }

  const warehouses =
    warehousesResult.data || [];

  return {
    modules: SETTINGS_MODULES,
    actions: SETTINGS_ACTIONS,
    roles: (
      rolesResult.data || []
    ).map(mapRole),
    employees: (
      profilesResult.data || []
    ).map(mapEmployee),
    warehouses,
    generalSettings:
      mapGeneralSettings(
        settingsResult.data,
        warehouses
      ),
  };
}

export async function saveGeneralSettings(
  settings
) {
  const payload = {
    company_name:
      settings.companyName.trim(),
    company_email:
      settings.companyEmail
        .trim()
        .toLowerCase(),
    phone: settings.phone.trim(),
    default_warehouse_id:
      settings.defaultWarehouseId
        ? Number(
            settings.defaultWarehouseId
          )
        : null,
    currency: settings.currency,
    date_format:
      settings.dateFormat,
  };

  let query;

  if (settings.id) {
    query = supabase
      .from("company_settings")
      .update(payload)
      .eq("id", settings.id);
  } else {
    query = supabase
      .from("company_settings")
      .insert(payload);
  }

  const { data, error } = await query
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return {
    ...settings,
    id: data.id,
    companyName:
      data.company_name ||
      settings.companyName,
    companyEmail:
      data.company_email ||
      settings.companyEmail,
    phone:
      data.phone ||
      settings.phone,
    defaultWarehouseId:
      data.default_warehouse_id ||
      settings.defaultWarehouseId,
    currency:
      data.currency ||
      settings.currency,
    dateFormat:
      data.date_format ||
      settings.dateFormat,
  };
}

export async function createRole(
  roleData
) {
  const { data, error } = await supabase
    .from("roles")
    .insert({
      name: roleData.name.trim(),
      description:
        roleData.description.trim(),
    })
    .select(`
      id,
      name,
      description
    `)
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    description:
      data.description || "",
    isSystem: false,
    permissions:
      createEmptyPermissions(),
  };
}

export async function createSystemUser(
  userData
) {
  const roleId =
    Number(userData.roleId);

  if (!Number.isInteger(roleId)) {
    throw new Error(
      "The selected role has an invalid ID."
    );
  }

  const {
    data,
    error,
  } = await supabase.functions.invoke(
    "create-user",
    {
      body: {
        fullName:
          userData.fullName.trim(),
        username:
          userData.username
            .trim()
            .toLowerCase(),
        password:
          userData.password,
        roleId,
        roleName:
          String(
            userData.roleName || ""
          ).trim(),
        branch:
          userData.branch,
      },
    }
  );

  if (error) {
    const message =
      await getFunctionErrorMessage(
        error,
        "Could not create user."
      );

    throw new Error(message);
  }

  if (
    !data?.success ||
    !data?.user
  ) {
    throw new Error(
      data?.error ||
        "Could not create user."
    );
  }

  return {
    id: data.user.id,
    name: data.user.name || "",
    username:
      data.user.username || "",
    email: data.user.email || "",
    roleId: data.user.roleId || "",
    branch: data.user.branch || "",
    isActive:
      data.user.isActive !== false,
    mustChangePassword:
      Boolean(
        data.user.mustChangePassword
      ),
  };
}

export async function saveRolePermissions(
  roleId,
  permissions
) {
  const rows = SETTINGS_MODULES.map(
    (moduleName) => ({
      role_id: Number(roleId),
      module_name: moduleName,
      can_view: Boolean(
        permissions[moduleName]?.view
      ),
      can_add: Boolean(
        permissions[moduleName]?.add
      ),
      can_edit: Boolean(
        permissions[moduleName]?.edit
      ),
      can_delete: Boolean(
        permissions[moduleName]?.delete
      ),
    })
  );

  const { error } = await supabase
    .from("role_permissions")
    .upsert(rows, {
      onConflict:
        "role_id,module_name",
    });

  if (error) {
    throw error;
  }

  return permissions;
}

export async function assignEmployeeRole(
  employeeId,
  roleId
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      role_id: Number(roleId),
    })
    .eq("id", employeeId)
    .select(`
      id,
      full_name,
      username,
      email,
      role_id,
      branch,
      is_active,
      must_change_password
    `)
    .single();

  if (error) {
    throw error;
  }

  return mapEmployee(data);
}

export async function deleteRole(
  roleId
) {
  const {
    count,
    error: countError,
  } = await supabase
    .from("profiles")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq(
      "role_id",
      Number(roleId)
    );

  if (countError) {
    throw countError;
  }

  if (count > 0) {
    const error = new Error(
      "This role is assigned to an employee."
    );

    error.code = "ROLE_IN_USE";
    throw error;
  }

  const { error } = await supabase
    .from("roles")
    .delete()
    .eq(
      "id",
      Number(roleId)
    );

  if (error) {
    throw error;
  }

  return true;
}

export async function resetUserPassword(
  userId,
  newPassword
) {
  const { data, error } =
    await supabase.functions.invoke(
      "reset-user-password",
      {
        body: {
          userId,
          newPassword,
        },
      }
    );

  if (error) {
    const message =
      await getFunctionErrorMessage(
        error,
        "Could not reset password."
      );

    throw new Error(message);
  }

  if (!data?.success) {
    throw new Error(
      data?.error ||
        "Could not reset password."
    );
  }

  return {
    success: true,
    mustChangePassword: true,
  };
}
