import mongoose from "mongoose";

const dataSchema = new mongoose.Schema({
    
    Rank: {
        type: Number,
        required: true,
    },
    City: {
        type: String,
        required: true,
    },
    
    Population_2017_Census: {
        type: Number,
        required: true,
    },
    Population_1998_Census: {
        type: Number,
        required: true,
    },
    Change: {
        type: Number,
        required: true,
    },
    Province: {
        type: String,
        required: true,
    },
})

export default mongoose.model("major_cities", dataSchema);