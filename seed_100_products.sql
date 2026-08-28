-- ==============================================================================
-- 100 POPULAR INDIAN FMCG / GROCERY PRODUCTS FOR COUNTERPOINT POS
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/llfswnxyjxxvvzxokrrs/sql/new
-- ==============================================================================

INSERT INTO public.products (barcode, name, price, stock, category)
VALUES
    -- 🌾 STAPLES & GRAINS (1-15)
    ('8901030894501', 'Tata Salt 1kg', 28.00, 200, 'Staples'),
    ('8901030894502', 'Tata Salt Lite (Low Sodium) 1kg', 45.00, 100, 'Staples'),
    ('8901030000003', 'Aashirvaad Superior MP Atta 5kg', 275.00, 60, 'Staples'),
    ('8901030000004', 'Aashirvaad Select Sharbati Atta 5kg', 340.00, 40, 'Staples'),
    ('8901030000005', 'Fortune Chakki Fresh Atta 5kg', 245.00, 50, 'Staples'),
    ('8901030000006', 'Daawat Rozana Super Basmati Rice 5kg', 399.00, 35, 'Staples'),
    ('8901030000007', 'India Gate Basmati Rice Feast Rozzana 5kg', 460.00, 30, 'Staples'),
    ('8901030000008', 'Tata Sampann Unpolished Toor Dal 1kg', 185.00, 80, 'Staples'),
    ('8901030000009', 'Tata Sampann Moong Dal 1kg', 160.00, 75, 'Staples'),
    ('8901030000010', 'Tata Sampann Chana Dal 1kg', 125.00, 90, 'Staples'),
    ('8901030000011', 'Madhur Pure & Hygienic Sugar 1kg', 55.00, 150, 'Staples'),
    ('8901030000012', 'Madhur Pure & Hygienic Sugar 5kg', 260.00, 40, 'Staples'),
    ('8901030000013', 'Fortune Sunlite Sunflower Oil 1L', 155.00, 100, 'Oils & Ghee'),
    ('8901030000014', 'Fortune Kachi Ghani Mustard Oil 1L', 165.00, 80, 'Oils & Ghee'),
    ('8901030000015', 'Saffola Gold Pro Healthy Lifestyle Oil 1L', 190.00, 70, 'Oils & Ghee'),

    -- 🧈 DAIRY & GHEE (16-28)
    ('8901063012345', 'Amul Taaza Homogenised Milk 1L', 64.00, 90, 'Dairy'),
    ('8901063000017', 'Amul Gold Full Cream Milk 1L', 74.00, 80, 'Dairy'),
    ('8901063000018', 'Amul Salted Butter 100g', 56.00, 120, 'Dairy'),
    ('8901063000019', 'Amul Salted Butter 500g', 275.00, 60, 'Dairy'),
    ('8901063000020', 'Amul Pasteurized White Butter 500g', 285.00, 30, 'Dairy'),
    ('8901063000021', 'Amul Pure Ghee Ceecon 1L', 630.00, 45, 'Oils & Ghee'),
    ('8901063000022', 'Amul Malai Paneer 200g', 92.00, 50, 'Dairy'),
    ('8901063000023', 'Amul Processed Cheese Cubes 200g', 135.00, 60, 'Dairy'),
    ('8901063000024', 'Amul Cheese Slices 200g (10 Slices)', 145.00, 70, 'Dairy'),
    ('8901063000025', 'Amul Masti Dahi Pouch 400g', 35.00, 80, 'Dairy'),
    ('8901063000026', 'Mother Dairy Classic Dahi 400g', 35.00, 75, 'Dairy'),
    ('8901063000027', 'Mother Dairy Cow Ghee 1L', 670.00, 35, 'Oils & Ghee'),
    ('8901063000028', 'Britannia 100% Whole Wheat Bread 400g', 45.00, 40, 'Bakery'),

    -- 🍪 SNACKS & BISCUITS (29-45)
    ('8901725111106', 'Parle-G Gold Glucose Biscuits 1kg', 80.00, 150, 'Snacks'),
    ('8901725000030', 'Parle Monaco Salted Crackers 200g', 35.00, 110, 'Snacks'),
    ('8901725000031', 'Parle Krackjack Sweet & Salty 200g', 35.00, 100, 'Snacks'),
    ('8901725000032', 'Parle Hide & Seek Chocolate Chip 120g', 40.00, 90, 'Snacks'),
    ('8901063000033', 'Britannia Good Day Cashew 200g', 45.00, 130, 'Snacks'),
    ('8901063000034', 'Britannia Good Day Butter 200g', 40.00, 120, 'Snacks'),
    ('8901063000035', 'Britannia Marie Gold 300g', 42.00, 140, 'Snacks'),
    ('8901063000036', 'Britannia Bourbon Cream Biscuits 150g', 35.00, 95, 'Snacks'),
    ('8901063000037', 'Oreo Vanilla Creme Biscuits 120g', 40.00, 110, 'Snacks'),
    ('8901063000038', 'Sunfeast Dark Fantasy Choco Fills 300g', 120.00, 70, 'Snacks'),
    ('8901499000039', 'Lays India''s Magic Masala Chips 50g', 20.00, 180, 'Snacks'),
    ('8901499000040', 'Lays American Style Cream & Onion 50g', 20.00, 175, 'Snacks'),
    ('8901499000041', 'Kurkure Masala Munch 85g', 20.00, 200, 'Snacks'),
    ('8901499000042', 'Haldiram''s Nagpur Aloo Bhujia 400g', 110.00, 85, 'Snacks'),
    ('8901499000043', 'Haldiram''s Nagpur Bhujia Sev 400g', 110.00, 80, 'Snacks'),
    ('8901499000044', 'Haldiram''s Khatta Meetha Mixture 400g', 105.00, 75, 'Snacks'),
    ('8901499000045', 'Haldiram''s Salted Peanuts 200g', 55.00, 90, 'Snacks'),

    -- 🍜 NOODLES, PASTA & BREAKFAST (46-56)
    ('8901058000046', 'Maggi 2-Minute Masala Noodles 280g (4 Pack)', 56.00, 160, 'Instant Food'),
    ('8901058000047', 'Maggi 2-Minute Masala Noodles Family Pack 560g', 110.00, 90, 'Instant Food'),
    ('8901058000048', 'Yippee Magic Masala Noodles 240g (4 Pack)', 52.00, 100, 'Instant Food'),
    ('8901058000049', 'Kissan Fresh Tomato Ketchup 1kg Pouch', 120.00, 80, 'Spreads & Sauces'),
    ('8901058000050', 'Maggi Rich Tomato Ketchup Bottle 500g', 90.00, 85, 'Spreads & Sauces'),
    ('8901058000051', 'Kellogg''s Corn Flakes Original 500g', 185.00, 50, 'Breakfast'),
    ('8901058000052', 'Kellogg''s Chocos 375g', 170.00, 60, 'Breakfast'),
    ('8901058000053', 'Quaker Rolled Oats 1kg', 190.00, 55, 'Breakfast'),
    ('8901058000054', 'Saffola Masala Oats Classic Masala 400g', 175.00, 65, 'Breakfast'),
    ('8901058000055', 'Pintola All Natural Peanut Butter Creamy 1kg', 425.00, 30, 'Spreads & Sauces'),
    ('8901058000056', 'Nutella Hazelnut Spread 350g', 380.00, 40, 'Spreads & Sauces'),

    -- 🥤 BEVERAGES & TEA/COFFEE (57-70)
    ('8901234567890', 'Coca-Cola 750ml PET Bottle', 45.00, 120, 'Beverages'),
    ('8901234000058', 'Thums Up 750ml PET Bottle', 45.00, 130, 'Beverages'),
    ('8901234000059', 'Sprite 750ml PET Bottle', 45.00, 110, 'Beverages'),
    ('8901234000060', 'Limca 750ml PET Bottle', 45.00, 75, 'Beverages'),
    ('8901234000061', 'Pepsi 750ml PET Bottle', 45.00, 90, 'Beverages'),
    ('8901234000062', 'Frooti Mango Drink 1.2L', 65.00, 80, 'Beverages'),
    ('8901234000063', 'Maaza Mango Drink 1.2L', 70.00, 95, 'Beverages'),
    ('8901234000064', 'Real Fruit Power Mixed Fruit Juice 1L', 120.00, 60, 'Beverages'),
    ('8901234000065', 'Red Bull Energy Drink Can 250ml', 125.00, 100, 'Beverages'),
    ('8901234000066', 'Tata Tea Premium 500g', 260.00, 90, 'Beverages'),
    ('8901234000067', 'Tata Tea Gold 500g', 310.00, 75, 'Beverages'),
    ('8901234000068', 'Red Label Tea 500g', 270.00, 85, 'Beverages'),
    ('8901234000069', 'Nescafe Classic Instant Coffee Jar 100g', 320.00, 65, 'Beverages'),
    ('8901234000070', 'Bru Instant Coffee Jar 100g', 240.00, 70, 'Beverages'),

    -- 🍫 CHOCOLATES & CONFECTIONERY (71-80)
    ('8901233000071', 'Cadbury Dairy Milk Silk Chocolate 150g', 175.00, 80, 'Chocolates'),
    ('8901233000072', 'Cadbury Dairy Milk Fruit & Nut 80g', 90.00, 100, 'Chocolates'),
    ('8901233000073', 'Cadbury Dairy Milk Roast Almond 80g', 90.00, 90, 'Chocolates'),
    ('8901233000074', 'Cadbury 5 Star Chocolate Bar 40g', 20.00, 150, 'Chocolates'),
    ('8901233000075', 'Nestle KitKat 4 Finger Chocolate 38.5g', 30.00, 140, 'Chocolates'),
    ('8901233000076', 'Nestle Munch Crunchy Chocolate 25g', 10.00, 200, 'Chocolates'),
    ('8901233000077', 'Snickers Peanut Chocolate Bar 50g', 50.00, 110, 'Chocolates'),
    ('8901233000078', 'Ferrero Rocher Chocolate Box (16 Pcs)', 599.00, 25, 'Chocolates'),
    ('8901233000079', 'Cadbury Gems Surprise Ball', 35.00, 120, 'Chocolates'),
    ('8901233000080', 'Pulse Candy Kachcha Aam Pouch (50 Pcs)', 50.00, 100, 'Chocolates'),

    -- 🧼 PERSONAL CARE & HYGIENE (81-90)
    ('8901030000081', 'Dettol Original Bathing Soap 75g (Buy 3 Get 1)', 140.00, 90, 'Personal Care'),
    ('8901030000082', 'Lifebuoy Total 10 Soap Bar 125g (Pack of 4)', 135.00, 85, 'Personal Care'),
    ('8901030000083', 'Dove Cream Beauty Bathing Bar 100g (Pack of 3)', 210.00, 70, 'Personal Care'),
    ('8901030000084', 'Colgate Strong Teeth Toothpaste 300g (Saver Pack)', 160.00, 100, 'Personal Care'),
    ('8901030000085', 'Close Up Everfresh Red Hot Gel Toothpaste 150g', 115.00, 95, 'Personal Care'),
    ('8901030000086', 'Sensodyne Fresh Mint Sensitive Toothpaste 150g', 220.00, 60, 'Personal Care'),
    ('8901030000087', 'Head & Shoulders Anti-Dandruff Smooth & Silky 340ml', 340.00, 50, 'Personal Care'),
    ('8901030000088', 'Clinic Plus Strong & Long Health Shampoo 340ml', 215.00, 65, 'Personal Care'),
    ('8901030000089', 'Nivea Soft Light Moisturizer Cream 200ml', 299.00, 45, 'Personal Care'),
    ('8901030000090', 'Dettol Instant Hand Sanitizer 200ml', 100.00, 80, 'Personal Care'),

    -- 🧹 HOUSEHOLD & CLEANING (91-100)
    ('8901030000091', 'Surf Excel Quick Wash Detergent Powder 1kg', 145.00, 110, 'Household'),
    ('8901030000092', 'Surf Excel Easy Wash Detergent Powder 1kg', 130.00, 100, 'Household'),
    ('8901030000093', 'Ariel Matic Front Load Detergent Powder 1kg', 240.00, 60, 'Household'),
    ('8901030000094', 'Rin Detergent Bar 250g (Pack of 4)', 75.00, 120, 'Household'),
    ('8901030000095', 'Vim Dishwash Gel Lemon 750ml Bottle', 155.00, 90, 'Household'),
    ('8901030000096', 'Vim Dishwash Bar 300g Tub', 35.00, 150, 'Household'),
    ('8901030000097', 'Harpic Power Plus Disinfectant Toilet Cleaner 1L', 195.00, 85, 'Household'),
    ('8901030000098', 'Lizol Disinfectant Floor Cleaner Citrus 1L', 215.00, 80, 'Household'),
    ('8901030000099', 'Colin Glass and Surface Cleaner Spray 500ml', 105.00, 75, 'Household'),
    ('8901030000100', 'Good Knight Gold Flash Mosquito Refill (Twin Pack)', 160.00, 100, 'Household')

ON CONFLICT (barcode) DO UPDATE
SET 
    name = EXCLUDED.name, 
    price = EXCLUDED.price, 
    stock = EXCLUDED.stock, 
    category = EXCLUDED.category;

