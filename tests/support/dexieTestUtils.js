export function mockUploadedFilesLookup(t, table, { record = undefined } = {}) {
  const lookups = [];

  t.mock.method(table, "where", (indexName) => ({
    equals(value) {
      lookups.push({ indexName, value });
      return {
        async first() {
          return record;
        },
      };
    },
  }));

  return lookups;
}

export function mockUploadedFilesPersistence(t, table, { addReturnValue = 1, existingRecord = undefined } = {}) {
  const savedRecords = [];
  const duplicateChecks = mockUploadedFilesLookup(t, table, { record: existingRecord });

  t.mock.method(table, "add", async (record) => {
    savedRecords.push(record);
    return addReturnValue;
  });

  return { duplicateChecks, savedRecords };
}
