type MealPlanPdfMeal = {
  title: string;
  description: string;
};

export type MealPlanPdfDay = {
  day: string;
  breakfast: MealPlanPdfMeal;
  lunch: MealPlanPdfMeal;
  dinner: MealPlanPdfMeal;
  snack: MealPlanPdfMeal;
};

type MealPlanPdfLabels = {
  day: string;
  prompt: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
};

type ExportMealPlanPdfOptions = {
  title: string;
  prompt: string;
  fileNameBase: string;
  days: MealPlanPdfDay[];
  labels: MealPlanPdfLabels;
};

type CellMeasure = {
  titleLines: string[];
  descriptionLines: string[];
  height: number;
};

type RowMeasure = {
  dayLines: string[];
  cells: CellMeasure[];
  height: number;
};

const MEAL_KEYS = ["breakfast", "lunch", "dinner", "snack"] as const;

const FONT_FAMILY =
  "\"PingFang SC\", \"Microsoft YaHei\", \"Noto Sans SC\", \"Helvetica Neue\", Helvetica, Arial, sans-serif";

const BRAND_THEME = {
  primary: "#13ec5b",
  primaryDeep: "#102216",
  pageBg: "#f8fcf8",
  paperBg: "#ffffff",
  ink: "#0f172a",
  muted: "#64748b",
  stripe: "#f7fbf7",
  line: "#cbd5e1",
};

const HEADER_THEMES = {
  day: {
    background: "#dcfce7",
    text: "#166534",
  },
  breakfast: {
    background: "#fff7ed",
    text: "#9a3412",
    title: "#7c2d12",
  },
  lunch: {
    background: "#eff6ff",
    text: "#1e3a8a",
    title: "#1e40af",
  },
  dinner: {
    background: "#f5f3ff",
    text: "#5b21b6",
    title: "#6d28d9",
  },
  snack: {
    background: "#ecfdf5",
    text: "#166534",
    title: "#15803d",
  },
};

const PDF_STYLE = {
  pageWidthPx: 1600,
  pagePaddingX: 40,
  pagePaddingY: 40,
  topBarHeightPx: 8,
  titleSizePx: 30,
  titleLineHeightPx: 36,
  labelSizePx: 13,
  promptSizePx: 15,
  promptLineHeightPx: 23,
  tableHeaderSizePx: 12,
  tableHeaderLineHeightPx: 16,
  dayTextSizePx: 12,
  dayLineHeightPx: 18,
  cellTitleSizePx: 12,
  cellTitleLineHeightPx: 18,
  cellDescriptionSizePx: 11,
  cellDescriptionLineHeightPx: 17,
  dayColWidthPx: 150,
  tableHeaderHeightPx: 36,
  cellPaddingX: 10,
  cellPaddingY: 10,
  topGapAfterTitlePx: 16,
  topGapAfterPromptPx: 18,
  promptLabelGapPx: 8,
  rowMinHeightPx: 66,
  borderColor: BRAND_THEME.line,
  textColor: BRAND_THEME.ink,
  mutedColor: BRAND_THEME.muted,
};

function sanitizeFileName(value: string) {
  return (
    (value || "meal-plan")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .slice(0, 64) || "meal-plan"
  );
}

function getColumnWidths() {
  const contentWidth = PDF_STYLE.pageWidthPx - PDF_STYLE.pagePaddingX * 2;
  const mealColWidth = (contentWidth - PDF_STYLE.dayColWidthPx) / MEAL_KEYS.length;

  return {
    contentWidth,
    mealColWidth,
  };
}

function splitTextWithCanvas(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fallback = "-"
) {
  const normalized = (text || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return fallback ? [fallback] : [];
  }

  const lines: string[] = [];
  const rawLines = normalized.split("\n");

  rawLines.forEach((rawLine) => {
    const lineText = rawLine.trim();
    if (!lineText) {
      lines.push("");
      return;
    }

    let currentLine = "";
    for (const char of lineText) {
      const nextLine = `${currentLine}${char}`;
      if (context.measureText(nextLine).width <= maxWidth || !currentLine) {
        currentLine = nextLine;
      } else {
        lines.push(currentLine.trimEnd());
        currentLine = char;
      }
    }

    if (currentLine) {
      lines.push(currentLine.trimEnd());
    }
  });

  if (lines.length > 0) {
    return lines;
  }

  return fallback ? [fallback] : [];
}

