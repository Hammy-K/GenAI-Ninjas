type CsvOptions = {
  bom?: boolean; // add UTF-8 BOM for Excel
  headersOrder?: string[]; // explicit order
};

export class CsvUtils {
  static toCsv(rows: Record<string, any>[], opts: CsvOptions = {}): string {
    const { bom = true, headersOrder } = opts;

    const headers =
      headersOrder && headersOrder.length
        ? headersOrder
        : Array.from(
            rows.reduce<Set<string>>((s, r) => {
              Object.keys(r).forEach((k) => s.add(k));
              return s;
            }, new Set()),
          );

    const escape = (val: any) => {
      if (val === null || val === undefined) return "";

      const str = String(val);
      const needsQuotes = /[",\n\r]/.test(str);
      const escaped = str.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };

    const headerLine = headers.map((h) => escape(h)).join(",");

    const lines = rows.map((r) => headers.map((h) => escape(r[h])).join(","));

    const body = [headerLine, ...lines].join("\r\n");

    return bom ? `\uFEFF${body}` : body;
  }
}
