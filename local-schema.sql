PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE cuisines (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, description TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, slug TEXT, css_class TEXT DEFAULT 'cuisine-other');
INSERT INTO cuisines VALUES(1,'Chinese','Traditional Chinese cuisine with diverse regional flavors','2025-07-25 17:08:39','2025-07-25 17:08:39','chinese','cuisine-chinese');
INSERT INTO cuisines VALUES(2,'Italian','Classic Italian dishes featuring pasta, pizza, and Mediterranean ingredients','2025-07-25 17:09:35','2025-07-25 17:09:35','italian','cuisine-italian');
INSERT INTO cuisines VALUES(3,'French','Elegant French cuisine known for its techniques and refined flavors','2025-07-25 17:09:35','2025-07-25 17:09:35','french','cuisine-french');
INSERT INTO cuisines VALUES(4,'Indian','Spicy and aromatic Indian dishes with complex spice blends','2025-07-25 17:09:35','2025-07-25 17:09:35','indian','cuisine-indian');
INSERT INTO cuisines VALUES(5,'Japanese','Traditional Japanese cuisine emphasizing fresh ingredients and presentation','2025-07-25 17:09:35','2025-07-25 17:09:35','japanese','cuisine-japanese');
INSERT INTO cuisines VALUES(6,'Mediterranean','Healthy Mediterranean diet with olive oil, vegetables, and seafood','2025-07-25 17:09:35','2025-07-25 17:09:35','mediterranean','cuisine-mediterranean');
INSERT INTO cuisines VALUES(7,'Thai','Bold Thai flavors balancing sweet, sour, salty, and spicy elements','2025-07-25 17:09:35','2025-07-25 17:09:35','thai','cuisine-thai');
INSERT INTO cuisines VALUES(8,'Mexican','Vibrant Mexican cuisine with corn, beans, chili peppers, and fresh herbs','2025-07-25 17:09:35','2025-07-25 17:09:35','mexican','cuisine-mexican');
INSERT INTO cuisines VALUES(9,'Others','Fusion and miscellaneous cuisines that don''t fit into traditional categories, including modern fusion dishes, experimental recipes, and international combinations','2025-08-05 07:51:36','2025-08-05 07:51:36','others','cuisine-other');
CREATE TABLE languages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,           -- 语言代码 (en, zh, fr, es, etc.)
  name TEXT NOT NULL,                  -- 语言名称 (English, 中文, Français, etc.)
  native_name TEXT NOT NULL,           -- 本地语言名称
  is_default BOOLEAN DEFAULT FALSE,    -- 是否为默认语言
  is_active BOOLEAN DEFAULT TRUE,      -- 是否启用
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO languages VALUES(1,'en','English','English',1,1,'2025-07-26 06:31:20','2025-07-26 06:31:20');
INSERT INTO languages VALUES(2,'zh','Chinese','中文',0,1,'2025-07-26 06:31:20','2025-07-26 06:31:20');
CREATE TABLE ingredient_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,           -- URL友好的标识符 (meat, seafood, vegetables, etc.)
  sort_order INTEGER DEFAULT 0,       -- 排序顺序
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
, name TEXT);
INSERT INTO ingredient_categories VALUES(1,'meat',1,'2025-07-26 06:31:20','2025-07-26 06:31:20','Meat');
INSERT INTO ingredient_categories VALUES(2,'seafood',2,'2025-07-26 06:31:20','2025-07-26 06:31:20','Seafood');
INSERT INTO ingredient_categories VALUES(3,'vegetables',3,'2025-07-26 06:31:20','2025-07-26 06:31:20','Vegetables');
INSERT INTO ingredient_categories VALUES(4,'fruits',4,'2025-07-26 06:31:20','2025-07-26 06:31:20','Fruits');
INSERT INTO ingredient_categories VALUES(5,'dairy-eggs',5,'2025-07-26 06:31:20','2025-07-26 06:31:20','Dairy & Eggs');
INSERT INTO ingredient_categories VALUES(6,'grains-bread',6,'2025-07-26 06:31:20','2025-07-26 06:31:20','Grains & Bread');
INSERT INTO ingredient_categories VALUES(7,'nuts-seeds',7,'2025-07-26 06:31:20','2025-07-26 06:31:20','Nuts & Seeds');
INSERT INTO ingredient_categories VALUES(8,'herbs-spices',8,'2025-07-26 06:31:20','2025-07-26 06:31:20','Herbs & Spices');
CREATE TABLE ingredient_categories_i18n (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  language_code TEXT NOT NULL,
  name TEXT NOT NULL,                  -- 分类名称
  description TEXT,                    -- 分类描述
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES ingredient_categories(id) ON DELETE CASCADE,
  FOREIGN KEY (language_code) REFERENCES languages(code) ON DELETE CASCADE,
  UNIQUE(category_id, language_code)
);
INSERT INTO ingredient_categories_i18n VALUES(2,1,'zh','肉类','新鲜和加工肉制品','2025-07-26 06:31:20','2025-07-26 06:31:20');
INSERT INTO ingredient_categories_i18n VALUES(4,2,'zh','海鲜','鱼类、贝类和其他海产品','2025-07-26 06:31:20','2025-07-26 06:31:20');
INSERT INTO ingredient_categories_i18n VALUES(6,3,'zh','蔬菜','新鲜蔬菜和绿叶菜','2025-07-26 06:31:20','2025-07-26 06:31:20');
INSERT INTO ingredient_categories_i18n VALUES(8,4,'zh','水果','新鲜和干制水果','2025-07-26 06:31:20','2025-07-26 06:31:20');
INSERT INTO ingredient_categories_i18n VALUES(10,5,'zh','乳品和蛋类','奶制品和鸡蛋','2025-07-26 06:31:20','2025-07-26 06:31:20');
INSERT INTO ingredient_categories_i18n VALUES(12,6,'zh','谷物和面包','谷类、粮食和面包制品','2025-07-26 06:31:20','2025-07-26 06:31:20');
INSERT INTO ingredient_categories_i18n VALUES(14,7,'zh','坚果和种子','树坚果、种子和豆类','2025-07-26 06:31:20','2025-07-26 06:31:20');
INSERT INTO ingredient_categories_i18n VALUES(16,8,'zh','香草和香料','新鲜和干制香草香料','2025-07-26 06:31:20','2025-07-26 06:31:20');
CREATE TABLE cuisines_i18n (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cuisine_id INTEGER NOT NULL,
  language_code TEXT NOT NULL,
  name TEXT NOT NULL,                  -- 菜系名称
  description TEXT,                    -- 菜系描述
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')), slug TEXT,
  FOREIGN KEY (cuisine_id) REFERENCES cuisines(id) ON DELETE CASCADE,
  FOREIGN KEY (language_code) REFERENCES languages(code) ON DELETE CASCADE,
  UNIQUE(cuisine_id, language_code)
);
INSERT INTO cuisines_i18n VALUES(2,1,'zh','中式','具有多样地方风味的传统中国菜','2025-07-26 06:31:20','2025-07-26 06:31:20','chinese');
INSERT INTO cuisines_i18n VALUES(4,2,'zh','意式','以意大利面、披萨和地中海食材为特色的经典意大利菜','2025-07-26 06:31:20','2025-07-26 06:31:20','italian');
INSERT INTO cuisines_i18n VALUES(6,3,'zh','法式','以精湛技艺和精致口味著称的优雅法国菜','2025-07-26 06:31:20','2025-07-26 06:31:20','french');
INSERT INTO cuisines_i18n VALUES(8,4,'zh','印式','香辣芳香的印度菜，具有复杂的香料组合','2025-07-26 06:31:20','2025-07-26 06:31:20','indian');
INSERT INTO cuisines_i18n VALUES(10,5,'zh','日式','强调新鲜食材和摆盘的传统日本料理','2025-07-26 06:31:20','2025-07-26 06:31:20','japanese');
INSERT INTO cuisines_i18n VALUES(12,6,'zh','地中海式','以橄榄油、蔬菜和海鲜为主的健康地中海饮食','2025-07-26 06:31:20','2025-07-26 06:31:20','mediterranean');
INSERT INTO cuisines_i18n VALUES(14,7,'zh','泰式','平衡甜、酸、咸、辣元素的浓郁泰式风味','2025-07-26 06:31:20','2025-07-26 06:31:20','thai');
INSERT INTO cuisines_i18n VALUES(16,8,'zh','墨西哥式','以玉米、豆类、辣椒和新鲜香草为特色的活力墨西哥菜','2025-07-26 06:31:20','2025-07-26 06:31:20','mexican');
INSERT INTO cuisines_i18n VALUES(17,9,'zh','其他','融合菜系和杂项菜系，包括现代融合菜品、实验性食谱和国际组合，不适合传统分类的菜系','2025-08-05 07:51:36','2025-08-05 07:51:36','others');
CREATE TABLE ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  category_id INTEGER,
  nutritional_info TEXT,
  allergen_info TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')), name TEXT,
  FOREIGN KEY (category_id) REFERENCES ingredient_categories(id)
);
INSERT INTO ingredients VALUES(1,'bacon',1,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Bacon');
INSERT INTO ingredients VALUES(2,'chicken_breast',1,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Chicken breast');
INSERT INTO ingredients VALUES(3,'chicken_leg',1,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Chicken leg');
INSERT INTO ingredients VALUES(4,'chicken_wing',1,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Chicken wing');
INSERT INTO ingredients VALUES(5,'ground_beef',1,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Ground beef');
INSERT INTO ingredients VALUES(6,'ham',1,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Ham');
INSERT INTO ingredients VALUES(7,'lamb',1,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Lamb');
INSERT INTO ingredients VALUES(8,'liver',1,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Liver');
INSERT INTO ingredients VALUES(9,'pork',1,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Pork');
INSERT INTO ingredients VALUES(10,'ribs',1,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Ribs');
INSERT INTO ingredients VALUES(11,'sausage',1,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Sausage');
INSERT INTO ingredients VALUES(12,'steak',1,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Steak');
INSERT INTO ingredients VALUES(13,'anchovy',2,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Anchovie');
INSERT INTO ingredients VALUES(14,'cod',2,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Cod');
INSERT INTO ingredients VALUES(15,'crab',2,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Crab');
INSERT INTO ingredients VALUES(16,'crawfish',2,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Crawfish');
INSERT INTO ingredients VALUES(17,'lobster',2,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Lobster');
INSERT INTO ingredients VALUES(18,'mussel',2,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Mussel');
INSERT INTO ingredients VALUES(19,'oyster',2,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Oyster');
INSERT INTO ingredients VALUES(20,'salmon',2,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Salmon');
INSERT INTO ingredients VALUES(21,'sardine',2,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Sardine');
INSERT INTO ingredients VALUES(22,'scallop',2,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Scallop');
INSERT INTO ingredients VALUES(23,'shrimp',2,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Shrimp');
INSERT INTO ingredients VALUES(24,'squid',2,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Squid');
INSERT INTO ingredients VALUES(25,'trout',2,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Trout');
INSERT INTO ingredients VALUES(26,'tuna',2,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Tuna');
INSERT INTO ingredients VALUES(27,'asparagus',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Asparagus');
INSERT INTO ingredients VALUES(28,'bell_pepper',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Bell pepper');
INSERT INTO ingredients VALUES(29,'broccoli',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Broccoli');
INSERT INTO ingredients VALUES(30,'cabbage',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Cabbage');
INSERT INTO ingredients VALUES(31,'carrot',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Carrot');
INSERT INTO ingredients VALUES(32,'cauliflower',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Cauliflower');
INSERT INTO ingredients VALUES(33,'celery',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Celery');
INSERT INTO ingredients VALUES(34,'corn',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Corn');
INSERT INTO ingredients VALUES(35,'cucumber',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Cucumber');
INSERT INTO ingredients VALUES(36,'eggplant',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Eggplant');
INSERT INTO ingredients VALUES(37,'garlic',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Garlic');
INSERT INTO ingredients VALUES(38,'green_bean',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Green bean');
INSERT INTO ingredients VALUES(39,'kale',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Kale');
INSERT INTO ingredients VALUES(40,'lettuce',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Lettuce');
INSERT INTO ingredients VALUES(41,'mushroom',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Mushroom');
INSERT INTO ingredients VALUES(42,'onion',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Onion');
INSERT INTO ingredients VALUES(43,'pea',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Pea');
INSERT INTO ingredients VALUES(44,'pepper',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Pepper');
INSERT INTO ingredients VALUES(45,'potato',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Potato');
INSERT INTO ingredients VALUES(46,'pumpkin',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Pumpkin');
INSERT INTO ingredients VALUES(47,'radish',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Radish');
INSERT INTO ingredients VALUES(48,'spinach',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Spinach');
INSERT INTO ingredients VALUES(49,'sweet_potato',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Sweet potato');
INSERT INTO ingredients VALUES(50,'tomato',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Tomato');
INSERT INTO ingredients VALUES(51,'zucchini',3,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Zucchini');
INSERT INTO ingredients VALUES(52,'apple',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Apple');
INSERT INTO ingredients VALUES(53,'avocado',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Avocado');
INSERT INTO ingredients VALUES(54,'banana',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Banana');
INSERT INTO ingredients VALUES(55,'blueberry',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Blueberry');
INSERT INTO ingredients VALUES(56,'cantaloupe',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Cantaloupe');
INSERT INTO ingredients VALUES(57,'cherry',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Cherry');
INSERT INTO ingredients VALUES(58,'coconut',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Coconut');
INSERT INTO ingredients VALUES(59,'grape',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Grape');
INSERT INTO ingredients VALUES(60,'grapefruit',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Grapefruit');
INSERT INTO ingredients VALUES(61,'kiwi',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Kiwi');
INSERT INTO ingredients VALUES(62,'lemon',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Lemon');
INSERT INTO ingredients VALUES(63,'lime',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Lime');
INSERT INTO ingredients VALUES(64,'mango',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Mango');
INSERT INTO ingredients VALUES(65,'orange',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Orange');
INSERT INTO ingredients VALUES(66,'papaya',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Papaya');
INSERT INTO ingredients VALUES(67,'peach',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Peach');
INSERT INTO ingredients VALUES(68,'pear',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Pear');
INSERT INTO ingredients VALUES(69,'pineapple',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Pineapple');
INSERT INTO ingredients VALUES(70,'plum',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Plum');
INSERT INTO ingredients VALUES(71,'raspberry',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Raspberry');
INSERT INTO ingredients VALUES(72,'strawberry',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Strawberry');
INSERT INTO ingredients VALUES(73,'watermelon',4,NULL,NULL,'2025-07-26 06:32:54','2025-07-26 06:32:54','Watermelon');
INSERT INTO ingredients VALUES(74,'butter',5,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Butter');
INSERT INTO ingredients VALUES(75,'cheese',5,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Cheese');
INSERT INTO ingredients VALUES(76,'cottage_cheese',5,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Cottage cheese');
INSERT INTO ingredients VALUES(77,'cream',5,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Cream');
INSERT INTO ingredients VALUES(78,'egg',5,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Egg');
INSERT INTO ingredients VALUES(79,'milk',5,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Milk');
INSERT INTO ingredients VALUES(80,'yogurt',5,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Yogurt');
INSERT INTO ingredients VALUES(81,'bread',6,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Bread');
INSERT INTO ingredients VALUES(82,'brown_rice',6,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Brown rice');
INSERT INTO ingredients VALUES(83,'oatmeal',6,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Oatmeal');
INSERT INTO ingredients VALUES(84,'pasta',6,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Pasta');
INSERT INTO ingredients VALUES(85,'quinoa',6,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Quinoa');
INSERT INTO ingredients VALUES(86,'white_rice',6,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','White rice');
INSERT INTO ingredients VALUES(87,'almond',7,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Almond');
INSERT INTO ingredients VALUES(88,'cashew',7,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Cashew');
INSERT INTO ingredients VALUES(89,'peanut',7,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Peanut');
INSERT INTO ingredients VALUES(90,'pecan',7,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Pecan');
INSERT INTO ingredients VALUES(91,'walnut',7,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Walnut');
INSERT INTO ingredients VALUES(92,'basil',8,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Basil');
INSERT INTO ingredients VALUES(93,'cilantro',8,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Cilantro');
INSERT INTO ingredients VALUES(94,'cinnamon',8,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Cinnamon');
INSERT INTO ingredients VALUES(95,'garlic_powder',8,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Garlic powder');
INSERT INTO ingredients VALUES(96,'ginger',8,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Ginger');
INSERT INTO ingredients VALUES(97,'mint',8,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Mint');
INSERT INTO ingredients VALUES(98,'oregano',8,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Oregano');
INSERT INTO ingredients VALUES(99,'parsley',8,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Parsley');
INSERT INTO ingredients VALUES(100,'rosemary',8,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Rosemary');
INSERT INTO ingredients VALUES(101,'thyme',8,NULL,NULL,'2025-07-26 07:10:20','2025-07-26 07:10:20','Thyme');
INSERT INTO ingredients VALUES(111,'american_leek',3,NULL,NULL,'2025-07-27 02:46:05','2025-07-27 02:46:05','American leek');
INSERT INTO ingredients VALUES(113,'yam',3,NULL,NULL,'2025-08-13 15:41:04','2025-08-13 15:41:04','Yam');
CREATE TABLE IF NOT EXISTS "user_credits" (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  credits INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT INTO user_credits VALUES('admin_user_credits','157b6650-29b8-4613-87d9-ce0997106151',999999,999999,0,'2025-07-28 06:33:55','2025-07-28 07:19:30');
INSERT INTO user_credits VALUES('CREDIT-20250730092450-554D85B0','024f80a8-6b82-4873-bd82-9032ecab6119',40,150,105,'2025-07-30 09:24:50','2025-08-20 05:18:01');
INSERT INTO user_credits VALUES('txn-MKBDNUhAHQ3M6hVP-me9wbgsy','65292a9e-50e2-4c19-bcce-3a277811136d',97,100,3,'2025-08-13 11:37:21','2025-08-13 11:38:18');
CREATE TABLE credit_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user_credits(user_id)
);
INSERT INTO credit_transactions VALUES('admin_initial_credits','157b6650-29b8-4613-87d9-ce0997106151','earn',999999,'admin_grant','Admin user with unlimited credits','2025-07-28 06:34:11');
INSERT INTO credit_transactions VALUES('TXN-1754758869276-C7InYE','024f80a8-6b82-4873-bd82-9032ecab6119','spend',1,'generation','Image generation','2025-08-09 17:01:09');
INSERT INTO credit_transactions VALUES('txn-qm4e8sHDibL3VUUg-me7ahuon','024f80a8-6b82-4873-bd82-9032ecab6119','spend',1,'generation','Image generation','2025-08-11 15:50:55');
INSERT INTO credit_transactions VALUES('txn-RuseVGDEwxmqMVih-me858bc6','024f80a8-6b82-4873-bd82-9032ecab6119','spend',1,'generation','Image generation','2025-08-12 06:11:18');
INSERT INTO credit_transactions VALUES('txn-0eoWz2ftBkf2RvwP-me858vu3','024f80a8-6b82-4873-bd82-9032ecab6119','spend',1,'generation','Image generation','2025-08-12 06:11:44');
INSERT INTO credit_transactions VALUES('txn-GJaL5RMW4p1wUUFY-me9rpgk7','024f80a8-6b82-4873-bd82-9032ecab6119','spend',1,'generation','Image generation','2025-08-13 09:28:15');
INSERT INTO credit_transactions VALUES('txn-GgAFjjhiGbBFNzhG-me9rq94z','024f80a8-6b82-4873-bd82-9032ecab6119','spend',1,'generation','Image generation','2025-08-13 09:28:52');
INSERT INTO credit_transactions VALUES('txn-Dh4opvn4hnrVTcpc-me9rvrx8','024f80a8-6b82-4873-bd82-9032ecab6119','spend',1,'generation','Image generation','2025-08-13 09:33:10');
INSERT INTO credit_transactions VALUES('txn-5VjGQoSSjtHFr4zW-me9rxrur','024f80a8-6b82-4873-bd82-9032ecab6119','spend',1,'generation','Image generation','2025-08-13 09:34:43');
INSERT INTO credit_transactions VALUES('txn-Q28SmxiPoM4Ylb0u-me9wcal9','65292a9e-50e2-4c19-bcce-3a277811136d','spend',1,'generation','Image generation','2025-08-13 11:37:59');
INSERT INTO credit_transactions VALUES('txn-DpAH1HBDDxskQJNN-me9wcjb4','65292a9e-50e2-4c19-bcce-3a277811136d','spend',1,'generation','Image generation','2025-08-13 11:38:11');
INSERT INTO credit_transactions VALUES('txn-u1fwuQTk19AmZvSZ-me9wcowl','65292a9e-50e2-4c19-bcce-3a277811136d','spend',1,'generation','Image generation','2025-08-13 11:38:18');
INSERT INTO credit_transactions VALUES('txn-92gCjx9CkImn20PZ-mebatl79','024f80a8-6b82-4873-bd82-9032ecab6119','spend',1,'generation','Image generation','2025-08-14 11:11:07');
INSERT INTO credit_transactions VALUES('txn-cZiURXxOtgjWDS6G-mefb7lkc','024f80a8-6b82-4873-bd82-9032ecab6119','spend',1,'generation','Image generation','2025-08-17 06:33:05');
INSERT INTO credit_transactions VALUES('c4e72f03-6942-44e8-b9f0-01d402fd8c14','024f80a8-6b82-4873-bd82-9032ecab6119','spend',1,'generation','Image generation','2025-08-20 05:18:01');
CREATE TABLE system_configs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO system_configs VALUES('initial_credits','100','新用户初始积分','2025-07-29 05:04:23');
INSERT INTO system_configs VALUES('generation_cost','1','生成一个菜谱的积分消耗','2025-07-29 05:04:23');
INSERT INTO system_configs VALUES('admin_unlimited','true','管理员是否拥有无限积分','2025-07-29 05:04:23');
INSERT INTO system_configs VALUES('admin_id','157b6650-29b8-4613-87d9-ce0997106151',NULL,'2025-08-05 08:22:50');
CREATE TABLE recipes_i18n (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id TEXT NOT NULL,
  language_code TEXT NOT NULL,
  title TEXT,
  description TEXT,
  ingredients TEXT,
  seasoning TEXT,
  instructions TEXT,
  chef_tips TEXT,
  tags TEXT,
  difficulty TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  UNIQUE(recipe_id, language_code)
);
INSERT INTO recipes_i18n VALUES(25,'recipe-mdils01c-sskk','zh','Skibidi Slicers','准备好随Skibidi切片三明治起飞吧——在温馨治愈系电影宇宙中生活的你，绝对值得拥有这款主角级美食。黏糊酥脆又魔性十足，这款三明治不仅是食物，更是一种氛围感。咬上一口，瞬间坠入文艺慢镜头：你凝视窗外，搭配着额外芝士思考人生','["厚切酸面包","马苏里拉奶酪碎","车打奶酪","奶油奶酪","黄油","蛋黄酱"]','["蒜粉","烟熏红椒粉","盐","现磨黑胡椒"]','["在小碗中混合奶油奶酪、蒜粉、红椒粉和少许盐", "给每片面包的一面抹上黄油，另一面涂蛋黄酱", "将涂蛋黄酱的那面朝下放入煎锅，依次铺上车打奶酪和马苏里拉奶酪碎", "在顶层面包片（黄油面朝上）涂抹奶油奶酪混合物", "中火每面煎3-4分钟，直至金黄且奶酪融化", "静置1分钟后对角切开，增强视觉效果", "可选：慢慢拉丝制造电影感芝士拉丝效果"]','["使用酸面包才能获得最佳酥脆口感", "混合多种奶酪可带来层次风味和更好融化效果", "别省略蛋黄酱——它能形成更酥脆的金黄外皮", "切片前静置片刻，避免奶酪过早流失", "搭配低保真音乐和毛毯享用风味更佳"]','["治愈系美食", "元气满满", "主角光环"]','简单','2025-08-09 06:18:51','2025-08-09 06:18:51');
INSERT INTO recipes_i18n VALUES(26,'recipe-mdils01c-0ctp','zh','麻婆豆腐','一道经典的四川菜，以嫩滑的豆腐和香辣的豆瓣酱为特色','["500克嫩豆腐，切成1英寸见方的块","200克猪肉馅","2汤匙郫县豆瓣酱","1汤匙辣椒油","2瓣大蒜，切末","1茶匙生姜，切末","2根小葱，白绿分开切","1汤匙生抽","1茶匙糖","1/2杯水或高汤","1汤匙淀粉加2汤匙水调成芡汁","植物油适量"]','["盐适量","白胡椒粉适量","花椒粉1茶匙"]','["锅中加盐水轻沸，放入豆腐块焯水2分钟去豆腥味，沥干备用。","炒锅或大不粘锅中火加热1汤匙植物油。","放入猪肉馅炒至变色散开，约2-3分钟。","将肉推至锅的一边，中间放入郫县豆瓣酱和辣椒油，炒30秒至香味扑鼻。","加入蒜末、姜末和葱白段，再炒30秒。","倒入生抽、糖和水或高汤，搅拌均匀。","轻轻放入焯过的豆腐块，小心翻拌使豆腐裹上调料但不要弄破，焖煮3-4分钟。","重新搅拌淀粉芡汁，倒入锅中轻轻搅拌至汤汁变稠呈光泽状，约1分钟。","离火，立即撒上花椒粉和葱绿段。","配白米饭热食享用。"]','["使用正宗的郫县豆瓣酱可获得地道风味。","豆腐要选用嫩豆腐，口感更佳。","焯水可以去除豆腐的豆腥味并防止烹饪时破碎。","花椒粉要在最后撒，保持麻味。"]','["四川菜","辣","主菜"]','中等','2025-08-08 17:51:48','2025-08-08 17:51:48');
INSERT INTO recipes_i18n VALUES(27,'recipe-mdikyxqo-5y33','zh','意大利培根蛋面','经典的意大利面条，配以培根、鸡蛋和奶酪','["200克意大利面条","100克培根或鸟肉(切丁)","2个大鸡蛋","50克羊奶酪(磨碎)","50克帕马森奶酪(磨碎)","2瓣大蒜(切末,可选)","现磨黑胡椒","煮面用盐"]','["现磨黑胡椒(大量)","海盐","特级初榨橄榄油(可选)"]','["大锅加盐水煮沸，按包装说明煮意大利面至半熟状态。","煮面的同时，大平底锅中火加热，放入培根煎至酥脆，约5分钟。","在碗中打散鸡蛋，加入磨碎的奶酪和大量黑胡椒拌匀。","面条煮好前预留1/2杯面汤，然后沥干面条。","快速将热面条加入有培根的平底锅中，离火。","立即倒入蛋液奶酪混合物，用夹子快速搅拌。余热将把鸡蛋煮成奶油状酱汁。","根据需要加入少量面汤，调至丝滑状态。","立即装盘，撒上额外的奶酪和现磨黑胡椒享用。"]','["正宗的卡博纳拉绝不加奶油——奶油质感完全来自鸡蛋和奶酪。","避免炒蛋的关键是倒入蛋液前要先离火。","传统用鸟肉(腌制猪颊肉)，但培根或厚切熏肉也可以替代。","记得留面汤——它的淀粉质地有助于制作附着在面条上的丝滑酱汁。"]','["意大利菜","面条","主菜"]','简单','2025-08-08 17:52:05','2025-08-08 17:52:05');
INSERT INTO recipes_i18n VALUES(28,'recipe-mdils01c-u26g','zh','普罗旺斯炖菜','法式蔬菜炖菜，色彩丰富营养美味','["1个茄子，切片","1个西葫芦，切片","1个黄南瓜，切片","1个红甜椒，切片","2个番茄，切片","1个洋葱，切碎","2瓣大蒜，切末","400克罐装番茄碎","2汤匙橄榄油","1茶匙干百里香","盐和黑胡椒适量","新鲜罗勒叶装饰"]','["盐和黑胡椒适量","普罗旺斯香草","月桂叶","辣椒片(可选)"]','["烤箱预热至190°C。","平底锅中加热1汤匙橄榄油，炒洋葱和大蒜至软身，然后加入番茄碎、百里香、盐和胡椒，焖煮10分钟。","将番茄酱汁铺在烤盘底部。","将切好的蔬菜片(茄子、西葫芦、南瓜、甜椒、番茄)交替排列在酱汁上。","在蔬菜上淋剩余的橄榄油，撒更多百里香和胡椒。","用锡纸覆盖烤30分钟，然后揭开锡纸再烤15分钟至蔬菜软嫩。","上桌前用新鲜罗勒叶装饰。"]','["使用切菜器切出均匀的蔬菜片，准备更快。","上桌前静置10分钟可增强风味。","热食或室温食用都很棒。","加少许辣椒片可带来微妙的辣味。"]','["法国菜","蔬菜","健康"]','中等','2025-08-08 17:52:05','2025-08-08 17:52:05');
INSERT INTO recipes_i18n VALUES(29,'recipe-mdils01c-g2ti','zh','印度黄油鸡','奶香浓郁的番茄香料咖喱配嫩滑鸡肉，是北印度经典菜肴，搭配米饭或印度饼享用。','["500克去骨鸡腿肉，切块","200克原味酸奶","1汤匙姜蒜泥","1茶匙辣椒粉","2汤匙黄油","1个洋葱，切碎","2瓣大蒜，切末","1茶匙印度综合香料粉","1茶匙孜然粉","1/2茶匙姜黄粉","300克番茄泥","100毫升鲜奶油","新鲜香菜叶","盐适量"]','["克什米尔红辣椒粉","印度综合香料粉","胡芦巴叶(卡苏里叶)","黑胡椒粉","肉豆蔻粉"]','["用酸奶、辣椒粉和姜蒜泥腌制鸡肉至少30分钟。","平底锅加热黄油，炒洋葱至金黄色。加入大蒜和香料，炒至香味溢出。","倒入番茄泥，小火炖煮10分钟。","加入腌制好的鸡肉，煮约15分钟至熟透。","加入鲜奶油，再炖煮5分钟。","用香菜装饰，搭配印度饼或米饭享用。"]','["过夜腌制可获得最佳风味。","使用鸡腿肉口感更嫩滑多汁。","如需调节辣度可加少许糖平衡。","黄油增加浓郁口感——不可省略！"]','["印度菜","咖喱","奶香","香辣"]','中等','2025-08-09 05:55:43','2025-08-09 05:55:43');
INSERT INTO recipes_i18n VALUES(30,'recipe-mdils01c-emg3','zh','日式照烧鸡','鲜嫩鸡肉配甜咸照烧酱汁，搭配蒸米饭，是快手日式料理的经典选择。','["2块鸡腿肉，去骨保留鸡皮","2汤匙生抽","2汤匙味醂","1汤匙清酒","1汤匙糖","1茶匙姜蓉","1茶匙植物油","蒸米饭(配菜)","芝麻和葱花(装饰)"]','["白胡椒粉","蒜粉","香油","米醋(可选)"]','["将生抽、味醂、清酒、糖和姜蓉混合制成照烧酱汁。","平底锅中火加热油，鸡肉皮朝下煎5-6分钟至酥脆。","翻面再煎3分钟。","倒入照烧酱汁，小火煨煮并用勺子不断浇淋鸡肉至上色熟透。","切片装盘，配米饭并撒上芝麻和葱花。"]','["使用带皮鸡肉可获得酥脆口感。","不要让锅子过于拥挤——煎制效果是关键。","可在酱汁中加少许淀粉增加浓稠度。","味醂是正宗风味的关键。"]','["日式","鸡肉","甜味"]','简单','2025-08-09 05:56:00','2025-08-09 05:56:00');
INSERT INTO recipes_i18n VALUES(31,'recipe-mdils01c-2tp2','zh','希腊沙拉','清爽的番茄、黄瓜、橄榄和菲达奶酪搭配，淋上橄榄油和牛至叶调味。','["2个番茄，切成块","1根黄瓜，切片","1/2个红洋葱，切丝","100克菲达奶酪，切块","10颗卡拉马塔橄榄","2汤匙特级初榨橄榄油","1茶匙干牛至叶","盐和黑胡椒适量","1茶匙红酒醋(可选)"]','["粗海盐","现磨黑胡椒","干牛至叶(希腊牛至为佳)","柠檬汁"]','["在大碗中放入番茄、黄瓜、洋葱、橄榄和菲达奶酪。","淋上橄榄油和醋(如使用)。","撒上牛至叶、盐和胡椒，轻轻拌匀。","立即享用或冷藏10分钟后食用。"]','["使用优质橄榄油——口感差别很大。","不要压碎菲达奶酪——块状是传统做法。","红洋葱可用冷水浸泡以减轻辛辣味。","配硬壳面包可作为轻食。"]','["地中海","沙拉","素食","健康"]','简单','2025-08-09 05:56:16','2025-08-09 05:56:16');
INSERT INTO recipes_i18n VALUES(32,'recipe-mdils01c-21ow','zh','泰式炒河粉','酸甜咸香的炒河粉配虾仁、豆腐、花生和新鲜柠檬，经典泰式街头美食。','["150克河粉","100克虾仁，去壳去虾线","50克老豆腐，切块","2汤匙罗望子酱","1汤匙鱼露","1汤匙椰糖或红糖","2瓣大蒜，切末","1个鸡蛋","2汤匙植物油","1/4杯豆芽菜","2汤匙碎花生","切碎的韭菜","柠檬块"]','["白胡椒粉","辣椒片(可选)","泰式罗勒叶","柠檬汁调味"]','["河粉用温水浸泡20分钟至软身。","将罗望子酱、鱼露和糖混合成调味汁。","热锅下油，爆香大蒜。加入豆腐和虾仁，炒至虾仁变粉红色。","推至一边，打入鸡蛋炒散。","加入河粉和调味汁，快速炒匀至裹上酱汁并加热透。","放入豆芽菜和韭菜翻炒。","配碎花生和柠檬块享用。"]','["河粉不要浸泡过久——会变糊烂。","椰糖带来正宗甜味，但红糖也可替代。","根据喜好调节罗望子酱用量增加酸味。","大火快炒保持最佳口感。"]','["泰式","河粉","街头小食"]','中等','2025-08-09 05:56:35','2025-08-09 05:56:35');
INSERT INTO recipes_i18n VALUES(33,'recipe-mdywfrrk-3skl','zh','墨西哥牧师塔可','经典墨西哥街头美食，香料腌制猪肉配菠萝，用玉米饼包裹，配新鲜香菜和洋葱。','["450克猪肩肉，切薄片","1个新鲜菠萝，去皮切块","8-10张玉米饼","1个白洋葱，切末","1/2杯新鲜香菜，切碎","2个柠檬，切块","1/4杯植物油"]','["2汤匙辣椒粉","1汤匙孜然粉","1汤匙干牛至叶","1茶匙盐","1/2茶匙黑胡椒","3瓣大蒜，切末","1个墨西哥辣椒，切碎","1/4杯白醋","2汤匙橙汁"]','["将猪肉片放入大碗，加入辣椒粉、孜然、牛至叶、盐、黑胡椒、大蒜、墨西哥辣椒、醋和橙汁腌制30分钟。","大平底锅中火加热植物油，煎腌制猪肉片至金黄色，约5-7分钟。","烤盘或平底锅烤制菠萝块至略微焦糖化，约3-4分钟。","干锅加热玉米饼30秒至软身。","在每张玉米饼上放入烤猪肉和烤菠萝。","撒上洋葱末和香菜。","挤上柠檬汁，卷起享用。"]','["腌制时间越长，风味越浓郁。","建议腌制2-4小时。","没有烤架的话可用平底锅煎制菠萝获得类似效果。","可提前准备腌制猪肉，冷藏保存最多24小时。"]','["墨西哥菜","街头小食","猪肉","菠萝"]','中等','2025-08-09 05:56:55','2025-08-09 05:56:55');
INSERT INTO recipes_i18n VALUES(38,'recipe-OwHoDy7CqWDX-me6g07ys','en','Stir-Fried Chicken Wings with Bacon, Bell Peppers, and Broccoli','A fragrant Chinese stir-fry dish combining the tenderness of chicken wings, the smoky crispiness of bacon, the sweetness of colorful bell peppers, and the freshness of broccoli, offering a rich texture and vibrant colors.','["4 chicken wings (cut into pieces)","100g bacon (sliced into strips)","150g broccoli (cut into small florets)","1 bell pepper (sliced)"]','["1 tablespoon light soy sauce","½ tablespoon dark soy sauce (for color)","1 tablespoon oyster sauce","1 tablespoon cooking wine","To taste black pepper powder","1 clove garlic (minced)","To taste salt"]','["Remove the bones from chicken wings and cut into pieces. Marinate with light soy sauce, cooking wine, and black pepper for 15 minutes.","Soak broccoli in salt water for 10 minutes, then rinse and blanch for 1 minute. Drain and set aside.","Heat a pan with a little oil, stir-fry the bacon until slightly crispy, then remove and set aside.","In the same pan, sauté minced garlic until fragrant, then add the marinated chicken pieces and cook until they change color.","Add bell peppers, broccoli, and cooked bacon, quickly stir-fry to combine evenly.","Season with oyster sauce and dark soy sauce, continue stir-frying for 2 minutes until the sauce coats the ingredients well.","Season with salt to taste, then transfer to a serving dish."]','["Removing the chicken bones allows the meat to absorb flavors better and makes stir-frying easier.","If oyster sauce is unavailable, substitute with light soy sauce plus a pinch of sugar to enhance sweetness.","Use medium heat throughout cooking to avoid overcooking or burning the ingredients."]','["Chinese","Quick Dish","Home Cooking","Healthy","Chicken Wings","Broccoli","Bell Peppers"]','Medium','2025-08-11T02:14:40.555Z','2025-08-11T02:14:40.555Z');
INSERT INTO recipes_i18n VALUES(39,'recipe-CnOpcoUbxlab-me75kcxq','en','Herb Roasted Chicken Thighs and Ham with Vegetables','A fragrant roasted chicken thighs and ham dish paired with classic root vegetables, offering rich flavors and a delightful texture.','["2 chicken thighs, boneless and cut into pieces","150g ham, cut into cubes","1 onion, sliced","1 potato, cut into chunky wedges","1 radish, cut into strips"]','["2 tablespoons olive oil","Salt to taste","Black pepper to taste","1 teaspoon fresh rosemary, finely chopped","1/2 teaspoon garlic powder"]','["Preheat the oven to 200°C (400°F).","Place the chicken thighs, ham cubes, onion slices, potato wedges, and radish strips into a large mixing bowl.","Add the olive oil, salt, black pepper, rosemary, and garlic powder. Toss well to ensure all ingredients are evenly coated with the seasoning.","Spread the mixture evenly onto a baking tray and place it on the middle rack of the preheated oven.","Roast for 35–45 minutes, or until the chicken is fully cooked and the vegetables are golden and slightly caramelized.","Remove from the oven and let it rest for a few minutes before serving."]','["For more flavor, marinate the chicken thighs for at least 1 hour before roasting.","If you prefer a crispier finish, switch to the oven’s broil setting for the last 10 minutes of cooking.","Serve with rice or crusty bread for a more balanced and satisfying meal."]','["Main Course","Roasted","Healthy","Budget-Friendly","Chicken Thighs","Ham","Vegetables"]','Medium','2025-08-11T13:34:27.869Z','2025-08-11T13:34:27.869Z');
INSERT INTO recipes_i18n VALUES(40,'recipe-nEDvU1SZ2ES2-mefb2zck','en','Pan-Seared Pork with Garlic Potatoes and Stir-Fried Asparagus','Tender pork slices pan-seared to golden perfection, served with fragrant garlic potatoes and lightly stir-fried crisp asparagus, creating a flavorful and nutritionally balanced home-style dish.','["Pork loin 300g, sliced","Potatoes 2, peeled and cut into uneven chunks","Asparagus 1 bunch, trimmed and cut into segments"]','["Garlic 3 cloves, sliced","Olive oil as needed","Salt to taste","Black pepper to taste","Rosemary a pinch (optional)"]','["Heat a pan with olive oil, sear pork slices until golden brown on both sides, season with salt and black pepper, then set aside.","Using the remaining oil, sauté garlic slices until fragrant, add potatoes and stir-fry until lightly browned. Add a little water and simmer for about 10 minutes until the potatoes are tender.","In a separate pan, heat a small amount of oil, quickly stir-fry asparagus for 2–3 minutes, then season with salt.","Return the seared pork and potatoes to the pan and toss together briefly, then add the asparagus and mix well before serving.","For extra aroma, add a pinch of rosemary when searing the pork if desired."]','["Marinate the pork for 10 minutes beforehand with soy sauce, cooking wine, and black pepper for enhanced flavor.","Cook the potatoes only until about 80% done to prevent them from falling apart.","Avoid overcooking the asparagus to maintain its crisp texture and vibrant green color."]','["Chinese","Main Course","Home-style","Pork","Healthy","One-Pan Meal"]','Medium','2025-08-17T06:33:26.995Z','2025-08-17T06:33:26.995Z');
INSERT INTO recipes_i18n VALUES(41,'recipe-Mb0Mqi6vkPHc-mefqp0do','zh','奶油蘑菇猪排','鲜嫩多汁的猪排淋上浓郁奶油蘑菇酱，是令人感到温暖的晚餐佳选。','["猪排，2块（带骨或去骨均可）","蘑菇，200克，切片","奶油，200毫升（推荐使用浓奶油或搅打奶油）"]','["盐，1茶匙（依口味调整）","黑胡椒，1/2茶匙（研磨）","大蒜，2瓣（剁成蒜末）","百里香，1茶匙（干制）"]','["在猪排两面均匀撒上盐和黑胡椒进行腌制。","在平底锅中以中火加热，加入少许油，将猪排每面煎5-7分钟至呈现金黄色，取出备用。","用同一口锅，加入切片蘑菇，翻炒约5分钟至呈褐色。","加入蒜末和百里香，继续翻炒约1分钟直至香气四溢。","倒入奶油，搅拌均匀后小火炖煮2-3分钟，直至酱汁略微浓稠。","将猪排重新放入锅中，将酱汁浇在猪排上，盖上锅盖，以小火继续炖煮10-15分钟，直至猪排完全熟透。","趁热上桌，淋上奶油蘑菇酱。"]','["如需增添风味，可在烹饪前将猪排用橄榄油、蒜末和香草混合腌料腌制数小时。","搭配土豆泥或蒸蔬菜一同享用，组成一顿完整的餐食。","如喜欢略带酸味，可在加入奶油前先加入少许白葡萄酒与蘑菇翻炒。"]','["意大利","暖心料理","中等难度","猪肉"]','中等','2025-08-17T13:50:17.721Z','2025-08-17T13:50:17.721Z');
CREATE TABLE model_usage_records (
    id TEXT PRIMARY KEY,                    -- 主键，存储大模型返回的ID
    model_name TEXT NOT NULL,              -- 模型名称，如 'gpt-4o-mini', 'qwen-plus', 'wanx', 'flux-schnell'
    model_type TEXT NOT NULL,              -- 模型类型：'language' 或 'image'
    request_details TEXT,                  -- 请求模型的prompt，用于分析和优化
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);
INSERT INTO model_usage_records VALUES('8k3sckdszsrma0crh0ptckw01c','gpt-4o-mini','language',replace('Please generate EXACTLY 1 different style recipe based on the following information and output in JSON format:\n\nIngredients: Carrot, Tomato, Onion\nServings: 2 people per recipe\nCooking time preference: medium minutes\nDifficulty preference: medium\nCuisine preference: any\n\nAVAILABLE CUISINES (with IDs):\n1. Chinese (id: 1)\n2. Italian (id: 2)\n3. French (id: 3)\n4. Indian (id: 4)\n5. Japanese (id: 5)\n6. Mediterranean (id: 6)\n7. Thai (id: 7)\n8. Mexican (id: 8)\n9. Others (id: 9)\n\nCUISINE ID MAPPING RULES:\n- If the recipe is clearly Chinese cuisine (stir-fry, dim sum, hot pot, etc.), use cuisine_id: 1\n- If the recipe is clearly Italian cuisine (pasta, pizza, risotto, etc.), use cuisine_id: 2\n- If the recipe is clearly French cuisine (coq au vin, ratatouille, etc.), use cuisine_id: 3\n- If the recipe is clearly Indian cuisine (curry, tandoori, etc.), use cuisine_id: 4\n- If the recipe is clearly Japanese cuisine (sushi, ramen, tempura, etc.), use cuisine_id: 5\n- If the recipe is Mediterranean style (Greek, Spanish, etc.), use cuisine_id: 6\n- If the recipe is clearly Thai cuisine (pad thai, tom yum, etc.), use cuisine_id: 7\n- If the recipe is clearly Mexican cuisine (tacos, enchiladas, etc.), use cuisine_id: 8\n- If the recipe is fusion cuisine, experimental, or doesn''t clearly match any specific traditional cuisine, use cuisine_id: 9 (Others)\n- If the recipe doesn''t clearly match any specific cuisine, use cuisine_id: 9 (Others as default)\n\nCRITICAL REQUIREMENTS:\n1. Generate EXACTLY 1 recipe - no more, no less\n2. Recommend ONE recipe as your top choice and mark it with "recommended": true\n3. Place the recommended recipe FIRST in the recipes array\n4. Determine the cuisine type for each recipe and include the corresponding cuisine_id\n\nPlease output in JSON format with recipes array containing EXACTLY 1 recipe.\nEach recipe must include:\n- cooking_time, servings (integer values)\n- cuisine_id (integer, based on the cuisine type of the recipe)\n- difficulty (string: "easy", "medium", or "hard")\n- title, description, ingredients, seasoning, instructions, tags, chef_tips (all in English)\n- recommended (boolean, only true for the recommended recipe)\n\nEXAMPLE JSON OUTPUT:\n{\n  "recipes": [\n    {\n      "title": "Example Recipe",\n      "description": "A delicious example recipe",\n      "cooking_time": 30,\n      "servings": 2,\n      "difficulty": "easy",\n      "ingredients": ["ingredient 1", "ingredient 2"],\n      "seasoning": ["seasoning 1", "seasoning 2"],\n      "instructions": ["step 1", "step 2"],\n      "tags": ["tag1", "tag2"],\n      "chef_tips": ["tip 1", "tip 2"],\n      "recommended": true,\n      "cuisine_id": 1\n    }\n  ]\n}','\n',char(10)),'2025-08-08 05:36:04');
INSERT INTO model_usage_records VALUES('rx5y0y558drme0crh7tbpqc0yw','gpt-4o-mini','language',replace('Please generate EXACTLY 1 different style recipe based on the following information and output in JSON format:\n\nIngredients: Bacon, Chicken wing\nServings: 2 people per recipe\nCooking time preference: medium minutes\nDifficulty preference: medium\nCuisine preference: any\n\nAVAILABLE CUISINES (with IDs):\n1. Chinese (id: 1)\n2. Italian (id: 2)\n3. French (id: 3)\n4. Indian (id: 4)\n5. Japanese (id: 5)\n6. Mediterranean (id: 6)\n7. Thai (id: 7)\n8. Mexican (id: 8)\n9. Others (id: 9)\n\nCUISINE ID MAPPING RULES:\n- If the recipe is clearly Chinese cuisine (stir-fry, dim sum, hot pot, etc.), use cuisine_id: 1\n- If the recipe is clearly Italian cuisine (pasta, pizza, risotto, etc.), use cuisine_id: 2\n- If the recipe is clearly French cuisine (coq au vin, ratatouille, etc.), use cuisine_id: 3\n- If the recipe is clearly Indian cuisine (curry, tandoori, etc.), use cuisine_id: 4\n- If the recipe is clearly Japanese cuisine (sushi, ramen, tempura, etc.), use cuisine_id: 5\n- If the recipe is Mediterranean style (Greek, Spanish, etc.), use cuisine_id: 6\n- If the recipe is clearly Thai cuisine (pad thai, tom yum, etc.), use cuisine_id: 7\n- If the recipe is clearly Mexican cuisine (tacos, enchiladas, etc.), use cuisine_id: 8\n- If the recipe is fusion cuisine, experimental, or doesn''t clearly match any specific traditional cuisine, use cuisine_id: 9 (Others)\n- If the recipe doesn''t clearly match any specific cuisine, use cuisine_id: 9 (Others as default)\n\nCRITICAL REQUIREMENTS:\n1. Generate EXACTLY 1 recipe - no more, no less\n2. Recommend ONE recipe as your top choice and mark it with "recommended": true\n3. Place the recommended recipe FIRST in the recipes array\n4. Determine the cuisine type for each recipe and include the corresponding cuisine_id\n\nPlease output in JSON format with recipes array containing EXACTLY 1 recipe.\nEach recipe must include:\n- cooking_time, servings (integer values)\n- cuisine_id (integer, based on the cuisine type of the recipe)\n- difficulty (string: "easy", "medium", or "hard")\n- title, description, ingredients, seasoning, instructions, tags, chef_tips (all in English)\n- recommended (boolean, only true for the recommended recipe)\n\nEXAMPLE JSON OUTPUT:\n{\n  "recipes": [\n    {\n      "title": "Example Recipe",\n      "description": "A delicious example recipe",\n      "cooking_time": 30,\n      "servings": 2,\n      "difficulty": "easy",\n      "ingredients": ["ingredient 1", "ingredient 2"],\n      "seasoning": ["seasoning 1", "seasoning 2"],\n      "instructions": ["step 1", "step 2"],\n      "tags": ["tag1", "tag2"],\n      "chef_tips": ["tip 1", "tip 2"],\n      "recommended": true,\n      "cuisine_id": 1\n    }\n  ]\n}','\n',char(10)),'2025-08-08 13:52:58');
INSERT INTO model_usage_records VALUES('hxzf8rs8rdrma0crh9hb3zeqjm','gpt-4o-mini','language',replace('Please generate EXACTLY 1 different style recipe based on the following information and output in JSON format:\n\nIngredients: Bacon, Chicken wing, Broccoli, Mushroom, Pepper\nServings: 2 people per recipe\nCooking time preference: medium minutes\nDifficulty preference: medium\nCuisine preference: any\n\nAVAILABLE CUISINES (with IDs):\n1. Chinese (id: 1)\n2. Italian (id: 2)\n3. French (id: 3)\n4. Indian (id: 4)\n5. Japanese (id: 5)\n6. Mediterranean (id: 6)\n7. Thai (id: 7)\n8. Mexican (id: 8)\n9. Others (id: 9)\n\nCUISINE ID MAPPING RULES:\n- If the recipe is clearly Chinese cuisine (stir-fry, dim sum, hot pot, etc.), use cuisine_id: 1\n- If the recipe is clearly Italian cuisine (pasta, pizza, risotto, etc.), use cuisine_id: 2\n- If the recipe is clearly French cuisine (coq au vin, ratatouille, etc.), use cuisine_id: 3\n- If the recipe is clearly Indian cuisine (curry, tandoori, etc.), use cuisine_id: 4\n- If the recipe is clearly Japanese cuisine (sushi, ramen, tempura, etc.), use cuisine_id: 5\n- If the recipe is Mediterranean style (Greek, Spanish, etc.), use cuisine_id: 6\n- If the recipe is clearly Thai cuisine (pad thai, tom yum, etc.), use cuisine_id: 7\n- If the recipe is clearly Mexican cuisine (tacos, enchiladas, etc.), use cuisine_id: 8\n- If the recipe is fusion cuisine, experimental, or doesn''t clearly match any specific traditional cuisine, use cuisine_id: 9 (Others)\n- If the recipe doesn''t clearly match any specific cuisine, use cuisine_id: 9 (Others as default)\n\nCRITICAL REQUIREMENTS:\n1. Generate EXACTLY 1 recipe - no more, no less\n2. Recommend ONE recipe as your top choice and mark it with "recommended": true\n3. Place the recommended recipe FIRST in the recipes array\n4. Determine the cuisine type for each recipe and include the corresponding cuisine_id\n\nPlease output in JSON format with recipes array containing EXACTLY 1 recipe.\nEach recipe must include:\n- cooking_time, servings (integer values)\n- cuisine_id (integer, based on the cuisine type of the recipe)\n- difficulty (string: "easy", "medium", or "hard")\n- title, description, ingredients, seasoning, instructions, tags, chef_tips (all in English)\n- recommended (boolean, only true for the recommended recipe)\n\nEXAMPLE JSON OUTPUT:\n{\n  "recipes": [\n    {\n      "title": "Example Recipe",\n      "description": "A delicious example recipe",\n      "cooking_time": 30,\n      "servings": 2,\n      "difficulty": "easy",\n      "ingredients": ["ingredient 1", "ingredient 2"],\n      "seasoning": ["seasoning 1", "seasoning 2"],\n      "instructions": ["step 1", "step 2"],\n      "tags": ["tag1", "tag2"],\n      "chef_tips": ["tip 1", "tip 2"],\n      "recommended": true,\n      "cuisine_id": 1\n    }\n  ]\n}','\n',char(10)),'2025-08-08 15:52:34');
INSERT INTO model_usage_records VALUES('2wp275gv95rme0crh9nadhs3dg','flux','image','Professional food photograph of Bacon-Wrapped Chicken Wings with Broccoli and Mushroom Stir-Fry, featuring ingredients Chicken wings, 8 pieces, whole, Bacon, 4 slices, whole, Broccoli, 1 cup, florets, Mushroom, 1 cup, sliced, Bell pepper, 1, sliced. Clean and blurred minimalist background, high-definition close-up shot, macro perspective, high-definition realistic style, highlighting the food details, captured under soft natural lighting to showcase the texture and color layers of the ingredients, creating a warm and appetizing atmosphere.','2025-08-08 16:01:09');
INSERT INTO model_usage_records VALUES('bbkp322j3nrme0crhj78gcdm24','gpt-4o-mini','language',replace('Please generate EXACTLY 1 different style recipe based on the following information and output in JSON format:\n\nIngredients: Chicken breast, Chicken wing\nServings: 2 people per recipe\nCooking time preference: medium minutes\nDifficulty preference: medium\nCuisine preference: any\n\nAVAILABLE CUISINES (with IDs):\n1. Chinese (id: 1)\n2. Italian (id: 2)\n3. French (id: 3)\n4. Indian (id: 4)\n5. Japanese (id: 5)\n6. Mediterranean (id: 6)\n7. Thai (id: 7)\n8. Mexican (id: 8)\n9. Others (id: 9)\n\nCUISINE ID MAPPING RULES:\n- If the recipe is clearly Chinese cuisine (stir-fry, dim sum, hot pot, etc.), use cuisine_id: 1\n- If the recipe is clearly Italian cuisine (pasta, pizza, risotto, etc.), use cuisine_id: 2\n- If the recipe is clearly French cuisine (coq au vin, ratatouille, etc.), use cuisine_id: 3\n- If the recipe is clearly Indian cuisine (curry, tandoori, etc.), use cuisine_id: 4\n- If the recipe is clearly Japanese cuisine (sushi, ramen, tempura, etc.), use cuisine_id: 5\n- If the recipe is Mediterranean style (Greek, Spanish, etc.), use cuisine_id: 6\n- If the recipe is clearly Thai cuisine (pad thai, tom yum, etc.), use cuisine_id: 7\n- If the recipe is clearly Mexican cuisine (tacos, enchiladas, etc.), use cuisine_id: 8\n- If the recipe is fusion cuisine, experimental, or doesn''t clearly match any specific traditional cuisine, use cuisine_id: 9 (Others)\n- If the recipe doesn''t clearly match any specific cuisine, use cuisine_id: 9 (Others as default)\n\nCRITICAL REQUIREMENTS:\n1. Generate EXACTLY 1 recipe - no more, no less\n2. Recommend ONE recipe as your top choice and mark it with "recommended": true\n3. Place the recommended recipe FIRST in the recipes array\n4. Determine the cuisine type for each recipe and include the corresponding cuisine_id\n\nPlease output in JSON format with recipes array containing EXACTLY 1 recipe.\nEach recipe must include:\n- cooking_time, servings (integer values)\n- cuisine_id (integer, based on the cuisine type of the recipe)\n- difficulty (string: "easy", "medium", or "hard")\n- title, description, ingredients, seasoning, instructions, tags, chef_tips (all in English)\n- recommended (boolean, only true for the recommended recipe)\n\nEXAMPLE JSON OUTPUT:\n{\n  "recipes": [\n    {\n      "title": "Example Recipe",\n      "description": "A delicious example recipe",\n      "cooking_time": 30,\n      "servings": 2,\n      "difficulty": "easy",\n      "ingredients": ["ingredient 1", "ingredient 2"],\n      "seasoning": ["seasoning 1", "seasoning 2"],\n      "instructions": ["step 1", "step 2"],\n      "tags": ["tag1", "tag2"],\n      "chef_tips": ["tip 1", "tip 2"],\n      "recommended": true,\n      "cuisine_id": 1\n    }\n  ]\n}','\n',char(10)),'2025-08-09 02:00:02');
CREATE TABLE recipe_images (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, recipe_id TEXT NOT NULL, image_path TEXT NOT NULL, image_model TEXT, created_at TEXT NOT NULL);
-- Recipe images test data removed for schema update
CREATE TABLE IF NOT EXISTS "recipes" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cooking_time INTEGER,
    servings INTEGER,
    difficulty TEXT,
    ingredients TEXT,
    seasoning TEXT,
    instructions TEXT,
    tags TEXT,
    chef_tips TEXT,
    user_id TEXT,
    cuisine_id INTEGER,
    created_at TEXT,
    updated_at TEXT
);
INSERT INTO recipes VALUES('recipe-mdils01c-0ctp','Mapo Tofu','A bold Sichuan dish featuring soft tofu, ground pork, and a spicy, numbing chili-bean sauce.',20,4,'Medium','["500g soft tofu, cut into 1-inch cubes","200g ground pork"]','["Salt to taste","White pepper to taste"]','["Bring a pot of salted water to a gentle boil. Add tofu cubes and simmer for 2 minutes to remove bitterness. Drain and set aside.","Heat a wok or large non-stick skillet over medium-high heat. Add 1 tablespoon of vegetable oil.","Add ground pork and stir-fry until browned and crumbly, about 2–3 minutes.","Push the meat to one side of the wok. Add Sichuan doubanjiang and chili oil to the center, and stir-fry for 30 seconds until fragrant.","Mix in minced garlic, ginger, and the white parts of green onions. Cook for another 30 seconds.","Pour in soy sauce, sugar, and water or broth. Stir well to combine.","Gently add the blanched tofu cubes to the wok. Carefully toss to coat the tofu without breaking it. Simmer for 3–4 minutes.","Stir the cornstarch slurry to recombine, then pour it into the wok. Gently stir until the sauce thickens and becomes glossy, about 1 minute.","Remove from heat. Immediately sprinkle ground Sichuan peppercorns and the green parts of green onions on top.","Serve hot with steamed white rice for a complete meal."]','["Chinese","Spicy","Sichuan","Main Dish"]','["For authentic flavor, use Pixian doubanjiang."]','157b6650-29b8-4613-87d9-ce0997106151',1,'2025-07-25 16:37:58','2025-07-25 16:37:58');
INSERT INTO recipes VALUES('recipe-mdikyxqo-5y33','Spaghetti Carbonara','Italian pasta with creamy egg-based sauce, crispy pancetta, and black pepper—simple and comforting.',15,2,'Easy','["200g spaghetti","100g pancetta or guanciale, diced","2 large eggs","50g Pecorino Romano cheese, grated","50g Parmigiano Reggiano, grated","2 cloves garlic, minced (optional)","Freshly ground black pepper","Salt for pasta water"]','["Freshly ground black pepper (generous amount)","Sea salt","Extra virgin olive oil (optional)"]','["Bring a large pot of salted water to a boil and cook spaghetti according to package instructions until al dente.","While pasta is cooking, heat a large skillet over medium heat. Add pancetta and cook until crispy, about 5 minutes.","In a bowl, whisk together eggs, grated cheeses, and plenty of black pepper.","Reserve 1/2 cup of pasta water before draining the cooked pasta.","Working quickly, add hot pasta to the skillet with pancetta, remove from heat.","Immediately pour in the egg and cheese mixture, tossing constantly with tongs. The residual heat will cook the eggs into a creamy sauce.","Add a splash of reserved pasta water as needed to achieve a silky consistency.","Serve immediately with extra grated cheese and freshly ground black pepper."]','["Italian","Pasta","Creamy","Quick"]','["Never add cream to authentic carbonara - the creaminess comes from the eggs and cheese alone.","The key to avoiding scrambled eggs is removing the pan from heat before adding the egg mixture.","Guanciale (cured pork jowl) is traditional, but pancetta or even thick-cut bacon can work as substitutes.","Save some pasta water - its starchiness helps create a silky sauce that clings to the pasta."]','157b6650-29b8-4613-87d9-ce0997106151',2,'2025-07-25 16:49:54','2025-07-25 16:49:54');
INSERT INTO recipes VALUES('recipe-mdils01c-u26g','Ratatouille','Colorful baked medley of zucchini, eggplant, and tomatoes, a French Provençal vegetable classic.',45,4,'Medium','["1 eggplant, sliced","1 zucchini, sliced","1 yellow squash, sliced","1 red bell pepper, sliced","2 tomatoes, sliced","1 onion, finely chopped","2 cloves garlic, minced","400g canned crushed tomatoes","2 tbsp olive oil","1 tsp dried thyme","Salt and black pepper to taste","Fresh basil for garnish"]','["Salt and black pepper to taste","Herbes de Provence","Bay leaves","Red pepper flakes (optional)"]','["Preheat oven to 190°C (375°F).","In a skillet, heat 1 tbsp olive oil. Sauté onion and garlic until soft, then add crushed tomatoes, thyme, salt, and pepper. Simmer for 10 minutes.","Spread tomato sauce in the base of a baking dish.","Arrange sliced vegetables (eggplant, zucchini, squash, bell pepper, tomato) in alternating rows over the sauce.","Drizzle remaining olive oil over the vegetables, sprinkle with more thyme and pepper.","Cover with foil and bake for 30 minutes. Uncover and bake an additional 15 minutes until vegetables are tender.","Garnish with fresh basil before serving."]','["French","Vegetarian","Healthy","Summer"]','["Use a mandoline for uniform vegetable slices and faster prep.","Let it rest 10 minutes before serving to enhance flavor.","Great served warm or at room temperature.","Add a pinch of chili flakes for a subtle heat."]','157b6650-29b8-4613-87d9-ce0997106151',3,'2025-07-25 17:12:30','2025-07-25 17:12:30');
INSERT INTO recipes VALUES('recipe-mdils01c-g2ti','Butter Chicken','Creamy, spiced tomato-based curry with tender chicken, a North Indian favorite served with rice or naan.',30,4,'Medium','["500g boneless chicken thighs, cut into chunks","200g plain yogurt","1 tbsp ginger-garlic paste","1 tsp chili powder","2 tbsp butter","1 onion, chopped","2 cloves garlic, minced","1 tsp garam masala","1 tsp cumin","1/2 tsp turmeric","300g tomato purée","100ml cream","Fresh coriander leaves","Salt to taste"]','["Kashmiri red chili powder","Garam masala powder","Fenugreek leaves (kasoori methi)","Black pepper powder","Cardamom powder"]','["Marinate chicken in yogurt, chili powder, and ginger-garlic paste for at least 30 minutes.","Heat butter in a pan, sauté onions until golden. Add garlic and spices, cook until fragrant.","Stir in tomato purée, simmer for 10 minutes.","Add marinated chicken, cook until done, about 15 minutes.","Stir in cream, simmer for another 5 minutes.","Garnish with coriander and serve with naan or rice."]','["Indian","Curry","Creamy","Spicy"]','["Marinate overnight for maximum flavor.","Use thighs for juicier, more tender results.","Balance the heat with a pinch of sugar if desired.","Butter adds richness—don''t skip it!"]','157b6650-29b8-4613-87d9-ce0997106151',4,'2025-07-25 17:12:30','2025-07-25 17:12:30');
INSERT INTO recipes VALUES('recipe-mdils01c-emg3','Chicken Teriyaki','Juicy chicken glazed with a sweet-savory teriyaki sauce, served over steamed rice for a quick Japanese meal.',15,2,'Easy','["2 chicken thighs, boneless and skin-on","2 tbsp soy sauce","2 tbsp mirin","1 tbsp sake","1 tbsp sugar","1 tsp grated ginger","1 tsp oil","Steamed rice for serving","Sesame seeds and chopped scallions for garnish"]','["White pepper","Garlic powder","Toasted sesame oil","Rice vinegar (optional)"]','["Mix soy sauce, mirin, sake, sugar, and ginger in a bowl to make teriyaki sauce.","Heat oil in a pan over medium heat. Place chicken skin-side down and cook until crispy, about 5–6 minutes.","Flip and cook the other side for 3 minutes.","Pour in teriyaki sauce. Simmer and spoon sauce over chicken until glazed and cooked through.","Slice and serve over rice with sesame seeds and scallions."]','["Japanese","Chicken","Sweet","Easy"]','["Use skin-on chicken for a crispy texture.","Don''t overcrowd the pan—browning is key.","Add a bit of cornstarch to the sauce for a thicker glaze.","Mirin is essential for authentic flavor."]','157b6650-29b8-4613-87d9-ce0997106151',5,'2025-07-25 17:12:30','2025-07-25 17:12:30');
INSERT INTO recipes VALUES('recipe-mdils01c-2tp2','Greek Salad','Refreshing mix of tomatoes, cucumber, olives, and feta cheese, dressed with olive oil and oregano.',15,2,'Easy','["2 tomatoes, cut into wedges","1 cucumber, sliced","1/2 red onion, thinly sliced","100g feta cheese, cubed","10 Kalamata olives","2 tbsp extra virgin olive oil","1 tsp dried oregano","Salt and black pepper to taste","1 tsp red wine vinegar (optional)"]','["Coarse sea salt","Freshly cracked black pepper","Dried oregano (Greek oregano preferred)","Lemon juice"]','["In a large bowl, combine tomatoes, cucumber, onion, olives, and feta.","Drizzle with olive oil and vinegar if using.","Sprinkle oregano, salt, and pepper. Toss gently.","Serve immediately or chill for 10 minutes."]','["Mediterranean","Salad","Vegetarian","Healthy"]','["Use good quality olive oil—it makes a difference.","Don''t crumble feta—chunks are traditional.","Red onion can be soaked in cold water to mellow flavor.","Serve with crusty bread for a light meal."]','157b6650-29b8-4613-87d9-ce0997106151',6,'2025-07-25 17:12:30','2025-07-25 17:12:30');
INSERT INTO recipes VALUES('recipe-mdils01c-21ow','Pad Thai','Sweet, sour, and savory stir-fried rice noodles with shrimp, tofu, peanuts, and fresh lime.',15,2,'Medium','["150g rice noodles","100g shrimp, peeled and deveined","50g firm tofu, cubed","2 tbsp tamarind paste","1 tbsp fish sauce","1 tbsp palm sugar or brown sugar","2 cloves garlic, minced","1 egg","2 tbsp vegetable oil","1/4 cup bean sprouts","2 tbsp crushed peanuts","Chopped scallions","Lime wedges"]','["White pepper powder","Chili flakes (optional)","Thai basil leaves","Lime juice for extra tang"]','["Soak rice noodles in warm water for 20 minutes or until pliable.","Mix tamarind paste, fish sauce, and sugar in a bowl.","Heat oil in a wok, sauté garlic. Add tofu and shrimp, stir-fry until shrimp is pink.","Push to the side, crack in egg and scramble.","Add noodles and sauce, stir-fry until everything is coated and heated through.","Toss in bean sprouts and scallions.","Serve with crushed peanuts and lime wedges."]','["Thai","Noodles","Street Food"]','["Don''t over-soak noodles—they''ll get mushy.","Palm sugar gives authentic sweetness, but brown sugar works too.","Adjust tamarind to taste for more tang.","Stir-fry quickly on high heat for best texture."]','157b6650-29b8-4613-87d9-ce0997106151',7,'2025-07-25 17:12:30','2025-07-25 17:12:30');
INSERT INTO recipes VALUES('recipe-mdywfrrk-3skl','Tacos al Pastor','Classic Mexican street food featuring marinated pork with pineapple, served on corn tortillas with fresh cilantro and onions.',45,4,'Medium','["1 lb pork shoulder, thinly sliced","1 fresh pineapple, peeled and cut into chunks","8-10 corn tortillas","1 white onion, finely chopped","1/2 cup fresh cilantro, chopped","2 limes, cut into wedges","1/4 cup vegetable oil"]','["2 tbsp chili powder","1 tbsp ground cumin","1 tbsp dried oregano","1 tsp salt","1/2 tsp black pepper","3 cloves garlic, minced","1 jalapeño pepper, chopped","1/4 cup white vinegar","2 tbsp orange juice"]','["Place pork slices in a large bowl and add chili powder, cumin, oregano, salt, black pepper, garlic, jalapeño, vinegar, and orange juice. Marinate for 30 minutes.","Heat vegetable oil in a large skillet over medium-high heat. Cook marinated pork slices until golden brown, about 5-7 minutes.","Grill pineapple chunks on a grill or in a skillet until lightly caramelized, about 3-4 minutes.","Warm corn tortillas in a dry skillet for 30 seconds until soft.","Place cooked pork and grilled pineapple on each tortilla.","Top with chopped onion and cilantro.","Squeeze lime juice over the top and roll up to serve."]','["Mexican","Street Food","Pork","Pineapple"]','["The longer you marinate the pork, the more flavorful it will be.","Consider marinating for 2-4 hours.","If you don''t have a grill, you can char the pineapple in a skillet for similar results.","You can prepare the marinated pork ahead of time and store it in the refrigerator for up to 24 hours."]','157b6650-29b8-4613-87d9-ce0997106151',8,'2025-08-06T02:55:14','2025-08-06T02:55:14');
INSERT INTO recipes VALUES('recipe-mdils01c-sskk','Skibidi Slicers','Get ready to ascend with the Skibidi Slicers — the ultimate main-character meal for anyone living in a cozy-core cinematic universe. Gooey, crispy, and totally skibidi, this sandwich isn''t just food — it''s a vibe. One bite and you''re in a lo-fi montage, staring out the window, contemplating life with extra cheese.',15,2,'Easy','["Thick sourdough bread", "Shredded mozzarella", "Sharp cheddar", "Cream cheese", "Butter", "Mayonnaise"]','["Garlic powder", "Smoked paprika", "Salt", "Fresh cracked black pepper"]','["In a small bowl, mix cream cheese, garlic powder, paprika, and a pinch of salt", "Butter one side of each slice of bread and spread mayo on the other side", "Place mayo-side down on skillet, then layer cheddar and mozzarella", "Spread cream cheese mixture on the top slice of bread (butter side up)", "Grill over medium heat for 3-4 minutes per side until golden and cheese is melted", "Let rest for 1 minute, then slice diagonally for dramatic effect", "Optional: stretch the cheese slowly for a cinematic cheese pull"]','["Comfort-food", "Zesty", "Main-character-energy"]','["Use sourdough for the best crunch", "Mix cheeses for layered flavor and better melt", "Don''t skip the mayo—it gives a crispier golden crust", "Rest before slicing to avoid losing the cheese too early", "Best enjoyed with lo-fi beats and a cozy blanket"]','157b6650-29b8-4613-87d9-ce0997106151',9,'2025-08-08 09:57:07','2025-08-08 09:57:07');
INSERT INTO recipes VALUES('recipe-me308f9h-xy9j','Bacon-Wrapped Chicken Wings with Broccoli and Mushroom Stir-Fry','Indulge in tender chicken wings wrapped in crispy bacon, complemented by a vibrant stir-fry of broccoli and mushrooms, making for a delightful and satisfying meal.',45,2,'Medium','["Chicken wings, 8 pieces, whole","Bacon, 4 slices, whole","Broccoli, 1 cup, florets","Mushroom, 1 cup, sliced","Bell pepper, 1, sliced"]','["Salt, 1 teaspoon, to taste","Black pepper, 1/2 teaspoon, ground","Olive oil, 1 tablespoon, for cooking"]','["Preheat the oven to 400°F (200°C).","Wrap each chicken wing with a slice of bacon and secure with a toothpick.","Place the wrapped wings on a baking sheet and bake for 25-30 minutes until bacon is crispy and chicken is cooked through.","While the wings are baking, heat olive oil in a pan over medium heat.","Add sliced mushrooms and bell pepper to the pan, sauté for 5 minutes until softened.","Add broccoli florets and cook for an additional 5 minutes until bright and tender.","Season the vegetables with salt and black pepper, then remove from heat.","Serve the bacon-wrapped chicken wings alongside the broccoli and mushroom stir-fry."]','["American","Comfort Food","Medium-Cost","Main Dish"]','["For extra flavor, marinate the chicken wings in your favorite sauce before wrapping them in bacon.","Try using different types of mushrooms for varied texture and flavor.","Serve with a dipping sauce like ranch or blue cheese for an added touch."]','024f80a8-6b82-4873-bd82-9032ecab6119',9,'2025-08-08T16:01:17.782Z','2025-08-08T16:01:17.782Z');
INSERT INTO recipes VALUES('recipe-OwHoDy7CqWDX-me6g07ys','彩椒鸡翅炒培根配西兰花','一道香气浓郁的中式快炒菜，结合了鸡翅的嫩滑、培根的焦香、彩椒的鲜甜和西兰花的清爽，口感丰富，色彩诱人。',35,2,'中等','["鸡翅 4个（切块）","培根 100克（切条）","西兰花 150克（切小朵）","彩椒 1个（切片）"]','["生抽 1汤匙","老抽 ½汤匙（调色用）","蚝油 1汤匙","料酒 1汤匙","黑胡椒粉 适量","蒜末 1瓣（切碎）","盐 适量"]','["鸡翅去骨切块，加入生抽、料酒、黑胡椒粉腌制15分钟。","西兰花用盐水浸泡10分钟后冲洗，焯水1分钟捞出备用。","热锅冷油，放入培根煸炒至微焦，盛出备用。","锅中留底油，爆香蒜末后加入鸡翅翻炒至变色。","加入彩椒、西兰花和培根，快速翻炒均匀。","调入蚝油、老抽，继续翻炒2分钟，至酱汁均匀包裹食材。","最后根据口味适量加盐调味即可出锅。"]','["中式","快手菜","家常菜","健康","鸡翅","西兰花","彩椒"]','["鸡翅去骨处理后更易入味，也方便翻炒均匀。","如没有蚝油，可用生抽+少许糖代替，增加鲜甜感。","全程中火翻炒，避免食材炒老或焦糊。"]','024f80a8-6b82-4873-bd82-9032ecab6119',9,'2025-08-11T02:14:23.549Z','2025-08-11T02:14:23.549Z');
INSERT INTO recipes VALUES('recipe-CnOpcoUbxlab-me75kcxq','香烤鸡腿火腿配蔬菜','一道香气四溢的烤鸡腿火腿搭配经典根茎类蔬菜，口感丰富，风味浓郁。',45,2,'中等','["鸡腿 2只，去骨切块","火腿 150克，切块","洋葱 1个，切片","土豆 1个，切滚刀块","萝卜 1根，切条"]','["橄榄油 2汤匙","盐 适量","黑胡椒 适量","迷迭香 1茶匙，切碎","大蒜粉 1/2茶匙"]','["预热烤箱至200°C。","将鸡腿块、火腿块、洋葱片、土豆滚刀块和萝卜条放入大碗中。","加入橄榄油、盐、黑胡椒、迷迭香和大蒜粉，搅拌均匀，确保食材充分裹上调味料。","将混合好的食材平铺在烤盘上，放入预热好的烤箱中层。","烘烤35-45分钟，或至鸡腿熟透、蔬菜金黄微焦。","取出稍放凉后即可装盘享用。"]','["主菜","烤制","健康","经济实惠","鸡腿","火腿","蔬菜"]','["鸡腿可提前腌制1小时更入味。","若喜欢更焦香的口感，可在最后10分钟将烤箱调至上火模式。","可搭配米饭或面包一起食用，营养更均衡。"]','024f80a8-6b82-4873-bd82-9032ecab6119',9,'2025-08-11T13:34:11.975Z','2025-08-11T13:34:11.975Z');
INSERT INTO recipes VALUES('recipe-nEDvU1SZ2ES2-mefb2zck','香煎猪肉配蒜香土豆与清炒芦笋','嫩滑猪肉煎至金黄，搭配蒜香浓郁的土豆块与清炒脆嫩芦笋，口感丰富，营养均衡的一道家常料理。',40,2,'中等','["猪肉 300克，切片","土豆 2个，去皮切滚刀块","芦笋 1把，去根切段"]','["大蒜 3瓣，切片","橄榄油 适量","盐 适量","黑胡椒 适量","迷迭香 少许（可选）"]','["热锅加入橄榄油，将猪肉片煎至两面金黄，撒上盐和黑胡椒调味后盛出备用。","用余油炒香蒜片，加入土豆块翻炒至微黄，加少许水焖煮约10分钟，至土豆软熟。","另起锅烧热，加入少许油，将芦笋段快速翻炒2-3分钟，加盐调味。","将煎好的猪肉与土豆一起回锅略炒均匀，最后加入芦笋即可装盘。","如喜欢香气更浓，可在煎猪肉时加入少许迷迭香。"]','["中式","主菜","家常菜","猪肉","健康","一锅料理"]','["猪肉可提前腌制10分钟（可用酱油、料酒、黑胡椒）更入味。","土豆煮至八分熟即可，避免煮散。","芦笋不宜炒太久，保持清脆口感和翠绿颜色。"]','024f80a8-6b82-4873-bd82-9032ecab6119',9,'2025-08-17T06:33:14.907Z','2025-08-17T06:33:14.907Z');
INSERT INTO recipes VALUES('recipe-Mb0Mqi6vkPHc-mefqp0do','Creamy Mushroom Pork Chops','Succulent pork chops smothered in a rich and creamy mushroom sauce, perfect for a comforting dinner.',45,2,'Medium','["pork chops, 2 pieces, bone-in or boneless","mushrooms, 200 grams, sliced","cream, 200 ml, heavy or whipping"]','["salt, 1 teaspoon, to taste","black pepper, 1/2 teaspoon, ground","garlic, 2 cloves, minced","thyme, 1 teaspoon, dried"]','["Season the pork chops with salt and black pepper on both sides.","In a skillet over medium heat, add a splash of oil and sear the pork chops for 5-7 minutes on each side until golden brown. Remove and set aside.","In the same skillet, add the sliced mushrooms and sauté until browned, about 5 minutes.","Add minced garlic and thyme, cooking for another minute until fragrant.","Pour in the cream, stirring well to combine, and let it simmer for 2-3 minutes until slightly thickened.","Return the pork chops to the skillet, spooning the sauce over them. Cover and let simmer on low heat for about 10-15 minutes until the pork is cooked through.","Serve hot with the creamy mushroom sauce drizzled over the top."]','["Italian","Comfort Food","Medium-Cook","Pork"]','["For added flavor, marinate the pork chops in a mixture of olive oil, garlic, and herbs for a couple of hours before cooking.","Serve with a side of mashed potatoes or steamed vegetables for a complete meal.","If you like a bit of tang, add a splash of white wine to the mushrooms before adding cream."]','157b6650-29b8-4613-87d9-ce0997106151',9,'2025-08-17T13:50:04.928Z','2025-08-17T13:50:04.928Z');
CREATE TABLE IF NOT EXISTS "ingredients_i18n" (id INTEGER PRIMARY KEY, ingredient_id INTEGER NOT NULL, language_code TEXT NOT NULL, name TEXT NOT NULL, description TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));
INSERT INTO ingredients_i18n VALUES(224,111,'zh','大葱',NULL,'2025-07-27 05:04:34','2025-07-27 05:04:34');
INSERT INTO ingredients_i18n VALUES(226,87,'zh','杏仁',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(228,88,'zh','腰果',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(230,89,'zh','花生',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(232,91,'zh','核桃',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(234,13,'zh','鳀鱼',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(236,20,'zh','三文鱼',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(238,26,'zh','金枪鱼',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(240,23,'zh','虾',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(242,15,'zh','螃蟹',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(244,52,'zh','苹果',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(246,53,'zh','牛油果',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(248,54,'zh','香蕉',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(250,55,'zh','蓝莓',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(252,56,'zh','哈密瓜',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(254,57,'zh','樱桃',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(256,59,'zh','葡萄',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(258,62,'zh','柠檬',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(260,65,'zh','橙子',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(262,72,'zh','草莓',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(264,73,'zh','西瓜',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(266,27,'zh','芦笋',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(268,28,'zh','彩椒',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(270,29,'zh','西兰花',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(272,30,'zh','卷心菜',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(274,31,'zh','胡萝卜',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(276,32,'zh','花椰菜',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(278,33,'zh','芹菜',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(280,34,'zh','玉米',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(282,35,'zh','黄瓜',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(284,36,'zh','茄子',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(286,37,'zh','大蒜',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(288,96,'zh','生姜',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(290,38,'zh','四季豆',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(292,40,'zh','生菜',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(294,41,'zh','蘑菇',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(296,42,'zh','洋葱',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(298,45,'zh','土豆',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(300,48,'zh','菠菜',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(302,49,'zh','红薯',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(304,50,'zh','番茄',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(306,51,'zh','西葫芦',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(308,1,'zh','培根',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(310,2,'zh','鸡胸肉',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(312,3,'zh','鸡腿',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(314,4,'zh','鸡翅',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(316,5,'zh','牛肉馅',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(318,9,'zh','猪肉',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(320,7,'zh','羊肉',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(322,74,'zh','黄油',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(324,75,'zh','奶酪',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(326,77,'zh','奶油',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(328,78,'zh','鸡蛋',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(330,79,'zh','牛奶',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(332,80,'zh','酸奶',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(334,81,'zh','面包',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(336,82,'zh','糙米',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(338,84,'zh','意大利面',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(340,85,'zh','藜麦',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(342,92,'zh','罗勒',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(344,93,'zh','香菜',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(346,94,'zh','肉桂',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(348,98,'zh','牛至',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(350,99,'zh','欧芹',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(352,100,'zh','迷迭香',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(354,101,'zh','百里香',NULL,'2025-07-27 05:41:54','2025-07-27 05:41:54');
INSERT INTO ingredients_i18n VALUES(362,58,'zh','椰子',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(364,60,'zh','柚子',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(366,61,'zh','猕猴桃',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(368,63,'zh','青柠',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(370,64,'zh','芒果',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(372,66,'zh','木瓜',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(374,67,'zh','桃子',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(376,68,'zh','梨',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(378,69,'zh','菠萝',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(380,70,'zh','李子',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(382,71,'zh','覆盆子',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(384,14,'zh','鳕鱼',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(386,16,'zh','小龙虾',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(388,17,'zh','龙虾',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(390,18,'zh','贻贝',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(392,19,'zh','牡蛎',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(394,21,'zh','沙丁鱼',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(396,22,'zh','扇贝',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(398,24,'zh','鱿鱼',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(400,25,'zh','鳟鱼',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(402,6,'zh','火腿',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(404,8,'zh','肝脏',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(406,10,'zh','排骨',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(408,11,'zh','香肠',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(410,12,'zh','牛排',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(412,39,'zh','羽衣甘蓝',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(414,43,'zh','豌豆',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(416,44,'zh','辣椒',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(418,46,'zh','南瓜',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(420,47,'zh','萝卜',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(422,76,'zh','茅屋奶酪',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(424,83,'zh','燕麦片',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(426,86,'zh','白米',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(428,90,'zh','山核桃',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(430,95,'zh','蒜粉',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(432,97,'zh','薄荷',NULL,'2025-07-27 05:47:06','2025-07-27 05:47:06');
INSERT INTO ingredients_i18n VALUES(439,113,'zh','山药',NULL,'2025-08-13 15:42:09','2025-08-13 15:42:09');
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('cuisines',19);
INSERT INTO sqlite_sequence VALUES('languages',2);
INSERT INTO sqlite_sequence VALUES('ingredient_categories',9);
INSERT INTO sqlite_sequence VALUES('ingredient_categories_i18n',36);
INSERT INTO sqlite_sequence VALUES('cuisines_i18n',27);
INSERT INTO sqlite_sequence VALUES('ingredients',113);
INSERT INTO sqlite_sequence VALUES('recipes_i18n',41);
CREATE INDEX idx_ingredient_categories_slug ON ingredient_categories(slug);
CREATE INDEX idx_ingredient_categories_i18n_category_lang ON ingredient_categories_i18n(category_id, language_code);
CREATE INDEX idx_cuisines_i18n_cuisine_lang ON cuisines_i18n(cuisine_id, language_code);
CREATE INDEX idx_ingredient_categories_i18n_category ON ingredient_categories_i18n(category_id);
CREATE INDEX idx_ingredient_categories_i18n_language ON ingredient_categories_i18n(language_code);
CREATE INDEX idx_ingredients_slug ON ingredients(slug);
CREATE INDEX idx_ingredients_category ON ingredients(category_id);
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_recipes_i18n_recipe_id ON recipes_i18n(recipe_id);
CREATE INDEX idx_recipes_i18n_language ON recipes_i18n(language_code);
CREATE INDEX idx_recipes_i18n_recipe_lang ON recipes_i18n(recipe_id, language_code);
CREATE INDEX idx_model_usage_records_model_name ON model_usage_records(model_name);
CREATE INDEX idx_model_usage_records_model_type ON model_usage_records(model_type);
CREATE INDEX idx_model_usage_records_created_at ON model_usage_records(created_at);
