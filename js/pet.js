// PPAP-22 C02: basic profile of the selected pet.
// PPAP-23 C03: temperament and adoption requirements.
// PPAP-27 D01: "Apply to Adopt" button for Available pets only.
// PPAP-19 A03: name, area and description of the pet's shelter (shelters table, via shelter_id).
import { supabase } from './supabase.js';

const statusEl = document.getElementById('status');
const petId = new URLSearchParams(location.search).get('id');

if (!petId) {
  statusEl.textContent = 'No pet selected. Please choose a pet from the listing.';
} else {
  const { data: pet, error } = await supabase
    .from('pets')
    .select('pet_id, name, animal_type, breed, age, photo, description, temperament, adoption_requirements, availability, shelter_id, shelters(shelter_name, area, description)')
    .eq('pet_id', petId)
    .maybeSingle();

  if (error) {
    console.error(error);
    statusEl.textContent = 'Sorry, this pet could not be loaded. Please try again later.';
  } else if (!pet) {
    statusEl.textContent = 'Pet not found. Please choose a pet from the listing.';
  } else {
    document.title = `PawConnect – ${pet.name}`;
    const photo = document.getElementById('pet-photo');
    photo.src = pet.photo || '';
    photo.alt = `Photo of ${pet.name}`;
    document.getElementById('pet-name').textContent = pet.name;
    document.getElementById('pet-age').textContent = `${pet.age} ${pet.age === 1 ? 'year' : 'years'}`;
    document.getElementById('pet-type').textContent = pet.animal_type;
    document.getElementById('pet-breed').textContent = pet.breed || 'Unknown';
    document.getElementById('pet-description').textContent = pet.description || '';
    document.getElementById('pet-temperament').textContent = pet.temperament?.trim() || 'Not provided';
    document.getElementById('pet-requirements').textContent = pet.adoption_requirements?.trim() || 'Not provided';

    const shelter = pet.shelters;
    document.getElementById('shelter-name').textContent = shelter?.shelter_name ?? 'Not provided';
    document.getElementById('shelter-area').textContent = shelter?.area?.trim() || 'Not provided';
    document.getElementById('shelter-description').textContent = shelter?.description?.trim() || '';

    if (pet.availability === 'Available') {
      const apply = document.getElementById('apply-button');
      apply.href = `apply.html?pet=${encodeURIComponent(pet.pet_id)}`;
      apply.hidden = false;
    }

    statusEl.hidden = true;
    document.getElementById('pet').hidden = false;
  }
}
