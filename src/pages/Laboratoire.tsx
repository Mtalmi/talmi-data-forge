import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import WorldClassLaboratory from '@/components/laboratory/WorldClassLaboratory';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/hooks/useAuth';
import { useLabTests } from '@/hooks/useLabTests';

export default function Laboratoire() {
  const { isCeo, isResponsableTechnique, isCentraliste } = useAuth();
  const { t, lang } = useI18n();
  const { tests, loading, calendar, createTest, updateResistance, getPendingTests, refresh } = useLabTests();

  return (
    <MainLayout>
      <WorldClassLaboratory />
    </MainLayout>
  );
}
