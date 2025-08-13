export const getFileNameWithoutExtension = (filename) => filename.replace(/\.[^/.]+$/, "");

export function parseFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.readAsText(file);
  });
}
