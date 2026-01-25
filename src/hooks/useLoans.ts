import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addMonths, differenceInDays, format } from 'date-fns';

export type LoanType = 'to_company' | 'from_company';
export type LoanStatus = 'active' | 'paid_off' | 'defaulted' | 'cancelled';
export type LoanPaymentStatus = 'pending' | 'paid' | 'late' | 'partial' | 'skipped';

export interface Associate {
  id: string;
  name: string;
  relationship: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  loan_number: string;
  associate_id: string;
  loan_type: LoanType;
  principal_amount: number;
  interest_rate: number;
  term_months: number;
  monthly_payment: number;
  total_interest: number;
  total_amount: number;
  start_date: string;
  end_date: string;
  status: LoanStatus;
  contract_url: string | null;
  board_decision_url: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  associate_name?: string;
  associate_relationship?: string;
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  payment_number: number;
  due_date: string;
  principal_portion: number;
  interest_portion: number;
  scheduled_amount: number;
  actual_amount: number;
  balance_after: number;
  status: LoanPaymentStatus;
  paid_date: string | null;
  paid_by: string | null;
  paid_by_name: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  receipt_url: string | null;
  notes: string | null;
  days_late: number;
  late_fee: number;
  created_at: string;
  updated_at: string;
}

export interface LoanSummary {
  totalLoans: number;
  activeLoans: number;
  totalPrincipal: number;
  totalOutstanding: number;
  totalPaidThisMonth: number;
  overduePayments: number;
  upcomingPayments: number;
  loansToCompany: number;
  loansFromCompany: number;
  toCompanyBalance: number;
  fromCompanyBalance: number;
}

export interface AssociateTransaction {
  id: string;
  transaction_number: string;
  associate_id: string;
  transaction_type: string;
  amount: number;
  direction: 'debit' | 'credit';
  description: string;
  justification: string | null;
  loan_id: string | null;
  loan_payment_id: string | null;
  document_url: string | null;
  bank_reference: string | null;
  requires_approval: boolean;
  approval_level: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  approval_notes: string | null;
  executed_by: string | null;
  executed_by_name: string | null;
  executed_at: string | null;
  status: string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  associate_name?: string;
}

