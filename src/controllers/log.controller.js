import mongoose, { isValidObjectId } from "mongoose";
import { asynchandler } from "../utils/asynchandler.js";
import { Log } from "../models/log.model.js";

const getLog = asynchandler(async (req, res) => {
    const id = req.user?._id;
    
    if (!isValidObjectId(id)) {
        return res.status(401).json({ error: "Invalid ObjectId" });
    }

    const { date, startTime, endTime } = req.query;
    // console.log(startTime);

    const matchConditions = {
        userId: new mongoose.Types.ObjectId(id),
    };

    // Initialize timestamp filter
    const timestampFilter = {};

    // Filter by date
    if (date) {
        const dateStart = new Date(date);
        const dateEnd = new Date(date);
        dateEnd.setDate(dateEnd.getDate() + 1);

        timestampFilter.$gte = dateStart;
        timestampFilter.$lt = dateEnd;
    }

    if (startTime) {
        const start = new Date(`${date}T${startTime}:00.000Z`); // Adding seconds and milliseconds to ensure a complete time
        timestampFilter.$gte = timestampFilter.$gte ? new Date(Math.max(start, timestampFilter.$gte)) : start;
    }
    
    // Filter by end time (within the same date)
    if (endTime) {
        const end = new Date(`${date}T${endTime}:00.000Z`); // Adding seconds and milliseconds to ensure a complete time
        timestampFilter.$lt = timestampFilter.$lt ? new Date(Math.min(end, timestampFilter.$lt)) : end;
    }
    

    // Apply timestamp filter if any conditions are set
    if (Object.keys(timestampFilter).length > 0) {
        matchConditions.timestamp = timestampFilter;
    }
    // console.log(timestampFilter ,"br",matchConditions)
    try {
        const logs = await Log.aggregate([
            {
                $match: matchConditions, // Use the correct match conditions
            },
            {
                $project: {
                    logType: 1,
                    message: 1,
                    timestamp: 1,
                },
            },
            {
                $sort: { timestamp: -1 }, // Sort logs by timestamp (newest first)
            },
        ]);

        if (logs.length === 0) {
            return res.status(404).json({ error: "Logs not found" });
        }

        return res.status(200).json({ logs });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

export { getLog };
