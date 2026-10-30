// PPAP-21 C01: list Available pets (name + photo), each linking to its profile.
// PPAP-24 C04: filter the Available list by animal type (All, Dog, Cat, Rabbit, Other).
import { supabase } from './supabase.js';

const statusEl = document.getElementById('status');
const listEl = document.getElementById('pet-list');
const typeFilter = document.getElementById('type-filter');

async function loadPets() {
  const type = typeFilter.value;
  statusEl.textContent = 'Loading pets…';
  listEl.replaceChildren();

  let query = supabase
    .from('pets')
    .select('pet_id, name, photo')
    .eq('availability', 'Available');
  if (type) query = query.eq('animal_type', type);

  const { data: pets, error } = await query.order('pet_id');

  // Ignore a response if the filter changed while it was loading.
  if (type !== typeFilter.value) return;

  if (error) {
    console.error(error);
    statusEl.textContent = 'Sorry, pets could not be loaded. Please try again later.';
  } else if (pets.length === 0) {
    statusEl.textContent = type ? 'No matching pets' : 'No pets are available right now.';
  } else {
    statusEl.textContent = type
      ? `${pets.length} available ${pets.length === 1 ? 'pet' : 'pets'} of type ${type}.`
      : `${pets.length} pets available for adoption.`;
    for (const pet of pets) {
      const card = document.createElement('a');
      card.className = 'pet-card';
      card.href = `pet.html?id=${encodeURIComponent(pet.pet_id)}`;

      const img = document.createElement('img');
      img.src = pet.photo || '';
      img.alt = `Photo of ${pet.name}`;

      const name = document.createElement('h2');
      name.textContent = pet.name;

      card.append(img, name);
      listEl.append(card);
    }
  }
}

typeFilter.addEventListener('change', loadPets);
document.getElementById('filter-form').addEventListener('submit', (e) => e.preventDefault());
loadPets();
