# Production Module - Mobile Integration Guide

## Components Created

The following mobile-optimized components have been created and are ready for integration:

1. **ProductionBatchCardMobile.tsx** - Mobile card for individual batches
2. **ProductionBatchListResponsive.tsx** - Responsive wrapper that switches between table and cards
3. **ProductionFiltersMobile.tsx** - Mobile-friendly bottom sheet filters

## Integration Options

### Option A: Direct Integration (Recommended for New Implementations)

Replace the existing table in `Production.tsx` (around line 1176) with:

```tsx
import { ProductionBatchListResponsive } from '@/components/production/ProductionBatchListResponsive';

// In the render section:
<ProductionBatchListResponsive
  batches={filteredAndSortedBons.map(bon => ({
    bl_id: bon.bl_id,
    date_livraison: bon.date_livraison,
    client_nom: bon.client?.nom_client,
    formule_nom: formules.find(f => f.formule_id === bon.formule_id)?.designation,
    volume_m3: bon.volume_m3,
    workflow_status: bon.workflow_status,
    alerte_ecart: bon.alerte_ecart,
    validation_technique: bon.validation_technique,
    bc_id: bon.bc_id,
  }))}
  onViewDetails={(batch) => {
    const bon = filteredAndSortedBons.find(b => b.bl_id === batch.bl_id);
    if (bon && canEdit) handleSelectBon(bon);
  }}
  onNavigateToBc={(bcId) => navigate(`/ventes?bc=${bcId}`)}
/>
```

### Option B: Gradual Integration (Recommended for Existing Production Systems)

1. Keep the existing desktop table as-is
2. Add mobile detection logic
3. Conditionally render mobile components on small screens

### Option C: Use Lovable AI

Since the Production.tsx file is complex (1,666 lines), you can use Lovable AI to integrate the components:

**Prompt for Lovable AI:**

```
Integrate the mobile-optimized Production components:

1. Import ProductionBatchListResponsive from @/components/production/ProductionBatchListResponsive
2. Replace the existing Table (around line 1176) with ProductionBatchListResponsive on mobile screens (< 768px)
3. Keep the desktop table for larger screens
4. Pass the filtered and sorted bons data to the responsive component
5. Maintain all existing functionality (selection, sorting, filtering, navigation)

The new component should receive:
- batches: array of batch objects with bl_id, date_livraison, client_nom, formule_nom, volume_m3, workflow_status, alerte_ecart, validation_technique, bc_id
- onViewDetails: callback to open batch details
- onNavigateToBc: callback to navigate to BC
```

## Status

✅ Components created and pushed to GitHub  
⏳ Integration pending (awaiting decision on approach)

## Recommendation

Use **Option C (Lovable AI)** for the safest, fastest integration without risking existing functionality.
