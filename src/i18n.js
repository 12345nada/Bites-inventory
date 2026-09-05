import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      login: "Login",
      email: "Email",
      password: "Password",
      english: "English",
      arabic: "Arabic",

      dashboard: "Dashboard",
      events: "Events",
      items: "Items",
      purchase: "Purchase",
      suppliers: "Suppliers",
      warehouse: "Warehouse",
      dispatch: "Dispatch",
      returns: "Returns",
      damage: "Damage",
      reports: "Reports",
      settings: "Settings",
      logout: "Logout",
      welcomeBack: "Welcome Back",
signInSubtitle: "Please sign in to your account",
accountType: "Account type",
adminManager: "Admin / Manager",
employee: "Employee",
username: "Username",
usernamePlaceholder: "Enter your username",
passwordPlaceholder: "Enter your password",
forgotPassword: "Forgot Password?",
signIn: "Sign In",
signingIn: "Signing In...",
showPassword: "Show password",
hidePassword: "Hide password",
sidebar: {
  dashboard: "Dashboard",
  events: "Events",
  items: "Items",
  purchase: "Purchase",
  suppliers: "Suppliers",
  warehouse: "Warehouse",
  staff: "Staff",
  dispatch: "Dispatch",
  returns: "Returns",
  reports: "Reports",
  settings: "Settings",
  logout: "Logout",
  loggingOut: "Logging out...", 
  logoutConfirm: "Are you sure you want to log out?",
cancel: "Cancel",
  
},
dashboard: {
  welcomeBack: "Welcome back, {{name}}",
  totalEvents: "Total Events",
  allEvents: "All events",
  upcomingEvents: "Upcoming Events",
  eventsUpcoming: "Events upcoming",
  totalWaiters: "Total Waiters",
  assignedWaiters: "Assigned waiters",
  eventsWithDrinks: "Events With Drinks",
  eventsServingDrinks: "Events serving drinks",
  totalInventoryCost: "Total Inventory Cost",
  egp: "EGP",
  couldNotLoadDashboard: "Could not load dashboard data."
},
eventTable: {
  eventList: "Event List",
  searchEvents: "Search events...",
  allBranches: "All Branches",
  changeTableView: "Change table view",
  eventType: "Event Type",
  client: "Client",
  date: "Date",
  location: "Location",
  branch: "Branch",
  numberOfWaiters: "# of Waiters",
  driver: "Driver",
  status: "Status",
  loadingEvents: "Loading events...",
  noUpcomingEvents: "No upcoming events match your search.",
  showingEvents: "Showing {{shown}} of {{total}} events",
  statuses: {
    confirmed: "Confirmed",
    in_progress: "In Progress",
    upcoming: "Upcoming",
    completed: "Completed",
    cancelled: "Cancelled"
  }
},

dashboardCharts: {
  eventStatus: "Event Status",
  eventByStatus: "Event By Status",
  eventByBranch: "Event By Branch",
  dataReturn: "Data Return",
  damage: "Damage",
  missing: "Missing",
  statuses: {
    confirmed: "Confirmed",
    in_progress: "In Progress",
    upcoming: "Upcoming",
    completed: "Completed",
    cancelled: "Cancelled"
  }
},

