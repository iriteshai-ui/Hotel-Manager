import { Router } from 'express';
import { db, pool } from '../db.js';

const router = Router();

// GET all onboarded hotels
router.get('/', async (req, res) => {
  try {
    const hotels = await db.getHotels();
    res.json(hotels);
  } catch (err) {
    console.error('Error fetching hotels:', err.message);
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
});

// GET hotel by slug + its menu items
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const hotel = await db.getHotelBySlug(slug);
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    // Fetch menu items for this hotel (or general menu items if none assigned)
    const itemsRes = await pool.query(
      'SELECT * FROM menu_items WHERE hotel_id = $1 OR hotel_id IS NULL ORDER BY category, name;',
      [hotel.id]
    );

    res.json({
      hotel,
      menuItems: itemsRes.rows.map(row => ({
        id: row.id,
        name: row.name,
        price: parseFloat(row.price),
        category: row.category,
        description: row.description,
        imageUrl: row.image_url,
        isAvailable: row.is_available !== false,
        dietaryTags: row.dietary_tags || [],
        hotelId: row.hotel_id
      }))
    });
  } catch (err) {
    console.error('Error fetching hotel by slug:', err.message);
    res.status(500).json({ error: 'Failed to fetch hotel details' });
  }
});

// POST /api/hotels/onboard - Onboard new hotel and batch save menu items
router.post('/onboard', async (req, res) => {
  try {
    const {
      name,
      slug,
      currency = 'USD',
      taxPercentage = 10,
      theme = {},
      contactEmail = '',
      contactPhone = '',
      menuItems = []
    } = req.body || {};

    // 1. Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Hotel Name is required.' });
    }

    if (!slug || typeof slug !== 'string' || !slug.trim()) {
      return res.status(400).json({ error: 'Unique URL slug is required.' });
    }

    // Slug validation: lowercase letters, numbers, and hyphens only, no spaces
    const cleanSlug = slug.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      return res.status(400).json({
        error: 'Slug must contain only lowercase letters, numbers, and hyphens (no spaces or special characters).'
      });
    }

    const taxNum = parseFloat(taxPercentage);
    if (isNaN(taxNum) || taxNum < 0 || taxNum > 100) {
      return res.status(400).json({ error: 'Tax percentage must be between 0 and 100.' });
    }

    // 2. Validate menu items if provided
    if (Array.isArray(menuItems)) {
      for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i];
        if (!item.name || !item.name.trim()) {
          return res.status(400).json({ error: `Menu item #${i + 1} is missing a name.` });
        }
        const price = parseFloat(item.price);
        if (isNaN(price) || price <= 0) {
          return res.status(400).json({ error: `Menu item "${item.name}" must have a positive price.` });
        }
      }
    }

    // 3. Create Hotel
    const hotelResult = await db.createHotel({
      name: name.trim(),
      slug: cleanSlug,
      currency,
      taxPercentage: taxNum,
      theme,
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim()
    });

    if (hotelResult.error) {
      return res.status(400).json({ error: hotelResult.error });
    }

    const hotel = hotelResult.hotel;

    // 4. Batch Save Menu Items
    let savedItems = [];
    if (Array.isArray(menuItems) && menuItems.length > 0) {
      savedItems = await db.batchAddMenuItems(hotel.id, menuItems);
    }

    res.status(201).json({
      success: true,
      message: `Property "${hotel.name}" successfully onboarded with ${savedItems.length} menu items!`,
      hotel,
      menuItemsCount: savedItems.length,
      menuItems: savedItems
    });
  } catch (err) {
    console.error('Hotel onboarding error:', err.message);
    res.status(500).json({ error: 'Failed to onboard hotel property.' });
  }
});

export default router;
