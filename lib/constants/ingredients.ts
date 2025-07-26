export interface Ingredient {
  id: string;
  name: string;
  englishName: string;
  category?: string;
  isCustom?: boolean;
  userId?: string;
}

export const ingredients: Ingredient[] = [
// Meat
{ id: "bacon", name: "培根", englishName: "Bacon" },
{ id: "chicken_breast", name: "鸡胸", englishName: "Chicken Breast" },
{ id: "chicken_leg", name: "鸡腿", englishName: "Chicken Leg" },
{ id: "chicken_wing", name: "鸡翅", englishName: "Chicken Wing" },
{ id: "ground_beef", name: "碎牛肉", englishName: "Ground Beef" },
{ id: "ham", name: "火腿", englishName: "Ham" },
{ id: "lamb", name: "羊肉", englishName: "Lamb" },
{ id: "liver", name: "肝脏", englishName: "Liver" },
{ id: "pork", name: "猪肉", englishName: "Pork" },
{ id: "ribs", name: "排骨", englishName: "Ribs" },
{ id: "sausage", name: "香肠", englishName: "Sausage" },
{ id: "steak", name: "牛排", englishName: "Steak" },

// Seafood
{ id: "anchovie", name: "凤尾鱼", englishName: "Anchovie" },
{ id: "cod", name: "鳕鱼", englishName: "Cod" },
{ id: "crab", name: "螃蟹", englishName: "Crab" },
{ id: "crawfish", name: "小龙虾", englishName: "Crawfish" },
{ id: "lobster", name: "龙虾", englishName: "Lobster" },
{ id: "mussel", name: "贻贝", englishName: "Mussel" },
{ id: "oyster", name: "生蚝", englishName: "Oyster" },
{ id: "salmon", name: "三文鱼", englishName: "Salmon" },
{ id: "sardine", name: "沙丁鱼", englishName: "Sardine" },
{ id: "scallop", name: "扇贝", englishName: "Scallop" },
{ id: "shrimp", name: "虾", englishName: "Shrimp" },
{ id: "squid", name: "鱿鱼", englishName: "Squid" },
{ id: "trout", name: "鳟鱼", englishName: "Trout" },
{ id: "tuna", name: "金枪鱼", englishName: "Tuna" },

// Vegetables
{ id: "asparagus", name: "芦笋", englishName: "Asparagus" },
{ id: "bell_pepper", name: "彩椒", englishName: "Bell Pepper" }, 
{ id: "broccoli", name: "西兰花", englishName: "Broccoli" },
{ id: "cabbage", name: "卷心菜", englishName: "Cabbage" },
{ id: "carrot", name: "胡萝卜", englishName: "Carrot" },
{ id: "cauliflower", name: "花椰菜", englishName: "Cauliflower" },
{ id: "celery", name: "芹菜", englishName: "Celery" },
{ id: "corn", name: "玉米", englishName: "Corn" },
{ id: "cucumber", name: "黄瓜", englishName: "Cucumber" },
{ id: "eggplant", name: "茄子", englishName: "Eggplant" },
{ id: "garlic", name: "大蒜", englishName: "Garlic" },
{ id: "green_bean", name: "青豆", englishName: "Green Bean" },
{ id: "kale", name: "羽衣甘蓝", englishName: "Kale" },
{ id: "lettuce", name: "生菜", englishName: "Lettuce" },
{ id: "mushroom", name: "蘑菇", englishName: "Mushroom" },
{ id: "onion", name: "洋葱", englishName: "Onion" },
{ id: "pea", name: "豌豆", englishName: "Pea" },
{ id: "pepper", name: "辣椒", englishName: "Pepper" },
{ id: "potato", name: "土豆", englishName: "Potato" },
{ id: "pumpkin", name: "南瓜", englishName: "Pumpkin" },
{ id: "radish", name: "萝卜", englishName: "Radish" },
{ id: "spinach", name: "菠菜", englishName: "Spinach" },
{ id: "sweet_potato", name: "红薯", englishName: "Sweet Potato" },
{ id: "tomato", name: "番茄", englishName: "Tomato" },
{ id: "zucchini", name: "西葫芦", englishName: "Zucchini" },

// Fruits
{ id: "apple", name: "苹果", englishName: "Apple" },
{ id: "avocado", name: "牛油果", englishName: "Avocado" },
{ id: "banana", name: "香蕉", englishName: "Banana" },
{ id: "blueberry", name: "蓝莓", englishName: "Blueberry" },
{ id: "cantaloupe", name: "哈密瓜", englishName: "Cantaloupe" },
{ id: "cherry", name: "樱桃", englishName: "Cherry" },
{ id: "coconut", name: "椰子", englishName: "Coconut" },
{ id: "grape", name: "葡萄", englishName: "Grape" },
{ id: "grapefruit", name: "西柚", englishName: "Grapefruit" },
{ id: "kiwi", name: "猕猴桃", englishName: "Kiwi" },
{ id: "lemon", name: "柠檬", englishName: "Lemon" },
{ id: "lime", name: "青柠", englishName: "Lime" },
{ id: "mango", name: "芒果", englishName: "Mango" },
{ id: "orange", name: "橙子", englishName: "Orange" },
{ id: "papaya", name: "木瓜", englishName: "Papaya" },
{ id: "peach", name: "桃子", englishName: "Peach" },
{ id: "pear", name: "梨", englishName: "Pear" },
{ id: "pineapple", name: "菠萝", englishName: "Pineapple" },
{ id: "plum", name: "李子", englishName: "Plum" },
{ id: "raspberry", name: "树莓", englishName: "Raspberry" },
{ id: "strawberry", name: "草莓", englishName: "Strawberry" },
{ id: "watermelon", name: "西瓜", englishName: "Watermelon" },

// Dairy & Eggs
{ id: "butter", name: "黄油", englishName: "Butter" },
{ id: "cheese", name: "奶酪", englishName: "Cheese" },
{ id: "cottage_cheese", name: "农家奶酪", englishName: "Cottage Cheese" },
{ id: "cream", name: "奶油", englishName: "Cream" },
{ id: "egg", name: "鸡蛋", englishName: "Egg" },
{ id: "milk", name: "牛奶", englishName: "Milk" },
{ id: "yogurt", name: "酸奶", englishName: "Yogurt" },

// Grains & Bread
{ id: "bread", name: "面包", englishName: "Bread" },
{ id: "brown_rice", name: "糙米", englishName: "Brown Rice" },
{ id: "oatmeal", name: "燕麦片", englishName: "Oatmeal" },
{ id: "pasta", name: "意大利面", englishName: "Pasta" },
{ id: "quinoa", name: "藜麦", englishName: "Quinoa" },
{ id: "white_rice", name: "白米", englishName: "White Rice" },

// Nuts & Seeds
{ id: "almond", name: "杏仁", englishName: "Almond" },
{ id: "cashew", name: "腰果", englishName: "Cashew" },
{ id: "peanut", name: "花生", englishName: "Peanut" },
{ id: "pecan", name: "山核桃", englishName: "Pecan" },
{ id: "walnut", name: "核桃", englishName: "Walnut" },

// Herbs & Spices
{ id: "basil", name: "罗勒", englishName: "Basil" },
{ id: "cilantro", name: "香菜", englishName: "Cilantro" },
{ id: "cinnamon", name: "肉桂", englishName: "Cinnamon" },
{ id: "garlic_powder", name: "蒜粉", englishName: "Garlic Powder" },
{ id: "ginger", name: "生姜", englishName: "Ginger" },
{ id: "mint", name: "薄荷", englishName: "Mint" },
{ id: "oregano", name: "牛至", englishName: "Oregano" },
{ id: "parsley", name: "欧芹", englishName: "Parsley" },
{ id: "rosemary", name: "迷迭香", englishName: "Rosemary" },
{ id: "thyme", name: "百里香", englishName: "Thyme" },

// Oils & Condiments
{ id: "ketchup", name: "番茄酱", englishName: "Ketchup" },
{ id: "mayonnaise", name: "蛋黄酱", englishName: "Mayonnaise" },
{ id: "mustard", name: "芥末", englishName: "Mustard" },
{ id: "olive_oil", name: "橄榄油", englishName: "Olive Oil" },
{ id: "soy_sauce", name: "酱油", englishName: "Soy Sauce" },
{ id: "vinegar", name: "醋", englishName: "Vinegar" }
]; 