topbar: {
  searchAnything: "search anything...",
  openNotifications: "Open notifications",
  notifications: "Notifications",
  newNotifications: "{{count}} new",
  saving: "Saving...",
  markAllRead: "Mark all read",
  loadingNotifications: "Loading notifications...",
  noNotifications: "No notifications yet.",
  changeProfileImage: "Change profile image",
  profile: "Profile",
  chooseValidImage: "Please choose a JPG, PNG or WEBP image.",
  imageTooLarge: "The profile image must be 5 MB or smaller.",
  couldNotUploadImage: "Could not upload the profile image.",
  justNow: "Just now",
  minutesAgo: "{{count}} min ago",
  hoursAgo: "{{count}} hour ago",
  hoursAgo_other: "{{count}} hours ago",
  daysAgo: "{{count}} day ago",
  daysAgo_other: "{{count}} days ago",
  notificationContent: {
    upcomingEvent: "Upcoming Event",
    lowStockAlert: "Low Stock Alert",
    upcomingEventMessage: "{{event}} is departing at {{time}} to {{destination}}.",
    lowStockMessage: "{{item}} is low in {{warehouse}}. Available: {{available}}, Minimum: {{minimum}}."
  }
},
branches: {
  cairo: "Cairo",
  alex: "Alex",
},
items: {
  title: "Item List",
  subtitle: "Manage all inventory items",
  addNewItem: "Add New Item",
  editItem: "Edit Item",
  updateItem: "Update Item",
  saveItem: "Save Item",
  saving: "Saving...",
  cancel: "Cancel",
  close: "Close",
  edit: "Edit",
  delete: "Delete",
  searchItems: "Search items...",
  allWarehouses: "All Warehouses",
  loadingItems: "Loading items...",
  noItemsMatch: "No items match your search.",
  showingItems: "Showing {{shown}} of {{total}} items",
  previousPage: "Previous page",
  nextPage: "Next page",

  stats: {
    totalItems: "Total Items",
    allInventoryItems: "All inventory items",
    availableItems: "Available Items",
    availableQuantity: "Available quantity",
    reservedItems: "Reserved Items",
    reservedQuantity: "Reserved quantity",
    lowStockItems: "Low Stock Items",
    needRestock: "Need restock"
  },

  table: {
    item: "Item",
    category: "Category",
    unit: "Unit",
    warehouse: "Warehouse",
    available: "Available",
    minimumStock: "Minimum Stock",
    actions: "Actions"
  },

  form: {
    itemMaster: "Item Master",
    basicInfo: "Add the basic item information.",
    itemCode: "Item Code",
    itemName: "Item Name",
    itemNamePlaceholder: "Dinner Plate 28 cm",
    category: "Category",
    selectCategory: "Select category",
    unit: "Unit",
    itemType: "Item Type",
    purchaseCost: "Purchase Cost",
    supplier: "Supplier",
    selectSupplier: "Select supplier",
    locationWarehouse: "Location / Warehouse",
    selectWarehouse: "Select warehouse",
    minimumStock: "Minimum Stock",
    quantity: "Quantity",
    quantityPlaceholder: "Enter item quantity",
    picturesForItem: "Pictures for Item",
    uploadItemPictures: "Upload item pictures.",
    uploadPictures: "Upload Pictures",
    updateItemInfo: "Update the item information.",
    enterItemInfo: "Enter the item information."
  },

  units: {
    piece: "Piece",
    set: "Set",
    box: "Box",
    pack: "Pack",
    dozen: "Dozen",
    kilogram: "Kilogram",
    liter: "Liter"
  },

  itemTypes: {
    reusable: "Reusable",
    consumable: "Consumable"
  },

  categories: {
    manageCategories: "Manage Categories",
    subtitle: "Add, edit or delete item categories.",
    closeManager: "Close category manager",
    editCategory: "Edit Category",
    newCategory: "New Category",
    examplePlaceholder: "Example: Plates",
    cancelEdit: "Cancel Edit",
    saveChanges: "Save Changes",
    addCategory: "Add Category",
    noCategories: "No categories found."
  },

  confirm: {
    deleteCategory: "Are you sure you want to delete {{name}}?",
    deleteItem: "Are you sure you want to delete {{name}}?"
  },

  errors: {
    permissionDenied: "Permission Denied",
    unableToLoadItems: "Unable to load items.",
    noManageCategoriesPermission: "You do not have permission to manage item categories.",
    noEditCategoriesPermission: "You do not have permission to edit item categories.",
    noAddCategoriesPermission: "You do not have permission to add item categories.",
    noDeleteCategoriesPermission: "You do not have permission to delete item categories.",
    enterCategoryName: "Please enter a category name.",
    categoryExists: "This category already exists.",
    unableToSaveCategory: "Unable to save the category.",
    categoryInUse: "This category is used by one or more items and cannot be deleted.",
    unableToDeleteCategory: "Unable to delete the category.",
    noAddItemsPermission: "You do not have permission to add items.",
    noEditItemsPermission: "You do not have permission to edit items.",
    noDeleteItemsPermission: "You do not have permission to delete items.",
    warehouseCapacityExceeded: "Warehouse Capacity Exceeded",
    warehouseCapacityMessage: "{{warehouse}} does not have enough available capacity. Only {{count}} items can be added.",
    completeAllFields: "Please complete all item fields.",
    noNegativeValues: "Cost, stock and quantity values cannot be negative.",
    itemCodeExists: "This item code already exists.",
    unableToValidateCapacity: "Unable to validate warehouse capacity.",
    unableToSaveItem: "Unable to save the item.",
    unableToDeleteItem: "Unable to delete this item. It may be used in another record."
  },

  aria: {
    editItem: "Edit {{name}}",
    moreActions: "More actions for {{name}}",
    itemPreview: "Item preview {{number}}",
    editCategory: "Edit {{name}}",
    deleteCategory: "Delete {{name}}"
  }
},
warehouses: {
  alex_warehouse: "Alex Warehouse",
  cairo_warehouse: "Cairo Warehouse",
},
warehousePage: {
  title: "Warehouse",
  subtitle: "Manage all your warehouses",
  addNewWarehouse: "Add New Warehouse",
  allWarehouses: "All Warehouses",
  tableSubtitle: "View warehouse capacity and usage",
  searchPlaceholder: "Search warehouses...",
  allBranches: "All Branches",
  loading: "Loading warehouses...",
  noResults: "No warehouses match your search.",
  items: "Items",
  used: "used",

  table: {
    warehouseName: "Warehouse Name",
    branch: "Branch",
    location: "Location",
    totalCapacity: "Total Capacity",
    availableCapacity: "Available Capacity",
    usage: "Usage",
    actions: "Actions"
  },

  actions: {
    edit: "Edit",
    delete: "Delete"
  },

  pagination: {
    showing: "Showing",
    of: "of",
    warehouses: "warehouses"
  },

  modal: {
    editWarehouse: "Edit Warehouse",
    addWarehouse: "Add New Warehouse",
    description: "Enter the warehouse information.",
    closeForm: "Close form",
    warehouseName: "Warehouse Name",
    namePlaceholder: "Cairo Warehouse",
    branch: "Branch",
    location: "Location",
    locationPlaceholder: "New Cairo, Cairo",
    totalCapacity: "Total Capacity",
    capacityNote: "Used and available capacity are calculated automatically from inventory.",
    cancel: "Cancel",
    saving: "Saving...",
    saveChanges: "Save Changes",
    saveWarehouse: "Save Warehouse"
  },

  confirm: {
    deleteWarehouse: "Are you sure you want to delete this warehouse?"
  },

  errors: {
    permissionDenied: "Permission Denied",
    couldNotLoad: "Could not load warehouses.",
    noAddPermission: "You do not have permission to add warehouses.",
    noEditPermission: "You do not have permission to edit warehouses.",
    noDeletePermission: "You do not have permission to delete warehouses.",
    completeAllFields: "Please complete all warehouse fields.",
    capacityGreaterThanZero: "Total capacity must be greater than zero.",
    capacityBelowUsed: "Total capacity cannot be less than the current used capacity.",
    nameExists: "A warehouse with this name already exists.",
    couldNotSave: "Could not save warehouse.",
    containsInventory: "You cannot delete a warehouse that contains inventory.",
    connectedRecords: "This warehouse cannot be deleted because it is connected to events, purchases, dispatches, or company settings.",
    couldNotDelete: "Could not delete warehouse."
  },

  aria: {
    editWarehouse: "Edit {{name}}",
    moreActions: "More actions for {{name}}"
  }
},
purchase: {
  title: "Purchase",
  subtitle: "Manage purchase requests, approvals and received inventory",
  newRequest: "New Purchase Request",
  search: "Search purchase orders...",
  allWarehouses: "All Warehouses",
  allStatuses: "All Statuses",
  loading: "Loading purchase orders...",
  noMatches: "No purchase orders match your search.",
  saving: "Saving...",
  showingOrders: "Showing {{from}}-{{to}} of {{total}} purchase orders",

  stats: {
    totalOrders: "Total Purchase Orders",
    allOrders: "All orders",
    pendingApproval: "Pending Approval",
    purchaseRequests: "Purchase requests",
    itemsReceived: "Items Received",
    inventoryUpdated: "Inventory updated",
    totalSpent: "Total Spent",
    egpReceivedOrders: "EGP received orders"
  },

  statuses: {
    pending: "Pending",
    approved: "Approved",
    received: "Received",
    cancelled: "Cancelled"
  },

  table: {
    poNumber: "PO Number",
    supplier: "Supplier",
    orderDate: "Order Date",
    expectedDate: "Expected Date",
    warehouse: "Warehouse",
    items: "Items",
    totalQuantity: "Total Quantity",
    totalAmount: "Total Amount",
    status: "Status",
    actions: "Actions"
  },

  actions: {
    approve: "Approve",
    receiveItems: "Receive Items",
    edit: "Edit",
    cancel: "Cancel",
    delete: "Delete"
  },

  modal: {
    editOrder: "Edit Purchase Order",
    enterSupplierInfo: "Enter the requested items and supplier information.",
    closeForm: "Close form",
    supplier: "Supplier",
    selectSupplier: "Select supplier",
    warehouse: "Warehouse",
    selectWarehouse: "Select warehouse",
    orderDate: "Order Date",
    expectedDate: "Expected Date",
    itemsQuantities: "Items & Quantities",
    addItemsHelp: "Add one or more items to this purchase order.",
    addItem: "Add Item",
    item: "Item",
    selectItem: "Select item",
    quantity: "Quantity",
    unitCost: "Unit Cost",
    removeItem: "Remove item",
    estimatedTotal: "Estimated Total:",
    updateOrder: "Update Order",
    createRequest: "Create Request"
  },

  receive: {
    title: "Receive Items",
    subtitle: "Confirm received items to update inventory.",
    note: "Inventory will be updated after confirming receipt.",
    receiving: "Receiving..."
  },

  confirm: {
    cancel: "Are you sure you want to cancel this purchase order?",
    delete: "Are you sure you want to delete this purchase order?"
  },

  errors: {
    permissionDenied: "Permission Denied",
    couldNotLoad: "Could not load purchase orders.",
    noAddPermission: "You do not have permission to add purchases.",
    noEditPermission: "You do not have permission to edit purchases.",
    completeAllFields: "Please complete all purchase fields.",
    addAtLeastOneItem: "Please add at least one item.",
    invalidItem: "Complete every item. Quantity must be greater than zero and unit cost cannot be negative.",
    duplicateItem: "The same item cannot be added more than once.",
    expectedDateBeforeOrder: "Expected date cannot be before the order date.",
    couldNotSave: "Could not save purchase order.",
    noApprovePermission: "You do not have permission to approve purchases.",
    couldNotApprove: "Could not approve purchase order.",
    noReceivePermission: "You do not have permission to receive purchases.",
    couldNotReceive: "Could not receive purchase items.",
    noCancelPermission: "You do not have permission to cancel purchases.",
    couldNotCancel: "Could not cancel purchase order.",
    noDeletePermission: "You do not have permission to delete purchases.",
    couldNotDelete: "Could not delete purchase order.",
    receiveCapacity: "{{warehouse}} does not have enough available capacity. Only {{count}} items can be received."
  },

  aria: {
    editOrder: "Edit {{number}}",
    moreActions: "More actions for {{number}}"
  }
},
dispatchPage: {
  title: "Dispatch",
  subtitle: "Manage event dispatch operations",
  addNewDispatch: "Add New Dispatch",
  searchPlaceholder: "Search dispatches...",
  loading: "Loading dispatches...",
  noResults: "No dispatches match your search.",
  itemTypes: "item types",
  totalQty: "total qty",
  available: "available",

  tabs: {
    "All Dispatches": "All Dispatches",
    "Prepared": "Prepared",
    "In Transit": "In Transit",
    "Delivered": "Delivered",
    "Cancelled": "Cancelled"
  },

  statuses: {
    "Prepared": "Prepared",
    "In Transit": "In Transit",
    "Delivered": "Delivered",
    "Cancelled": "Cancelled"
  },

  table: {
    dispatchId: "Dispatch ID",
    eventReference: "Event Reference",
    fromWarehouse: "From Warehouse",
    destination: "Destination",
    driver: "Driver",
    dateTime: "Date & Time",
    items: "Items",
    status: "Status",
    actions: "Actions"
  },

  actions: {
    startDispatch: "Start Dispatch",
    markDelivered: "Mark Delivered",
    edit: "Edit",
    cancel: "Cancel",
    delete: "Delete",
    saving: "Saving...",
    saveChanges: "Save Changes",
    saveDispatch: "Save Dispatch"
  },

  pagination: {
    showing: "Showing",
    to: "to",
    of: "of",
    dispatches: "dispatches",
    previousPage: "Previous page",
    nextPage: "Next page"
  },

  modal: {
    editDispatch: "Edit Dispatch",
    addDispatch: "Add New Dispatch",
    description: "Enter event, destination and item information.",
    eventReference: "Event Reference",
    selectEvent: "Select event",
    fromWarehouse: "From Warehouse",
    selectWarehouse: "Select warehouse",
    destinationVenue: "Destination / Venue",
    area: "Area",
    dispatchDate: "Dispatch Date",
    dispatchTime: "Dispatch Time",
    itemsQuantities: "Items & Quantities",
    itemsHelp: "Add the items leaving the selected warehouse.",
    addItem: "Add Item",
    item: "Item",
    loadingItems: "Loading items...",
    selectItem: "Select item",
    quantity: "Quantity",
    preparedNote: "New dispatches start automatically with the Prepared status."
  },

  confirm: {
    cancelDispatch: "Are you sure you want to cancel this dispatch?",
    deleteDispatch: "Are you sure you want to delete this dispatch?"
  },

  errors: {
    permissionDenied: "Permission Denied",
    couldNotLoad: "Could not load dispatches.",
    couldNotLoadWarehouseItems: "Could not load warehouse items.",
    noAddPermission: "You do not have permission to add dispatches.",
    noEditPermission: "You do not have permission to edit dispatches.",
    noDeletePermission: "You do not have permission to delete dispatches.",
    completeAllFields: "Please complete all dispatch fields.",
    addAtLeastOneItem: "Please add at least one item with a valid quantity.",
    duplicateItem: "The same item cannot be added more than once.",
    exceedsStock: "One or more quantities exceed the available stock.",
    couldNotSave: "Could not save dispatch.",
    couldNotUpdateStatus: "Could not update dispatch status.",
    connectedReturn: "This dispatch cannot be deleted because it is connected to a return.",
    couldNotDelete: "Could not delete dispatch."
  }
},
returnsPage: {
  title: "Returns", subtitle: "Record returned, damaged and missing quantities", receiveReturn: "Receive Return", searchPlaceholder: "Search returns...", loading: "Loading returns...", noResults: "No returns match your search.",
  tabs: { "All Returns":"All Returns", "Has Damage":"Has Damage", "Has Missing":"Has Missing" },
  table: { returnId:"Return ID", eventReference:"Event Reference", warehouse:"Warehouse", returnDate:"Return Date", receivedBy:"Received By", totalSent:"Total Sent", returned:"Returned", damaged:"Damaged", missing:"Missing", actions:"Actions" },
  actions: { delete:"Delete", cancel:"Cancel", saving:"Saving...", updateReturn:"Update Return", completeReturn:"Complete Return" },
  pagination: { showing:"Showing", of:"of", returns:"returns" },
  modal: { editReturn:"Edit Return", receiveReturn:"Receive Return", updateDescription:"Update returned, damaged and missing quantities.", description:"Record returned, damaged and missing quantities.", dispatchReference:"Dispatch Reference", selectDeliveredDispatch:"Select delivered dispatch", noDeliveredDispatch:"No delivered dispatch is currently waiting for return.", returnDate:"Return Date", eventReference:"Event Reference", returnWarehouse:"Return Warehouse", receivedBy:"Received By", employeeName:"Employee name", notes:"Notes", optionalNotes:"Optional notes", returnedItems:"Returned Items", itemsHelp:"Returned + Damaged + Missing must equal the sent quantity for every item.", item:"Item", sent:"Sent", returned:"Returned", damaged:"Damaged", missing:"Missing", totalSent:"Total Sent" },
  confirm: { deleteReturn:"Are you sure you want to delete this return record? Inventory quantities will be reversed." },
  errors: { permissionDenied:"Permission Denied", couldNotLoad:"Could not load returns.", noAddPermission:"You do not have permission to receive returns.", noEditPermission:"You do not have permission to edit returns.", noDeletePermission:"You do not have permission to delete returns.", completeInfo:"Please complete the return information.", noItems:"The selected dispatch has no items.", quantitiesMustMatch:"For every item: Returned + Damaged + Missing must equal Sent Quantity.", alreadyExists:"A return already exists for this dispatch.", couldNotComplete:"Could not complete the return.", couldNotDelete:"Could not delete the return record." },
  aria: { edit:"Edit {{code}}", moreActions:"More actions for {{code}}" }
},
staffPage: {
  title: "Staff Management", subtitle: "Manage drivers, waiters and their documents", egp: "EGP",
  tabs: { drivers: "Drivers", waiters: "Waiters", payments: "Payments" },
  search: { drivers: "Search drivers...", waiters: "Search waiters...", payments: "Search payments..." },
  status: { all: "All Statuses", pending: "Pending", partial: "Partial", paid: "Paid", active: "Active", inactive: "Inactive", suspended: "Suspended" },
  loadingDrivers: "Loading drivers...", loadingWaiters: "Loading waiters...", loadingPayments: "Loading payments...",
  table: { driver:"Driver", waiter:"Waiter", staff:"Staff", phone:"Phone", nationalId:"National ID", license:"License", licenseExpiry:"License Expiry", carNumber:"Car Number", carType:"Car Type", role:"Role", reportsTo:"Reports To", eventRate:"Event Rate", status:"Status", actions:"Actions", healthExpiry:"Health Expiry", contractEnd:"Contract End", documents:"Documents", payTo:"Pay To", type:"Type", event:"Event", date:"Date", amount:"Amount", totalAmount:"Total Amount", paid:"Paid", remaining:"Remaining", payment:"Payment", action:"Action", name:"Name", attendance:"Attendance", paymentTo:"Payment To", eventAmount:"Event Amount" },
  actions: { delete:"Delete", cancel:"Cancel", saving:"Saving...", saveChanges:"Save Changes", markAsPaid:"Mark as Paid" },
  payments: { pendingPayments:"Pending Payments", calculatedPerEvent:"Payments are calculated per completed event.", noResults:"No payments match your search.", summaryAllCompleted:"Payment summary for all completed events", amountPlaceholder:"Amount", pay:"Pay" },
  pagination: { showing:"Showing", of:"of", drivers:"drivers", waiters:"waiters" },
  fields: { fullName:"Full Name", phoneNumber:"Phone Number", nationalId:"National ID", licenseNumber:"License Number", carNumber:"Car Number", licenseExpiryDate:"License Expiry Date", carType:"Car Type", status:"Status", branch:"Branch", selectBranch:"Select branch", eventRate:"Event Rate (EGP)", driverRole:"Driver Role", waiterRole:"Waiter Role", reportsTo:"Reports To", documents:"Documents", healthCertificateExpiry:"Health Certificate Expiry", contractStartDate:"Contract Start Date", contractEndDate:"Contract End Date" },
  values: { driver:"Driver", headDriver:"Head Driver", waiter:"Waiter", headWaiter:"Head Waiter", noHeadDriver:"No Head Driver", noHeadWaiter:"No Head Waiter", van:"Van", truck:"Truck", pickup:"Pickup", refrigeratedTruck:"Refrigerated Truck", other:"Other", assigned:"Assigned" },
  documents: { personalPhoto:"Personal Photo", nationalIdImage:"National ID Image", licenseImage:"License Image", healthCertificate:"Health Certificate", contract:"Contract", uploadImage:"Upload image", uploadFile:"Upload file" },
  driverModal: { title:"Edit Driver", subtitle:"Enter driver and vehicle information." },
  waiterModal: { title:"Edit Waiter", subtitle:"Enter waiter information and documents." },
  eventDetails: { title:"Event Payment Details", subtitle:"Full staff breakdown for", eventCode:"Event Code", eventName:"Event Name", client:"Client", date:"Date", branch:"Branch", location:"Location", startTime:"Start Time", endTime:"End Time", waitersDescription:"Waiters assigned to this event and their saved event rates.", driverDescription:"Driver assignment and the saved driver payment for this event.", noWaiters:"No waiters assigned to this event.", noDriver:"No driver assigned to this event.", waitersTotal:"Waiters Total", driverTotal:"Driver Total", totalStaffCost:"Total Event Staff Cost" },
  confirm: { markPaid:"Mark {{name}}'s {{eventCode}} payment as paid?", deleteDriver:"Are you sure you want to delete this driver?", deleteWaiter:"Are you sure you want to delete this waiter?" },
  errors: { permissionDenied:"Permission Denied", couldNotLoad:"Could not load staff.", couldNotMarkPaid:"Could not mark payment as paid.", paymentAmountGreaterThanZero:"Enter a payment amount greater than 0.", paymentExceedsRemaining:"Payment cannot exceed the remaining {{amount}} {{currency}}.", couldNotRecordPayment:"Could not record payment.", noEditPermission:"You do not have permission to edit staff.", noDeletePermission:"You do not have permission to delete staff.", completeDriver:"Please complete the driver information.", driverDuplicate:"National ID or license number already exists.", couldNotSaveDriver:"Could not save driver.", completeWaiter:"Please complete the waiter information.", waiterDuplicate:"National ID already exists.", couldNotSaveWaiter:"Could not save waiter.", driverConnected:"This driver is connected to events or dispatches and cannot be deleted.", couldNotDeleteDriver:"Could not delete driver.", waiterConnected:"This waiter is connected to an event and cannot be deleted.", couldNotDeleteWaiter:"Could not delete waiter." }
},


