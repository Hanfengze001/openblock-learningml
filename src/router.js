const express = require('express');
const router = express.Router();
 
router.get('/', (req, res) => {
    res.render('learningml/index.html');
});

router.get('/learningml', (req, res) => {
    res.render('learningml/index.html');
});
 
module.exports = router;