export function useLoans() {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [transactions, setTransactions] = useState<AssociateTransaction[]>([]);
  const [summary, setSummary] = useState<LoanSummary>({
    totalLoans: 0,
    activeLoans: 0,
    totalPrincipal: 0,
    totalOutstanding: 0,
    totalPaidThisMonth: 0,
    overduePayments: 0,
    upcomingPayments: 0,
    loansToCompany: 0,
    loansFromCompany: 0,
    toCompanyBalance: 0,
    fromCompanyBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch associates
      const { data: associatesData, error: associatesError } = await supabase
        .from('associates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (associatesError) throw associatesError;
      setAssociates(associatesData || []);

      // Fetch loans with associate info
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select(`
          *,
          associates (
            name,
            relationship
          )
        `)
        .order('created_at', { ascending: false });

      if (loansError) throw loansError;
      
      const formattedLoans = (loansData || []).map((loan: any) => ({
        ...loan,
        associate_name: loan.associates?.name,
        associate_relationship: loan.associates?.relationship,
      }));
      setLoans(formattedLoans);

      // Fetch all payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('loan_payments')
        .select('*')
        .order('due_date', { ascending: true });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('associate_transactions')
        .select(`
          *,
          associates (name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (transactionsError) throw transactionsError;
      
      const formattedTransactions = (transactionsData || []).map((t: any) => ({
        ...t,
        associate_name: t.associates?.name,
      }));
      setTransactions(formattedTransactions);

      // Calculate summary
      const activeLoans = formattedLoans.filter((l: Loan) => l.status === 'active');
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const overduePayments = (paymentsData || []).filter(
        (p: LoanPayment) => p.status === 'pending' && new Date(p.due_date) < today
      );

      const upcomingPayments = (paymentsData || []).filter(
        (p: LoanPayment) => {
          const dueDate = new Date(p.due_date);
          return p.status === 'pending' && dueDate >= today && dueDate <= endOfMonth;
        }
      );

      const paidThisMonth = (paymentsData || []).filter(
        (p: LoanPayment) => {
          if (p.status !== 'paid' || !p.paid_date) return false;
          const paidDate = new Date(p.paid_date);
          return paidDate >= startOfMonth && paidDate <= endOfMonth;
        }
      ).reduce((sum: number, p: LoanPayment) => sum + Number(p.actual_amount), 0);

      const loansToCompany = activeLoans.filter((l: Loan) => l.loan_type === 'to_company');
      const loansFromCompany = activeLoans.filter((l: Loan) => l.loan_type === 'from_company');

      const toCompanyBalance = loansToCompany.reduce((sum: number, l: Loan) => {
        const loanPayments = (paymentsData || []).filter((p: LoanPayment) => p.loan_id === l.id);
        const paid = loanPayments.reduce((s: number, p: LoanPayment) => 
          s + (p.status === 'paid' || p.status === 'partial' ? Number(p.actual_amount) : 0), 0);
        return sum + (Number(l.principal_amount) - paid);
      }, 0);

      const fromCompanyBalance = loansFromCompany.reduce((sum: number, l: Loan) => {
        const loanPayments = (paymentsData || []).filter((p: LoanPayment) => p.loan_id === l.id);
        const paid = loanPayments.reduce((s: number, p: LoanPayment) => 
          s + (p.status === 'paid' || p.status === 'partial' ? Number(p.actual_amount) : 0), 0);
        return sum + (Number(l.principal_amount) - paid);
      }, 0);

      setSummary({
        totalLoans: formattedLoans.length,
        activeLoans: activeLoans.length,
        totalPrincipal: activeLoans.reduce((sum: number, l: Loan) => sum + Number(l.principal_amount), 0),
        totalOutstanding: toCompanyBalance + fromCompanyBalance,
        totalPaidThisMonth: paidThisMonth,
        overduePayments: overduePayments.length,
        upcomingPayments: upcomingPayments.length,
        loansToCompany: loansToCompany.length,
        loansFromCompany: loansFromCompany.length,
        toCompanyBalance,
        fromCompanyBalance,
      });

    } catch (err) {
      console.error('Error fetching loan data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate monthly payment using amortization formula
  const calculateMonthlyPayment = useCallback((principal: number, annualRate: number, termMonths: number) => {
    if (annualRate === 0) {
      return Math.round((principal / termMonths) * 100) / 100;
    }
    
    const monthlyRate = annualRate / 12;
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                    (Math.pow(1 + monthlyRate, termMonths) - 1);
    
    return Math.round(payment * 100) / 100;
  }, []);

  // Generate payment schedule for a loan
  const generatePaymentSchedule = useCallback((
    principal: number,
    annualRate: number,
    termMonths: number,
    startDate: Date
  ) => {
    const schedule: Omit<LoanPayment, 'id' | 'loan_id' | 'created_at' | 'updated_at'>[] = [];
    const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
    const monthlyRate = annualRate / 12;
    
    let balance = principal;
    
    for (let i = 1; i <= termMonths; i++) {
      const interestPortion = annualRate > 0 ? Math.round(balance * monthlyRate * 100) / 100 : 0;
      const principalPortion = Math.round((monthlyPayment - interestPortion) * 100) / 100;
      balance = Math.max(0, Math.round((balance - principalPortion) * 100) / 100);
      
      // Adjust last payment to clear remaining balance
      const adjustedPrincipal = i === termMonths ? principalPortion + balance : principalPortion;
      const adjustedPayment = adjustedPrincipal + interestPortion;
      
      schedule.push({
        payment_number: i,
        due_date: format(addMonths(startDate, i), 'yyyy-MM-dd'),
        principal_portion: adjustedPrincipal,
        interest_portion: interestPortion,
        scheduled_amount: i === termMonths ? adjustedPayment : monthlyPayment,
        actual_amount: 0,
        balance_after: i === termMonths ? 0 : balance,
        status: 'pending',
        paid_date: null,
        paid_by: null,
        paid_by_name: null,
        payment_method: null,
        payment_reference: null,
        receipt_url: null,
        notes: null,
        days_late: 0,
        late_fee: 0,
      });
    }
    
    return schedule;
  }, [calculateMonthlyPayment]);

  // Create a new associate
  const createAssociate = useCallback(async (data: Omit<Associate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: newAssociate, error } = await supabase
        .from('associates')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      toast.success('Associé créé avec succès');
      await fetchData();
      return newAssociate;
    } catch (err) {
      console.error('Error creating associate:', err);
      toast.error('Erreur lors de la création de l\'associé');
      return null;
    }
  }, [fetchData]);

  // Create a new loan with payment schedule
  const createLoan = useCallback(async (
    data: {
      associate_id: string;
      loan_type: LoanType;
      principal_amount: number;
      interest_rate: number;
      term_months: number;
      start_date: string;
      contract_url?: string;
      board_decision_url?: string;
      notes?: string;
    },
    userName: string
  ) => {
    try {
      // Generate loan number
      const { data: loanNumberResult } = await supabase
        .rpc('generate_loan_number');
      
      const loanNumber = loanNumberResult || `LOAN-${new Date().getFullYear()}-0001`;
      
      const monthlyPayment = calculateMonthlyPayment(
        data.principal_amount, 
        data.interest_rate, 
        data.term_months
      );
      
      const totalInterest = (monthlyPayment * data.term_months) - data.principal_amount;
      const totalAmount = data.principal_amount + Math.max(0, totalInterest);
      const endDate = format(addMonths(new Date(data.start_date), data.term_months), 'yyyy-MM-dd');

      // Create the loan
      const { data: newLoan, error: loanError } = await supabase
        .from('loans')
        .insert([{
          loan_number: loanNumber,
          associate_id: data.associate_id,
          loan_type: data.loan_type,
          principal_amount: data.principal_amount,
          interest_rate: data.interest_rate,
          term_months: data.term_months,
          monthly_payment: monthlyPayment,
          total_interest: Math.max(0, totalInterest),
          total_amount: totalAmount,
          start_date: data.start_date,
          end_date: endDate,
          contract_url: data.contract_url,
          board_decision_url: data.board_decision_url,
          notes: data.notes,
          created_by_name: userName,
          status: 'active',
        }])
        .select()
        .single();

      if (loanError) throw loanError;

      // Generate and insert payment schedule
      const schedule = generatePaymentSchedule(
        data.principal_amount,
        data.interest_rate,
        data.term_months,
        new Date(data.start_date)
      );

      const paymentsToInsert = schedule.map(p => ({
        ...p,
        loan_id: newLoan.id,
      }));

      const { error: paymentsError } = await supabase
        .from('loan_payments')
        .insert(paymentsToInsert);

      if (paymentsError) throw paymentsError;

      toast.success(`Prêt ${loanNumber} créé avec ${data.term_months} échéances`);
      await fetchData();
      return newLoan;
    } catch (err) {
      console.error('Error creating loan:', err);
      toast.error('Erreur lors de la création du prêt');
      return null;
    }
  }, [calculateMonthlyPayment, generatePaymentSchedule, fetchData]);

  // Record a loan payment
  const recordPayment = useCallback(async (
    paymentId: string,
    data: {
      actual_amount: number;
      paid_date: string;
      payment_method: string;
      payment_reference?: string;
      receipt_url?: string;
      notes?: string;
    },
    userName: string
  ) => {
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) throw new Error('Payment not found');

      const daysLate = Math.max(0, differenceInDays(new Date(data.paid_date), new Date(payment.due_date)));
      const lateFee = daysLate > 0 ? Math.round(payment.scheduled_amount * 0.02 * (daysLate / 30) * 100) / 100 : 0;

      const status: LoanPaymentStatus = 
        data.actual_amount >= payment.scheduled_amount ? 'paid' : 
        data.actual_amount > 0 ? 'partial' : 'pending';

      const { error } = await supabase
        .from('loan_payments')
        .update({
          actual_amount: data.actual_amount,
          paid_date: data.paid_date,
          payment_method: data.payment_method,
          payment_reference: data.payment_reference,
          receipt_url: data.receipt_url,
          notes: data.notes,
          paid_by_name: userName,
          days_late: daysLate,
          late_fee: lateFee,
          status,
        })
        .eq('id', paymentId);

      if (error) throw error;

      // Check if loan is fully paid
      const loan = loans.find(l => l.id === payment.loan_id);
      if (loan) {
        const loanPayments = payments.filter(p => p.loan_id === loan.id);
        const allPaid = loanPayments.every(p => 
          p.id === paymentId ? status === 'paid' : p.status === 'paid'
        );

        if (allPaid) {
          await supabase
            .from('loans')
            .update({ status: 'paid_off' })
            .eq('id', loan.id);
        }
      }

      toast.success('Paiement enregistré avec succès');
      await fetchData();
      return true;
    } catch (err) {
      console.error('Error recording payment:', err);
      toast.error('Erreur lors de l\'enregistrement du paiement');
      return false;
    }
  }, [payments, loans, fetchData]);

  // Get payments for a specific loan
  const getLoanPayments = useCallback((loanId: string) => {
    return payments.filter(p => p.loan_id === loanId).sort((a, b) => a.payment_number - b.payment_number);
  }, [payments]);

  // Get overdue payments
  const getOverduePayments = useCallback(() => {
    const today = new Date();
    return payments.filter(
      p => p.status === 'pending' && new Date(p.due_date) < today
    );
  }, [payments]);

  // Get upcoming payments (next 30 days)
  const getUpcomingPayments = useCallback((days: number = 30) => {
    const today = new Date();
    const futureDate = addMonths(today, 1);
    
    return payments.filter(p => {
      const dueDate = new Date(p.due_date);
      return p.status === 'pending' && dueDate >= today && dueDate <= futureDate;
    });
  }, [payments]);

  // Get associate balance
  const getAssociateBalance = useCallback((associateId: string) => {
    const associateLoans = loans.filter(l => l.associate_id === associateId && l.status === 'active');
    
    let toCompany = 0; // Company owes associate
    let fromCompany = 0; // Associate owes company
    
    associateLoans.forEach(loan => {
      const loanPayments = payments.filter(p => p.loan_id === loan.id);
      const paid = loanPayments.reduce((sum, p) => 
        sum + (p.status === 'paid' || p.status === 'partial' ? Number(p.actual_amount) : 0), 0);
      const outstanding = Number(loan.principal_amount) - paid;
      
      if (loan.loan_type === 'to_company') {
        toCompany += outstanding;
      } else {
        fromCompany += outstanding;
      }
    });
    
    return { toCompany, fromCompany, net: toCompany - fromCompany };
  }, [loans, payments]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    associates,
    loans,
    payments,
    transactions,
    summary,
    loading,
    error,
    refetch: fetchData,
    createAssociate,
    createLoan,
    recordPayment,
    getLoanPayments,
    getOverduePayments,
    getUpcomingPayments,
    getAssociateBalance,
    calculateMonthlyPayment,
    generatePaymentSchedule,
  };
}
