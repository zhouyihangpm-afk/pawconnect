// PPAP-27 D01 / PPAP-28 D02: application form that identifies the selected pet.
// PPAP-30 D04: submit through rpc('submit_application'), then go to the confirmation page.
// Validation and privacy notice are later stories (D03, A04).
import { supabase } from './supabase.js';

const statusEl = document.getElementById('status');
const petId = new URLSearchParams(location.search).get('pet');

const form = document.getElementById('application-form');
const submitButton = document.getElementById('submit-button');
const errorEl = document.getElementById('submit-error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.hidden = true;
  submitButton.disabled = true;

  const { data: applicationId, error } = await supabase.rpc('submit_application', {
    p_pet_id: petId,
    p_name: form.elements.name.value,
    p_contact: form.elements.contact.value,
    p_reason: form.elements.reason.value,
  });

  if (error || !applicationId) {
    console.warn('Application not submitted:', error);
    errorEl.textContent = 'Sorry, your application could not be submitted. Please check your details and try again.';
    errorEl.hidden = false;
    submitButton.disabled = false;
    return;
  }

  location.href = `confirm.html?id=${encodeURIComponent(applicationId)}`;
});

if (!petId) {
  statusEl.textContent = 'No pet selected. Please choose a pet from the listing.';
} else {
  const { data: pet, error } = await supabase
    .from('pets')
    .select('pet_id, name, animal_type, breed, availability')
    .eq('pet_id', petId)
    .maybeSingle();

  if (error) {
    console.error(error);
    statusEl.textContent = 'Sorry, this pet could not be loaded. Please try again later.';
  } else if (!pet) {
    statusEl.textContent = 'Pet not found. Please choose a pet from the listing.';
  } else if (pet.availability !== 'Available') {
    statusEl.textContent = `${pet.name} is not currently available for adoption.`;
  } else {
    document.getElementById('pet-name').textContent = pet.name;
    document.getElementById('pet-summary').textContent =
      pet.breed ? `${pet.animal_type}, ${pet.breed}` : pet.animal_type;
    document.getElementById('pet-id').textContent = pet.pet_id;
    document.getElementById('pet-link').href = `pet.html?id=${encodeURIComponent(pet.pet_id)}`;
    statusEl.hidden = true;
    document.getElementById('application').hidden = false;
  }
}
