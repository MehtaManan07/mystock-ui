/**
 * Utility functions for displaying packing information
 * All quantities in the system are stored as items
 */

/**
 * Parse packing string to numeric value
 * Returns 1 for non-numeric packing strings (like "Box", "Carton")
 */
export function parsePackingToNumber(packing: string): number {
  const parsed = parseInt(packing, 10);
  return isNaN(parsed) ? 1 : parsed;
}

/**
 * Format quantity with packing context for display: "230 items (23 packs of 10)"
 * Special case: If packing is 1, shows only "X items"
 * @param items - Number of items
 * @param packing - Packing string (e.g., "10", "Box")
 * @returns Formatted display string
 */
export function formatQuantityDisplay(
  items: number,
  packing: string
): string {
  const packingNum = parsePackingToNumber(packing);
  if (packingNum === 1) {
    return `${items} items`;
  }
  const packs = Math.floor(items / packingNum);
  const remainder = items % packingNum;
  
  if (remainder === 0) {
    return `${items} items (${packs} packs of ${packingNum})`;
  }
  return `${items} items (${packs} packs + ${remainder})`;
}

