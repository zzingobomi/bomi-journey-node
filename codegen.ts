const { exec } = require("child_process");
const fs = require("fs");
require("dotenv").config();

const schemaSrc = process.env.SCHEMA_SRC;
const schemaDest = process.env.SCHEMA_DEST;
const sharedSrc = process.env.SHARED_SRC;
const sharedDest = process.env.SHARED_DEST;

// Colyseus Schema
fs.readdir(schemaSrc, (error, files) => {
  if (error) {
    console.error("Error reading schema files:", error);
    return;
  }

  console.log("Schema files:", files);

  files.forEach((filename) => {
    const command = `npx schema-codegen ${schemaSrc}/${filename} --ts --output ${schemaDest}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error generating schema for ${filename}:`, error);
      } else {
        console.log(`Schema generated for ${filename}`);
      }
    });
  });
});

// Shared
const copyCommand = `copy ${sharedSrc}\\*.ts ${sharedDest}`;
exec(copyCommand, (error, stdout, stderr) => {
  if (error) {
    console.error("Error copying shared files:", error);
  } else {
    console.log("Shared files copied successfully");
  }
});
