// PPAP-14 E04: staff view one application's full details and its associated pet.
// Requires the staff sign-in from staff.html (applications are staff-only under RLS).
import { supabase } from './supabase.js';

const statusEl = document.getElementById('status');
const applicationId = new URLSearchParams(location.search).get('id');

function showMessage(html) {
  document.getElementById('application').hidden = true;
  statusEl.innerHTML = html;
  statusEl.className = 'message';
  statusEl.hidden = false;
}

async function loadApplication() {
  const { data: app, error } = await supabase
    .from('applications')
    .select('application_id, applicant_demo_name, demo_contact, reason, application_status, submitted_at, pet_id, pets(pet_id, name)')
    .eq('application_id', applicationId.trim().toUpperCase())
    .maybeSingle();

  if (error) {
    console.error(error);
    showMessage('Sorry, this application could not be loaded. Please <a href="staff.html">sign in again</a>.');
    return;
  }
  if (!app) {
    showMessage('No application was found with this reference. <a href="staff.html">Back to the application list</a>.');
    return;
  }

  document.title = `PawConnect – ${app.application_id}`;
  document.getElementById('app-id').textContent = app.application_id;
  document.getElementById('app-ref').textContent = app.application_id;
  document.getElementById('app-status').textContent = app.application_status;
  document.getElementById('app-submitted').textContent =
    new Date(app.submitted_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });
  document.getElementById('app-name').textContent = app.applicant_demo_name;
  document.getElementById('app-contact').textContent = app.demo_contact;
  document.getElementById('app-reason').textContent = app.reason;
  document.getElementById('pet-name').textContent = app.pets?.name ?? '';
  document.getElementById('pet-id').textContent = app.pets?.pet_id ?? app.pet_id;

  statusEl.hidden = true;
  document.getElementById('application').hidden = false;
}

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  showMessage('Staff sign-in is required. Please <a href="staff.html">sign in on the staff page</a> first.');
} else if (!applicationId) {
  showMessage('No application reference was given. <a href="staff.html">Back to the application list</a>.');
} else {
  loadApplication();
}
