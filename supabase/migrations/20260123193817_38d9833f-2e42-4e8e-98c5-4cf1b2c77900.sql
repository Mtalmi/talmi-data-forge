-- Drop the existing update policy
DROP POLICY IF EXISTS "devis_update_authorized" ON devis;

-- Create the new stricter policy: Only Admin, CEO, or Superviseur can UPDATE devis
CREATE POLICY "Only_Admin_CEO_Can_Approve" ON devis
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles_v2 
    WHERE user_roles_v2.user_id = auth.uid() 
    AND user_roles_v2.role IN ('agent_administratif', 'ceo', 'superviseur')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles_v2 
    WHERE user_roles_v2.user_id = auth.uid() 
    AND user_roles_v2.role IN ('agent_administratif', 'ceo', 'superviseur')
  )
);