settingsPage: {
  title: "Settings",
  subtitle: "Manage general settings and user permissions",
  loading: "Loading settings...",
  tabs: { general: "General Settings", permissions: "Permissions & User Rights" },
  common: { saving: "Saving...", saveChanges: "Save Changes", creating: "Creating...", cancel: "Cancel" },
  general: { companyName: "Company Name", phone: "Phone", defaultWarehouse: "Default Warehouse", selectWarehouse: "Select warehouse", currency: "Currency", dateFormat: "Date Format" },
  permissions: { employees: "Employees", selectEmployee: "Select an employee", searchEmployees: "Search employees...", roles: "Roles", chooseRole: "Choose a role", searchRoles: "Search roles...", manageAccess: "Manage user passwords and account access", selectEmployeeOrRole: "Select an employee or role", noRole: "No Role", selectRole: "Select role", allPermissions: "All Permissions", toggleAll: "Toggle all permissions", module: "Module", view: "View", add: "Add", edit: "Edit", delete: "Delete", selectedRole: "Selected role", none: "None", savePermissions: "Save Permissions" },
  roleModal: { title: "Add New Role", subtitle: "Create a new job title.", roleName: "Role Name", rolePlaceholder: "Inventory Supervisor", description: "Description", descriptionPlaceholder: "Describe the role", create: "Create Role" },
  userModal: { title: "Add New User", subtitle: "Create login details and assign a role.", accountInfo: "Account Information", fullName: "Full Name", fullNamePlaceholder: "Nada Lotfallah", username: "Username", usernamePlaceholder: "nada.lotfallah", password: "Password", passwordPlaceholder: "Minimum 6 characters", confirmPassword: "Confirm Password", repeatPassword: "Repeat password", role: "Role", branch: "Branch" },
  staff: { driverInfo: "Driver Information", waiterInfo: "Waiter Information", documents: "Documents" },
  resetPassword: { title: "Reset Password", newPassword: "New Password" },
  modules: { "Dashboard":"Dashboard", "Events":"Events", "Items":"Items", "Purchase":"Purchase", "Suppliers":"Suppliers", "Warehouse":"Warehouse", "Staff":"Staff", "Dispatch":"Dispatch", "Returns":"Returns", "Reports":"Reports", "Settings":"Settings", "Users / Role":"Users / Role" },
  errors: { couldNotLoad:"Could not load settings.", noEditPermissions:"You do not have permission to edit permissions.", selectRole:"Please select a role.", couldNotSavePermissions:"Could not save permissions.", noAddRoles:"You do not have permission to add roles.", enterRoleName:"Please enter the role name.", roleExists:"This role name already exists.", couldNotCreateRole:"Could not create role.", noAddUsers:"You do not have permission to add users.", completeUserFields:"Please complete all user fields.", usernameRules:"Username must be 3-30 characters and contain only lowercase letters, numbers, dots, underscores or hyphens.", passwordLength:"Password must contain at least 6 characters.", passwordMismatch:"Passwords do not match.", roleUnavailable:"The selected role is no longer available. Please close the form and select the role again.", completeDriver:"Please complete the driver information.", completeWaiter:"Please complete the waiter information.", invalidRoleId:"The selected role has an invalid ID.", couldNotCreateUser:"Could not create user.", noDeleteRoles:"You do not have permission to delete roles.", adminCannotDelete:"The Administrator role cannot be deleted.", couldNotDeleteRole:"Could not delete role.", noAssignRoles:"You do not have permission to assign roles.", couldNotAssignRole:"Could not assign the role.", noResetPassword:"You do not have permission to reset user passwords.", selectUser:"Please select a user.", couldNotResetPassword:"Could not reset password.", companyRequired:"Please enter the company name and email.", couldNotSaveGeneral:"Could not save general settings." },
  success: { permissionsSaved:"Permissions saved successfully.", userCreated:"User created successfully.", passwordReset:"Password reset successfully.", generalSaved:"General settings saved." },
  confirm: { deleteRole:"Are you sure you want to delete this role?" }
},

