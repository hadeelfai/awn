import { supabase } from './supabase';
import type {
  Appointment,
  ChatMessage,
  ExplainedDocument,
} from '../types';

let sessionPromise: Promise<string> | undefined;

export async function ensureSupabaseUser(): Promise<string> {
  const { data: current, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (current.session?.user.id) return current.session.user.id;

  if (!sessionPromise) {
    sessionPromise = supabase.auth
      .signInAnonymously()
      .then(({ data, error }) => {
        if (error) throw error;
        if (!data.user?.id) {
          throw new Error('Supabase did not return a user.');
        }
        return data.user.id;
      })
      .finally(() => {
        sessionPromise = undefined;
      });
  }

  return sessionPromise;
}

export async function getSupabaseAccessToken(): Promise<string> {
  await ensureSupabaseUser();

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.access_token) {
    throw new Error('Supabase session is not available.');
  }

  return data.session.access_token;
}

async function saveRecord(
  table: 'awn_appointments' | 'awn_reports' | 'awn_chat_messages',
  clientId: string,
  payload: unknown,
  createdAt: string,
  role?: ChatMessage['role']
) {
  await ensureSupabaseUser();

  const row = {
    client_id: clientId,
    payload,
    created_at: createdAt,
    ...(role ? { role } : {}),
  };

  const { error } = await supabase
    .from(table)
    .upsert(row, { onConflict: 'user_id,client_id' });

  if (error) throw error;
}

export const saveAppointment = (appointment: Appointment) =>
  saveRecord(
    'awn_appointments',
    appointment.id,
    appointment,
    new Date().toISOString()
  );

export async function deleteAppointmentRecord(appointmentId: string) {
  await ensureSupabaseUser();
  const { error } = await supabase
    .from('awn_appointments')
    .delete()
    .eq('client_id', appointmentId);
  if (error) throw error;
}

export const saveReport = (report: ExplainedDocument) =>
  saveRecord(
    'awn_reports',
    report.id,
    report,
    report.createdAt
  );

export async function deleteReport(reportId: string) {
  await ensureSupabaseUser();
  const { error } = await supabase
    .from('awn_reports')
    .delete()
    .eq('client_id', reportId);
  if (error) throw error;
}

export const saveChatMessage = (message: ChatMessage) =>
  saveRecord(
    'awn_chat_messages',
    message.id,
    message,
    message.createdAt,
    message.role
  );

export async function loadSyncedAppointments(): Promise<Appointment[]> {
  await ensureSupabaseUser();
  const { data, error } = await supabase
    .from('awn_appointments')
    .select('client_id, payload')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data ?? []).map((row) => row.payload as Appointment);
}

export async function deleteChatMessages(messageIds: string[]) {
  if (!messageIds.length) return;
  await ensureSupabaseUser();
  const { error } = await supabase
    .from('awn_chat_messages')
    .delete()
    .in('client_id', messageIds);
  if (error) throw error;
}

export async function loadSyncedData() {
  await ensureSupabaseUser();

  const [appointments, reports, messages] = await Promise.all([
    supabase
      .from('awn_appointments')
      .select('client_id, payload')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('awn_reports')
      .select('client_id, payload')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('awn_chat_messages')
      .select('client_id, payload')
      // Fetch the newest page first so older rows cannot crowd recent chats out.
      .order('created_at', { ascending: false })
      .limit(500),
  ]);

  const error =
    appointments.error ?? reports.error ?? messages.error;
  if (error) throw error;

  return {
    appointments: (appointments.data ?? []).map(
      (row) => row.payload as Appointment
    ),
    reports: (reports.data ?? []).map(
      (row) => row.payload as ExplainedDocument
    ),
    messages: (messages.data ?? [])
      .reverse()
      .map((row) => row.payload as ChatMessage),
  };
}
