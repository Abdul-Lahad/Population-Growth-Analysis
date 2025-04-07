import express from 'express';
import { getData } from '../controllers/dataConroller.js';

const route = express.Router();

// Define the route for fetching data   


route.get('/getAll', getData);

export default route;