const ar = {
  nav: {
    dashboard: 'لوحة التحكم',
    production: 'الإنتاج',
    planning: 'التخطيط',
    deliveries: 'التسليمات',
    sales: 'المبيعات',
    stocks: 'المخزون',
    clients: 'العملاء',
    reports: 'التقارير',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    billing: 'الفواتير',
    resources: 'الموارد',
    ceoControl: 'تحكم المدير',
    support: 'الدعم',
    archiveBL: 'أرشيف وصل التسليم',
    payments: 'المدفوعات',
    expenses: 'المصاريف',
    contracts: 'العقود',
    reconciliation: 'التسوية البنكية',
    formulas: 'الخلطات',
    laboratory: 'المختبر',
    logistics: 'اللوجستيك',
    suppliers: 'الموردون',
    contractors: 'المقاولون',
    maintenance: 'الصيانة',
    attendance: 'الحضور',
    reportsFull: 'التقارير الكاملة',
    purchasePrices: 'أسعار الشراء',
    security: 'الأمان',
    aiSurveillance: 'المراقبة بالذكاء الاصطناعي',
    users: 'المستخدمون',
    systemManual: 'دليل النظام',
    trainingMode: 'وضع التدريب',
    main: 'الرئيسي',
    management: 'الإدارة',
  },
  auth: {
    welcome: 'مرحباً بك في TBOS',
    subtitle: 'سجّل الدخول للوصول إلى منصتك',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    signIn: 'تسجيل الدخول',
    signingIn: 'جارٍ تسجيل الدخول...',
    demoAccess: 'وصول تجريبي',
    selectRole: 'اختر الدور',
    loginAsRole: 'تسجيل الدخول كـ',
    roles: {
      ceo: 'المدير التنفيذي',
      superviseur: 'المشرف',
      centraliste: 'مشغّل المحطة',
      chauffeur: 'السائق',
      commercial: 'المندوب التجاري',
      accounting: 'المحاسب',
      operator: 'المشغّل',
      agent_administratif: 'الموظف الإداري',
      responsable_technique: 'المسؤول التقني',
      directeur_operations: 'مدير العمليات',
    },
  },
  dashboard: {
    title: 'لوحة التحكم',
    greeting: 'مرحباً',
    todayProduction: 'إنتاج اليوم',
    revenue: 'الإيرادات',
    activeClients: 'العملاء النشطون',
    pendingDeliveries: 'التسليمات المعلقة',
    refresh: 'تحديث',
    refreshing: 'جارٍ التحديث...',
    lastUpdated: 'آخر تحديث',
    alerts: 'التنبيهات',
    noAlerts: 'لا توجد تنبيهات',
    myAccount: 'حسابي',
    profile: 'الملف الشخصي',
    period: {
      today: 'اليوم',
      todayShort: 'اليوم',
      thisWeek: 'هذا الأسبوع',
      thisWeekShort: 'أسبوع',
      thisMonth: 'هذا الشهر',
      thisMonthShort: 'شهر',
      day: 'يوم',
      week: 'أسبوع',
      month: 'شهر',
      quarter: 'ربع سنة',
      year: 'سنة',
    },
    sections: {
      performanceKpis: 'الأداء والمؤشرات',
      productionQuality: 'الإنتاج والجودة',
      financeTreasury: 'المالية والخزينة',
      fleetLogistics: 'الأسطول واللوجستيك',
      securityAudit: 'الأمان والتدقيق',
      commandCenter: 'مركز القيادة',
    },
    kpi: {
      totalVolume: 'الحجم الإجمالي',
      turnover: 'رقم المعاملات',
      avgCur: 'متوسط CUR',
      grossMargin: 'الهامش الإجمالي',
      unitCost: 'التكلفة الحقيقية للوحدة',
      netProfit: 'صافي الربح',
      revenueMinusCosts: 'الإيرادات - التكاليف - المصاريف',
      totalExpenses: 'إجمالي المصاريف',
      marginAlerts: 'تنبيهات الهامش',
      varianceOver5: 'انحرافات > 5%',
      invoices: 'فواتير',
    },
    productionSummary: 'ملخص الإنتاج',
    activeFormulas: 'الخلطات النشطة',
    pricesUpdated: 'تحديث الأسعار',
    avgEcRatio: 'متوسط نسبة م/س',
    avgCur7d: 'متوسط CUR (7 أيام)',
    addProduct: '+ إضافة منتج',
    securityAlerts: '🛡️ تنبيهات الأمان',
    auditTrail: '🔍 سجل التدقيق',
    loading: 'جارٍ التحميل...',
  },
  production: {
    title: 'الإنتاج',
    newBatch: 'دفعة جديدة',
    batchId: 'رقم الدفعة',
    formula: 'الخلطة',
    volume: 'الحجم (م³)',
    client: 'العميل',
    site: 'الموقع',
    operator: 'المشغّل',
    status: {
      pending: 'في الانتظار',
      loading: 'قيد التحميل',
      dispatched: 'تم الإرسال',
      delivered: 'تم التسليم',
      completed: 'مكتمل',
    },
    totalToday: 'إجمالي اليوم',
    cubicMeters: 'م³',
  },
  common: {
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    search: 'بحث',
    filter: 'تصفية',
    loading: 'جارٍ التحميل...',
    noData: 'لا توجد بيانات',
    confirm: 'تأكيد',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    close: 'إغلاق',
    view: 'عرض',
    download: 'تحميل',
    print: 'طباعة',
    yes: 'نعم',
    no: 'لا',
    total: 'الإجمالي',
    date: 'التاريخ',
    time: 'الوقت',
    success: 'تم بنجاح',
    error: 'خطأ',
    warning: 'تحذير',
    language: 'اللغة',
    select: 'اختر',
    all: 'الكل',
    subtotal: 'المجموع الفرعي',
    tax: 'الضريبة',
    from: 'من',
    to: 'إلى',
    by: 'بواسطة',
    required: 'مطلوب',
    optional: 'اختياري',
    info: 'معلومة',
    none: 'لا شيء',
  },
  languages: {
    ar: 'العربية',
    fr: 'Français',
    en: 'English',
  },
};

export default ar;
