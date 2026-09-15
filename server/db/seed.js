const { db, all, get, run } = require('./database');
const crypto = require('node:crypto');

function seedDatabase() {
  const userCount = get('SELECT COUNT(*) as count FROM users')?.count || 0;
  if (userCount > 0) {
    console.log('Database already populated. Skipping seed.');
    return;
  }

  console.log('Seeding initial bookstore & stationery data...');

  // 1. Seed Users
  const users = [
    {
      id: 'usr_admin',
      name: 'Eleanor Vance (Head Curator)',
      email: 'admin@bookhaven.com',
      password_hash: 'admin123',
      role: 'admin',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 'usr_cashier',
      name: 'James Mercer (Lead Cashier)',
      email: 'cashier@bookhaven.com',
      password_hash: 'cashier123',
      role: 'cashier',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString()
    }
  ];

  for (const u of users) {
    run(
      'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [u.id, u.name, u.email, u.password_hash, u.role, u.created_at]
    );
  }

  // 2. Seed Suppliers
  const suppliers = [
    {
      id: 'sup_penguin',
      name: 'Penguin Random House Dist.',
      contact_person: 'Sarah Jenkins',
      phone: '+1 (202) 555-0143',
      email: 'orders@penguinrandomhouse.com',
      address: '1745 Broadway, New York, NY 10019',
      supplied_categories: 'Books (Fiction, Non-Fiction, Classics)'
    },
    {
      id: 'sup_harper',
      name: 'HarperCollins Publishers',
      contact_person: 'David Miller',
      phone: '+1 (202) 555-0188',
      email: 'supply@harpercollins.com',
      address: '195 Broadway, New York, NY 10007',
      supplied_categories: 'Books (Sci-Fi, History, Biographies)'
    },
    {
      id: 'sup_faber',
      name: 'Faber-Castell Art & Writing',
      contact_person: 'Marcus Braun',
      phone: '+1 (202) 555-0199',
      email: 'b2b@faber-castell.com',
      address: 'Nürnberger Str. 2, Stein, Germany',
      supplied_categories: 'Stationery (Fine Pens, Pencils, Markers)'
    },
    {
      id: 'sup_moleskine',
      name: 'Moleskine Stationery Group',
      contact_person: 'Elena Rossi',
      phone: '+1 (202) 555-0164',
      email: 'b2b.orders@moleskine.com',
      address: 'Viale Piceno 17, Milan, Italy',
      supplied_categories: 'Stationery (Journals, Planners, Sketchbooks)'
    },
    {
      id: 'sup_midori',
      name: 'Midori Papercraft Japan',
      contact_person: 'Kenji Sato',
      phone: '+1 (202) 555-0122',
      email: 'international@midori-japan.com',
      address: 'Chiyoda-ku, Tokyo, Japan',
      supplied_categories: 'Stationery (Brass Tools, Notebooks, Sticky Tabs)'
    },
    {
      id: 'sup_oxford',
      name: 'Oxford Academic Press',
      contact_person: 'Prof. Robert Lang',
      phone: '+1 (202) 555-0177',
      email: 'sales@oxfordpress.edu',
      address: 'Great Clarendon St, Oxford, UK',
      supplied_categories: 'Books (Academic, Dictionaries, Philosophy)'
    }
  ];

  const now = new Date().toISOString();
  for (const s of suppliers) {
    run(
      'INSERT INTO suppliers (id, name, contact_person, phone, email, address, supplied_categories, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [s.id, s.name, s.contact_person, s.phone, s.email, s.address, s.supplied_categories, now]
    );
  }

  // 3. Seed Products (Books & Stationery)
  const products = [
    // Books
    {
      id: 'prod_b01',
      barcode_isbn: '9780143034902',
      title: 'The Shadow of the Wind',
      author_brand: 'Carlos Ruiz Zafón',
      category: 'Book',
      sub_category: 'Gothic Fiction',
      price: 18.99,
      cost_price: 11.20,
      stock_quantity: 24,
      low_stock_threshold: 6,
      supplier_id: 'sup_penguin'
    },
    {
      id: 'prod_b02',
      barcode_isbn: '9780441172719',
      title: 'Dune: Deluxe Edition',
      author_brand: 'Frank Herbert',
      category: 'Book',
      sub_category: 'Sci-Fi Classic',
      price: 24.50,
      cost_price: 14.00,
      stock_quantity: 18,
      low_stock_threshold: 5,
      supplier_id: 'sup_harper'
    },
    {
      id: 'prod_b03',
      barcode_isbn: '9780735211292',
      title: 'Atomic Habits',
      author_brand: 'James Clear',
      category: 'Book',
      sub_category: 'Productivity & Self-Help',
      price: 27.00,
      cost_price: 16.50,
      stock_quantity: 32,
      low_stock_threshold: 8,
      supplier_id: 'sup_penguin'
    },
    {
      id: 'prod_b04',
      barcode_isbn: '9780525559474',
      title: 'The Midnight Library',
      author_brand: 'Matt Haig',
      category: 'Book',
      sub_category: 'Contemporary Fiction',
      price: 19.95,
      cost_price: 12.00,
      stock_quantity: 3, // Low stock trigger
      low_stock_threshold: 6,
      supplier_id: 'sup_penguin'
    },
    {
      id: 'prod_b05',
      barcode_isbn: '9780132350884',
      title: 'Clean Code: A Handbook of Agile Craftsmanship',
      author_brand: 'Robert C. Martin',
      category: 'Book',
      sub_category: 'Technology & Programming',
      price: 45.00,
      cost_price: 28.00,
      stock_quantity: 12,
      low_stock_threshold: 4,
      supplier_id: 'sup_oxford'
    },
    {
      id: 'prod_b06',
      barcode_isbn: '9780062316097',
      title: 'Sapiens: A Brief History of Humankind',
      author_brand: 'Yuval Noah Harari',
      category: 'Book',
      sub_category: 'Anthropology & History',
      price: 24.99,
      cost_price: 15.00,
      stock_quantity: 2, // Low stock trigger
      low_stock_threshold: 5,
      supplier_id: 'sup_harper'
    },
    {
      id: 'prod_b07',
      barcode_isbn: '9780743273565',
      title: 'The Great Gatsby',
      author_brand: 'F. Scott Fitzgerald',
      category: 'Book',
      sub_category: 'Classic Literature',
      price: 14.99,
      cost_price: 8.50,
      stock_quantity: 28,
      low_stock_threshold: 5,
      supplier_id: 'sup_penguin'
    },
    {
      id: 'prod_b08',
      barcode_isbn: '9780451524935',
      title: '1984 (Centennial Edition)',
      author_brand: 'George Orwell',
      category: 'Book',
      sub_category: 'Dystopian Classic',
      price: 15.50,
      cost_price: 9.00,
      stock_quantity: 0, // Out of stock trigger
      low_stock_threshold: 5,
      supplier_id: 'sup_harper'
    },
    {
      id: 'prod_b09',
      barcode_isbn: '9780374533557',
      title: 'Thinking, Fast and Slow',
      author_brand: 'Daniel Kahneman',
      category: 'Book',
      sub_category: 'Cognitive Psychology',
      price: 22.00,
      cost_price: 13.50,
      stock_quantity: 14,
      low_stock_threshold: 4,
      supplier_id: 'sup_oxford'
    },
    {
      id: 'prod_b10',
      barcode_isbn: '9781400079278',
      title: 'Kafka on the Shore',
      author_brand: 'Haruki Murakami',
      category: 'Book',
      sub_category: 'Magical Realism',
      price: 18.50,
      cost_price: 11.00,
      stock_quantity: 10,
      low_stock_threshold: 4,
      supplier_id: 'sup_penguin'
    },

    // Stationery
    {
      id: 'prod_s01',
      barcode_isbn: '8058647628128',
      title: 'Moleskine Classic Hardcover Notebook (Dotted, Black)',
      author_brand: 'Moleskine',
      category: 'Stationery',
      sub_category: 'Journals',
      price: 22.95,
      cost_price: 13.50,
      stock_quantity: 34,
      low_stock_threshold: 8,
      supplier_id: 'sup_moleskine'
    },
    {
      id: 'prod_s02',
      barcode_isbn: '4014519183421',
      title: 'Lamy Safari Fountain Pen (Charcoal, Medium Nib)',
      author_brand: 'Lamy',
      category: 'Stationery',
      sub_category: 'Writing Instruments',
      price: 29.90,
      cost_price: 18.00,
      stock_quantity: 15,
      low_stock_threshold: 5,
      supplier_id: 'sup_faber'
    },
    {
      id: 'prod_s03',
      barcode_isbn: '4005401170003',
      title: 'Faber-Castell 9000 Graphite Pencils (Set of 12)',
      author_brand: 'Faber-Castell',
      category: 'Stationery',
      sub_category: 'Drawing & Sketching',
      price: 14.50,
      cost_price: 8.00,
      stock_quantity: 42,
      low_stock_threshold: 10,
      supplier_id: 'sup_faber'
    },
    {
      id: 'prod_s04',
      barcode_isbn: '4902805421676',
      title: 'Midori Brass Ruler & Bookmark (15cm)',
      author_brand: 'Midori',
      category: 'Stationery',
      sub_category: 'Desk Accessories',
      price: 16.50,
      cost_price: 9.80,
      stock_quantity: 4, // Low stock trigger
      low_stock_threshold: 6,
      supplier_id: 'sup_midori'
    },
    {
      id: 'prod_s05',
      barcode_isbn: '4901991901662',
      title: 'Tombow Dual Brush Pen Palette (Muted / Vintage 10-Pack)',
      author_brand: 'Tombow',
      category: 'Stationery',
      sub_category: 'Calligraphy & Lettering',
      price: 26.99,
      cost_price: 16.20,
      stock_quantity: 19,
      low_stock_threshold: 6,
      supplier_id: 'sup_faber'
    },
    {
      id: 'prod_s06',
      barcode_isbn: '3037921187693',
      title: 'Rhodia Webnotebook A5 Premium Ivory Paper',
      author_brand: 'Rhodia',
      category: 'Stationery',
      sub_category: 'Fountain Pen Friendly',
      price: 19.50,
      cost_price: 11.50,
      stock_quantity: 21,
      low_stock_threshold: 5,
      supplier_id: 'sup_moleskine'
    },
    {
      id: 'prod_s07',
      barcode_isbn: '4902505374421',
      title: 'Pilot Iroshizuku Bottled Ink (Kon-Peki Cerulean)',
      author_brand: 'Pilot',
      category: 'Stationery',
      sub_category: 'Inks',
      price: 24.00,
      cost_price: 14.00,
      stock_quantity: 1, // Low stock trigger
      low_stock_threshold: 4,
      supplier_id: 'sup_midori'
    },
    {
      id: 'prod_s08',
      barcode_isbn: '8901234567890',
      title: 'Pastel Aesthetic Sticky Index Tabs (6-Palette Bookmarks)',
      author_brand: 'Folio Essentials',
      category: 'Stationery',
      sub_category: 'Organization',
      price: 6.99,
      cost_price: 2.50,
      stock_quantity: 50,
      low_stock_threshold: 15,
      supplier_id: 'sup_midori'
    }
  ];

  for (const p of products) {
    run(
      `INSERT INTO products (
        id, barcode_isbn, title, author_brand, category, sub_category, 
        price, cost_price, stock_quantity, low_stock_threshold, supplier_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.barcode_isbn,
        p.title,
        p.author_brand,
        p.category,
        p.sub_category,
        p.price,
        p.cost_price,
        p.stock_quantity,
        p.low_stock_threshold,
        p.supplier_id,
        now
      ]
    );
  }

  // 4. Seed Customers
  const customers = [
    {
      id: 'cust_01',
      name: 'Clara Oswald',
      phone_number: '9876543210',
      email: 'clara.o@ravenclaw.org',
      reward_points: 145,
      total_purchases: 485.50
    },
    {
      id: 'cust_02',
      name: 'Arthur Pendelton',
      phone_number: '9123456780',
      email: 'arthur.p@penman.co',
      reward_points: 62,
      total_purchases: 215.00
    },
    {
      id: 'cust_03',
      name: 'Maya Lin',
      phone_number: '9988776655',
      email: 'maya.art@designstudio.io',
      reward_points: 290,
      total_purchases: 890.40
    },
    {
      id: 'cust_04',
      name: 'David Copperfield',
      phone_number: '9001122334',
      email: 'd.copperfield@manuscripts.com',
      reward_points: 80,
      total_purchases: 295.40
    },
    {
      id: 'cust_05',
      name: 'Sophia Bennett',
      phone_number: '9554433221',
      email: 'sophia.reads@bibliophile.net',
      reward_points: 380,
      total_purchases: 1240.20
    }
  ];

  for (const c of customers) {
    run(
      'INSERT INTO customers (id, name, phone_number, email, reward_points, total_purchases, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [c.id, c.name, c.phone_number, c.email, c.reward_points, c.total_purchases, now]
    );
  }

  // 5. Seed Historical Sales (over the last 28 days + today)
  const paymentModes = ['Cash', 'Card', 'UPI'];
  let billCounter = 1001;

  for (let daysAgo = 28; daysAgo >= 0; daysAgo--) {
    // Generate 1 to 4 sales per day to simulate authentic store activity
    const salesToday = daysAgo === 0 ? 3 : Math.floor(Math.random() * 3) + 1;

    for (let s = 0; s < salesToday; s++) {
      const saleDate = new Date();
      saleDate.setDate(saleDate.getDate() - daysAgo);
      saleDate.setHours(10 + s * 3, Math.floor(Math.random() * 50), 0, 0);

      const customer = customers[Math.floor(Math.random() * customers.length)];
      const mode = paymentModes[Math.floor(Math.random() * paymentModes.length)];

      // Pick 1 to 3 random products
      const numItems = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, numItems);

      let subtotal = 0;
      const itemsToInsert = [];

      for (const prod of selected) {
        const qty = Math.floor(Math.random() * 2) + 1;
        const lineTotal = +(prod.price * qty).toFixed(2);
        subtotal += lineTotal;
        itemsToInsert.push({
          id: 'item_' + crypto.randomUUID().slice(0, 8),
          product_id: prod.id,
          product_title: prod.title,
          barcode_isbn: prod.barcode_isbn,
          quantity: qty,
          unit_price: prod.price,
          subtotal: lineTotal
        });
      }

      subtotal = +subtotal.toFixed(2);
      const tax = +(subtotal * 0.05).toFixed(2); // 5% GST/Sales tax
      const discount = Math.random() > 0.7 ? 5.0 : 0.0;
      const total = +(subtotal + tax - discount).toFixed(2);

      const saleId = 'sale_' + crypto.randomUUID().slice(0, 8);
      const billNumber = `FQ-2026-${billCounter++}`;

      run(
        `INSERT INTO sales (
          id, bill_number, customer_id, cashier_id, subtotal, tax_amount, 
          discount_amount, total_amount, payment_mode, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          saleId,
          billNumber,
          customer.id,
          'usr_cashier',
          subtotal,
          tax,
          discount,
          total,
          mode,
          'Completed',
          saleDate.toISOString()
        ]
      );

      for (const it of itemsToInsert) {
        run(
          `INSERT INTO sale_items (
            id, sale_id, product_id, product_title, barcode_isbn, quantity, unit_price, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [it.id, saleId, it.product_id, it.product_title, it.barcode_isbn, it.quantity, it.unit_price, it.subtotal]
        );
      }
    }
  }

  console.log('Seed completed successfully: users, suppliers, catalog, customers, and historical sales initialized.');
}

module.exports = { seedDatabase };
