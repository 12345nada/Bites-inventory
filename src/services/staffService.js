import { supabase } from "../lib/supabase";
import {
  compressImage,
} from "../utils/imageCompression";

const STAFF_FIELDS = `
  id,
  staff_code,
  staff_type,
  full_name,
  phone,
  national_id,
  status,
  license_number,
  license_expiry_date,
  car_number,
  car_type,
  health_certificate_expiry,
  contract_start_date,
  contract_end_date,
  created_at,
  updated_at,
  staff_documents (
    id,
    document_type,
    file_path,
    expiry_date,
    created_at
  )
`;

const DOCUMENT_TYPE_MAP = {
  personalPhoto: "Personal Photo",
  nationalIdImage: "National ID Image",
  licenseImage: "License Image",
  healthCertificate: "Health Certificate",
  contract: "Contract",
};

const safeFileName = (fileName = "") =>
  fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");

const getDocumentByType = (
  documents = [],
  documentType
) =>
  documents.find(
    (document) =>
      document.document_type === documentType
  ) || null;

const mapDocument = (document) => {
  if (!document) {
    return null;
  }

  return {
    id: document.id,
    name:
      document.file_path
        ?.split("/")
        .pop() || "",
    filePath: document.file_path,
    expiryDate:
      document.expiry_date || "",
  };
};

export const mapStaffFromDatabase = (staff) => {
  const documents =
    staff.staff_documents || [];

  if (staff.staff_type === "Driver") {
    return {
      id: staff.id,
      staffCode:
        staff.staff_code ||
        `DRV-${String(staff.id).padStart(3, "0")}`,
      fullName: staff.full_name || "",
      phone: staff.phone || "",
      nationalId: staff.national_id || "",
      licenseNumber:
        staff.license_number || "",
      licenseExpiryDate:
        staff.license_expiry_date || "",
      carNumber: staff.car_number || "",
      carType: staff.car_type || "Van",
      status: staff.status || "Active",
      documents: {
        nationalIdImage: mapDocument(
          getDocumentByType(
            documents,
            "National ID Image"
          )
        ),
        licenseImage: mapDocument(
          getDocumentByType(
            documents,
            "License Image"
          )
        ),
      },
    };
  }

  return {
    id: staff.id,
    staffCode:
      staff.staff_code ||
      `WTR-${String(staff.id).padStart(3, "0")}`,
    fullName: staff.full_name || "",
    phone: staff.phone || "",
    nationalId: staff.national_id || "",
    status: staff.status || "Active",
    documents: {
      personalPhoto: mapDocument(
        getDocumentByType(
          documents,
          "Personal Photo"
        )
      ),
      nationalIdImage: mapDocument(
        getDocumentByType(
          documents,
          "National ID Image"
        )
      ),
      healthCertificate: {
        file: mapDocument(
          getDocumentByType(
            documents,
            "Health Certificate"
          )
        ),
        expiryDate:
          staff.health_certificate_expiry ||
          "",
      },
      contract: {
        file: mapDocument(
          getDocumentByType(
            documents,
            "Contract"
          )
        ),
        startDate:
          staff.contract_start_date || "",
        endDate:
          staff.contract_end_date || "",
      },
    },
  };
};

export async function getStaff() {
  const { data, error } = await supabase
    .from("staff")
    .select(STAFF_FIELDS)
    .in("staff_type", [
      "Driver",
      "Waiter",
    ])
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  const mapped = (data || []).map(
    mapStaffFromDatabase
  );

  return {
    drivers: mapped.filter(
      (record) =>
        record.staffCode?.startsWith(
          "DRV-"
        )
    ),
    waiters: mapped.filter(
      (record) =>
        record.staffCode?.startsWith(
          "WTR-"
        )
    ),
  };
}

async function uploadDocument(
  staffId,
  documentKey,
  file,
  expiryDate = null
) {
  if (!(file instanceof File)) {
    return null;
  }

  const documentType =
    DOCUMENT_TYPE_MAP[documentKey];

  const uploadFile =
    file.type.startsWith("image/")
      ? await compressImage(file)
      : file;

  const filePath = `${staffId}/${Date.now()}-${safeFileName(
    uploadFile.name
  )}`;

  const { error: uploadError } =
    await supabase.storage
      .from("staff-documents")
      .upload(filePath, uploadFile, {
        upsert: false,
        contentType: uploadFile.type,
      });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error } = await supabase
    .from("staff_documents")
    .upsert(
      {
        staff_id: staffId,
        document_type: documentType,
        file_path: filePath,
        expiry_date:
          expiryDate || null,
      },
      {
        onConflict:
          "staff_id,document_type",
      }
    )
    .select()
    .single();

  if (error) {
    await supabase.storage
      .from("staff-documents")
      .remove([filePath]);

    throw error;
  }

  return data;
}

async function uploadDriverDocuments(
  staffId,
  documents
) {
  const uploads = [];

  if (
    documents?.nationalIdImage?.file
  ) {
    uploads.push(
      uploadDocument(
        staffId,
        "nationalIdImage",
        documents.nationalIdImage.file
      )
    );
  }

  if (documents?.licenseImage?.file) {
    uploads.push(
      uploadDocument(
        staffId,
        "licenseImage",
        documents.licenseImage.file
      )
    );
  }

  await Promise.all(uploads);
}

