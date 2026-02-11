import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CameraDevice {
  id: string;
  name: string;
  location: string;
  zone: string;
  brand: string | null;
  model: string | null;
  ip_address: string | null;
  rtsp_url: string | null;
  hls_url: string | null;
  capabilities: string[];
  is_active: boolean;
  last_heartbeat: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CameraEvent {
  id: string;
  camera_id: string | null;
  event_type: string;
  severity: string;
  description: string;
  details: Record<string, unknown>;
  snapshot_url: string | null;
  video_clip_url: string | null;
  plate_number: string | null;
  matched_vehicle_id: string | null;
  matched_bl_id: string | null;
  zone: string | null;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  auto_action_taken: string | null;
  created_at: string;
  camera?: CameraDevice;
}

export function useCameraSurveillance() {
  const queryClient = useQueryClient();

  // Fetch cameras
  const { data: cameras = [], isLoading: camerasLoading } = useQuery({
    queryKey: ['camera-devices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('camera_devices')
        .select('*')
        .order('zone')
        .order('name');
      if (error) throw error;
      return data as CameraDevice[];
    },
  });

  // Fetch recent events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['camera-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('camera_events')
        .select('*, camera_devices(*)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []).map((e: Record<string, unknown>) => ({
        ...e,
        camera: e.camera_devices || null,
      })) as CameraEvent[];
    },
  });

  // Realtime subscription for new events
  useEffect(() => {
    const channel = supabase
      .channel('camera-events-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'camera_events' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['camera-events'] });
          const event = payload.new as CameraEvent;
          if (event.severity === 'critical') {
            toast.error(`🚨 ${event.description}`, { duration: 10000 });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Acknowledge event
  const acknowledgeEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('camera_events')
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camera-events'] });
      toast.success('Événement acquitté');
    },
  });

  // Add camera
  const addCamera = useMutation({
    mutationFn: async (camera: Partial<CameraDevice>) => {
      const { error } = await supabase.from('camera_devices').insert(camera as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camera-devices'] });
      toast.success('Caméra ajoutée');
    },
  });

  // Stats
  const stats = {
    totalCameras: cameras.length,
    activeCameras: cameras.filter(c => c.is_active).length,
    totalEvents: events.length,
    criticalEvents: events.filter(e => e.severity === 'critical' && !e.is_acknowledged).length,
    warningEvents: events.filter(e => e.severity === 'warning' && !e.is_acknowledged).length,
    anprEvents: events.filter(e => e.event_type === 'anpr').length,
    todayEvents: events.filter(e => {
      const today = new Date().toISOString().split('T')[0];
      return e.created_at.startsWith(today);
    }).length,
  };

  return {
    cameras,
    events,
    stats,
    loading: camerasLoading || eventsLoading,
    acknowledgeEvent: acknowledgeEvent.mutate,
    addCamera: addCamera.mutate,
  };
}
