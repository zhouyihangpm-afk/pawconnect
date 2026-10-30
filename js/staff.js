// PPAP-13 E03: staff sign in with the shared demo account, then see all submitted
// applications (newest first) with reference, pet name and current status.
// Applications are only readable by signed-in staff (RLS), so nothing loads before sign-in.
import { supabase } from './supabase.js';

const statusEl = document.getElementById('status');
const signinForm = document.getElementById('signin-form');
const signinError = document.getElementById('signin-error');
const signinButton = document.getElementById('signin-button');
const staffArea = document.getElementById('staff-area');
const rowsEl = document.getElementById('application-rows');

function showSignIn(message = 'Please sign in with the shelter staff demo account to view applications.') {
  staffArea.hidden = true;
  rowsEl.replaceChildren();
  statusEl.textContent = message;
  statusEl.hidden = false;
  signinForm.hidden = false;
}

async function showApplications(user) {
  signinForm.hidden = true;
  document.getElementById('staff-email').textContent = user.email;
  statusEl.textContent = 'Loading applications…';
  statusEl.hidden = false;

  const { data: applications, error } = await supabase
    .from('applications')
    .select('application_id, application_status, submitted_at, pets(name)')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error(error);
    statusEl.textContent = 'Sorry, applications could not be loaded. Please sign in again.';
    return;
  }

  rowsEl.replaceChildren();
  for (const app of applications) {
    const row = document.createElement('tr');

    const refCell = document.createElement('td');
    const link = document.createElement('a');
    link.href = `staff-app.html?id=${encodeURIComponent(app.application_id)}`;
    link.textContent = app.application_id;
    refCell.append(link);

    const petCell = document.createElement('td');
    petCell.textContent = app.pets?.name ?? '';

    const statusCell = document.createElement('td');
    statusCell.textContent = app.application_status;

    const dateCell = document.createElement('td');
    dateCell.textContent = new Date(app.submitted_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });

    row.append(refCell, petCell, statusCell, dateCell);
    rowsEl.append(row);
  }

  statusEl.textContent = applications.length === 0
    ? 'No applications have been submitted yet.'
    : `${applications.length} applications, newest first.`;
  staffArea.hidden = false;
}

signinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  signinError.hidden = true;
  signinButton.disabled = true;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: signinForm.elements.email.value.trim(),
    password: signinForm.elements.password.value,
  });

  signinButton.disabled = false;
  if (error) {
    console.warn('Sign-in failed:', error.message);
    signinError.textContent = 'Sign-in failed. Please check the staff email and password.';
    signinError.hidden = false;
    return;
  }
  signinForm.reset();
  showApplications(data.user);
});

document.getElementById('signout-button').addEventListener('click', async () => {
  await supabase.auth.signOut();
  showSignIn('You have signed out.');
});

const { data: { session } } = await supabase.auth.getSession();
if (session) {
  showApplications(session.user);
} else {
  showSignIn();
}
