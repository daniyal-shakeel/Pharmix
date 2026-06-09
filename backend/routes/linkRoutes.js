const express = require('express');
const { linkEntities, unlinkEntities, getLinkHistory, relinkEntities } = require('../controllers/linkController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', protect, admin, linkEntities);
router.post('/relink', protect, admin, relinkEntities);
router.delete('/:linkId', protect, admin, unlinkEntities);
router.get('/history', protect, admin, getLinkHistory);

module.exports = router;
