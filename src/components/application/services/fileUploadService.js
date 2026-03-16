const MAX_FAILURE_DETAILS = 3;
const UNKNOWN_FILE_NAME = "unknown file";
export const INVALID_FILE_INPUT_MESSAGE = "The input is not a valid file";

function normalizeErrorMessage(error) {
  if (error?.message) return error.message;
  if (typeof error === "string") return error;
  return "Unexpected upload error";
}

function formatFailureDetails(failedUploads) {
  const details = failedUploads
    .slice(0, MAX_FAILURE_DETAILS)
    .map((failure) => `${failure.fileName}: ${failure.errorMessage}`)
    .join("; ");
  const hiddenFailureCount = failedUploads.length - MAX_FAILURE_DETAILS;

  if (hiddenFailureCount > 0) return `${details}; and ${hiddenFailureCount} more`;
  return details;
}

export function toFileArray(files) {
  if (!files) return [];
  if (Array.isArray(files)) return files.filter(Boolean);
  return Array.from(files).filter(Boolean);
}

export function mergeUniqueNames(existingNames = [], addedNames = []) {
  return [...new Set([...(existingNames || []), ...addedNames])];
}

export async function uploadFileBatch(files, uploadSingleFile) {
  const uploadedItems = [];
  const failedUploads = [];

  for (const file of files) {
    try {
      const uploadedItem = await uploadSingleFile(file);
      uploadedItems.push(uploadedItem);
    } catch (error) {
      failedUploads.push({
        fileName: file?.name || UNKNOWN_FILE_NAME,
        errorMessage: normalizeErrorMessage(error),
      });
    }
  }

  return { uploadedItems, failedUploads };
}

export function createBatchUploadErrorMessage({ entityLabel, totalFiles, uploadedFiles, failedUploads }) {
  if (!failedUploads.length) return null;

  const failureDetails = formatFailureDetails(failedUploads);
  if (uploadedFiles === 0) {
    return `Failed to upload selected ${entityLabel} file(s): ${failureDetails}`;
  }

  return `Uploaded ${uploadedFiles} of ${totalFiles} ${entityLabel} file(s). Failed: ${failureDetails}`;
}

function logFailedUploads(log, entityLabel, failedUploads) {
  failedUploads.forEach((failure) => {
    log.error(`Failed to upload ${entityLabel} file '${failure.fileName}': ${failure.errorMessage}`);
  });
}

export async function processNamedFileUpload({
  files,
  entityLabel,
  uploadSingleFile,
  getExistingNames,
  setMergedNames,
  log,
  setError,
  startLogMessage = `Adding new ${entityLabel} file(s)`,
}) {
  const selectedFiles = toFileArray(files);
  if (!selectedFiles.length) {
    setError(INVALID_FILE_INPUT_MESSAGE);
    log.error(INVALID_FILE_INPUT_MESSAGE);
    return;
  }

  log.info(startLogMessage);
  const { uploadedItems, failedUploads } = await uploadFileBatch(selectedFiles, uploadSingleFile);
  const uploadedNames = uploadedItems.map((item) => item?.name).filter(Boolean);

  if (uploadedNames.length) {
    setMergedNames(mergeUniqueNames(getExistingNames(), uploadedNames));
  }
  if (failedUploads.length) {
    logFailedUploads(log, entityLabel, failedUploads);
    setError(
      createBatchUploadErrorMessage({
        entityLabel,
        totalFiles: selectedFiles.length,
        uploadedFiles: uploadedItems.length,
        failedUploads,
      })
    );
  }
}
