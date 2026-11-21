import { Router } from 'express';
import { db, pool } from '../db.js';
import { multiTenantDb } from '../multiTenantDb.js';

const router = Router();

// GET all onboarded hotels
router.get('/', async (req, res) => {
  try {
    const hotels = await db.getHotels();
    // Non-super-admin authenticated users can only view their own hotel
    if (req.user && req.user.role !== 'SUPER_ADMIN' && req.user.hotel_id) {
      return res.json(hotels.filter(h => h.id === req.user.hotel_id));
    }
    res.json(hotels);
  } catch (err) {
    console.error('Error fetching hotels:', err.message);
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
});

// GET hotel by slug + its isolated menu items
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const hotel = await db.getHotelBySlug(slug);
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    // Strict multi-tenant isolation: fetch only this hotel's menu items
    const menuItems = await db.getMenuItemsByHotel(hotel.id);

    res.json({
      hotel,
      menuItems
    });
  } catch (err) {
    console.error('Error fetching hotel by slug:', err.message);
    res.status(500).json({ error: 'Failed to fetch hotel details' });
  }
});

// GET /api/hotels/:slug/menu - Hotel Owner: Get all items for own hotel
router.get('/:slug/menu', async (req, res) => {
  try {
    const { slug } = req.params;
    const hotel = await db.getHotelBySlug(slug);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });

    // Multi-tenant check: non-super-admin can only access own hotel
    if (req.user && req.user.role !== 'SUPER_ADMIN' && req.user.hotel_id && req.user.hotel_id !== hotel.id) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own hotel menu' });
    }

    const items = await db.getMenuItemsByHotel(hotel.id);
    res.json({ hotel, items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// POST /api/hotels/:slug/menu - Hotel Owner: Add menu item
router.post('/:slug/menu', async (req, res) => {
  try {
    const { slug } = req.params;
    const hotel = await db.getHotelBySlug(slug);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });

    const { name, category, price, description, isAvailable, isBestseller, dietaryTags, imageUrl } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Item name is required' });
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) return res.status(400).json({ error: 'Valid positive price is required' });

    const item = await db.addHotelMenuItem(hotel.id, {
      name: name.trim(),
      category: category || 'Mains',
      price: numPrice,
      description: description || '',
      isAvailable: isAvailable !== false,
      isBestseller: isBestseller === true,
      dietaryTags: Array.isArray(dietaryTags) ? dietaryTags : [],
      imageUrl: imageUrl || ''
    });

    res.status(201).json(item);
  } catch (err) {
    console.error('Add menu item error:', err.message);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

// PUT /api/hotels/:slug/menu/:itemId - Hotel Owner: Update item
router.put('/:slug/menu/:itemId', async (req, res) => {
  try {
    const { slug, itemId } = req.params;
    const hotel = await db.getHotelBySlug(slug);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });

    const updated = await db.updateHotelMenuItem(hotel.id, itemId, req.body);
    if (!updated) return res.status(404).json({ error: 'Menu item not found' });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// DELETE /api/hotels/:slug/menu/:itemId - Hotel Owner: Delete item
router.delete('/:slug/menu/:itemId', async (req, res) => {
  try {
    const { slug, itemId } = req.params;
    const hotel = await db.getHotelBySlug(slug);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });

    const deleted = await db.deleteHotelMenuItem(hotel.id, itemId);
    if (!deleted) return res.status(404).json({ error: 'Menu item not found' });

    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// PATCH /api/hotels/:slug/menu/:itemId/bestseller - Hotel Owner: Toggle Quick-Add / Bestseller Pin
router.patch('/:slug/menu/:itemId/bestseller', async (req, res) => {
  try {
    const { slug, itemId } = req.params;
    const hotel = await db.getHotelBySlug(slug);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });

    const updated = await db.toggleBestseller(hotel.id, itemId);
    if (!updated) return res.status(404).json({ error: 'Menu item not found' });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle bestseller' });
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

// PUT /api/hotels/:id - Hotel Owner / Super Admin update hotel details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.role !== 'SUPER_ADMIN' && req.user.hotel_id !== id) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own hotel' });
    }
    const { name, currency, taxPercentage, contactEmail, contactPhone, status, totalRooms } = req.body || {};
    const updated = await multiTenantDb.updateHotel(id, {
      name, currency, taxPercentage, contactEmail, contactPhone, status, totalRooms
    });
    if (!updated) return res.status(404).json({ error: 'Hotel not found' });
    res.json({ success: true, hotel: updated });
  } catch (err) {
    console.error('Error updating hotel:', err.message);
    res.status(500).json({ error: 'Failed to update hotel' });
  }
});

// PATCH /api/hotels/:id/status - Hotel Owner / Super Admin toggle hotel status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.role !== 'SUPER_ADMIN' && req.user.hotel_id !== id) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own hotel status' });
    }
    const { status } = req.body;
    if (!status || !['ACTIVE', 'INACTIVE'].includes(status.toUpperCase())) {
      return res.status(400).json({ error: 'Valid status required (ACTIVE/INACTIVE)' });
    }
    const updated = await multiTenantDb.toggleHotelStatus(id, status.toUpperCase());
    if (!updated) return res.status(404).json({ error: 'Hotel not found' });
    res.json({ success: true, hotel: updated });
  } catch (err) {
    console.error('Error toggling hotel status:', err.message);
    res.status(500).json({ error: 'Failed to update hotel status' });
  }
});

export default router;
