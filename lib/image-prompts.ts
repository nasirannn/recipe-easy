type PairingPayload = {
  type?: unknown;
  name?: unknown;
  note?: unknown;
  description?: unknown;
};

type BuildRecipeImagePromptParams = {
  recipeTitle: unknown;
  recipeIngredients: unknown;
  recipePairing?: unknown;
  language?: string;
};

function normalizePromptText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

function buildPairingDescriptor(recipePairing: unknown) {
  const pairingRaw =
    recipePairing && typeof recipePairing === "object"
      ? (recipePairing as PairingPayload)
      : {};

  const pairingType = normalizePromptText(pairingRaw.type, 40);
  const pairingName = normalizePromptText(pairingRaw.name, 80);
  const pairingNote = normalizePromptText(pairingRaw.note, 120);
  const hasPairing = Boolean(pairingType || pairingName || pairingNote);

  return {
    pairingType,
    pairingName,
    pairingNote,
    hasPairing,
  };
}

export function buildRecipeImagePrompt({
  recipeTitle,
  recipeIngredients,
  recipePairing,
  language = "en",
}: BuildRecipeImagePromptParams): string {
  const ingredientList = Array.isArray(recipeIngredients)
    ? recipeIngredients.join(", ")
    : recipeIngredients;

  const { pairingType, pairingName, pairingNote, hasPairing } = buildPairingDescriptor(recipePairing);

  if (language === "zh") {
    const pairingClause = hasPairing
      ? ` 推荐搭配饮品：${pairingName ?? pairingType}${pairingType && pairingName ? `（${pairingType}）` : ""}${pairingNote ? `，风味提示：${pairingNote}` : ""}。`
      : "";

    return `美食照片：${recipeTitle}，主要食材包含${ingredientList}。${pairingClause}纯净虚化的极简背景，高清特写镜头，微距视角，高清晰写实风格突出食物细节主体，在柔和自然光下拍摄以展现食材的质感与色彩层次，营造温暖诱人的食欲氛围。`;
  }

  const pairingClause = hasPairing
    ? ` Recommended drink pairing: ${pairingName ?? pairingType}${pairingType && pairingName ? ` (${pairingType})` : ""}${pairingNote ? `. Flavor note: ${pairingNote}` : ""}.`
    : "";

  return `Professional food photograph of ${recipeTitle}, featuring ingredients ${ingredientList}.${pairingClause} Clean and blurred minimalist background, high-definition close-up shot, macro perspective, high-definition realistic style, highlighting the food details, captured under soft natural lighting to showcase the texture and color layers of the ingredients, creating a warm and appetizing atmosphere.`;
}

