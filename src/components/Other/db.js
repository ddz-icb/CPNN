import log from "../../logger";
import Dexie from "dexie";

export const db = new Dexie("myDatabase");

db.version(1).stores({
  uploadedFiles: "++id, name",
});

export async function addUploadedFileDB(file) {
  try {
    const id = await db.uploadedFiles.add({
      name: file.name,
      content: file.content,
    });

    log.info(`File ${file.name} successfully added. Got id ${id}`);
  } catch (error) {
    log.error(`Failed to add ${file.name}: ${error}`);
  }
}

export async function removeUploadedFileDB(id) {
  try {
    await db.uploadedFiles.delete(id);
    log.info(`File with id ${id} successfully removed.`);
  } catch (error) {
    log.error(`Failed to remove file with id ${id}: ${error}`);
  }
}

export async function removeUploadedFileByNameDB(name) {
  try {
    const file = await db.uploadedFiles.where("name").equals(name).first();
    if (file) {
      await db.uploadedFiles.delete(file.id);
      log.info(`File with name ${name} and id ${file.id} successfully removed.`);
    } else {
      log.info(`No file found with the name ${name}.`);
    }
  } catch (error) {
    log.error(`Failed to remove file with name ${name}: ${error}`);
  }
}

export async function fromAllGetNameDB() {
  try {
    const names = [];
    await db.uploadedFiles.toCollection().each((file) => {
      if (file.name) {
        names.push(file.name);
      }
    });
    return names;
  } catch (error) {
    log.error(`Failed to retrieve file names: ${error}`);
    return [];
  }
}

export async function getByNameDB(name) {
  try {
    const file = await db.uploadedFiles.where("name").equals(name).first();
    if (file) {
      return file;
    } else {
      log.info(`No file found with the name ${name}.`);
      return null;
    }
  } catch (error) {
    log.error(`Failed to retrieve file with name ${name}: ${error}`);
    return null;
  }
}
