import fs from "fs";

const writeLog = (level, message) => {
  const timestamp = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const logEntry = `${timestamp} - ${level.toUpperCase()} : ${message}\n`;
  const logFile = `logs/${level}.txt`;

  if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs");
  }

  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.log(`Failed to write ${level} log:`, err);
    }
  });
};

export default writeLog;
  // const LOG_TYPE = "DEV";
  // const userId = 1;
  // const data = {
  //     list:[],
  //     message: "Data fect successfully",
  // }

  // const logger = new Logger("ApiKey");

  // logger.info(LOG_TYPE, {userId}, data)