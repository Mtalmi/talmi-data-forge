import { supabase } from '@/integrations/supabase/client';

export type CommunicationType = 'email' | 'whatsapp' | 'sms' | 'call' | 'other';
export type CommunicationCategory = 
  | 'devis_reminder' 
  | 'facture_reminder' 
  | 'devis_send' 
  | 'bc_confirmation' 
  | 'bl_notification' 
  | 'payment_confirmation' 
  | 'general';

export interface CommunicationLog {
  id: string;
  client_id: string;
  type: CommunicationType;
  category: CommunicationCategory;
  reference_id?: string;
  reference_table?: string;
  recipient?: string;
  subject?: string;
  message_preview?: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  sent_by?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

interface LogCommunicationParams {
  clientId: string;
  type: CommunicationType;
  category: CommunicationCategory;
  referenceId?: string;
  referenceTable?: string;
  recipient?: string;
  subject?: string;
  messagePreview?: string;
  status?: 'sent' | 'delivered' | 'failed' | 'pending';
  metadata?: Record<string, any>;
}

export async function logCommunication({
  clientId,
  type,
  category,
  referenceId,
  referenceTable,
  recipient,
  subject,
  messagePreview,
  status = 'sent',
  metadata = {},
}: LogCommunicationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('communication_logs')
      .insert({
        client_id: clientId,
        type,
        category,
        reference_id: referenceId,
        reference_table: referenceTable,
        recipient,
        subject,
        message_preview: messagePreview?.substring(0, 500), // Limit preview length
        status,
        sent_by: user?.id,
        metadata,
      });

    if (error) {
      console.error('Failed to log communication:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error logging communication:', error);
    return { success: false, error: error.message };
  }
}

export async function getCommunicationLogs(
  clientId: string,
  limit = 50
): Promise<CommunicationLog[]> {
  const { data, error } = await supabase
    .from('communication_logs')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch communication logs:', error);
    return [];
  }

  return data as CommunicationLog[];
}

export async function getRecentCommunications(
  limit = 100
): Promise<CommunicationLog[]> {
  const { data, error } = await supabase
    .from('communication_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch recent communications:', error);
    return [];
  }

  return data as CommunicationLog[];
}