reportsPage: {
  title: "Reports",
  subtitle: "Business intelligence across inventory, purchases, events, operations and staff.",
  currency: "EGP",
  reportCenter: "Report Center",
  reportCenterSubtitle: "Choose the business view you need and narrow the results.",
  insights: { eventActivity:"Event Activity", upcomingEvents:"upcoming event(s),", currentlyInProgress:"currently in progress.", eventsCompletedAnd:"event(s) completed and", cancelled:"cancelled.", financialStockAttention:"Financial & Stock Attention", pendingStaffPayments:"Pending staff payments:", itemsNeedAttention:"inventory item(s) need stock attention." },
  labels: { "Business Overview":"Business Overview", "Inventory":"Inventory", "Purchases":"Purchases", "Events":"Events", "Dispatches":"Dispatches", "Returns & Recovery":"Returns & Recovery", "Staff Payments":"Staff Payments", "Warehouse Performance":"Warehouse Performance", "Metric":"Metric", "Value":"Value", "Inventory Value":"Inventory Value", "Purchase Spend":"Purchase Spend", "Active Events":"Active Events", "Completed Events":"Completed Events", "Upcoming Events":"Upcoming Events", "In Progress":"In Progress", "Cancelled":"Cancelled", "Stock Alerts":"Stock Alerts", "Pending Staff":"Pending Staff", "Inventory Report":"Inventory Report", "Item Code":"Item Code", "Item":"Item", "Category":"Category", "Warehouses":"Warehouses", "Available":"Available", "Damaged":"Damaged", "Missing":"Missing", "Minimum Stock":"Minimum Stock", "Stock Health":"Stock Health", "All Statuses":"All Statuses", "Healthy":"Healthy", "Low Stock":"Low Stock", "Out of Stock":"Out of Stock", "Available Qty":"Available Qty", "Purchase Report":"Purchase Report", "PO Number":"PO Number", "Supplier":"Supplier", "Warehouse":"Warehouse", "Item Types":"Item Types", "Total Qty":"Total Qty", "Total Amount":"Total Amount", "Order Date":"Order Date", "Expected Date":"Expected Date", "Status":"Status", "Pending":"Pending", "Approved":"Approved", "Received":"Received", "Purchase Orders":"Purchase Orders", "Total Spend":"Total Spend", "Total Quantity":"Total Quantity", "Events Report":"Events Report", "Event":"Event", "Event Type":"Event Type", "Client":"Client", "Date":"Date", "Branch":"Branch", "Driver":"Driver", "Waiters":"Waiters", "Dispatch":"Dispatch", "Return":"Return", "Staff Cost":"Staff Cost", "Upcoming":"Upcoming", "Completed":"Completed", "Total Events":"Total Events", "Total Staff Cost":"Total Staff Cost", "Dispatch Report":"Dispatch Report", "Dispatch ID":"Dispatch ID", "Time":"Time", "Prepared":"Prepared", "In Transit":"In Transit", "Delivered":"Delivered", "Returns & Recovery Report":"Returns & Recovery Report", "Return ID":"Return ID", "Return Date":"Return Date", "Sent":"Sent", "Good Returned":"Good Returned", "Recovery %":"Recovery %", "Loss %":"Loss %", "Risk":"Risk", "Clear":"Clear", "Partial Loss":"Partial Loss", "High Loss":"High Loss", "Staff Payments Report":"Staff Payments Report", "Staff":"Staff", "Role":"Role", "Type":"Type", "Events Worked":"Events Worked", "Total Earned":"Total Earned", "Paid":"Paid", "Remaining":"Remaining", "Partial":"Partial", "Warehouse Performance Report":"Warehouse Performance Report", "Capacity":"Capacity", "Used":"Used", "Available Capacity":"Available Capacity", "Received Qty":"Received Qty", "Dispatched Qty":"Dispatched Qty" },
  export: "Export",
  exportPdf: "Export as PDF",
  exportExcel: "Export as Excel",
  search: "Search report...",
  loading: "Loading report data...",
  noRecords: "No records match the selected filters.",
  showingRange: "Showing {{from}} to {{to}} of {{total}} records",
  types: { inventory:"Inventory Report", purchases:"Purchase Report", dispatches:"Dispatch Report", returns:"Returns Report" },
  filters: { title:"Report Filters", subtitle:"Select a report type and narrow the results.", reportType:"Report Type", fromDate:"From Date", toDate:"To Date", warehouse:"Warehouse", allWarehouses:"All Warehouses", status:"Status", reset:"Reset Filters" },
  columns: { itemCode:"Item Code", item:"Item", category:"Category", warehouse:"Warehouse", available:"Available", damaged:"Damaged", missing:"Missing", minimumStock:"Minimum Stock", stockLevel:"Stock Level", poNumber:"PO Number", supplier:"Supplier", quantity:"Quantity", totalAmount:"Total Amount", orderDate:"Order Date", status:"Status", dispatchId:"Dispatch ID", eventReference:"Event Reference", destination:"Destination", driver:"Driver", date:"Date", totalQuantity:"Total Quantity", returnId:"Return ID", returnDate:"Return Date", receivedBy:"Received By", totalSent:"Total Sent", returned:"Returned" },
  statuses: { "All Statuses":"All Statuses", "In Stock":"In Stock", "Low Stock":"Low Stock", "Pending":"Pending", "Approved":"Approved", "Received":"Received", "Cancelled":"Cancelled", "Prepared":"Prepared", "In Transit":"In Transit", "Delivered":"Delivered", "Clear":"Clear", "Has Damage":"Has Damage", "Has Missing":"Has Missing" },
  errors: { permissionDenied:"Permission Denied", noExportPermission:"You do not have permission to export reports.", noDataExport:"There is no data to export.", couldNotLoad:"Could not load report data." }
},

