export function createTextFile(name, content, type = "text/plain") {
  if (typeof File === "function") {
    return new File([content], name, { type });
  }

  return {
    name,
    async text() {
      return content;
    },
  };
}

export function installFileReaderMock() {
  const originalFileReader = globalThis.FileReader;

  globalThis.FileReader = class TestFileReader {
    async readAsText(file) {
      try {
        const result = typeof file?.text === "function" ? await file.text() : "";
        this.onload?.({ target: { result } });
      } catch (error) {
        this.error = error;
        this.onerror?.({ target: this });
      }
    }
  };

  return () => {
    if (originalFileReader === undefined) {
      delete globalThis.FileReader;
      return;
    }
    globalThis.FileReader = originalFileReader;
  };
}
