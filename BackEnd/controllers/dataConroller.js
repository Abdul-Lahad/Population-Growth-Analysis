
import data from '../models/dataModel.js';

export const getData = async (req, res) => {
    try {
        const dataList = await data.find()
        if (!dataList || dataList.length === 0) {
            return res.status(404).json({ message: "No data found" });
        }
        res.status(200).json(dataList);
        console.log("response sent successfully")

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}