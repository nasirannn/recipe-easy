-- 创建食谱表
CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  tags TEXT, -- JSON 数组存储为字符串
  cook_time INTEGER,
  servings INTEGER,
  difficulty TEXT,
  ingredients TEXT, -- JSON 数组存储为字符串
  seasoning TEXT, -- JSON 数组存储为字符串
  steps TEXT, -- JSON 数组存储为字符串
  chef_tips TEXT, -- JSON 数组存储为字符串
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes(title);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_cook_time ON recipes(cook_time);
