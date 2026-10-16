
import { supabase } from './supabaseClient';

export async function checkMedicationConnection() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.log('Medication auth error:', error.message);
    return false;
  }

  if (!user) {
    console.log('Medication auth: No signed-in user');
    return false;
  }

  const { error: databaseError } = await supabase
    .from('awn_medications')
    .select('id')
    .limit(1);

  if (databaseError) {
    console.log('Medication database error:', databaseError.message);
    return false;
  }

  console.log('Medication database connected successfully');
  return true;
}


export type MedicationRecord = {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  instructions: string | null;
  frequency: 'daily' | 'weekly' | 'as_needed';
  scheduled_times: string[];
  days_of_week: number[];
  start_date: string;
  end_date: string | null;
  status: 'active' | 'archived';
  reminder_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export async function getMedications(): Promise<MedicationRecord[]> {
  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be signed in to view medications.');
  }

  const { data, error } = await supabase
    .from('awn_medications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MedicationRecord[];
}


export type NewMedication = {
  reminder_enabled?: boolean;
  name: string;
  dosage: string;
  instructions?: string;
  frequency: 'daily' | 'weekly' | 'as_needed';
  scheduled_times: string[];
  days_of_week: number[];
  start_date: string;
  end_date: string | null;
};

export async function addMedication(
  medication: NewMedication
): Promise<MedicationRecord> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be signed in to add medications.');
  }

  if (!medication.name.trim() || !medication.dosage.trim()) {
    throw new Error('Medication name and dosage are required.');
  }

  if (
    medication.end_date &&
    medication.end_date < medication.start_date
  ) {
    throw new Error('End date cannot be before start date.');
  }

  const { data, error } = await supabase
    .from('awn_medications')
    .insert({
      user_id: user.id,
      name: medication.name.trim(),
      dosage: medication.dosage.trim(),
      instructions: medication.instructions?.trim() || null,
      frequency: medication.frequency,
      scheduled_times: medication.scheduled_times,
      days_of_week: medication.days_of_week,
      start_date: medication.start_date,
      end_date: medication.end_date,
      status: 'active',
      reminder_enabled: medication.reminder_enabled ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as MedicationRecord;
}


export async function updateMedication(
  id: string,
  changes: Partial<NewMedication>
): Promise<MedicationRecord> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error('You must be signed in.');

  const { data, error } = await supabase
    .from('awn_medications')
    .update(changes)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;

  return data as MedicationRecord;
}

export async function archiveMedication(
  id: string
): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error('You must be signed in.');

  const { data, error } = await supabase
    .from('awn_medications')
    .update({ status: 'archived' })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id');

  if (error) throw error;

  if (!data || data.length === 0) {
    throw new Error('Medication not found or not accessible.');
  }
}


export type DoseStatus = 'taken' | 'skipped';

export type MedicationDoseRecord = {
  id: string;
  user_id: string;
  medication_id: string;
  scheduled_at: string;
  status: DoseStatus;
  recorded_at: string;
};

export type ScheduledDose = {
  medicationId: string;
  medicationName: string;
  dosage: string;
  instructions: string | null;
  scheduledAt: string;
  time: string;
  status: DoseStatus | 'pending';
  recordedAt: string | null;
};

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isMedicationScheduledOnDate(
  medication: MedicationRecord,
  date: string
): boolean {
  if (medication.status !== 'active') return false;
  if (date < medication.start_date) return false;

  if (medication.end_date && date > medication.end_date) {
    return false;
  }

  if (medication.frequency === 'as_needed') {
    return false;
  }

  if (medication.frequency === 'daily') {
    return true;
  }

  if (medication.frequency === 'weekly') {
    const dayOfWeek = parseDateOnly(date).getDay();
    return medication.days_of_week.includes(dayOfWeek);
  }

  return false;
}

