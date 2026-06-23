const express = require('express');
const { linkEntities, unlinkEntities, getLinkHistory, relinkEntities } = require('../controllers/linkController');
const { protect, admin } = require('../middleware/authMiddleware');
const { checkCreateLimit } = require('../middleware/demoMode');
const router = express.Router();

router.post('/', protect, admin, checkCreateLimit('LinkHistory'), linkEntities);
router.post('/relink', protect, admin, checkCreateLimit('LinkHistory'), relinkEntities);
router.delete('/:linkId', protect, admin, unlinkEntities);
router.get('/history', protect, admin, getLinkHistory);

module.exports = router;
