// PPAP-6 B01: find a submitted application by its reference through rpc('track_application').
// The function returns no personal details, only the matching application and its pet.
import { supabase } from './supabase.js';

const form = document.getElementById('track-form');
const searchButton = document.getElementById('search-button');
const messageEl = document.getElementById('search-message');
const resultEl = document.getElementById('result');

function showMessage(text) {
  messageEl.textContent = text;
  messageEl.hidden = false;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  messageEl.hidden = true;
  const reference = form.elements.reference.value.trim();
  if (!reference) return;

  searchButton.disabled = true;
  const { data, error } = await supabase.rpc('track_application', { p_application_id: reference });
  searchButton.disabled = false;
  const application = data && data[0];

  if (error) {
    console.error(error);
    showMessage('Sorry, the search could not be completed. Please try again later.');
    return;
  }
  if (!application) return;

  document.getElementById('result-ref').textContent = application.application_id;
  document.getElementById('result-ref-value').textContent = application.application_id;
  document.getElementById('result-pet').textContent = `${application.pet_name} (${application.pet_id})`;
  document.getElementById('result-submitted').textContent =
    new Date(application.submitted_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });
  resultEl.hidden = false;
});
