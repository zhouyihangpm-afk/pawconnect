// PPAP-30 D04: confirm a saved application by its reference number.
// Reads the saved record back through rpc('track_application') (no personal details),
// so the page still works after reopening or refreshing.
import { supabase } from './supabase.js';

const statusEl = document.getElementById('status');
const applicationId = new URLSearchParams(location.search).get('id');

if (!applicationId) {
  statusEl.textContent = 'No application reference was given.';
} else {
  const { data, error } = await supabase.rpc('track_application', { p_application_id: applicationId });
  const application = data && data[0];

  if (error) {
    console.error(error);
    statusEl.textContent = 'Sorry, your application could not be loaded. Please try again later.';
  } else if (!application) {
    statusEl.textContent = 'Application not found.';
  } else {
    document.getElementById('pet-name').textContent = application.pet_name;
    document.getElementById('application-id').textContent = application.application_id;
    document.getElementById('application-status').textContent = application.application_status;
    statusEl.hidden = true;
    document.getElementById('confirmation').hidden = false;
  }
}
