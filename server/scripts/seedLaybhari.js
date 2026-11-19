import { pool } from '../src/db.js';
import crypto from 'crypto';

async function seedLaybhariMenu() {
  const client = await pool.connect();
  try {
    // 1. Get or create Hotel Lay Bhari
    let hotelRes = await client.query("SELECT id FROM hotels WHERE slug = 'laybhari';");
    let hotelId;
    if (hotelRes.rows.length === 0) {
      const ins = await client.query(`
        INSERT INTO hotels (name, slug, currency, tax_percentage, theme, contact_email, contact_phone, status, total_rooms)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
      `, [
        'Hotel Lay Bhari',
        'laybhari',
        'INR',
        5.00,
        JSON.stringify({ primaryColor: '#D97706', backgroundColor: '#0F172A', borderRadius: '14px' }),
        'contact@hotellaybhari.com',
        '+91 98765 43210',
        'ACTIVE',
        12
      ]);
      hotelId = ins.rows[0].id;
    } else {
      hotelId = hotelRes.rows[0].id;
      await client.query(
        "UPDATE hotels SET name = $1, currency = $2, status = $3, theme = $4 WHERE id = $5;",
        [
          'Hotel Lay Bhari',
          'INR',
          'ACTIVE',
          JSON.stringify({ primaryColor: '#D97706', backgroundColor: '#0F172A', borderRadius: '14px' }),
          hotelId
        ]
      );
    }

    console.log('Target Hotel ID:', hotelId);

    // 2. Clear old menu items for this hotel to avoid partial duplicates
    await client.query('DELETE FROM menu_items WHERE hotel_id = $1;', [hotelId]);

    // 3. Define all menu items extracted from user prompt
    const items = [
      // 1. Veg Starter
      { name: 'Masala Papad', price: 40, category: 'Veg Starter', tags: ['Veg', 'Crispy'], desc: 'Crispy roasted papad topped with spicy onion, tomato & fresh coriander mixture' },
      { name: 'Nachani Papad', price: 30, category: 'Veg Starter', tags: ['Veg', 'Gluten-Free'], desc: 'Traditional ragi (finger millet) roasted crispy papad' },
      { name: 'Tandul Papad', price: 30, category: 'Veg Starter', tags: ['Veg', 'Gluten-Free'], desc: 'Traditional rice flour seasoned sun-dried papad' },
      { name: 'Finger Chips', price: 150, category: 'Veg Starter', tags: ['Veg'], desc: 'Golden crispy potato French fries tossed with salt' },
      { name: 'Paneer Chilly', price: 250, category: 'Veg Starter', tags: ['Veg', 'Spicy'], desc: 'Fresh cottage cheese cubes tossed in spicy soya & green chilli sauce', bestseller: true },
      { name: 'Paneer Crispy', price: 250, category: 'Veg Starter', tags: ['Veg'], desc: 'Crispy batter-fried paneer cubes tossed in sweet & spicy sauce' },
      { name: 'Paneer Pakoda', price: 250, category: 'Veg Starter', tags: ['Veg'], desc: 'Spiced gram flour batter-coated cottage cheese fritters' },
      { name: 'Veg Chilly', price: 200, category: 'Veg Starter', tags: ['Veg', 'Spicy'], desc: 'Crisp assorted vegetable balls tossed with capsicum, garlic and chillies' },
      { name: 'Veg Crispy', price: 200, category: 'Veg Starter', tags: ['Veg'], desc: 'Crispy fried julienned fresh vegetables tossed in aromatic Chinese wok sauce' },
      { name: 'Paneer 65', price: 260, category: 'Veg Starter', tags: ['Veg', 'Spicy'], desc: 'South Indian style spiced crispy fried cottage cheese with curry leaves' },
      { name: 'Veg Spring Roll', price: 200, category: 'Veg Starter', tags: ['Veg'], desc: 'Crispy golden rolls stuffed with seasoned shredded vegetables' },
      { name: 'Paneer Spring Roll', price: 230, category: 'Veg Starter', tags: ['Veg'], desc: 'Crispy rolled pastry sheets stuffed with spiced cottage cheese and veggies' },
      { name: 'Veg Manchurian', price: 160, category: 'Veg Starter', tags: ['Veg'], desc: 'Fried vegetable dumplings in classic tangy and savory Manchurian sauce' },

      // 2. Veg Kabab
      { name: 'Paneer Tikka Kabab', price: 230, category: 'Veg Kabab', tags: ['Veg', 'Tandoor'], desc: 'Charcoal-grilled cottage cheese cubes marinated in spiced tandoori yogurt', bestseller: true },
      { name: 'Paneer Hariyali Kabab', price: 230, category: 'Veg Kabab', tags: ['Veg'], desc: 'Tandoori paneer marinated in fresh mint, coriander, and spinach paste' },
      { name: 'Veg Lajwab Kabab', price: 220, category: 'Veg Kabab', tags: ['Veg', 'Chef Special'], desc: "Chef's signature spiced mixed vegetable seekh kabab grilled to perfection" },
      { name: 'Veg Harabhara Kabab', price: 220, category: 'Veg Kabab', tags: ['Veg', 'Healthy'], desc: 'Pan-fried spiced patties of spinach, green peas, and potatoes' },

      // 3. Veg Main Course
      { name: 'Shev Bhaji', price: 160, category: 'Veg Main Course', tags: ['Veg', 'Maharashtrian', 'Spicy'], desc: 'Authentic Maharashtrian spicy red curry with crisp savory gathiya shev', bestseller: true },
      { name: 'Veg Kolhapuri', price: 200, category: 'Veg Main Course', tags: ['Veg', 'Spicy'], desc: 'Assorted seasonal vegetables simmered in spicy Kolhapuri red masala gravy' },
      { name: 'Mix Veg', price: 200, category: 'Veg Main Course', tags: ['Veg'], desc: 'Fresh garden vegetables cooked in traditional homestyle onion-tomato gravy' },
      { name: 'Veg Maratha', price: 190, category: 'Veg Main Course', tags: ['Veg', 'Maharashtrian', 'Spicy'], desc: 'Spiced vegetable koftas in a fiery aromatic Maratha red gravy', bestseller: true },
      { name: 'Paneer Kadai', price: 250, category: 'Veg Main Course', tags: ['Veg'], desc: 'Cottage cheese and bell peppers stir-fried with freshly ground kadai spices' },
      { name: 'Paneer Masala', price: 220, category: 'Veg Main Course', tags: ['Veg'], desc: 'Succulent paneer cubes simmered in spiced onion-tomato curry' },
      { name: 'Paneer Tikka Masala', price: 260, category: 'Veg Main Course', tags: ['Veg', 'Tandoor'], desc: 'Smokey roasted paneer tikka pieces in a rich, creamy spiced makhani gravy', bestseller: true },
      { name: 'Palak Paneer', price: 230, category: 'Veg Main Course', tags: ['Veg'], desc: 'Fresh cottage cheese cooked in garlic-tempered smooth spinach puree' },
      { name: 'Malai Paneer Masala', price: 220, category: 'Veg Main Course', tags: ['Veg'], desc: 'Soft paneer in a luxurious mildly spiced cream and cashew gravy' },
      { name: 'Butter Paneer Masala', price: 220, category: 'Veg Main Course', tags: ['Veg'], desc: 'Classic tender cottage cheese simmered in buttery velvety tomato gravy' },
      { name: 'Green Pis Masala', price: 160, category: 'Veg Main Course', tags: ['Veg'], desc: 'Tender sweet green peas cooked in a robust spiced gravy' },
      { name: 'Chana Masala', price: 160, category: 'Veg Main Course', tags: ['Veg'], desc: 'Kabuli chickpeas slow-cooked in a tangy Punjabi masala with amchur' },
      { name: 'Kaju Masala', price: 270, category: 'Veg Main Course', tags: ['Veg', 'Rich'], desc: 'Whole roasted cashew nuts simmered in an indulgent spicy royal gravy' },
      { name: 'Kaju Kari', price: 250, category: 'Veg Main Course', tags: ['Veg', 'Rich'], desc: 'Golden cashew nuts in rich onion-tomato curry base' },
      { name: 'Paneer Handi (Full)', price: 300, category: 'Veg Main Course', tags: ['Veg', 'Full'], desc: 'Paneer cooked in traditional clay pot style rich gravy (Full Portion)' },
      { name: 'Paneer Handi (Half)', price: 200, category: 'Veg Main Course', tags: ['Veg', 'Half'], desc: 'Paneer cooked in traditional clay pot style rich gravy (Half Portion)' },
      { name: 'Veg Handi (Full)', price: 280, category: 'Veg Main Course', tags: ['Veg', 'Full'], desc: 'Assorted vegetables cooked in earthenware handi style spiced gravy (Full Portion)' },
      { name: 'Veg Handi (Half)', price: 200, category: 'Veg Main Course', tags: ['Veg', 'Half'], desc: 'Assorted vegetables cooked in earthenware handi style spiced gravy (Half Portion)' },
      { name: 'Dal Tadka', price: 160, category: 'Veg Main Course', tags: ['Veg'], desc: 'Yellow toor dal cooked and tempered with cumin, garlic, and red chillies' },
      { name: 'Dal Fry', price: 140, category: 'Veg Main Course', tags: ['Veg'], desc: 'Yellow lentils gently spiced with butter, onions, tomatoes and coriander' },

      // 4. Veg Soup
      { name: 'Veg Manchow Soup', price: 120, category: 'Veg Soup', tags: ['Veg', 'Spicy'], desc: 'Spicy dark soy vegetable soup topped with crunchy fried noodles' },
      { name: 'Veg Hot & Sour Soup', price: 110, category: 'Veg Soup', tags: ['Veg', 'Spicy'], desc: 'Tangy and spicy Chinese broth loaded with fresh shredded vegetables' },
      { name: 'Tomato Soup', price: 130, category: 'Veg Soup', tags: ['Veg'], desc: 'Silky smooth roasted tomato soup served with crispy toasted croutons' },

      // 5. Chinese Veg
      { name: 'Veg Fried Rice (Full)', price: 235, category: 'Chinese Veg', tags: ['Veg', 'Full'], desc: 'Wok-tossed basmati rice with diced seasonal vegetables and spring onions' },
      { name: 'Veg Fried Rice (Half)', price: 215, category: 'Chinese Veg', tags: ['Veg', 'Half'], desc: 'Wok-tossed basmati rice with diced seasonal vegetables and spring onions' },
      { name: 'Veg Noodles (Full)', price: 235, category: 'Chinese Veg', tags: ['Veg', 'Full'], desc: 'Stir-fried noodles tossed with crisp vegetables, soy sauce, and white pepper' },
      { name: 'Veg Noodles (Half)', price: 215, category: 'Chinese Veg', tags: ['Veg', 'Half'], desc: 'Stir-fried noodles tossed with crisp vegetables, soy sauce, and white pepper' },

      // 6. Chinese Non / Veg
      { name: 'Chicken Chilly', price: 200, category: 'Chinese Non-Veg', tags: ['Non-Veg', 'Spicy'], desc: 'Crispy batter-fried chicken bites tossed with capsicum, onions, and green chillies', bestseller: true },
      { name: 'Chicken Crispy', price: 200, category: 'Chinese Non-Veg', tags: ['Non-Veg'], desc: 'Shredded crispy chicken tossed in sweet, tangy and spicy Schezwan sauce' },
      { name: 'Chicken 65', price: 220, category: 'Chinese Non-Veg', tags: ['Non-Veg', 'Spicy'], desc: 'Deep-fried marinated chicken chunks flavored with curry leaves and red chilli' },
      { name: 'Chicken Lolipop Fry', price: 190, category: 'Chinese Non-Veg', tags: ['Non-Veg'], desc: 'Crispy frenched chicken drumettes fried crisp, served with Schezwan dip', bestseller: true },
      { name: 'Chicken Lolipop Masala', price: 210, category: 'Chinese Non-Veg', tags: ['Non-Veg', 'Spicy'], desc: 'Crispy chicken drumettes tossed in a rich, spicy Schezwan gravy' },
      { name: 'Chicken Noodles (Full)', price: 210, category: 'Chinese Non-Veg', tags: ['Non-Veg', 'Full'], desc: 'Wok-tossed noodles with tender shredded chicken and vegetables (Full Portion)' },
      { name: 'Chicken Noodles (Half)', price: 190, category: 'Chinese Non-Veg', tags: ['Non-Veg', 'Half'], desc: 'Wok-tossed noodles with tender shredded chicken and vegetables (Half Portion)' },
      { name: 'Chicken Fried Rice (Full)', price: 270, category: 'Chinese Non-Veg', tags: ['Non-Veg', 'Full'], desc: 'Aromatic wok-fried rice with egg, juicy chicken pieces and spring onions (Full Portion)' },
      { name: 'Chicken Fried Rice (Half)', price: 190, category: 'Chinese Non-Veg', tags: ['Non-Veg', 'Half'], desc: 'Aromatic wok-fried rice with egg, juicy chicken pieces and spring onions (Half Portion)' },
      { name: 'Chicken Triple Fried Rice (Full)', price: 290, category: 'Chinese Non-Veg', tags: ['Non-Veg', 'Full'], desc: 'Fried rice, chicken noodles, and a rich Schezwan chicken gravy with fried egg (Full Portion)', bestseller: true },
      { name: 'Chicken Triple Fried Rice (Half)', price: 190, category: 'Chinese Non-Veg', tags: ['Non-Veg', 'Half'], desc: 'Fried rice, chicken noodles, and a rich Schezwan chicken gravy with fried egg (Half Portion)' },

      // 7. Main Course (Non - Veg)
      { name: 'Mutton Masala', price: 280, category: 'Main Course (Non-Veg)', tags: ['Non-Veg', 'Spicy', 'Mutton'], desc: 'Tender mutton cooked in traditional roasted Maharashtrian whole spice gravy', bestseller: true },
      { name: 'Mutton Kari', price: 260, category: 'Main Course (Non-Veg)', tags: ['Non-Veg', 'Mutton'], desc: 'Homestyle slow-simmered tender goat mutton curry with rich aroma' },
      { name: 'Chicken Masala', price: 260, category: 'Main Course (Non-Veg)', tags: ['Non-Veg', 'Chicken'], desc: 'Succulent bone-in chicken slow-cooked in thick onion-tomato gravy', bestseller: true },
      { name: 'Chicken Kari', price: 240, category: 'Main Course (Non-Veg)', tags: ['Non-Veg', 'Chicken'], desc: 'Flavorful country-style chicken curry cooked with rustic spices' },
      { name: 'Anda Masala', price: 170, category: 'Main Course (Non-Veg)', tags: ['Egg'], desc: 'Hard-boiled eggs simmered in a spiced onion, tomato and ginger gravy' },
      { name: 'Anda Kari', price: 150, category: 'Main Course (Non-Veg)', tags: ['Egg'], desc: 'Homestyle egg curry infused with rustic country spices' },

      // 8. Non Veg Handi Special - Mutton
      { name: 'Mutton Handi (Full)', price: 720, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Mutton', 'Full'], desc: 'Slow-cooked mutton in sealed clay pot with secret regional masala (Full Portion)', bestseller: true },
      { name: 'Mutton Handi (Half)', price: 410, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Mutton', 'Half'], desc: 'Slow-cooked mutton in sealed clay pot with secret regional masala (Half Portion)' },
      { name: 'Mutton Kala Masala Handi (Full)', price: 750, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Mutton', 'Spicy', 'Full'], desc: 'Authentic Vidarbha/Marathwada roasted black masala slow-cooked mutton (Full Portion)', bestseller: true },
      { name: 'Mutton Kala Masala Handi (Half)', price: 450, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Mutton', 'Spicy', 'Half'], desc: 'Authentic Vidarbha/Marathwada roasted black masala slow-cooked mutton (Half Portion)' },
      { name: 'Mutton Gharguti Handi (Full)', price: 720, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Mutton', 'Full'], desc: 'Homestyle grandma-recipe slow-cooked mutton handi (Full Portion)' },
      { name: 'Mutton Gharguti Handi (Half)', price: 410, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Mutton', 'Half'], desc: 'Homestyle grandma-recipe slow-cooked mutton handi (Half Portion)' },
      { name: 'Mutton Malvani Handi (Full)', price: 780, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Mutton', 'Coastal', 'Full'], desc: 'Coastal Konkan style coconut and Malvani masala infused mutton (Full Portion)' },
      { name: 'Mutton Malvani Handi (Half)', price: 460, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Mutton', 'Coastal', 'Half'], desc: 'Coastal Konkan style coconut and Malvani masala infused mutton (Half Portion)' },

      // 8. Non Veg Handi Special - Chicken
      { name: 'Chicken Handi (Full)', price: 520, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Chicken', 'Full'], desc: 'Earthen pot slow-cooked farm chicken in thick rich masala (Full Portion)', bestseller: true },
      { name: 'Chicken Handi (Half)', price: 310, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Chicken', 'Half'], desc: 'Earthen pot slow-cooked farm chicken in thick rich masala (Half Portion)' },
      { name: 'Chicken Kala Masala Handi (Full)', price: 550, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Chicken', 'Spicy', 'Full'], desc: 'Smokey roasted black spice traditional chicken handi (Full Portion)' },
      { name: 'Chicken Kala Masala Handi (Half)', price: 350, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Chicken', 'Spicy', 'Half'], desc: 'Smokey roasted black spice traditional chicken handi (Half Portion)' },
      { name: 'Chicken Gharguti Handi (Full)', price: 520, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Chicken', 'Full'], desc: 'Homestyle rustic chicken handi cooked to tender perfection (Full Portion)' },
      { name: 'Chicken Gharguti Handi (Half)', price: 310, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Chicken', 'Half'], desc: 'Homestyle rustic chicken handi cooked to tender perfection (Half Portion)' },
      { name: 'Chicken Malvani Handi (Full)', price: 580, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Chicken', 'Coastal', 'Full'], desc: 'Fragrant Malvani style roasted coconut and red chilli chicken curry (Full Portion)' },
      { name: 'Chicken Malvani Handi (Half)', price: 360, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Chicken', 'Coastal', 'Half'], desc: 'Fragrant Malvani style roasted coconut and red chilli chicken curry (Half Portion)' },
      { name: 'Butter Chicken Handi (Full)', price: 650, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Chicken', 'Full'], desc: 'Clay pot cooked tender chicken in velvety butter and cashew makhani gravy (Full Portion)' },
      { name: 'Butter Chicken Handi (Half)', price: 380, category: 'Non Veg Handi Special', tags: ['Non-Veg', 'Chicken', 'Half'], desc: 'Clay pot cooked tender chicken in velvety butter and cashew makhani gravy (Half Portion)' },

      // 9. Roti Special
      { name: '(Bajri) Bhakri', price: 30, category: 'Roti Special', tags: ['Veg', 'Traditional', 'Gluten-Free'], desc: 'Hand-patted roasted pearl millet flatbread, crisp on the griddle', bestseller: true },
      { name: '(Jwari) Bhakri', price: 40, category: 'Roti Special', tags: ['Veg', 'Traditional', 'Gluten-Free'], desc: 'Soft and healthy hand-pressed sorghum flatbread', bestseller: true },
      { name: 'Chapati', price: 20, category: 'Roti Special', tags: ['Veg'], desc: 'Soft whole wheat thin homestyle flatbread' },
      { name: 'Plane Roti', price: 20, category: 'Roti Special', tags: ['Veg'], desc: 'Freshly baked tandoori whole wheat roti' },
      { name: 'Butter Roti', price: 25, category: 'Roti Special', tags: ['Veg'], desc: 'Crisp tandoori wheat roti brushed with rich dairy butter' },
      { name: 'Naan', price: 50, category: 'Roti Special', tags: ['Veg'], desc: 'Classic tandoor-baked leavened flatbread' },
      { name: 'Batar Naan', price: 60, category: 'Roti Special', tags: ['Veg'], desc: 'Fluffy tandoor-baked naan lavishly glazed with melted butter' },
      { name: 'Cheese Butter Naan', price: 80, category: 'Roti Special', tags: ['Veg'], desc: 'Tandoori naan stuffed and topped with melted cheese and butter', bestseller: true },
      { name: 'Cheese Garlic Naan', price: 110, category: 'Roti Special', tags: ['Veg'], desc: 'Golden naan infused with minced roasted garlic, melted mozzarella, and fresh coriander', bestseller: true },

      // 10. Rice
      { name: 'Indrayani Rice (Full)', price: 80, category: 'Rice', tags: ['Veg', 'Full'], desc: 'Fragrant sticky aromatic local Indrayani steamed rice with pure ghee (Full Portion)', bestseller: true },
      { name: 'Indrayani Rice (Half)', price: 50, category: 'Rice', tags: ['Veg', 'Half'], desc: 'Fragrant sticky aromatic local Indrayani steamed rice with pure ghee (Half Portion)' },
      { name: 'Plane Rice (Full)', price: 120, category: 'Rice', tags: ['Veg', 'Full'], desc: 'Steamed premium long-grain Basmati rice (Full Portion)' },
      { name: 'Plane Rice (Half)', price: 80, category: 'Rice', tags: ['Veg', 'Half'], desc: 'Steamed premium long-grain Basmati rice (Half Portion)' },
      { name: 'Jeera Rice (Full)', price: 120, category: 'Rice', tags: ['Veg', 'Full'], desc: 'Fragrant basmati rice tempered with roasted cumin seeds and fresh ghee (Full Portion)' },
      { name: 'Jeera Rice (Half)', price: 90, category: 'Rice', tags: ['Veg', 'Half'], desc: 'Fragrant basmati rice tempered with roasted cumin seeds and fresh ghee (Half Portion)' },
      { name: 'Dal Khichadi', price: 150, category: 'Rice', tags: ['Veg', 'Comfort'], desc: 'Comforting slow-cooked rice and lentils tempered with garlic, cumin, and ghee' },
      { name: 'Mutton Alani Rice', price: 290, category: 'Rice', tags: ['Non-Veg', 'Mutton'], desc: 'Signature aromatic rice slow-cooked in rich clarified mutton bone broth (Alani pani)', bestseller: true },
      { name: 'Chicken Alani Rice', price: 250, category: 'Rice', tags: ['Non-Veg', 'Chicken'], desc: 'Basmati rice cooked in fragrant, seasoned chicken broth with tender chicken morsels', bestseller: true },
      { name: 'Alani Rice', price: 150, category: 'Rice', tags: ['Non-Veg', 'Broth'], desc: 'Flavorful spiced rice cooked in slow-reduced savory meat stock broth' }
    ];

    console.log(`Inserting ${items.length} items for Hotel Lay Bhari...`);

    for (const item of items) {
      const id = crypto.randomUUID();
      await client.query(`
        INSERT INTO menu_items (id, name, price, category, description, image_url, is_available, is_bestseller, dietary_tags, hotel_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
      `, [
        id,
        item.name,
        item.price,
        item.category,
        item.desc || '',
        '/images/food_placeholder.png',
        true,
        item.bestseller === true,
        item.tags || [],
        hotelId
      ]);
    }

    console.log(`✓ Successfully seeded ${items.length} menu items into Supabase for Hotel Lay Bhari!`);

    const catRes = await client.query('SELECT category, count(*) FROM menu_items WHERE hotel_id = $1 GROUP BY category ORDER BY category;', [hotelId]);
    console.log('Categories breakdown:');
    catRes.rows.forEach(r => console.log(`  - ${r.category}: ${r.count} items`));

  } finally {
    client.release();
  }
}

seedLaybhariMenu()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Seed Error:', err);
    process.exit(1);
  });