suppliers: {
  title: "Suppliers",
  subtitle: "Manage supplier contact information",
  addNewSupplier: "Add New Supplier",
  searchPlaceholder: "Search suppliers...",

  tabs: {
    all: "All Suppliers",
    active: "Active",
    inactive: "Inactive",
  },

  table: {
    supplier: "Supplier",
    contactPerson: "Contact Person",
    phone: "Phone",
    email: "Email",
    address: "Address",
    status: "Status",
    actions: "Actions",
  },

  status: {
    active: "Active",
    inactive: "Inactive",
  },

  loading: "Loading suppliers...",
  noResults: "No suppliers match your search.",

  actions: {
    activate: "Activate",
    deactivate: "Deactivate",
    delete: "Delete",
    edit: "Edit",
  },

  pagination: {
    showing: "Showing",
    of: "of",
    suppliers: "suppliers",
  },

  modal: {
    editSupplier: "Edit Supplier",
    addSupplier: "Add New Supplier",
    description: "Enter supplier contact information.",
    supplierName: "Supplier Name",
    contactPerson: "Contact Person",
    phoneNumber: "Phone Number",
    email: "Email",
    address: "Address",
    status: "Status",
    supplierNamePlaceholder: "Royal Glass",
    contactPersonPlaceholder: "Ahmed Hassan",
    phonePlaceholder: "01012345678",
    emailPlaceholder: "info@supplier.com",
    addressPlaceholder: "Supplier address",
    cancel: "Cancel",
    saving: "Saving...",
    saveChanges: "Save Changes",
    saveSupplier: "Save Supplier",
  },

  errors: {
    permissionDenied: "Permission Denied",
    couldNotLoad: "Could not load suppliers.",
    noAddPermission: "You do not have permission to add suppliers.",
    noEditPermission: "You do not have permission to edit suppliers.",
    noDeletePermission: "You do not have permission to delete suppliers.",
    completeAllFields: "Please complete all supplier fields.",
    couldNotSave: "Could not save supplier.",
    couldNotDelete: "Could not delete supplier.",
    couldNotUpdateStatus: "Could not update supplier status.",
  },

  confirm: {
    deleteSupplier: "Are you sure you want to delete this supplier?",
  },

  aria: {
    editSupplier: "Edit {{name}}",
    moreActions: "More actions for {{name}}",
  },
},

    }
  },

  ar: {
    translation: {
      login: "تسجيل الدخول",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      english: "الإنجليزية",
      arabic: "العربية",

      dashboard: "لوحة التحكم",
      events: "الفعاليات",
      items: "الأصناف",
      purchase: "المشتريات",
      suppliers: "الموردون",
      warehouse: "المخازن",
      dispatch: "التوزيع",
      returns: "المرتجعات",
      damage: "التالف",
      reports: "التقارير",
      settings: "الإعدادات",
      logout: "تسجيل الخروج",
      welcomeBack: "مرحبًا بعودتك",
signInSubtitle: "يرجى تسجيل الدخول إلى حسابك",
accountType: "نوع الحساب",
adminManager: "المدير / المسؤول",
employee: "الموظف",
username: "اسم المستخدم",
usernamePlaceholder: "أدخل اسم المستخدم",
passwordPlaceholder: "أدخل كلمة المرور",
forgotPassword: "نسيت كلمة المرور؟",
signIn: "تسجيل الدخول",
signingIn: "جاري تسجيل الدخول...",
showPassword: "إظهار كلمة المرور",
hidePassword: "إخفاء كلمة المرور",
sidebar: {
  dashboard: "لوحة التحكم",
  events: "الفعاليات",
  items: "الأصناف",
  purchase: "المشتريات",
  suppliers: "الموردون",
  warehouse: "المخازن",
  staff: "الموظفون",
  dispatch: "التوزيع",
  returns: "المرتجعات",
  reports: "التقارير",
  settings: "الإعدادات",
  logout: "تسجيل الخروج",
loggingOut: "جاري تسجيل الخروج...",
logoutConfirm: "هل أنتِ متأكدة من تسجيل الخروج؟",
cancel: "إلغاء",
},
dashboard: {
  welcomeBack: "مرحبًا بعودتك، {{name}}",
  totalEvents: "إجمالي الفعاليات",
  allEvents: "جميع الفعاليات",
  upcomingEvents: "الفعاليات القادمة",
  eventsUpcoming: "فعاليات قادمة",
  totalWaiters: "إجمالي النادلين",
  assignedWaiters: "النادلون المعيّنون",
  eventsWithDrinks: "فعاليات تشمل مشروبات",
  eventsServingDrinks: "فعاليات يتم فيها تقديم مشروبات",
  totalInventoryCost: "إجمالي تكلفة المخزون",
  egp: "جنيه",
  couldNotLoadDashboard: "تعذر تحميل بيانات لوحة التحكم."
},
eventTable: {
  eventList: "قائمة الفعاليات",
  searchEvents: "ابحث في الفعاليات...",
  allBranches: "جميع الفروع",
  changeTableView: "تغيير عرض الجدول",
  eventType: "نوع الفعالية",
  client: "العميل",
  date: "التاريخ",
  location: "الموقع",
  branch: "الفرع",
  numberOfWaiters: "عدد النادلين",
  driver: "السائق",
  status: "الحالة",
  loadingEvents: "جاري تحميل الفعاليات...",
  noUpcomingEvents: "لا توجد فعاليات قادمة تطابق البحث.",
  showingEvents: "عرض {{shown}} من أصل {{total}} فعالية",
  statuses: {
    confirmed: "مؤكد",
    in_progress: "قيد التنفيذ",
    upcoming: "قادمة",
    completed: "مكتملة",
    cancelled: "ملغاة"
  }
},

dashboardCharts: {
  eventStatus: "حالة العناصر",
  eventByStatus: "الفعاليات حسب الحالة",
  eventByBranch: "الفعاليات حسب الفرع",
  dataReturn: "مرتجع",
  damage: "تالف",
  missing: "مفقود",
  statuses: {
    confirmed: "مؤكد",
    in_progress: "قيد التنفيذ",
    upcoming: "قادمة",
    completed: "مكتملة",
    cancelled: "ملغاة"
  }
},

topbar: {
  searchAnything: "ابحث عن أي شيء...",
  openNotifications: "فتح الإشعارات",
  notifications: "الإشعارات",
  newNotifications: "{{count}} جديد",
  saving: "جاري الحفظ...",
  markAllRead: "تحديد الكل كمقروء",
  loadingNotifications: "جاري تحميل الإشعارات...",
  noNotifications: "لا توجد إشعارات حتى الآن.",
  changeProfileImage: "تغيير صورة الملف الشخصي",
  profile: "الملف الشخصي",
  chooseValidImage: "يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP.",
  imageTooLarge: "يجب ألا يزيد حجم صورة الملف الشخصي عن 5 ميجابايت.",
  couldNotUploadImage: "تعذر رفع صورة الملف الشخصي.",
  justNow: "الآن",
  minutesAgo: "منذ {{count}} دقيقة",
  hoursAgo: "منذ ساعة",
  hoursAgo_other: "منذ {{count}} ساعات",
  daysAgo: "منذ يوم",
  daysAgo_other: "منذ {{count}} أيام",
  notificationContent: {
    upcomingEvent: "فعالية قادمة",
    lowStockAlert: "تنبيه انخفاض المخزون",
    upcomingEventMessage: "{{event}} سيغادر الساعة {{time}} إلى {{destination}}.",
    lowStockMessage: "مخزون {{item}} منخفض في {{warehouse}}. المتاح: {{available}}، الحد الأدنى: {{minimum}}."
  }
},
branches: {
  cairo: "القاهرة",
  alex: "الإسكندرية",
},
items: {
  title: "قائمة الأصناف",
  subtitle: "إدارة جميع أصناف المخزون",
  addNewItem: "إضافة صنف جديد",
  editItem: "تعديل الصنف",
  updateItem: "تحديث الصنف",
  saveItem: "حفظ الصنف",
  saving: "جاري الحفظ...",
  cancel: "إلغاء",
  close: "إغلاق",
  edit: "تعديل",
  delete: "حذف",
  searchItems: "ابحث في الأصناف...",
  allWarehouses: "جميع المخازن",
  loadingItems: "جاري تحميل الأصناف...",
  noItemsMatch: "لا توجد أصناف تطابق البحث.",
  showingItems: "عرض {{shown}} من أصل {{total}} صنف",
  previousPage: "الصفحة السابقة",
  nextPage: "الصفحة التالية",

  stats: {
    totalItems: "إجمالي الأصناف",
    allInventoryItems: "جميع أصناف المخزون",
    availableItems: "الأصناف المتاحة",
    availableQuantity: "الكمية المتاحة",
    reservedItems: "الأصناف المحجوزة",
    reservedQuantity: "الكمية المحجوزة",
    lowStockItems: "أصناف منخفضة المخزون",
    needRestock: "تحتاج لإعادة التخزين"
  },

  table: {
    item: "الصنف",
    category: "الفئة",
    unit: "الوحدة",
    warehouse: "المخزن",
    available: "المتاح",
    minimumStock: "الحد الأدنى للمخزون",
    actions: "الإجراءات"
  },

  form: {
    itemMaster: "بيانات الصنف",
    basicInfo: "أضف المعلومات الأساسية للصنف.",
    itemCode: "كود الصنف",
    itemName: "اسم الصنف",
    itemNamePlaceholder: "طبق عشاء 28 سم",
    category: "الفئة",
    selectCategory: "اختر الفئة",
    unit: "الوحدة",
    itemType: "نوع الصنف",
    purchaseCost: "تكلفة الشراء",
    supplier: "المورد",
    selectSupplier: "اختر المورد",
    locationWarehouse: "الموقع / المخزن",
    selectWarehouse: "اختر المخزن",
    minimumStock: "الحد الأدنى للمخزون",
    quantity: "الكمية",
    quantityPlaceholder: "أدخل كمية الصنف",
    picturesForItem: "صور الصنف",
    uploadItemPictures: "ارفع صور الصنف.",
    uploadPictures: "رفع الصور",
    updateItemInfo: "حدّث معلومات الصنف.",
    enterItemInfo: "أدخل معلومات الصنف."
  },

  units: {
    piece: "قطعة",
    set: "طقم",
    box: "صندوق",
    pack: "عبوة",
    dozen: "دستة",
    kilogram: "كيلوجرام",
    liter: "لتر"
  },

  itemTypes: {
    reusable: "قابل لإعادة الاستخدام",
    consumable: "استهلاكي"
  },

  categories: {
    manageCategories: "إدارة الفئات",
    subtitle: "إضافة أو تعديل أو حذف فئات الأصناف.",
    closeManager: "إغلاق إدارة الفئات",
    editCategory: "تعديل الفئة",
    newCategory: "فئة جديدة",
    examplePlaceholder: "مثال: أطباق",
    cancelEdit: "إلغاء التعديل",
    saveChanges: "حفظ التغييرات",
    addCategory: "إضافة فئة",
    noCategories: "لا توجد فئات."
  },

  confirm: {
    deleteCategory: "هل أنت متأكد من حذف {{name}}؟",
    deleteItem: "هل أنت متأكد من حذف {{name}}؟"
  },

  errors: {
    permissionDenied: "غير مسموح",
    unableToLoadItems: "تعذر تحميل الأصناف.",
    noManageCategoriesPermission: "ليس لديك صلاحية لإدارة فئات الأصناف.",
    noEditCategoriesPermission: "ليس لديك صلاحية لتعديل فئات الأصناف.",
    noAddCategoriesPermission: "ليس لديك صلاحية لإضافة فئات الأصناف.",
    noDeleteCategoriesPermission: "ليس لديك صلاحية لحذف فئات الأصناف.",
    enterCategoryName: "يرجى إدخال اسم الفئة.",
    categoryExists: "هذه الفئة موجودة بالفعل.",
    unableToSaveCategory: "تعذر حفظ الفئة.",
    categoryInUse: "هذه الفئة مستخدمة في صنف واحد أو أكثر ولا يمكن حذفها.",
    unableToDeleteCategory: "تعذر حذف الفئة.",
    noAddItemsPermission: "ليس لديك صلاحية لإضافة أصناف.",
    noEditItemsPermission: "ليس لديك صلاحية لتعديل الأصناف.",
    noDeleteItemsPermission: "ليس لديك صلاحية لحذف الأصناف.",
    warehouseCapacityExceeded: "تم تجاوز سعة المخزن",
    warehouseCapacityMessage: "لا توجد سعة كافية في {{warehouse}}. يمكن إضافة {{count}} صنف فقط.",
    completeAllFields: "يرجى إكمال جميع بيانات الصنف.",
    noNegativeValues: "لا يمكن أن تكون قيم التكلفة أو المخزون أو الكمية سالبة.",
    itemCodeExists: "كود الصنف موجود بالفعل.",
    unableToValidateCapacity: "تعذر التحقق من سعة المخزن.",
    unableToSaveItem: "تعذر حفظ الصنف.",
    unableToDeleteItem: "تعذر حذف هذا الصنف. قد يكون مستخدمًا في سجل آخر."
  },

  aria: {
    editItem: "تعديل {{name}}",
    moreActions: "إجراءات إضافية لـ {{name}}",
    itemPreview: "معاينة صورة الصنف {{number}}",
    editCategory: "تعديل {{name}}",
    deleteCategory: "حذف {{name}}"
  }
},
warehouses: {
  alex_warehouse: "مخزن الإسكندرية",
  cairo_warehouse: "مخزن القاهرة",
},
warehousePage: {
  title: "المخازن",
  subtitle: "إدارة جميع المخازن",
  addNewWarehouse: "إضافة مخزن جديد",
  allWarehouses: "جميع المخازن",
  tableSubtitle: "عرض سعة المخازن والاستخدام",
  searchPlaceholder: "ابحث في المخازن...",
  allBranches: "جميع الفروع",
  loading: "جاري تحميل المخازن...",
  noResults: "لا توجد مخازن تطابق البحث.",
  items: "صنف",
  used: "مستخدم",

  table: {
    warehouseName: "اسم المخزن",
    branch: "الفرع",
    location: "الموقع",
    totalCapacity: "السعة الإجمالية",
    availableCapacity: "السعة المتاحة",
    usage: "الاستخدام",
    actions: "الإجراءات"
  },

  actions: {
    edit: "تعديل",
    delete: "حذف"
  },

  pagination: {
    showing: "عرض",
    of: "من أصل",
    warehouses: "مخزن"
  },

  modal: {
    editWarehouse: "تعديل المخزن",
    addWarehouse: "إضافة مخزن جديد",
    description: "أدخل بيانات المخزن.",
    closeForm: "إغلاق النموذج",
    warehouseName: "اسم المخزن",
    namePlaceholder: "مخزن القاهرة",
    branch: "الفرع",
    location: "الموقع",
    locationPlaceholder: "القاهرة الجديدة، القاهرة",
    totalCapacity: "السعة الإجمالية",
    capacityNote: "يتم حساب السعة المستخدمة والمتاحة تلقائيًا من المخزون.",
    cancel: "إلغاء",
    saving: "جاري الحفظ...",
    saveChanges: "حفظ التغييرات",
    saveWarehouse: "حفظ المخزن"
  },

  confirm: {
    deleteWarehouse: "هل أنت متأكد من حذف هذا المخزن؟"
  },

  errors: {
    permissionDenied: "غير مسموح",
    couldNotLoad: "تعذر تحميل المخازن.",
    noAddPermission: "ليس لديك صلاحية لإضافة مخازن.",
    noEditPermission: "ليس لديك صلاحية لتعديل المخازن.",
    noDeletePermission: "ليس لديك صلاحية لحذف المخازن.",
    completeAllFields: "يرجى إكمال جميع بيانات المخزن.",
    capacityGreaterThanZero: "يجب أن تكون السعة الإجمالية أكبر من صفر.",
    capacityBelowUsed: "لا يمكن أن تكون السعة الإجمالية أقل من السعة المستخدمة حاليًا.",
    nameExists: "يوجد مخزن بهذا الاسم بالفعل.",
    couldNotSave: "تعذر حفظ المخزن.",
    containsInventory: "لا يمكن حذف مخزن يحتوي على مخزون.",
    connectedRecords: "لا يمكن حذف هذا المخزن لأنه مرتبط بفعاليات أو مشتريات أو عمليات توزيع أو إعدادات الشركة.",
    couldNotDelete: "تعذر حذف المخزن."
  },

  aria: {
    editWarehouse: "تعديل {{name}}",
    moreActions: "إجراءات إضافية لـ {{name}}"
  }
},
purchase: {
  title: "المشتريات",
  subtitle: "إدارة طلبات الشراء والموافقات والمخزون المستلم",
  newRequest: "طلب شراء جديد",
  search: "ابحث في طلبات الشراء...",
  allWarehouses: "جميع المخازن",
  allStatuses: "جميع الحالات",
  loading: "جاري تحميل طلبات الشراء...",
  noMatches: "لا توجد طلبات شراء تطابق البحث.",
  saving: "جاري الحفظ...",
  showingOrders: "عرض {{from}}-{{to}} من أصل {{total}} طلب شراء",

  stats: {
    totalOrders: "إجمالي طلبات الشراء",
    allOrders: "جميع الطلبات",
    pendingApproval: "بانتظار الموافقة",
    purchaseRequests: "طلبات الشراء",
    itemsReceived: "الأصناف المستلمة",
    inventoryUpdated: "تم تحديث المخزون",
    totalSpent: "إجمالي المصروفات",
    egpReceivedOrders: "جنيه للطلبات المستلمة"
  },

  statuses: {
    pending: "قيد الانتظار",
    approved: "تمت الموافقة",
    received: "تم الاستلام",
    cancelled: "ملغى"
  },

  table: {
    poNumber: "رقم أمر الشراء",
    supplier: "المورد",
    orderDate: "تاريخ الطلب",
    expectedDate: "التاريخ المتوقع",
    warehouse: "المخزن",
    items: "الأصناف",
    totalQuantity: "إجمالي الكمية",
    totalAmount: "إجمالي المبلغ",
    status: "الحالة",
    actions: "الإجراءات"
  },

  actions: {
    approve: "موافقة",
    receiveItems: "استلام الأصناف",
    edit: "تعديل",
    cancel: "إلغاء",
    delete: "حذف"
  },

  modal: {
    editOrder: "تعديل أمر الشراء",
    enterSupplierInfo: "أدخل الأصناف المطلوبة وبيانات المورد.",
    closeForm: "إغلاق النموذج",
    supplier: "المورد",
    selectSupplier: "اختر المورد",
    warehouse: "المخزن",
    selectWarehouse: "اختر المخزن",
    orderDate: "تاريخ الطلب",
    expectedDate: "التاريخ المتوقع",
    itemsQuantities: "الأصناف والكميات",
    addItemsHelp: "أضف صنفًا واحدًا أو أكثر إلى أمر الشراء.",
    addItem: "إضافة صنف",
    item: "الصنف",
    selectItem: "اختر الصنف",
    quantity: "الكمية",
    unitCost: "تكلفة الوحدة",
    removeItem: "إزالة الصنف",
    estimatedTotal: "الإجمالي التقديري:",
    updateOrder: "تحديث الطلب",
    createRequest: "إنشاء الطلب"
  },

  receive: {
    title: "استلام الأصناف",
    subtitle: "أكد الأصناف المستلمة لتحديث المخزون.",
    note: "سيتم تحديث المخزون بعد تأكيد الاستلام.",
    receiving: "جاري الاستلام..."
  },

  confirm: {
    cancel: "هل أنت متأكد من إلغاء أمر الشراء؟",
    delete: "هل أنت متأكد من حذف أمر الشراء؟"
  },

  errors: {
    permissionDenied: "غير مسموح",
    couldNotLoad: "تعذر تحميل طلبات الشراء.",
    noAddPermission: "ليس لديك صلاحية لإضافة مشتريات.",
    noEditPermission: "ليس لديك صلاحية لتعديل المشتريات.",
    completeAllFields: "يرجى إكمال جميع بيانات الشراء.",
    addAtLeastOneItem: "يرجى إضافة صنف واحد على الأقل.",
    invalidItem: "أكمل بيانات كل صنف. يجب أن تكون الكمية أكبر من صفر ولا يمكن أن تكون تكلفة الوحدة سالبة.",
    duplicateItem: "لا يمكن إضافة نفس الصنف أكثر من مرة.",
    expectedDateBeforeOrder: "لا يمكن أن يكون التاريخ المتوقع قبل تاريخ الطلب.",
    couldNotSave: "تعذر حفظ أمر الشراء.",
    noApprovePermission: "ليس لديك صلاحية للموافقة على المشتريات.",
    couldNotApprove: "تعذر اعتماد أمر الشراء.",
    noReceivePermission: "ليس لديك صلاحية لاستلام المشتريات.",
    couldNotReceive: "تعذر استلام أصناف الشراء.",
    noCancelPermission: "ليس لديك صلاحية لإلغاء المشتريات.",
    couldNotCancel: "تعذر إلغاء أمر الشراء.",
    noDeletePermission: "ليس لديك صلاحية لحذف المشتريات.",
    couldNotDelete: "تعذر حذف أمر الشراء.",
    receiveCapacity: "لا توجد سعة كافية في {{warehouse}}. يمكن استلام {{count}} صنف فقط."
  },

  aria: {
    editOrder: "تعديل {{number}}",
    moreActions: "إجراءات إضافية لـ {{number}}"
  }
},
warehouses: {
  alex_warehouse: "مخزن الإسكندرية",
  cairo_warehouse: "مخزن القاهرة"
},
dispatchPage: {
  title: "التوزيع",
  subtitle: "إدارة عمليات توزيع الفعاليات",
  addNewDispatch: "إضافة عملية توزيع جديدة",
  searchPlaceholder: "ابحث في عمليات التوزيع...",
  loading: "جاري تحميل عمليات التوزيع...",
  noResults: "لا توجد عمليات توزيع تطابق البحث.",
  itemTypes: "أنواع أصناف",
  totalQty: "إجمالي الكمية",
  available: "متاح",

  tabs: {
    "All Dispatches": "جميع عمليات التوزيع",
    "Prepared": "تم التجهيز",
    "In Transit": "قيد التوصيل",
    "Delivered": "تم التسليم",
    "Cancelled": "ملغاة"
  },

  statuses: {
    "Prepared": "تم التجهيز",
    "In Transit": "قيد التوصيل",
    "Delivered": "تم التسليم",
    "Cancelled": "ملغاة"
  },

  table: {
    dispatchId: "رقم التوزيع",
    eventReference: "مرجع الفعالية",
    fromWarehouse: "من المخزن",
    destination: "الوجهة",
    driver: "السائق",
    dateTime: "التاريخ والوقت",
    items: "الأصناف",
    status: "الحالة",
    actions: "الإجراءات"
  },

  actions: {
    startDispatch: "بدء التوزيع",
    markDelivered: "تأكيد التسليم",
    edit: "تعديل",
    cancel: "إلغاء",
    delete: "حذف",
    saving: "جاري الحفظ...",
    saveChanges: "حفظ التغييرات",
    saveDispatch: "حفظ التوزيع"
  },

  pagination: {
    showing: "عرض",
    to: "إلى",
    of: "من أصل",
    dispatches: "عملية توزيع",
    previousPage: "الصفحة السابقة",
    nextPage: "الصفحة التالية"
  },

  modal: {
    editDispatch: "تعديل عملية التوزيع",
    addDispatch: "إضافة عملية توزيع جديدة",
    description: "أدخل بيانات الفعالية والوجهة والأصناف.",
    eventReference: "مرجع الفعالية",
    selectEvent: "اختر الفعالية",
    fromWarehouse: "من المخزن",
    selectWarehouse: "اختر المخزن",
    destinationVenue: "الوجهة / المكان",
    area: "المنطقة",
    dispatchDate: "تاريخ التوزيع",
    dispatchTime: "وقت التوزيع",
    itemsQuantities: "الأصناف والكميات",
    itemsHelp: "أضف الأصناف التي ستخرج من المخزن المحدد.",
    addItem: "إضافة صنف",
    item: "الصنف",
    loadingItems: "جاري تحميل الأصناف...",
    selectItem: "اختر الصنف",
    quantity: "الكمية",
    preparedNote: "تبدأ عمليات التوزيع الجديدة تلقائيًا بحالة تم التجهيز."
  },

  confirm: {
    cancelDispatch: "هل أنت متأكد من إلغاء عملية التوزيع هذه؟",
    deleteDispatch: "هل أنت متأكد من حذف عملية التوزيع هذه؟"
  },

  errors: {
    permissionDenied: "غير مسموح",
    couldNotLoad: "تعذر تحميل عمليات التوزيع.",
    couldNotLoadWarehouseItems: "تعذر تحميل أصناف المخزن.",
    noAddPermission: "ليس لديك صلاحية لإضافة عمليات توزيع.",
    noEditPermission: "ليس لديك صلاحية لتعديل عمليات التوزيع.",
    noDeletePermission: "ليس لديك صلاحية لحذف عمليات التوزيع.",
    completeAllFields: "يرجى إكمال جميع بيانات التوزيع.",
    addAtLeastOneItem: "يرجى إضافة صنف واحد على الأقل بكمية صحيحة.",
    duplicateItem: "لا يمكن إضافة نفس الصنف أكثر من مرة.",
    exceedsStock: "كمية صنف واحد أو أكثر تتجاوز المخزون المتاح.",
    couldNotSave: "تعذر حفظ عملية التوزيع.",
    couldNotUpdateStatus: "تعذر تحديث حالة التوزيع.",
    connectedReturn: "لا يمكن حذف عملية التوزيع هذه لأنها مرتبطة بعملية مرتجع.",
    couldNotDelete: "تعذر حذف عملية التوزيع."
  }
},
returnsPage: {
  title: "المرتجعات", subtitle: "تسجيل الكميات المرتجعة والتالفة والمفقودة", receiveReturn: "استلام مرتجع", searchPlaceholder: "ابحث في المرتجعات...", loading: "جاري تحميل المرتجعات...", noResults: "لا توجد مرتجعات تطابق البحث.",
  tabs: { "All Returns":"جميع المرتجعات", "Has Damage":"بها تالف", "Has Missing":"بها مفقود" },
  table: { returnId:"رقم المرتجع", eventReference:"مرجع الفعالية", warehouse:"المخزن", returnDate:"تاريخ المرتجع", receivedBy:"تم الاستلام بواسطة", totalSent:"إجمالي المرسل", returned:"المرتجع", damaged:"التالف", missing:"المفقود", actions:"الإجراءات" },
  actions: { delete:"حذف", cancel:"إلغاء", saving:"جاري الحفظ...", updateReturn:"تحديث المرتجع", completeReturn:"إكمال المرتجع" },
  pagination: { showing:"عرض", of:"من أصل", returns:"مرتجع" },
  modal: { editReturn:"تعديل المرتجع", receiveReturn:"استلام مرتجع", updateDescription:"تحديث الكميات المرتجعة والتالفة والمفقودة.", description:"تسجيل الكميات المرتجعة والتالفة والمفقودة.", dispatchReference:"مرجع التوزيع", selectDeliveredDispatch:"اختر عملية توزيع تم تسليمها", noDeliveredDispatch:"لا توجد حاليًا عملية توزيع تم تسليمها وتنتظر الإرجاع.", returnDate:"تاريخ المرتجع", eventReference:"مرجع الفعالية", returnWarehouse:"مخزن الإرجاع", receivedBy:"تم الاستلام بواسطة", employeeName:"اسم الموظف", notes:"ملاحظات", optionalNotes:"ملاحظات اختيارية", returnedItems:"الأصناف المرتجعة", itemsHelp:"يجب أن يساوي مجموع المرتجع + التالف + المفقود الكمية المرسلة لكل صنف.", item:"الصنف", sent:"المرسل", returned:"المرتجع", damaged:"التالف", missing:"المفقود", totalSent:"إجمالي المرسل" },
  confirm: { deleteReturn:"هل أنت متأكد من حذف سجل المرتجع؟ سيتم عكس كميات المخزون." },
  errors: { permissionDenied:"غير مسموح", couldNotLoad:"تعذر تحميل المرتجعات.", noAddPermission:"ليس لديك صلاحية لاستلام المرتجعات.", noEditPermission:"ليس لديك صلاحية لتعديل المرتجعات.", noDeletePermission:"ليس لديك صلاحية لحذف المرتجعات.", completeInfo:"يرجى إكمال بيانات المرتجع.", noItems:"عملية التوزيع المحددة لا تحتوي على أصناف.", quantitiesMustMatch:"لكل صنف: يجب أن يساوي المرتجع + التالف + المفقود الكمية المرسلة.", alreadyExists:"يوجد مرتجع بالفعل لعملية التوزيع هذه.", couldNotComplete:"تعذر إكمال المرتجع.", couldNotDelete:"تعذر حذف سجل المرتجع." },
  aria: { edit:"تعديل {{code}}", moreActions:"إجراءات إضافية لـ {{code}}" }
},
staffPage: {
  title: "إدارة الموظفين", subtitle: "إدارة السائقين والنادلين ومستنداتهم", egp: "جنيه",
  tabs: { drivers: "السائقون", waiters: "النادلون", payments: "المدفوعات" },
  search: { drivers: "ابحث في السائقين...", waiters: "ابحث في النادلين...", payments: "ابحث في المدفوعات..." },
  status: { all: "جميع الحالات", pending: "قيد الانتظار", partial: "مدفوع جزئيًا", paid: "مدفوع", active: "نشط", inactive: "غير نشط", suspended: "موقوف" },
  loadingDrivers: "جاري تحميل السائقين...", loadingWaiters: "جاري تحميل النادلين...", loadingPayments: "جاري تحميل المدفوعات...",
  table: { driver:"السائق", waiter:"النادل", staff:"الموظف", phone:"الهاتف", nationalId:"الرقم القومي", license:"الرخصة", licenseExpiry:"انتهاء الرخصة", carNumber:"رقم السيارة", carType:"نوع السيارة", role:"الدور", reportsTo:"يتبع", eventRate:"أجر الفعالية", status:"الحالة", actions:"الإجراءات", healthExpiry:"انتهاء الشهادة الصحية", contractEnd:"نهاية العقد", documents:"المستندات", payTo:"الدفع إلى", type:"النوع", event:"الفعالية", date:"التاريخ", amount:"المبلغ", totalAmount:"إجمالي المبلغ", paid:"المدفوع", remaining:"المتبقي", payment:"الدفع", action:"الإجراء", name:"الاسم", attendance:"الحضور", paymentTo:"الدفع إلى", eventAmount:"مبلغ الفعالية" },
  actions: { delete:"حذف", cancel:"إلغاء", saving:"جاري الحفظ...", saveChanges:"حفظ التغييرات", markAsPaid:"تحديد كمدفوع" },
  payments: { pendingPayments:"المدفوعات المعلقة", calculatedPerEvent:"يتم حساب المدفوعات لكل فعالية مكتملة.", noResults:"لا توجد مدفوعات تطابق البحث.", summaryAllCompleted:"ملخص المدفوعات لجميع الفعاليات المكتملة", amountPlaceholder:"المبلغ", pay:"دفع" },
  pagination: { showing:"عرض", of:"من أصل", drivers:"سائق", waiters:"نادل" },
  fields: { fullName:"الاسم بالكامل", phoneNumber:"رقم الهاتف", nationalId:"الرقم القومي", licenseNumber:"رقم الرخصة", carNumber:"رقم السيارة", licenseExpiryDate:"تاريخ انتهاء الرخصة", carType:"نوع السيارة", status:"الحالة", branch:"الفرع", selectBranch:"اختر الفرع", eventRate:"أجر الفعالية (جنيه)", driverRole:"دور السائق", waiterRole:"دور النادل", reportsTo:"يتبع", documents:"المستندات", healthCertificateExpiry:"انتهاء الشهادة الصحية", contractStartDate:"تاريخ بداية العقد", contractEndDate:"تاريخ نهاية العقد" },
  values: { driver:"سائق", headDriver:"رئيس السائقين", waiter:"نادل", headWaiter:"رئيس النادلين", noHeadDriver:"بدون رئيس سائقين", noHeadWaiter:"بدون رئيس نادلين", van:"فان", truck:"شاحنة", pickup:"بيك أب", refrigeratedTruck:"شاحنة مبردة", other:"أخرى", assigned:"مُعيّن" },
  documents: { personalPhoto:"الصورة الشخصية", nationalIdImage:"صورة الرقم القومي", licenseImage:"صورة الرخصة", healthCertificate:"الشهادة الصحية", contract:"العقد", uploadImage:"رفع صورة", uploadFile:"رفع ملف" },
  driverModal: { title:"تعديل السائق", subtitle:"أدخل بيانات السائق والمركبة." },
  waiterModal: { title:"تعديل النادل", subtitle:"أدخل بيانات النادل والمستندات." },
  eventDetails: { title:"تفاصيل مدفوعات الفعالية", subtitle:"تفاصيل الموظفين للفعالية", eventCode:"كود الفعالية", eventName:"اسم الفعالية", client:"العميل", date:"التاريخ", branch:"الفرع", location:"الموقع", startTime:"وقت البداية", endTime:"وقت النهاية", waitersDescription:"النادلون المعيّنون لهذه الفعالية وأجورهم المحفوظة.", driverDescription:"السائق المعيّن والمدفوعات المحفوظة لهذه الفعالية.", noWaiters:"لا يوجد نادلون معيّنون لهذه الفعالية.", noDriver:"لا يوجد سائق معيّن لهذه الفعالية.", waitersTotal:"إجمالي النادلين", driverTotal:"إجمالي السائق", totalStaffCost:"إجمالي تكلفة موظفي الفعالية" },
  confirm: { markPaid:"هل تريد تحديد دفعة {{name}} للفعالية {{eventCode}} كمدفوعة؟", deleteDriver:"هل أنت متأكد من حذف هذا السائق؟", deleteWaiter:"هل أنت متأكد من حذف هذا النادل؟" },
  errors: { permissionDenied:"غير مسموح", couldNotLoad:"تعذر تحميل الموظفين.", couldNotMarkPaid:"تعذر تحديد الدفعة كمدفوعة.", paymentAmountGreaterThanZero:"أدخل مبلغ دفع أكبر من صفر.", paymentExceedsRemaining:"لا يمكن أن يتجاوز مبلغ الدفع المبلغ المتبقي وهو {{amount}} {{currency}}.", couldNotRecordPayment:"تعذر تسجيل الدفعة.", noEditPermission:"ليس لديك صلاحية لتعديل الموظفين.", noDeletePermission:"ليس لديك صلاحية لحذف الموظفين.", completeDriver:"يرجى إكمال بيانات السائق.", driverDuplicate:"الرقم القومي أو رقم الرخصة موجود بالفعل.", couldNotSaveDriver:"تعذر حفظ السائق.", completeWaiter:"يرجى إكمال بيانات النادل.", waiterDuplicate:"الرقم القومي موجود بالفعل.", couldNotSaveWaiter:"تعذر حفظ النادل.", driverConnected:"هذا السائق مرتبط بفعاليات أو عمليات توزيع ولا يمكن حذفه.", couldNotDeleteDriver:"تعذر حذف السائق.", waiterConnected:"هذا النادل مرتبط بفعالية ولا يمكن حذفه.", couldNotDeleteWaiter:"تعذر حذف النادل." }
},


settingsPage: {
  title: "الإعدادات",
  subtitle: "إدارة الإعدادات العامة وصلاحيات المستخدمين",
  loading: "جاري تحميل الإعدادات...",
  tabs: { general: "الإعدادات العامة", permissions: "الصلاحيات وحقوق المستخدمين" },
  common: { saving: "جاري الحفظ...", saveChanges: "حفظ التغييرات", creating: "جاري الإنشاء...", cancel: "إلغاء" },
  general: { companyName: "اسم الشركة", phone: "رقم الهاتف", defaultWarehouse: "المخزن الافتراضي", selectWarehouse: "اختر المخزن", currency: "العملة", dateFormat: "تنسيق التاريخ" },
  permissions: { employees: "الموظفون", selectEmployee: "اختر موظفًا", searchEmployees: "ابحث عن موظف...", roles: "الأدوار", chooseRole: "اختر دورًا", searchRoles: "ابحث في الأدوار...", manageAccess: "إدارة كلمات مرور المستخدمين والوصول للحسابات", selectEmployeeOrRole: "اختر موظفًا أو دورًا", noRole: "بدون دور", selectRole: "اختر الدور", allPermissions: "جميع الصلاحيات", toggleAll: "تفعيل أو إلغاء جميع الصلاحيات", module: "القسم", view: "عرض", add: "إضافة", edit: "تعديل", delete: "حذف", selectedRole: "الدور المحدد", none: "لا يوجد", savePermissions: "حفظ الصلاحيات" },
  roleModal: { title: "إضافة دور جديد", subtitle: "إنشاء مسمى وظيفي جديد.", roleName: "اسم الدور", rolePlaceholder: "مشرف المخزون", description: "الوصف", descriptionPlaceholder: "اكتب وصف الدور", create: "إنشاء الدور" },
  userModal: { title: "إضافة مستخدم جديد", subtitle: "إنشاء بيانات تسجيل الدخول وتعيين دور.", accountInfo: "معلومات الحساب", fullName: "الاسم الكامل", fullNamePlaceholder: "الاسم الكامل", username: "اسم المستخدم", usernamePlaceholder: "اسم المستخدم", password: "كلمة المرور", passwordPlaceholder: "6 أحرف على الأقل", confirmPassword: "تأكيد كلمة المرور", repeatPassword: "أعد كتابة كلمة المرور", role: "الدور", branch: "الفرع" },
  staff: { driverInfo: "معلومات السائق", waiterInfo: "معلومات النادل", documents: "المستندات" },
  resetPassword: { title: "إعادة تعيين كلمة المرور", newPassword: "كلمة المرور الجديدة" },
  modules: { "Dashboard":"لوحة التحكم", "Events":"الفعاليات", "Items":"الأصناف", "Purchase":"المشتريات", "Suppliers":"الموردون", "Warehouse":"المخازن", "Staff":"الموظفون", "Dispatch":"التوزيع", "Returns":"المرتجعات", "Reports":"التقارير", "Settings":"الإعدادات", "Users / Role":"المستخدمون / الأدوار" },
  errors: { couldNotLoad:"تعذر تحميل الإعدادات.", noEditPermissions:"ليس لديك صلاحية لتعديل الصلاحيات.", selectRole:"يرجى اختيار دور.", couldNotSavePermissions:"تعذر حفظ الصلاحيات.", noAddRoles:"ليس لديك صلاحية لإضافة أدوار.", enterRoleName:"يرجى إدخال اسم الدور.", roleExists:"اسم الدور موجود بالفعل.", couldNotCreateRole:"تعذر إنشاء الدور.", noAddUsers:"ليس لديك صلاحية لإضافة مستخدمين.", completeUserFields:"يرجى استكمال جميع بيانات المستخدم.", usernameRules:"يجب أن يتكون اسم المستخدم من 3 إلى 30 حرفًا ويحتوي فقط على حروف إنجليزية صغيرة وأرقام ونقاط وشرطة سفلية أو شرطة.", passwordLength:"يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.", passwordMismatch:"كلمتا المرور غير متطابقتين.", roleUnavailable:"الدور المحدد لم يعد متاحًا. أغلقي النموذج واختاري الدور مرة أخرى.", completeDriver:"يرجى استكمال معلومات السائق.", completeWaiter:"يرجى استكمال معلومات النادل.", invalidRoleId:"معرّف الدور المحدد غير صالح.", couldNotCreateUser:"تعذر إنشاء المستخدم.", noDeleteRoles:"ليس لديك صلاحية لحذف الأدوار.", adminCannotDelete:"لا يمكن حذف دور المسؤول.", couldNotDeleteRole:"تعذر حذف الدور.", noAssignRoles:"ليس لديك صلاحية لتعيين الأدوار.", couldNotAssignRole:"تعذر تعيين الدور.", noResetPassword:"ليس لديك صلاحية لإعادة تعيين كلمات مرور المستخدمين.", selectUser:"يرجى اختيار مستخدم.", couldNotResetPassword:"تعذر إعادة تعيين كلمة المرور.", companyRequired:"يرجى إدخال اسم الشركة والبريد الإلكتروني.", couldNotSaveGeneral:"تعذر حفظ الإعدادات العامة." },
  success: { permissionsSaved:"تم حفظ الصلاحيات بنجاح.", userCreated:"تم إنشاء المستخدم بنجاح.", passwordReset:"تمت إعادة تعيين كلمة المرور بنجاح.", generalSaved:"تم حفظ الإعدادات العامة." },
  confirm: { deleteRole:"هل أنت متأكد من حذف هذا الدور؟" }
},

reportsPage: {
  title: "التقارير",
  subtitle: "تحليلات شاملة للمخزون والمشتريات والفعاليات والعمليات والموظفين.",
  currency: "جنيه",
  reportCenter: "مركز التقارير",
  reportCenterSubtitle: "اختر عرض الأعمال المطلوب وحدد نطاق النتائج.",
  insights: { eventActivity:"نشاط الفعاليات", upcomingEvents:"فعالية قادمة،", currentlyInProgress:"قيد التنفيذ حاليًا.", eventsCompletedAnd:"فعالية مكتملة و", cancelled:"ملغاة.", financialStockAttention:"تنبيهات المال والمخزون", pendingStaffPayments:"مدفوعات الموظفين المعلقة:", itemsNeedAttention:"صنفًا يحتاج إلى متابعة المخزون." },
  labels: { "Business Overview":"نظرة عامة على الأعمال", "Inventory":"المخزون", "Purchases":"المشتريات", "Events":"الفعاليات", "Dispatches":"عمليات التوزيع", "Returns & Recovery":"المرتجعات والاسترداد", "Staff Payments":"مدفوعات الموظفين", "Warehouse Performance":"أداء المخازن", "Metric":"المؤشر", "Value":"القيمة", "Inventory Value":"قيمة المخزون", "Purchase Spend":"إنفاق المشتريات", "Active Events":"الفعاليات النشطة", "Completed Events":"الفعاليات المكتملة", "Upcoming Events":"الفعاليات القادمة", "In Progress":"قيد التنفيذ", "Cancelled":"ملغى", "Stock Alerts":"تنبيهات المخزون", "Pending Staff":"مستحقات الموظفين", "Inventory Report":"تقرير المخزون", "Item Code":"كود الصنف", "Item":"الصنف", "Category":"الفئة", "Warehouses":"المخازن", "Available":"المتاح", "Damaged":"التالف", "Missing":"المفقود", "Minimum Stock":"الحد الأدنى للمخزون", "Stock Health":"حالة المخزون", "All Statuses":"جميع الحالات", "Healthy":"سليم", "Low Stock":"مخزون منخفض", "Out of Stock":"نفد المخزون", "Available Qty":"الكمية المتاحة", "Purchase Report":"تقرير المشتريات", "PO Number":"رقم أمر الشراء", "Supplier":"المورد", "Warehouse":"المخزن", "Item Types":"أنواع الأصناف", "Total Qty":"إجمالي الكمية", "Total Amount":"إجمالي المبلغ", "Order Date":"تاريخ الطلب", "Expected Date":"التاريخ المتوقع", "Status":"الحالة", "Pending":"قيد الانتظار", "Approved":"تمت الموافقة", "Received":"تم الاستلام", "Purchase Orders":"أوامر الشراء", "Total Spend":"إجمالي الإنفاق", "Total Quantity":"إجمالي الكمية", "Events Report":"تقرير الفعاليات", "Event":"الفعالية", "Event Type":"نوع الفعالية", "Client":"العميل", "Date":"التاريخ", "Branch":"الفرع", "Driver":"السائق", "Waiters":"النادلون", "Dispatch":"التوزيع", "Return":"المرتجع", "Staff Cost":"تكلفة الموظفين", "Upcoming":"قادمة", "Completed":"مكتملة", "Total Events":"إجمالي الفعاليات", "Total Staff Cost":"إجمالي تكلفة الموظفين", "Dispatch Report":"تقرير التوزيع", "Dispatch ID":"رقم التوزيع", "Time":"الوقت", "Prepared":"تم التجهيز", "In Transit":"قيد التوصيل", "Delivered":"تم التسليم", "Returns & Recovery Report":"تقرير المرتجعات والاسترداد", "Return ID":"رقم المرتجع", "Return Date":"تاريخ المرتجع", "Sent":"المرسل", "Good Returned":"المرتجع السليم", "Recovery %":"نسبة الاسترداد", "Loss %":"نسبة الفقد", "Risk":"المخاطر", "Clear":"سليم", "Partial Loss":"فقد جزئي", "High Loss":"فقد مرتفع", "Staff Payments Report":"تقرير مدفوعات الموظفين", "Staff":"الموظف", "Role":"الدور", "Type":"النوع", "Events Worked":"الفعاليات المنفذة", "Total Earned":"إجمالي المستحق", "Paid":"المدفوع", "Remaining":"المتبقي", "Partial":"مدفوع جزئيًا", "Warehouse Performance Report":"تقرير أداء المخازن", "Capacity":"السعة", "Used":"المستخدم", "Available Capacity":"السعة المتاحة", "Received Qty":"الكمية المستلمة", "Dispatched Qty":"الكمية الموزعة" },
  export: "تصدير",
  exportPdf: "تصدير بصيغة PDF",
  exportExcel: "تصدير بصيغة Excel",
  search: "ابحث في التقرير...",
  loading: "جاري تحميل بيانات التقرير...",
  noRecords: "لا توجد سجلات تطابق عوامل التصفية المحددة.",
  showingRange: "عرض {{from}} إلى {{to}} من أصل {{total}} سجل",
  types: { inventory:"تقرير المخزون", purchases:"تقرير المشتريات", dispatches:"تقرير التوزيع", returns:"تقرير المرتجعات" },
  filters: { title:"عوامل تصفية التقرير", subtitle:"اختر نوع التقرير وحدد النتائج.", reportType:"نوع التقرير", fromDate:"من تاريخ", toDate:"إلى تاريخ", warehouse:"المخزن", allWarehouses:"جميع المخازن", status:"الحالة", reset:"إعادة تعيين الفلاتر" },
  columns: { itemCode:"كود الصنف", item:"الصنف", category:"الفئة", warehouse:"المخزن", available:"المتاح", damaged:"التالف", missing:"المفقود", minimumStock:"الحد الأدنى للمخزون", stockLevel:"مستوى المخزون", poNumber:"رقم أمر الشراء", supplier:"المورد", quantity:"الكمية", totalAmount:"الإجمالي", orderDate:"تاريخ الطلب", status:"الحالة", dispatchId:"رقم التوزيع", eventReference:"مرجع الفعالية", destination:"الوجهة", driver:"السائق", date:"التاريخ", totalQuantity:"إجمالي الكمية", returnId:"رقم المرتجع", returnDate:"تاريخ المرتجع", receivedBy:"تم الاستلام بواسطة", totalSent:"إجمالي المرسل", returned:"المرتجع" },
  statuses: { "All Statuses":"جميع الحالات", "In Stock":"متوفر", "Low Stock":"مخزون منخفض", "Pending":"قيد الانتظار", "Approved":"تمت الموافقة", "Received":"تم الاستلام", "Cancelled":"ملغى", "Prepared":"تم التجهيز", "In Transit":"قيد التوصيل", "Delivered":"تم التوصيل", "Clear":"سليم", "Has Damage":"به تالف", "Has Missing":"به مفقود" },
  errors: { permissionDenied:"تم رفض الإذن", noExportPermission:"ليس لديك صلاحية لتصدير التقارير.", noDataExport:"لا توجد بيانات للتصدير.", couldNotLoad:"تعذر تحميل بيانات التقرير." }
},

suppliers: {
  title: "الموردون",
  subtitle: "إدارة بيانات التواصل الخاصة بالموردين",
  addNewSupplier: "إضافة مورد جديد",
  searchPlaceholder: "ابحث عن مورد...",

  tabs: {
    all: "جميع الموردين",
    active: "نشط",
    inactive: "غير نشط",
  },

  table: {
    supplier: "المورد",
    contactPerson: "مسؤول التواصل",
    phone: "رقم الهاتف",
    email: "البريد الإلكتروني",
    address: "العنوان",
    status: "الحالة",
    actions: "الإجراءات",
  },

  status: {
    active: "نشط",
    inactive: "غير نشط",
  },

  loading: "جاري تحميل الموردين...",
  noResults: "لا يوجد موردون يطابقون البحث.",

  actions: {
    activate: "تفعيل",
    deactivate: "إلغاء التفعيل",
    delete: "حذف",
    edit: "تعديل",
  },

  pagination: {
    showing: "عرض",
    of: "من أصل",
    suppliers: "مورد",
  },

  modal: {
    editSupplier: "تعديل المورد",
    addSupplier: "إضافة مورد جديد",
    description: "أدخل بيانات التواصل الخاصة بالمورد.",
    supplierName: "اسم المورد",
    contactPerson: "مسؤول التواصل",
    phoneNumber: "رقم الهاتف",
    email: "البريد الإلكتروني",
    address: "العنوان",
    status: "الحالة",
    supplierNamePlaceholder: "Royal Glass",
    contactPersonPlaceholder: "Ahmed Hassan",
    phonePlaceholder: "01012345678",
    emailPlaceholder: "info@supplier.com",
    addressPlaceholder: "عنوان المورد",
    cancel: "إلغاء",
    saving: "جاري الحفظ...",
    saveChanges: "حفظ التغييرات",
    saveSupplier: "حفظ المورد",
  },

  errors: {
    permissionDenied: "غير مسموح",
    couldNotLoad: "تعذر تحميل الموردين.",
    noAddPermission: "ليس لديك صلاحية لإضافة موردين.",
    noEditPermission: "ليس لديك صلاحية لتعديل الموردين.",
    noDeletePermission: "ليس لديك صلاحية لحذف الموردين.",
    completeAllFields: "يرجى إكمال جميع بيانات المورد.",
    couldNotSave: "تعذر حفظ المورد.",
    couldNotDelete: "تعذر حذف المورد.",
    couldNotUpdateStatus: "تعذر تحديث حالة المورد.",
  },

  confirm: {
    deleteSupplier: "هل أنت متأكد من حذف هذا المورد؟",
  },

  aria: {
    editSupplier: "تعديل {{name}}",
    moreActions: "إجراءات إضافية لـ {{name}}",
  },
},

    }
  }
};

const savedLanguage = localStorage.getItem("language") || "en";

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

const updateDirection = (language) => {
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
};

updateDirection(savedLanguage);

i18n.on("languageChanged", (language) => {
  localStorage.setItem("language", language);
  updateDirection(language);
});

export default i18n;
