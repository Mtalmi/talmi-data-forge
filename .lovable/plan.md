

## Analysis

After thorough code inspection:

1. **Data binding is correct** -- `bl_id`, `date_livraison`, `client_id`, `formule_id`, `volume_m3` are all properly mapped at lines 1234-1246 of `src/pages/Bons.tsx`.

2. **Text color issue** -- The `TableCell` component and `.data-table-industrial td` CSS class do NOT set an explicit text `color`. They rely on CSS inheritance from `body { color: hsl(var(--foreground)) }`. This should work, but could be overridden by browser-specific behavior or cascading specificity issues with the many global CSS rules in `index.css` (5200+ lines with multiple `!important` overrides).

## Plan

**File: `src/pages/Bons.tsx`** -- Add explicit `style={{ color: '#FFFFFF' }}` to the 5 data TableCells (bl_id, date_livraison, client_id, formule_id, volume_m3) to force white text regardless of CSS inheritance issues.

### Specific changes (lines 1234-1246):

- **Line 1234**: `<TableCell className="font-mono font-medium" style={{ color: '#FFFFFF' }}>` (N° BON)
- **Line 1241**: `<TableCell style={{ color: '#FFFFFF' }}>` (DATE)
- **Line 1244**: `<TableCell style={{ color: '#FFFFFF' }}>` (CLIENT)
- **Line 1245**: `<TableCell className="font-mono text-sm" style={{ color: '#FFFFFF' }}>` (FORMULE)
- **Line 1246**: `<TableCell className="text-right" style={{ color: '#FFFFFF' }}>` (VOLUME)

No changes to data binding (already correct). No other files touched.