async function uploadWaiterDocuments(
  staffId,
  documents
) {
  const uploads = [];

  if (
    documents?.personalPhoto?.file
  ) {
    uploads.push(
      uploadDocument(
        staffId,
        "personalPhoto",
        documents.personalPhoto.file
      )
    );
  }

  if (
    documents?.nationalIdImage?.file
  ) {
    uploads.push(
      uploadDocument(
        staffId,
        "nationalIdImage",
        documents.nationalIdImage.file
      )
    );
  }

  if (
    documents?.healthCertificate?.file
      ?.file
  ) {
    uploads.push(
      uploadDocument(
        staffId,
        "healthCertificate",
        documents.healthCertificate.file.file,
        documents.healthCertificate
          .expiryDate || null
      )
    );
  }

  if (
    documents?.contract?.file?.file
  ) {
    uploads.push(
      uploadDocument(
        staffId,
        "contract",
        documents.contract.file.file
      )
    );
  }

  await Promise.all(uploads);
}

export async function createDriver(
  driverData
) {
  const { data, error } = await supabase
    .from("staff")
    .insert({
      staff_type: "Driver",
      full_name:
        driverData.fullName.trim(),
      phone: driverData.phone.trim(),
      national_id:
        driverData.nationalId.trim(),
      status: driverData.status,
      license_number:
        driverData.licenseNumber.trim(),
      license_expiry_date:
        driverData.licenseExpiryDate,
      car_number:
        driverData.carNumber.trim(),
      car_type: driverData.carType,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  try {
    await uploadDriverDocuments(
      data.id,
      driverData.documents
    );
  } catch (uploadError) {
    await supabase
      .from("staff")
      .delete()
      .eq("id", data.id);

    throw uploadError;
  }

  return getStaffById(data.id);
}

export async function updateDriver(
  driverId,
  driverData
) {
  const { error } = await supabase
    .from("staff")
    .update({
      full_name:
        driverData.fullName.trim(),
      phone: driverData.phone.trim(),
      national_id:
        driverData.nationalId.trim(),
      status: driverData.status,
      license_number:
        driverData.licenseNumber.trim(),
      license_expiry_date:
        driverData.licenseExpiryDate,
      car_number:
        driverData.carNumber.trim(),
      car_type: driverData.carType,
    })
    .eq("id", driverId);

  if (error) {
    throw error;
  }

  await uploadDriverDocuments(
    driverId,
    driverData.documents
  );

  return getStaffById(driverId);
}

export async function createWaiter(
  waiterData
) {
  const { data, error } = await supabase
    .from("staff")
    .insert({
      staff_type: "Waiter",
      full_name:
        waiterData.fullName.trim(),
      phone: waiterData.phone.trim(),
      national_id:
        waiterData.nationalId.trim(),
      status: waiterData.status,
      health_certificate_expiry:
        waiterData.documents
          .healthCertificate.expiryDate ||
        null,
      contract_start_date:
        waiterData.documents.contract
          .startDate || null,
      contract_end_date:
        waiterData.documents.contract
          .endDate || null,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  try {
    await uploadWaiterDocuments(
      data.id,
      waiterData.documents
    );
  } catch (uploadError) {
    await supabase
      .from("staff")
      .delete()
      .eq("id", data.id);

    throw uploadError;
  }

  return getStaffById(data.id);
}

export async function updateWaiter(
  waiterId,
  waiterData
) {
  const { error } = await supabase
    .from("staff")
    .update({
      full_name:
        waiterData.fullName.trim(),
      phone: waiterData.phone.trim(),
      national_id:
        waiterData.nationalId.trim(),
      status: waiterData.status,
      health_certificate_expiry:
        waiterData.documents
          .healthCertificate.expiryDate ||
        null,
      contract_start_date:
        waiterData.documents.contract
          .startDate || null,
      contract_end_date:
        waiterData.documents.contract
          .endDate || null,
    })
    .eq("id", waiterId);

  if (error) {
    throw error;
  }

  await uploadWaiterDocuments(
    waiterId,
    waiterData.documents
  );

  return getStaffById(waiterId);
}

export async function deleteStaff(
  staffId
) {
  const { data: documents } =
    await supabase
      .from("staff_documents")
      .select("file_path")
      .eq("staff_id", staffId);

  const { error } = await supabase
    .from("staff")
    .delete()
    .eq("id", staffId);

  if (error) {
    throw error;
  }

  const filePaths = (documents || [])
    .map((document) =>
      document.file_path
    )
    .filter(Boolean);

  if (filePaths.length > 0) {
    await supabase.storage
      .from("staff-documents")
      .remove(filePaths);
  }

  return true;
}

async function getStaffById(staffId) {
  const { data, error } = await supabase
    .from("staff")
    .select(STAFF_FIELDS)
    .eq("id", staffId)
    .single();

  if (error) {
    throw error;
  }

  return mapStaffFromDatabase(data);
}
