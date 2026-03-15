import MainLayout from '@/components/layout/MainLayout';
import { LoansDashboard } from '@/components/loans';

export default function Prets() {
  return (
    <MainLayout>
      <div className="w-full p-4 md:p-6">
        <LoansDashboard />
      </div>
    </MainLayout>
  );
}
