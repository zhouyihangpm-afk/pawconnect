// PPAP-27 D01 / PPAP-28 D02: application form that identifies the selected pet.
// Validation, privacy notice and submitting are later stories (D03, A04, D04).
import { supabase } from './supabase.js';

const statusEl = document.getElementById('status');
const petId = new URLSearchParams(location.search).get('pet');

// Nothing is saved yet, so stop the browser from submitting the form (e.g. on Enter).
document.getElementById('application-form').addEventListener('submit', (e) => e.preventDefault());

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