export function buildScheduledDoses(
  medications: MedicationRecord[],
  date: string = localDateString(new Date()),
  recordedDoses: MedicationDoseRecord[] = []
): ScheduledDose[] {
  const doseLookup = new Map<string, MedicationDoseRecord>();

  for (const dose of recordedDoses) {
    const key = `${dose.medication_id}|${dose.scheduled_at}`;
    doseLookup.set(key, dose);
  }

  const result: ScheduledDose[] = [];

  for (const medication of medications) {
    if (!isMedicationScheduledOnDate(medication, date)) {
      continue;
    }

    for (const scheduledTime of medication.scheduled_times) {
      const [hours, minutes] = scheduledTime
        .split(':')
        .map(Number);

      if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
      ) {
        continue;
      }

      const scheduledDate = parseDateOnly(date);
      scheduledDate.setHours(hours, minutes, 0, 0);

      const scheduledAt = scheduledDate.toISOString();
      const key = `${medication.id}|${scheduledAt}`;
      const recorded = doseLookup.get(key);

      result.push({
        medicationId: medication.id,
        medicationName: medication.name,
        dosage: medication.dosage,
        instructions: medication.instructions,
        scheduledAt,
        time: scheduledTime,
        status: recorded?.status ?? 'pending',
        recordedAt: recorded?.recorded_at ?? null,
      });
    }
  }

  return result.sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() -
      new Date(b.scheduledAt).getTime()
  );
}

async function getAuthenticatedUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;

  if (!user) {
    throw new Error('You must be signed in.');
  }

  return user.id;
}

export async function getDoseRecordsForDate(
  date: string = localDateString(new Date())
): Promise<MedicationDoseRecord[]> {
  const userId = await getAuthenticatedUserId();

  const start = parseDateOnly(date);
  const end = parseDateOnly(date);
  end.setDate(end.getDate() + 1);

  const { data, error } = await supabase
    .from('awn_medication_doses')
    .select('*')
    .eq('user_id', userId)
    .gte('scheduled_at', start.toISOString())
    .lt('scheduled_at', end.toISOString())
    .order('scheduled_at', { ascending: true });

  if (error) throw error;

  return (data ?? []) as MedicationDoseRecord[];
}

export async function recordMedicationDose(
  medicationId: string,
  scheduledAt: string,
  status: DoseStatus
): Promise<MedicationDoseRecord> {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('awn_medication_doses')
    .upsert(
      {
        user_id: userId,
        medication_id: medicationId,
        scheduled_at: scheduledAt,
        status,
        recorded_at: new Date().toISOString(),
      },
      {
        onConflict: 'medication_id,scheduled_at',
      }
    )
    .select()
    .single();

  if (error) throw error;

  return data as MedicationDoseRecord;
}

export async function undoMedicationDose(
  medicationId: string,
  scheduledAt: string
): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from('awn_medication_doses')
    .delete()
    .eq('user_id', userId)
    .eq('medication_id', medicationId)
    .eq('scheduled_at', scheduledAt);

  if (error) throw error;
}

// Add these functions at the bottom of src/services/medications.ts.
// This file assumes `supabase` is already imported in that service.

export async function restoreMedication(id: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('You must be signed in.');

  const { data, error } = await supabase
    .from('awn_medications')
    .update({ status: 'active' })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'archived')
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Archived medication not found or access denied.');
}

export async function deleteMedication(id: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('You must be signed in.');

  // Verify ownership before removing any dose history.
  const { data: medication, error: lookupError } = await supabase
    .from('awn_medications')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (!medication) throw new Error('Medication not found or access denied.');

  // Explicitly remove associated dose history first to avoid FK conflicts.
  const { error: dosesError } = await supabase
    .from('awn_medication_doses')
    .delete()
    .eq('medication_id', id)
    .eq('user_id', user.id);

  if (dosesError) throw dosesError;

  const { data: deleted, error: deleteError } = await supabase
    .from('awn_medications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();

  if (deleteError) throw deleteError;
  if (!deleted) throw new Error('Medication could not be deleted.');
}

// Persist each medication's reminder preference in Supabase.
export async function setMedicationReminderEnabled(
  id: string,
  enabled: boolean
): Promise<MedicationRecord> {
  const userId = await getAuthenticatedUserId();
  const { data, error } = await supabase
    .from('awn_medications')
    .update({ reminder_enabled: enabled })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data as MedicationRecord;
}
