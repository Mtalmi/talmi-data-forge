// CGV Content for PDF Generation
// Smart logic: < 500m³ = Short version (7 Golden Rules), ≥ 500m³ = Full CGV

export const CGV_SHORT = `
  <div class="cgv-page">
    <div class="cgv-header">CONDITIONS GÉNÉRALES DE VENTE</div>
    <div class="cgv-subtitle">Les 7 Règles d'Or</div>
    <ol class="cgv-rules">
      <li>
        <strong>Validité:</strong> Devis valable 30 jours.
      </li>
      <li>
        <strong>Accès:</strong> Le client garantit un accès sécurisé pour nos camions.
      </li>
      <li>
        <strong>Attente:</strong> 30 min gratuites, puis facturation des frais d'attente au-delà.
      </li>
      <li>
        <strong>Qualité:</strong> Responsabilité limitée à la livraison à la goulotte.
      </li>
      <li>
        <strong>Eau:</strong> Toute adjonction d'eau sur site annule la garantie de résistance.
      </li>
      <li>
        <strong>Paiement:</strong> Paiement selon les délais convenus; pénalités en cas de retard (Loi 32-10).
      </li>
      <li>
        <strong>Litiges:</strong> Compétence exclusive des tribunaux de Casablanca.
      </li>
    </ol>
  </div>
`;

export const CGV_FULL = `
  <div class="cgv-page">
    <div class="cgv-header">CONDITIONS GÉNÉRALES DE VENTE</div>
    
    <div class="cgv-article">
      <div class="cgv-article-title">Article 1 - Commande</div>
      <p>1.1. Toute commande implique l'acceptation sans réserve des présentes conditions générales de vente.</p>
      <p>1.2. Les commandes doivent être passées au minimum 24 heures avant la date de livraison souhaitée.</p>
      <p>1.3. Toute modification ou annulation de commande doit être notifiée au moins 24 heures avant la livraison prévue. En cas de non-respect, 50% du montant de la commande sera facturé.</p>
      <p>1.4. La quantité minimale par livraison est de 2 m³.</p>
    </div>
    
    <div class="cgv-article">
      <div class="cgv-article-title">Article 2 - Livraison</div>
      <p>2.1. La livraison est gratuite dans un rayon de 20 km. Au-delà, un supplément de 5 DH/m³/km sera appliqué.</p>
      <p>2.2. Le client garantit un accès libre et sécurisé au chantier pour nos véhicules de livraison.</p>
      <p>2.3. Les 30 premières minutes d'attente sur site sont gratuites. Au-delà, des frais d'immobilisation de 100 DH par tranche de 15 minutes seront appliqués.</p>
      <p>2.4. Le client doit s'assurer de la présence d'une personne habilitée pour réceptionner la livraison.</p>
      <p>2.5. TALMI BETON décline toute responsabilité en cas d'accident survenant sur le chantier du fait de conditions d'accès inadaptées.</p>
    </div>
    
    <div class="cgv-article">
      <div class="cgv-article-title">Article 3 - Qualité</div>
      <p>3.1. Le béton livré est conforme aux normes marocaines NM 10.1.008 en vigueur.</p>
      <p>3.2. La responsabilité de TALMI BETON est limitée à la livraison du béton à la goulotte du camion malaxeur.</p>
      <p>3.3. <strong>IMPORTANT:</strong> Toute adjonction d'eau sur site par le client ou ses préposés annule automatiquement la garantie de résistance du béton.</p>
      <p>3.4. Les échantillons de contrôle doivent être prélevés à la goulotte en présence du chauffeur.</p>
      <p>3.5. Toute réclamation relative à la qualité doit être formulée par écrit dans les 48 heures suivant la livraison.</p>
    </div>
    
    <div class="cgv-article">
      <div class="cgv-article-title">Article 4 - Paiement</div>
      <p>4.1. Les paiements doivent être effectués selon les délais convenus sur le bon de commande.</p>
      <p>4.2. Conformément à la loi 32-10 relative aux délais de paiement, tout retard de paiement entraînera:</p>
      <ul>
        <li>Des pénalités de retard au taux de 1,5% par mois de retard</li>
        <li>Une indemnité forfaitaire pour frais de recouvrement</li>
      </ul>
      <p>4.3. TALMI BETON se réserve le droit de suspendre toute livraison en cas de dépassement de l'encours autorisé.</p>
      <p>4.4. Les factures sont payables par virement bancaire ou chèque certifié.</p>
    </div>
    
    <div class="cgv-article">
      <div class="cgv-article-title">Article 5 - Juridiction</div>
      <p>5.1. Les présentes conditions sont soumises au droit marocain.</p>
      <p>5.2. En cas de litige relatif à l'interprétation ou l'exécution des présentes, et à défaut de règlement amiable, compétence exclusive est attribuée aux tribunaux de Casablanca.</p>
    </div>
  </div>
`;

export const CGV_STYLES = `
  .cgv-page {
    page-break-before: always;
    padding: 40px;
    font-size: 8pt;
    color: #666666;
    line-height: 1.5;
  }
  .cgv-header {
    font-size: 12pt;
    font-weight: bold;
    color: #333333;
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #cccccc;
  }
  .cgv-subtitle {
    font-size: 10pt;
    text-align: center;
    color: #666666;
    margin-bottom: 25px;
    font-style: italic;
  }
  .cgv-rules {
    padding-left: 25px;
    counter-reset: rule;
  }
  .cgv-rules li {
    margin-bottom: 15px;
    padding-left: 10px;
  }
  .cgv-rules li strong {
    color: #444444;
  }
  .cgv-article {
    margin-bottom: 20px;
  }
  .cgv-article-title {
    font-size: 9pt;
    font-weight: bold;
    color: #444444;
    margin-bottom: 8px;
    border-bottom: 1px solid #eeeeee;
    padding-bottom: 3px;
  }
  .cgv-article p {
    margin-bottom: 5px;
    text-align: justify;
  }
  .cgv-article ul {
    padding-left: 20px;
    margin: 5px 0;
  }
  .cgv-article ul li {
    margin-bottom: 3px;
  }
  @media print {
    .cgv-page {
      page-break-before: always;
    }
  }
`;

export function getCGVContent(volumeM3: number, forceFullVersion: boolean = false): string {
  if (forceFullVersion || volumeM3 >= 500) {
    return CGV_FULL;
  }
  return CGV_SHORT;
}
