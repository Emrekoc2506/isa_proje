export function collectDescendantIds(category, result = new Set()) {
  if (!category) return result;
  for (const child of category.children ?? []) {
    const childId = child.databaseId ?? child.id;
    if (childId) {
      result.add(String(childId));
    }
    collectDescendantIds(child, result);
  }
  return result;
}