function buildRows(
  context: CanvasRenderingContext2D,
  days: MealPlanPdfDay[],
  mealColWidth: number
) {
  const rows: RowMeasure[] = [];
  const dayInnerWidth = PDF_STYLE.dayColWidthPx - PDF_STYLE.cellPaddingX * 2;
  const mealInnerWidth = mealColWidth - PDF_STYLE.cellPaddingX * 2;

  for (const day of days) {
    context.font = `700 ${PDF_STYLE.dayTextSizePx}px ${FONT_FAMILY}`;
    const dayLines = splitTextWithCanvas(context, day.day, dayInnerWidth);
    const dayHeight = dayLines.length * PDF_STYLE.dayLineHeightPx + PDF_STYLE.cellPaddingY * 2;

    const cells: CellMeasure[] = [];
    let rowHeight = Math.max(PDF_STYLE.rowMinHeightPx, dayHeight);

    for (const mealKey of MEAL_KEYS) {
      const meal = day[mealKey];

      context.font = `700 ${PDF_STYLE.cellTitleSizePx}px ${FONT_FAMILY}`;
      const titleLines = splitTextWithCanvas(context, meal.title, mealInnerWidth);

      context.font = `500 ${PDF_STYLE.cellDescriptionSizePx}px ${FONT_FAMILY}`;
      const descriptionLines = splitTextWithCanvas(context, meal.description, mealInnerWidth, "");

      const titleHeight = titleLines.length * PDF_STYLE.cellTitleLineHeightPx;
      const descriptionHeight = descriptionLines.length * PDF_STYLE.cellDescriptionLineHeightPx;
      const cellHeight =
        PDF_STYLE.cellPaddingY * 2 +
        titleHeight +
        (descriptionLines.length > 0 ? 4 + descriptionHeight : 0);

      rowHeight = Math.max(rowHeight, cellHeight);
      cells.push({
        titleLines,
        descriptionLines,
        height: cellHeight,
      });
    }

    rows.push({
      dayLines,
      cells,
      height: rowHeight,
    });
  }

  return rows;
}

function drawMultilineText(
  context: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number
) {
  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });
}

