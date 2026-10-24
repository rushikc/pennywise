/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

export function isOutsideExpenseWindow(istHour: number): boolean {
  return istHour < 9 || istHour > 22;
}

export function canonicalizeVendor(vendor: string): string {
  let value = String(vendor).trim();
  const upiPattern = /^([^\s@]+@[^\s@]+)\s+(.+)$/;
  const upiMatch = value.match(upiPattern);
  if (upiMatch && upiMatch[1].trim().length !== 0 && upiMatch[2].trim().length !== 0) {
    value = `${upiMatch[2].trim()} ${upiMatch[1].trim()}`;
  }
  return value.toUpperCase().substring(0, 100);
}

export function resolveVendorTag(
  canonicalVendor: string,
  vendorTagList: Array<{vendor?: string; tag?: string}> | null | undefined,
): string | undefined {
  const tagList = Array.isArray(vendorTagList) ? vendorTagList : [];
  const tagObj = tagList.find((entry) => {
    if (!entry || entry.vendor == null) {
      return false;
    }
    return canonicalVendor === String(entry.vendor).trim().toUpperCase().substring(0, 100);
  });
  return tagObj ? tagObj.tag : undefined;
}
