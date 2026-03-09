
-- Delete all existing bons_livraison_reels
DELETE FROM bons_livraison_reels;

-- Insert 8 realistic and diverse delivery records
INSERT INTO bons_livraison_reels (bl_id, client_id, formule_id, ciment_reel_kg, date_livraison, volume_m3, prix_vente_m3, prix_livraison_m3, statut_paiement) VALUES
  ('BL-2602-001', 'CLI-BTP01',   (SELECT formule_id FROM formules_theoriques LIMIT 1), 350, '2026-02-03', 12, 485, 45, 'Payé'),
  ('BL-2602-002', 'CLI-CM02',    (SELECT formule_id FROM formules_theoriques LIMIT 1), 350, '2026-02-07', 8,  530, 50, 'Payé'),
  ('BL-2602-003', 'CLI-CBS03',   (SELECT formule_id FROM formules_theoriques LIMIT 1), 350, '2026-02-12', 10, 440, 40, 'En Attente'),
  ('BL-2602-004', 'CLI-SRC04',   (SELECT formule_id FROM formules_theoriques LIMIT 1), 350, '2026-02-18', 15, 510, 55, 'En Attente'),
  ('BL-2602-005', 'CLI-TGCC05',  (SELECT formule_id FROM formules_theoriques LIMIT 1), 350, '2026-02-24', 20, 495, 50, 'Payé'),
  ('BL-2602-006', 'CLI-BTP01',   (SELECT formule_id FROM formules_theoriques LIMIT 1), 350, '2026-03-01', 6,  485, 45, 'En Attente'),
  ('BL-2602-007', 'CLI-CM02',    (SELECT formule_id FROM formules_theoriques LIMIT 1), 350, '2026-03-05', 14, 530, 50, 'En Attente'),
  ('BL-2602-008', 'CLI-TGCC05',  (SELECT formule_id FROM formules_theoriques LIMIT 1), 350, '2026-03-08', 10, 495, 50, 'Payé');
