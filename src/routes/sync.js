import express from 'express';
import { syncFromServer, syncToServer, deleteFromServer } from '../controllers/syncController.js';
const router = express.Router();


router.post('/syncToServer',syncToServer);
router.get('/syncFromServer/:tableName', syncFromServer);
router.delete('/deleteFromServer/:tableName/:id', deleteFromServer);

export default router;