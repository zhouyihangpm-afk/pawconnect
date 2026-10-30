// PPAP-14 E04: staff view one application's full details and its associated pet.
// PPAP-15 E05: staff change the application status; the page then reloads it from the database.
// Requires the staff sign-in from staff.html (applications are staff-only under RLS).
import { supabase } from './supabase.js';

const statusEl = document.getElementById('status');
const applicationId = new URLSearchParams(location.search).get('id');
const statusForm = document.getElementById('status-form');
const saveButton = document.getElementById('save-button');
const saveMessage = document.getElementById('save-message');
let currentId = null;

function showSaveMessage(text, isError) {
  saveMessage.textContent = text;
  saveMessage.className = isError ? 'message error' : 'message success';
  saveMessage.hidden = false;
}

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

  currentId = app.application_id;
  statusForm.elements.status.value = app.application_status;
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
  return app;
}

statusForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  saveMessage.hidden = true;
  saveButton.disabled = true;
  const newStatus = statusForm.elements.status.value;

  // .select() returns the updated rows; zero rows means RLS blocked the update (e.g. session expired).
  const { data: updated, error } = await supabase
    .from('applications')
    .update({ application_status: newStatus })
    .eq('application_id', currentId)
    .select('application_id');

  if (error || !updated || updated.length === 0) {
    if (error) console.warn('Status not saved:', error.message);
    saveButton.disabled = false;
    showSaveMessage('The status could not be saved. Your staff session may have expired – please sign in again on the staff page, then retry.', true);
    return;
  }

  // Reload from the database so the page shows the saved value, not the form value.
  const app = await loadApplication();
  saveButton.disabled = false;
  if (app) {
    showSaveMessage(`Status saved. ${app.application_id} is now "${app.application_status}".`, false);
  }
});

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  showMessage('Staff sign-in is required. Please <a href="staff.html">sign in on the staff page</a> first.');
} else if (!applicationId) {
  showMessage('No application reference was given. <a href="staff.html">Back to the application list</a>.');
} else {
  loadApplication();
}
