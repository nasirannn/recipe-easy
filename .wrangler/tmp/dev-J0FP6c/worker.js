var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-W17ra4/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/worker.ts
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    try {
      if (path === "/" || path === "") {
        return new Response(JSON.stringify({
          message: "RecipeEasy API Service",
          version: "1.0.0",
          endpoints: {
            categories: "/api/categories",
            ingredients: "/api/ingredients",
            cuisines: "/api/cuisines",
            recipes: "/api/recipes",
            images: "/images/"
          },
          documentation: "This is the backend API service for RecipeEasy application"
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (path.startsWith("/images/")) {
        return await handleImages(request, env.RECIPE_IMAGES, corsHeaders);
      }
      if (path === "/api/categories") {
        return await handleCategories(request, env.RECIPE_EASY_DB, corsHeaders);
      }
      if (path === "/api/ingredients") {
        return await handleIngredients(request, env.RECIPE_EASY_DB, corsHeaders);
      }
      if (path === "/api/cuisines") {
        return await handleCuisines(request, env.RECIPE_EASY_DB, corsHeaders);
      }
      if (path === "/api/user-usage") {
        return await handleUserUsage(request, env.RECIPE_EASY_DB, corsHeaders);
      }
      if (path === "/api/recipes") {
        return await handleRecipes(request, env.RECIPE_EASY_DB, corsHeaders);
      }
      if (path === "/api/admin/add-columns") {
        return await handleAddColumns(request, env.RECIPE_EASY_DB, corsHeaders);
      }
      if (path === "/api/system-configs") {
        return await handleSystemConfigs(request, env.RECIPE_EASY_DB, corsHeaders);
      }
      return new Response("API endpoint not found", {
        status: 404,
        headers: corsHeaders
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
async function handleImages(request, bucket, corsHeaders) {
  try {
    const url = new URL(request.url);
    const imagePath = url.pathname.replace("/images/", "");
    if (!imagePath) {
      return new Response("Image path is required", {
        status: 400,
        headers: corsHeaders
      });
    }
    const object = await bucket.get(imagePath);
    if (!object) {
      return new Response("Image not found", {
        status: 404,
        headers: corsHeaders
      });
    }
    const contentType = getContentType(imagePath);
    return new Response(object.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000"
        // 缓存1年
      }
    });
  } catch (error) {
    console.error("Image serving error:", error);
    return new Response("Failed to serve image", {
      status: 500,
      headers: corsHeaders
    });
  }
}
__name(handleImages, "handleImages");
function getContentType(filename) {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}
__name(getContentType, "getContentType");
async function handleCategories(request, db, corsHeaders) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get("lang") || "en";
    const { results } = await db.prepare(`
      SELECT 
        c.id,
        c18n.name as category_name
      FROM ingredient_categories c
      LEFT JOIN ingredient_categories_i18n c18n ON c.id = c18n.category_id AND c18n.language_code = ?
      ORDER BY c.id ASC
    `).bind(language).all();
    const categories = results || [];
    const formattedCategories = categories.map((category) => {
      const slugMap = {
        1: "meat",
        2: "seafood",
        3: "vegetables",
        4: "fruits",
        5: "dairy-eggs",
        6: "grains-bread",
        7: "nuts-seeds",
        8: "herbs-spices",
        9: "oils-condiments"
      };
      return {
        id: category.id,
        slug: slugMap[category.id] || `category-${category.id}`,
        name: category.category_name || `Category ${category.id}`,
        sort_order: category.id
      };
    });
    return new Response(JSON.stringify({
      success: true,
      data: formattedCategories,
      total: formattedCategories.length,
      language,
      source: "database"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Categories API error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "\u83B7\u53D6\u5206\u7C7B\u6570\u636E\u5931\u8D25",
      details: error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleCategories, "handleCategories");
async function handleIngredients(request, db, corsHeaders) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get("lang") || "en";
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    let sql = `
      SELECT 
        i.id,
        i.slug,
        i.category_id,
        i18n.name as ingredient_name,
        c18n.name as category_name
      FROM ingredients i
      LEFT JOIN ingredients_i18n i18n ON i.id = i18n.ingredient_id AND i18n.language_code = ?
      LEFT JOIN ingredient_categories_i18n c18n ON i.category_id = c18n.category_id AND c18n.language_code = ?
    `;
    const params = [language, language];
    if (category) {
      const categoryId = parseInt(category);
      if (!isNaN(categoryId)) {
        sql += " WHERE i.category_id = ?";
        params.push(categoryId);
      }
    }
    sql += " ORDER BY i.id ASC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    const { results } = await db.prepare(sql).bind(...params).all();
    const ingredients = results || [];
    const formattedIngredients = ingredients.map((ingredient) => {
      const slugMap = {
        1: "meat",
        2: "seafood",
        3: "vegetables",
        4: "fruits",
        5: "dairy-eggs",
        6: "grains-bread",
        7: "nuts-seeds",
        8: "herbs-spices",
        9: "oils-condiments"
      };
      return {
        id: ingredient.id,
        slug: ingredient.slug || `ingredient-${ingredient.id}`,
        name: ingredient.ingredient_name || `Ingredient ${ingredient.id}`,
        englishName: ingredient.ingredient_name || `Ingredient ${ingredient.id}`,
        category: {
          id: ingredient.category_id || 1,
          slug: slugMap[ingredient.category_id] || "other",
          name: ingredient.category_name || "Other"
        }
      };
    });
    return new Response(JSON.stringify({
      success: true,
      results: formattedIngredients,
      total: formattedIngredients.length,
      limit,
      offset,
      language,
      source: "database"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Ingredients API error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "\u83B7\u53D6\u98DF\u6750\u6570\u636E\u5931\u8D25",
      details: error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleIngredients, "handleIngredients");
async function handleCuisines(request, db, corsHeaders) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get("lang") || "en";
    const { results } = await db.prepare(`
      SELECT 
        c.id,
        c.name,
        COALESCE(c18n.name, c.name) as localized_name,
        COALESCE(c18n.description, c.description) as localized_description,
        c.created_at,
        c.updated_at
      FROM cuisines c
      LEFT JOIN cuisines_i18n c18n ON c.id = c18n.cuisine_id AND c18n.language_code = ?
      ORDER BY c.name ASC
    `).bind(language).all();
    const cuisines = results || [];
    return new Response(JSON.stringify({
      success: true,
      data: cuisines,
      total: cuisines.length,
      language,
      source: "database"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Cuisines API error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "\u83B7\u53D6\u83DC\u7CFB\u6570\u636E\u5931\u8D25",
      details: error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleCuisines, "handleCuisines");
async function getSystemConfig(db, key, defaultValue) {
  try {
    const result = await db.prepare(`
      SELECT value FROM system_configs WHERE key = ?
    `).bind(key).first();
    if (!result || !result.value) {
      return defaultValue;
    }
    const value = String(result.value);
    if (typeof defaultValue === "number") {
      const numValue = parseInt(value, 10);
      return isNaN(numValue) ? defaultValue : numValue;
    } else if (typeof defaultValue === "boolean") {
      return value.toLowerCase() === "true";
    }
    return value;
  } catch (error) {
    console.error(`Error getting system config ${key}:`, error);
    return defaultValue;
  }
}
__name(getSystemConfig, "getSystemConfig");
async function handleUserUsage(request, db, corsHeaders) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const isAdmin = searchParams.get("isAdmin") === "true";
    if (request.method === "GET") {
      if (!userId) {
        return new Response(JSON.stringify({ error: "User ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const userCredits = await db.prepare(`
        SELECT * FROM user_credits WHERE user_id = ?
      `).bind(userId).first();
      if (!userCredits) {
        const initialCredits = await getSystemConfig(db, "initial_credits", 100);
        const newCredits = await db.prepare(`
          INSERT INTO user_credits (user_id, credits, total_earned, total_spent, created_at, updated_at)
          VALUES (?, ?, ?, 0, DATETIME('now'), DATETIME('now'))
          RETURNING *
        `).bind(userId, initialCredits, initialCredits).first();
        return new Response(JSON.stringify({
          success: true,
          data: {
            credits: newCredits,
            canGenerate: true,
            availableCredits: initialCredits
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const adminUnlimited = await getSystemConfig(db, "admin_unlimited", true);
      const canGenerate = isAdmin && adminUnlimited || userCredits.credits > 0;
      return new Response(JSON.stringify({
        success: true,
        data: {
          credits: userCredits,
          canGenerate,
          availableCredits: userCredits.credits
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else if (request.method === "POST") {
      const body = await request.json();
      const { userId: userId2, action, amount, description } = body;
      if (!userId2) {
        return new Response(JSON.stringify({ error: "User ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (action === "spend") {
        const generationCost = amount || await getSystemConfig(db, "generation_cost", 1);
        const userCredits = await db.prepare(`
          SELECT * FROM user_credits WHERE user_id = ?
        `).bind(userId2).first();
        if (!userCredits || userCredits.credits < generationCost) {
          return new Response(JSON.stringify({
            success: false,
            message: "Insufficient credits."
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        const updatedCredits = await db.prepare(`
          UPDATE user_credits 
          SET credits = credits - ?, total_spent = total_spent + ?, updated_at = DATETIME('now')
          WHERE user_id = ?
          RETURNING *
        `).bind(generationCost, generationCost, userId2).first();
        const transaction = await db.prepare(`
          INSERT INTO credit_transactions (user_id, type, amount, reason, description)
          VALUES (?, 'spend', ?, 'generation', ?)
          RETURNING *
        `).bind(userId2, generationCost, description || `Generated a recipe for ${generationCost} credits.`).first();
        return new Response(JSON.stringify({
          success: true,
          message: `Successfully spent ${generationCost} credits.`,
          data: { credits: updatedCredits, transactionId: transaction.id }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("User usage API error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to process user usage request",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleUserUsage, "handleUserUsage");
async function handleRecipes(request, db, corsHeaders) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search");
    const cuisineId = searchParams.get("cuisineId");
    const language = searchParams.get("lang") || "en";
    let hasI18nTable = false;
    try {
      const tableCheck = await db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='recipes_i18n'
      `).first();
      hasI18nTable = !!tableCheck;
    } catch (e) {
      hasI18nTable = false;
    }
    let sql = `
      SELECT 
        r.*,
        c.name as cuisine_name,
        COALESCE(c18n.name, c.name) as localized_cuisine_name
    `;
    if (hasI18nTable) {
      sql += `,
        COALESCE(r18n.title, r.title) as localized_title,
        COALESCE(r18n.description, r.description) as localized_description,
        COALESCE(r18n.ingredients, r.ingredients) as localized_ingredients,
        COALESCE(r18n.seasoning, r.seasoning) as localized_seasoning,
        COALESCE(r18n.instructions, r.instructions) as localized_instructions,
        COALESCE(r18n.chef_tips, r.chef_tips) as localized_chef_tips,
        COALESCE(r18n.tags, r.tags) as localized_tags,
        COALESCE(r18n.difficulty, r.difficulty) as localized_difficulty
      `;
    }
    sql += `
      FROM recipes r
      LEFT JOIN cuisines c ON r.cuisine_id = c.id
      LEFT JOIN cuisines_i18n c18n ON c.id = c18n.cuisine_id AND c18n.language_code = ?
    `;
    const params = [language];
    if (hasI18nTable) {
      sql += ` LEFT JOIN recipes_i18n r18n ON r.id = r18n.recipe_id AND r18n.language_code = ?`;
      params.push(language);
    }
    const conditions = [];
    if (search) {
      if (hasI18nTable) {
        conditions.push("(COALESCE(r18n.title, r.title) LIKE ? OR COALESCE(r18n.description, r.description) LIKE ?)");
      } else {
        conditions.push("(r.title LIKE ? OR r.description LIKE ?)");
      }
      params.push(`%${search}%`, `%${search}%`);
    }
    if (cuisineId) {
      conditions.push("r.cuisine_id = ?");
      params.push(parseInt(cuisineId));
    }
    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY r.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    const { results } = await db.prepare(sql).bind(...params).all();
    const recipes = results || [];
    let countSql = "SELECT COUNT(*) as total FROM recipes r";
    const countConditions = [];
    const countParams = [];
    if (search) {
      if (hasI18nTable) {
        countSql += ` LEFT JOIN recipes_i18n r18n ON r.id = r18n.recipe_id AND r18n.language_code = ?`;
        countConditions.push("(COALESCE(r18n.title, r.title) LIKE ? OR COALESCE(r18n.description, r.description) LIKE ?)");
        countParams.push(language, `%${search}%`, `%${search}%`);
      } else {
        countConditions.push("(r.title LIKE ? OR r.description LIKE ?)");
        countParams.push(`%${search}%`, `%${search}%`);
      }
    }
    if (cuisineId) {
      countConditions.push("r.cuisine_id = ?");
      countParams.push(parseInt(cuisineId));
    }
    if (countConditions.length > 0) {
      countSql += " WHERE " + countConditions.join(" AND ");
    }
    const countResult = await db.prepare(countSql).bind(...countParams).first();
    const total = countResult?.total || 0;
    return new Response(JSON.stringify({
      success: true,
      data: recipes,
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit),
      hasI18nTable
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Recipes API error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "\u83B7\u53D6\u83DC\u8C31\u6570\u636E\u5931\u8D25",
      details: error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleRecipes, "handleRecipes");
async function handleAddColumns(request, db, corsHeaders) {
  try {
    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders
      });
    }
    await db.prepare("ALTER TABLE recipes_i18n ADD COLUMN tags TEXT").run();
    await db.prepare("ALTER TABLE recipes_i18n ADD COLUMN difficulty TEXT").run();
    return new Response(JSON.stringify({
      success: true,
      message: "Columns added successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Add columns error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to add columns",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleAddColumns, "handleAddColumns");
async function handleSystemConfigs(request, db, corsHeaders) {
  try {
    if (request.method === "GET") {
      const { results } = await db.prepare(`
        SELECT key, value, description, updated_at FROM system_configs
        ORDER BY key ASC
      `).all();
      return new Response(JSON.stringify({
        success: true,
        data: results || []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else if (request.method === "POST") {
      const { key, value, description } = await request.json();
      if (!key || value === void 0) {
        return new Response(JSON.stringify({
          success: false,
          error: "\u53C2\u6570\u9519\u8BEF: \u5FC5\u987B\u63D0\u4F9B key \u548C value"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const result = await db.prepare(`
        INSERT INTO system_configs (key, value, description, updated_at)
        VALUES (?, ?, ?, DATETIME('now'))
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          description = COALESCE(excluded.description, description),
          updated_at = DATETIME('now')
        RETURNING *
      `).bind(key, String(value), description || "").first();
      return new Response(JSON.stringify({
        success: true,
        data: result
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: "Method not allowed"
      }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("System configs error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to handle system configs",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleSystemConfigs, "handleSystemConfigs");

// ../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// .wrangler/tmp/bundle-W17ra4/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-W17ra4/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
