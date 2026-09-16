export function mockUploadedFilesPersistence(t, table, { addReturnValue = 1, existingRecord = undefined } = {}) {
  const duplicateChecks = [];
  const savedRecords = [];

  t.mock.method(table, "where", (indexName) => ({
    equals(value) {
      duplicateChecks.push({ indexName, value });
      return {
        async first() {
          return existingRecord;
        },
      };
    },
  }));
  t.mock.method(table, "add", async (record) => {
    savedRecords.push(record);
    return addReturnValue;
  });

  return { duplicateChecks, savedRecords };
}
