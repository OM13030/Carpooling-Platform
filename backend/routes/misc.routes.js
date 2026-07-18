const router = require('express').Router();
const miscController = require('../controllers/misc.controller');
const { auth, requireEmployee } = require('../middlewares/auth');
const ApiResponse = require('../utils/ApiResponse');

const cheerio = require('cheerio');

router.use(auth);

router.get('/live-fuel-price', async (req, res) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch('https://www.goodreturns.in/petrol-price.html', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    clearTimeout(timeoutId);
    const html = await response.text();
    const $ = cheerio.load(html);
    let price = 96.50;

    $('table tr').each((i, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.startsWith('Gujarat')) {
        const parts = text.split(' ');
        if (parts[1]) {
          const priceStr = parts[1].replace('₹', '');
          const parsed = parseFloat(priceStr);
          if (!isNaN(parsed)) {
            price = parsed;
          }
        }
      }
    });

    res.status(200).json(new ApiResponse(200, { price }, 'Fuel price retrieved'));
  } catch (err) {
    clearTimeout(timeoutId);
    res.status(200).json(new ApiResponse(200, { price: 96.50 }, 'Fuel price retrieved (fallback)'));
  }
});

router.use(requireEmployee);

router.get('/places', miscController.getSavedPlaces);
router.post('/places', miscController.createSavedPlace);
router.delete('/places/:id', miscController.deleteSavedPlace);

router.get('/notifications', miscController.getNotifications);
router.post('/notifications/read', miscController.markNotificationsRead);

router.post('/ratings', miscController.rateParticipant);

router.get('/chat/:tripId', miscController.getTripMessages);
router.post('/chat/:tripId', miscController.sendTripMessage);

module.exports = router;