function createCanvas(options: ExportMealPlanPdfOptions) {
  const canvas = document.createElement("canvas");
  canvas.width = PDF_STYLE.pageWidthPx;
  canvas.height = 240;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas context unavailable");
  }

  const { contentWidth, mealColWidth } = getColumnWidths();
  const promptWidth = contentWidth;

  context.font = `500 ${PDF_STYLE.promptSizePx}px ${FONT_FAMILY}`;
  const promptLines = splitTextWithCanvas(context, options.prompt, promptWidth);
  const promptTextHeight = promptLines.length * PDF_STYLE.promptLineHeightPx;
  const promptBlockHeight =
    PDF_STYLE.labelSizePx +
    PDF_STYLE.promptLabelGapPx +
    promptTextHeight;

  const measuredRows = buildRows(context, options.days, mealColWidth);
  const tableBodyHeight = measuredRows.reduce((sum, row) => sum + row.height, 0);
  const tableHeight = PDF_STYLE.tableHeaderHeightPx + tableBodyHeight;

  const pageHeight =
    PDF_STYLE.pagePaddingY * 2 +
    PDF_STYLE.titleLineHeightPx +
    PDF_STYLE.topGapAfterTitlePx +
    promptBlockHeight +
    PDF_STYLE.topGapAfterPromptPx +
    tableHeight;

  canvas.height = Math.ceil(pageHeight);

  const drawContext = canvas.getContext("2d");
  if (!drawContext) {
    throw new Error("Canvas context unavailable");
  }

  drawContext.textBaseline = "top";
  drawContext.fillStyle = BRAND_THEME.pageBg;
  drawContext.fillRect(0, 0, canvas.width, canvas.height);

  const topBarGradient = drawContext.createLinearGradient(0, 0, canvas.width, 0);
  topBarGradient.addColorStop(0, BRAND_THEME.primary);
  topBarGradient.addColorStop(1, "#34d399");
  drawContext.fillStyle = topBarGradient;
  drawContext.fillRect(0, 0, canvas.width, PDF_STYLE.topBarHeightPx);

  const paperY = PDF_STYLE.pagePaddingY - 14;
  const paperHeight = canvas.height - paperY - 20;
  drawContext.fillStyle = BRAND_THEME.paperBg;
  drawContext.strokeStyle = "#e2e8f0";
  drawContext.lineWidth = 1;
  drawContext.fillRect(PDF_STYLE.pagePaddingX - 14, paperY, canvas.width - (PDF_STYLE.pagePaddingX - 14) * 2, paperHeight);
  drawContext.strokeRect(PDF_STYLE.pagePaddingX - 14, paperY, canvas.width - (PDF_STYLE.pagePaddingX - 14) * 2, paperHeight);

  let cursorY = PDF_STYLE.pagePaddingY;
  const startX = PDF_STYLE.pagePaddingX;
  const tableWidth = contentWidth;

  drawContext.fillStyle = BRAND_THEME.primaryDeep;
  drawContext.font = `700 ${PDF_STYLE.titleSizePx}px ${FONT_FAMILY}`;
  drawContext.fillText(options.title, startX, cursorY);
  cursorY += PDF_STYLE.titleLineHeightPx + PDF_STYLE.topGapAfterTitlePx;

  drawContext.font = `700 ${PDF_STYLE.labelSizePx}px ${FONT_FAMILY}`;
  const promptTagText = options.labels.prompt;
  drawContext.fillStyle = PDF_STYLE.mutedColor;
  drawContext.fillText(
    promptTagText,
    startX,
    cursorY
  );

  drawContext.fillStyle = BRAND_THEME.ink;
  drawContext.font = `500 ${PDF_STYLE.promptSizePx}px ${FONT_FAMILY}`;
  drawMultilineText(
    drawContext,
    promptLines,
    startX,
    cursorY + PDF_STYLE.labelSizePx + PDF_STYLE.promptLabelGapPx,
    PDF_STYLE.promptLineHeightPx
  );

  cursorY += promptBlockHeight + PDF_STYLE.topGapAfterPromptPx;

  drawContext.fillStyle = HEADER_THEMES.day.background;
  drawContext.fillRect(startX, cursorY, PDF_STYLE.dayColWidthPx, PDF_STYLE.tableHeaderHeightPx);
  MEAL_KEYS.forEach((key, index) => {
    drawContext.fillStyle = HEADER_THEMES[key].background;
    drawContext.fillRect(
      startX + PDF_STYLE.dayColWidthPx + mealColWidth * index,
      cursorY,
      mealColWidth,
      PDF_STYLE.tableHeaderHeightPx
    );
  });

  drawContext.strokeStyle = PDF_STYLE.borderColor;
  drawContext.lineWidth = 1;
  drawContext.strokeRect(startX, cursorY, tableWidth, tableHeight);

  const dayColX = startX;
  const mealColStartX = dayColX + PDF_STYLE.dayColWidthPx;
  for (let columnIndex = 0; columnIndex < MEAL_KEYS.length; columnIndex += 1) {
    const dividerX = mealColStartX + mealColWidth * columnIndex;
    drawContext.beginPath();
    drawContext.moveTo(dividerX, cursorY);
    drawContext.lineTo(dividerX, cursorY + tableHeight);
    drawContext.stroke();
  }

  drawContext.beginPath();
  drawContext.moveTo(startX, cursorY + PDF_STYLE.tableHeaderHeightPx);
  drawContext.lineTo(startX + tableWidth, cursorY + PDF_STYLE.tableHeaderHeightPx);
  drawContext.stroke();

  drawContext.fillStyle = HEADER_THEMES.day.text;
  drawContext.font = `700 ${PDF_STYLE.tableHeaderSizePx}px ${FONT_FAMILY}`;
  drawContext.fillText(
    options.labels.day.toUpperCase(),
    startX + PDF_STYLE.cellPaddingX,
    cursorY + 11
  );

  MEAL_KEYS.forEach((key, index) => {
    const label = options.labels[key].toUpperCase();
    const headerX = mealColStartX + mealColWidth * index + PDF_STYLE.cellPaddingX;
    drawContext.fillStyle = HEADER_THEMES[key].text;
    drawContext.fillText(label, headerX, cursorY + 11);
  });

  let rowY = cursorY + PDF_STYLE.tableHeaderHeightPx;
  measuredRows.forEach((row, rowIndex) => {
    if (rowIndex % 2 === 1) {
      drawContext.fillStyle = BRAND_THEME.stripe;
      drawContext.fillRect(startX, rowY, tableWidth, row.height);
    }

    drawContext.strokeStyle = PDF_STYLE.borderColor;
    drawContext.beginPath();
    drawContext.moveTo(startX, rowY + row.height);
    drawContext.lineTo(startX + tableWidth, rowY + row.height);
    drawContext.stroke();

    drawContext.fillStyle = PDF_STYLE.textColor;
    drawContext.font = `700 ${PDF_STYLE.dayTextSizePx}px ${FONT_FAMILY}`;
    drawMultilineText(
      drawContext,
      row.dayLines,
      startX + PDF_STYLE.cellPaddingX,
      rowY + PDF_STYLE.cellPaddingY,
      PDF_STYLE.dayLineHeightPx
    );

    row.cells.forEach((cell, cellIndex) => {
      const cellStartX = mealColStartX + mealColWidth * cellIndex;
      let cellTextY = rowY + PDF_STYLE.cellPaddingY;

      const mealKey = MEAL_KEYS[cellIndex];
      drawContext.fillStyle = HEADER_THEMES[mealKey].title;
      drawContext.font = `700 ${PDF_STYLE.cellTitleSizePx}px ${FONT_FAMILY}`;
      drawMultilineText(
        drawContext,
        cell.titleLines,
        cellStartX + PDF_STYLE.cellPaddingX,
        cellTextY,
        PDF_STYLE.cellTitleLineHeightPx
      );

      cellTextY += cell.titleLines.length * PDF_STYLE.cellTitleLineHeightPx + 4;

      drawContext.fillStyle = PDF_STYLE.mutedColor;
      drawContext.font = `500 ${PDF_STYLE.cellDescriptionSizePx}px ${FONT_FAMILY}`;
      drawMultilineText(
        drawContext,
        cell.descriptionLines,
        cellStartX + PDF_STYLE.cellPaddingX,
        cellTextY,
        PDF_STYLE.cellDescriptionLineHeightPx
      );
    });

    rowY += row.height;
  });

  return canvas;
}

export async function exportMealPlanPdf(options: ExportMealPlanPdfOptions) {
  const canvas = createCanvas(options);
  const imageData = canvas.toDataURL("image/jpeg", 0.92);
  const { jsPDF } = await import("jspdf");

  const pxToPt = (value: number) => Math.max(1, Math.ceil(value * 0.75));
  const pageWidthPt = pxToPt(canvas.width);
  const pageHeightPt = pxToPt(canvas.height);
  const orientation = pageWidthPt > pageHeightPt ? "landscape" : "portrait";

  const doc = new jsPDF({
    unit: "pt",
    format: [pageWidthPt, pageHeightPt],
    orientation,
    compress: true,
  });

  doc.addImage(imageData, "JPEG", 0, 0, pageWidthPt, pageHeightPt, undefined, "FAST");
  doc.save(`${sanitizeFileName(options.fileNameBase)}.pdf`);
}
